import React from "react";
import {
  CCard,
  CCardBody,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
} from "@coreui/react";

export default function Requests() {
  const rows = [
    {
      id: 1,
      type: "Upgrade Seller",
      user: "john@example.com",
      status: "Pending",
    },
    { id: 2, type: "Report Post", user: "anna@example.com", status: "Pending" },
  ];
  return (
    <CCard className="shadow-sm">
      <CCardBody>
        <CTable hover>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>ID</CTableHeaderCell>
              <CTableHeaderCell>Type</CTableHeaderCell>
              <CTableHeaderCell>User</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {rows.map((r) => (
              <CTableRow key={r.id}>
                <CTableDataCell>{r.id}</CTableDataCell>
                <CTableDataCell>{r.type}</CTableDataCell>
                <CTableDataCell>{r.user}</CTableDataCell>
                <CTableDataCell>
                  <CBadge color="warning">{r.status}</CBadge>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  );
}
