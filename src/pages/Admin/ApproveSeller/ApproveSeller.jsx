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
} from "@coreui/react";
import { getPendingSellers, approveSeller } from "../../../api/adminApi";

export default function ApproveSeller() {
  const [pendingSellers, setPendingSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [manualSellerId, setManualSellerId] = useState("");
  const [error, setError] = useState("");

  // Modal từ chối
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(null);

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

  return (
    <div>
      <h2 className="fw-semibold mb-4">Phê duyệt yêu cầu nâng cấp Seller</h2>

      {/* Ô nhập thủ công Seller ID */}
      <div className="d-flex align-items-end gap-2 mb-3">
        <div>
          <label className="form-label">Nhập Seller ID</label>
          <input
            className="form-control"
            type="number"
            value={manualSellerId}
            onChange={(e) => setManualSellerId(e.target.value)}
            placeholder="VD: 123"
          />
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-success"
            disabled={!manualSellerId}
            onClick={() =>
              handleDecision(
                Number(manualSellerId),
                "APPROVED",
                "Phê duyệt thành công"
              )
            }
          >
            Phê duyệt
          </button>
          <button
            className="btn btn-danger"
            disabled={!manualSellerId}
            onClick={() => onRejectClick({ sellerId: Number(manualSellerId) })}
          >
            Từ chối
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              setPage(0);
              loadPendingSellers(false);
            }}
          >
            Làm mới danh sách
          </button>
        </div>
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
                      <span className="badge bg-warning text-dark">
                        {r.status}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          disabled={submittingId === r.sellerId}
                          onClick={() => onApprove(r)}
                        >
                          Phê duyệt
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={submittingId === r.sellerId}
                          onClick={() => onRejectClick(r)}
                        >
                          Từ chối
                        </button>
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
    </div>
  );
}
