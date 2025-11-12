import React from "react";
import { NavLink } from "react-router-dom";
import { CNavGroup, CNavItem, CNavTitle, CSidebarNav } from "@coreui/react";

export const AppSidebarNav = ({ items }) => {
  const renderItem = (item, index) => {
    const {
      component: Component,
      name,
      icon,
      to,
      items: children,
      href,
      badge,
    } = item;
    if (Component === CNavTitle) {
      return <CNavTitle key={index}>{name}</CNavTitle>;
    }
    if (Component === CNavGroup) {
      return (
        <CNavGroup
          key={index}
          toggler={
            <>
              {icon}
              {name}
            </>
          }
        >
          {children && children.map(renderItem)}
        </CNavGroup>
      );
    }
    // CNavItem
    const content = (
      <>
        {icon}
        {name}
        {badge && (
          <span className={`badge bg-${badge.color} ms-auto`}>
            {badge.text}
          </span>
        )}
      </>
    );
    return href ? (
      <CNavItem key={index} href={href} target="_blank">
        {content}
      </CNavItem>
    ) : (
      <NavLink
        to={to}
        className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        key={index}
      >
        <CNavItem>{content}</CNavItem>
      </NavLink>
    );
  };

  // Debug: Log items để kiểm tra
  console.log("=== AppSidebarNav RENDER ===");
  console.log("Items count:", items.length);
  console.log("Items:", items.map(i => ({ name: i.name, component: i.component?.name || i.component })));
  console.log("===========================");
  
  return (
    <CSidebarNav style={{ 
      height: "auto", 
      minHeight: "100%",
      maxHeight: "none",
      overflowY: "visible",
      overflowX: "hidden",
      display: "block",
      flex: "none",
      padding: "0.5rem 0",
      marginBottom: "1rem"
    }}>
      {items.map(renderItem)}
    </CSidebarNav>
  );
};

export default AppSidebarNav;
