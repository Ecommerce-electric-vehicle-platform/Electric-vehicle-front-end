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
import adminAxios from "../../../api/adminAxios";
import "./ManageAdmins.css";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    gender: "MALE",
    avatarFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const random10Digits = () =>
    Math.floor(1000000000 + Math.random() * 9000000000).toString();

  // Gửi request dạng multipart/form-data
  const onCreate = async () => {
    if (!form.fullName || !form.email || !form.password || !form.phoneNumber) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Chuẩn bị formData để gửi lên BE
      const formData = new FormData();
      formData.append("employeeNumber", random10Digits());
      formData.append("password", form.password);
      formData.append("fullName", form.fullName);
      formData.append("phoneNumber", form.phoneNumber);
      formData.append("email", form.email);
      formData.append("gender", form.gender);
      if (form.avatarFile) {
        formData.append("avatar_url", form.avatarFile);
      } else {
        // Tạo blob rỗng để tránh lỗi "required"
        const emptyFile = new File([""], "empty.png", { type: "image/png" });
        formData.append("avatar_url", emptyFile);
      }

      await adminAxios.post("/api/v1/admin/creating-admin", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAdmins((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          fullName: form.fullName,
          email: form.email,
          active: true,
        },
      ]);

      setForm({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
        gender: "MALE",
        avatarFile: null,
      });
      setShowCreate(false);
    } catch (e) {
      console.error("Lỗi khi tạo admin:", e);
      setError(e?.response?.data?.message || "Không thể tạo admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-semibold m-0">Quản lý Quản Trị Viên</h2>
        <button className="btn btn-primary create-admin-btn" onClick={() => setShowCreate(true)}>
        + Tạo Quản Trị Viên mới
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
                    <span className="badge bg-success">Active</span>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Modal tạo admin */}
      <CModal visible={showCreate} onClose={() => setShowCreate(false)}>
        <CModalHeader>
          <CModalTitle>Tạo Quản Trị Viên mới</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && <div className="alert alert-danger">{error}</div>}

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

          <div className="mb-3">
            <label className="form-label">Số điện thoại</label>
            <input
              type="tel"
              className="form-control"
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Giới tính</label>
            <select
              className="form-select"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Ảnh đại diện (tuỳ chọn)</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, avatarFile: e.target.files[0] })
              }
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
