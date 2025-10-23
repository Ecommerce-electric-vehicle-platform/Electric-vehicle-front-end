import React from "react";
import {
  CCard,
  CCardBody,
  CListGroup,
  CListGroupItem,
  CBadge,
} from "@coreui/react";

export default function Notifications() {
  const items = [
    { id: 1, text: "Bài đăng mới cần duyệt: EV-1245", time: "2 phút trước" },
    {
      id: 2,
      text: "Yêu cầu nâng cấp Seller từ user #332",
      time: "15 phút trước",
    },
  ];
  return (
    <CCard className="shadow-sm">
      <CCardBody>
        <CListGroup>
          {items.map((n) => (
            <CListGroupItem
              key={n.id}
              className="d-flex justify-content-between align-items-center"
            >
              {n.text}
              <CBadge color="primary">{n.time}</CBadge>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
    </CCard>
  );
}
