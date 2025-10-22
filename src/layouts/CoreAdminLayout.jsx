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
          email: profile?.email || "",
          employeeNumber: profile?.employeeNumber || "",
          isSuperAdmin: !!profile?.isSuperAdmin,
        };
      } catch {
        return {
          displayName: "Admin",
          email: "",
          employeeNumber: "",
          isSuperAdmin: false,
        };
      }
    }
    return {
      displayName: "Admin",
      email: "",
      employeeNumber: "",
      isSuperAdmin: false,
    };
  };

  const adminInfo = getAdminInfo();

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("buyerId");
    localStorage.removeItem("authType");
    localStorage.removeItem("adminProfile");
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
        <nav style={{ padding: "20px 0" }}>
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
              Dashboard
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
              MANAGEMENT
            </div>
          </div>

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
              Manage Admins
            </a>
          </div>

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
              Approve Sellers
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
              Review Posts
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
              Manage Users
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
              Manage Disputes
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
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#111827",
                      }}
                    >
                      {adminInfo.displayName}
                    </div>
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
                    {adminInfo.employeeNumber && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "2px",
                        }}
                      >
                        #{adminInfo.employeeNumber}
                        {adminInfo.isSuperAdmin && " • Super Admin"}
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: "8px 0" }}>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        // Navigate to profile if needed
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
