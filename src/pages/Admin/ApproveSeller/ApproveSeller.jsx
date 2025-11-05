import React, { useEffect, useState } from "react";
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
  CButton,
} from "@coreui/react";
import {
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { getPendingSellers, approveSeller } from "../../../api/adminApi";
import "./ApproveSeller.css";

// Helper function để map status sang tiếng Việt
const mapStatusToVietnamese = (status) => {
  if (!status) return "N/A";
  const statusMap = {
    PENDING: "Đang chờ duyệt",
    ACCEPTED: "Đã chấp nhận",
    REJECTED: "Đã từ chối",
    APPROVED: "Đã phê duyệt",
    REJECT: "Đã từ chối",
  };
  return statusMap[status.toUpperCase()] || status;
};

export default function ApproveSeller() {
  const [pendingSellers, setPendingSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState("");

  // Modal từ chối
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Modal chi tiết
  const [detailModal, setDetailModal] = useState(false);
  const [detailSeller, setDetailSeller] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // ===== Lấy danh sách seller chờ duyệt =====
  const loadPendingSellers = async (append = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await getPendingSellers(page, 10);
      const items = res?.sellers || [];

      if (append) {
        setPendingSellers((prev) => [...prev, ...items]);
      } else {
        setPendingSellers(items);
      }

      // kiểm tra còn dữ liệu không
      const total = res?.totalElements || 0;
      const currentCount = append
        ? pendingSellers.length + items.length
        : items.length;
      setHasMore(currentCount < total);
    } catch (e) {
      console.error("Lỗi khi tải danh sách pending seller:", e);
      setError(e?.message || "Không thể tải danh sách.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingSellers(page > 0); // nếu page > 0 thì append
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ===== Hàm xử lý duyệt / từ chối =====
  const handleDecision = async (sellerId, decision, message) => {
    try {
      setSubmittingId(sellerId);
      setError("");
      await approveSeller({
        sellerId,
        decision,
        message,
      });

      // Hiển thị thông báo thành công
      if (decision === "APPROVED") {
        alert("Phê duyệt thành công! Buyer sẽ nhận được thông báo realtime.");
      } else {
        alert("Đã từ chối yêu cầu nâng cấp seller.");
      }

      // sau khi duyệt hoặc từ chối thì reload danh sách từ đầu
      setPage(0);
      loadPendingSellers(false);
    } catch (e) {
      console.error("Lỗi khi phê duyệt seller:", e);
      setError(e?.message || "Phê duyệt thất bại.");
    } finally {
      setSubmittingId(null);
    }
  };

  // ===== Khi nhấn "Phê duyệt" =====
  const onApprove = (seller) => {
    handleDecision(seller.sellerId, "APPROVED", "Phê duyệt thành công");
  };

  // ===== Khi nhấn "Từ chối" =====
  const onRejectClick = (seller) => {
    setSelectedSeller(seller);
    setRejectReason("");
    setRejectModal(true);
  };

  // ===== Xác nhận từ chối =====
  const confirmReject = () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối!");
      return;
    }
    handleDecision(selectedSeller.sellerId, "REJECTED", rejectReason);
    setRejectModal(false);
  };

  // ===== Xem chi tiết seller =====
  const onViewDetail = (seller) => {
    setDetailSeller(seller);
    setDetailModal(true);
  };

  return (
    <div>
      <h2 className="fw-semibold mb-4">
        Phê duyệt yêu cầu nâng cấp thành Người bán
      </h2>

      {/* Button làm mới danh sách */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div></div>
        <CButton
          className="refresh-btn"
          color="primary"
          variant="outline"
          onClick={() => {
            setPage(0);
            loadPendingSellers(false);
          }}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spinning" : ""} />
          <span className="ms-2">Làm mới danh sách</span>
        </CButton>
      </div>

      <CCard className="shadow-sm">
        <CCardBody>
          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}
          <CTable hover responsive>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Tên cửa hàng</CTableHeaderCell>
                <CTableHeaderCell>Mã số thuế</CTableHeaderCell>
                <CTableHeaderCell>Ngày tạo</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                <CTableHeaderCell>Thao tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading && page === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6}>Đang tải...</CTableDataCell>
                </CTableRow>
              ) : pendingSellers.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={6}>
                    Không có yêu cầu nâng cấp nào đang chờ duyệt.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                pendingSellers.map((r) => (
                  <CTableRow key={r.sellerId}>
                    <CTableDataCell>{r.sellerId}</CTableDataCell>
                    <CTableDataCell>{r.storeName || "Không có"}</CTableDataCell>
                    <CTableDataCell>{r.taxNumber || "N/A"}</CTableDataCell>
                    <CTableDataCell>
                      {r.createAt
                        ? new Date(r.createAt).toLocaleString("vi-VN")
                        : "--"}
                    </CTableDataCell>
                    <CTableDataCell>
                      <span 
                        className="badge status-pending-badge"
                        style={{
                          backgroundColor: '#f59e0b',
                          backgroundImage: 'none',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.35em 0.65em',
                          fontSize: '0.875em',
                          fontWeight: 600,
                          borderRadius: '0.375rem'
                        }}
                      >
                        {mapStatusToVietnamese(r.status)}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2">
                        <CButton
                          size="sm"
                          color="success"
                          variant="outline"
                          disabled={submittingId === r.sellerId}
                          onClick={() => onApprove(r)}
                        >
                          <CheckCircle size={14} className="me-1" />
                          Phê duyệt
                        </CButton>
                        <CButton
                          size="sm"
                          color="danger"
                          variant="outline"
                          disabled={submittingId === r.sellerId}
                          onClick={() => onRejectClick(r)}
                        >
                          <XCircle size={14} className="me-1" />
                          Từ chối
                        </CButton>
                        <CButton
                          size="sm"
                          color="info"
                          variant="outline"
                          onClick={() => onViewDetail(r)}
                        >
                          <Eye size={14} className="me-1" />
                          Chi tiết
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
          {/* Nút tải thêm */}
          {hasMore && !loading && (
            <div className="text-center mt-3">
              <button
                className="btn btn-outline-primary"
                onClick={() => setPage((prev) => prev + 1)}
              >
                Tải thêm dữ liệu
              </button>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Modal nhập lý do từ chối */}
      <CModal
        visible={rejectModal}
        onClose={() => setRejectModal(false)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Lý do từ chối</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <label className="form-label">Nhập lý do từ chối:</label>
          <textarea
            className="form-control"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ví dụ: Giấy tờ không hợp lệ, thông tin cửa hàng sai..."
          ></textarea>
        </CModalBody>
        <CModalFooter>
          <button
            className="btn btn-secondary"
            onClick={() => setRejectModal(false)}
          >
            Hủy
          </button>
          <button className="btn btn-danger" onClick={confirmReject}>
            Xác nhận từ chối
          </button>
        </CModalFooter>
      </CModal>

      {/* Modal chi tiết seller */}
      <CModal
        visible={detailModal}
        onClose={() => setDetailModal(false)}
        alignment="center"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Chi tiết Người bán</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {detailSeller ? (
            <div>
              <h5 className="fw-bold mb-3">{detailSeller.storeName}</h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>ID Người bán:</strong> {detailSeller.sellerId}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Trạng thái:</strong>{" "}
                    <span 
                      className="badge status-pending-badge"
                      style={{
                        backgroundColor: '#f59e0b',
                        backgroundImage: 'none',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.35em 0.65em',
                        fontSize: '0.875em',
                        fontWeight: 600,
                        borderRadius: '0.375rem'
                      }}
                    >
                      {mapStatusToVietnamese(detailSeller.status)}
                    </span>
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Tên người bán:</strong>{" "}
                    {detailSeller.sellerName || "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Quốc tịch:</strong>{" "}
                    {detailSeller.nationality || "N/A"}
                  </p>
                </div>
                <div className="col-12">
                  <p className="mb-2">
                    <strong>Mã số thuế:</strong>{" "}
                    {detailSeller.taxNumber || "N/A"}
                  </p>
                </div>
                <div className="col-12">
                  <p className="mb-2">
                    <strong>Địa chỉ:</strong> {detailSeller.home || "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Ngày tạo:</strong>{" "}
                    {detailSeller.createAt
                      ? new Date(detailSeller.createAt).toLocaleString("vi-VN")
                      : "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Ngày cập nhật:</strong>{" "}
                    {detailSeller.updateAt
                      ? new Date(detailSeller.updateAt).toLocaleString("vi-VN")
                      : "N/A"}
                  </p>
                </div>
              </div>

              <hr className="my-3" />

              {/* Giấy tờ và hình ảnh */}
              <h6 className="fw-bold mb-3">Giấy tờ và hình ảnh</h6>
              <div className="row g-3">
                {detailSeller.storePolicyUrl && (
                  <div className="col-12">
                    <p className="mb-1">
                      <strong>Chính sách cửa hàng:</strong>
                    </p>
                    <a
                      href={detailSeller.storePolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      Xem chính sách
                    </a>
                  </div>
                )}

                {detailSeller.identityFrontImageUrl && (
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>CMND/CCCD mặt trước:</strong>
                    </p>
                    <a
                      href={detailSeller.identityFrontImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={detailSeller.identityFrontImageUrl}
                        alt="CMND mặt trước"
                        className="img-fluid rounded border"
                        style={{ maxHeight: "200px", objectFit: "cover" }}
                      />
                    </a>
                  </div>
                )}

                {detailSeller.identityBackImageUrl && (
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>CMND/CCCD mặt sau:</strong>
                    </p>
                    <a
                      href={detailSeller.identityBackImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={detailSeller.identityBackImageUrl}
                        alt="CMND mặt sau"
                        className="img-fluid rounded border"
                        style={{ maxHeight: "200px", objectFit: "cover" }}
                      />
                    </a>
                  </div>
                )}

                {detailSeller.businessLicenseUrl && (
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Giấy phép kinh doanh:</strong>
                    </p>
                    <a
                      href={detailSeller.businessLicenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={detailSeller.businessLicenseUrl}
                        alt="Giấy phép kinh doanh"
                        className="img-fluid rounded border"
                        style={{ maxHeight: "200px", objectFit: "cover" }}
                      />
                    </a>
                  </div>
                )}

                {detailSeller.selfieUrl && (
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Ảnh selfie:</strong>
                    </p>
                    <a
                      href={detailSeller.selfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={detailSeller.selfieUrl}
                        alt="Ảnh selfie"
                        className="img-fluid rounded border"
                        style={{ maxHeight: "200px", objectFit: "cover" }}
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p>Không có dữ liệu chi tiết.</p>
          )}
        </CModalBody>
        <CModalFooter>
          <button
            className="btn btn-secondary"
            onClick={() => setDetailModal(false)}
          >
            Đóng
          </button>
        </CModalFooter>
      </CModal>
    </div>
  );
}
