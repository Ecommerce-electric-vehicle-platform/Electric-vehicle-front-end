import React from "react";
import {
  AppContent,
  AppSidebar,
  AppFooter,
  AppHeader,
} from "../components/index";

const CoreAdminLayout = () => {
  if (!document.documentElement.getAttribute("data-coreui-theme")) {
    document.documentElement.setAttribute("data-coreui-theme", "light");
  }
  return (
    <div className="d-flex">
      <AppSidebar />
      <div
        className="wrapper d-flex flex-column min-vh-100 w-100"
        style={{ marginLeft: "var(--cui-sidebar-width, 256px)" }}
      >
        <AppHeader />
        <div className="body flex-grow-1 py-3 bg-body-tertiary">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default CoreAdminLayout;
