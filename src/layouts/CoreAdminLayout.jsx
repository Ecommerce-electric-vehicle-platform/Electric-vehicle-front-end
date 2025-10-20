// FIXED: thêm id="core-admin-layout"
// FIXED: bỏ marginLeft: "var(--cui-sidebar-width, 256px)"
// Giữ logic theme CoreUI và layout Admin như cũ

import React, { useEffect } from "react";
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
} from "react-icons/md";
import { FaLeaf } from "react-icons/fa";

const CoreAdminLayout = () => {
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
            <div
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
                marginLeft: "10px",
              }}
            >
              A
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
