import React, { useMemo, useState } from "react";
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
} from "chart.js";

// Đăng ký các components cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardChart() {
  const [range, setRange] = useState("month"); // day | month | year

  const { labels, users, posts } = useMemo(() => {
    if (range === "day") {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        users: [12, 9, 14, 11, 18, 16, 13],
        posts: [8, 6, 10, 7, 12, 11, 9],
      };
    }
    if (range === "year") {
      return {
        labels: ["2020", "2021", "2022", "2023", "2024", "2025"],
        users: [420, 530, 640, 760, 920, 1080],
        posts: [210, 260, 340, 420, 510, 650],
      };
    }
    // month
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      users: [45, 58, 76, 62, 88, 73, 80],
      posts: [22, 35, 44, 30, 55, 40, 49],
    };
  }, [range]);

  const data = {
    labels,
    datasets: [
      {
        label: "Người dùng mới",
        data: users,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.35,
      },
      {
        label: "Bài đăng mới",
        data: posts,
        fill: false,
        borderColor: "rgb(99, 102, 241)",
        tension: 0.35,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <div className="flex items-center gap-2 justify-end mb-3">
        <button
          onClick={() => setRange("day")}
          className={`px-3 py-1 rounded text-sm border ${
            range === "day" ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          Day
        </button>
        <button
          onClick={() => setRange("month")}
          className={`px-3 py-1 rounded text-sm border ${
            range === "month" ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          Month
        </button>
        <button
          onClick={() => setRange("year")}
          className={`px-3 py-1 rounded text-sm border ${
            range === "year" ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          Year
        </button>
      </div>
      <div style={{ height: "300px" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
