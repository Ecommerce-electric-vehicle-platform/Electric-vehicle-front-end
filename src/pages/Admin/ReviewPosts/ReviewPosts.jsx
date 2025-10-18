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

export default function ReviewPosts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // TODO: Fetch posts from API
    // Temporary mock data
    setPosts([
      {
        id: 1,
        title: "Xe điện Model X",
        seller: "John Doe",
        postDate: "2025-10-18",
        status: "Pending",
      },
    ]);
  }, []);

  return (
    <div>
      <h2 className="fw-semibold mb-4">Duyệt bài đăng</h2>

      <CCard className="shadow-sm">
        <CCardBody>
          <CTable hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Tiêu đề</CTableHeaderCell>
                <CTableHeaderCell>Người đăng</CTableHeaderCell>
                <CTableHeaderCell>Ngày đăng</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                <CTableHeaderCell>Thao tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {posts.map((post) => (
                <CTableRow key={post.id}>
                  <CTableDataCell>{post.id}</CTableDataCell>
                  <CTableDataCell>{post.title}</CTableDataCell>
                  <CTableDataCell>{post.seller}</CTableDataCell>
                  <CTableDataCell>{post.postDate}</CTableDataCell>
                  <CTableDataCell>
                    <span className="badge bg-warning">{post.status}</span>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex gap-2">
                      <button className="btn btn-success btn-sm">
                        Phê duyệt
                      </button>
                      <button className="btn btn-danger btn-sm">Từ chối</button>
                      <button className="btn btn-info btn-sm">Chi tiết</button>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </div>
  );
}
