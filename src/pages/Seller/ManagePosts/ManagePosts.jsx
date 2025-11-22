// src/pages/Seller/ManagePosts/ManagePosts.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { ServicePackageGuard, usePackage } from "../../../components/ServicePackageGuard/ServicePackageGuard";
import sellerApi from "../../../api/sellerApi";
import "./ManagePosts.css";

// Component con để sử dụng usePackage hook (phải nằm trong PackageContext)
function ManagePostsContent() {
  const navigate = useNavigate();
  const { packageValid } = usePackage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, displaying, approved, pending, rejected, hidden, sold
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // "success" or "error"
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmModalAction, setConfirmModalAction] = useState(null); // Function to execute on confirm

  useEffect(() => {
    loadPosts();
  }, []);

  // Xác định sản phẩm đã bán: chỉ kiểm tra trường sold từ backend
  const getSold = (post) => {
    // Kiểm tra nhiều định dạng có thể có
    return post.sold === true || 
           post.sold === 1 || 
           post.sold === "true" ||
           String(post.sold).toLowerCase() === "true";
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // BE đã filter theo seller rồi, chỉ cần lấy data
      const response = await sellerApi.getMyPosts(0, 100);

      // BE trả về data.content (Spring Boot Pageable format)
      const myPosts = response?.data?.data?.content || [];

      setPosts(myPosts);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách tin đăng");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = (postId) => {
    // Hiển thị modal xác nhận
    setConfirmModalMessage("Bạn có chắc muốn gửi yêu cầu xác minh bài đăng này?");
    setConfirmModalAction(() => async () => {
      setShowConfirmModal(false);
      try {
        await sellerApi.requestPostVerification(postId);
        setModalMessage("Yêu cầu xác minh đã được gửi!");
        setModalType("success");
        setShowModal(true);
        loadPosts(); // Reload
      } catch (error) {
        console.error("Error requesting verification:", error);
        
        // Lấy message lỗi từ BE với thứ tự ưu tiên:
        // 1. error.response.data.error.message (message chi tiết từ BE)
        // 2. error.response.data.message (message chung)
        // 3. error.message (message từ axios)
        // 4. Message mặc định
        let errorMessage = "Gửi yêu cầu thất bại. Vui lòng thử lại!";
        
        if (error?.response?.data?.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        setModalMessage(errorMessage);
        setModalType("error");
        setShowModal(true);
      }
    });
    setShowConfirmModal(true);
  };

  const handleHidePost = async (postId) => {
    // Hiển thị modal xác nhận
    setConfirmModalMessage("Bạn có chắc muốn ẩn tin đăng này? Tin đăng sẽ không hiển thị cho người mua nhưng vẫn được lưu trong hệ thống.");
    setConfirmModalAction(() => async () => {
      setShowConfirmModal(false);
      try {
        await sellerApi.hidePostById(postId);
        setModalMessage("Ẩn tin đăng thành công!");
        setModalType("success");
        setShowModal(true);
        loadPosts(); // Reload
      } catch (error) {
        console.error("Error hiding post:", error);
        setModalMessage("Ẩn tin đăng thất bại. Vui lòng thử lại!");
        setModalType("error");
        setShowModal(true);
      }
    });
    setShowConfirmModal(true);
  };

  const handleUnhidePost = async (postId) => {
    // Hiển thị modal xác nhận
    setConfirmModalMessage("Bạn có chắc muốn bỏ ẩn tin đăng này? Tin đăng sẽ trở lại và hiển thị cho người mua.");
    setConfirmModalAction(() => async () => {
      setShowConfirmModal(false);
      try {
        await sellerApi.unhidePostById(postId);
        setModalMessage("Bỏ ẩn tin đăng thành công!");
        setModalType("success");
        setShowModal(true);
        loadPosts();
      } catch (error) {
        console.error("Error unhiding post:", error);
        setModalMessage("Bỏ ẩn tin đăng thất bại. Vui lòng thử lại!");
        setModalType("error");
        setShowModal(true);
      }
    });
    setShowConfirmModal(true);
  };

  const filteredPosts = posts.filter((post) => {
    const sold = getSold(post);
    
    if (filterStatus === "all") {
      // Hiển thị tất cả tin đăng trừ những tin đã ẩn
      return post.active !== false && post.active !== 0;
    }
    if (filterStatus === "hidden") {
      // Kiểm tra trạng thái active - nếu active === false thì đã bị ẩn
      return post.active === false || post.active === 0;
    }
    if (filterStatus === "sold") {
      // Chỉ hiển thị các tin đã bán (sold === true), không quan tâm đến trạng thái active
      return sold;
    }
    if (filterStatus === "displaying") {
      // Đang hiển thị: active, chưa bán, và không bị từ chối
      // Bao gồm: APPROVED (đã duyệt - có tem xác minh), PENDING (chờ duyệt - vẫn hiển thị), null/undefined
      // Loại trừ: REJECTED (bị từ chối - không hiển thị) và các tin đã bán
      const isActive = post.active !== false && post.active !== 0;
      const isNotSold = !sold;
      const isNotRejected = post.verifiedDecisionStatus !== "REJECTED";
      return isActive && isNotSold && isNotRejected;
    }
    // Đối với các filter khác (approved, pending, rejected), chỉ hiển thị tin chưa bị ẩn và chưa bán
    const isHidden = post.active === false || post.active === 0;
    if (isHidden || sold) return false;
    return (
      post.verifiedDecisionStatus?.toLowerCase() === filterStatus.toLowerCase()
    );
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      APPROVED: { label: "Đã duyệt", className: "status-approved" },
      PENDING: { label: "Chờ duyệt", className: "status-pending" },
      REJECTED: { label: "Từ chối", className: "status-rejected" },
    };

    const statusInfo = statusMap[status] || {
      label: "Chưa xác minh",
      className: "status-unverified",
    };

    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="manage-posts-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải tin đăng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-posts-page">
        <div className="error-state">
          <div className="error-icon"></div>
          <h3>Lỗi tải tin đăng</h3>
          <p>{error}</p>
          <button onClick={loadPosts} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-posts-page">
      <div className="manage-posts-container">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1>Quản Lý Tin Đăng</h1>
              <p>Quản lý tất cả tin đăng bán xe của bạn</p>
            </div>
            <button
              className="btn-create-new"
              onClick={() => navigate("/seller/create-post")}
              disabled={!packageValid}
              title={!packageValid ? "Gói dịch vụ đã hết hạn. Vui lòng gia hạn để đăng tin mới." : "Đăng tin mới"}
              style={{
                opacity: !packageValid ? 0.6 : 1,
                cursor: !packageValid ? 'not-allowed' : 'pointer'
              }}
            >
              + Đăng tin mới
            </button>
          </div>

          {/* Filter */}
          <div className="filter-bar">
            <button
              className={filterStatus === "all" ? "active" : ""}
              onClick={() => setFilterStatus("all")}
            >
              Tất cả ({posts.length})
            </button>
            <button
              className={filterStatus === "displaying" ? "active" : ""}
              onClick={() => setFilterStatus("displaying")}
            >
              Đang hiển thị (
              {posts.filter((p) => {
                const sold = getSold(p);
                const isActive = p.active !== false && p.active !== 0;
                const isNotSold = !sold;
                const isNotRejected = p.verifiedDecisionStatus !== "REJECTED";
                return isActive && isNotSold && isNotRejected;
              }).length}
              )
            </button>
            <button
              className={filterStatus === "sold" ? "active" : ""}
              onClick={() => setFilterStatus("sold")}
            >
              Đã bán (
              {posts.filter((p) => getSold(p)).length}
              )
            </button>
            <button
              className={filterStatus === "approved" ? "active" : ""}
              onClick={() => setFilterStatus("approved")}
            >
              Đã duyệt
            </button>
            <button
              className={filterStatus === "pending" ? "active" : ""}
              onClick={() => setFilterStatus("pending")}
            >
              Chờ duyệt
            </button>
            <button
              className={filterStatus === "rejected" ? "active" : ""}
              onClick={() => setFilterStatus("rejected")}
            >
              Từ chối
            </button>
            <button
              className={filterStatus === "hidden" ? "active" : ""}
              onClick={() => setFilterStatus("hidden")}
            >
              Tin đã ẩn (
              {posts.filter((p) => p.active === false || p.active === 0).length}
              )
            </button>
          </div>

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <h3>Chưa có tin đăng nào</h3>
              <p>Bắt đầu đăng tin để bán xe của bạn!</p>
              <button
                className="btn-create-first"
                onClick={() => navigate("/seller/create-post")}
                disabled={!packageValid}
                title={!packageValid ? "Gói dịch vụ đã hết hạn. Vui lòng gia hạn để đăng tin mới." : "Đăng tin đầu tiên"}
                style={{
                  opacity: !packageValid ? 0.6 : 1,
                  cursor: !packageValid ? 'not-allowed' : 'pointer'
                }}
              >
                Đăng tin đầu tiên
              </button>
            </div>
          ) : (
            <div className="posts-grid">
              {filteredPosts.map((post) => (
                <div key={post.postId} className="post-card">
                  {/* Thumbnail */}
                  <div className="post-thumbnail">
                    {post.images && post.images.length > 0 ? (
                      <img src={post.images[0].imgUrl} alt={post.title} />
                    ) : (
                      <div className="no-image">Chưa có ảnh</div>
                    )}
                    {getStatusBadge(post.verifiedDecisionStatus)}
                    {(post.active === false || post.active === 0) && (
                      <span className="status-badge status-hidden">Đã ẩn</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="post-info">
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-brand">
                      {post.brand} {post.model}
                    </p>
                    <p className="post-price">
                      {parseInt(post.price).toLocaleString()} VNĐ
                    </p>
                    <p className="post-location">{post.locationTrading}</p>
                  </div>

                  {/* Actions */}
                  <div className="post-actions">
                    <button
                      className="btn-update"
                      onClick={() => navigate(`/seller/edit-post/${post.postId}`)}
                      title="Chỉnh sửa bài đăng"
                    >
                      Sửa
                    </button>
                    <button
                      className="btn-view"
                      onClick={() =>
                        window.open(`/product/${post.postId}`, "_blank")
                      }
                      title="Xem trước bài đăng như người mua"
                    >
                      Xem trước
                    </button>
                    {!post.verified && (
                      <button
                        className="btn-verify"
                        onClick={() => handleRequestVerification(post.postId)}
                      >
                        Xác minh
                      </button>
                    )}
                    {post.active === false || post.active === 0 ? (
                      <button
                        className="btn-unhide"
                        onClick={() => handleUnhidePost(post.postId)}
                        title="Bỏ ẩn, cho phép bài đăng hiển thị lại với người mua"
                      >
                        Bỏ ẩn
                      </button>
                    ) : (
                      <button
                        className="btn-hide"
                        onClick={() => handleHidePost(post.postId)}
                        title="Ẩn tin đăng này khỏi danh sách công khai"
                      >
                        Ẩn
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Modal xác nhận - Render ở top level với Portal */}
      {showConfirmModal && createPortal(
        <div className="success-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="success-modal confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-header confirmation-modal-header">
              <h3 className="success-modal-title">Xác nhận</h3>
            </div>
            <div className="success-modal-body">
              <div className="text-center py-3">
                <p className="mb-0" style={{ fontSize: '16px', fontWeight: '500', whiteSpace: 'pre-line' }}>
                  {confirmModalMessage}
                </p>
              </div>
            </div>
            <div className="success-modal-footer confirmation-modal-footer">
              <button
                className="confirmation-modal-button cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy
              </button>
              <button
                className="confirmation-modal-button confirm"
                onClick={() => {
                  if (confirmModalAction) {
                    confirmModalAction();
                  }
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal thông báo - Success hoặc Error - Render ở top level với Portal */}
      {showModal && createPortal(
        <div className="success-modal-overlay" onClick={() => setShowModal(false)}>
          <div className={`success-modal ${modalType === 'error' ? 'ai-error-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={`success-modal-header ${modalType === 'error' ? 'ai-error-header' : ''}`}>
              <h3 className="success-modal-title">
                {modalType === 'error' ? 'Lỗi' : 'Thành công'}
              </h3>
            </div>
            <div className="success-modal-body">
              <div className="text-center py-3">
                {modalType === 'error' ? (
                  <XCircle size={48} className="ai-error-icon mb-3" />
                ) : (
                  <CheckCircle size={48} className="success-icon mb-3" />
                )}
                <p className="mb-0" style={{ fontSize: '16px', fontWeight: '500', whiteSpace: 'pre-line' }}>
                  {modalMessage}
                </p>
              </div>
            </div>
            <div className="success-modal-footer">
              <button
                className={`success-modal-button ${modalType === 'error' ? 'ai-error-button' : ''}`}
                onClick={() => setShowModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Component chính với ServicePackageGuard
export default function ManagePosts() {
  return (
    <ServicePackageGuard viewOnly={true}>
      <ManagePostsContent />
    </ServicePackageGuard>
  );
}
