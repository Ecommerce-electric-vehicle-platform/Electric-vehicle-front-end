import React from "react";
import { CCard, CCardBody } from "@coreui/react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Users, ShoppingBag, DollarSign, FileText, TrendingUp, TrendingDown } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const iconMap = {
  "Tổng số Sellers": ShoppingBag,
  "Tổng số Buyers": Users,
  "Doanh thu Subscription": DollarSign,
  "Bài đăng mới": FileText,
};

export default function StartCard({
  title,
  value,
  delta,
  color = "#6366F1",
  data = [],
}) {
  const Icon = iconMap[title] || FileText;
  
  // Màu trắng cho chart trên nền đậm
  const chartData = {
    labels: data.map((_, idx) => idx + 1),
    datasets: [
      {
        data,
        borderColor: "rgba(255, 255, 255, 0.8)",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        pointRadius: 3,
        pointBackgroundColor: "rgba(255, 255, 255, 1)",
        pointBorderColor: "rgba(255, 255, 255, 1)",
        pointHoverRadius: 5,
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }, 
      tooltip: { enabled: false } 
    },
    scales: {
      x: { 
        display: false,
        grid: { display: false }
      },
      y: { 
        display: false,
        grid: { display: false }
      },
    },
    elements: {
      line: { 
        borderCapStyle: "round",
        borderJoinStyle: "round"
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      }
    },
  };

  const deltaColor = delta >= 0 ? "#10b981" : "#ef4444";
  const deltaSign = delta >= 0 ? "+" : "";
  const TrendIcon = delta >= 0 ? TrendingUp : TrendingDown;

  return (
    <CCard 
      className="shadow-sm border-0"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        transition: "all 0.3s ease",
        background: color,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      }}
    >
      <CCardBody style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div style={{ flex: 1 }}>
            <div 
              className="small fw-medium mb-2"
              style={{ 
                color: "rgba(255, 255, 255, 0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: "0.75rem"
              }}
            >
              {title}
            </div>
            <div 
              className="fw-bold mb-2"
              style={{ 
                fontSize: "1.875rem",
                color: "#ffffff",
                lineHeight: "1.2"
              }}
            >
              {value}
            </div>
            {delta !== undefined && (
              <div 
                className="small d-flex align-items-center"
                style={{ color: delta >= 0 ? "#10b981" : "#ef4444", gap: "4px" }}
              >
                <TrendIcon size={14} />
                <span className="fw-semibold">
                  {`${deltaSign}${delta}%`}
                </span>
                <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.7rem" }}>
                  so với tháng trước
                </span>
              </div>
            )}
          </div>
          <div 
            style={{ 
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Icon size={24} color="#ffffff" />
          </div>
        </div>
        <div style={{ width: "100%", height: "60px", marginTop: "auto" }}>
          <Line data={chartData} options={options} />
        </div>
      </CCardBody>
    </CCard>
  );
}
