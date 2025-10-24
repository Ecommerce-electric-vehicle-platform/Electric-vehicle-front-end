import React from "react";
import CIcon from "@coreui/icons-react";
import {
  cilSpeedometer,
  cilUser,
  cilCheckCircle,
  cilNotes,
  cilList,
  cilWarning,
  cilBell,
  cilEnvelopeOpen,
  cilTask,
  cilSettings,
} from "@coreui/icons";
import { CNavGroup, CNavItem, CNavTitle } from "@coreui/react";

const _nav = [
  {
    component: CNavItem,
    name: "Dashboard",
    to: "/admin/dashboard",
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: "Management",
  },
  {
    component: CNavItem,
    name: "Manage Admins",
    to: "/admin/manage-admins",
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Approve Sellers",
    to: "/admin/approve-seller",
    icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Review Posts",
    to: "/admin/review-posts",
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Manage Users",
    to: "/admin/manage-users",
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Manage Disputes",
    to: "/admin/manage-disputes",
    icon: <CIcon icon={cilWarning} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: "Communication",
  },
  {
    component: CNavItem,
    name: "Notifications",
    to: "/admin/notifications",
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Requests",
    to: "/admin/requests",
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Inbox",
    to: "/admin/inbox",
    icon: <CIcon icon={cilEnvelopeOpen} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: "System",
  },
  {
    component: CNavItem,
    name: "Settings",
    to: "/admin/settings",
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
];

export default _nav;
