import React, { useState, useEffect } from "react";
import { CCard, CCardBody, CCardHeader, CAlert, CButton } from "@coreui/react";
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdBadge,
  MdAccountCircle,
  MdCheckCircle,
  MdCancel,
  MdTransgender,
  MdCalendarToday,
  MdRefresh,
} from "react-icons/md";
import { getAdminProfile } from "../../../api/adminApi";
import "./AdminProfile.css";

export default function AdminProfile() {
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ưu tiên gọi API để lấy thông tin mới nhất từ server
        const response = await getAdminProfile();
        const profileData = response?.data || response;
        
        if (profileData) {
          // Chuẩn hóa dữ liệu từ API (hỗ trợ cả snake_case và camelCase)
          const normalizedProfile = {
            avatarUrl: profileData?.avatarUrl || profileData?.avatar_url || profileData?.avatarURL,
            employeeNumber: profileData?.employeeNumber || profileData?.employee_number,
            fullName: profileData?.fullName || profileData?.full_name,
            phoneNumber: profileData?.phoneNumber || profileData?.phone_number,
            username: profileData?.username,
            email: profileData?.email,
            isSuperAdmin: typeof profileData?.isSuperAdmin !== "undefined"
              ? profileData?.isSuperAdmin
              : profileData?.is_super_admin,
            status: profileData?.status,
            gender: profileData?.gender,
            createdAt: profileData?.createdAt || profileData?.created_at,
            updatedAt: profileData?.updatedAt || profileData?.updated_at,
          };
          
          setAdminInfo(normalizedProfile);
          
          // Cập nhật localStorage với dữ liệu mới nhất
          localStorage.setItem("adminProfile", JSON.stringify(normalizedProfile));
          console.log("[AdminProfile] Đã cập nhật adminProfile từ API");
        }
      } catch (err) {
        console.warn("Không thể lấy admin profile từ API, sử dụng localStorage:", err);
        
        // Fallback: Lấy từ localStorage nếu API lỗi
        const raw = localStorage.getItem("adminProfile");
        if (raw) {
          try {
            const profile = JSON.parse(raw);
            setAdminInfo(profile);
            console.log("[AdminProfile] Đã sử dụng dữ liệu từ localStorage");
          } catch (parseError) {
            console.error("Error parsing adminProfile:", parseError);
            setError("Không thể tải thông tin profile. Vui lòng đăng nhập lại.");
          }
        } else {
          setError("Không tìm thấy thông tin admin. Vui lòng đăng nhập lại.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!adminInfo) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="text-center">
          <CAlert color="danger">
            <strong>Lỗi!</strong> {error || "Không thể tải thông tin profile."}
          </CAlert>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    if (status === "ACTIVE" || status === "active") {
      return (
        <span className="badge bg-success">
          <MdCheckCircle className="me-1" />
          Đang hoạt động
        </span>
      );
    } else if (status === "INACTIVE" || status === "inactive") {
      return (
        <span className="badge bg-danger">
          <MdCancel className="me-1" />
          Không hoạt động
        </span>
      );
    }
    return <span className="badge bg-secondary">{status || "N/A"}</span>;
  };

  const getGenderText = (gender) => {
    if (gender === "MALE" || gender === "male") return "Nam";
    if (gender === "FEMALE" || gender === "female") return "Nữ";
    if (gender === "OTHER" || gender === "other") return "Khác";
    return gender || "N/A";
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Thông tin tài khoản</h2>
            <CButton
              color="primary"
              variant="outline"
              className="refresh-button"
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await getAdminProfile();
                  const profileData = response?.data || response;
                  if (profileData) {
                    const normalizedProfile = {
                      avatarUrl: profileData?.avatarUrl || profileData?.avatar_url || profileData?.avatarURL,
                      employeeNumber: profileData?.employeeNumber || profileData?.employee_number,
                      fullName: profileData?.fullName || profileData?.full_name,
                      phoneNumber: profileData?.phoneNumber || profileData?.phone_number,
                      username: profileData?.username,
                      email: profileData?.email,
                      isSuperAdmin: typeof profileData?.isSuperAdmin !== "undefined"
                        ? profileData?.isSuperAdmin
                        : profileData?.is_super_admin,
                      status: profileData?.status,
                      gender: profileData?.gender,
                      createdAt: profileData?.createdAt || profileData?.created_at,
                      updatedAt: profileData?.updatedAt || profileData?.updated_at,
                    };
                    setAdminInfo(normalizedProfile);
                    localStorage.setItem("adminProfile", JSON.stringify(normalizedProfile));
                    setError(null);
                    console.log("[AdminProfile] Đã refresh dữ liệu từ API");
                  }
                } catch (err) {
                  console.error("Lỗi khi refresh profile:", err);
                  setError("Không thể cập nhật thông tin. Vui lòng thử lại sau.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" style={{ width: "0.875rem", height: "0.875rem" }}></span>
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <MdRefresh size={16} className={`refresh-icon ${loading ? "spinning" : ""}`} />
                  <span>Làm mới</span>
                </>
              )}
            </CButton>
          </div>

          {/* Avatar and Basic Info Card */}
          <CCard className="mb-4 shadow-sm">
            <CCardBody>
              <div className="row align-items-center">
                <div className="col-auto">
                  {adminInfo.avatarUrl ? (
                    <img
                      src={adminInfo.avatarUrl}
                      alt="Admin Avatar"
                      className="rounded-circle"
                      style={{ width: "120px", height: "120px", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "120px",
                        height: "120px",
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "white",
                        fontSize: "48px",
                        fontWeight: "600",
                      }}
                    >
                      {adminInfo.fullName?.charAt(0)?.toUpperCase() ||
                        adminInfo.username?.charAt(0)?.toUpperCase() ||
                        "A"}
                    </div>
                  )}
                </div>
                <div className="col">
                  <h3 className="mb-2">
                    {adminInfo.fullName || adminInfo.username || "Admin"}
                  </h3>
                  <div className="mb-2">
                    {adminInfo.isSuperAdmin && (
                      <span className="badge bg-primary me-2">Super Admin</span>
                    )}
                    {getStatusBadge(adminInfo.status)}
                  </div>
                  {adminInfo.employeeNumber && (
                    <p className="text-muted mb-0">
                      <MdBadge className="me-1" />
                      Employee #{adminInfo.employeeNumber}
                    </p>
                  )}
                </div>
              </div>
            </CCardBody>
          </CCard>

          {/* Detailed Information */}
          <div className="row">
            <div className="col-md-6 mb-4">
              <CCard className="shadow-sm">
                <CCardHeader className="bg-primary text-white">
                  <h5 className="mb-0">
                    <MdPerson className="me-2" />
                    Thông tin cá nhân
                  </h5>
                </CCardHeader>
                <CCardBody>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <MdAccountCircle className="me-2 text-primary" size={20} />
                      <strong className="me-2">Username:</strong>
                    </div>
                    <p className="ms-4 mb-0">{adminInfo.username || "N/A"}</p>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <MdPerson className="me-2 text-primary" size={20} />
                      <strong className="me-2">Họ và tên:</strong>
                    </div>
                    <p className="ms-4 mb-0">{adminInfo.fullName || "N/A"}</p>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <MdEmail className="me-2 text-primary" size={20} />
                      <strong className="me-2">Email:</strong>
                    </div>
                    <p className="ms-4 mb-0">{adminInfo.email || "N/A"}</p>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <MdPhone className="me-2 text-primary" size={20} />
                      <strong className="me-2">Số điện thoại:</strong>
                    </div>
                    <p className="ms-4 mb-0">{adminInfo.phoneNumber || "N/A"}</p>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <MdTransgender className="me-2 text-primary" size={20} />
                      <strong className="me-2">Giới tính:</strong>
                    </div>
                    <p className="ms-4 mb-0">{getGenderText(adminInfo.gender)}</p>
                  </div>
                </CCardBody>
              </CCard>
            </div>

            <div className="col-md-6 mb-4">
              <CCard className="shadow-sm">
                <CCardHeader className="bg-success text-white">
                  <h5 className="mb-0">
                    <MdBadge className="me-2" />
                    Thông tin tài khoản
                  </h5>
                </CCardHeader>
                <CCardBody>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <MdBadge className="me-2 text-success" size={20} />
                      <strong className="me-2">Mã nhân viên:</strong>
                    </div>
                    <p className="ms-4 mb-0">
                      {adminInfo.employeeNumber || "N/A"}
                    </p>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <MdCheckCircle className="me-2 text-success" size={20} />
                      <strong className="me-2">Trạng thái:</strong>
                    </div>
                    <div className="ms-4">{getStatusBadge(adminInfo.status)}</div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <MdPerson className="me-2 text-success" size={20} />
                      <strong className="me-2">Loại tài khoản:</strong>
                    </div>
                    <div className="ms-4">
                      {adminInfo.isSuperAdmin ? (
                        <span className="badge bg-primary">Super Admin</span>
                      ) : (
                        <span className="badge bg-info">Admin</span>
                      )}
                    </div>
                  </div>

                  {adminInfo.createdAt && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <MdCalendarToday className="me-2 text-success" size={20} />
                        <strong className="me-2">Ngày tạo:</strong>
                      </div>
                      <p className="ms-4 mb-0">
                        {formatDate(adminInfo.createdAt)}
                      </p>
                    </div>
                  )}

                  {adminInfo.updatedAt && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <MdCalendarToday className="me-2 text-success" size={20} />
                        <strong className="me-2">Cập nhật lần cuối:</strong>
                      </div>
                      <p className="ms-4 mb-0">
                        {formatDate(adminInfo.updatedAt)}
                      </p>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

