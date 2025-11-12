import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CFormInput,
  CFormLabel,
  CAlert,
  CSpinner,
  CRow,
  CCol,
} from "@coreui/react";
import {
  getEscrowTransferConfig,
  updateEscrowTransferConfig,
} from "../../../api/adminApi";
import { Save, RefreshCw, Info } from "lucide-react";
import "./SystemConfig.css";

export default function SystemConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Kiểm tra quyền Super Admin - kiểm tra cả adminRole và adminProfile
  useEffect(() => {
    const checkSuperAdmin = () => {
      try {
        // Cách 1: Kiểm tra từ adminRole
        const adminRole = localStorage.getItem("adminRole");
        if (adminRole === "SUPER_ADMIN") {
          setIsSuperAdmin(true);
          return;
        }

        // Cách 2: Kiểm tra từ adminProfile
        const adminProfileStr = localStorage.getItem("adminProfile");
        if (adminProfileStr) {
          const adminProfile = JSON.parse(adminProfileStr);
          const isSuper = adminProfile?.isSuperAdmin === true || 
                         adminProfile?.superAdmin === true || 
                         adminProfile?.is_super_admin === true;
          if (isSuper) {
            setIsSuperAdmin(true);
            return;
          }
        }

        // Mặc định là false
        setIsSuperAdmin(false);
      } catch (err) {
        console.error("Error checking Super Admin:", err);
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();

    // Lắng nghe sự kiện khi adminProfile thay đổi
    const handleStorageChange = () => {
      checkSuperAdmin();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStatusChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStatusChanged", handleStorageChange);
    };
  }, []);

  // Load cấu hình khi component mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const response = await getEscrowTransferConfig();
      
      if (response?.success && response?.data) {
        setConfig(response.data);
        setConfigValue(response.data.configValue || "");
      } else {
        setError("Không thể tải cấu hình. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi load cấu hình:", err);
      
      // Provide more detailed error messages
      let errorMessage = "Không thể tải cấu hình. Vui lòng thử lại.";
      
      if (err?.response?.status === 500) {
        errorMessage = "Lỗi server: Backend không thể xử lý yêu cầu. Vui lòng kiểm tra xem endpoint API có tồn tại không.";
      } else if (err?.response?.status === 404) {
        errorMessage = "Không tìm thấy endpoint API. Vui lòng kiểm tra cấu hình backend.";
      } else if (err?.response?.status === 403) {
        errorMessage = "Không có quyền truy cập. Vui lòng đăng nhập lại.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate input
    if (!configValue || configValue.trim() === "") {
      setError("Vui lòng nhập số giây.");
      return;
    }

    const seconds = parseInt(configValue);
    if (isNaN(seconds) || seconds <= 0) {
      setError("Số giây phải là một số nguyên dương.");
      return;
    }

    // Tối thiểu 1 ngày (86400 giây), tối đa 90 ngày (7776000 giây)
    if (seconds < 86400) {
      setError("Thời gian chuyển tiền tối thiểu là 1 ngày (86400 giây).");
      return;
    }

    if (seconds > 7776000) {
      setError("Thời gian chuyển tiền tối đa là 90 ngày (7776000 giây).");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const response = await updateEscrowTransferConfig(configValue);
      
      if (response?.success && response?.data) {
        // Lưu giá trị cũ để hiển thị trong thông báo
        const oldValue = config?.configValue || config?.configValue?.toString() || "";
        const oldSeconds = oldValue ? parseInt(oldValue) : 0;
        const newSeconds = parseInt(configValue);
        
        // Cập nhật config với dữ liệu mới từ server
        setConfig(response.data);
        setConfigValue(response.data.configValue || response.data.configValue?.toString() || "");
        
        // Hiển thị thông báo thành công với thông tin chi tiết
        const successMsg = oldValue 
          ? `Cập nhật cấu hình thành công! Đã thay đổi từ ${oldSeconds.toLocaleString()} giây (${convertSecondsToDays(oldValue)} ngày) thành ${newSeconds.toLocaleString()} giây (${convertSecondsToDays(configValue)} ngày).`
          : `Cập nhật cấu hình thành công! Giá trị mới: ${newSeconds.toLocaleString()} giây (${convertSecondsToDays(configValue)} ngày).`;
        
        setSuccess(successMsg);
        // Clear success message after 7 seconds
        setTimeout(() => setSuccess(""), 7000);
        // Clear error nếu có
        setError("");
      } else {
        setError("Không thể cập nhật cấu hình. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật cấu hình:", err);
      
      // Provide more detailed error messages
      let errorMessage = "Không thể cập nhật cấu hình. Vui lòng thử lại.";
      
      if (err?.response?.status === 500) {
        errorMessage = "Lỗi server: Backend không thể xử lý yêu cầu. Vui lòng kiểm tra xem endpoint API có tồn tại không.";
      } else if (err?.response?.status === 404) {
        errorMessage = "Không tìm thấy endpoint API. Vui lòng kiểm tra cấu hình backend.";
      } else if (err?.response?.status === 403) {
        errorMessage = "Không có quyền cập nhật. Chỉ Super Admin mới có quyền cập nhật cấu hình này.";
      } else if (err?.response?.status === 401) {
        errorMessage = "Không có quyền truy cập. Vui lòng đăng nhập lại.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Chuyển đổi giây thành ngày để hiển thị
  const convertSecondsToDays = (seconds) => {
    const sec = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    if (isNaN(sec)) return '0';
    return (sec / 86400).toFixed(1);
  };

  // Chuyển đổi giây thành giờ để hiển thị
  const convertSecondsToHours = (seconds) => {
    const sec = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    if (isNaN(sec)) return '0';
    return (sec / 3600).toFixed(1);
  };

  // Chuyển đổi giây thành phút để hiển thị
  const convertSecondsToMinutes = (seconds) => {
    const sec = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    if (isNaN(sec)) return '0';
    return (sec / 60).toFixed(0);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <div className="system-config-container">
      <CCard className="shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Cấu hình Escrow Transfer Time</h5>
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={loadConfig}
            disabled={loading}
          >
            <RefreshCw size={16} className="me-2" />
            Làm mới
          </CButton>
        </CCardHeader>
        <CCardBody>
          {/* Thông báo lỗi */}
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError("")}>
              {error}
            </CAlert>
          )}

          {/* Thông báo thành công */}
          {success && (
            <CAlert color="success" dismissible onClose={() => setSuccess("")}>
              {success}
            </CAlert>
          )}

          {/* Thông tin cấu hình hiện tại */}
          {config && (
            <div className="mb-4">
              <CAlert color="info" className="d-flex align-items-center">
                <Info size={20} className="me-2" />
                <div>
                  <strong>Cấu hình hiện tại:</strong>
                  <ul className="mb-0 mt-2">
                    <li>
                      <strong>Số giây:</strong> {config.seconds ? config.seconds.toLocaleString() : (config.configValue ? parseInt(config.configValue).toLocaleString() : '0')}
                    </li>
                    <li>
                      <strong>Số ngày:</strong> {config.days ? config.days.toFixed(1) : convertSecondsToDays(config.seconds || config.configValue)}
                    </li>
                    <li>
                      <strong>Số giờ:</strong> {config.hours ? config.hours.toFixed(1) : convertSecondsToHours(config.seconds || config.configValue)}
                    </li>
                    <li>
                      <strong>Số phút:</strong> {config.minutes ? config.minutes.toLocaleString() : convertSecondsToMinutes(config.seconds || config.configValue)}
                    </li>
                  </ul>
                  {config.description && (
                    <div className="mt-2">
                      <small>{config.description}</small>
                    </div>
                  )}
                </div>
              </CAlert>
            </div>
          )}

          {/* Form cập nhật cấu hình */}
          {isSuperAdmin ? (
            <div>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>
                    <strong>Số giây chuyển tiền (configValue)</strong>
                  </CFormLabel>
                  <CFormInput
                    type="number"
                    value={configValue}
                    onChange={(e) => setConfigValue(e.target.value)}
                    placeholder="Nhập số giây (ví dụ: 604800 cho 7 ngày)"
                    min="86400"
                    max="7776000"
                    disabled={saving}
                  />
                  <small className="text-muted">
                    Tối thiểu: 1 ngày (86400 giây) | Tối đa: 90 ngày (7776000 giây)
                  </small>
                </CCol>
              </CRow>

              {/* Hiển thị preview khi nhập */}
              {configValue && !isNaN(parseInt(configValue)) && parseInt(configValue) > 0 && (
                <CRow className="mb-3">
                  <CCol md={12}>
                    <div className="preview-box p-3 bg-light rounded">
                      <strong>Preview:</strong>
                      <ul className="mb-0 mt-2">
                        <li>
                          <strong>Số giây:</strong> {parseInt(configValue).toLocaleString()}
                        </li>
                        <li>
                          <strong>Số ngày:</strong> {convertSecondsToDays(configValue)}
                        </li>
                        <li>
                          <strong>Số giờ:</strong> {convertSecondsToHours(configValue)}
                        </li>
                        <li>
                          <strong>Số phút:</strong> {convertSecondsToMinutes(configValue)}
                        </li>
                      </ul>
                    </div>
                  </CCol>
                </CRow>
              )}

              <div className="d-flex gap-2 align-items-center mt-3">
                <CButton
                  color="primary"
                  onClick={handleSave}
                  disabled={saving || !configValue || configValue.toString().trim() === "" || 
                           configValue.toString() === (config?.configValue?.toString() || "")}
                >
                  {saving ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="me-2" />
                      Lưu cấu hình
                    </>
                  )}
                </CButton>
                {configValue && configValue.toString() !== (config?.configValue?.toString() || "") && (
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={() => {
                      setConfigValue(config?.configValue || config?.configValue?.toString() || "");
                      setError("");
                    }}
                    disabled={saving}
                  >
                    Hủy thay đổi
                  </CButton>
                )}
              </div>
            </div>
          ) : (
            <CAlert color="warning">
              <strong>Lưu ý:</strong> Chỉ Super Admin mới có quyền cập nhật cấu hình này.
            </CAlert>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
}

