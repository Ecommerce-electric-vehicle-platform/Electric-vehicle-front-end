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
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import {
  getReviewPostSellerList,
  getPostProductDetail,
  decidePostProduct,
} from "../../../api/adminApi";

export default function ReviewPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);

  /** Load danh sách bài đăng cần duyệt */
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const { list } = await getReviewPostSellerList(0, 10);
      setPosts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách bài đăng:", err);
      setError("Không thể tải danh sách bài đăng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  /** Xem chi tiết bài đăng */
  const handleViewDetail = async (postId) => {
    try {
      setLoading(true);
      const res = await getPostProductDetail(postId);
      const data = res?.data?.data || res?.data || res || {};
      setSelectedPost(data);
      setShowModal(true);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết bài đăng:", err);
      alert("Không thể tải chi tiết bài đăng.");
    } finally {
      setLoading(false);
    }
  };

  /** Phê duyệt bài đăng */
  const handleApprove = async (postId) => {
    if (!window.confirm("Xác nhận phê duyệt bài đăng này?")) return;
    try {
      setLoading(true);
      await decidePostProduct({
        postProductId: postId,
        passed: true,
        rejectedReason: "",
      });
      alert("Phê duyệt bài đăng thành công!");
      loadPosts();
    } catch (err) {
      console.error("Lỗi khi phê duyệt:", err);
      alert("Không thể phê duyệt bài đăng.");
    } finally {
      setLoading(false);
    }
  };

  /** Từ chối bài đăng */
  const handleReject = async (postId) => {
    const reason = prompt("Nhập lý do từ chối:");
    if (!reason) return;
    try {
      setLoading(true);
      await decidePostProduct({
        postProductId: postId,
        passed: false,
        rejectedReason: reason,
      });
      alert("Đã từ chối bài đăng.");
      loadPosts();
    } catch (err) {
      console.error("Lỗi khi từ chối:", err);
      alert("Không thể từ chối bài đăng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="fw-semibold mb-4">Duyệt bài đăng</h2>

      <CCard className="shadow-sm">
        <CCardBody>
          {loading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <p className="text-muted mt-2">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <CTable hover responsive>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>ID</CTableHeaderCell>
                  <CTableHeaderCell>Tiêu đề</CTableHeaderCell>
                  <CTableHeaderCell>Người đăng</CTableHeaderCell>
                  <CTableHeaderCell>Hãng</CTableHeaderCell>
                  <CTableHeaderCell>Giá</CTableHeaderCell>
                  <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                  <CTableHeaderCell>Thao tác</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <CTableRow key={post.postId}>
                      <CTableDataCell>{post.postId}</CTableDataCell>
                      <CTableDataCell>{post.title}</CTableDataCell>
                      <CTableDataCell>{post.sellerStoreName}</CTableDataCell>
                      <CTableDataCell>{post.brand}</CTableDataCell>
                      <CTableDataCell>
                        {post.price?.toLocaleString("vi-VN")} ₫
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="warning">
                          {post.verifiedDecisionStatus}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(post.postId)}
                          >
                            Phê duyệt
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReject(post.postId)}
                          >
                            Từ chối
                          </button>
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => handleViewDetail(post.postId)}
                          >
                            Chi tiết
                          </button>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                ) : (
                  <CTableRow>
                    <CTableDataCell
                      colSpan={7}
                      className="text-center text-muted"
                    >
                      Không có bài đăng nào cần duyệt.
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Modal Chi tiết bài đăng */}
      <CModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        alignment="center"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Chi tiết bài đăng</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedPost ? (
            <div>
              <h5 className="fw-bold">{selectedPost.title}</h5>
              <p>
                <strong>Người bán:</strong> {selectedPost.sellerStoreName}
              </p>
              <p>
                <strong>Hãng:</strong> {selectedPost.brand}
              </p>
              <p>
                <strong>Model:</strong> {selectedPost.model}
              </p>
              <p>
                <strong>Năm SX:</strong> {selectedPost.manufactureYear}
              </p>
              <p>
                <strong>Thời gian sử dụng:</strong> {selectedPost.usedDuration}
              </p>
              <p>
                <strong>Tình trạng:</strong> {selectedPost.conditionLevel}
              </p>
              <p>
                <strong>Giá:</strong>{" "}
                {selectedPost.price?.toLocaleString("vi-VN")} ₫
              </p>
              <p>
                <strong>Địa điểm:</strong> {selectedPost.locationTrading}
              </p>
              <p>
                <strong>Danh mục:</strong> {selectedPost.categoryName}
              </p>
              <p>
                <strong>Trạng thái duyệt:</strong>{" "}
                {selectedPost.verifiedDecisionStatus}
              </p>
            </div>
          ) : (
            <p>Không có dữ liệu chi tiết.</p>
          )}
        </CModalBody>
        <CModalFooter>
          <button
            className="btn btn-secondary"
            onClick={() => setShowModal(false)}
          >
            Đóng
          </button>
        </CModalFooter>
      </CModal>
    </div>
  );
}
