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
  CBadge,
} from "@coreui/react";
import { getAllUserAccounts, toggleUserActive } from "../../../api/adminApi";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState(""); // "BUYER" | "SELLER"
  const [refresh, setRefresh] = useState(false);

  // ✅ Load danh sách Buyer & Seller
  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUserAccounts(0, 20, filterRole);
      const items = data?.content || data?.data || data || [];
      setUsers(items);
    } catch (e) {
      console.error("Lỗi khi tải danh sách người dùng:", e);
      setError(e?.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filterRole, refresh]);

  // ✅ Bật / tắt trạng thái người dùng
  const handleToggleActive = async (user) => {
    const confirmText = user.active
      ? "Bạn có chắc muốn vô hiệu hóa tài khoản này?"
      : "Bạn có chắc muốn kích hoạt lại tài khoản này?";
    if (!window.confirm(confirmText)) return;

    try {
      await toggleUserActive(user.id, !user.active);
      setRefresh((prev) => !prev);
    } catch (error) {
      alert("Cập nhật trạng thái thất bại!");
      console.error(error);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-semibold m-0">Quản lý Buyer & Seller</h2>
        <select
          className="form-select w-auto"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
        </select>
      </div>

      <CCard className="shadow-sm mb-4">
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
                <CTableHeaderCell>Tên người dùng</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Vai trò</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                <CTableHeaderCell>Ngày tham gia</CTableHeaderCell>
                <CTableHeaderCell>Thao tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={7}>Đang tải...</CTableDataCell>
                </CTableRow>
              ) : users.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7}>
                    Không có người dùng nào.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                users.map((user) => (
                  <CTableRow key={user.id}>
                    <CTableDataCell>{user.id}</CTableDataCell>
                    <CTableDataCell>{user.fullName || user.username}</CTableDataCell>
                    <CTableDataCell>{user.email}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge
                        color={user.role === "SELLER" ? "success" : "secondary"}
                      >
                        {user.role || "BUYER"}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={user.active ? "success" : "danger"}>
                        {user.active ? "Active" : "Inactive"}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                        : "--"}
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.active ? "Vô hiệu hóa" : "Kích hoạt lại"}
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
