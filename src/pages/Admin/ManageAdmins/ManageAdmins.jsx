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
import {
  listAdmins,
  createAdmin,
  toggleAdminActive,
} from "../../../api/adminApi";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await listAdmins();
      const items =
        data?.content ||
        data?.items ||
        data?.data?.content ||
        data?.data?.items ||
        data?.data ||
        data ||
        [];
      setAdmins(items);
    } catch (e) {
      console.error("Lỗi load danh sách admin:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const onCreate = async () => {
    if (!form.fullName || !form.email || !form.password) return;
    try {
      await createAdmin({ ...form, isSuper: true });
      setShowCreate(false);
      setForm({ fullName: "", email: "", password: "" });
      fetchAdmins();
    } catch (e) {
      console.error(e);
    }
  };

  const onToggleActive = async (admin) => {
    try {
      await toggleAdminActive(admin.id, !admin.active);
      fetchAdmins();
    } catch (e) {
      console.error(e);
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
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Họ tên</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Quyền</CTableHeaderCell>
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
                admins.map((a) => (
                  <CTableRow key={a.id}>
                    <CTableDataCell>{a.id}</CTableDataCell>
                    <CTableDataCell>{a.fullName || a.name}</CTableDataCell>
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
                    <CTableDataCell>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => onToggleActive(a)}
                        >
                          {a.active ? "Vô hiệu hóa" : "Kích hoạt"}
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

      <CModal visible={showCreate} onClose={() => setShowCreate(false)}>
        <CModalHeader>
          <CModalTitle>Tạo admin is_super</CModalTitle>
        </CModalHeader>
        <CModalBody>
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
        </CModalBody>
        <CModalFooter>
          <button
            className="btn btn-secondary"
            onClick={() => setShowCreate(false)}
          >
            Hủy
          </button>
          <button className="btn btn-primary" onClick={onCreate}>
            Tạo
          </button>
        </CModalFooter>
      </CModal>
    </div>
  );
}
