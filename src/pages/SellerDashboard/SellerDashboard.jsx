import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  DollarSign,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Users,
  ShoppingCart,
  BarChart3,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import sellerApi from "../../api/sellerApi";
import "./SellerDashboard.css";

function SellerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingOrders: 0,
  });
  const [sellerInfo, setSellerInfo] = useState(null);

  // Load seller data and orders
  useEffect(() => {
    loadSellerData();
    loadSellerOrders();
    loadSellerStatistics();
  }, []);

  const loadSellerData = async () => {
    try {
      const response = await sellerApi.getSellerProfile();
      setSellerInfo(response?.data?.data);
    } catch (error) {
      console.error("Error loading seller profile:", error);
    }
  };

  const loadSellerOrders = async () => {
    try {
      setLoading(true);
      const response = await sellerApi.getSellerOrders(0, 50);
      const ordersData = response?.data?.data || [];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading seller orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSellerStatistics = async () => {
    try {
      const response = await sellerApi.getSellerStatistics();
      const stats = response?.data?.data || {};
      setStatistics({
        totalRevenue: stats.totalRevenue || 0,
        totalOrders: stats.totalOrders || 0,
        activeProducts: stats.activeProducts || 0,
        pendingOrders: stats.pendingOrders || 0,
      });
    } catch (error) {
      console.error("Error loading seller statistics:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "#F59E0B";
      case "CONFIRMED":
        return "#3B82F6";
      case "PREPARING":
        return "#6366F1";
      case "SHIPPING":
        return "#10B981";
      case "DELIVERED":
        return "#059669";
      case "CANCELLED":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "Chờ xử lý";
      case "CONFIRMED":
        return "Đã xác nhận";
      case "PREPARING":
        return "Đang chuẩn bị";
      case "SHIPPING":
        return "Đang giao hàng";
      case "DELIVERED":
        return "Đã giao hàng";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      let newStatus;
      switch (action) {
        case "accept":
          newStatus = "CONFIRMED";
          break;
        case "prepare":
          newStatus = "PREPARING";
          break;
        case "ship":
          newStatus = "SHIPPING";
          break;
        default:
          return;
      }

      await sellerApi.updateOrderStatus(orderId, newStatus);
      // Reload orders after update
      loadSellerOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Cập nhật đơn hàng thất bại. Vui lòng thử lại!");
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) {
      return "0 ₫";
    }
    return value.toLocaleString("vi-VN") + " ₫";
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {formatCurrency(statistics.totalRevenue)}
            </h3>
            <p className="stat-label">Tổng doanh thu</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{statistics.totalOrders}</h3>
            <p className="stat-label">Tổng đơn hàng</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon products">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{statistics.activeProducts}</h3>
            <p className="stat-label">Sản phẩm đang bán</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{statistics.pendingOrders}</h3>
            <p className="stat-label">Đơn hàng chờ</p>
          </div>
        </div>
      </div>

      <div className="recent-orders">
        <h3>Đơn hàng gần đây</h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div className="loading-spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}
          >
            <ShoppingCart
              size={48}
              style={{ margin: "0 auto 1rem", opacity: 0.5 }}
            />
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.slice(0, 5).map((order) => (
              <div key={order.orderId || order.id} className="order-item">
                <div className="order-info">
                  <div className="order-id">#{order.orderId || order.id}</div>
                  <div className="order-customer">
                    {order.buyerName || "Khách hàng"}
                  </div>
                  <div className="order-product">
                    {order.product?.name || order.productName || "Sản phẩm"}
                  </div>
                </div>
                <div className="order-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div className="order-amount">
                  {formatCurrency(order.totalPrice || order.totalAmount || 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderOrders = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="loading-spinner"></div>
          <p>Đang tải đơn hàng...</p>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          <ShoppingCart
            size={64}
            style={{ margin: "0 auto 1rem", opacity: 0.5 }}
          />
          <h3>Chưa có đơn hàng nào</h3>
          <p>Bạn chưa có đơn hàng nào từ người mua.</p>
        </div>
      );
    }

    return (
      <div className="orders-section">
        <div className="section-header">
          <h2>Quản lý đơn hàng</h2>
        </div>

        <div className="orders-table">
          {orders.map((order) => (
            <div key={order.orderId || order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">#{order.orderId || order.id}</div>
                <div className="order-date">
                  {new Date(
                    order.createdAt || order.orderDate
                  ).toLocaleDateString("vi-VN")}
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="order-details">
                <div className="customer-info">
                  <h4>
                    {order.buyer?.fullName || order.buyerName || "Khách hàng"}
                  </h4>
                  <p>
                    <Phone size={16} />{" "}
                    {order.buyer?.phone || order.buyerPhone || "N/A"}
                  </p>
                  <p>
                    <MapPin size={16} />{" "}
                    {order.shippingAddress || "Địa chỉ không xác định"}
                  </p>
                </div>

                <div className="product-info">
                  <h4>
                    {order.product?.name || order.productName || "Sản phẩm"}
                  </h4>
                  <p>Số lượng: {order.quantity || 1}</p>
                  <p className="total-amount">
                    {formatCurrency(order.totalPrice || order.totalAmount || 0)}
                  </p>
                </div>
              </div>

              <div className="order-actions">
                {order.status === "PENDING" && (
                  <button
                    className="btn btn-success"
                    onClick={() =>
                      handleOrderAction(order.orderId || order.id, "accept")
                    }
                  >
                    <CheckCircle size={16} />
                    Xác nhận đơn hàng
                  </button>
                )}

                {order.status === "CONFIRMED" && (
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      handleOrderAction(order.orderId || order.id, "prepare")
                    }
                  >
                    <CheckCircle size={16} />
                    Đang chuẩn bị
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    navigate(`/order-tracking/${order.orderId || order.id}`)
                  }
                >
                  <Eye size={16} />
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    if (!sellerInfo) {
      return (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      );
    }

    return (
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-circle">
              <span>
                {sellerInfo.fullName?.charAt(0) ||
                  sellerInfo.username?.charAt(0) ||
                  "S"}
              </span>
            </div>
          </div>
          <div className="profile-info">
            <h2>{sellerInfo.fullName || sellerInfo.username || "Seller"}</h2>
            <p>{sellerInfo.email || "N/A"}</p>
            <p>{sellerInfo.phone || "N/A"}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-group">
            <h3>Thông tin liên hệ</h3>
            <div className="detail-item">
              <Mail size={20} />
              <span>{sellerInfo.email || "N/A"}</span>
            </div>
            <div className="detail-item">
              <Phone size={20} />
              <span>{sellerInfo.phone || "N/A"}</span>
            </div>
            <div className="detail-item">
              <MapPin size={20} />
              <span>{sellerInfo.address || "Chưa cập nhật"}</span>
            </div>
          </div>

          <div className="detail-group">
            <h3>Thống kê bán hàng</h3>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">Tổng doanh thu:</span>
                <span className="stat-value">
                  {formatCurrency(statistics.totalRevenue)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tổng đơn hàng:</span>
                <span className="stat-value">{statistics.totalOrders}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sản phẩm đang bán:</span>
                <span className="stat-value">{statistics.activeProducts}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/profile")}
          >
            Chỉnh sửa thông tin
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/seller/manage-posts")}
          >
            <Package size={16} />
            Quản lý tin đăng
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Seller Dashboard</h1>
          <p>
            Chào mừng trở lại,{" "}
            {sellerInfo?.fullName || sellerInfo?.username || "Seller"}!
          </p>
        </div>
        <div className="header-right">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/seller/manage-posts")}
          >
            <Package size={16} />
            Quản lý tin đăng
          </button>
          <button
            className="btn btn-success"
            onClick={() => navigate("/seller/create-post")}
          >
            <Plus size={16} />
            Đăng tin mới
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 size={20} />
              Tổng quan
            </button>
            <button
              className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingCart size={20} />
              Đơn hàng
            </button>
            <button
              className="nav-item"
              onClick={() => navigate("/seller/pending-orders")}
            >
              <Clock size={20} />
              Đơn hàng chờ xác nhận
            </button>
            <button
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <Users size={20} />
              Hồ sơ
            </button>
          </nav>
        </div>

        <div className="main-content">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "orders" && renderOrders()}
          {activeTab === "profile" && renderProfile()}
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
