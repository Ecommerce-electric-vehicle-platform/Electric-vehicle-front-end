import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  TrendingUp,
  Download,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function SellerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [orderFilter, setOrderFilter] = useState("all"); // all, pending, shipping, delivered
  const [timeFilter, setTimeFilter] = useState("month"); // day, week, month
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingOrders: 0,
  });
  const [sellerInfo, setSellerInfo] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueAnalyticsData, setRevenueAnalyticsData] = useState({
    labels: [],
    revenueData: [],
    ordersData: [],
    profitData: [],
  });
  const [reportsByCategory, setReportsByCategory] = useState([]);
  const [reportsByRegion, setReportsByRegion] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingOrdersLoading, setPendingOrdersLoading] = useState(false);
  const [verifying, setVerifying] = useState({});

  // ========== MOCK MODE FLAG ==========
  // Set to true to use mock data instead of API calls
  // Set to false to use real API (with fallback to mock data on error)
  const USE_MOCK_DATA = true;
  // ======================================

  // Mock data definitions
  const MOCK_MONTHLY_REVENUE = [
    { day: 1, revenue: 5000000 },
    { day: 2, revenue: 7500000 },
    { day: 3, revenue: 6000000 },
    { day: 4, revenue: 9000000 },
    { day: 5, revenue: 8000000 },
    { day: 6, revenue: 11000000 },
    { day: 7, revenue: 9500000 },
  ];

  const MOCK_TOP_PRODUCTS = [
    { name: "Xe điện VinFast", sales: 15 },
    { name: "Pin Lithium", sales: 12 },
    { name: "Xe đạp điện", sales: 8 },
    { name: "Sạc nhanh", sales: 6 },
    { name: "Phụ kiện", sales: 4 },
  ];

  const MOCK_REPORTS_BY_CATEGORY = [
    { name: "Xe điện", revenue: 45000000 },
    { name: "Pin và sạc", revenue: 38000000 },
    { name: "Phụ kiện", revenue: 15000000 },
    { name: "Khác", revenue: 12000000 },
  ];

  const MOCK_REPORTS_BY_REGION = [
    { region: "Hà Nội", revenue: 45000000 },
    { region: "TP. Hồ Chí Minh", revenue: 38000000 },
    { region: "Đà Nẵng", revenue: 15000000 },
    { region: "Khác", revenue: 12000000 },
  ];

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
    loadMonthlyRevenue();
    loadTopProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load pending orders when "pending" filter is selected
  useEffect(() => {
    if (orderFilter === "pending") {
      loadPendingOrders();
    }
  }, [orderFilter, loadPendingOrders]);

  // Load analytics when time filter changes
  useEffect(() => {
    loadRevenueAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  // Note: Calculations from orders are fallback methods called when API fails
  // They are called directly in the load functions, not in useEffect

  // Load monthly revenue data from API or Mock
  const loadMonthlyRevenue = async () => {
    // Use mock data if flag is enabled
    if (USE_MOCK_DATA) {
      console.log("[Mock Mode] Using mock monthly revenue data");
      setMonthlyRevenue(MOCK_MONTHLY_REVENUE);
      return;
    }

    // Try to load from API
    try {
      const response = await sellerApi.getMonthlyRevenue();
      const data = response?.data?.data || response?.data || [];
      
      // Process data - expect array of {day, revenue} or {date, revenue}
      if (Array.isArray(data) && data.length > 0) {
        const processedData = data.map((item, index) => ({
          day: item.day || item.date || index + 1,
          revenue: item.revenue || item.totalRevenue || 0,
        }));
        setMonthlyRevenue(processedData);
      } else {
        // Fallback: use mock data
        console.log("[Fallback] Using mock monthly revenue data");
        setMonthlyRevenue(MOCK_MONTHLY_REVENUE);
      }
    } catch (error) {
      console.error("Error loading monthly revenue:", error);
      // Fallback: use mock data
      console.log("[Fallback] Using mock monthly revenue data");
      setMonthlyRevenue(MOCK_MONTHLY_REVENUE);
    }
  };

  // Calculate monthly revenue from orders (fallback - not used when USE_MOCK_DATA = true)
  // eslint-disable-next-line no-unused-vars
  const calculateMonthlyRevenueFromOrders = () => {
    try {
      const now = new Date();
      const last7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayRevenue = orders
          .filter((order) => {
            const orderDate = new Date(order.createdAt || order.orderDate);
            return orderDate >= dayStart && orderDate <= dayEnd && 
                   order.status?.toUpperCase() !== "CANCELLED";
          })
          .reduce((sum, order) => {
            return sum + (order.totalPrice || order.totalAmount || 0);
          }, 0);
        
        last7Days.push({
          day: date.getDate(),
          revenue: dayRevenue,
        });
      }
      
      setMonthlyRevenue(last7Days);
    } catch (error) {
      console.error("Error calculating monthly revenue from orders:", error);
      setMonthlyRevenue([]);
    }
  };

  // Load top products from API or Mock
  const loadTopProducts = async () => {
    // Use mock data if flag is enabled
    if (USE_MOCK_DATA) {
      console.log("[Mock Mode] Using mock top products data");
      setTopProducts(MOCK_TOP_PRODUCTS);
      return;
    }

    // Try to load from API
    try {
      const response = await sellerApi.getTopProducts(5);
      const data = response?.data?.data || response?.data || [];
      
      if (Array.isArray(data) && data.length > 0) {
        const processedData = data.map((item) => ({
          name: item.productName || item.name || item.title || "Sản phẩm",
          sales: item.salesCount || item.sales || item.quantity || 0,
        }));
        setTopProducts(processedData);
      } else {
        // Fallback: use mock data
        console.log("[Fallback] Using mock top products data");
        setTopProducts(MOCK_TOP_PRODUCTS);
      }
    } catch (error) {
      console.error("Error loading top products:", error);
      // Fallback: use mock data
      console.log("[Fallback] Using mock top products data");
      setTopProducts(MOCK_TOP_PRODUCTS);
    }
  };

  // Calculate top products from orders (fallback - not used when USE_MOCK_DATA = true)
  // eslint-disable-next-line no-unused-vars
  const calculateTopProductsFromOrders = () => {
    try {
      const productMap = {};
      
      orders
        .filter((order) => order.status?.toUpperCase() !== "CANCELLED")
        .forEach((order) => {
          const productName = order.product?.name || order.productName || "Sản phẩm";
          if (!productMap[productName]) {
            productMap[productName] = 0;
          }
          productMap[productName] += order.quantity || 1;
        });
      
      const topProductsArray = Object.entries(productMap)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
      
      setTopProducts(topProductsArray.length > 0 ? topProductsArray : []);
    } catch (error) {
      console.error("Error calculating top products from orders:", error);
      setTopProducts([]);
    }
  };

  // Load revenue analytics from API or Mock
  const loadRevenueAnalytics = async () => {
    // Use mock data if flag is enabled
    if (USE_MOCK_DATA) {
      console.log("[Mock Mode] Using mock revenue analytics data");
      const mockData = getMockRevenueAnalytics(timeFilter);
      setRevenueAnalyticsData(mockData);
      return;
    }

    // Try to load from API
    try {
      const response = await sellerApi.getRevenueAnalytics(timeFilter);
      const data = response?.data?.data || response?.data || {};
      
      if (data.labels && data.revenueData) {
        setRevenueAnalyticsData({
          labels: data.labels || [],
          revenueData: data.revenueData || [],
          ordersData: data.ordersData || [],
          profitData: data.profitData || [],
        });
      } else {
        // Fallback: use mock data
        console.log("[Fallback] Using mock revenue analytics data");
        const mockData = getMockRevenueAnalytics(timeFilter);
        setRevenueAnalyticsData(mockData);
      }
    } catch (error) {
      console.error("Error loading revenue analytics:", error);
      // Fallback: use mock data
      console.log("[Fallback] Using mock revenue analytics data");
      const mockData = getMockRevenueAnalytics(timeFilter);
      setRevenueAnalyticsData(mockData);
    }
  };

  // Get mock revenue analytics data based on time filter
  const getMockRevenueAnalytics = (filter) => {
    if (filter === "day") {
      return {
        labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
        revenueData: [5000000, 7500000, 6000000, 9000000, 8000000, 11000000, 9500000],
        ordersData: [5, 8, 6, 9, 8, 11, 10],
        profitData: [1500000, 2250000, 1800000, 2700000, 2400000, 3300000, 2850000],
      };
    } else if (filter === "week") {
      return {
        labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
        revenueData: [45000000, 52000000, 48000000, 55000000],
        ordersData: [45, 52, 48, 55],
        profitData: [13500000, 15600000, 14400000, 16500000],
      };
    } else {
      // month
      return {
        labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
        revenueData: [180000000, 220000000, 200000000, 240000000, 210000000, 260000000, 230000000, 250000000, 240000000, 270000000, 260000000, 280000000],
        ordersData: [180, 220, 200, 240, 210, 260, 230, 250, 240, 270, 260, 280],
        profitData: [54000000, 66000000, 60000000, 72000000, 63000000, 78000000, 69000000, 75000000, 72000000, 81000000, 78000000, 84000000],
      };
    }
  };

  // Calculate revenue analytics from orders (fallback - not used when USE_MOCK_DATA = true)
  // eslint-disable-next-line no-unused-vars
  const calculateRevenueAnalyticsFromOrders = () => {
    try {
      let labels = [];
      let revenueData = [];
      let ordersData = [];
      
      if (timeFilter === "day") {
        labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));
          
          const dayOrders = orders.filter((order) => {
            const orderDate = new Date(order.createdAt || order.orderDate);
            return orderDate >= dayStart && orderDate <= dayEnd && 
                   order.status?.toUpperCase() !== "CANCELLED";
          });
          
          revenueData.push(
            dayOrders.reduce((sum, order) => sum + (order.totalPrice || order.totalAmount || 0), 0)
          );
          ordersData.push(dayOrders.length);
        }
      } else if (timeFilter === "week") {
        labels = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
        const now = new Date();
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          const weekOrders = orders.filter((order) => {
            const orderDate = new Date(order.createdAt || order.orderDate);
            return orderDate >= weekStart && orderDate <= weekEnd && 
                   order.status?.toUpperCase() !== "CANCELLED";
          });
          
          revenueData.push(
            weekOrders.reduce((sum, order) => sum + (order.totalPrice || order.totalAmount || 0), 0)
          );
          ordersData.push(weekOrders.length);
        }
      } else {
        // month
        labels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
        const currentYear = new Date().getFullYear();
        for (let month = 0; month < 12; month++) {
          const monthStart = new Date(currentYear, month, 1);
          const monthEnd = new Date(currentYear, month + 1, 0);
          
          const monthOrders = orders.filter((order) => {
            const orderDate = new Date(order.createdAt || order.orderDate);
            return orderDate >= monthStart && orderDate <= monthEnd && 
                   order.status?.toUpperCase() !== "CANCELLED";
          });
          
          revenueData.push(
            monthOrders.reduce((sum, order) => sum + (order.totalPrice || order.totalAmount || 0), 0)
          );
          ordersData.push(monthOrders.length);
        }
      }
      
      const profitData = revenueData.map((r) => r * 0.3); // 30% profit estimate
      
      setRevenueAnalyticsData({
        labels,
        revenueData,
        ordersData,
        profitData,
      });
    } catch (error) {
      console.error("Error calculating revenue analytics from orders:", error);
      setRevenueAnalyticsData({
        labels: [],
        revenueData: [],
        ordersData: [],
        profitData: [],
      });
    }
  };

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
      // Reload orders and related data after update
      loadSellerOrders();
      loadMonthlyRevenue();
      loadTopProducts();
      loadRevenueAnalytics();
      loadSellerStatistics();
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
      loadMonthlyRevenue();
      loadTopProducts();
      loadRevenueAnalytics();
      
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

  // Monthly revenue chart data
  const monthlyRevenueChart = useMemo(() => {
    const labels = monthlyRevenue.map((item) => `Ngày ${item.day}`);
    const data = monthlyRevenue.map((item) => item.revenue);

    return {
      labels,
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [monthlyRevenue]);

  // Top products chart data
  const topProductsChart = useMemo(() => {
    const labels = topProducts.map((item) => item.name);
    const data = topProducts.map((item) => item.sales);

    return {
      labels,
      datasets: [
        {
          label: "Số lượng bán",
          data,
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
          ],
        },
      ],
    };
  }, [topProducts]);

  const chartOptions = {
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
          callback: function (value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + "M";
            }
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + "K";
            }
            return value;
          },
        },
      },
    },
  };

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
      },
    },
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
        {/* Monthly Revenue Chart */}
        <div
          className="recent-orders"
          style={{ minHeight: "300px", display: "flex", flexDirection: "column" }}
        >
          <h3>Doanh thu tháng này</h3>
          <div style={{ flex: 1, minHeight: "250px" }}>
            {monthlyRevenue.length > 0 ? (
              <Line data={monthlyRevenueChart} options={chartOptions} />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#6b7280",
                }}
              >
                <p>Đang tải dữ liệu...</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Chart */}
        <div
          className="recent-orders"
          style={{ minHeight: "300px", display: "flex", flexDirection: "column" }}
        >
          <h3>Top sản phẩm bán chạy</h3>
          <div style={{ flex: 1, minHeight: "250px" }}>
            {topProducts.length > 0 ? (
              <Bar data={topProductsChart} options={barChartOptions} />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#6b7280",
                }}
              >
                <p>Đang tải dữ liệu...</p>
              </div>
            )}
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

  // Load reports by category and region
  useEffect(() => {
    loadReportsByCategory();
    loadReportsByRegion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReportsByCategory = async () => {
    // Use mock data if flag is enabled
    if (USE_MOCK_DATA) {
      console.log("[Mock Mode] Using mock reports by category data");
      setReportsByCategory(MOCK_REPORTS_BY_CATEGORY);
      return;
    }

    // Try to load from API
    try {
      const response = await sellerApi.getReportsByCategory();
      const data = response?.data?.data || response?.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setReportsByCategory(data);
      } else {
        // Fallback: use mock data
        console.log("[Fallback] Using mock reports by category data");
        setReportsByCategory(MOCK_REPORTS_BY_CATEGORY);
      }
    } catch (error) {
      console.error("Error loading reports by category:", error);
      // Fallback: use mock data
      console.log("[Fallback] Using mock reports by category data");
      setReportsByCategory(MOCK_REPORTS_BY_CATEGORY);
    }
  };

  const loadReportsByRegion = async () => {
    // Use mock data if flag is enabled
    if (USE_MOCK_DATA) {
      console.log("[Mock Mode] Using mock reports by region data");
      setReportsByRegion(MOCK_REPORTS_BY_REGION);
      return;
    }

    // Try to load from API
    try {
      const response = await sellerApi.getReportsByRegion();
      const data = response?.data?.data || response?.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setReportsByRegion(data);
      } else {
        // Fallback: use mock data
        console.log("[Fallback] Using mock reports by region data");
        setReportsByRegion(MOCK_REPORTS_BY_REGION);
      }
    } catch (error) {
      console.error("Error loading reports by region:", error);
      // Fallback: use mock data
      console.log("[Fallback] Using mock reports by region data");
      setReportsByRegion(MOCK_REPORTS_BY_REGION);
    }
  };

  // Calculate reports by category from orders (fallback - not used when USE_MOCK_DATA = true)
  // eslint-disable-next-line no-unused-vars
  const calculateReportsByCategoryFromOrders = () => {
    try {
      const categoryMap = {};
      orders
        .filter((order) => order.status?.toUpperCase() !== "CANCELLED")
        .forEach((order) => {
          const category = order.product?.category || order.category || "Khác";
          if (!categoryMap[category]) {
            categoryMap[category] = 0;
          }
          categoryMap[category] += order.totalPrice || order.totalAmount || 0;
        });
      
      const reports = Object.entries(categoryMap)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue);
      
      setReportsByCategory(reports);
    } catch (error) {
      console.error("Error calculating reports by category:", error);
      setReportsByCategory([]);
    }
  };

  // Calculate reports by region from orders (fallback - not used when USE_MOCK_DATA = true)
  // eslint-disable-next-line no-unused-vars
  const calculateReportsByRegionFromOrders = () => {
    try {
      const regionMap = {};
      orders
        .filter((order) => order.status?.toUpperCase() !== "CANCELLED")
        .forEach((order) => {
          const region = order.shippingAddress?.split(",").pop()?.trim() || 
                        order.buyer?.address?.split(",").pop()?.trim() || 
                        "Khác";
          if (!regionMap[region]) {
            regionMap[region] = 0;
          }
          regionMap[region] += order.totalPrice || order.totalAmount || 0;
        });
      
      const reports = Object.entries(regionMap)
        .map(([region, revenue]) => ({ region, revenue }))
        .sort((a, b) => b.revenue - a.revenue);
      
      setReportsByRegion(reports);
    } catch (error) {
      console.error("Error calculating reports by region:", error);
      setReportsByRegion([]);
    }
  };

  const analyticsChartData = useMemo(() => {
    const { labels, revenueData, ordersData, profitData } = revenueAnalyticsData;
    return {
      labels,
      datasets: [
        {
          label: "Doanh thu",
          data: revenueData,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
        },
        {
          label: "Đơn hàng",
          data: ordersData,
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y1",
        },
        {
          label: "Lợi nhuận",
          data: profitData,
          borderColor: "rgb(245, 158, 11)",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
        },
      ],
    };
  }, [revenueAnalyticsData]);

  const analyticsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + "M";
            }
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + "K";
            }
            return value;
          },
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const renderRevenue = () => {
    return (
      <div className="revenue-section">
        <div className="section-header">
          <h2>Doanh thu / Báo cáo</h2>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {/* Time Filter */}
            <div className="filter-tabs">
              <button
                className={`filter-tab ${timeFilter === "day" ? "active" : ""}`}
                onClick={() => setTimeFilter("day")}
              >
                <Calendar size={16} />
                Ngày
              </button>
              <button
                className={`filter-tab ${timeFilter === "week" ? "active" : ""}`}
                onClick={() => setTimeFilter("week")}
              >
                <Calendar size={16} />
                Tuần
              </button>
              <button
                className={`filter-tab ${timeFilter === "month" ? "active" : ""}`}
                onClick={() => setTimeFilter("month")}
              >
                <Calendar size={16} />
                Tháng
              </button>
            </div>
            {/* Export Button */}
            <button className="btn btn-primary" onClick={() => alert("Tính năng xuất báo cáo đang được phát triển")}>
              <Download size={16} />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="recent-orders" style={{ marginTop: "1.5rem", minHeight: "400px" }}>
          <h3>Biểu đồ doanh thu, đơn hàng và lợi nhuận</h3>
          <div style={{ height: "350px", marginTop: "1rem" }}>
            <Line data={analyticsChartData} options={analyticsChartOptions} />
          </div>
        </div>

        {/* Reports by Category/Region */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          {/* Report by Category */}
          <div className="recent-orders" style={{ minHeight: "300px" }}>
            <h3>Báo cáo theo danh mục</h3>
            <div style={{ marginTop: "1rem" }}>
              {reportsByCategory.length > 0 ? (
                reportsByCategory.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <span>{item.name || item.category || "Khác"}</span>
                    <span style={{ fontWeight: 600 }}>
                      {formatCurrency(item.revenue || 0)}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                  Chưa có dữ liệu
                </p>
              )}
            </div>
          </div>

          {/* Report by Region */}
          <div className="recent-orders" style={{ minHeight: "300px" }}>
            <h3>Báo cáo theo khu vực</h3>
            <div style={{ marginTop: "1rem" }}>
              {reportsByRegion.length > 0 ? (
                reportsByRegion.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <span>{item.region || "Khác"}</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatCurrency(item.revenue || 0)}
                  </span>
                </div>
                ))
              ) : (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                  Chưa có dữ liệu
                </p>
              )}
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <button
            className="btn btn-secondary"
            onClick={() => alert("Tính năng xem chi tiết đang được phát triển")}
          >
            <Eye size={16} />
            Xem chi tiết
          </button>
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
            <button
              className={`nav-item ${activeTab === "revenue" ? "active" : ""}`}
              onClick={() => setActiveTab("revenue")}
            >
              <TrendingUp size={20} />
              Doanh thu / Báo cáo
            </button>
          </nav>
        </div>

        <div className="main-content">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "orders" && renderOrders()}
          {activeTab === "revenue" && renderRevenue()}
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
