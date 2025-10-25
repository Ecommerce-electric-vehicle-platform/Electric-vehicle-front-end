// src/pages/Seller/ManagePosts/ManagePosts.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ServicePackageGuard } from "../../../components/ServicePackageGuard/ServicePackageGuard";
import sellerApi from "../../../api/sellerApi";
import "./ManagePosts.css";

export default function ManagePosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, verified, pending, rejected

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Giả định API trả về danh sách posts
      const response = await sellerApi.getMyPosts();
      const data = response?.data?.data || [];

      setPosts(data);
    } catch (err) {
      console.error("Error loading posts:", err);
      setError(err.message || "Không thể tải danh sách tin đăng");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async (postId) => {
    if (
      !window.confirm("Bạn có chắc muốn gửi yêu cầu xác minh bài đăng này?")
    ) {
      return;
    }

    try {
      await sellerApi.requestPostVerification(postId);
      alert("Yêu cầu xác minh đã được gửi!");
      loadPosts(); // Reload
    } catch (error) {
      console.error("Error requesting verification:", error);
      alert("Gửi yêu cầu thất bại. Vui lòng thử lại!");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tin đăng này?")) {
      return;
    }

    try {
      await sellerApi.deletePost(postId);
      alert("Xóa tin đăng thành công!");
      loadPosts(); // Reload
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Xóa tin đăng thất bại. Vui lòng thử lại!");
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filterStatus === "all") return true;
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
      <ServicePackageGuard>
        <div className="manage-posts-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải tin đăng...</p>
          </div>
        </div>
      </ServicePackageGuard>
    );
  }

  if (error) {
    return (
      <ServicePackageGuard>
        <div className="manage-posts-page">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Lỗi tải tin đăng</h3>
            <p>{error}</p>
            <button onClick={loadPosts} className="btn-retry">
              Thử lại
            </button>
          </div>
        </div>
      </ServicePackageGuard>
    );
  }

  return (
    <ServicePackageGuard>
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
          </div>

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>Chưa có tin đăng nào</h3>
              <p>Bắt đầu đăng tin để bán xe của bạn!</p>
              <button
                className="btn-create-first"
                onClick={() => navigate("/seller/create-post")}
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
                    {post.pictures && post.pictures.length > 0 ? (
                      <img src={post.pictures[0]} alt={post.title} />
                    ) : (
                      <div className="no-image">📷 Chưa có ảnh</div>
                    )}
                    {getStatusBadge(post.verifiedDecisionStatus)}
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
                    <p className="post-location">📍 {post.locationTrading}</p>

                    {post.verified && (
                      <div className="verified-badge">✓ Đã xác minh</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="post-actions">
                    <button
                      className="btn-view"
                      onClick={() => navigate(`/product/${post.postId}`)}
                    >
                      Xem
                    </button>

                    {!post.verified && (
                      <button
                        className="btn-verify"
                        onClick={() => handleRequestVerification(post.postId)}
                      >
                        Xác minh
                      </button>
                    )}

                    <button
                      className="btn-edit"
                      onClick={() =>
                        navigate(`/seller/edit-post/${post.postId}`)
                      }
                    >
                      Sửa
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => handleDeletePost(post.postId)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ServicePackageGuard>
  );
}
