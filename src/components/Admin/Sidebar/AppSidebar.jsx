import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from "@coreui/react";
import AppSidebarNav from "./AppSidebarNav";
import navigation from "./_nav.jsx";
import logoImg from "../../../assets/logo/LogoMini.png";

const AppSidebar = () => {
  const dispatch = useDispatch();
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.sidebarShow);
  const [filteredNavigation, setFilteredNavigation] = useState(navigation);

  // Kiểm tra quyền Super Admin và filter navigation
  useEffect(() => {
    const checkSuperAdminAndFilterNav = () => {
      try {
        const adminProfileStr = localStorage.getItem("adminProfile");
        let isSuperAdmin = false;
        
        if (adminProfileStr) {
          const adminProfile = JSON.parse(adminProfileStr);
          isSuperAdmin = adminProfile?.isSuperAdmin === true || 
                        adminProfile?.superAdmin === true || 
                        adminProfile?.is_super_admin === true;
        }

        // Filter navigation: ẩn "Manage Admins" nếu không phải super admin
        const filtered = navigation.filter((item) => {
          // Giữ tất cả các item không phải "Manage Admins"
          if (item.name !== "Manage Admins") {
            return true;
          }
          // Chỉ hiển thị "Manage Admins" nếu là super admin
          return isSuperAdmin;
        });

        setFilteredNavigation(filtered);
      } catch (err) {
        console.error("Error filtering navigation:", err);
        // Nếu có lỗi, ẩn "Manage Admins" để an toàn
        setFilteredNavigation(navigation.filter((item) => item.name !== "Manage Admins"));
      }
    };

    checkSuperAdminAndFilterNav();

    // Lắng nghe sự kiện khi adminProfile thay đổi
    const handleStorageChange = () => {
      checkSuperAdminAndFilterNav();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStatusChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStatusChanged", handleStorageChange);
    };
  }, []);

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: "set", sidebarShow: visible });
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand>
          <img
            src={logoImg}
            alt="EV Admin"
            height={10}
            style={{ width: "auto" }}
          />
        </CSidebarBrand>
      </CSidebarHeader>
      <AppSidebarNav items={filteredNavigation} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() =>
            dispatch({ type: "set", sidebarUnfoldable: !unfoldable })
          }
        />
      </CSidebarFooter>
    </CSidebar>
  );
};

export default AppSidebar;
