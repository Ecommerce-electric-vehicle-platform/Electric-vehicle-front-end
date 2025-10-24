import React from "react";
import {
  CCard,
  CCardBody,
  CListGroup,
  CListGroupItem,
  CBadge,
} from "@coreui/react";

export default function Inbox() {
  const messages = [
    {
      id: 1,
      from: "support@user.com",
      subject: "Cần hỗ trợ đặt hàng",
      unread: true,
    },
    {
      id: 2,
      from: "seller@ev.com",
      subject: "Hỏi về tranh chấp #102",
      unread: false,
    },
  ];
  return (
    <CCard className="shadow-sm">
      <CCardBody>
        <CListGroup>
          {messages.map((m) => (
            <CListGroupItem
              key={m.id}
              className="d-flex justify-content-between align-items-center"
            >
              <span>
                <strong>{m.from}</strong> — {m.subject}
              </span>
              {m.unread && <CBadge color="success">New</CBadge>}
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
    </CCard>
  );
}
