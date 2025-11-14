import React, { useState, useEffect, useCallback } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CSpinner,
  CAlert,
  CPagination,
  CPaginationItem,
} from "@coreui/react";
import {
  RefreshCw,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import {
  getEscrowRecords,
  getSolvedSystemWallets,
  updateEscrowEndAt,
} from "../../../api/adminApi";
import "./SystemWallets.css";

export default function SystemWallets() {
  const [activeTab, setActiveTab] = useState("hold"); // "hold" hoặc "solved"
  const [records, setRecords] = useState([]);
  const [solvedRecords, setSolvedRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [solvedPage, setSolvedPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [solvedTotalPages, setSolvedTotalPages] = useState(0);
  const [solvedTotalElements, setSolvedTotalElements] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [endAt, setEndAt] = useState("");
  const [endAtError, setEndAtError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Kiểm tra quyền Super Admin
  useEffect(() => {
    const checkSuperAdmin = () => {
      try {
        const adminRole = localStorage.getItem("adminRole");
        if (adminRole === "SUPER_ADMIN") {
          setIsSuperAdmin(true);
          return;
        }

        const adminProfileStr = localStorage.getItem("adminProfile");
        if (adminProfileStr) {
          const adminProfile = JSON.parse(adminProfileStr);
          const isSuper =
            adminProfile?.isSuperAdmin === true ||
            adminProfile?.superAdmin === true ||
            adminProfile?.is_super_admin === true;
          setIsSuperAdmin(isSuper);
        }
      } catch (err) {
        console.error("Error checking super admin:", err);
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();
  }, []);

  // Fetch escrow records (hold)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await getEscrowRecords(page, size);
      const responseData = response?.data?.data || response?.data || response;
      const content = responseData?.content || [];
      const totalPagesData = responseData?.totalPages || 0;
      const totalElementsData = responseData?.totalElements || 0;

      setRecords(Array.isArray(content) ? content : []);
      setTotalPages(totalPagesData);
      setTotalElements(totalElementsData);
    } catch (err) {
      console.error("Error fetching escrow records:", err);
      setError(
        err?.response?.data?.message ||
          "Không thể tải danh sách escrow records. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  // Fetch solved system wallets
  const fetchSolvedData = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await getSolvedSystemWallets(solvedPage, size);
      const responseData = response?.data?.data || response?.data || response;
      const content = responseData?.content || [];
      const totalPagesData = responseData?.totalPages || 0;
      const totalElementsData = responseData?.totalElements || 0;

      setSolvedRecords(Array.isArray(content) ? content : []);
      setSolvedTotalPages(totalPagesData);
      setSolvedTotalElements(totalElementsData);
    } catch (err) {
      console.error("Error fetching solved system wallets:", err);
      setError(
        err?.response?.data?.message ||
          "Không thể tải danh sách solved wallets. Vui lòng thử lại sau."
      );
      setSolvedRecords([]);
    } finally {
      setLoading(false);
    }
  }, [solvedPage, size]);

  useEffect(() => {
    if (activeTab === "hold") {
      fetchData();
    } else {
      fetchSolvedData();
    }
  }, [activeTab, fetchData, fetchSolvedData]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "ESCROW_HOLD":
        return <CBadge className="status-holding-badge">Đang giữ</CBadge>;
      case "IS_SOLVED":
        return <CBadge color="success">Đã giải quyết</CBadge>;
      default:
        return <CBadge color="secondary">{status}</CBadge>;
    }
  };

  // Convert LocalDateTime format (YYYY-MM-DDTHH:mm:ss) to datetime-local input format (YYYY-MM-DDTHH:mm)
  const convertToDateTimeLocal = (localDateTimeString) => {
    if (!localDateTimeString) return "";
    
    // Backend trả về LocalDateTime format: "YYYY-MM-DDTHH:mm:ss" hoặc "YYYY-MM-DDTHH:mm:ss.SSS"
    // datetime-local input cần: "YYYY-MM-DDTHH:mm"
    // Chỉ cần lấy phần YYYY-MM-DDTHH:mm, bỏ phần seconds và milliseconds
    if (typeof localDateTimeString === "string" && localDateTimeString.includes("T")) {
      // Tách date và time
      const parts = localDateTimeString.split("T");
      if (parts.length === 2) {
        const datePart = parts[0]; // YYYY-MM-DD
        const timePart = parts[1]; // HH:mm:ss hoặc HH:mm:ss.SSS
        
        // Lấy HH:mm (bỏ seconds và milliseconds)
        const timeParts = timePart.split(":");
        if (timeParts.length >= 2) {
          const hours = timeParts[0];
          const minutes = timeParts[1];
          return `${datePart}T${hours}:${minutes}`;
        }
      }
    }
    
    // Fallback: nếu format khác, thử parse qua Date (nhưng giữ local time)
    try {
      const date = new Date(localDateTimeString);
      if (!isNaN(date.getTime())) {
        // Format: YYYY-MM-DDTHH:mm (local time, không convert sang UTC)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    } catch (err) {
      console.error("Error parsing date:", err);
    }
    
    return "";
  };

  // Handle open update modal
  const handleOpenUpdateModal = (record) => {
    if (!isSuperAdmin) {
      alert("Chỉ Super Admin mới có thể cập nhật endAt!");
      return;
    }

    if (record.status !== "ESCROW_HOLD") {
      alert("Chỉ có thể cập nhật endAt cho escrow records có status ESCROW_HOLD!");
      return;
    }

    setSelectedRecord(record);
    // Convert LocalDateTime từ backend sang datetime-local input format
    setEndAt(convertToDateTimeLocal(record.endAt));
    setEndAtError("");
    setShowUpdateModal(true);
  };

  // Format datetime-local value to LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
  const formatToLocalDateTime = (datetimeLocalValue) => {
    // datetime-local input format: "YYYY-MM-DDTHH:mm"
    // LocalDateTime format: "YYYY-MM-DDTHH:mm:ss"
    // Chỉ cần thêm ":00" vào cuối
    if (!datetimeLocalValue) return null;
    return datetimeLocalValue + ":00";
  };

  // Handle update endAt
  const handleUpdateEndAt = async () => {
    if (!selectedRecord) return;

    // Validation
    if (!endAt) {
      setEndAtError("Vui lòng nhập thời gian endAt!");
      return;
    }

    // Convert datetime-local to Date for validation
    const endAtDate = new Date(endAt);
    const createdAtDate = new Date(selectedRecord.createdAt);

    if (endAtDate <= createdAtDate) {
      setEndAtError("endAt phải sau createdAt!");
      return;
    }

    setUpdating(true);
    setEndAtError("");
    try {
      // Format endAt to LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
      // Không dùng toISOString() vì nó thêm timezone Z, LocalDateTime không nhận được
      const endAtLocalDateTime = formatToLocalDateTime(endAt);
      console.log("Sending endAt to backend:", endAtLocalDateTime);
      await updateEscrowEndAt(selectedRecord.id, endAtLocalDateTime);
      setSuccess("Cập nhật endAt thành công!");
      setShowUpdateModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error updating endAt:", err);
      setEndAtError(
        err?.response?.data?.message ||
          "Không thể cập nhật endAt. Vui lòng thử lại sau."
      );
    } finally {
      setUpdating(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (activeTab === "hold") {
      if (newPage >= 0 && newPage < totalPages) {
        setPage(newPage);
      }
    } else {
      if (newPage >= 0 && newPage < solvedTotalPages) {
        setSolvedPage(newPage);
      }
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === "hold") {
      fetchData();
    } else {
      fetchSolvedData();
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "hold") {
      setPage(0);
    } else {
      setSolvedPage(0);
    }
  };

  return (
    <div className="system-wallets-page">
      <CCard className="shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Quản lý Ví Hệ Thống (Ký quỹ)</h4>
            <p className="text-muted mb-0 small">
            Quản lý các giao dịch đang được hệ thống giữ tiền chờ giải ngân
            </p>
          </div>
          <CButton
            color="secondary"
            onClick={handleRefresh}
            disabled={loading}
            className="refresh-btn-compact"
          >
            <RefreshCw size={16} />
            Làm mới
          </CButton>
        </CCardHeader>
        <CCardBody>
          {/* Tabs */}
          <div className="d-flex mb-4 border-bottom">
            <button
              className={`btn btn-link text-decoration-none px-3 py-2 ${
                activeTab === "hold" ? "active border-bottom border-primary border-2" : "text-muted"
              }`}
              onClick={() => handleTabChange("hold")}
              style={{
                border: "none",
                background: "none",
                borderBottom: activeTab === "hold" ? "2px solid #0d6efd" : "none",
                color: activeTab === "hold" ? "#0d6efd" : "#6c757d",
                fontWeight: activeTab === "hold" ? "600" : "400",
              }}
            >
              Đang giữ ({totalElements})
            </button>
            <button
              className={`btn btn-link text-decoration-none px-3 py-2 ${
                activeTab === "solved" ? "active border-bottom border-primary border-2" : "text-muted"
              }`}
              onClick={() => handleTabChange("solved")}
              style={{
                border: "none",
                background: "none",
                borderBottom: activeTab === "solved" ? "2px solid #0d6efd" : "none",
                color: activeTab === "solved" ? "#0d6efd" : "#6c757d",
                fontWeight: activeTab === "solved" ? "600" : "400",
              }}
            >
              Đã giải quyết ({solvedTotalElements})
            </button>
          </div>

          {error && (
            <CAlert color="danger" dismissible onClose={() => setError("")}>
              {error}
            </CAlert>
          )}
          {success && (
            <CAlert color="success" dismissible onClose={() => setSuccess("")}>
              {success}
            </CAlert>
          )}

          {loading ? (
            <div className="text-center p-5">
              <CSpinner color="primary" />
              <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : activeTab === "hold" ? (
            records.length === 0 ? (
              <div className="text-center p-5">
                <p className="text-muted">Không có escrow records nào.</p>
              </div>
            ) : (
              <>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>ID</CTableHeaderCell>
                      <CTableHeaderCell>Order Code</CTableHeaderCell>
                      <CTableHeaderCell>Balance</CTableHeaderCell>
                      <CTableHeaderCell>Status</CTableHeaderCell>
                      <CTableHeaderCell>Created At</CTableHeaderCell>
                      <CTableHeaderCell>End At</CTableHeaderCell>
                      <CTableHeaderCell>Buyer Wallet ID</CTableHeaderCell>
                      <CTableHeaderCell>Seller Wallet ID</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {records.map((record) => (
                    <CTableRow key={record.id}>
                      <CTableDataCell>{record.id}</CTableDataCell>
                      <CTableDataCell>
                        {record.orderCode || "-"}
                      </CTableDataCell>
                      <CTableDataCell>
                        <span className="fw-bold text-success">
                          {formatCurrency(record.balance)}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>
                        {getStatusBadge(record.status)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatDate(record.createdAt)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatDate(record.endAt)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {record.buyerWalletId || "-"}
                      </CTableDataCell>
                      <CTableDataCell>
                        {record.sellerWalletId || "-"}
                      </CTableDataCell>
                      <CTableDataCell>
                        {isSuperAdmin &&
                          record.status === "ESCROW_HOLD" && (
                            <CButton
                              color="primary"
                              size="sm"
                              onClick={() => handleOpenUpdateModal(record)}
                              className="d-flex align-items-center gap-1"
                            >
                              <Edit size={14} />
                              Cập nhật
                            </CButton>
                          )}
                        {(!isSuperAdmin ||
                          record.status !== "ESCROW_HOLD") && (
                          <span className="text-muted">-</span>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <CPagination>
                    <CPaginationItem
                      disabled={page === 0}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      Trước
                    </CPaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <CPaginationItem
                        key={i}
                        active={i === page}
                        onClick={() => handlePageChange(i)}
                      >
                        {i + 1}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={page === totalPages - 1}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Sau
                    </CPaginationItem>
                  </CPagination>
                </div>
              )}

              <div className="mt-3 text-muted small text-center">
                Hiển thị {records.length} / {totalElements} records
              </div>
            </>
            )
          ) : solvedRecords.length === 0 ? (
            <div className="text-center p-5">
              <p className="text-muted">Không có solved wallets nào.</p>
            </div>
          ) : (
            <>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Order Code</CTableHeaderCell>
                    <CTableHeaderCell>Balance</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Created At</CTableHeaderCell>
                    <CTableHeaderCell>End At</CTableHeaderCell>
                    <CTableHeaderCell>Buyer Wallet ID</CTableHeaderCell>
                    <CTableHeaderCell>Seller Wallet ID</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {solvedRecords.map((record) => (
                    <CTableRow key={record.id}>
                      <CTableDataCell>{record.id}</CTableDataCell>
                      <CTableDataCell>
                        {record.orderCode || "-"}
                      </CTableDataCell>
                      <CTableDataCell>
                        <span className="fw-bold text-success">
                          {formatCurrency(record.balance)}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>
                        {getStatusBadge(record.status)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatDate(record.createdAt)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {formatDate(record.endAt)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {record.buyerWalletId || "-"}
                      </CTableDataCell>
                      <CTableDataCell>
                        {record.sellerWalletId || "-"}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {/* Pagination for solved */}
              {solvedTotalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <CPagination>
                    <CPaginationItem
                      disabled={solvedPage === 0}
                      onClick={() => handlePageChange(solvedPage - 1)}
                    >
                      Trước
                    </CPaginationItem>
                    {Array.from({ length: solvedTotalPages }, (_, i) => (
                      <CPaginationItem
                        key={i}
                        active={i === solvedPage}
                        onClick={() => handlePageChange(i)}
                      >
                        {i + 1}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={solvedPage === solvedTotalPages - 1}
                      onClick={() => handlePageChange(solvedPage + 1)}
                    >
                      Sau
                    </CPaginationItem>
                  </CPagination>
                </div>
              )}

              <div className="mt-3 text-muted small text-center">
                Hiển thị {solvedRecords.length} / {solvedTotalElements} records
              </div>
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Update EndAt Modal */}
      <CModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Cập nhật EndAt</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedRecord && (
            <div>
              <p className="mb-3">
                <strong>Record ID:</strong> {selectedRecord.id}
              </p>
              <p className="mb-3">
                <strong>Created At:</strong> {formatDate(selectedRecord.createdAt)}
              </p>
              <p className="mb-3">
                <strong>Current End At:</strong>{" "}
                {formatDate(selectedRecord.endAt)}
              </p>
              <CForm>
                <CFormLabel>
                  <strong>End At (mới)</strong>
                </CFormLabel>
                <CFormInput
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => {
                    setEndAt(e.target.value);
                    setEndAtError("");
                  }}
                  invalid={!!endAtError}
                />
                {endAtError && (
                  <div className="invalid-feedback d-block">
                    {endAtError}
                  </div>
                )}
                <div className="mt-2 text-muted small">
                  <strong>Lưu ý:</strong> endAt phải sau createdAt. Chỉ có thể
                  cập nhật khi status = ESCROW_HOLD.
                </div>
              </CForm>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowUpdateModal(false)}
            disabled={updating}
          >
            Hủy
          </CButton>
          <CButton
            color="primary"
            onClick={handleUpdateEndAt}
            disabled={updating || !endAt}
          >
            {updating ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Đang cập nhật...
              </>
            ) : (
              "Cập nhật"
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}

