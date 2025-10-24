// FIXED: bỏ "fixed top-0 left-0" để không chiếm toàn màn hình
// FIXED: thêm id="admin-layout" để có thể cleanup
import React from "react";
import AdminSidebar from "../components/Admin/Sidebar/AdminSidebar";
import AdminHeader from "../components/Admin/Header/AdminHeader";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div
      id="admin-layout"
      className="flex bg-gray-50 min-h-screen w-full"
    >
      <AdminSidebar />
      <div className="flex flex-col flex-1">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
