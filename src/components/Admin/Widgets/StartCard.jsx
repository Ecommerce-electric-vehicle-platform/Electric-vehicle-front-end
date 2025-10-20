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
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

export default function StartCard({
  title,
  value,
  delta,
  color = "#6366F1",
  data = [],
}) {
  const chartData = {
    labels: data.map((_, idx) => idx + 1),
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: color,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.35,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: { borderCapStyle: "round" },
    },
  };

  const deltaColor = delta >= 0 ? "text-green-600" : "text-red-600";
  const deltaSign = delta >= 0 ? "+" : "";

  return (
    <CCard className="shadow-sm">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-body-secondary small">{title}</div>
            <div className="fw-bold fs-4 mt-1">{value}</div>
            {delta !== undefined && (
              <div className={`small mt-1 ${deltaColor.replace("text-", "")}`}>
                {`${deltaSign}${delta}%`}
              </div>
            )}
          </div>
          <div style={{ width: 96, height: 48 }}>
            <Line data={chartData} options={options} />
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
}
