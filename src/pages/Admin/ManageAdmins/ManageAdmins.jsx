import React, { useState } from "react";
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
import { createAdmin } from "../../../api/adminApi";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([
    // Dữ liệu tạm (mock)
    { id: 1, fullName: "Nguyễn Văn A", email: "admin1@example.com", active: true },
    { id: 2, fullName: "Trần Thị B", email: "admin2@example.com", active: true },
  ]);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Tạo admin mới
  const onCreate = async () => {
    if (!form.fullName || !form.email || !form.password) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await createAdmin({ ...form, isSuper: true });
      // Thêm vào danh sách hiển thị tạm
      setAdmins((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          fullName: form.fullName,
          email: form.email,
          active: true,
        },
      ]);
      setForm({ fullName: "", email: "", password: "" });
      setShowCreate(false);
    } catch (e) {
      console.error("Lỗi khi tạo admin:", e);
      setError(e?.message || "Không thể tạo admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-semibold m-0">Quản lý Admin</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          Tạo admin mới
        </button>
      </div>

      <CCard className="shadow-sm">
        <CCardBody>
          <CTable hover responsive>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Họ tên</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Quyền</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {admins.map((a) => (
                <CTableRow key={a.id}>
                  <CTableDataCell>{a.id}</CTableDataCell>
                  <CTableDataCell>{a.fullName}</CTableDataCell>
                  <CTableDataCell>{a.email}</CTableDataCell>
                  <CTableDataCell>
                    <span className="badge bg-info">is_super</span>
                  </CTableDataCell>
                  <CTableDataCell>
                    <span
                      className={`badge bg-${
                        a.active ? "success" : "secondary"
                      }`}
                    >
                      {a.active ? "Active" : "Inactive"}
                    </span>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Modal tạo admin mới */}
      <CModal visible={showCreate} onClose={() => setShowCreate(false)}>
        <CModalHeader>
          <CModalTitle>Tạo admin mới</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Họ tên</label>
            <input
              className="form-control"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nhập họ tên admin"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Nhập email admin"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Nhập mật khẩu"
            />
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
    </div>
  );
}
