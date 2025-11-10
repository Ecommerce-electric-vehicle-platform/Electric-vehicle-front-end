// src/components/admin/sidebar/AdminSidebar.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const menu = [
    {
      name: "Bảng điều khiển",
      icon: <LayoutDashboard size={18} />,
      path: "/admin/dashboard",
    },
    {
      name: "Quản lý quản trị viên",
      icon: <Users size={18} />,
      path: "/admin/manage-admins",
    },
    {
      name: "Phê duyệt người bán",
      icon: <FileCheck size={18} />,
      path: "/admin/approve-seller",
    },
    {
      name: "Duyệt bài đăng",
      icon: <ClipboardList size={18} />,
      path: "/admin/review-posts",
    },
    {
      name: "Quản lý người dùng",
      icon: <Users size={18} />,
      path: "/admin/manage-users",
    },
  ];

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-white shadow-md h-screen transition-all duration-300 flex flex-col`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-green-600">GREENTRADE</h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-200"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="mt-2 flex-1">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 ${
                isActive ? "bg-green-100 text-green-700 font-semibold" : ""
              }`
            }
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t">
        <button
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50"
          onClick={() => alert("Logout clicked")}
        >
          <LogOut size={18} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
