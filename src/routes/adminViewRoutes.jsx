import React from "react";
import Dashboard from "../pages/Admin/Dashboard/Dashboard";
import ApproveSeller from "../pages/Admin/ApproveSeller/ApproveSeller";
import ManageUsers from "../pages/Admin/ManageUsers/ManageUsers";
import ReviewPosts from "../pages/Admin/ReviewPosts/ReviewPosts";
import ManageAdmins from "../pages/Admin/ManageAdmins/ManageAdmins";
import ManageDisputes from "../pages/Admin/ManageDisputes/ManageDisputes";
import Notifications from "../pages/Admin/Notifications/Notifications";
import Requests from "../pages/Admin/Requests/Requests";
import Inbox from "../pages/Admin/Inbox/Inbox";
import Settings from "../pages/Admin/Settings/Settings";

// Phải dùng React element (có < />)
const adminViewRoutes = [
  { path: "dashboard", name: "Dashboard", element: <Dashboard /> },
  { path: "manage-admins", name: "Manage Admins", element: <ManageAdmins /> },
  { path: "approve-seller", name: "Approve Sellers", element: <ApproveSeller /> },
  { path: "review-posts", name: "Review Posts", element: <ReviewPosts /> },
  { path: "manage-users", name: "Manage Users", element: <ManageUsers /> },
  { path: "manage-disputes", name: "Manage Disputes", element: <ManageDisputes /> },
  { path: "notifications", name: "Notifications", element: <Notifications /> },
  { path: "requests", name: "Requests", element: <Requests /> },
  { path: "inbox", name: "Inbox", element: <Inbox /> },
  { path: "settings", name: "Settings", element: <Settings /> },
];

export default adminViewRoutes;
