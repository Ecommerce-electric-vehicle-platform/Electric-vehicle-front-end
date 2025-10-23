import React from "react";
import DashboardChart from "../../../components/Admin/Charts/DashboardChart";
import SafeBoundary from "../../../components/Admin/Widgets/SafeBoundary";
import StartCard from "../../../components/Admin/Widgets/StartCard";
import { CRow, CCol, CCard, CCardBody, CCardHeader } from "@coreui/react";

export default function Dashboard() {
  const statCards = [
    {
      title: "Users",
      value: "26K",
      delta: -12.4,
      color: "#6366F1",
      data: [18, 22, 30, 28, 25, 20, 17],
    },
    {
      title: "Income",
      value: "$6,200",
      delta: 40.9,
      color: "#60A5FA",
      data: [5, 9, 12, 16, 14, 12, 10],
    },
    {
      title: "Conversion Rate",
      value: "2.49%",
      delta: 84.7,
      color: "#F59E0B",
      data: [30, 35, 38, 32, 28, 34, 36],
    },
    {
      title: "Sessions",
      value: "44K",
      delta: -23.6,
      color: "#F87171",
      data: [12, 10, 14, 16, 12, 18, 15],
    },
  ];

  return (
    <div className="p-3">
      <h2 className="fw-semibold mb-4">Dashboard</h2>

      <CRow className="g-4 mb-4">
        {statCards.map((s, idx) => (
          <CCol key={idx} xs={12} md={6} lg={3}>
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

      <CCard className="shadow-sm">
        <CCardHeader className="fw-semibold">Traffic</CCardHeader>
        <CCardBody>
          <SafeBoundary>
            <DashboardChart />
          </SafeBoundary>
        </CCardBody>
      </CCard>
    </div>
  );
}
