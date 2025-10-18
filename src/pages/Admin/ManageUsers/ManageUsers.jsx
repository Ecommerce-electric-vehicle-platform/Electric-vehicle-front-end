import React, { useState, useEffect } from "react";
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
import { getPendingBuyers } from "../../../api/adminApi";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // TODO: Fetch users from API
    // Temporary mock data
    setUsers([
      {
        id: 1,
        userName: "John Doe",
        email: "john@example.com",
        role: "User",
        status: "Active",
        joinDate: "2025-10-18",
      },
    ]);
  }, []);

  const [pendingBuyers, setPendingBuyers] = useState([]);

  const loadPendingBuyers = async () => {
    // optional: show loading in future
    try {
      const data = await getPendingBuyers(0, 10);
      const items = data?.content || data?.items || data || [];
      setPendingBuyers(items);
    } catch (e) {
      console.error(e);
    } finally {
      // noop
    }
  };

  return (
    <div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-semibold m-0">Quản lý người dùng</h2>
      </div>

      <CCard className="shadow-sm mb-4">
        <CCardBody>
          <CTable hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Tên người dùng</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Vai trò</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                <CTableHeaderCell>Ngày tham gia</CTableHeaderCell>
                <CTableHeaderCell>Thao tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {users.map((user) => (
                <CTableRow key={user.id}>
                  <CTableDataCell>{user.id}</CTableDataCell>
                  <CTableDataCell>{user.userName}</CTableDataCell>
                  <CTableDataCell>{user.email}</CTableDataCell>
                  <CTableDataCell>{user.role}</CTableDataCell>
                  <CTableDataCell>
                    <span
                      className={`badge bg-${
                        user.status === "Active" ? "success" : "danger"
                      }`}
                    >
                      {user.status}
                    </span>
                  </CTableDataCell>
                  <CTableDataCell>{user.joinDate}</CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex gap-2">
                      <button className="btn btn-warning btn-sm">
                        Chỉnh sửa
                      </button>
                      <button className="btn btn-danger btn-sm">
                        Vô hiệu hóa
                      </button>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {pendingBuyers.length > 0 && (
        <CCard className="shadow-sm">
          <CCardBody>
            <h5 className="fw-semibold mb-3">Buyer chờ duyệt</h5>
            <CTable hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>ID</CTableHeaderCell>
                  <CTableHeaderCell>Tên</CTableHeaderCell>
                  <CTableHeaderCell>Email</CTableHeaderCell>
                  <CTableHeaderCell>Ngày đăng ký</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {pendingBuyers.map((b) => (
                  <CTableRow key={b.id}>
                    <CTableDataCell>{b.id}</CTableDataCell>
                    <CTableDataCell>{b.fullName || b.name}</CTableDataCell>
                    <CTableDataCell>{b.email}</CTableDataCell>
                    <CTableDataCell>{b.createdAt || b.joinDate}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}
    </div>
  );
}
