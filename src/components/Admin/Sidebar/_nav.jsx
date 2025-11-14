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
  cilCog,
  cilWallet,
  cilLayers,
  cilChart,
} from "@coreui/icons";
import { CNavGroup, CNavItem, CNavTitle } from "@coreui/react";

const _nav = [
  {
    component: CNavItem,
    name: "Bảng điều khiển",
    to: "/admin/dashboard",
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: "HỆ THỐNG",
  },
  {
    component: CNavItem,
    name: "Cấu hình Ký Quỹ chung",
    to: "/admin/system-config",
    icon: <CIcon icon={cilCog} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Ví Hệ Thống",
    to: "/admin/system-wallets",
    icon: <CIcon icon={cilWallet} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Gói Dịch Vụ",
    to: "/admin/subscription-packages",
    icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Thống kê mua gói",
    to: "/admin/package-statistics",
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Cài đặt",
    to: "/admin/settings",
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: "QUẢN LÝ",
  },
  {
    component: CNavItem,
    name: "Quản lý quản trị viên",
    to: "/admin/manage-admins",
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Phê duyệt người bán",
    to: "/admin/approve-seller",
    icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Duyệt bài đăng",
    to: "/admin/review-posts",
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Quản lý người dùng",
    to: "/admin/manage-users",
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Quản lý tranh chấp",
    to: "/admin/manage-disputes",
    icon: <CIcon icon={cilWarning} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: "GIAO TIẾP",
  },
  {
    component: CNavItem,
    name: "Thông báo",
    to: "/admin/notifications",
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Yêu cầu",
    to: "/admin/requests",
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Hộp thư đến",
    to: "/admin/inbox",
    icon: <CIcon icon={cilEnvelopeOpen} customClassName="nav-icon" />,
  },
];

export default _nav;
