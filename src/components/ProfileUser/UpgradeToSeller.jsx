"use client";

import { useState, useEffect } from "react";
import "./UpgradeToSeller.css"; // CSS Chính
import PolicyModal from "./PolicyModal"; // Component modal chính sách
import profileApi from "../../api/profileApi"; // File API của bạn
import Modal from "../Modal/Modal";
// 1. Import component con (đã rút gọn, nhận data qua props)
import SellerApplicationPending from "./SellerApplicationPending";
import SellerApplicationAccepted from "./SellerApplicationAccepted";

export default function UpgradeToSeller({ onGoToProfile, onKycAccepted }) {
  // Prop để quay lại trang profile
  // === Form State ===
  const [formData, setFormData] = useState({
    storeName: "",
    taxNumber: "",
    frontOfIdentity: null, // File object
    backOfIdentity: null,
    businessLicense: null,
    selfie: null,
    storePolicy: null,
  });
  const [errors, setErrors] = useState({});
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    // Chỉ để hiển thị tên file
    frontOfIdentity: null,
    backOfIdentity: null,
    businessLicense: null,
    selfie: null,
    storePolicy: null,
  });
  const [isLoading, setIsLoading] = useState(false); // Loading submit cuối
  const [showLoadingMessage, setShowLoadingMessage] = useState(false); // Thông báo khi submit

  // === Flow Control State ===
  const [checkingStatus, setCheckingStatus] = useState(true); // Loading kiểm tra ban đầu
  const [isProfileComplete, setIsProfileComplete] = useState(null); // Kết quả kiểm tra profile buyer
  const [kycStatus, setKycStatus] = useState(null); // Trạng thái KYC: null, "NOT_SUBMITTED", "PENDING", "ACCEPTED"
  const [sellerData, setSellerData] = useState(null); // Dữ liệu gộp (buyer+seller) cho màn hình Pending/Accepted

  // === OCR State (Dữ liệu có thể chỉnh sửa) ===
  const [ocrData, setOcrData] = useState({
    name: "", // Sẽ điền vào "Full name"
    id: "", // Sẽ điền vào "Identity number"
    nationality: "", // Sẽ điền vào "Nationality"
    home: "", // Sẽ điền vào "Địa chỉ cá nhân"
  });
  const [isOcrLoading, setIsOcrLoading] = useState(false); // Loading khi gọi API OCR
  const [ocrError, setOcrError] = useState(null); // Lỗi từ API OCR

  // === State Preview Ảnh ===
  const [imagePreviews, setImagePreviews] = useState({
    frontOfIdentity: null,
    backOfIdentity: null,
    businessLicense: null,
    selfie: null,
    storePolicy: null,
  });

  // Regex validation
  const regex = {
    storeName: /^[A-Za-z0-9\s\u00C0-\u1EF9]{2,50}$/,
    taxNumber: /^[0-9]{10,13}$/,
  };


  // === 1. STATE KHÓA/MỞ INPUT ===
  const [canEditOcr, setCanEditOcr] = useState(false); // Mặc định KHÓA

  // === 2. HÀM CLICK VÀO Ô BỊ KHÓA ===
  // Khi người dùng click vào ô đang bị khóa, hiện thông báo nhắc tải ảnh
  const handleOcrInputClick = () => {
    if (!canEditOcr) {
      showModal(
        "Chưa có thông tin",
        "Vui lòng tải ảnh Mặt Trước CCCD lên để hệ thống tự động điền thông tin.",
        "info"
      );
    }
  };

  // cái này cho hiện modal thay cái alert
  // Thay vì showOcrErrorModal riêng lẻ, ta dùng 1 state chung cho mọi thông báo
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",   // "success" | "error" | "info"
    title: "",
    message: "",    // Có thể là string hoặc JSX
    onAfterClose: null // Callback chạy sau khi đóng modal (ví dụ: focus input)
  });

  const showModal = (title, message, type = "info", onAfterClose = null) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      onAfterClose
    });
  };

  const handleCloseModal = () => {
    // Nếu có hành động cần làm sau khi đóng (ví dụ focus input), thì thực hiện
    if (modalConfig.onAfterClose) {
      modalConfig.onAfterClose();
    }
    // Reset modal
    setModalConfig(prev => ({ ...prev, isOpen: false, onAfterClose: null }));
  };
  // === Flow Control State ===

  // ... các state khác ...

  // THÊM DÒNG NÀY:
  const [statusCheckError, setStatusCheckError] = useState(null); // Lỗi kiểm tra trạng thái ban đầu
  // === useEffect: Kiểm tra trạng thái ban đầu ===
  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      console.log(" UpgradeToSeller: Bắt đầu kiểm tra trạng thái...");
      setCheckingStatus(true);

      try {
        // === 1. Kiểm tra Buyer Profile ===
        const buyerResponse = await profileApi.getProfile();
        if (!isMounted) return;

        if (!buyerResponse.data?.success) {
          console.warn(
            " Lỗi khi lấy buyer profile:",
            buyerResponse.data?.message
          );
          throw new Error(
            buyerResponse.data?.message || "Không thể tải hồ sơ người mua."
          );
        }

        const buyerProfileData = buyerResponse.data.data;
        setSellerData(buyerProfileData);

        // Kiểm tra đầy đủ thông tin
        const { fullName, phoneNumber, email, dob, street, avatarUrl } =
          buyerProfileData || {};

        const isComplete =
          fullName?.trim() &&
          phoneNumber?.trim() &&
          email?.trim() &&
          dob &&
          street?.trim() &&
          avatarUrl?.trim();

        if (!isComplete) {
          console.log(" Hồ sơ buyer chưa hoàn chỉnh → yêu cầu cập nhật.");
          if (isMounted) {
            setIsProfileComplete(false);
            setKycStatus(null);
          }
          return;
        }

        if (isMounted) {
          setIsProfileComplete(true);
        }

        // === 2️ Kiểm tra Seller Profile / KYC ===
        try {
          const sellerResponse = await profileApi.getSellerstatus();
          if (!isMounted) return;

          const sellerData = sellerResponse.data?.data;
          const sellerStatus = sellerData?.status || "NOT_SUBMITTED";

          if (sellerResponse.data?.success && sellerData) {
            console.log(" Seller profile tìm thấy:", sellerStatus);
            setSellerData((prev) => ({ ...prev, ...sellerData }));
            setKycStatus(sellerStatus);

            // === AUTO-UPDATE ROLE NẾU ĐÃ ĐƯỢC APPROVE ===
            if (sellerStatus === "ACCEPTED") {
              const currentRole = localStorage.getItem("userRole");
              if (currentRole !== "seller") {
                console.log(
                  " Auto-updating role: buyer → seller (KYC Accepted)"
                );
                localStorage.setItem("userRole", "seller");
                window.dispatchEvent(
                  new CustomEvent("roleChanged", { detail: { role: "seller" } })
                );
              }
            }
          } else {
            console.log(" Seller chưa có profile → NOT_SUBMITTED.");
            setKycStatus("NOT_SUBMITTED");
          }
        } catch (sellerError) {
          const statusCode = sellerError.response?.status;
          const errMsg = sellerError.response?.data?.error;
          console.warn("Lỗi khi gọi getSellerstatus:", statusCode, errMsg);

          if (
            statusCode === 404 ||
            (statusCode === 500 && errMsg === "User not existsed.")
          ) {
            if (isMounted) setKycStatus("NOT_SUBMITTED");
          } else {
            console.error(" Lỗi bất thường khi kiểm tra seller:", sellerError);
            if (isMounted) setKycStatus("NOT_SUBMITTED");
          }
        }
        // } catch (error) {
        //   console.error(" Lỗi khi kiểm tra trạng thái hồ sơ:", error);
        //   if (isMounted) {
        //     setIsProfileComplete(false);
        //     setKycStatus(null);
        //   }
      } catch (error) {
        console.error(" Lỗi khi kiểm tra trạng thái hồ sơ:", error);
        if (isMounted) {
          // Giả định rằng nếu đã qua bước 1 (buyer profile) thì lỗi là do seller/server
          // Hoặc nếu lỗi ở bước 1, thông báo cho người dùng.
          setKycStatus(null);
          // Nếu lỗi nặng:
          setStatusCheckError("Lỗi hệ thống khi kiểm tra trạng thái. Vui lòng thử lại sau.");
        }
      } finally {
        if (isMounted) {
          setCheckingStatus(false);
          console.log(" Hoàn tất kiểm tra trạng thái UpgradeToSeller.");
        }
      }
    };

    checkStatus();

    // Cleanup để tránh memory leak
    return () => {
      isMounted = false;
    };
  }, []); // chỉ chạy 1 lần khi component mount

  // --- Form Handlers ---

  // Handler cho input text (Store Name, Tax Number)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Validation tức thì
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: "Trường này là bắt buộc." }));
    } else if (regex[name] && !regex[name].test(value)) {
      setErrors((prev) => ({
        ...prev,
        [name]:
          name === "storeName"
            ? "Tên cửa hàng: 2-50 ký tự, chữ/số."
            : "Mã số thuế: 10-13 chữ số.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // NEW: Handler cho các trường OCR có thể chỉnh sửa
  const handleOcrInputChange = (e) => {
    const { name, value } = e.target;
    setOcrData((prev) => ({ ...prev, [name]: value }));
    // Xóa lỗi ID number nếu người dùng bắt đầu nhập/chỉnh ID
    if (name === "id") {
      if (!value.trim()) {
        setErrors((prev) => ({ ...prev, identityNumber: "Số CCCD là bắt buộc." }));
      } else {
        setErrors((prev) => ({ ...prev, identityNumber: null }));
      }
    }
  };


  // Handler cho CCCD Mặt Trước (có OCR)
  // const handleFrontIdUpload = async (e) => {
  //   const file = e.target.files[0];
  //   const fieldName = "frontOfIdentity";

  //   // Reset trạng thái liên quan đến OCR/File cũ
  //   if (imagePreviews[fieldName]) URL.revokeObjectURL(imagePreviews[fieldName]);
  //   setImagePreviews((prev) => ({ ...prev, [fieldName]: null }));
  //   // NEW: Clear OCR data khi upload file mới
  //   setOcrData({ name: "", id: "", nationality: "", home: "" });
  //   setOcrError(null);
  //   setUploadedFiles((prev) => ({ ...prev, [fieldName]: null }));
  //   setFormData((prev) => ({ ...prev, [fieldName]: null })); // Xóa file cũ khỏi state submit

  //   if (!file) return; // Dừng nếu người dùng bấm cancel

  //   setFormData((prev) => ({ ...prev, [fieldName]: file })); // Lưu file mới vào state submit
  //   setUploadedFiles((prev) => ({ ...prev, [fieldName]: file.name }));
  //   const previewUrl = URL.createObjectURL(file);
  //   setImagePreviews((prev) => ({ ...prev, [fieldName]: previewUrl }));
  //   setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  //   setIsOcrLoading(true);

  //   try {
  //     const response = await profileApi.getIdentityInfoFromOCR(file);
  //     if (response.data?.success && response.data?.data) {
  //       const { name, id, nationality, home } = response.data.data;
  //       setOcrData({
  //         name: name || "",
  //         id: id || "",
  //         nationality: nationality || "",
  //         home: home || "",
  //       });
  //       setErrors((prev) => ({ ...prev, identityNumber: null })); // Xóa lỗi ID number nếu OCR thành công
  //     } else {
  //       throw new Error(
  //         response.data?.message || "Không thể đọc thông tin CCCD."
  //       );
  //     }
  //   } catch (error) {
  //     const responseData = error.response?.data;
  //     const rawErrorString = responseData?.error || "";

  //     // === LOGIC MỚI: BẮT LỖI OCR VÀ HIỆN MODAL ===
  //     if (
  //       rawErrorString.includes("Unable to find ID card") ||
  //       rawErrorString.includes("errorCode\":3")
  //     ) {
  //       // Nội dung Modal (Dùng thẻ HTML để trình bày cho đẹp)
  //       const errorContent = (
  //         <div>
  //           <p>Hệ thống không tìm thấy thẻ CCCD trong ảnh vừa tải lên.</p>
  //           <ul style={{ textAlign: 'left', marginTop: '10px', marginLeft: '20px', fontSize: '0.95rem', color: '#555' }}>
  //             <li style={{ marginBottom: '5px' }}>📌 Đảm bảo ảnh đủ sáng, không bị lóa.</li>
  //             <li style={{ marginBottom: '5px' }}>📌 Ảnh nằm trọn trong khung hình.</li>
  //             <li>📌 Nếu thử lại không được, vui lòng <b>nhập tay</b> thông tin bên dưới.</li>
  //           </ul>
  //         </div>
  //       );

  //       // Gọi Modal
  //       showModal(
  //         " Không thể nhận diện",     // Title
  //         errorContent,                // Message (JSX)
  //         "error",                     // Type (màu đỏ)
  //         () => document.getElementById("identityNumberOcr")?.focus() // Action: Focus vào ô nhập sau khi đóng
  //       );

  //       setOcrError(null); // Xóa dòng chữ đỏ nhỏ đi vì đã hiện Modal to rồi
  //     } else {
  //       // Các lỗi khác vẫn hiện text đỏ như cũ
  //       const errorMsg = rawErrorString || error.message || "Lỗi đọc CCCD.";
  //       setOcrError(`Lỗi OCR: ${errorMsg}`);
  //     }
  //   } finally {
  //     setIsOcrLoading(false);
  //   }
  // };
  const handleFrontIdUpload = async (e) => {
    const file = e.target.files[0];
    const fieldName = "frontOfIdentity";

    // 1. RESET và KHÓA LẠI ngay từ đầu
    if (imagePreviews[fieldName]) URL.revokeObjectURL(imagePreviews[fieldName]);
    setImagePreviews((prev) => ({ ...prev, [fieldName]: null }));
    
    setOcrData({ name: "", id: "", nationality: "", home: "" });
    setOcrError(null);
    setCanEditOcr(false); // <--- QUAN TRỌNG: Khóa lại ngay khi bắt đầu upload
    
    setUploadedFiles((prev) => ({ ...prev, [fieldName]: null }));
    setFormData((prev) => ({ ...prev, [fieldName]: null }));

    if (!file) return;

    // Set file mới & Preview
    setFormData((prev) => ({ ...prev, [fieldName]: file }));
    setUploadedFiles((prev) => ({ ...prev, [fieldName]: file.name }));
    const previewUrl = URL.createObjectURL(file);
    setImagePreviews((prev) => ({ ...prev, [fieldName]: previewUrl }));
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    
    setIsOcrLoading(true);

    try {
      const response = await profileApi.getIdentityInfoFromOCR(file);
      const resData = response.data;

      // === TRƯỜNG HỢP 1: THÀNH CÔNG (Success: true) ===
      if (resData?.success && resData?.data) {
        const { name, id, nationality, home } = resData.data;

        // A. Thành công nhưng DỮ LIỆU RỖNG -> Cho phép nhập tay
        if (!id || !name || id.trim() === "" || name.trim() === "") {
             const errorContent = (
                <div>
                    <p>Ảnh hợp lệ nhưng hệ thống không đọc được chữ.</p>
                    <ul style={{ textAlign: 'left', marginTop: '10px', marginLeft: '20px', fontSize: '0.95rem', color: '#555' }}>
                        <li style={{marginBottom: '5px'}}> Có thể ảnh bị mờ hoặc chói sáng.</li>
                        <li> Bạn vui lòng <b>nhập tay</b> các thông tin còn thiếu.</li>
                    </ul>
                </div>
            );

            showModal(
                " Dữ liệu trống",
                errorContent,
                "info", // Màu xanh hoặc vàng (cảnh báo nhẹ)
                () => document.getElementById("identityNumberOcr")?.focus()
            );
            
            setCanEditOcr(true); // <--- MỞ KHÓA (Theo yêu cầu của bạn)
            return; 
        }

        // B. Thành công và CÓ DỮ LIỆU -> Điền vào và cho phép sửa
        setOcrData({
          name: name || "",
          id: id || "",
          nationality: nationality || "",
          home: home || "",
        });
        setErrors((prev) => ({ ...prev, identityNumber: null }));
        setCanEditOcr(true); // <--- MỞ KHÓA
      } 
      
      // === TRƯỜNG HỢP 2: THẤT BẠI (Success: false / Lỗi OCR) ===
      else {
        const errorDetail = resData?.error || ""; 

        // Nếu là lỗi "Không tìm thấy ID" -> ĐÂY LÀ ẢNH SAI
        if (
            errorDetail.includes("Unable to find ID card") || 
            errorDetail.includes("errorCode\":3")
        ) {
             const errorContent = (
                <div>
                    <p>Hệ thống không tìm thấy thẻ CCCD trong ảnh.</p>
                    <ul style={{ textAlign: 'left', marginTop: '10px', marginLeft: '20px', fontSize: '0.95rem', color: '#555' }}>
                        <li> Vui lòng chọn lại đúng ảnh <b>Mặt Trước</b> CCCD.</li>
                    </ul>
                </div>
            );
            
            showModal(" Ảnh không hợp lệ", errorContent, "error");
            
            setOcrError(null);
            setCanEditOcr(false); // <--- VẪN KHÓA (Bắt buộc chọn ảnh lại)
            return;
        }

        throw new Error(resData?.message || "Không thể đọc thông tin CCCD.");
      }
    } catch (error) {
      // === TRƯỜNG HỢP 3: LỖI MẠNG / SERVER ===
      const responseData = error.response?.data;
      const rawErrorString = responseData?.error || ""; 
      
      // Check lại lần nữa nếu lỗi OCR lọt vào đây
      if (
        rawErrorString.includes("Unable to find ID card") || 
        rawErrorString.includes("errorCode\":3")
      ) {
         const errorContent = (
            <div>
                <p>Hệ thống không tìm thấy thẻ CCCD.</p>
                <ul><li> Vui lòng chọn lại đúng ảnh <b>Mặt Trước</b> CCCD.</li></ul>
            </div>
        );
        showModal(" Ảnh không hợp lệ", errorContent, "error");
        setOcrError(null);
        setCanEditOcr(false); // <--- VẪN KHÓA
      } else {
        const errorMsg = rawErrorString || error.message || "Lỗi đọc CCCD.";
        setOcrError(`Lỗi OCR: ${errorMsg}`);
        // Lỗi server khác thì tuỳ bạn, nhưng an toàn nhất là vẫn KHÓA để user thử lại
        setCanEditOcr(false); 
      }
    } finally {
      setIsOcrLoading(false);
    }
  };

  // Handler cho các file khác (có preview)
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    // Clear preview cũ
    if (imagePreviews[fieldName]) URL.revokeObjectURL(imagePreviews[fieldName]);
    setImagePreviews((prev) => ({ ...prev, [fieldName]: null }));
    setUploadedFiles((prev) => ({ ...prev, [fieldName]: null }));
    setFormData((prev) => ({ ...prev, [fieldName]: null })); // Xóa file cũ

    if (!file) return; // Dừng nếu cancel

    setFormData((prev) => ({ ...prev, [fieldName]: file })); // Lưu file mới
    setUploadedFiles((prev) => ({ ...prev, [fieldName]: file.name }));
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));

    // Tạo preview nếu là ảnh
    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews((prev) => ({ ...prev, [fieldName]: previewUrl }));
    }
  };

  // Validate Form (kiểm tra OCR ID)
  const validateForm = () => {
    const newErrors = {};
    if (!formData.storeName.trim() || !regex.storeName.test(formData.storeName))
      newErrors.storeName = "Tên cửa hàng: 2-50 ký tự, chữ/số.";
    if (!formData.taxNumber.trim() || !regex.taxNumber.test(formData.taxNumber))
      newErrors.taxNumber = "Mã số thuế: 10-13 chữ số.";

    // UPDATED: Kiểm tra ocrData.id (dữ liệu có thể được người dùng sửa)
    if (!ocrData.id)
      newErrors.identityNumber =
        "Vui lòng tải CCCD mặt trước hợp lệ hoặc nhập Số CCCD.";

    const requiredFiles = [
      "frontOfIdentity",
      "backOfIdentity",
      "businessLicense",
      "selfie",
      "storePolicy",
    ];
    requiredFiles.forEach((f) => {
      if (!formData[f]) newErrors[f] = "Vui lòng tải file này.";
    });
    if (!agreePolicy) newErrors.policy = "Bạn cần đồng ý với điều khoản.";
    setErrors(newErrors);
    return newErrors;
  };

  // Reset Form (reset cả OCR và previews)
  const handleReset = () => {
    setFormData({
      storeName: "",
      taxNumber: "",
      frontOfIdentity: null,
      backOfIdentity: null,
      businessLicense: null,
      selfie: null,
      storePolicy: null,
    });
    setUploadedFiles({
      frontOfIdentity: null,
      backOfIdentity: null,
      businessLicense: null,
      selfie: null,
      storePolicy: null,
    });
    setAgreePolicy(false);
    setErrors({});
    setIsLoading(false);
    setShowLoadingMessage(false);
    // Reset OCR
    setOcrData({ name: "", id: "", nationality: "", home: "" });
    setOcrError(null);
    setIsOcrLoading(false);
    // Reset Previews và giải phóng URLs
    Object.values(imagePreviews).forEach(
      (url) => url && URL.revokeObjectURL(url)
    );
    setImagePreviews({
      frontOfIdentity: null,
      backOfIdentity: null,
      businessLicense: null,
      selfie: null,
      storePolicy: null,
    });
  };

  // --- Submit KYC ---
  // --- Submit KYC ---
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (isLoading || isOcrLoading) return; // Chặn submit khi đang loading
  //   setShowLoadingMessage(false);

  //   const formErrors = validateForm();
  //   if (Object.keys(formErrors).length > 0) {
  //     // ... (Giữ nguyên logic focus lỗi) ...
  //     const firstErrorField = Object.keys(formErrors)[0];
  //     const firstErrorElement =
  //       document.getElementById(firstErrorField) ||
  //       document.getElementById("identityNumberOcr") ||
  //       document.getElementById("ocrFullName") ||
  //       document.getElementById("ocrNationality") ||
  //       document.getElementById("ocrHome");
  //     if (firstErrorElement?.focus) {
  //       try {
  //         firstErrorElement.focus();
  //       } catch {
  //         console.warn("Could not focus error field:", firstErrorField);
  //       }
  //     }
  //     alert("Vui lòng kiểm tra lại các thông tin lỗi.");
  //     return;
  //   }

  //   setIsLoading(true); // Bật loading submit
  //   setShowLoadingMessage(true);
  //   try {
  //     const formBody = new FormData();
  //     // Dữ liệu nhập tay
  //     formBody.append("storeName", formData.storeName);
  //     formBody.append("taxNumber", formData.taxNumber);
  //     // Dữ liệu từ OCR (đã qua chỉnh sửa của người dùng)
  //     formBody.append("identityNumber", ocrData.id);
  //     formBody.append("nationality", ocrData.nationality);
  //     formBody.append("home", ocrData.home);
  //     formBody.append("sellerName", ocrData.name);

  //     // Các file
  //     formBody.append("front of identity", formData.frontOfIdentity);
  //     formBody.append("back of identity", formData.backOfIdentity);
  //     formBody.append("business license", formData.businessLicense);
  //     formBody.append("store policy", formData.storePolicy);
  //     formBody.append("selfie", formData.selfie);

  //     const response = await profileApi.verifyKyc(formBody);

  //     // --- BƯỚC MỚI: XỬ LÝ LỖI REJECTED CỤ THỂ ---
  //     if (
  //       response.data?.success === true && // LƯU Ý: Success: true ở level ngoài cùng
  //       response.data?.data?.status === "REJECTED" &&
  //       response.data?.data?.message === "Face not matched"
  //     ) {
  //       setShowLoadingMessage(false);
  //       alert("Ảnh trên căn cước công dân không trùng với ảnh chân dung, vui lòng điền lại đơn.");
  //       // KHÔNG CHUYỂN sang PENDING, giữ lại form.
  //       return; // Thoát khỏi hàm try
  //     }
  //     // --- KẾT THÚC BƯỚC MỚI ---

  //     if (!response.data?.success)
  //       throw new Error(response.data?.message || "Lỗi gửi đơn KYC.");

  //     // --- THÀNH CÔNG -> Chuyển sang PENDING (ÁP DỤNG cho success: true + status: PENDING) ---
  //     setShowLoadingMessage(false);
  //     // Cập nhật sellerData để truyền cho màn Pending
  //     setSellerData((prev) => ({
  //       ...prev,
  //       storeName: formData.storeName,
  //       createAt:
  //         response.data?.data?.createAt ||
  //         prev?.createAt ||
  //         new Date().toISOString(),
  //     }));
  //     setKycStatus("PENDING"); // Chuyển giao diện
  //   } catch (error) {
  //     console.error("KYC Submission Error:", error);
  //     setShowLoadingMessage(false);
  //     alert(
  //       error.response?.data?.message ||
  //       error.message ||
  //       "Không thể gửi đơn KYC."
  //     );
  //     if (error.response?.data?.errors) setErrors(error.response.data.errors);
  //   } finally {
  //     setIsLoading(false); // Tắt loading submit
  //   }
  // };

  // --- Submit KYC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isOcrLoading) return;
    setShowLoadingMessage(false);

    // 1. Validate Form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showModal("Thông tin chưa hợp lệ", "Vui lòng kiểm tra lại các trường báo lỗi màu đỏ.", "error");
      return;
    }

    setIsLoading(true);
    setShowLoadingMessage(true);

    try {
        const formBody = new FormData();
        formBody.append("storeName", formData.storeName);
        formBody.append("taxNumber", formData.taxNumber);
        formBody.append("identityNumber", ocrData.id);
        formBody.append("nationality", ocrData.nationality);
        formBody.append("home", ocrData.home);
        formBody.append("sellerName", ocrData.name); 
        formBody.append("front of identity", formData.frontOfIdentity);
        formBody.append("back of identity", formData.backOfIdentity);
        formBody.append("business license", formData.businessLicense);
        formBody.append("store policy", formData.storePolicy);
        formBody.append("selfie", formData.selfie);

        const response = await profileApi.verifyKyc(formBody);
        const resData = response.data; // Data trả về từ server

        // ==============================================================
        // 🔥 GỘP 2 TRƯỜNG HỢP LỖI KHUÔN MẶT (FACE MATCHING) TẠI ĐÂY
        // ==============================================================
        
        // Case 1: Server trả về status REJECTED và message "Face not matched"
        const isExplicitReject = 
            resData?.data?.status === "REJECTED" && 
            (resData?.data?.message === "Face not matched" || resData?.data?.reason === "Face verification failed");

        // Case 2: Server bị lỗi Java (NullPointer) khi đang so sánh
        const isJavaCrash = 
            resData?.message === "KYC INFORMATION FAILED." && 
            typeof resData?.error === "string" &&
            (resData.error.includes("java.lang.Number.doubleValue") || resData.error.includes("java.util.Map.get"));

        // ==> NẾU DÍNH 1 TRONG 2 LỖI TRÊN -> HIỆN MODAL KHÔNG TRÙNG KHỚP
        if (isExplicitReject || isJavaCrash) {
            setShowLoadingMessage(false);
            showModal(
                "Xác thực khuôn mặt thất bại",
                "Ảnh chân dung (Selfie) không trùng khớp với ảnh trên CCCD. Vui lòng chụp lại rõ nét hơn.",
                "error"
            );
            return; // Dừng ngay, không chạy tiếp
        }
        // ==============================================================

        // Nếu success = false mà không phải lỗi khuôn mặt -> Ném lỗi xuống catch
        if (!resData?.success) {
            throw new Error(resData?.message || "Lỗi gửi đơn KYC.");
        }

        // === THÀNH CÔNG ===
        setShowLoadingMessage(false);
        setSellerData((prev) => ({
            ...prev,
            storeName: formData.storeName,
            createAt: resData?.data?.createAt || prev?.createAt || new Date().toISOString(),
        }));
        setKycStatus("PENDING");

    } catch (error) {
        console.error("KYC Error:", error);
        setShowLoadingMessage(false);

        const resData = error.response?.data || {};

        // Check lại lần nữa trong catch (đề phòng server trả về mã lỗi 400/500 thay vì 200)
        const isExplicitReject = 
            resData?.data?.status === "REJECTED" && 
            (resData?.data?.message === "Face not matched" || resData?.data?.reason === "Face verification failed");
        
        const isJavaCrash = 
            resData?.message === "KYC INFORMATION FAILED." && 
            typeof resData?.error === "string" &&
            (resData.error.includes("java.lang.Number.doubleValue") || resData.error.includes("java.util.Map.get"));

        if (isExplicitReject || isJavaCrash) {
             showModal(
                "Xác thực khuôn mặt thất bại",
                "Ảnh chân dung (Selfie) không trùng khớp với ảnh trên CCCD. Vui lòng chụp lại rõ nét hơn.",
                "error"
            );
            return;
        }

        // Các lỗi khác
        showModal(
            "Gửi đơn thất bại",
            resData.message || error.message || "Không thể gửi đơn KYC.",
            "error"
        );
        if (resData.errors) setErrors(resData.errors);
    } finally {
        setIsLoading(false);
    }
  };



  // --- Cleanup Image Preview URLs on Unmount ---
  useEffect(() => {
    // Hàm cleanup chạy khi component unmount
    return () => {
      Object.values(imagePreviews).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          // Chỉ revoke blob URLs
          URL.revokeObjectURL(url);
          console.log("Revoked preview URL on unmount:", url);
        }
      });
    };
  }, []); // Dependency rỗng để chỉ chạy khi unmount

  // ------------------------------------
  // === RENDER CHÍNH (THEO TRẠNG THÁI) ===
  // ------------------------------------

  // 1. Loading ban đầu
  if (checkingStatus) {
    return (
      <div className="upgrade-container">
        <p className="form-message loading">Đang kiểm tra thông tin...</p>
      </div>
    );
  }
  if (statusCheckError) {
    return (
      <div className="upgrade-container">
        <div className="upgrade-wrapper profile-incomplete-notice">
          <p className="form-message error">
            Đã xảy ra lỗi: {statusCheckError}
          </p>
        </div>
      </div>
    );
  }
  // 2. Profile Buyer chưa hoàn tất
  if (!isProfileComplete) {
    return (
      <div className="upgrade-container">
        <div className="upgrade-wrapper profile-incomplete-notice">
          <p className="form-message error">
            Bạn chưa hoàn thành thông tin cá nhân.
          </p>
          <p className="form-message">
            Vui lòng quay về trang thông tin cá nhân để tiếp tục.
          </p>
          <div className="form-buttons">
            <button
              type="button"
              className="btn btn-submit"
              onClick={onGoToProfile}
            >
              Hoàn tất hồ sơ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Hiển thị theo Status KYC
  if (kycStatus === "ACCEPTED")
    return (
      <SellerApplicationAccepted data={sellerData} onComplete={onKycAccepted} />
    );
  if (kycStatus === "PENDING")
    return <SellerApplicationPending data={sellerData} />;

  // 4. Hiện Form Đăng Ký KYC (NOT_SUBMITTED / REJECTED)
  return (
    <div className="upgrade-container">
      <Modal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={handleCloseModal}
      />
      <div className="upgrade-wrapper">
        <h1 className="upgrade-title">Trở thành người bán</h1>
        {showLoadingMessage && (
          <p className="form-message loading">Hệ thống đang xác thực...</p>
        )}

        <form onSubmit={handleSubmit} className="upgrade-form" noValidate>
          {/* === 1. CCCD Mặt Trước (Upload + OCR + Preview) === */}
          <div className="file-upload-item">
            <label htmlFor="frontOfIdentity" className="file-label">
              Ảnh CCCD mặt trước *
            </label>
            {imagePreviews.frontOfIdentity && (
              <div className="image-preview-container">
                <img
                  src={imagePreviews.frontOfIdentity}
                  alt="Xem trước CCCD mặt trước"
                  className="image-preview image-preview-fit" // UPDATED: Thêm class CSS
                  style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'cover' }} // Inline style giả định
                />
              </div>
            )}
            <div
              className={`file-upload-box ${errors.frontOfIdentity ? "input-error" : ""
                }`}
            >
              <input
                type="file"
                id="frontOfIdentity"
                name="frontOfIdentity"
                onChange={handleFrontIdUpload}
                className="file-input"
                accept="image/jpeg, image/png, image/jpg"
                disabled={isLoading || isOcrLoading}
                aria-invalid={!!errors.frontOfIdentity || !!ocrError}
                aria-describedby={
                  errors.frontOfIdentity
                    ? "frontOfIdentity-error"
                    : ocrError
                      ? "frontOfIdentity-ocr-error"
                      : undefined
                }
              />
              <label
                htmlFor="frontOfIdentity"
                className={`file-button ${isLoading || isOcrLoading ? "disabled" : ""
                  }`}
              >
                {isOcrLoading
                  ? "Đang đọc..."
                  : uploadedFiles.frontOfIdentity
                    ? "Chọn ảnh khác"
                    : "⬇ Tải ảnh"}
              </label>
              {isOcrLoading && (
                <span className="ocr-status">Đang xử lý...</span>
              )}
              {!isOcrLoading && !ocrError && uploadedFiles.frontOfIdentity && (
                <p className="file-name">{uploadedFiles.frontOfIdentity}</p>
              )}
            </div>
            {ocrError && (
              <p
                id="frontOfIdentity-ocr-error"
                className="error-text ocr-error"
              >
                {ocrError}
              </p>
            )}
            {errors.frontOfIdentity && !ocrError && (
              <p id="frontOfIdentity-error" className="error-text">
                {errors.frontOfIdentity}
              </p>
            )}
          </div>

         {/* === 2. Thông tin từ OCR === */}
          <div className="form-group">
            <label htmlFor="ocrFullName" className="form-label">Họ và tên *</label>
            <input
              id="ocrFullName"
              name="name"
              type="text"
              value={ocrData.name}
              onChange={handleOcrInputChange}
              onClick={handleOcrInputClick}    // <--- Nếu bị khóa, click sẽ hiện modal nhắc nhở
              readOnly={!canEditOcr}           // <--- Khóa nếu canEditOcr = false
              className={`form-input ${!canEditOcr ? "input-locked" : ""}`} // Class đổi màu xám
            />
          </div>

          <div className="form-group">
            <label htmlFor="identityNumberOcr" className="form-label">Số CMND/CCCD *</label>
            <input
              id="identityNumberOcr"
              name="id"
              type="text"
              value={ocrData.id}
              onChange={handleOcrInputChange}
              onClick={handleOcrInputClick}    // <---
              readOnly={!canEditOcr}           // <---
              className={`form-input ${errors.identityNumber ? "input-error" : ""} ${!canEditOcr ? "input-locked" : ""}`}
            />
            {errors.identityNumber && <p className="error-text">{errors.identityNumber}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="ocrNationality" className="form-label">Quốc tịch</label>
            <input
              id="ocrNationality"
              name="nationality"
              type="text"
              value={ocrData.nationality}
              onChange={handleOcrInputChange}
              onClick={handleOcrInputClick}    // <---
              readOnly={!canEditOcr}           // <---
              className={`form-input ${!canEditOcr ? "input-locked" : ""}`}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ocrHome" className="form-label">Địa chỉ cá nhân</label>
            <input
              id="ocrHome"
              name="home"
              type="text"
              value={ocrData.home}
              onChange={handleOcrInputChange}
              onClick={handleOcrInputClick}    // <---
              readOnly={!canEditOcr}           // <---
              className={`form-input ${!canEditOcr ? "input-locked" : ""}`}
            />
          </div>

          {/* === 3. Thông tin cần nhập tay === */}
          <div className="form-group">
            <label htmlFor="storeName" className="form-label">
              Tên cửa hàng *
            </label>
            <input
              id="storeName"
              name="storeName"
              value={formData.storeName}
              onChange={handleInputChange}
              className={`form-input ${errors.storeName ? "input-error" : ""}`}
              aria-invalid={!!errors.storeName}
              aria-describedby={
                errors.storeName ? "storeName-error" : undefined
              }
            />
            {errors.storeName && (
              <p id="storeName-error" className="error-text">
                {errors.storeName}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="taxNumber" className="form-label">
              Mã số thuế *
            </label>
            <input
              id="taxNumber"
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleInputChange}
              className={`form-input ${errors.taxNumber ? "input-error" : ""}`}
              aria-invalid={!!errors.taxNumber}
              aria-describedby={
                errors.taxNumber ? "taxNumber-error" : undefined
              }
            />
            {errors.taxNumber && (
              <p id="taxNumber-error" className="error-text">
                {errors.taxNumber}
              </p>
            )}
          </div>

          {/* === 4. Các file upload khác (Có Preview) === */}
          <p className="upload-note">
            Upload các giấy tờ còn lại (PDF or image).
          </p>
          {[
            ["backOfIdentity", "Ảnh CCCD mặt sau *"],
            ["businessLicense", "Giấy phép kinh doanh *"],
            ["selfie", "Ảnh chân dung (Selfie) *"],
            ["storePolicy", "Chính sách cửa hàng *"],
          ].map(([key, label]) => (
            <div className="file-upload-item" key={key}>
              <label htmlFor={key} className="file-label">
                {label}
              </label>
              {imagePreviews[key] && (
                <div className="image-preview-container">
                  <img
                    src={imagePreviews[key]}
                    alt={`Xem trước ${label}`}
                    className="image-preview image-preview-fit" // UPDATED: Thêm class CSS
                    style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'cover' }} // Inline style giả định
                  />
                </div>
              )}
              <div
                className={`file-upload-box ${errors[key] ? "input-error" : ""
                  }`}
              >
                <input
                  type="file"
                  id={key}
                  name={key}
                  onChange={(e) => handleFileUpload(e, key)}
                  className="file-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={isLoading}
                  aria-invalid={!!errors[key]}
                  aria-describedby={errors[key] ? `${key}-error` : undefined}
                />
                <label
                  htmlFor={key}
                  className={`file-button ${isLoading ? "disabled" : ""}`}
                >
                  ⬇ Tải file
                </label>
              </div>
              {uploadedFiles[key] && (
                <p className="file-name">{uploadedFiles[key]}</p>
              )}
              {errors[key] && (
                <p id={`${key}-error`} className="error-text">
                  {errors[key]}
                </p>
              )}
            </div>
          ))}

          {/* === 5. Policy và Buttons === */}
          <div
            className={`policy-agreement ${errors.policy ? "input-error" : ""}`}
          >
            <input
              type="checkbox"
              id="agreePolicy"
              checked={agreePolicy}
              onChange={(e) => {
                setAgreePolicy(e.target.checked);
                if (e.target.checked)
                  setErrors((prev) => ({ ...prev, policy: null }));
              }}
              className="checkbox-input"
              disabled={isLoading}
              aria-invalid={!!errors.policy}
              aria-describedby={errors.policy ? "policy-error" : undefined}
            />
            <label htmlFor="agreePolicy" className="agreement-text">
              Tôi đồng ý với các điều khoản và chính sách. *
              <button
                type="button"
                className="policy-link"
                onClick={() => !isLoading && setShowPolicyModal(true)}
                disabled={isLoading}
              >
                Chính sách
              </button>
            </label>
          </div>
          {errors.policy && (
            <p
              id="policy-error"
              className="error-text"
              style={{ marginTop: "8px" }}
            >
              {errors.policy}
            </p>
          )}

          <div className="form-buttons">
            <button
              type="submit"
              className="btn btn-submit"
              disabled={isLoading || isOcrLoading}
            >
              {isLoading ? "Đang gửi..." : "Gửi đơn đăng ký"}
            </button>
            <button
              type="button"
              className="btn btn-reset"
              onClick={handleReset}
              disabled={isLoading}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
      {showPolicyModal && (
        <PolicyModal onClose={() => setShowPolicyModal(false)} />
      )}
    </div>
  );
}

