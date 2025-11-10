import React, { useState, useEffect } from "react";
import DashboardChart from "../../../components/Admin/Charts/DashboardChart";
import SafeBoundary from "../../../components/Admin/Widgets/SafeBoundary";
import StartCard from "../../../components/Admin/Widgets/StartCard";
import { CRow, CCol, CCard, CCardBody, CCardHeader } from "@coreui/react";
import {
  getTotalSellers,
  getTotalBuyers,
  getSubscriptionRevenue,
} from "../../../api/adminApi";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalBuyers: 0,
    subscriptionRevenue: 0,
    totalNewPosts: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [sellersRes, buyersRes, revenueRes] = await Promise.all([
          getTotalSellers(),
          getTotalBuyers(),
          getSubscriptionRevenue(),
        ]);

        // Extract data from responses
        // Backend có thể trả về dữ liệu trong res.data.data hoặc res.data
        const totalSellers =
          sellersRes?.data?.totalSellers ||
          sellersRes?.data?.total ||
          sellersRes?.data ||
          0;
        const totalBuyers =
          buyersRes?.data?.totalBuyers ||
          buyersRes?.data?.total ||
          buyersRes?.data ||
          0;
        const subscriptionRevenue =
          revenueRes?.data?.revenue ||
          revenueRes?.data?.totalRevenue ||
          revenueRes?.data ||
          0;

        setStats({
          totalSellers,
          totalBuyers,
          subscriptionRevenue,
          totalNewPosts: 0, // Sẽ được cập nhật từ DashboardChart
        });
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
        // Giữ giá trị mặc định nếu có lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format số với dấu phẩy
  const formatNumber = (num) => {
    if (typeof num === "number") {
      return num.toLocaleString("vi-VN");
    }
    return num || "0";
  };

  // Format tiền tệ
  const formatCurrency = (amount) => {
    if (typeof amount === "number") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount);
    }
    return "0 ₫";
  };

  const statCards = [
    {
      title: "Tổng số Người bán",
      value: loading ? "..." : formatNumber(stats.totalSellers),
      delta: undefined, // Không có delta cho dữ liệu thực
      color: "#6366F1",
      data: [18, 22, 30, 28, 25, 20, 17], // Dữ liệu mẫu cho chart nhỏ
    },
    {
      title: "Tổng số Người mua",
      value: loading ? "..." : formatNumber(stats.totalBuyers),
      delta: undefined,
      color: "#60A5FA",
      data: [5, 9, 12, 16, 14, 12, 10],
    },
    {
      title: "Doanh thu mua gói",
      value: loading ? "..." : formatCurrency(stats.subscriptionRevenue),
      delta: undefined,
      color: "#F59E0B",
      data: [30, 35, 38, 32, 28, 34, 36],
    },
    {
      title: "Bài đăng mới",
      value: loading ? "..." : formatNumber(stats.totalNewPosts),
      delta: undefined,
      color: "#F87171",
      data: [12, 10, 14, 16, 12, 18, 15],
    },
  ];

  return (
    <div style={{ padding: "2rem", background: "#f9fafb", minHeight: "100vh" }}>
      <div className="mb-4">
        <h2 
          className="fw-bold mb-2"
          style={{ 
            color: "#1f2937",
            fontSize: "1.875rem"
          }}
        >
          Dashboard
        </h2>
        <p 
          className="text-muted mb-0"
          style={{ 
            fontSize: "0.875rem",
            color: "#6b7280"
          }}
        >
          Tổng quan hệ thống và thống kê
        </p>
      </div>

      <CRow className="g-4 mb-4" style={{ display: "flex" }}>
        {statCards.map((s, idx) => (
          <CCol 
            key={idx} 
            xs={12} 
            md={6} 
            lg={3}
            style={{ display: "flex" }}
          >
            <StartCard
              title={s.title}
              value={s.value}
              delta={s.delta}
              color={s.color}
              data={s.data}
            />
          </CCol>
        ))}
      </CRow>

      <CCard 
        className="shadow-sm border-0"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <CCardBody style={{ padding: "2rem" }}>
          <SafeBoundary>
            <DashboardChart
              onDataUpdate={(totalNewPosts) =>
                setStats((prev) => ({ ...prev, totalNewPosts }))
              }
            />
          </SafeBoundary>
        </CCardBody>
      </CCard>
    </div>
  );
}
