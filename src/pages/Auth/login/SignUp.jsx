import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi";
import profileApi from "../../../api/profileApi";
import { GoogleLogin } from "@react-oauth/google";

// Helper function để convert backend role sang frontend role
const mapRole = (backendRole) => {
  if (backendRole === "ROLE_SELLER") {
    return "seller";
  }
  return "buyer"; // Default
};

export default function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showAgreeError, setShowAgreeError] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [validationTimeout, setValidationTimeout] = useState(null);
  const [focusedFields, setFocusedFields] = useState({});

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  // ===== VALIDATION =====
  const validateField = (name, value, isFocused = false) => {
    let message = "";

    // Chỉ validate nếu field đã được focus hoặc có giá trị
    if (name === "username") {
      if (!value.trim()) {
        if (isFocused) {
          message = "Tên đăng nhập là bắt buộc.";
        }
      } else if (!/^[a-zA-Z]{8,}$/.test(value)) {
        if (value.length < 8) {
          message = "Tên đăng nhập phải có ít nhất 8 ký tự.";
        } else if (!/^[a-zA-Z]+$/.test(value)) {
          message = "Tên đăng nhập chỉ được chứa chữ cái (a-z, A-Z).";
        } else {
          message = "Tên đăng nhập không hợp lệ.";
        }
      }
    }

    if (name === "password") {
      if (!value.trim()) {
        if (isFocused) {
          message = "Mật khẩu là bắt buộc.";
        }
      } else if (
        !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,}$/.test(value)
      ) {
        if (value.length < 8) {
          message = "Mật khẩu phải có ít nhất 8 ký tự.";
        } else if (/\s/.test(value)) {
          message = "Mật khẩu không được chứa khoảng trắng.";
        } else if (!/(?=.*[A-Za-z])/.test(value)) {
          message = "Mật khẩu phải chứa ít nhất một chữ cái.";
        } else if (!/(?=.*\d)/.test(value)) {
          message = "Mật khẩu phải chứa ít nhất một số.";
        } else if (!/(?=.*[^A-Za-z\d\s])/.test(value)) {
          message = "Mật khẩu phải chứa ít nhất một ký tự đặc biệt.";
        }
      }
    }

    if (name === "email") {
      if (!value.trim()) {
        if (isFocused) {
          message = "Email là bắt buộc.";
        }
      } else if (
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(value)
      ) {
        if (!value.includes("@")) {
          message = "Email phải chứa ký tự @.";
        } else if (!value.includes(".")) {
          message = "Email phải chứa dấu chấm.";
        } else if (value.split("@").length !== 2) {
          message = "Email chỉ được có một ký tự @.";
        } else if (value.includes("..")) {
          message = "Email không được chứa hai dấu chấm liên tiếp.";
        } else if (value.startsWith(".") || value.endsWith(".")) {
          message = "Email không được bắt đầu hoặc kết thúc bằng dấu chấm.";
        } else {
          message = "Định dạng email không hợp lệ.";
        }
      }
    }

    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear backend error when user starts typing
    setBackendError("");

    // Clear existing error for this field when user starts typing
    setErrors((prev) => ({ ...prev, [name]: "" }));

    // Immediate validation for certain cases
    if (name === "username" && value.length > 0) {
      // Validate username immediately if it has invalid characters
      if (!/^[a-zA-Z]*$/.test(value)) {
        if (/\d/.test(value)) {
          setErrors((prev) => ({
            ...prev,
            [name]: "Tên đăng nhập chỉ được chứa chữ cái (a-z, A-Z).",
          }));
        } else if (/[^a-zA-Z]/.test(value)) {
          setErrors((prev) => ({
            ...prev,
            [name]: "Tên đăng nhập chỉ được chứa chữ cái (a-z, A-Z).",
          }));
        }
        return;
      }
    }

    if (name === "password" && value.length > 0) {
      // Validate password immediately if it has spaces
      if (/\s/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Mật khẩu không được chứa khoảng trắng.",
        }));
        return;
      }
    }

    // Real-time validation with faster debounce for other cases
    clearTimeout(validationTimeout);
    const timeout = setTimeout(() => {
      validateField(name, value, focusedFields[name]);
    }, 100); // Giảm thời gian debounce để hiển thị nhanh hơn
    setValidationTimeout(timeout);
  };

  const handleFocus = (e) => {
    const { name } = e.target;
    setFocusedFields((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFocusedFields((prev) => ({ ...prev, [name]: true }));

    // Validate on blur
    validateField(name, value, true);
  };

  const validateAll = () => {
    const newErrors = {};
    let hasErrors = false;

    // Validate each field and collect errors
    Object.entries(formData).forEach(([key, value]) => {
      let message = "";

      if (key === "username") {
        if (!value.trim()) {
          message = "Tên đăng nhập là bắt buộc.";
        } else if (!/^[a-zA-Z]{8,}$/.test(value)) {
          message =
            "Tên đăng nhập phải có ít nhất 8 chữ cái, không có số, ký tự đặc biệt hoặc khoảng trắng.";
        }
      }

      if (key === "password") {
        if (!value.trim()) {
          message = "Mật khẩu là bắt buộc.";
        } else if (
          !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,}$/.test(value)
        ) {
          message =
            "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái, số và ký tự đặc biệt, không có khoảng trắng.";
        }
      }

      if (key === "email") {
        if (!value.trim()) {
          message = "Email là bắt buộc.";
        } else if (
          !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(value)
        ) {
          message = "Email không đúng định dạng. Ví dụ: user@example.com";
        }
      }

      if (message) {
        newErrors[key] = message;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  // ===== ERROR HANDLING =====
  const parseBackendError = (error) => {
    console.log("=== PARSING BACKEND ERROR ===");
    console.log("Full error object:", error);
    console.log("Error type:", typeof error);
    console.log("Error keys:", error ? Object.keys(error) : "No error object");

    if (!error) {
      console.log("No error object provided");
      return "Đăng ký thất bại. Vui lòng thử lại.";
    }

    // Helper function to check if a string contains email/username errors
    const checkForSpecificErrors = (message) => {
      if (!message) return null;

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("email already exits") ||
        lowerMessage.includes("email already exists")
      ) {
        return "Email này đã được sử dụng. Vui lòng sử dụng email khác.";
      }
      if (
        lowerMessage.includes("username already exits") ||
        lowerMessage.includes("username already exists")
      ) {
        return "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.";
      }
      if (lowerMessage.includes("invalid email format")) {
        return "Email không đúng định dạng. Ví dụ: user@example.com";
      }
      if (lowerMessage.includes("password")) {
        return "Mật khẩu không đáp ứng yêu cầu bảo mật.";
      }
      if (lowerMessage.includes("username")) {
        return "Tên đăng nhập không đáp ứng yêu cầu.";
      }
      if (
        lowerMessage.includes("database") ||
        lowerMessage.includes("connection")
      ) {
        return "Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau.";
      }
      if (
        lowerMessage.includes("email service") ||
        lowerMessage.includes("mail")
      ) {
        return "Lỗi dịch vụ email. Không thể gửi mã xác thực. Vui lòng thử lại sau.";
      }
      if (lowerMessage.includes("illegalargumentexception")) {
        return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
      }
      if (lowerMessage.includes("nullpointerexception")) {
        return "Lỗi xử lý dữ liệu. Vui lòng thử lại sau.";
      }
      if (
        lowerMessage.includes("sqlexception") ||
        lowerMessage.includes("sql")
      ) {
        return "Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.";
      }
      if (lowerMessage.includes("timeout")) {
        return "Kết nối quá thời gian. Vui lòng thử lại sau.";
      }
      if (
        lowerMessage.includes("validation") ||
        lowerMessage.includes("constraint")
      ) {
        return "Dữ liệu không đáp ứng yêu cầu hệ thống. Vui lòng kiểm tra lại thông tin.";
      }

      return null;
    };

    // Try multiple possible error structures
    const possibleErrorMessages = [
      error.error?.message,
      error.message,
      error.data?.error?.message,
      error.data?.message,
      error.response?.data?.error?.message,
      error.response?.data?.message,
    ];

    console.log("Possible error messages:", possibleErrorMessages);

    // Check each possible error message
    for (let i = 0; i < possibleErrorMessages.length; i++) {
      const errorMessage = possibleErrorMessages[i];
      if (errorMessage) {
        console.log(`Checking error message ${i + 1}:`, errorMessage);
        const specificError = checkForSpecificErrors(errorMessage);
        if (specificError) {
          console.log(
            `Found specific error in message ${i + 1}:`,
            specificError
          );
          return specificError;
        }
      }
    }

    // If no specific error found, return the first available message or default
    const firstMessage = possibleErrorMessages.find(
      (msg) => msg && msg !== "Internal Server Error"
    );
    if (firstMessage) {
      console.log(
        "No specific error found, returning first available message:",
        firstMessage
      );
      return firstMessage;
    }

    console.log("No error message found, returning default");
    return "Đăng ký thất bại. Vui lòng thử lại.";
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    const allValid = validateAll();
    if (!allValid) return;
    if (!isAgreed) {
      setShowAgreeError(true);
      return;
    }

    try {
      setLoadingMessage(
        "Vui lòng kiểm tra email. Đang chuyển đến trang OTP..."
      );
      await authApi.signup(formData);
      setTimeout(() => {
        setIsOtpStep(true);
        setBackendError("");
        setLoadingMessage("");
      }, 2500);
    } catch (error) {
      setLoadingMessage("");
      console.error("Lỗi đăng ký:", error.response?.data || error.message);
      console.log("Full error object:", error);
      console.log("Error response:", error.response);
      console.log("Error response data:", error.response?.data);

      // Direct check for the specific error structure you mentioned
      const errorData = error.response?.data;
      let backendMsg = "Đăng ký thất bại. Vui lòng thử lại.";

      // Direct check for "Email already exits" in any possible location
      if (errorData) {
        const errorString = JSON.stringify(errorData);
        console.log("Error data as string:", errorString);

        if (errorString.includes("Email already exits")) {
          console.log("Found 'Email already exits' in error data");
          backendMsg =
            "Email này đã được sử dụng. Vui lòng sử dụng email khác.";
        } else if (errorString.includes("Username already exits")) {
          console.log("Found 'Username already exits' in error data");
          backendMsg =
            "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.";
        } else if (errorString.includes("IllegalArgumentException")) {
          console.log("Found 'IllegalArgumentException' in error data");
          backendMsg = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
        } else {
          // Use the helper function as fallback
          backendMsg = parseBackendError(errorData);
        }
      } else if (error.message) {
        // Fallback nếu không có response data
        if (error.message.includes("Network Error")) {
          backendMsg =
            "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.";
        } else if (error.message.includes("timeout")) {
          backendMsg =
            "Kết nối quá thời gian. Vui lòng kiểm tra kết nối mạng và thử lại.";
        } else {
          backendMsg = error.message;
        }
      }

      console.log("Final backend message:", backendMsg);
      setBackendError(backendMsg);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    // Validation cho OTP
    if (!otp.trim()) {
      setBackendError("Vui lòng nhập mã OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setBackendError("Mã OTP phải là 6 chữ số.");
      return;
    }

    try {
      await authApi.verifyOtp({
        email: formData.email,
        otp: otp,
      });
      navigate("/signin");
    } catch (error) {
      console.error("Lỗi xác thực OTP:", error.response?.data || error.message);

      let errorMsg = "Mã OTP không hợp lệ hoặc đã hết hạn.";

      if (error.response?.data) {
        const errorData = error.response.data;
        const status = error.response.status;

        switch (status) {
          case 400:
            if (
              errorData.message?.includes("invalid") ||
              errorData.message?.includes("incorrect")
            ) {
              errorMsg = "Mã OTP không chính xác. Vui lòng kiểm tra lại.";
            } else if (errorData.message?.includes("expired")) {
              errorMsg = "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.";
            } else {
              errorMsg = errorData.message || "Mã OTP không hợp lệ.";
            }
            break;
          case 404:
            errorMsg = "Không tìm thấy phiên xác thực. Vui lòng đăng ký lại.";
            break;
          case 429:
            errorMsg = "Quá nhiều lần thử sai. Vui lòng đợi và thử lại sau.";
            break;
          case 500:
            errorMsg = "Lỗi hệ thống. Vui lòng thử lại sau.";
            break;
          default:
            errorMsg = errorData.message || "Xác thực OTP thất bại.";
        }
      } else if (error.message) {
        if (error.message.includes("Network Error")) {
          errorMsg =
            "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
        } else if (error.message.includes("timeout")) {
          errorMsg = "Kết nối quá thời gian. Vui lòng thử lại.";
        }
      }

      setBackendError(errorMsg);
    }
  };

  // ===== GOOGLE SIGNUP =====
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) {
        setBackendError("Không nhận được token từ Google. Vui lòng thử lại.");
        return;
      }

      const response = await authApi.googleSignin(idToken);
      console.log("Google signin/signup response:", response.data);
      const loginData = response?.data?.data;

      // Nếu đăng ký/đăng nhập thành công → Lưu token và redirect
      if (loginData?.accessToken && loginData?.refreshToken) {
        // CLEAR ADMIN DATA TRƯỚC (vì chỉ cho 1 loại login tại 1 thời điểm)
        localStorage.removeItem("adminProfile");
        console.log("[Google Signup] Cleared admin-specific data");

        // Lưu token và thông tin cơ bản
        localStorage.setItem("accessToken", loginData.accessToken);
        localStorage.setItem("refreshToken", loginData.refreshToken);
        localStorage.setItem("token", loginData.accessToken);
        localStorage.setItem("username", loginData.username);
        localStorage.setItem("userEmail", loginData.email);

        // === LƯU buyerId VÀ sellerId TỪ GOOGLE SIGNUP RESPONSE ===
        if (loginData.buyerId || loginData.buyer?.id) {
          const buyerId = loginData.buyerId || loginData.buyer?.id;
          localStorage.setItem("buyerId", buyerId);
          console.log("[Google Signup] Saved buyerId:", buyerId);
        }

        if (loginData.sellerId || loginData.seller?.id) {
          const sellerId = loginData.sellerId || loginData.seller?.id;
          localStorage.setItem("sellerId", sellerId);
          console.log("[Google Signup] Saved sellerId:", sellerId);
        }

        // === LƯU userRole ===
        const userRole = loginData.role ? mapRole(loginData.role) : "buyer";
        localStorage.setItem("userRole", userRole);

        // Dọn dẹp key cũ
        localStorage.removeItem("authType");

        console.log(
          "[Google Signup] Signup/Login successful. userRole:",
          userRole
        );

        // Gọi API getProfile để lấy avatar
        try {
          const profileResponse = await profileApi.getProfile();
          const profileData = profileResponse?.data?.data;

          if (profileData?.avatarUrl) {
            localStorage.setItem("buyerAvatar", profileData.avatarUrl);
            console.log("Avatar saved:", profileData.avatarUrl);
          } else {
            localStorage.removeItem("buyerAvatar");
          }
        } catch (profileError) {
          console.error(
            "Lỗi khi lấy profile sau Google signup:",
            profileError.message
          );
          localStorage.removeItem("buyerAvatar");
        }

        // Thông báo và chuyển hướng
        window.dispatchEvent(new CustomEvent("authStatusChanged"));
        navigate("/");
      } else {
        // Nếu chỉ signup mà chưa login → redirect về signin
        navigate("/signin");
      }
    } catch (error) {
      console.error("Google signup error:", error);
      const status = error.response?.status;
      const message =
        status === 401
          ? "Token Google không hợp lệ hoặc đã hết hạn."
          : error.response?.data?.message ||
            "Đăng nhập/Đăng ký Google thất bại. Vui lòng thử lại.";
      setBackendError(message);
      // Clear authType nếu signup/login thất bại
      localStorage.removeItem("authType");
    }
  };

  const handleGoogleError = () => {
    setBackendError("Đăng nhập Google thất bại. Vui lòng thử lại.");
  };

  // ===== UI =====
  return (
    <div className="auth-form-container">
      <form
        className="sign-up-form"
        onSubmit={isOtpStep ? handleVerifyOtp : handleSubmit}
        noValidate
      >
        {/* Header */}
        <div className="form-header">
          <div className="logo-container">
            <div className="greentrade-text">
              <span className="green-text">Green</span>
              <span className="trade-text">Trade</span>
            </div>
            <div className="logo-glow"></div>
          </div>
          <h2 className="title">
            {isOtpStep ? (
              <>
                <span className="title-main">Xác thực OTP</span>
                <span className="title-sub">Nhập mã xác thực từ email</span>
              </>
            ) : (
              "Đăng ký"
            )}
          </h2>
        </div>

        <div className="form-body">
          {!isOtpStep ? (
            <>
              {/* Username */}
              <div className="input-group">
                <div
                  className={`input-field ${errors.username ? "error" : ""}`}
                >
                  <div className="input-icon">
                    <i className="fas fa-user"></i>
                  </div>
                  <input
                    type="text"
                    name="username"
                    placeholder="Tên đăng nhập"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <div className="input-border"></div>
                </div>
                {errors.username && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.username}</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="input-group">
                <div
                  className={`input-field ${errors.password ? "error" : ""}`}
                >
                  <div className="input-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Mật khẩu"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <div className="input-border"></div>
                </div>
                {errors.password && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="input-group">
                <div className={`input-field ${errors.email ? "error" : ""}`}>
                  <div className="input-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <div className="input-border"></div>
                </div>
                {errors.email && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Backend Error */}
              {backendError && (
                <div className="backend-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  <div className="error-content">
                    <span className="error-title">Lỗi đăng ký</span>
                    <span className="error-message">{backendError}</span>
                  </div>
                </div>
              )}

              {/* Điều khoản */}
              <div className="agree-wrapper">
                <label className="agree">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => {
                      setIsAgreed(e.target.checked);
                      setShowAgreeError(false);
                    }}
                  />
                  <span className="checkmark"></span>
                  <span className="label-text">
                    Tôi đồng ý với <a href="#">Điều khoản & Chính sách</a>
                  </span>
                </label>
                {showAgreeError && (
                  <div className="agree-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Vui lòng đồng ý với điều khoản để tiếp tục.</span>
                  </div>
                )}
              </div>

              <button type="submit" className="btn solid">
                Đăng ký
              </button>

              <div className="divider">
                <span className="divider-text">hoặc đăng ký bằng</span>
              </div>

              {/* Google Login */}
              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signup_with"
                />
              </div>
            </>
          ) : (
            <>
              {/* OTP UI */}
              <div className="otp-container">
                <div className="otp-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <p className="otp-description">
                  Chúng tôi đã gửi mã xác thực đến email{" "}
                  <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="input-group">
                <div className="input-field">
                  <div className="input-icon">
                    <i className="fas fa-key"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength="6"
                  />
                  <div className="input-border"></div>
                </div>
              </div>

              {backendError && (
                <div className="backend-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  <div className="error-content">
                    <span className="error-title">Lỗi xác thực</span>
                    <span className="error-message">{backendError}</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn solid">
                Xác thực OTP
              </button>

              <div className="resend-otp">
                <p>
                  Không nhận được mã? <a href="#">Gửi lại</a>
                </p>
              </div>
            </>
          )}
        </div>

        {!isOtpStep && (
          <div className="form-footer">
            <p className="switch-text">
              Đã có tài khoản?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/signin");
                }}
                className="switch-link"
              >
                Đăng nhập ngay
              </a>
            </p>
          </div>
        )}

        {loadingMessage && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Đang gửi email...</h3>
              <p>{loadingMessage}</p>
              <div className="spinner"></div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
