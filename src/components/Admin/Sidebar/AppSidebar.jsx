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
import "./AppSidebar.css";

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

        // Filter navigation: ẩn "Quản lý quản trị viên" nếu không phải super admin
        // KHÔNG filter "Cài đặt" và "Cấu hình Escrow" - tất cả admin đều có thể xem
        const filtered = navigation.filter((item) => {
          // Giữ tất cả các item không phải "Quản lý quản trị viên"
          if (item.name !== "Quản lý quản trị viên") {
            return true;
          }
          // Chỉ hiển thị "Quản lý quản trị viên" nếu là super admin
          return isSuperAdmin;
        });

        setFilteredNavigation(filtered);
        
        // Debug: Log navigation items để kiểm tra
        console.log("=== SIDEBAR NAVIGATION DEBUG ===");
        console.log("All navigation items:", navigation.map(item => ({ name: item.name, to: item.to })));
        console.log("Filtered navigation items:", filtered.map(item => ({ name: item.name, to: item.to })));
        console.log("Total items (original):", navigation.length);
        console.log("Total items (filtered):", filtered.length);
        console.log("Has 'Cài đặt':", filtered.some(item => item.name === "Cài đặt"));
        console.log("Has 'Cấu hình Escrow':", filtered.some(item => item.name === "Cấu hình Escrow"));
        console.log("Index of 'Cài đặt':", filtered.findIndex(item => item.name === "Cài đặt"));
        console.log("Index of 'Cấu hình Escrow':", filtered.findIndex(item => item.name === "Cấu hình Escrow"));
        console.log("Last 3 items:", filtered.slice(-3).map(item => item.name));
        console.log("================================");
      } catch (err) {
        console.error("Error filtering navigation:", err);
        // Nếu có lỗi, ẩn "Quản lý quản trị viên" để an toàn
        setFilteredNavigation(navigation.filter((item) => item.name !== "Quản lý quản trị viên"));
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

  // Debug: Kiểm tra DOM sau khi render và kiểm tra "Cấu hình Escrow"
  // CRITICAL: Also ensure scrollbar is visible and items are accessible
  useEffect(() => {
    const checkDOM = () => {
      const sidebarScrollable = document.querySelector('.sidebar-scrollable');
      const sidebarNav = document.querySelector('.sidebar-scrollable .c-sidebar-nav');
      // Try multiple selectors to find nav items
      const navItems = document.querySelectorAll('.sidebar-scrollable .c-sidebar-nav .nav-item, .sidebar-scrollable .c-sidebar-nav .nav-title, .sidebar-scrollable .c-sidebar-nav .nav-group, .sidebar-scrollable .c-sidebar-nav li, .sidebar-scrollable .c-sidebar-nav a, .sidebar-scrollable .c-sidebar-nav .nav-link');
      
      console.log("=== SIDEBAR DOM DEBUG ===");
      console.log("Sidebar Scrollable Element:", sidebarScrollable);
      console.log("Sidebar Nav Element:", sidebarNav);
      console.log("Nav Items Count:", navItems.length);
      console.log("Expected items from filteredNavigation:", filteredNavigation.length);
      
      if (sidebarScrollable) {
        const scrollHeight = sidebarScrollable.scrollHeight;
        const clientHeight = sidebarScrollable.clientHeight;
        const canScroll = scrollHeight > clientHeight;
        const scrollTop = sidebarScrollable.scrollTop;
        const scrollMax = scrollHeight - clientHeight;
        
        console.log("Scrollable scrollHeight:", scrollHeight);
        console.log("Scrollable clientHeight:", clientHeight);
        console.log("Can scroll:", canScroll);
        console.log("Scroll difference:", scrollHeight - clientHeight);
        console.log("Current scrollTop:", scrollTop);
        console.log("Max scrollTop:", scrollMax);
        console.log("Is scrolled to bottom:", scrollTop >= scrollMax - 10);
        
        // Force scrollbar to be visible
        if (canScroll) {
          sidebarScrollable.style.overflowY = 'scroll'; // Force scrollbar
        }
      }
      
      // Log tất cả nav items với thông tin chi tiết
      console.log("All Nav Items in DOM:");
      navItems.forEach((item, index) => {
        const text = item.textContent?.trim() || item.innerText?.trim() || item.innerHTML?.trim() || 'No text';
        const rect = item.getBoundingClientRect();
        const isVisible = rect.height > 0 && rect.width > 0;
        console.log(`  [${index}] "${text.substring(0, 50)}" - visible: ${isVisible}, top: ${rect.top.toFixed(0)}, bottom: ${rect.bottom.toFixed(0)}, height: ${rect.height.toFixed(0)}`);
      });
      
      // Kiểm tra cụ thể "Cấu hình Escrow"
      const escrowItems = Array.from(navItems).filter(item => {
        const text = item.textContent || item.innerText || item.innerHTML || '';
        return text.includes('Cấu hình Escrow') || text.includes('Escrow') || text.includes('system-config');
      });
      
      console.log("Escrow-related items found:", escrowItems.length);
      escrowItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const text = item.textContent?.trim() || item.innerText?.trim() || 'No text';
        console.log(`  Escrow item [${index}]: "${text.substring(0, 50)}"`);
        console.log(`    Position: top=${rect.top.toFixed(0)}, bottom=${rect.bottom.toFixed(0)}, height=${rect.height.toFixed(0)}`);
        console.log(`    Visible: ${rect.height > 0 && rect.width > 0}`);
        console.log(`    In viewport: ${rect.top >= 0 && rect.bottom <= window.innerHeight}`);
        
        // Check if it's within the scrollable container
        if (sidebarScrollable) {
          const containerRect = sidebarScrollable.getBoundingClientRect();
          const isInContainer = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
          console.log(`    In scrollable container: ${isInContainer}`);
          
          // If Escrow item exists but is not visible, scroll to it
          if (escrowItems.length > 0 && !isInContainer && sidebarScrollable.scrollHeight > sidebarScrollable.clientHeight) {
            console.log("⚠️ Escrow item found but not visible - attempting to scroll to it");
            // Don't auto-scroll, but log the issue
          }
        }
      });
      
      // Kiểm tra "HỆ THỐNG" title
      const systemTitle = Array.from(navItems).find(item => {
        const text = item.textContent || item.innerText || item.innerHTML || '';
        return text.includes('HỆ THỐNG');
      });
      console.log("HỆ THỐNG title found:", systemTitle ? 'YES' : 'NO');
      if (systemTitle) {
        const rect = systemTitle.getBoundingClientRect();
        console.log("HỆ THỐNG title position:", { top: rect.top.toFixed(0), bottom: rect.bottom.toFixed(0), visible: rect.height > 0 });
      }
      
      // Kiểm tra "Cài đặt"
      const settingsItem = Array.from(navItems).find(item => {
        const text = item.textContent || item.innerText || item.innerHTML || '';
        return text.includes('Cài đặt') && !text.includes('HỆ THỐNG');
      });
      console.log("Cài đặt item found:", settingsItem ? 'YES' : 'NO');
      if (settingsItem) {
        const rect = settingsItem.getBoundingClientRect();
        console.log("Cài đặt item position:", { top: rect.top.toFixed(0), bottom: rect.bottom.toFixed(0), visible: rect.height > 0 });
      }
      
      console.log("=========================");
    };

    // Check multiple times to catch any timing issues
    const timeout1 = setTimeout(checkDOM, 500);
    const timeout2 = setTimeout(checkDOM, 1500);
    const timeout3 = setTimeout(checkDOM, 3000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [filteredNavigation]);

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
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      }}
    >
      <CSidebarHeader 
        className="border-bottom"
        style={{
          flexShrink: 0,
          flexGrow: 0,
          minHeight: '60px',
          maxHeight: '60px'
        }}
      >
        <CSidebarBrand>
          <img
            src={logoImg}
            alt="EV Admin"
            height={10}
            style={{ width: "auto" }}
          />
        </CSidebarBrand>
      </CSidebarHeader>
      <div 
        className="sidebar-scrollable"
        id="admin-sidebar-scrollable"
        style={{
          flex: '1 1 0%',
          overflowY: 'scroll',
          overflowX: 'hidden',
          minHeight: 0,
          height: 'calc(100vh - 60px - 50px)',
          maxHeight: 'calc(100vh - 60px - 50px)',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          width: '100%',
          scrollbarGutter: 'stable',
          // Force scrollbar to be visible
          scrollbarWidth: 'thin'
        }}
      >
        <AppSidebarNav items={filteredNavigation} />
      </div>
      <CSidebarFooter 
        className="border-top d-none d-lg-flex"
        style={{
          flexShrink: 0,
          flexGrow: 0,
          minHeight: '50px',
          maxHeight: '50px',
          zIndex: 1
        }}
      >
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
