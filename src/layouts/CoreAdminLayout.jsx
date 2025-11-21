// FIXED: thêm id="core-admin-layout"
// FIXED: bỏ marginLeft: "var(--cui-sidebar-width, 256px)"
// Giữ logic theme CoreUI và layout Admin như cũ

import React, { useEffect, useState, useRef } from "react";
import { mountCoreUiCss, unmountCoreUiCss } from "../utils/coreuiCss";
import {
  AppContent,
  AppSidebar,
  AppFooter,
  AppHeader,
} from "../components/index";
import {
  MdDashboard,
  MdPeople,
  MdCheckCircle,
  MdArticle,
  MdPerson,
  MdWarning,
  MdMenu,
  MdNotifications,
  MdTask,
  MdEmail,
  MdDarkMode,
  MdLightMode,
  MdLogout,
  MdSettings,
  MdAccountCircle,
  MdCreditCard,
  MdBuild,
  MdAccountBalanceWallet,
  MdCardGiftcard,
  MdBarChart,
} from "react-icons/md";
import { FaLeaf } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CoreAdminLayout = () => {
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Lấy thông tin admin từ localStorage
  const getAdminInfo = () => {
    const raw = localStorage.getItem("adminProfile");
    if (raw) {
      try {
        const profile = JSON.parse(raw);
        return {
          displayName: profile?.fullName || profile?.employeeNumber || "Admin",
          username: profile?.username || "", //Lấy username từ adminProfile
          email: profile?.email || "",
          employeeNumber: profile?.employeeNumber || "",
          isSuperAdmin: !!profile?.isSuperAdmin,
          status: profile?.status || null,
        };
      } catch {
        return {
          displayName: "Admin",
          username: "",
          email: "",
          employeeNumber: "",
          isSuperAdmin: false,
          status: null,
        };
      }
    }
    return {
      displayName: "Admin",
      username: "",
      email: "",
      employeeNumber: "",
      isSuperAdmin: false,
      status: null,
    };
  };

  const adminInfo = getAdminInfo();

  // Handle logout - CHỈ XÓA ADMIN DATA
  const handleLogout = () => {
    console.log("Admin logging out...");
    
    // ✅ CHỈ xóa admin-specific keys, KHÔNG xóa user data
    // Vì admin logout không liên quan đến user session
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("authType");
    localStorage.removeItem("adminProfile");
    
    // ✅ KHÔNG xóa các key user như: username, userEmail, buyerId, sellerId, buyerAvatar, userRole
    // Để giữ lại user session nếu có
    
    console.log("[Admin Logout] Chỉ xóa admin data, giữ lại user data");
    window.dispatchEvent(new CustomEvent("authStatusChanged"));
    navigate("/admin/signin");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    mountCoreUiCss();
    const previousTheme =
      document.documentElement.getAttribute("data-coreui-theme");
    document.documentElement.setAttribute("data-coreui-theme", "light");

    // Thêm CSS reset cho admin layout
    const adminStyle = document.createElement("style");
    adminStyle.id = "admin-layout-reset";
    adminStyle.textContent = `
      #core-admin-layout {
        min-height: 100vh;
        background: #f8f9fa;
      }
      #core-admin-layout .wrapper {
        position: relative;
        flex: 1;
      }
      #core-admin-layout .body {
        flex: 1;
        overflow-y: auto;
      }
      /* Reset conflicts với global CSS */
      #core-admin-layout * {
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(adminStyle);

    return () => {
      unmountCoreUiCss();
      const style = document.getElementById("admin-layout-reset");
      if (style) style.remove();

      if (previousTheme) {
        document.documentElement.setAttribute(
          "data-coreui-theme",
          previousTheme
        );
      } else {
        document.documentElement.removeAttribute("data-coreui-theme");
      }
    };
  }, []);

  // Ensure any global transition/modal locks are cleared when entering admin
  useEffect(() => {
    document.body.classList.remove(
      "page-transitioning",
      "no-scroll",
      "modal-open"
    );
    document.documentElement.classList.remove("modal-open");
    const prevPointer = document.body.style.pointerEvents;
    document.body.style.pointerEvents = "auto";
    return () => {
      document.body.style.pointerEvents = prevPointer;
    };
  }, []);

  // Cleanup CoreUI global sidebar artifacts when leaving admin
  useEffect(() => {
    return () => {
      const root = document.documentElement;
      const body = document.body;
      const classesToRemove = [
        "sidebar-show",
        "sidebar-narrow",
        "sidebar-narrow-unfoldable",
        "sidebar-fixed",
      ];
      classesToRemove.forEach((cls) => {
        body.classList.remove(cls);
        root.classList.remove(cls);
      });
      root.style.removeProperty("--cui-sidebar-width");
      body.style.removeProperty("--cui-sidebar-width");
    };
  }, []);

  console.log("CoreAdminLayout: Rendering...");

  // Layout đẹp như CoreUI với sidebar tối và header chuyên nghiệp
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          background: "#2c3e50",
          color: "white",
          minHeight: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 1000,
          boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #34495e",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              color: "white",
            }}
          >
            <FaLeaf />
          </div>
          <h3
            style={{
              margin: 0,
              color: "#ecf0f1",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            GREENTRADE
          </h3>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "20px 0", overflowY: "auto", maxHeight: "calc(100vh - 80px)" }}>
          <div style={{ marginBottom: "8px" }}>
            <a
              href="/admin/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#ecf0f1",
                textDecoration: "none",
                background: "rgba(255,255,255,0.1)",
                borderRight: "3px solid #22c55e",
              }}
            >
              <MdDashboard style={{ marginRight: "12px", fontSize: "18px" }} />
              Bảng điều khiển
            </a>
          </div>

          {/* HỆ THỐNG Section */}
          <div style={{ marginTop: "20px", marginBottom: "8px" }}>
            <div
              style={{
                padding: "8px 20px",
                fontSize: "12px",
                color: "#bdc3c7",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "600",
              }}
            >
              HỆ THỐNG
            </div>
          </div>

          {/* Cấu hình chung Hệ thống */}
          <div style={{ marginBottom: "4px" }}>
            <a
              href="/admin/system-config"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#bdc3c7",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.color = "#ecf0f1";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#bdc3c7";
              }}
            >
              <MdBuild style={{ marginRight: "12px", fontSize: "18px" }} />
              Cấu hình Hệ thống
            </a>
          </div>

          {/* Ví Hệ Thống */}
          <div style={{ marginBottom: "4px" }}>
            <a
              href="/admin/system-wallets"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#bdc3c7",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.color = "#ecf0f1";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#bdc3c7";
              }}
            >
              <MdAccountBalanceWallet style={{ marginRight: "12px", fontSize: "18px" }} />
              Ví Hệ Thống
            </a>
          </div>

          {/* Gói Dịch Vụ */}
          <div style={{ marginBottom: "4px" }}>
            <a
              href="/admin/subscription-packages"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#bdc3c7",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.color = "#ecf0f1";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#bdc3c7";
              }}
            >
              <MdCardGiftcard style={{ marginRight: "12px", fontSize: "18px" }} />
              Gói Dịch Vụ
            </a>
          </div>

          {/* Thống kê mua gói */}
          <div style={{ marginBottom: "4px" }}>
            <a
              href="/admin/package-statistics"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#bdc3c7",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.color = "#ecf0f1";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#bdc3c7";
              }}
            >
              <MdBarChart style={{ marginRight: "12px", fontSize: "18px" }} />
              Thống kê mua gói
            </a>
          </div>

          {/* Cài đặt */}
          <div style={{ marginBottom: "4px" }}>
            <a
              href="/admin/settings"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#bdc3c7",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.color = "#ecf0f1";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#bdc3c7";
              }}
            >
              <MdSettings style={{ marginRight: "12px", fontSize: "18px" }} />
              Cài đặt
            </a>
          </div>

          <div style={{ marginTop: "20px", marginBottom: "8px" }}>
            <div
              style={{
                padding: "8px 20px",
                fontSize: "12px",
                color: "#bdc3c7",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "600",
              }}
            >
              QUẢN LÝ
            </div>
          </div>

          {(() => {
            // Kiểm tra quyền Super Admin
            try {
              const adminProfileStr = localStorage.getItem("adminProfile");
              if (adminProfileStr) {
                const adminProfile = JSON.parse(adminProfileStr);
                const isSuperAdmin = adminProfile?.isSuperAdmin === true || 
                                   adminProfile?.superAdmin === true || 
                                   adminProfile?.is_super_admin === true;
                
                // Chỉ hiển thị link nếu là super admin
                if (!isSuperAdmin) {
                  return null;
                }
              } else {
                // Nếu không có adminProfile, ẩn link
                return null;
              }
            } catch {
              // Nếu có lỗi, ẩn link để an toàn
              return null;
            }
            
            return (
              <div style={{ marginBottom: "4px" }}>
                <a
                  href="/admin/manage-admins"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 20px",
                    color: "#bdc3c7",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "rgba(255,255,255,0.05)";
                    e.target.style.color = "#ecf0f1";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.color = "#bdc3c7";
                  }}
                >
                  <MdPeople style={{ marginRight: "12px", fontSize: "18px" }} />
                  Quản lý quản trị viên
                </a>
              </div>
            );
          })()}

          <div style={{ marginBottom: "4px" }}>
            <a
              href="/admin/approve-seller"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#bdc3c7",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.color = "#ecf0f1";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#bdc3c7";
              }}
            >
              <MdCheckCircle
                style={{ marginRight: "12px", fontSize: "18px" }}
              />
              Phê duyệt người bán
            </a>
          </div>

          <div style={{ marginBottom: "4px" }}>
            <a
              href="/admin/review-posts"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#bdc3c7",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.color = "#ecf0f1";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#bdc3c7";
              }}
            >
              <MdArticle style={{ marginRight: "12px", fontSize: "18px" }} />
              Duyệt bài đăng
            </a>
          </div>

          <div style={{ marginBottom: "4px" }}>
            <a
              href="/admin/manage-users"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#bdc3c7",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.color = "#ecf0f1";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#bdc3c7";
              }}
            >
              <MdPerson style={{ marginRight: "12px", fontSize: "18px" }} />
              Quản lý người dùng
            </a>
          </div>

          <div style={{ marginBottom: "4px" }}>
            <a
              href="/admin/manage-disputes"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "#bdc3c7",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.color = "#ecf0f1";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#bdc3c7";
              }}
            >
              <MdWarning style={{ marginRight: "12px", fontSize: "18px" }} />
              Quản lý tranh chấp
            </a>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div
        style={{
          marginLeft: "250px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "white",
            padding: "0 20px",
            borderBottom: "1px solid #dee2e6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "60px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                color: "#666",
              }}
            >
              <MdMenu />
            </button>
            <div style={{ fontSize: "14px", color: "#666" }}>
              Home / Admin / Dashboard
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <a
              href="/admin/system-config"
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                color: "#666",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Cấu hình Hệ thống"
            >
              <MdBuild />
            </a>
            <a
              href="/admin/settings"
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                color: "#666",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Cài đặt"
            >
              <MdSettings />
            </a>
            <button
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                color: "#666",
              }}
            >
              <MdNotifications />
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                color: "#666",
              }}
            >
              <MdTask />
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                color: "#666",
              }}
            >
              <MdEmail />
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                color: "#666",
              }}
            >
              <MdDarkMode />
            </button>

            {/* User Avatar with Dropdown */}
            <div
              ref={dropdownRef}
              style={{
                position: "relative",
                marginLeft: "10px",
              }}
            >
              <div
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {adminInfo.displayName.charAt(0).toUpperCase()}
              </div>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "white",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    minWidth: "220px",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}
                >
                  {/* User Info Header */}
                  <div
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    {/* Hiển thị username hoặc displayName */}
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#111827",
                      }}
                    >
                      {adminInfo.username || adminInfo.displayName}
                    </div>
                    {/* Hiển thị email */}
                    {adminInfo.email && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}
                      >
                        {adminInfo.email}
                      </div>
                    )}
                    {/* Hiển thị status nếu có */}
                    {adminInfo.status && (
                      <div
                        style={{
                          marginTop: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: "500",
                            backgroundColor:
                              adminInfo.status === "ACTIVE" || adminInfo.status === "active"
                                ? "#d1fae5"
                                : adminInfo.status === "INACTIVE" ||
                                  adminInfo.status === "inactive" ||
                                  adminInfo.status === "BLOCKED" ||
                                  adminInfo.status === "blocked"
                                ? "#fee2e2"
                                : "#e5e7eb",
                            color:
                              adminInfo.status === "ACTIVE" || adminInfo.status === "active"
                                ? "#065f46"
                                : adminInfo.status === "INACTIVE" ||
                                  adminInfo.status === "inactive" ||
                                  adminInfo.status === "BLOCKED" ||
                                  adminInfo.status === "blocked"
                                ? "#991b1b"
                                : "#374151",
                          }}
                        >
                          {adminInfo.status.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: "8px 0" }}>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        navigate("/admin/profile");
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#374151",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f3f4f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      <MdAccountCircle style={{ fontSize: "18px" }} />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        // Navigate to settings if needed
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#374151",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f3f4f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      <MdSettings style={{ fontSize: "18px" }} />
                      <span>Settings</span>
                    </button>

                    <div
                      style={{
                        margin: "8px 0",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    ></div>

                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#dc2626",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      <MdLogout style={{ fontSize: "18px" }} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, background: "#f8f9fa" }}>
          <AppContent />
        </div>

        {/* Footer */}
        <div
          style={{
            background: "white",
            padding: "15px 20px",
            borderTop: "1px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <span>EV Second-hand Platform</span>
          <span>Powered by CoreUI</span>
        </div>
      </div>
    </div>
  );
};

export default CoreAdminLayout;
