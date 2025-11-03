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
  const [filterStatus, setFilterStatus] = useState("all"); // all, verified, pending, rejected, hidden

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading posts...");

      // BE đã filter theo seller rồi, chỉ cần lấy data
      const response = await sellerApi.getMyPosts(0, 100);
      console.log("Response:", response);
      console.log("Response data:", response?.data);

      // BE trả về data.content (Spring Boot Pageable format)
      const myPosts = response?.data?.data?.content || [];
      console.log("My posts:", myPosts);
      console.log("Total elements:", response?.data?.data?.totalElements);
      console.log("Total pages:", response?.data?.data?.totalPages);

      setPosts(myPosts);
    } catch (err) {
      console.error(" Error loading posts:", err);
      console.error("Response error:", err.response?.data);
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

  const handleHidePost = async (postId) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn ẩn tin đăng này? Tin đăng sẽ không hiển thị cho người mua nhưng vẫn được lưu trong hệ thống."
      )
    ) {
      return;
    }

    try {
      await sellerApi.hidePostById(postId);
      alert("Ẩn tin đăng thành công!");
      loadPosts(); // Reload
    } catch (error) {
      console.error("Error hiding post:", error);
      alert("Ẩn tin đăng thất bại. Vui lòng thử lại!");
    }
  };

  const handleUnhidePost = async (postId) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn bỏ ẩn tin đăng này? Tin đăng sẽ trở lại và hiển thị cho người mua."
      )
    ) {
      return;
    }
    try {
      await sellerApi.unhidePostById(postId);
      alert("Bỏ ẩn tin đăng thành công!");
      loadPosts();
    } catch (error) {
      console.error("Error unhiding post:", error);
      alert("Bỏ ẩn tin đăng thất bại. Vui lòng thử lại!");
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filterStatus === "all") {
      // Hiển thị tất cả tin đăng trừ những tin đã ẩn
      return post.active !== false && post.active !== 0;
    }
    if (filterStatus === "hidden") {
      // Kiểm tra trạng thái active - nếu active === false thì đã bị ẩn
      return post.active === false || post.active === 0;
    }
    // Đối với các filter khác (approved, pending, rejected), chỉ hiển thị tin chưa bị ẩn
    const isHidden = post.active === false || post.active === 0;
    if (isHidden) return false;
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
            <div className="error-icon"></div>
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
      </div>
    </ServicePackageGuard>
  );
}
