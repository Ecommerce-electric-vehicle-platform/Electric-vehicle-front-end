// src/components/admin/header/AdminHeader.jsx
import React from "react";
import { Bell, UserCircle2 } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function AdminHeader() {
  const location = useLocation();

  // Tạo breadcrumb dựa vào URL
  const breadcrumb = location.pathname
    .split("/")
    .filter(Boolean)
    .slice(1) // bỏ "admin"
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

  return (
    <header className="flex justify-between items-center bg-white border-b px-6 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-gray-700">
        <span className="font-semibold text-green-600">Admin</span>
        {breadcrumb.length > 0 && (
          <>
            <span>/</span>
            <span className="text-gray-500">{breadcrumb.join(" / ")}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-full">
          <Bell size={20} />
          <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer">
          <UserCircle2 size={28} className="text-gray-600" />
          <span className="font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
}
