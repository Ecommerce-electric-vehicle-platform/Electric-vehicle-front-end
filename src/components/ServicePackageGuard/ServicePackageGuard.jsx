// src/components/ServicePackageGuard/ServicePackageGuard.jsx
import { useState, useEffect } from "react";
import sellerApi from "../../api/sellerApi";
import "./ServicePackageGuard.css";

/**
 * Component bảo vệ: Chỉ cho phép seller có gói còn hạn thực hiện action
 */
export function ServicePackageGuard({ children, onPackageExpired }) {
  const [loading, setLoading] = useState(true);
  const [packageValid, setPackageValid] = useState(false);
  const [packageInfo, setPackageInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkPackageValidity();
  }, []);

  const checkPackageValidity = async () => {
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

      const data = response?.data?.data;
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

      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể kiểm tra gói dịch vụ"
      );
      setPackageValid(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="package-guard-loading">
        <div className="spinner"></div>
        <p>Đang kiểm tra gói dịch vụ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="package-guard-error">
        <div className="error-icon"></div>
        <h3>Lỗi kiểm tra gói dịch vụ</h3>
        <p>{error}</p>
        <button onClick={checkPackageValidity} className="btn-retry">
          Thử lại
        </button>
      </div>
    );
  }

  if (!packageValid) {
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
            onClick={() => (window.location.href = "/compare-plans")}
            className="btn-buy-package"
          >
            Mua gói ngay
          </button>
          <button onClick={checkPackageValidity} className="btn-check-again">
            Kiểm tra lại
          </button>
        </div>
      </div>
    );
  }

  // Package valid → render children
  return (
    <div className="package-guard-valid">
      {packageInfo && (
        <div className="package-info-banner">
          <span className="package-icon"></span>
          <span className="package-name">{packageInfo.packageName}</span>
          <span className="package-expiry">
            Hết hạn: {new Date(packageInfo.expiryDate).toLocaleDateString()}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
