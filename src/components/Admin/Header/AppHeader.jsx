import React from "react";
import {
  CContainer,
  CHeader,
  CHeaderBrand,
  CHeaderNav,
  CNavItem,
  CNavLink,
} from "@coreui/react";
import AppHeaderDropdown from "./AppHeaderDropdown";
import AppBreadcrumb from "./AppBreadcrumb";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import {
  cilMenu,
  cilSun,
  cilMoon,
  cilBell,
  cilTask,
  cilEnvelopeOpen,
  cilCreditCard,
  cilSettings,
} from "@coreui/icons";

const AppHeader = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme);
  const sidebarShow = useSelector((state) => state.sidebarShow);

  const toggleSidebar = () => {
    dispatch({ type: "set", sidebarShow: !sidebarShow });
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    dispatch({ type: "set", theme: next });
    document.documentElement.setAttribute("data-coreui-theme", next);
  };

  return (
    <CHeader position="sticky" className="mb-4">
      <CContainer fluid>
        <CHeaderBrand className="d-flex align-items-center gap-2">
          <button
            className="btn btn-ghost p-0"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <CIcon icon={cilMenu} size="lg" />
          </button>
        </CHeaderBrand>
        <div className="ms-3 flex-grow-1">
          <AppBreadcrumb />
        </div>
        <CHeaderNav className="ms-auto align-items-center gap-3">
          <Link
            to="/admin/system-config"
            className="btn btn-ghost"
            aria-label="Cấu hình Escrow"
            title="Cấu hình Escrow"
          >
            <CIcon icon={cilCreditCard} />
          </Link>
          <Link
            to="/admin/settings"
            className="btn btn-ghost"
            aria-label="Cài đặt"
            title="Cài đặt"
          >
            <CIcon icon={cilSettings} />
          </Link>
          <Link
            to="/admin/notifications"
            className="btn btn-ghost"
            aria-label="Notifications"
          >
            <CIcon icon={cilBell} />
          </Link>
          <Link
            to="/admin/requests"
            className="btn btn-ghost"
            aria-label="Requests"
          >
            <CIcon icon={cilTask} />
          </Link>
          <Link to="/admin/inbox" className="btn btn-ghost" aria-label="Inbox">
            <CIcon icon={cilEnvelopeOpen} />
          </Link>
          <button
            className="btn btn-ghost"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <CIcon icon={theme === "dark" ? cilSun : cilMoon} />
          </button>
        </CHeaderNav>
        <CHeaderNav className="ms-3">
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>
    </CHeader>
  );
};

export default AppHeader;
