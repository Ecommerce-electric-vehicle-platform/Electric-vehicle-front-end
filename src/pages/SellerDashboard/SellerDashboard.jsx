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
  Store,
  Star,
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
  const [orderFilter, setOrderFilter] = useState("all"); // all, pending, shipping, delivered, completed
  const [orders, setOrders] = useState([]); // Orders hiển thị theo filter hiện tại
  const [allOrders, setAllOrders] = useState([]); // Tất cả đơn hàng để đếm số lượng
  const [deliveringOrders, setDeliveringOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
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

  // Load thông tin seller từ API (lấy từ JWT token)
  // API: GET /api/v1/seller/profile
  //Lấy thông tin seller để hiện thị dashboard 
  const loadSellerData = async () => {
    try {
      // getSellerProfile() đã trả về response.data.data trực tiếp
      const sellerData = await sellerApi.getSellerProfile();
      console.log("[SellerDashboard] Seller profile data:", sellerData);
      setSellerInfo(sellerData);
    } catch (error) {
      console.error("Error loading seller profile:", error);
    }
  };

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

  const loadSellerOrders = useCallback(async (shouldUpdateAllOrders = true) => {
    try {
      setLoading(true);
      // Sử dụng getTotalOrders API để lấy tất cả đơn hàng
      // Response: { success: true, data: { orders: [...], totalOrders: 2, ... } }
      const response = await sellerApi.getTotalOrders(0, 50);
      const responseData = response?.data?.data;
      
      // Lấy orders từ response
      // Nếu data.data là object có orders → lấy orders, nếu là array → lấy trực tiếp
      let ordersData = [];
      if (responseData) {
        if (Array.isArray(responseData)) {
          ordersData = responseData;
        } else if (responseData.orders && Array.isArray(responseData.orders)) {
          ordersData = responseData.orders;
        }
      }
      
      console.log("[SellerDashboard] Loaded orders from getTotalOrders:", ordersData.length);
      console.log("[SellerDashboard] Orders data:", ordersData);
      console.log("[SellerDashboard] Orders statuses:", ordersData.map(o => ({ id: o.id || o.orderId, status: o.status })));
      
      // QUAN TRỌNG: Chỉ set allOrders khi shouldUpdateAllOrders = true (khi load lần đầu hoặc ở tab "all")
      // Đảm bảo allOrders luôn chứa TẤT CẢ đơn hàng để đếm số lượng chính xác
      if (shouldUpdateAllOrders) {
        setAllOrders(prevAllOrders => {
          console.log("[SellerDashboard] Updating allOrders from", prevAllOrders.length, "to", ordersData.length, "orders");
          return ordersData;
        });
        console.log("[SellerDashboard] Set allOrders to:", ordersData.length, "orders");
      } else {
        console.log("[SellerDashboard] Keeping allOrders unchanged");
      }
      
      // Chỉ set orders nếu đang ở tab "all"
      if (orderFilter === "all") {
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Error loading seller orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [orderFilter]);

  // Load delivering orders (đơn hàng đang giao)
  const loadDeliveringOrders = useCallback(async () => {
    try {
      // Chỉ set loading nếu đang ở tab "Đang giao" để tránh conflict
      const isShippingTab = orderFilter === "shipping";
      if (isShippingTab) {
        setLoading(true);
      }
      console.log("[SellerDashboard] Calling getDeliveringOrders API...");
      console.log("[SellerDashboard] Current orderFilter when calling:", orderFilter);
      const response = await sellerApi.getDeliveringOrders(0, 50);
      console.log("[SellerDashboard] getDeliveringOrders response:", response);
      console.log("[SellerDashboard] response?.data:", response?.data);
      console.log("[SellerDashboard] response?.data?.data:", response?.data?.data);
      
      const responseData = response?.data?.data;
      // Xử lý nhiều trường hợp response structure
      let ordersData = [];
      if (Array.isArray(responseData)) {
        ordersData = responseData;
      } else if (responseData?.content && Array.isArray(responseData.content)) {
        ordersData = responseData.content;
      } else if (responseData?.orders && Array.isArray(responseData.orders)) {
        ordersData = responseData.orders;
      } else if (responseData?.list && Array.isArray(responseData.list)) {
        ordersData = responseData.list;
      }
      
      const deliveringOrdersArray = Array.isArray(ordersData) ? ordersData : [];
      console.log("[SellerDashboard] Parsed delivering orders:", deliveringOrdersArray);
      console.log("[SellerDashboard] Delivering orders count:", deliveringOrdersArray.length);
      console.log("[SellerDashboard] Current orderFilter after parsing:", orderFilter);
      
      // QUAN TRỌNG: Luôn set deliveringOrders để đếm số lượng trong tab
      setDeliveringOrders(deliveringOrdersArray);
      
      // Chỉ set vào orders nếu đang ở tab "Đang giao" để đảm bảo hiển thị
      // Sử dụng biến isShippingTab để tránh closure issue
      if (isShippingTab) {
        console.log("[SellerDashboard] Setting delivering orders to orders state");
        setOrders(deliveringOrdersArray);
      }
    } catch (error) {
      console.error("[SellerDashboard] Error loading delivering orders:", error);
      console.error("[SellerDashboard] Error details:", error?.response?.data);
      setDeliveringOrders([]);
      if (orderFilter === "shipping") {
        setOrders([]);
      }
    } finally {
      if (orderFilter === "shipping") {
        setLoading(false);
      }
    }
  }, [orderFilter]);

  // Load completed orders (đơn hàng đã hoàn thành)
  const loadCompletedOrders = useCallback(async () => {
    try {
      // Chỉ set loading nếu đang ở tab "Hoàn tất" để tránh conflict
      if (orderFilter === "delivered" || orderFilter === "completed") {
        setLoading(true);
      }
      const response = await sellerApi.getCompletedOrders(0, 50);
      const responseData = response?.data?.data;
      const ordersData = responseData?.content || responseData || [];
      const completedOrdersArray = Array.isArray(ordersData) ? ordersData : [];
      setCompletedOrders(completedOrdersArray);
      console.log("[SellerDashboard] Loaded completed orders:", completedOrdersArray.length);
      
      // Chỉ set vào orders nếu đang ở tab "Hoàn tất"
      if (orderFilter === "delivered" || orderFilter === "completed") {
        setOrders(completedOrdersArray);
      }
    } catch (error) {
      console.error("Error loading completed orders:", error);
      setCompletedOrders([]);
      if (orderFilter === "delivered" || orderFilter === "completed") {
        setOrders([]);
      }
    } finally {
      if (orderFilter === "delivered" || orderFilter === "completed") {
        setLoading(false);
      }
    }
  }, [orderFilter]);

  // Load seller reviews (đánh giá từ khách hàng)
  // Response: { success: true, data: { content: [{ orderId, orderResponse, rating, feedback, reviewImages }] } }
  const loadSellerReviews = useCallback(async () => {
    try {
      console.log("[SellerDashboard] Calling getSellerReviews API...");
      const response = await sellerApi.getSellerReviews(0, 50);
      console.log("[SellerDashboard] getSellerReviews response:", response);
      console.log("[SellerDashboard] response?.data:", response?.data);
      console.log("[SellerDashboard] response?.data?.data:", response?.data?.data);
      
      const responseData = response?.data?.data;
      // Xử lý nhiều trường hợp response structure
      let reviewsData = [];
      if (Array.isArray(responseData)) {
        reviewsData = responseData;
      } else if (responseData?.content && Array.isArray(responseData.content)) {
        reviewsData = responseData.content;
      } else if (responseData?.reviews && Array.isArray(responseData.reviews)) {
        reviewsData = responseData.reviews;
      } else if (responseData?.list && Array.isArray(responseData.list)) {
        reviewsData = responseData.list;
      }
      
      const reviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
      console.log("[SellerDashboard] Parsed reviews:", reviewsArray);
      console.log("[SellerDashboard] Loaded reviews count:", reviewsArray.length);
      setReviews(reviewsArray);
    } catch (error) {
      console.error("[SellerDashboard] Error loading seller reviews:", error);
      console.error("[SellerDashboard] Error details:", error?.response?.data);
      setReviews([]);
    }
  }, []);

  // Load seller data and orders - CHỈ CHẠY MỘT LẦN KHI MOUNT
  useEffect(() => {
    console.log("[SellerDashboard] Initial load - loading all data");
    loadSellerData();
    loadSellerOrders(true); // Load tất cả đơn hàng và set allOrders (true = update allOrders)
    loadDeliveringOrders(); // Load delivering orders để hiển thị số lượng trong tab
    loadCompletedOrders(); // Load completed orders để hiển thị số lượng trong tab
    loadSellerStatistics();
    loadDashboardStatistics();
    loadSellerReviews(); // Load reviews
  }, [loadSellerOrders, loadDeliveringOrders, loadCompletedOrders, loadSellerReviews]);

  // Load orders based on filter
  useEffect(() => {
    console.log("[SellerDashboard] Order filter changed to:", orderFilter);
    if (orderFilter === "pending") {
      loadPendingOrders();
    } else if (orderFilter === "shipping") {
      // Khi click vào tab "Đang giao", load lại
      loadDeliveringOrders();
    } else if (orderFilter === "delivered" || orderFilter === "completed") {
      loadCompletedOrders();
    } else if (orderFilter === "all") {
      // Khi click vào tab "Tất cả", load lại và cập nhật allOrders
      loadSellerOrders(true);
    }
  }, [orderFilter, loadPendingOrders, loadDeliveringOrders, loadCompletedOrders, loadSellerOrders]);

  // Đảm bảo orders được set đúng khi deliveringOrders thay đổi và đang ở tab "Đang giao"
  useEffect(() => {
    console.log("[SellerDashboard] Sync check - orderFilter:", orderFilter, "deliveringOrders.length:", deliveringOrders.length);
    if (orderFilter === "shipping") {
      console.log("[SellerDashboard] Syncing deliveringOrders to orders state");
      setOrders(deliveringOrders);
    }
  }, [orderFilter, deliveringOrders]);

  // Đảm bảo orders được set đúng khi completedOrders thay đổi và đang ở tab "Hoàn tất"
  useEffect(() => {
    console.log("[SellerDashboard] Sync check - orderFilter:", orderFilter, "completedOrders.length:", completedOrders.length);
    if (orderFilter === "delivered" || orderFilter === "completed") {
      console.log("[SellerDashboard] Syncing completedOrders to orders state");
      setOrders(completedOrders);
    }
  }, [orderFilter, completedOrders]);

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
      // API getTotalOrders trả về: { success: true, data: { orders: [...], totalOrders: 27, ... } }
      // Nếu data.data là object có totalOrders → lấy totalOrders, nếu là number → lấy trực tiếp
      const totalOrdersData = totalOrdersRes?.data?.data;
      const totalOrders = typeof totalOrdersData === 'object' && totalOrdersData?.totalOrders !== undefined 
        ? totalOrdersData.totalOrders 
        : (typeof totalOrdersData === 'number' ? totalOrdersData : 0);
      
      // Debug: Log response từ getTotalRevenue
      console.log("[SellerDashboard] getTotalRevenue response:", totalRevenueRes);
      console.log("[SellerDashboard] totalRevenueRes?.data:", totalRevenueRes?.data);
      console.log("[SellerDashboard] totalRevenueRes?.data?.data:", totalRevenueRes?.data?.data);
      
      // Xử lý totalRevenue: có thể là number trực tiếp hoặc trong object
      const totalRevenueData = totalRevenueRes?.data?.data;
      const totalRevenue = typeof totalRevenueData === 'number' 
        ? totalRevenueData 
        : (typeof totalRevenueData === 'object' && totalRevenueData?.totalRevenue !== undefined
          ? totalRevenueData.totalRevenue
          : 0);
      
      const totalPendingOrders = totalPendingOrdersRes?.data?.data ?? 0;
      const activePosts = activePostsRes?.data?.data ?? 0;
      
      console.log("[SellerDashboard] Parsed values:", {
        totalOrders,
        totalRevenue,
        totalPendingOrders,
        activePosts
      });

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
      case "PAID":
        return "#10B981";
      case "CONFIRMED":
        return "#3B82F6";
      case "PREPARING":
        return "#6366F1";
      case "SHIPPING":
        return "#10B981";
      case "DELIVERING":
        return "#10B981";
      case "DELIVERED":
        return "#059669";
      case "COMPLETED":
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
      case "PAID":
        return "Đã thanh toán";
      case "CONFIRMED":
        return "Đã xác nhận";
      case "PREPARING":
        return "Đang chuẩn bị";
      case "SHIPPING":
        return "Đang giao hàng";
      case "DELIVERING":
        return "Đang giao hàng";
      case "DELIVERED":
        return "Đã giao hàng";
      case "COMPLETED":
        return "Hoàn tất";
      case "CANCELLED":
        return "Đã hủy";
      default:
        // Log để debug nếu có status không xác định
        console.warn("[SellerDashboard] Unknown status:", status);
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
      // Cập nhật allOrders để số lượng trong tab được cập nhật
      loadSellerOrders(true);
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
      // Cập nhật allOrders để số lượng trong tab được cập nhật
      loadSellerOrders(true);
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
              Tất cả ({allOrders.length})
            </button>
            <button
              className={`filter-tab ${orderFilter === "pending" ? "active" : ""}`}
              onClick={() => setOrderFilter("pending")}
            >
              Chờ xác nhận ({(() => {
                const count = allOrders.filter(o => {
                  const status = o.status?.toUpperCase();
                  return status === "PENDING";
                }).length;
                console.log("[SellerDashboard] Pending count:", count, "from", allOrders.length, "orders");
                return count;
              })()})
            </button>
            <button
              className={`filter-tab ${orderFilter === "shipping" ? "active" : ""}`}
              onClick={() => setOrderFilter("shipping")}
            >
              Đang giao ({(() => {
                // Log tất cả status để debug
                console.log("[SellerDashboard] All orders with statuses:", allOrders.map(o => ({
                  id: o.id || o.orderId,
                  orderCode: o.orderCode,
                  status: o.status,
                  statusUpper: o.status?.toUpperCase()
                })));
                
                const count = allOrders.filter(o => {
                  const status = o.status?.toUpperCase();
                  // Bao gồm nhiều status có thể là "đang giao"
                  const isDelivering = 
                    status === "SHIPPING" || 
                    status === "PREPARING" || 
                    status === "DELIVERING" ||
                    status === "PAID" || // Đã thanh toán nhưng chưa giao
                    status === "CONFIRMED"; // Đã xác nhận, có thể đang chuẩn bị giao
                  
                  if (isDelivering) {
                    console.log("[SellerDashboard] Found delivering order:", o.id || o.orderId, "orderCode:", o.orderCode, "status:", status);
                  }
                  return isDelivering;
                }).length;
                
                console.log("[SellerDashboard] Delivering count:", count, "from", allOrders.length, "orders");
                console.log("[SellerDashboard] Orders NOT in delivering:", allOrders.filter(o => {
                  const status = o.status?.toUpperCase();
                  return !(status === "SHIPPING" || status === "PREPARING" || status === "DELIVERING" || status === "PAID" || status === "CONFIRMED");
                }).map(o => ({ id: o.id || o.orderId, orderCode: o.orderCode, status: o.status })));
                
                return count;
              })()})
            </button>
            <button
              className={`filter-tab ${orderFilter === "delivered" ? "active" : ""}`}
              onClick={() => setOrderFilter("delivered")}
            >
              Hoàn tất ({allOrders.filter(o => {
                const status = o.status?.toUpperCase();
                return status === "DELIVERED" || status === "COMPLETED";
              }).length})
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
              Tất cả ({allOrders.length})
            </button>
            <button
              className={`filter-tab ${orderFilter === "pending" ? "active" : ""}`}
              onClick={() => setOrderFilter("pending")}
            >
              Chờ xác nhận ({(() => {
                const count = allOrders.filter(o => {
                  const status = o.status?.toUpperCase();
                  return status === "PENDING";
                }).length;
                console.log("[SellerDashboard] Pending count:", count, "from", allOrders.length, "orders");
                return count;
              })()})
            </button>
            <button
              className={`filter-tab ${orderFilter === "shipping" ? "active" : ""}`}
              onClick={() => setOrderFilter("shipping")}
            >
              Đang giao ({(() => {
                // Log tất cả status để debug
                console.log("[SellerDashboard] All orders with statuses:", allOrders.map(o => ({
                  id: o.id || o.orderId,
                  orderCode: o.orderCode,
                  status: o.status,
                  statusUpper: o.status?.toUpperCase()
                })));
                
                const count = allOrders.filter(o => {
                  const status = o.status?.toUpperCase();
                  // Bao gồm nhiều status có thể là "đang giao"
                  const isDelivering = 
                    status === "SHIPPING" || 
                    status === "PREPARING" || 
                    status === "DELIVERING" ||
                    status === "PAID" || // Đã thanh toán nhưng chưa giao
                    status === "CONFIRMED"; // Đã xác nhận, có thể đang chuẩn bị giao
                  
                  if (isDelivering) {
                    console.log("[SellerDashboard] Found delivering order:", o.id || o.orderId, "orderCode:", o.orderCode, "status:", status);
                  }
                  return isDelivering;
                }).length;
                
                console.log("[SellerDashboard] Delivering count:", count, "from", allOrders.length, "orders");
                console.log("[SellerDashboard] Orders NOT in delivering:", allOrders.filter(o => {
                  const status = o.status?.toUpperCase();
                  return !(status === "SHIPPING" || status === "PREPARING" || status === "DELIVERING" || status === "PAID" || status === "CONFIRMED");
                }).map(o => ({ id: o.id || o.orderId, orderCode: o.orderCode, status: o.status })));
                
                return count;
              })()})
            </button>
            <button
              className={`filter-tab ${orderFilter === "delivered" ? "active" : ""}`}
              onClick={() => setOrderFilter("delivered")}
            >
              Hoàn tất ({allOrders.filter(o => {
                const status = o.status?.toUpperCase();
                return status === "DELIVERED" || status === "COMPLETED";
              }).length})
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

    // Sử dụng dữ liệu từ API tương ứng với filter
    // QUAN TRỌNG: Ưu tiên sử dụng `orders` state vì nó được set khi click vào tab
    // Nếu `orders` rỗng, fallback về state tương ứng
    let filteredOrders = [];
    switch (orderFilter) {
      case "shipping":
        // Ưu tiên dùng orders (đã được set khi loadDeliveringOrders), nếu rỗng thì dùng deliveringOrders
        filteredOrders = orders.length > 0 ? orders : deliveringOrders;
        console.log("[SellerDashboard] renderOrders - shipping:", {
          ordersLength: orders.length,
          deliveringOrdersLength: deliveringOrders.length,
          filteredOrdersLength: filteredOrders.length
        });
        break;
      case "delivered":
      case "completed":
        // Ưu tiên dùng orders (đã được set khi loadCompletedOrders), nếu rỗng thì dùng completedOrders
        filteredOrders = orders.length > 0 ? orders : completedOrders;
        console.log("[SellerDashboard] renderOrders - completed:", {
          ordersLength: orders.length,
          completedOrdersLength: completedOrders.length,
          filteredOrdersLength: filteredOrders.length
        });
        break;
      default:
        // Tất cả orders từ API getSellerOrders
        filteredOrders = orders;
        break;
    }

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
              Tất cả ({allOrders.length})
            </button>
            <button
              className={`filter-tab ${orderFilter === "pending" ? "active" : ""}`}
              onClick={() => setOrderFilter("pending")}
            >
              Chờ xác nhận ({(() => {
                const count = allOrders.filter(o => {
                  const status = o.status?.toUpperCase();
                  return status === "PENDING";
                }).length;
                console.log("[SellerDashboard] Pending count:", count, "from", allOrders.length, "orders");
                return count;
              })()})
            </button>
            <button
              className={`filter-tab ${orderFilter === "shipping" ? "active" : ""}`}
              onClick={() => setOrderFilter("shipping")}
            >
              Đang giao ({(() => {
                // Log tất cả status để debug
                console.log("[SellerDashboard] All orders with statuses:", allOrders.map(o => ({
                  id: o.id || o.orderId,
                  orderCode: o.orderCode,
                  status: o.status,
                  statusUpper: o.status?.toUpperCase()
                })));
                
                const count = allOrders.filter(o => {
                  const status = o.status?.toUpperCase();
                  // Bao gồm nhiều status có thể là "đang giao"
                  const isDelivering = 
                    status === "SHIPPING" || 
                    status === "PREPARING" || 
                    status === "DELIVERING" ||
                    status === "PAID" || // Đã thanh toán nhưng chưa giao
                    status === "CONFIRMED"; // Đã xác nhận, có thể đang chuẩn bị giao
                  
                  if (isDelivering) {
                    console.log("[SellerDashboard] Found delivering order:", o.id || o.orderId, "orderCode:", o.orderCode, "status:", status);
                  }
                  return isDelivering;
                }).length;
                
                console.log("[SellerDashboard] Delivering count:", count, "from", allOrders.length, "orders");
                console.log("[SellerDashboard] Orders NOT in delivering:", allOrders.filter(o => {
                  const status = o.status?.toUpperCase();
                  return !(status === "SHIPPING" || status === "PREPARING" || status === "DELIVERING" || status === "PAID" || status === "CONFIRMED");
                }).map(o => ({ id: o.id || o.orderId, orderCode: o.orderCode, status: o.status })));
                
                return count;
              })()})
            </button>
            <button
              className={`filter-tab ${orderFilter === "delivered" ? "active" : ""}`}
              onClick={() => setOrderFilter("delivered")}
            >
              Hoàn tất ({allOrders.filter(o => {
                const status = o.status?.toUpperCase();
                return status === "DELIVERED" || status === "COMPLETED";
              }).length})
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
            Tất cả ({allOrders.length})
          </button>
          <button
            className={`filter-tab ${orderFilter === "pending" ? "active" : ""}`}
            onClick={() => setOrderFilter("pending")}
          >
            Chờ xác nhận ({allOrders.filter((o) => o.status?.toUpperCase() === "PENDING").length})
          </button>
          <button
            className={`filter-tab ${orderFilter === "shipping" ? "active" : ""}`}
            onClick={() => setOrderFilter("shipping")}
          >
            Đang giao ({allOrders.filter(o => {
              const status = o.status?.toUpperCase();
              return status === "SHIPPING" || status === "PREPARING" || status === "DELIVERING" || status === "PAID" || status === "CONFIRMED";
            }).length})
          </button>
          <button
            className={`filter-tab ${orderFilter === "delivered" ? "active" : ""}`}
            onClick={() => setOrderFilter("delivered")}
          >
            Hoàn tất ({allOrders.filter((o) => {
              const status = o.status?.toUpperCase();
              return status === "DELIVERED" || status === "COMPLETED";
            }).length})
          </button>
        </div>

        <div className="orders-table">
          {filteredOrders.map((order) => {
            const orderId = order.id || order.orderId;
            const orderCode = order.orderCode || `#${orderId}`;
            const phoneNumber = order.phoneNumber || order.buyer?.phone || order.buyerPhone || "N/A";
            const shippingAddress = order.shippingAddress || "Địa chỉ không xác định";
            const price = order.price || 0;
            const shippingFee = order.shippingFee || 0;
            const totalAmount = price + shippingFee;
            
            // Log để debug status
            const orderStatus = order.status || order.orderStatus || order.order_status;
            if (orderFilter === "delivered" || orderFilter === "completed") {
              console.log("[SellerDashboard] Order status for completed tab:", {
                orderCode,
                orderId,
                status: orderStatus,
                statusUpper: orderStatus?.toUpperCase(),
                allStatusFields: {
                  status: order.status,
                  orderStatus: order.orderStatus,
                  order_status: order.order_status,
                  statusCode: order.statusCode
                }
              });
            }
            
            return (
              <div key={orderId} className="order-card">
              <div className="order-header">
                <div className="order-id">{orderCode}</div>
                <div className="order-date">
                  {new Date(
                    order.createdAt || order.orderDate
                  ).toLocaleDateString("vi-VN")}
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(orderStatus) }}
                >
                  {getStatusText(orderStatus)}
                </span>
              </div>

              <div className="order-details">
                <div className="customer-info">
                  <h4>
                    {order.buyer?.fullName || order.buyerName || "Khách hàng"}
                  </h4>
                  <p>
                    <Phone size={16} /> {phoneNumber}
                  </p>
                  <p>
                    <MapPin size={16} /> {shippingAddress}
                  </p>
                </div>

                <div className="product-info">
                  <h4>
                    <DollarSign size={16} /> Thông tin thanh toán
                  </h4>
                  <p>Giá sản phẩm: {formatCurrency(price)}</p>
                  <p>Phí vận chuyển: {formatCurrency(shippingFee)}</p>
                  <p className="total-amount">
                    Tổng tiền: {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>

              <div className="order-actions">
                {order.status === "PENDING" && orderFilter !== "all" && (
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
            );
          })}
        </div>
      </div>
    );
  };

  // Render reviews section
  const renderReviews = () => {
    return (
      <div className="orders-section">
        <div className="section-header">
          <h2>Đánh giá từ khách hàng</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className="loading-spinner"></div>
            <p>Đang tải đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
            <Star size={64} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <h3>Chưa có đánh giá nào</h3>
            <p>Bạn chưa nhận được đánh giá nào từ khách hàng.</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review, index) => {
              // Lấy dữ liệu từ cấu trúc response của BE
              const rating = review.rating || 0;
              const feedback = review.feedback || "Không có nhận xét";
              const orderId = review.orderId || review.orderResponse?.id || "N/A";
              const orderCode = review.orderResponse?.orderCode || orderId;
              const orderResponse = review.orderResponse || {};
              const shippingAddress = orderResponse.shippingAddress || "N/A";
              const phoneNumber = orderResponse.phoneNumber || "N/A";
              const createdAt = orderResponse.updatedAt || orderResponse.createdAt || "";
              const reviewImages = review.reviewImages || [];
              
              // Key cho React
              const reviewKey = review.id || review.reviewId || `review-${orderId}-${index}`;
              
              return (
                <div key={reviewKey} className="review-card">
                  <div className="review-header">
                    <div className="review-buyer">
                      <Users size={18} />
                      <strong>Khách hàng</strong>
                    </div>
                    <div className="review-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= rating ? "#fbbf24" : "#e5e7eb"}
                          stroke={star <= rating ? "#fbbf24" : "#e5e7eb"}
                        />
                      ))}
                      <span className="rating-number">{rating}/5</span>
                    </div>
                  </div>
                  
                  <div className="review-content">
                    <p>{feedback}</p>
                  </div>
                  
                  {reviewImages.length > 0 && (
                    <div className="review-images">
                      {reviewImages.map((img, idx) => {
                        const imageUrl = img.imageUrl || img.url || img;
                        const imageKey = img.id || `img-${orderId}-${idx}`;
                        return (
                          <img
                            key={imageKey}
                            src={imageUrl}
                            alt={`Review image ${idx + 1}`}
                            className="review-image"
                            onError={(e) => {
                              console.error(`[SellerDashboard] Failed to load review image:`, imageUrl);
                              e.target.style.display = "none";
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="review-footer">
                    <div className="review-order-info">
                      <span className="review-order">Đơn hàng: #{orderCode}</span>
                      {phoneNumber && phoneNumber !== "N/A" && (
                        <span className="review-phone">
                          <Phone size={14} style={{ marginRight: "4px" }} />
                          {phoneNumber}
                        </span>
                      )}
                    </div>
                    {createdAt && (
                      <span className="review-date">
                        {new Date(createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  
                  {shippingAddress && shippingAddress !== "N/A" && (
                    <div className="review-shipping" style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e5e7eb", fontSize: "0.875rem", color: "#6b7280" }}>
                      <MapPin size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                      <span>{shippingAddress}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
          <button
            className="store-btn"
            onClick={() => {
              // Ưu tiên lấy từ sellerInfo (từ API getSellerProfile)
              // API trả về field "id" là sellerId
              console.log("[SellerDashboard] sellerInfo:", sellerInfo);
              console.log("[SellerDashboard] sellerInfo?.id:", sellerInfo?.id);
              console.log("[SellerDashboard] sellerInfo?.sellerId:", sellerInfo?.sellerId);
              console.log("[SellerDashboard] localStorage sellerId:", localStorage.getItem("sellerId"));
              
              const sellerId = sellerInfo?.id || sellerInfo?.sellerId || localStorage.getItem("sellerId");
              
              console.log("[SellerDashboard] Final sellerId to navigate:", sellerId);
              
              if (!sellerId) {
                alert("Không tìm thấy thông tin seller. Vui lòng đăng nhập lại.");
                return;
              }
              navigate(`/seller/${sellerId}`);
            }}
          >
            <Store size={18} />
            Cửa hàng của tôi
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
              className={`nav-item ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              <Star size={20} />
              Đánh giá ({reviews.length})
            </button>
          </nav>
        </div>

        <div className="main-content">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "orders" && renderOrders()}
          {activeTab === "reviews" && renderReviews()}
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
