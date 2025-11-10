// src/components/ServicePackageGuard/ServicePackageGuard.jsx
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import sellerApi from "../../api/sellerApi";
import "./ServicePackageGuard.css";

// Context để share package state
const PackageContext = createContext({
  packageValid: false,
  packageInfo: null,
  isLoading: false
});

// Hook để sử dụng package context
export function usePackage() {
  return useContext(PackageContext);
}

/**
 * Component bảo vệ: Chỉ cho phép seller có gói còn hạn thực hiện action
 * @param {boolean} viewOnly - Nếu true, cho phép xem dù gói hết hạn (nhưng hiển thị cảnh báo)
 * @param {function} onPackageExpired - Callback khi gói hết hạn
 */
export function ServicePackageGuard({ children, viewOnly = false, onPackageExpired }) {
  const [loading, setLoading] = useState(true);
  const [packageValid, setPackageValid] = useState(false);
  const [packageInfo, setPackageInfo] = useState(null);
  const [error, setError] = useState(null);

  // Hàm để xử lý và dịch thông báo lỗi thành tiếng Việt thân thiện
  const getFriendlyErrorMessage = useCallback((errorResponse) => {
    // Kiểm tra các trường hợp lỗi từ backend
    const errorData = errorResponse?.data || errorResponse;
    const errorType = errorData?.error?.errorType;
    const errorMessage = (errorData?.message || errorData?.error?.message || "").toUpperCase();

    // Kiểm tra nếu là lỗi gói dịch vụ hết hạn
    // Kiểm tra errorType
    if (errorType === "SubscriptionExpiredException") {
      return {
        isSubscriptionExpired: true,
        message: "Gói dịch vụ của bạn hiện đang không khả dụng, vui lòng kiểm tra lại tại phần Mua gói dịch vụ"
      };
    }

    // Kiểm tra message có chứa từ khóa về subscription expired
    if (
      errorMessage.includes("SUBSCRIPTION EXPIRED") ||
      errorMessage.includes("SUBSCRIPTIONEXPIRED") ||
      errorMessage.includes("SELLER SUBSCRIPTION EXPIRED") ||
      (errorMessage.includes("SUBSCRIPTION") && errorMessage.includes("EXPIRED")) ||
      errorMessage.includes("GÓI DỊCH VỤ") ||
      errorMessage.includes("PACKAGE EXPIRED")
    ) {
      return {
        isSubscriptionExpired: true,
        message: "Gói dịch vụ của bạn hiện đang không khả dụng, vui lòng kiểm tra lại tại phần Mua gói dịch vụ"
      };
    }

    // Kiểm tra nếu response có success: false - có thể là lỗi subscription
    if (errorData?.success === false) {
      // Nếu không có data hoặc data null, thường là subscription expired
      if (!errorData?.data || errorData?.data === null) {
        if (errorMessage.includes("SUBSCRIPTION") || errorMessage.includes("PACKAGE")) {
          return {
            isSubscriptionExpired: true,
            message: "Gói dịch vụ của bạn hiện đang không khả dụng, vui lòng kiểm tra lại tại phần Mua gói dịch vụ"
          };
        }
      }
    }

    // Lỗi khác - trả về message gốc hoặc message mặc định
    const originalMessage = errorData?.message || errorData?.error?.message || errorResponse?.message;
    return {
      isSubscriptionExpired: false,
      message: originalMessage || "Không thể kiểm tra gói dịch vụ. Vui lòng thử lại sau."
    };
  }, []);

  const checkPackageValidity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const username = localStorage.getItem("username");
      console.log(
        "[ServicePackageGuard] Checking package for username:",
        username
      );

      if (!username) {
        throw new Error("Không tìm thấy thông tin đăng nhập");
      }

      const response = await sellerApi.checkServicePackageValidity(username);

      // DETAILED DEBUG LOGS
      console.log("=== [ServicePackageGuard] API Response Debug ===");
      console.log("Full response object:", response);
      console.log("response.status:", response?.status);
      console.log("response.data:", response?.data);
      console.log("response.data.success:", response?.data?.success);
      console.log("response.data.message:", response?.data?.message);
      console.log("response.data.data:", response?.data?.data);

      const responseData = response?.data;

      // Kiểm tra nếu response có success: false
      if (responseData?.success === false) {
        const friendlyError = getFriendlyErrorMessage({ data: responseData });
        console.warn("[ServicePackageGuard] Package check failed:", friendlyError);
        setPackageValid(false);
        setError(friendlyError.message);
        if (onPackageExpired) {
          onPackageExpired(responseData);
        }
        return;
      }

      const data = responseData?.data;
      console.log("Extracted data object:", data);
      console.log("data.valid:", data?.valid);
      console.log("data.packageName:", data?.packageName);
      console.log("data.expiryDate:", data?.expiryDate);
      console.log("data.sellerId:", data?.sellerId);
      console.log("================================================");

      if (data?.valid === true) {
        console.log("[ServicePackageGuard] Package is VALID!");
        setPackageValid(true);
        setPackageInfo({
          packageName: data.packageName,
          expiryDate: data.expiryDate,
        });
      } else {
        console.warn("[ServicePackageGuard] Package is INVALID or expired");
        console.warn("Reason - data.valid:", data?.valid);
        setPackageValid(false);
        setError("Gói dịch vụ của bạn hiện đang không khả dụng, vui lòng kiểm tra lại tại phần Mua gói dịch vụ");
        if (onPackageExpired) {
          onPackageExpired(data);
        }
      }
    } catch (err) {
      // DETAILED ERROR LOGS
      console.error("=== [ServicePackageGuard] ERROR Debug ===");
      console.error("Error object:", err);
      console.error("Error message:", err.message);
      console.error("Error response:", err.response);
      console.error("Error response status:", err.response?.status);
      console.error("Error response data:", err.response?.data);
      console.error(
        "Error response data.message:",
        err.response?.data?.message
      );
      console.error("Error response data.error:", err.response?.data?.error);
      console.error("=========================================");

      // Xử lý lỗi và dịch sang tiếng Việt thân thiện
      const friendlyError = getFriendlyErrorMessage(err.response || err);
      setError(friendlyError.message);
      setPackageValid(false);
    } finally {
      setLoading(false);
    }
  }, [getFriendlyErrorMessage, onPackageExpired]);

  useEffect(() => {
    checkPackageValidity();
  }, [checkPackageValidity]);

  // Nếu viewOnly và đang loading, vẫn render children với packageValid = false tạm thời
  if (loading && !viewOnly) {
    return (
      <div className="package-guard-loading">
        <div className="spinner"></div>
        <p>Đang kiểm tra gói dịch vụ...</p>
      </div>
    );
  }

  if (error && !viewOnly) {
    // Kiểm tra nếu là lỗi gói dịch vụ hết hạn
    const isSubscriptionError = error.includes("không khả dụng") || 
                                error.includes("Mua gói dịch vụ");

    return (
      <div className="package-guard-error">
        <div className="error-icon"></div>
        <h3>{isSubscriptionError ? "Gói dịch vụ không khả dụng" : "Lỗi kiểm tra gói dịch vụ"}</h3>
        <p>{error}</p>
        <div className="action-buttons">
          {isSubscriptionError && (
            <button
              onClick={() => (window.location.href = "/profile?tab=buy-seller-package")}
              className="btn-buy-package"
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '1px',
                minWidth: '140px'
              }}
            >
              Mua gói dịch vụ
            </button>
          )}
          <button onClick={checkPackageValidity} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Nếu viewOnly = true, vẫn cho phép xem dù gói hết hạn
  if (!packageValid && !viewOnly) {
    return (
      <div className="package-guard-expired">
        <div className="expired-icon"></div>
        <h3>Gói dịch vụ không khả dụng</h3>
        <p>
          Bạn cần mua gói dịch vụ hoặc gia hạn gói hiện tại để sử dụng tính năng
          này.
        </p>
        <div className="action-buttons">
          <button
            onClick={() => (window.location.href = "/profile?tab=buy-seller-package")}
            className="btn-buy-package"
          >
            Mua gói dịch vụ
          </button>
          <button onClick={checkPackageValidity} className="btn-check-again">
            Kiểm tra lại
          </button>
        </div>
      </div>
    );
  }

  // Package valid hoặc viewOnly = true → render children
  // Luôn render PackageContext để children có thể sử dụng usePackage hook
  return (
    <PackageContext.Provider value={{
      packageValid,
      packageInfo,
      isLoading: loading
    }}>
      <div className={`package-guard-valid ${viewOnly ? 'package-guard-viewonly' : ''}`}>
        {loading && viewOnly && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            marginTop: '5.5rem' /* Header 4rem + spacing */
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
              Đang kiểm tra gói dịch vụ...
            </p>
          </div>
        )}
        {packageInfo && packageValid && !loading && (
          <div className="package-info-banner">
            <span className="package-icon"></span>
            <span className="package-name">{packageInfo.packageName}</span>
            <span className="package-expiry">
              Hết hạn: {new Date(packageInfo.expiryDate).toLocaleDateString()}
            </span>
          </div>
        )}
        {error && viewOnly && !loading && (
          <div className="package-warning-banner" style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '5.5rem', /* Header 4rem (64px) + spacing 1.5rem (24px) = 88px */
            marginBottom: '20px',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
            zIndex: 10,
            maxWidth: '1200px',
            width: 'calc(100% - 2rem)'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#856404' }}>
                Gói dịch vụ không khả dụng
              </strong>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                {error}
              </p>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a 
                  href="/profile?tab=buy-seller-package"
                  style={{ 
                    color: '#0066cc', 
                    textDecoration: 'underline',
                    fontSize: '14px'
                  }}
                >
                  Mua gói dịch vụ
                </a>
                <span style={{ color: '#856404' }}>•</span>
                <button 
                  onClick={checkPackageValidity}
                  style={{ 
                    color: '#0066cc', 
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '14px'
                  }}
                >
                  Thử lại
                </button>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#856404', fontStyle: 'italic' }}>
                Bạn vẫn có thể xem và quản lý tin đăng cũ nhưng không thể đăng tin mới.
              </p>
            </div>
          </div>
        )}
        {!packageValid && !error && viewOnly && !loading && (
          <div className="package-warning-banner" style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '5.5rem', /* Header 4rem (64px) + spacing 1.5rem (24px) = 88px */
            marginBottom: '20px',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
            zIndex: 10,
            maxWidth: '1200px',
            width: 'calc(100% - 2rem)'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#856404' }}>
                Gói dịch vụ đã hết hạn
              </strong>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                Bạn có thể xem và quản lý tin đăng cũ nhưng không thể đăng tin mới. 
                <a 
                  href="/profile?tab=buy-seller-package" 
                  style={{ color: '#0066cc', marginLeft: '8px', textDecoration: 'underline' }}
                >
                  Mua gói dịch vụ
                </a>
              </p>
            </div>
          </div>
        )}
        {children}
      </div>
    </PackageContext.Provider>
  );
}
