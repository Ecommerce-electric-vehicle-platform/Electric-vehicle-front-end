import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { getTotalNewPosts } from "../../../api/adminApi";
import { Download } from "lucide-react";

// Đăng ký các components cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardChart({ onDataUpdate }) {
  const [range, setRange] = useState("month"); // day | month | year
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: [],
    posts: [],
  });

  // Hàm format ngày theo định dạng yyyy-MM-dd
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Hàm tạo danh sách ngày/tháng/năm và gọi API
  const fetchChartData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let labels = [];
      let dateRanges = [];

      if (range === "day") {
        // 7 ngày gần nhất
        labels = [];
        dateRanges = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayName = date.toLocaleDateString("vi-VN", { weekday: "short" });
          labels.push(dayName);
          dateRanges.push({
            start: formatDate(date),
            end: formatDate(date),
          });
        }
      } else if (range === "year") {
        // 6 năm gần nhất
        labels = [];
        dateRanges = [];
        for (let i = 5; i >= 0; i--) {
          const year = now.getFullYear() - i;
          labels.push(String(year));
          dateRanges.push({
            start: `${year}-01-01`,
            end: `${year}-12-31`,
          });
        }
      } else {
        // month - 7 tháng gần nhất
        labels = [];
        dateRanges = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString("vi-VN", { month: "short" });
          labels.push(monthName);
          // Lấy ngày đầu và cuối của tháng
          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          dateRanges.push({
            start: formatDate(firstDay),
            end: formatDate(lastDay),
          });
        }
      }

      // Gọi API cho từng khoảng thời gian
      const postsData = await Promise.all(
        dateRanges.map(async ({ start, end }) => {
          try {
            const res = await getTotalNewPosts(start, end);
            // Extract data từ response
            const total =
              res?.data?.total ||
              res?.data?.totalNewPosts ||
              res?.data ||
              0;
            return typeof total === "number" ? total : 0;
          } catch (error) {
            console.error(`Lỗi khi lấy dữ liệu cho ${start} - ${end}:`, error);
            return 0;
          }
        })
      );

      setChartData({ labels, posts: postsData });

      // Cập nhật tổng số bài đăng mới (tổng của tất cả các khoảng thời gian)
      const totalNewPosts = postsData.reduce((sum, val) => sum + val, 0);
      if (onDataUpdate) {
        onDataUpdate(totalNewPosts);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu chart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const { labels, posts } = chartData;

  const data = {
    labels,
    datasets: [
      {
        label: "Bài đăng mới",
        data: posts,
        fill: true,
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgb(99, 102, 241)",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: { display: false },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 12,
          },
          padding: 10,
        },
      },
    },
    elements: {
      line: {
        borderCapStyle: "round",
        borderJoinStyle: "round",
      },
    },
  };

  // Tính toán date range text
  const getDateRangeText = () => {
    const now = new Date();
    if (range === "day") {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      return `${startDate.toLocaleDateString("vi-VN", { day: "numeric", month: "short" })} - ${now.toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" })}`;
    } else if (range === "year") {
      const startYear = now.getFullYear() - 5;
      return `${startYear} - ${now.getFullYear()}`;
    } else {
      const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      return `${startDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })} - ${now.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`;
    }
  };

  return (
    <div>
      <div 
        className="d-flex justify-content-between align-items-center mb-4"
        style={{ flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <h5 
            className="fw-bold mb-1"
            style={{ 
              color: "#1f2937",
              fontSize: "1.25rem",
              margin: 0
            }}
          >
            Thống kê bài đăng mới
          </h5>
          <p 
            className="text-muted mb-0"
            style={{ 
              fontSize: "0.875rem",
              color: "#6b7280"
            }}
          >
            {getDateRangeText()}
          </p>
        </div>
        <div className="d-flex align-items-center" style={{ gap: "8px" }}>
          <div 
            className="d-flex"
            style={{
              background: "#f3f4f6",
              padding: "4px",
              borderRadius: "8px",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setRange("day")}
              style={{
                padding: "6px 16px",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                background: range === "day" ? "#6366f1" : "transparent",
                color: range === "day" ? "#fff" : "#6b7280",
              }}
              onMouseEnter={(e) => {
                if (range !== "day") {
                  e.currentTarget.style.background = "#e5e7eb";
                }
              }}
              onMouseLeave={(e) => {
                if (range !== "day") {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              Ngày
            </button>
            <button
              onClick={() => setRange("month")}
              style={{
                padding: "6px 16px",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                background: range === "month" ? "#6366f1" : "transparent",
                color: range === "month" ? "#fff" : "#6b7280",
              }}
              onMouseEnter={(e) => {
                if (range !== "month") {
                  e.currentTarget.style.background = "#e5e7eb";
                }
              }}
              onMouseLeave={(e) => {
                if (range !== "month") {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              Tháng
            </button>
            <button
              onClick={() => setRange("year")}
              style={{
                padding: "6px 16px",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                background: range === "year" ? "#6366f1" : "transparent",
                color: range === "year" ? "#fff" : "#6b7280",
              }}
              onMouseEnter={(e) => {
                if (range !== "year") {
                  e.currentTarget.style.background = "#e5e7eb";
                }
              }}
              onMouseLeave={(e) => {
                if (range !== "year") {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              Năm
            </button>
          </div>
          <button
            style={{
              padding: "8px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              background: "#fff",
              color: "#6366f1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#6366f1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
            onClick={() => alert("Tính năng xuất báo cáo đang được phát triển")}
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      <div style={{ height: "400px", position: "relative" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#6b7280",
            }}
          >
            <div className="text-center">
              <div 
                className="spinner-border spinner-border-sm text-primary mb-2"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mb-0">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <Line data={data} options={options} />
        )}
      </div>
    </div>
  );
}
