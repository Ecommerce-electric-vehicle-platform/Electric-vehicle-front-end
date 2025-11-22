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
  CButton,
  CAlert,
} from "@coreui/react";
import {
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getReviewPostSellerList,
  getPostProductDetail,
  decidePostProduct,
} from "../../../api/adminApi";
import "./ReviewPosts.css";

// Helper function để map status sang tiếng Việt
const mapStatusToVietnamese = (status) => {
  if (!status) return "N/A";
  const statusMap = {
    PENDING: "Đang chờ duyệt",
    ACCEPTED: "Đã chấp nhận",
    REJECTED: "Đã từ chối",
    APPROVED: "Đã phê duyệt",
    REJECT: "Đã từ chối",
  };
  return statusMap[status.toUpperCase()] || status;
};

export default function ReviewPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [postToApprove, setPostToApprove] = useState(null);
  const [postToReject, setPostToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  /** Mở modal phê duyệt */
  const handleApproveClick = (postId) => {
    const post = posts.find((p) => p.postId === postId);
    setPostToApprove(post);
    setShowApproveModal(true);
  };

  /** Phê duyệt bài đăng */
  const handleApprove = async () => {
    if (!postToApprove) return;
    try {
      setIsProcessing(true);
      setError("");
      await decidePostProduct({
        postProductId: postToApprove.postId,
        passed: true,
        rejectedReason: "",
      });
      setSuccessMessage(`Đã phê duyệt bài đăng #${postToApprove.postId} thành công!`);
      setShowApproveModal(false);
      setPostToApprove(null);
      setShowSuccessModal(true);
      await loadPosts();
    } catch (err) {
      console.error("Lỗi khi phê duyệt:", err);
      setError(err?.response?.data?.message || "Không thể phê duyệt bài đăng.");
    } finally {
      setIsProcessing(false);
    }
  };

  /** Mở modal từ chối */
  const handleRejectClick = (postId) => {
    const post = posts.find((p) => p.postId === postId);
    setPostToReject(post);
    setRejectReason("");
    setShowRejectModal(true);
  };

  /** Từ chối bài đăng */
  const handleReject = async () => {
    if (!postToReject || !rejectReason.trim()) return;
    try {
      setIsProcessing(true);
      setError("");
      await decidePostProduct({
        postProductId: postToReject.postId,
        passed: false,
        rejectedReason: rejectReason.trim(),
      });
      setSuccessMessage(`Đã từ chối bài đăng #${postToReject.postId} thành công!`);
      setShowRejectModal(false);
      setPostToReject(null);
      setRejectReason("");
      setShowSuccessModal(true);
      await loadPosts();
    } catch (err) {
      console.error("Lỗi khi từ chối:", err);
      setError(err?.response?.data?.message || "Không thể từ chối bài đăng.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h2 className="fw-semibold mb-4">Duyệt bài đăng</h2>

      <CCard className="shadow-sm">
        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError("")} className="mb-3">
              {error}
            </CAlert>
          )}
          {loading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <p className="text-muted mt-2">Đang tải dữ liệu...</p>
            </div>
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
                        <span 
                          className="badge status-pending-badge"
                          style={{
                            backgroundColor: '#f59e0b',
                            backgroundImage: 'none',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.35em 0.65em',
                            fontSize: '0.875em',
                            fontWeight: 600,
                            borderRadius: '0.375rem'
                          }}
                        >
                          {mapStatusToVietnamese(post.verifiedDecisionStatus)}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          <CButton
                            size="sm"
                            color="success"
                            variant="outline"
                            onClick={() => handleApproveClick(post.postId)}
                            disabled={loading}
                          >
                            <CheckCircle size={14} className="me-1" />
                            Phê duyệt
                          </CButton>
                          <CButton
                            size="sm"
                            color="danger"
                            variant="outline"
                            onClick={() => handleRejectClick(post.postId)}
                            disabled={loading}
                          >
                            <XCircle size={14} className="me-1" />
                            Từ chối
                          </CButton>
                          <CButton
                            size="sm"
                            color="info"
                            variant="outline"
                            onClick={() => handleViewDetail(post.postId)}
                          >
                            <Eye size={14} className="me-1" />
                            Chi tiết
                          </CButton>
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
        scrollable
        backdrop={true}
        keyboard={true}
      >
        <CModalHeader>
          <CModalTitle className="fw-bold">Chi tiết bài đăng</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedPost ? (
            <div>
              {/* Hình ảnh sản phẩm */}
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold mb-3">Hình ảnh sản phẩm</h6>
                  <div className="row g-2">
                    {selectedPost.images
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((image, idx) => (
                        <div key={image.id || idx} className="col-md-4 col-6">
                          <div className="position-relative">
                            <img
                              src={image.imgUrl}
                              alt={`Hình ${idx + 1}`}
                              className="img-fluid rounded border"
                              style={{
                                width: "100%",
                                height: "200px",
                                objectFit: "cover",
                                cursor: "pointer",
                              }}
                              onClick={() => window.open(image.imgUrl, "_blank")}
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/400x300?text=No+Image";
                              }}
                            />
                            <small className="text-muted d-block text-center mt-1">
                              Hình {image.order || idx + 1}
                            </small>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Thông tin cơ bản */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-3">Thông tin cơ bản</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Tiêu đề</small>
                      <strong className="d-block">{selectedPost.title || "N/A"}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Mã bài đăng</small>
                      <strong className="d-block">#{selectedPost.postId || "N/A"}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Người bán (Store Name)</small>
                      <strong className="d-block">
                        {selectedPost.sellerStoreName || "N/A"}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Seller ID</small>
                      <strong className="d-block">#{selectedPost.sellerId || "N/A"}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Danh mục</small>
                      <strong className="d-block">
                        {selectedPost.categoryName || "N/A"}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Giá bán</small>
                      <strong className="d-block text-success">
                        {selectedPost.price
                          ? `${selectedPost.price.toLocaleString("vi-VN")} ₫`
                          : "N/A"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin sản phẩm */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-3">Thông tin sản phẩm</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Hãng</small>
                      <strong className="d-block">{selectedPost.brand || "N/A"}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Model</small>
                      <strong className="d-block">{selectedPost.model || "N/A"}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Năm sản xuất</small>
                      <strong className="d-block">
                        {selectedPost.manufactureYear || "N/A"}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Thời gian sử dụng</small>
                      <strong className="d-block">
                        {selectedPost.usedDuration || "N/A"}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Tình trạng</small>
                      <CBadge
                        color={
                          selectedPost.conditionLevel === "Excellent"
                            ? "success"
                            : selectedPost.conditionLevel === "Good"
                            ? "info"
                            : selectedPost.conditionLevel === "Fair"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {selectedPost.conditionLevel || "N/A"}
                      </CBadge>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Địa điểm giao dịch</small>
                      <strong className="d-block">
                        {selectedPost.locationTrading || "N/A"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trạng thái và xác minh */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-3">Trạng thái</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Trạng thái duyệt</small>
                      <span 
                        className={`badge ${
                          selectedPost.verifiedDecisionStatus === "APPROVED"
                            ? "status-approved-badge"
                            : selectedPost.verifiedDecisionStatus === "REJECTED"
                            ? "status-rejected-badge"
                            : "status-pending-badge"
                        }`}
                        style={{
                          backgroundColor: selectedPost.verifiedDecisionStatus === "APPROVED"
                            ? '#22c55e'
                            : selectedPost.verifiedDecisionStatus === "REJECTED"
                            ? '#ef4444'
                            : '#f59e0b',
                          backgroundImage: 'none',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.35em 0.65em',
                          fontSize: '0.875em',
                          fontWeight: 600,
                          borderRadius: '0.375rem'
                        }}
                      >
                        {mapStatusToVietnamese(selectedPost.verifiedDecisionStatus) || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Đã xác minh</small>
                      <CBadge color={selectedPost.verified ? "success" : "secondary"}>
                        {selectedPost.verified ? "Đã xác minh" : "Chưa xác minh"}
                      </CBadge>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-bottom pb-2">
                      <small className="text-muted d-block">Trạng thái hoạt động</small>
                      <CBadge color={selectedPost.active ? "success" : "danger"}>
                        {selectedPost.active ? "Đang hoạt động" : "Không hoạt động"}
                      </CBadge>
                    </div>
                  </div>
                  {selectedPost.rejectedReason && (
                    <div className="col-12">
                      <div className="border-bottom pb-2">
                        <small className="text-muted d-block">Lý do từ chối</small>
                        <div className="alert alert-danger mb-0 mt-2 py-2">
                          {selectedPost.rejectedReason}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Thống kê hình ảnh */}
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mb-3">
                  <small className="text-muted">
                    Tổng số hình ảnh: <strong>{selectedPost.images.length}</strong>
                  </small>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <p className="text-muted mt-2">Đang tải dữ liệu...</p>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          {selectedPost && (
            <>
              <CButton
                color="success"
                onClick={() => {
                  setShowModal(false);
                  handleApproveClick(selectedPost.postId);
                }}
                disabled={loading}
              >
                <CheckCircle size={14} className="me-1" />
                Phê duyệt
              </CButton>
              <CButton
                color="danger"
                onClick={() => {
                  setShowModal(false);
                  handleRejectClick(selectedPost.postId);
                }}
                disabled={loading}
              >
                <XCircle size={14} className="me-1" />
                Từ chối
              </CButton>
            </>
          )}
          <CButton
            color="secondary"
            onClick={() => setShowModal(false)}
          >
            Đóng
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal xác nhận phê duyệt */}
      <CModal visible={showApproveModal} onClose={() => !isProcessing && setShowApproveModal(false)}>
        <CModalHeader>
          <CModalTitle>Xác nhận phê duyệt bài đăng</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}
          {postToApprove && (
            <>
              <div className="mb-3">
                <strong>Thông tin bài đăng:</strong>
                <ul className="mt-2 mb-0">
                  <li><strong>Mã bài đăng:</strong> #{postToApprove.postId || "N/A"}</li>
                  <li><strong>Tiêu đề:</strong> {postToApprove.title || "N/A"}</li>
                  <li><strong>Người đăng:</strong> {postToApprove.sellerStoreName || "N/A"}</li>
                  <li><strong>Giá:</strong> {postToApprove.price?.toLocaleString("vi-VN")} ₫</li>
                </ul>
              </div>
              <CAlert color="info" className="mb-0">
                <strong>Lưu ý:</strong> Sau khi phê duyệt, bài đăng sẽ được hiển thị công khai cho người mua.
              </CAlert>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowApproveModal(false);
              setPostToApprove(null);
              setError("");
            }}
            disabled={isProcessing}
          >
            Hủy
          </CButton>
          <CButton
            color="success"
            onClick={handleApprove}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle size={14} className="me-1" />
                Xác nhận phê duyệt
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal từ chối bài đăng */}
      <CModal visible={showRejectModal} onClose={() => !isProcessing && setShowRejectModal(false)}>
        <CModalHeader>
          <CModalTitle>Từ chối bài đăng</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}
          {postToReject && (
            <>
              <div className="mb-3">
                <strong>Thông tin bài đăng:</strong>
                <ul className="mt-2 mb-0">
                  <li><strong>Mã bài đăng:</strong> #{postToReject.postId || "N/A"}</li>
                  <li><strong>Tiêu đề:</strong> {postToReject.title || "N/A"}</li>
                  <li><strong>Người đăng:</strong> {postToReject.sellerStoreName || "N/A"}</li>
                </ul>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <strong>Lý do từ chối:</strong>
                  <span className="text-muted ms-1">(Bắt buộc)</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối bài đăng này (ví dụ: Nội dung không phù hợp, hình ảnh không rõ ràng, ...)"
                  disabled={isProcessing}
                  required
                />
                {!rejectReason.trim() && (
                  <small className="text-danger">Vui lòng nhập lý do từ chối để tiếp tục.</small>
                )}
              </div>
              <CAlert color="warning" className="mb-0">
                <strong>Lưu ý:</strong> Lý do từ chối sẽ được gửi đến người bán để họ có thể chỉnh sửa và gửi lại bài đăng.
              </CAlert>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowRejectModal(false);
              setPostToReject(null);
              setRejectReason("");
              setError("");
            }}
            disabled={isProcessing}
          >
            Hủy
          </CButton>
          <CButton
            color="danger"
            onClick={handleReject}
            disabled={isProcessing || !rejectReason.trim()}
          >
            {isProcessing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang xử lý...
              </>
            ) : (
              <>
                <XCircle size={14} className="me-1" />
                Xác nhận từ chối
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal thông báo thành công */}
      <CModal visible={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <CModalHeader>
          <CModalTitle>Thành công</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="text-center py-3">
            <CheckCircle size={48} className="text-success mb-3" />
            <p className="mb-0">{successMessage}</p>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="success" onClick={() => setShowSuccessModal(false)}>
            OK
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
