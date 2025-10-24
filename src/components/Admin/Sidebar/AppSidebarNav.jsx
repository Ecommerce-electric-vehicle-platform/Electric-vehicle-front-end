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

  return <CSidebarNav>{items.map(renderItem)}</CSidebarNav>;
};

export default AppSidebarNav;
