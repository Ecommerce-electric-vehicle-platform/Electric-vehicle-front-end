import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  Users,
  ShoppingCart,
  BarChart3,
  MapPin,
  Phone,
  RefreshCw,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import sellerApi from "../../api/sellerApi";
import "./SellerDashboard.css";

// Đăng ký Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function SellerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [orderFilter, setOrderFilter] = useState("all"); // all, pending, shipping, delivered
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingOrders: 0,
  });
  const [sellerInfo, setSellerInfo] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingOrdersLoading, setPendingOrdersLoading] = useState(false);
  const [verifying, setVerifying] = useState({});

  // Load pending orders from API
  const loadPendingOrders = useCallback(async () => {
    try {
      setPendingOrdersLoading(true);
      const response = await sellerApi.getPendingOrders(0, 50);
      const responseData = response?.data?.data;
      const ordersData = responseData?.content || responseData || [];
      setPendingOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error("Error loading pending orders:", error);
      setPendingOrders([]);
    } finally {
      setPendingOrdersLoading(false);
    }
  }, []);

  // Load seller data and orders
  useEffect(() => {
    loadSellerData();
    loadSellerOrders();
    loadSellerStatistics();
    loadDashboardStatistics();
  }, []);

  // Load pending orders when "pending" filter is selected
  useEffect(() => {
    if (orderFilter === "pending") {
      loadPendingOrders();
    }
  }, [orderFilter, loadPendingOrders]);

  // Load thông tin seller từ API (lấy từ JWT token)
  // API: GET /api/v1/seller/profile
  //Lấy thông tin seller để hiện thị dashboard 
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

  // Load dashboard statistics từ 4 API mới
  const loadDashboardStatistics = async () => {
    try {
      // Gọi 4 API song song để tối ưu performance
      const [totalOrdersRes, totalRevenueRes, totalPendingOrdersRes, activePostsRes] = await Promise.all([
        sellerApi.getTotalOrders().catch(() => ({ data: { data: 0 } })),
        sellerApi.getTotalRevenue().catch(() => ({ data: { data: 0 } })),
        sellerApi.getTotalPendingOrders().catch(() => ({ data: { data: 0 } })),
        sellerApi.getActivePosts().catch(() => ({ data: { data: 0 } })),
      ]);

      // Lấy dữ liệu từ response
      const totalOrders = totalOrdersRes?.data?.data ?? 0;
      const totalRevenue = totalRevenueRes?.data?.data ?? 0;
      const totalPendingOrders = totalPendingOrdersRes?.data?.data ?? 0;
      const activePosts = activePostsRes?.data?.data ?? 0;

      // Cập nhật statistics với dữ liệu từ API
      setStatistics((prev) => ({
        ...prev,
        totalOrders: typeof totalOrders === 'number' ? totalOrders : 0,
        totalRevenue: typeof totalRevenue === 'number' ? totalRevenue : 0,
        pendingOrders: typeof totalPendingOrders === 'number' ? totalPendingOrders : 0,
        activeProducts: typeof activePosts === 'number' ? activePosts : 0,
      }));
    } catch (error) {
      console.error("Error loading dashboard statistics:", error);
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
      // Reload orders and related data after update
      loadSellerOrders();
      loadSellerStatistics();
      loadDashboardStatistics();
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Tính tổng doanh thu từ tất cả đơn hàng
  const totalRevenueFromOrders = useMemo(() => {
    let total = 0;
    orders.forEach((order) => {
      const status = order.status?.toUpperCase();
      // Chỉ tính các đơn hàng không bị hủy
      if (status && status !== "CANCELLED") {
        const orderTotal = order.totalPrice || order.totalAmount || order.price || 0;
        total += orderTotal;
      }
    });
    return total;
  }, [orders]);

  // Chart data cho tổng doanh thu
  const totalRevenueChartData = useMemo(() => {
    const totalRevenue = statistics.totalRevenue || totalRevenueFromOrders;
    return {
      labels: ["Tổng doanh thu"],
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: [totalRevenue],
          backgroundColor: ["rgba(16, 185, 129, 0.8)"],
          borderColor: ["rgba(16, 185, 129, 1)"],
          borderWidth: 2,
        },
      ],
    };
  }, [statistics.totalRevenue, totalRevenueFromOrders]);

  // Chart data cho tổng quan thống kê
  const statisticsChartData = useMemo(() => {
    return {
      labels: ["Tổng đơn hàng", "Đơn hàng chờ", "Sản phẩm đang bán"],
      datasets: [
        {
          label: "Số lượng",
          data: [
            statistics.totalOrders,
            statistics.pendingOrders,
            statistics.activeProducts,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(139, 92, 246, 0.8)",
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(139, 92, 246, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [statistics]);


  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const totalRevenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Hiển thị chart ngang
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.x || 0;
            return formatCurrency(value);
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + "M ₫";
            }
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + "K ₫";
            }
            return value + " ₫";
          },
        },
      },
      y: {
        display: false,
      },
    },
  };

  // Handle verify order (xác nhận đơn hàng)
  const handleVerifyOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xác nhận đơn hàng này?")) {
      return;
    }

    try {
      setVerifying((prev) => ({ ...prev, [orderId]: true }));
      await sellerApi.verifyOrder(orderId);

      // Remove order from pending list after verification
      setPendingOrders((prevOrders) =>
        prevOrders.filter((order) => (order.id || order.orderId) !== orderId)
      );

      // Reload all orders and statistics
      loadSellerOrders();
      loadSellerStatistics();
      loadDashboardStatistics();
      
      // Reload pending orders if still on pending tab
      if (orderFilter === "pending") {
        loadPendingOrders();
      }

      alert("Xác nhận đơn hàng thành công!");
    } catch (error) {
      console.error("Error verifying order:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể xác nhận đơn hàng. Vui lòng thử lại.";
      alert(errorMessage);
    } finally {
      setVerifying((prev) => ({ ...prev, [orderId]: false }));
    }
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

      {/* Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1.5rem",
          marginTop: "2rem",
        }}
      >
        {/* Total Revenue Chart */}
        <div
          className="recent-orders"
          style={{ minHeight: "300px", display: "flex", flexDirection: "column" }}
        >
          <h3>Tổng doanh thu</h3>
          <div style={{ flex: 1, minHeight: "250px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ flex: 1, minHeight: "200px" }}>
              <Bar data={totalRevenueChartData} options={totalRevenueChartOptions} />
            </div>
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#10B981"
              }}>
                {formatCurrency(statistics.totalRevenue || totalRevenueFromOrders)}
              </div>
              <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Tổng doanh thu từ tất cả đơn hàng
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview Chart */}
        <div
          className="recent-orders"
          style={{ minHeight: "300px", display: "flex", flexDirection: "column" }}
        >
          <h3>Tổng quan thống kê</h3>
          <div style={{ flex: 1, minHeight: "250px" }}>
            <Bar data={statisticsChartData} options={barChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );

  // Render pending orders section (đơn hàng chờ xác nhận)
  const renderPendingOrders = () => {
    if (pendingOrdersLoading) {
      return (
        <div className="orders-section">
          <div className="section-header">
            <h2>Quản lý đơn hàng</h2>
          </div>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${orderFilter === "all" ? "active" : ""}`}
              onClick={() => setOrderFilter("all")}
            >
              Tất cả ({statistics.totalOrders})
            </button>
            <button
              className={`filter-tab ${orderFilter === "pending" ? "active" : ""}`}
              onClick={() => setOrderFilter("pending")}
            >
              Chờ xác nhận ({statistics.pendingOrders})
            </button>
            <button
              className={`filter-tab ${orderFilter === "shipping" ? "active" : ""}`}
              onClick={() => setOrderFilter("shipping")}
            >
              Đang giao (
              {
                orders.filter(
                  (o) =>
                    o.status?.toUpperCase() === "SHIPPING" ||
                    o.status?.toUpperCase() === "PREPARING"
                ).length
              }
              )
            </button>
            <button
              className={`filter-tab ${orderFilter === "delivered" ? "active" : ""}`}
              onClick={() => setOrderFilter("delivered")}
            >
              Hoàn tất (
              {orders.filter((o) => o.status?.toUpperCase() === "DELIVERED").length}
              )
            </button>
          </div>
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className="loading-spinner"></div>
            <p>Đang tải đơn hàng chờ xác nhận...</p>
          </div>
        </div>
      );
    }

    if (pendingOrders.length === 0) {
      return (
        <div className="orders-section">
          <div className="section-header">
            <h2>Quản lý đơn hàng</h2>
          </div>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${orderFilter === "all" ? "active" : ""}`}
              onClick={() => setOrderFilter("all")}
            >
              Tất cả ({statistics.totalOrders})
            </button>
            <button
              className={`filter-tab ${orderFilter === "pending" ? "active" : ""}`}
              onClick={() => setOrderFilter("pending")}
            >
              Chờ xác nhận ({statistics.pendingOrders})
            </button>
            <button
              className={`filter-tab ${orderFilter === "shipping" ? "active" : ""}`}
              onClick={() => setOrderFilter("shipping")}
            >
              Đang giao (
              {
                orders.filter(
                  (o) =>
                    o.status?.toUpperCase() === "SHIPPING" ||
                    o.status?.toUpperCase() === "PREPARING"
                ).length
              }
              )
            </button>
            <button
              className={`filter-tab ${orderFilter === "delivered" ? "active" : ""}`}
              onClick={() => setOrderFilter("delivered")}
            >
              Hoàn tất (
              {orders.filter((o) => o.status?.toUpperCase() === "DELIVERED").length}
              )
            </button>
          </div>
          <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
            <Package
              size={64}
              style={{ margin: "0 auto 1rem", opacity: 0.5 }}
            />
            <h3>Chưa có đơn hàng nào đang chờ</h3>
            <p>Hiện tại bạn không có đơn hàng nào đang chờ xác nhận.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="orders-section">
        <div className="section-header">
          <h2>Quản lý đơn hàng</h2>
        </div>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${orderFilter === "all" ? "active" : ""}`}
            onClick={() => setOrderFilter("all")}
          >
            Tất cả ({orders.length})
          </button>
          <button
            className={`filter-tab ${orderFilter === "pending" ? "active" : ""}`}
            onClick={() => setOrderFilter("pending")}
          >
            Chờ xác nhận ({pendingOrders.length})
          </button>
          <button
            className={`filter-tab ${orderFilter === "shipping" ? "active" : ""}`}
            onClick={() => setOrderFilter("shipping")}
          >
            Đang giao (
            {
              orders.filter(
                (o) =>
                  o.status?.toUpperCase() === "SHIPPING" ||
                  o.status?.toUpperCase() === "PREPARING"
              ).length
            }
            )
          </button>
          <button
            className={`filter-tab ${orderFilter === "delivered" ? "active" : ""}`}
            onClick={() => setOrderFilter("delivered")}
          >
            Hoàn tất (
            {orders.filter((o) => o.status?.toUpperCase() === "DELIVERED").length}
            )
          </button>
        </div>

        <div className="orders-table">
          {pendingOrders.map((order) => {
            const orderId = order.id || order.orderId;
            const isVerifying = verifying[orderId];
            const totalAmount = (order.price || order.totalPrice || 0) + (order.shippingFee || 0);

            return (
              <div key={orderId} className="order-card">
                <div className="order-header">
                  <div className="order-id">
                    #{order.orderCode || order.orderId || orderId}
                  </div>
                  <div className="order-date">
                    <Clock size={14} />
                    {formatDate(order.createdAt || order.orderDate)}
                  </div>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor("PENDING") }}
                  >
                    {getStatusText("PENDING")}
                  </span>
                </div>

                <div className="order-details">
                  <div className="customer-info">
                    <h4>
                      <MapPin size={16} /> Địa chỉ giao hàng
                    </h4>
                    <p>{order.shippingAddress || order.address || "N/A"}</p>
                    <p>
                      <Phone size={16} /> {order.phoneNumber || order.buyerPhone || "N/A"}
                    </p>
                    {order.buyerName && (
                      <p>
                        <Users size={16} /> {order.buyerName}
                      </p>
                    )}
                  </div>

                  <div className="product-info">
                    <h4>
                      <DollarSign size={16} /> Thông tin thanh toán
                    </h4>
                    <p>Giá sản phẩm: {formatCurrency(order.price || order.totalPrice || 0)}</p>
                    <p>Phí vận chuyển: {formatCurrency(order.shippingFee || 0)}</p>
                    <p className="total-amount">
                      Tổng tiền: {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="order-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleVerifyOrder(orderId)}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw size={16} className="spinner" />
                        Đang xác nhận...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Xác nhận đơn hàng
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      navigate(`/order-tracking/${orderId}`)
                    }
                  >
                    <Eye size={16} />
                    Chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    // If pending filter is selected, show pending orders
    if (orderFilter === "pending") {
      return renderPendingOrders();
    }

    // Filter orders based on selected tab
    const filteredOrders = orders.filter((order) => {
      const status = order.status?.toUpperCase();
      switch (orderFilter) {
        case "shipping":
          return status === "SHIPPING" || status === "PREPARING";
        case "delivered":
          return status === "DELIVERED";
        default:
          return true; // all
      }
    });

    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="loading-spinner"></div>
          <p>Đang tải đơn hàng...</p>
        </div>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <div className="orders-section">
          <div className="section-header">
            <h2>Quản lý đơn hàng</h2>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`filter-tab ${orderFilter === "all" ? "active" : ""}`}
              onClick={() => setOrderFilter("all")}
            >
              Tất cả ({statistics.totalOrders})
            </button>
            <button
              className={`filter-tab ${orderFilter === "pending" ? "active" : ""}`}
              onClick={() => setOrderFilter("pending")}
            >
              Chờ xác nhận ({statistics.pendingOrders})
            </button>
            <button
              className={`filter-tab ${orderFilter === "shipping" ? "active" : ""}`}
              onClick={() => setOrderFilter("shipping")}
            >
              Đang giao (
              {
                orders.filter(
                  (o) =>
                    o.status?.toUpperCase() === "SHIPPING" ||
                    o.status?.toUpperCase() === "PREPARING"
                ).length
              }
              )
            </button>
            <button
              className={`filter-tab ${orderFilter === "delivered" ? "active" : ""}`}
              onClick={() => setOrderFilter("delivered")}
            >
              Hoàn tất (
              {orders.filter((o) => o.status?.toUpperCase() === "DELIVERED").length}
              )
            </button>
          </div>

          <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
            <ShoppingCart
              size={64}
              style={{ margin: "0 auto 1rem", opacity: 0.5 }}
            />
            <h3>Chưa có đơn hàng nào</h3>
            <p>Bạn chưa có đơn hàng nào trong danh mục này.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="orders-section">
        <div className="section-header">
          <h2>Quản lý đơn hàng</h2>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${orderFilter === "all" ? "active" : ""}`}
            onClick={() => setOrderFilter("all")}
          >
            Tất cả ({orders.length})
          </button>
          <button
            className={`filter-tab ${orderFilter === "pending" ? "active" : ""}`}
            onClick={() => setOrderFilter("pending")}
          >
            Chờ xác nhận (
            {orders.filter((o) => o.status?.toUpperCase() === "PENDING").length}
            )
          </button>
          <button
            className={`filter-tab ${orderFilter === "shipping" ? "active" : ""}`}
            onClick={() => setOrderFilter("shipping")}
          >
            Đang giao (
            {
              orders.filter(
                (o) =>
                  o.status?.toUpperCase() === "SHIPPING" ||
                  o.status?.toUpperCase() === "PREPARING"
              ).length
            }
            )
          </button>
          <button
            className={`filter-tab ${orderFilter === "delivered" ? "active" : ""}`}
            onClick={() => setOrderFilter("delivered")}
          >
            Hoàn tất (
            {orders.filter((o) => o.status?.toUpperCase() === "DELIVERED").length}
            )
          </button>
        </div>

        <div className="orders-table">
          {filteredOrders.map((order) => (
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



  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Bảng điều khiển người bán</h1>
          <p>
            Chào mừng trở lại,{" "}
            {sellerInfo?.fullName || sellerInfo?.username || "Người Bán"}!
          </p>
        </div>
        <div className="header-right">
          {/* Buttons moved to header navigation */}
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
          </nav>
        </div>

        <div className="main-content">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "orders" && renderOrders()}
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
