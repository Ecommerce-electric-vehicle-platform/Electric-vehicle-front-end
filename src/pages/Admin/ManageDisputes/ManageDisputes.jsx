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
  CBadge,
  CButton,
  CFormSelect,
} from "@coreui/react";
import { listDisputes, resolveDispute } from "../../../api/adminApi";

export default function ManageDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("OPEN");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listDisputes(0, 20, filter);
      const items = data?.content || data?.items || data || [];
      setDisputes(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const onResolve = async (d, decision) => {
    try {
      await resolveDispute(d.id, { decision });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-semibold m-0">Quản lý tranh chấp</h2>
        <CFormSelect
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </CFormSelect>
      </div>

      <CCard className="shadow-sm">
        <CCardBody>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Order</CTableHeaderCell>
                <CTableHeaderCell>Buyer</CTableHeaderCell>
                <CTableHeaderCell>Seller</CTableHeaderCell>
                <CTableHeaderCell>Reason</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={7}>Đang tải...</CTableDataCell>
                </CTableRow>
              ) : (
                disputes.map((d) => (
                  <CTableRow key={d.id}>
                    <CTableDataCell>{d.id}</CTableDataCell>
                    <CTableDataCell>#{d.orderCode || d.orderId}</CTableDataCell>
                    <CTableDataCell>{d.buyerName}</CTableDataCell>
                    <CTableDataCell>{d.sellerName}</CTableDataCell>
                    <CTableDataCell>{d.reason}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge
                        color={
                          d.status === "OPEN"
                            ? "warning"
                            : d.status === "RESOLVED"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {d.status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2">
                        <CButton
                          size="sm"
                          color="success"
                          variant="outline"
                          onClick={() => onResolve(d, "RESOLVED")}
                        >
                          Chấp nhận
                        </CButton>
                        <CButton
                          size="sm"
                          color="danger"
                          variant="outline"
                          onClick={() => onResolve(d, "REJECTED")}
                        >
                          Từ chối
                        </CButton>
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
