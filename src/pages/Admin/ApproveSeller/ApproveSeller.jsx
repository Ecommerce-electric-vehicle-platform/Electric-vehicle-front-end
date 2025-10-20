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
} from "@coreui/react";
import { getPendingSellerPosts, approveSeller } from "../../../api/adminApi";

export default function ApproveSeller() {
  const [sellerRequests, setSellerRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [manualSellerId, setManualSellerId] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getPendingSellerPosts();
      const items = data?.content || data?.items || data || [];
      setSellerRequests(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onDecision = async (request, decision) => {
    try {
      setSubmittingId(request.id);
      let reason;
      if (decision === "REJECT") {
        reason = window.prompt(
          "Nhập lý do từ chối (gửi tới buyer/seller):",
          "Hồ sơ chưa đạt tiêu chí"
        );
        if (reason === null) return; // user canceled
      }
      await approveSeller(request.id || request.sellerId, decision, reason);
      await loadRequests();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div>
      <h2 className="fw-semibold mb-4">Phê duyệt yêu cầu nâng cấp Seller</h2>

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
            onClick={() => onDecision({ id: Number(manualSellerId) }, "OK")}
          >
            Phê duyệt (OK)
          </button>
          <button
            className="btn btn-danger"
            disabled={!manualSellerId}
            onClick={() => onDecision({ id: Number(manualSellerId) }, "REJECT")}
          >
            Từ chối (REJECT)
          </button>
          <button className="btn btn-outline-secondary" onClick={loadRequests}>
            Lấy danh sách buyer pending
          </button>
        </div>
      </div>

      <CCard className="shadow-sm">
        <CCardBody>
          <CTable hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Tên người dùng</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Ngày yêu cầu</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                <CTableHeaderCell>Thao tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={6}>Đang tải...</CTableDataCell>
                </CTableRow>
              ) : (
                sellerRequests.map((r) => (
                  <CTableRow key={r.id || r.sellerId}>
                    <CTableDataCell>{r.id || r.sellerId}</CTableDataCell>
                    <CTableDataCell>
                      {r.userName || r.fullName || r.name}
                    </CTableDataCell>
                    <CTableDataCell>{r.email}</CTableDataCell>
                    <CTableDataCell>
                      {r.requestDate || r.createdAt}
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className="badge bg-warning">Pending</span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          disabled={submittingId === (r.id || r.sellerId)}
                          onClick={() => onDecision(r, "OK")}
                        >
                          Phê duyệt
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={submittingId === (r.id || r.sellerId)}
                          onClick={() => onDecision(r, "REJECT")}
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
        </CCardBody>
      </CCard>
    </div>
  );
}
