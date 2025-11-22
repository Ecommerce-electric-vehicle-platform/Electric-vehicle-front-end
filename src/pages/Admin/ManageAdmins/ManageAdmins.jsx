import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CBadge,
  CButton,
  CPagination,
  CPaginationItem,
  CAlert,
} from "@coreui/react";
import { Eye, X, ChevronLeft, ChevronRight, ShieldX, Power, PowerOff, CheckCircle } from "lucide-react";
import { getAdminList, getAdminProfileById, blockAccount } from "../../../api/adminApi";
import adminAxios from "../../../api/adminAxios";
import "./ManageAdmins.css";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(null); // null = đang kiểm tra
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [adminToToggle, setAdminToToggle] = useState(null);
  const [toggleReason, setToggleReason] = useState("");
  const [isToggling, setIsToggling] = useState(false);
  
  // Modal thông báo thành công
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    gender: "MALE",
    avatarFile: null,
  });
  const fileInputRef = useRef(null);
  const [isSelectingFile, setIsSelectingFile] = useState(false);

  const random10Digits = () =>
    Math.floor(1000000000 + Math.random() * 9000000000).toString();

  // Load danh sách admin từ API
  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminList(page, size);
      
      console.log("Admin list response:", response);
      
      // Xử lý response - có thể có cấu trúc khác nhau
      let adminList = [];
      if (response?.data) {
        // Nếu response có data là array
        if (Array.isArray(response.data)) {
          adminList = response.data;
          setTotalPages(Math.ceil(response.data.length / size));
        } 
        // Nếu response có data với content và pagination
        else if (response.data.content) {
          adminList = response.data.content || [];
          setTotalPages(response.data.totalPages || 0);
        }
        // Nếu response.data là object với list
        else if (response.data.list) {
          adminList = response.data.list || [];
          setTotalPages(response.data.totalPages || 0);
        }
      } else if (Array.isArray(response)) {
        // Nếu response trực tiếp là array
        adminList = response;
        setTotalPages(Math.ceil(response.length / size));
      }
      
      // Normalize dữ liệu: map status từ API thành active field
      const normalizedAdmins = adminList.map(admin => ({
        ...admin,
        // Nếu có status từ API, map thành active
        active: admin.status === "ACTIVE" ? true : 
                admin.status === "INACTIVE" ? false :
                admin.active !== undefined ? admin.active : 
                admin.status !== "INACTIVE" // Mặc định là true nếu không phải INACTIVE
      }));
      
      setAdmins(normalizedAdmins);
    } catch (err) {
      console.error("Lỗi khi load danh sách admin:", err);
      setError(err?.response?.data?.message || "Không thể tải danh sách admin.");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  // Load chi tiết admin profile
  const loadAdminDetail = async (accountId) => {
    try {
      setLoadingDetail(true);
      const response = await getAdminProfileById(accountId);
      console.log("Admin detail response:", response);
      setSelectedAdmin(response?.data || response);
    } catch (err) {
      console.error("Lỗi khi load chi tiết admin:", err);
      alert(err?.response?.data?.message || "Không thể tải thông tin admin.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Mở modal xác nhận vô hiệu hóa/kích hoạt lại
  const handleToggleActiveClick = (admin) => {
    setAdminToToggle(admin);
    // Kiểm tra status từ API hoặc active field
    const isActive = admin.status === "ACTIVE" || 
                     (admin.status !== "INACTIVE" && admin.active !== false);
    const defaultReason = isActive 
      ? "Vi phạm hợp đồng hoặc nghỉ làm" 
      : "Đã giải quyết vấn đề, kích hoạt lại tài khoản";
    setToggleReason(defaultReason);
    setShowToggleModal(true);
  };

  // Vô hiệu hóa/Kích hoạt lại tài khoản admin
  const handleToggleActive = async () => {
    if (!adminToToggle) return;
    
    const accountId = adminToToggle.accountId || adminToToggle.id;
    // Kiểm tra status từ API hoặc active field
    const isActive = adminToToggle.status === "ACTIVE" || 
                     (adminToToggle.status !== "INACTIVE" && adminToToggle.active !== false);
    
    // Xác định action dựa vào trạng thái hiện tại
    const action = isActive ? "block" : "unblock";
    const actionText = isActive ? "vô hiệu hóa" : "kích hoạt lại";

    try {
      setIsToggling(true);
      setError("");
      console.log(`Bắt đầu ${actionText} admin:`, { accountId, action });
      
      const response = await blockAccount(
        accountId,
        "admin",
        toggleReason || "",
        action
      );
      
      console.log(`✅ API ${actionText} response:`, response);
      
      // Cập nhật state ngay lập tức
      setAdmins((prevAdmins) => {
        return prevAdmins.map((a) => {
          const aId = String(a.accountId || a.id || "");
          const targetId = String(accountId || "");
          
          if (aId === targetId) {
            const newActive = action === "unblock";
            const newStatus = newActive ? "ACTIVE" : "INACTIVE";
            return {
              ...a,
              active: newActive,
              status: newStatus, // Cập nhật cả status field
            };
          }
          return a;
        });
      });
      
      // Hiển thị modal thông báo thành công
      const isSuccess = response?.success === true || response?.message?.includes("SUCCESS");
      if (isSuccess) {
        setError("");
        // Đóng modal và reset
        setShowToggleModal(false);
        setAdminToToggle(null);
        setToggleReason("");
        
        // Hiển thị modal thông báo thành công
        setSuccessMessage(`Đã ${actionText} tài khoản Admin thành công!`);
        setShowSuccessModal(true);
        
        // Reload lại dữ liệu từ server sau khi block/unblock
        setTimeout(() => {
          loadAdmins();
        }, 500);
      } else {
        setError(`Đã ${actionText} tài khoản Admin nhưng có thể có lỗi gửi email. Vui lòng kiểm tra lại.`);
      }
      
    } catch (error) {
      console.error(`Lỗi khi ${actionText} admin:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || "Cập nhật trạng thái thất bại!";
      setError(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  // Kiểm tra quyền Super Admin khi component mount
  useEffect(() => {
    const checkSuperAdminPermission = () => {
      try {
        const adminProfileStr = localStorage.getItem("adminProfile");
        if (adminProfileStr) {
          const adminProfile = JSON.parse(adminProfileStr);
          const isSuper = adminProfile?.isSuperAdmin === true || 
                         adminProfile?.superAdmin === true || 
                         adminProfile?.is_super_admin === true;
          setIsSuperAdmin(isSuper);
        } else {
          // Nếu không có adminProfile, không phải super admin
          setIsSuperAdmin(false);
        }
      } catch (err) {
        console.error("Error checking super admin permission:", err);
        setIsSuperAdmin(false);
      }
    };
    
    checkSuperAdminPermission();
  }, []);

  // Load danh sách khi component mount hoặc page thay đổi (chỉ nếu là super admin)
  useEffect(() => {
    if (isSuperAdmin === true) {
      loadAdmins();
    }
  }, [isSuperAdmin, loadAdmins]);

  // Xử lý phím ESC để đóng modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && (showDetailModal || showCreate || showToggleModal)) {
        if (showDetailModal && !loadingDetail) setShowDetailModal(false);
        if (showCreate) setShowCreate(false);
        if (showToggleModal && !isToggling) {
          setShowToggleModal(false);
          setAdminToToggle(null);
          setToggleReason("");
          setError("");
        }
      }
    };

    if (showDetailModal || showCreate || showToggleModal) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showDetailModal, showCreate, showToggleModal, loadingDetail, isToggling]);

  // Gửi request dạng multipart/form-data
  const onCreate = async () => {
    if (!form.fullName || !form.email || !form.password || !form.phoneNumber) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Chuẩn bị formData để gửi lên BE
      const formData = new FormData();
      formData.append("employeeNumber", random10Digits());
      formData.append("password", form.password);
      formData.append("fullName", form.fullName);
      formData.append("phoneNumber", form.phoneNumber);
      formData.append("email", form.email);
      formData.append("gender", form.gender);
      if (form.avatarFile) {
        formData.append("avatar_url", form.avatarFile);
      } else {
        // Tạo blob rỗng để tránh lỗi "required"
        const emptyFile = new File([""], "empty.png", { type: "image/png" });
        formData.append("avatar_url", emptyFile);
      }

      await adminAxios.post("/api/v1/admin/creating-admin", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reload danh sách admin sau khi tạo thành công
      await loadAdmins();

      setForm({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
        gender: "MALE",
        avatarFile: null,
      });
      setShowCreate(false);
    } catch (e) {
      console.error("Lỗi khi tạo admin:", e);
      setError(e?.response?.data?.message || "Không thể tạo admin.");
    } finally {
      setLoading(false);
    }
  };

  // Nếu đang kiểm tra quyền, hiển thị loading
  if (isSuperAdmin === null) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang kiểm tra quyền...</span>
          </div>
          <p className="mt-3 text-muted">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Nếu không phải super admin, hiển thị thông báo
  if (isSuperAdmin === false) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <CAlert color="warning" className="d-flex align-items-center" style={{ padding: "2rem" }}>
              <ShieldX size={48} className="me-3" style={{ flexShrink: 0, color: "#ffc107" }} />
              <div>
                <h4 className="alert-heading mb-2">Không có quyền truy cập</h4>
                <p className="mb-0">
                  Bạn không phải quản trị viên hệ thống (super admin), không đủ quyền hạn để truy cập mục này.
                </p>
                <p className="mb-0 mt-2">
                  <small className="text-muted">
                    Vui lòng liên hệ với super admin nếu bạn cần quyền truy cập này.
                  </small>
                </p>
              </div>
            </CAlert>
          </div>
        </div>
      </div>
    );
  }

  // Nếu là super admin, hiển thị bình thường
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-semibold m-0">Quản lý Quản Trị Viên</h2>
        <button className="btn btn-primary create-admin-btn" onClick={() => setShowCreate(true)}>
        + Tạo Quản Trị Viên mới
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <CCard className="shadow-sm">
        <CCardBody>
          <CTable hover responsive>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Họ tên</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Số điện thoại</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                <CTableHeaderCell>Thao tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={6}>Đang tải...</CTableDataCell>
                </CTableRow>
              ) : admins.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6}>
                    Không có admin nào.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                admins.map((admin) => (
                  <CTableRow key={admin.accountId || admin.id}>
                    <CTableDataCell>{admin.accountId || admin.id}</CTableDataCell>
                    <CTableDataCell>{admin.fullName || "N/A"}</CTableDataCell>
                    <CTableDataCell>{admin.email || "N/A"}</CTableDataCell>
                    <CTableDataCell>{admin.phoneNumber || "N/A"}</CTableDataCell>
                    <CTableDataCell>
                      {(() => {
                        // Kiểm tra status từ API hoặc active field
                        const isActive = admin.status === "ACTIVE" || 
                                         (admin.status !== "INACTIVE" && admin.active !== false);
                        return (
                          <CBadge className={isActive ? "status-active-badge" : "status-inactive-badge"}>
                            {isActive ? "Active" : "Inactive"}
                          </CBadge>
                        );
                      })()}
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2 align-items-center">
                        <CButton
                          size="sm"
                          color="info"
                          variant="outline"
                          onClick={() => {
                            const accountId = admin.accountId || admin.id;
                            setSelectedAdmin(admin);
                            loadAdminDetail(accountId);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye size={14} className="me-1" />
                          Chi tiết
                        </CButton>
                        {(() => {
                          // Kiểm tra status từ API hoặc active field
                          const isAdminActive = admin.status === "ACTIVE" || 
                                                (admin.status !== "INACTIVE" && admin.active !== false);
                          return (
                            <CButton
                              size="sm"
                              color={isAdminActive ? "danger" : "success"}
                              variant="outline"
                              onClick={() => handleToggleActiveClick(admin)}
                              disabled={loading || isToggling}
                              title={isAdminActive ? "Vô hiệu hóa tài khoản admin" : "Kích hoạt lại tài khoản admin"}
                            >
                              {isAdminActive ? (
                                <>
                                  <PowerOff size={14} className="me-1" />
                                  Vô hiệu hóa
                                </>
                              ) : (
                                <>
                                  <Power size={14} className="me-1" />
                                  Kích hoạt lại
                                </>
                              )}
                            </CButton>
                          );
                        })()}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <CPagination>
                <CPaginationItem
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  style={{ cursor: page === 0 ? "not-allowed" : "pointer" }}
                >
                  <ChevronLeft size={16} />
                </CPaginationItem>
                {[...Array(totalPages)].map((_, idx) => (
                  <CPaginationItem
                    key={idx}
                    active={idx === page}
                    onClick={() => setPage(idx)}
                    style={{ cursor: "pointer" }}
                  >
                    {idx + 1}
                  </CPaginationItem>
                ))}
                <CPaginationItem
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  style={{ cursor: page >= totalPages - 1 ? "not-allowed" : "pointer" }}
                >
                  <ChevronRight size={16} />
                </CPaginationItem>
              </CPagination>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Modal tạo admin */}
      <CModal 
        visible={showCreate} 
        onClose={() => {
          // Chỉ đóng modal nếu không đang chọn file
          if (!isSelectingFile) {
            setShowCreate(false);
          }
        }}
        backdrop={!isSelectingFile ? true : "static"}
      >
        <CModalHeader>
          <CModalTitle>Tạo Quản Trị Viên mới</CModalTitle>
        </CModalHeader>
        <CModalBody onClick={(e) => e.stopPropagation()}>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="mb-3">
            <label className="form-label">Họ tên</label>
            <input
              className="form-control"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Số điện thoại</label>
            <input
              type="tel"
              className="form-control"
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Giới tính</label>
            <select
              className="form-select"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </div>

          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <label className="form-label">Ảnh đại diện (tuỳ chọn)</label>
            <input
              ref={fileInputRef}
              type="file"
              className="form-control"
              accept="image/*"
              onClick={(e) => {
                e.stopPropagation();
                setIsSelectingFile(true);

              }}
              onFocus={() => setIsSelectingFile(true)}
              onBlur={() => {
                // Delay để đảm bảo file picker đã đóng
                setTimeout(() => setIsSelectingFile(false), 300);
              }}
              onChange={(e) => {
                e.stopPropagation();
                const file = e.target.files[0];
                if (file) {
                  setForm({ ...form, avatarFile: file });
                }
                setIsSelectingFile(false);
              }}
            />
            {form.avatarFile && (
              <small className="text-success d-block mt-1">
                ✓ Đã chọn: {form.avatarFile.name}
              </small>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <button
            className="btn btn-secondary"
            onClick={() => setShowCreate(false)}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={onCreate}
            disabled={loading}
          >
            {loading ? "Đang tạo..." : "Tạo"}
          </button>
        </CModalFooter>
      </CModal>

      {/* Modal xác nhận vô hiệu hóa/kích hoạt lại */}
      <CModal visible={showToggleModal} onClose={() => !isToggling && setShowToggleModal(false)}>
        <CModalHeader>
          <CModalTitle>
            {adminToToggle && (() => {
              const isActive = adminToToggle.status === "ACTIVE" || 
                               (adminToToggle.status !== "INACTIVE" && adminToToggle.active !== false);
              return isActive ? "Vô hiệu hóa tài khoản Admin" : "Kích hoạt lại tài khoản Admin";
            })()}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}
          
          {adminToToggle && (
            <>
              <div className="mb-3">
                <strong>Thông tin Admin:</strong>
                <ul className="mt-2 mb-0">
                  <li><strong>Họ tên:</strong> {adminToToggle.fullName || "N/A"}</li>
                  <li><strong>Email:</strong> {adminToToggle.email || "N/A"}</li>
                  <li><strong>Trạng thái hiện tại:</strong> 
                    {(() => {
                      const isActive = adminToToggle.status === "ACTIVE" || 
                                       (adminToToggle.status !== "INACTIVE" && adminToToggle.active !== false);
                      return (
                        <CBadge className={`ms-2 ${isActive ? "status-active-badge" : "status-inactive-badge"}`}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </CBadge>
                      );
                    })()}
                  </li>
                </ul>
              </div>
              
              <div className="mb-3">
                {(() => {
                  const isActive = adminToToggle.status === "ACTIVE" || 
                                   (adminToToggle.status !== "INACTIVE" && adminToToggle.active !== false);
                  return (
                    <>
                      <label className="form-label">
                        <strong>Lý do {isActive ? "vô hiệu hóa" : "kích hoạt lại"}:</strong>
                        <span className="text-muted ms-1">(Bắt buộc)</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={toggleReason}
                        onChange={(e) => setToggleReason(e.target.value)}
                        placeholder={isActive 
                          ? "Nhập lý do vô hiệu hóa (ví dụ: Vi phạm hợp đồng, nghỉ làm, ...)" 
                          : "Nhập lý do kích hoạt lại (ví dụ: Đã giải quyết vấn đề, ...)"}
                        disabled={isToggling}
                        required
                      />
                      {!toggleReason.trim() && (
                        <small className="text-danger">Vui lòng nhập lý do để tiếp tục.</small>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {(() => {
                const isActive = adminToToggle.status === "ACTIVE" || 
                                 (adminToToggle.status !== "INACTIVE" && adminToToggle.active !== false);
                return isActive && (
                  <CAlert color="warning" className="mb-0">
                    <strong>Lưu ý:</strong> Khi vô hiệu hóa, admin này sẽ không thể đăng nhập vào hệ thống cho đến khi được kích hoạt lại.
                  </CAlert>
                );
              })()}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowToggleModal(false);
              setAdminToToggle(null);
              setToggleReason("");
              setError("");
            }}
            disabled={isToggling}
          >
            Hủy
          </CButton>
          <CButton
            color={adminToToggle && (() => {
              const isActive = adminToToggle.status === "ACTIVE" || 
                               (adminToToggle.status !== "INACTIVE" && adminToToggle.active !== false);
              return isActive ? "danger" : "success";
            })()}
            onClick={handleToggleActive}
            disabled={isToggling || !toggleReason.trim()}
          >
            {isToggling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang xử lý...
              </>
            ) : (
              <>
                {adminToToggle && (() => {
                  const isActive = adminToToggle.status === "ACTIVE" || 
                                   (adminToToggle.status !== "INACTIVE" && adminToToggle.active !== false);
                  return isActive ? (
                    <>
                      <PowerOff size={14} className="me-1" />
                      Xác nhận vô hiệu hóa
                    </>
                  ) : (
                    <>
                      <Power size={14} className="me-1" />
                      Xác nhận kích hoạt lại
                    </>
                  );
                })()}
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal hiển thị chi tiết admin */}
      {showDetailModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết thông tin Admin</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                {loadingDetail ? (
                  <div className="text-center py-4">Đang tải...</div>
                ) : selectedAdmin ? (
                  <div className="row mb-3">
                    <div className="col-12">
                      <h6 className="text-primary mb-3">Thông tin cơ bản</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <th style={{ width: "30%" }}>Account ID:</th>
                              <td>{selectedAdmin.accountId || selectedAdmin.id || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Employee Number:</th>
                              <td>{selectedAdmin.employeeNumber || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Họ tên:</th>
                              <td>{selectedAdmin.fullName || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Email:</th>
                              <td>{selectedAdmin.email || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Số điện thoại:</th>
                              <td>{selectedAdmin.phoneNumber || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Giới tính:</th>
                              <td>{selectedAdmin.gender || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Avatar URL:</th>
                              <td>
                                {selectedAdmin.avatarUrl ? (
                                  <a href={selectedAdmin.avatarUrl} target="_blank" rel="noopener noreferrer">
                                    Xem ảnh
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Trạng thái:</th>
                              <td>
                                {(() => {
                                  const isActive = selectedAdmin.status === "ACTIVE" || 
                                                   (selectedAdmin.status !== "INACTIVE" && selectedAdmin.active !== false);
                                  return (
                                    <CBadge className={isActive ? "status-active-badge" : "status-inactive-badge"}>
                                      {isActive ? "Active" : "Inactive"}
                                    </CBadge>
                                  );
                                })()}
                              </td>
                            </tr>
                            <tr>
                              <th>Ngày tạo:</th>
                              <td>
                                {selectedAdmin.createdAt
                                  ? new Date(selectedAdmin.createdAt).toLocaleDateString("vi-VN")
                                  : "N/A"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">Không có dữ liệu</div>
                )}
              </div>
              <div className="modal-footer">
                <CButton color="secondary" onClick={() => setShowDetailModal(false)}>
                  Đóng
                </CButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal thông báo thành công */}
      <CModal visible={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <CModalHeader>
          <CModalTitle>Thành công</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="text-center py-3">
            <CheckCircle size={48} className="text-success mb-3" />
            <p className="mb-0">{successMessage}</p>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="success" onClick={() => setShowSuccessModal(false)}>
            OK
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}

