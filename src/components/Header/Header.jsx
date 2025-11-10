import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Heart,
  MessageCircle,
  Bell,
  Package,
} from "lucide-react";


import { CategorySidebar } from "../CategorySidebar/CategorySidebar";
import { UserDropdown } from "../UserDropdown/UserDropdown";
import { UpgradeNotificationModal } from "../UpgradeNotificationModal/UpgradeNotificationModal";
import { NotificationList } from "../NotificationList/NotificationList";
import notificationApi from "../../api/notificationApi";
import notificationService from "../../services/notificationService";
import "./Header.css";


export function Header() {
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  // === SỬA: Đổi state thành userRole và đọc key "userRole" ===
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || "guest"); // buyer | seller | guest


  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");


  const navigate = useNavigate();
  const location = useLocation();


  // ========== AUTH STATE SYNC (ĐÃ SỬA ĐỂ ĐỌC userRole) ==========
  useEffect(() => {
    const checkAuthAndRole = () => {
      const token = localStorage.getItem("token");
      const authType = localStorage.getItem("authType");

      // ✅ QUAN TRỌNG: Nếu authType là "admin", KHÔNG hiển thị user info
      // Header user chỉ hiển thị khi user đăng nhập, không phải admin
      if (authType === "admin") {
        setIsAuthenticated(false);
        setUserRole("guest");
        setUserInfo(null);
        console.log("[Header] Admin đang đăng nhập, không hiển thị user info");
        return;
      }

      const username = localStorage.getItem("username");
      const userEmail = localStorage.getItem("userEmail");
      // === SỬA: Đọc key "userRole" ===
      const role = localStorage.getItem("userRole") || "guest";


      setIsAuthenticated(!!token && !authType); // Chỉ authenticated nếu có token và không phải admin
      // === SỬA: Cập nhật state userRole ===
      setUserRole(role);
      setUserInfo(token && !authType ? { username, email: userEmail } : null);


      console.log(
        `[Header] Auth check → Authenticated: ${!!token && !authType}, Role: ${role}, Username: ${username}, AuthType: ${authType}`
      );
    };


    // Run once on mount
    checkAuthAndRole();


    // Listen to auth events
    window.addEventListener("authStatusChanged", checkAuthAndRole);
    window.addEventListener("roleChanged", checkAuthAndRole); // Giữ lại để cập nhật ngay khi bấm "Hoàn tất" KYC


    return () => {
      window.removeEventListener("authStatusChanged", checkAuthAndRole);
      window.removeEventListener("roleChanged", checkAuthAndRole);
    };
  }, []);


  // ========== LOAD NOTIFICATIONS (Giữ nguyên) ==========
  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationCount(0);
      return;
    }


    const loadNotificationCount = async () => {
      try {
        const response = await notificationApi.getUnreadCount();
        const count = response?.data?.unreadCount || 0;
        console.log("[Header] Loaded notification count:", count);
        setNotificationCount(count);
      } catch (error) {
        console.warn("Cannot load notification count:", error);
        setNotificationCount(0);
      }
    };
    
    // FIX: Load count ngay và reload lại nhiều lần để đảm bảo có dữ liệu mới nhất
    loadNotificationCount();
    
    // Reload sau 500ms
    const reloadTimer1 = setTimeout(() => {
      loadNotificationCount();
    }, 500);
    
    // Reload sau 1.5s (để đảm bảo backend đã cập nhật)
    const reloadTimer2 = setTimeout(() => {
      loadNotificationCount();
    }, 1500);
    
    // FIX: Reload count khi focus vào window (khi user quay lại tab)
    const handleFocus = () => {
      loadNotificationCount();
    };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      clearTimeout(reloadTimer1);
      clearTimeout(reloadTimer2);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated]);


  // ========== SUBSCRIBE REALTIME NOTIFICATION (Giữ nguyên) ==========
  useEffect(() => {
    if (!isAuthenticated) {
      // FIX: Stop notification service khi logout
      notificationService.stopPolling();
      return;
    }

    // FIX: Đảm bảo notification service được init lại khi user login
    // (Trường hợp user login sau khi app đã load)
    console.log("[Header] User authenticated, initializing notification service...");
    
    // FIX: Init ngay lập tức và poll ngay sau đó
    const initAndPoll = async () => {
      // Đợi một chút để đảm bảo localStorage đã được update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = localStorage.getItem("token");
      const buyerId = localStorage.getItem("buyerId");
      
      console.log("[Header] Initializing notification service after login...", {
        hasToken: !!token,
        buyerId
      });
      
      if (token && buyerId) {
        // Init service
        notificationService.init();
        
        // FIX: Poll ngay sau khi init (đợi một chút để service đã start)
        setTimeout(async () => {
          console.log("[Header] Force polling once to get existing notifications...");
          try {
            // Poll một lần để lấy notification hiện có
            await notificationService.pollNotifications();
          } catch (error) {
            console.error("[Header] Error polling notifications:", error);
          }
        }, 800); // Đợi 800ms để WebSocket/Polling đã start hoàn toàn
      } else {
        console.warn("[Header] Cannot init notification service: Missing token or buyerId");
        // Retry sau 500ms nếu chưa có token/buyerId
        setTimeout(() => {
          const retryToken = localStorage.getItem("token");
          const retryBuyerId = localStorage.getItem("buyerId");
          if (retryToken && retryBuyerId) {
            console.log("[Header] Retrying notification service init...");
            notificationService.init();
            setTimeout(() => {
              notificationService.pollNotifications();
            }, 800);
          }
        }, 500);
      }
    };
    
    initAndPoll();
    
    const unsubscribe = notificationService.subscribe((notification) => {
      console.log("New notification:", notification);
      
      // FIX: Chỉ tăng count, không hiển thị popup
      if (!notification.isRead) {
        setNotificationCount((prev) => prev + 1);
      }
    });


    const handleNotificationRead = async () => {
      try {
        // FIX: Đợi đủ lâu để backend đã cập nhật readAt
        // markAsRead có retry verification mất đến 2.5 giây, nên đợi 3 giây
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // FIX: Retry với delay tăng dần để đảm bảo backend đã cập nhật
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const response = await notificationApi.getUnreadCount();
            const newCount = response?.data?.unreadCount || 0;
            console.log(`[Header] Notification read, updating count (attempt ${retryCount + 1}/${maxRetries}):`, newCount);
            setNotificationCount(newCount);
            
            // Nếu count = 0, có thể đã thành công, nhưng vẫn retry thêm 1 lần để chắc chắn
            if (newCount === 0 && retryCount < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              retryCount++;
            } else {
              break;
            }
          } catch (error) {
            console.error(`[Header] Error updating notification count (attempt ${retryCount + 1}):`, error);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      } catch (error) {
        console.error("Error updating notification count:", error);
        // Nếu lỗi, vẫn thử reload count
        try {
          const response = await notificationApi.getUnreadCount();
          setNotificationCount(response?.data?.unreadCount || 0);
        } catch {
          // Ignore
        }
      }
    };


    window.addEventListener("notificationRead", handleNotificationRead);
    return () => {
      unsubscribe();
      window.removeEventListener("notificationRead", handleNotificationRead);
    };
  }, [isAuthenticated]);


  // ========== LOGOUT (ĐÃ SỬA ĐỂ XÓA ĐÚNG KEY - CHỈ XÓA USER DATA) ==========
  const handleLogout = () => {
    console.log("User logging out...");

    //  CHỈ xóa user-specific keys, KHÔNG xóa adminProfile
    // Vì user logout không liên quan đến admin

    // Xóa đơn hàng localStorage theo username khi logout
    const username = localStorage.getItem("username");
    if (username) {
      const storageKey = `orders_${username}`;
      localStorage.removeItem(storageKey);
      console.log(`[Header] Cleared localStorage orders for user: ${storageKey}`);
    }
    


    [
      "token",
      "accessToken",
      "refreshToken",
      "username",
      "userEmail",
      "buyerId",
      "sellerId",
      "buyerAvatar",
      "userRole", // <<< Xóa key mới
      "activeSellerPackage", // <<< Xóa thông tin gói
      "authType" // Xóa authType nếu nó không phải "admin"
    ].forEach((key) => {
      // Kiểm tra nếu authType là "admin" thì không xóa (nhưng trường hợp này không xảy ra vì user header không hiển thị khi admin login)
      if (key === "authType") {
        const authType = localStorage.getItem("authType");
        if (authType === "admin") {
          console.log("[Header] Giữ authType = admin khi user logout (không ảnh hưởng)");
          return;
        }
      }
      console.log("Removing item:", key);
      localStorage.removeItem(key);
    });


    setUserInfo(null);
    setIsAuthenticated(false);
    // === SỬA: Cập nhật state userRole thành guest ===
    setUserRole("guest");


    window.dispatchEvent(new CustomEvent("authStatusChanged"));
    navigate("/");
  };


  // ========== MENU TOGGLES (Giữ nguyên) ==========
  const toggleHamburgerMenu = () => {
    setHamburgerMenuOpen((prev) => !prev);
    document.body.classList.toggle("hamburger-menu-open", !hamburgerMenuOpen);
  };
  const closeHamburgerMenu = () => {
    setHamburgerMenuOpen(false);
    document.body.classList.remove("hamburger-menu-open");
  };


  // ========== SMART NAVIGATION (Giữ nguyên) ==========
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };
  const handleSmartNavigation = (sectionId) => {
    if (location.pathname === "/") scrollToSection(sectionId);
    else navigate(`/#${sectionId}`);
  };


  // ========== SELLER ACTIONS (ĐÃ SỬA ĐỂ DÙNG state userRole) ==========
  const handleSellerAction = (action) => {
    // === SỬA: Dùng state userRole thay vì đọc localStorage trực tiếp ===
    const currentRole = userRole;
    console.log(`handleSellerAction called for "${action}". Current role (from state): ${currentRole}`);


    // Buyer or guest → show upgrade modal
    if (currentRole === "buyer" || currentRole === "guest") {
      setUpgradeFeatureName(action);
      setShowUpgradeModal(true);
      // Không cần return ở đây nữa vì role seller đã được check
    }
    // Seller → navigate directly
    else if (currentRole === "seller") {
      if (action === "Đăng tin") navigate("/seller/create-post"); // <<< Thay đổi route nếu cần
      else if (action === "Quản lý tin") navigate("/seller/manage-posts"); // <<< Thay đổi route nếu cần
    }
    // Admin (Nếu có)
    /*
    else if (currentRole === "admin") {
        // navigate("/admin/dashboard");
    }
    */
  };


  const handleUpgrade = () => {
    navigate("/profile?tab=upgrade");
    setShowUpgradeModal(false);
    setUpgradeFeatureName("");
  };


  const handleCloseUpgradeModal = () => {
    setShowUpgradeModal(false);
    setUpgradeFeatureName("");
  };


  // ========== ICON HANDLERS (Giữ nguyên) ==========
  const handleIconClick = (type) => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }


    switch (type) {
      case "heart":
        navigate("/favorites");
        break;
      case "chat":
        navigate("/chat");
        break;
      case "orders":
        navigate("/orders");
        break;
      case "bell":
        setShowNotificationDropdown((prev) => !prev);
        break;
      default:
        break;
    }
  };


  const handleNotificationPopupClick = (notification) => {
    // Navigate based on notification type
    // === SỬA: Bỏ hàm handleNotificationNavigation cũ ===
    if (
      notification.type === "seller_approved" ||
      notification.type === "success"
    ) {
      navigate("/profile"); // Navigate to profile page where they can see upgrade status/buy package
    }
    // Add other navigation logic here based on notification.type if needed
  };




  // ========== JSX ==========
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Hamburger Menu */}
          <button
            className="navbar-hamburger"
            onClick={toggleHamburgerMenu}
            aria-label="Mở menu danh mục"
          >
            {hamburgerMenuOpen ? <X /> : <Menu />}
          </button>


          {/* Logo */}
          <div
            className="navbar-logo"
            onClick={() => navigate("/")} // Đơn giản hóa điều hướng logo
            style={{ cursor: "pointer" }}
          >
            <span className="navbar-logo-green">GREEN</span>
            <span className="navbar-logo-orange">TRADE</span>
          </div>


          {/* Nav Links */}
          <nav className="navbar-nav">
            <button
              className="nav-link"
              onClick={() => handleSmartNavigation("vehicleshowcase-section")}
            >
              Sản phẩm
            </button>
            <button
              className="nav-link"
              onClick={() => handleSmartNavigation("upgrade-section")} // Giữ lại link này?
            >
              Đăng tin
            </button>
            <button
              className="nav-link"
              onClick={() => handleSmartNavigation("footer")}
            >
              Về chúng tôi
            </button>
          </nav>


          {/* Spacer */}
          <div className="navbar-spacer" />


          {/* User Actions */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <>
                {/* Icons */}
                <button
                  className="navbar-icon-button"
                  onClick={() => handleIconClick("heart")}
                  aria-label="Yêu thích"
                >
                  <Heart className="navbar-icon" />
                </button>


                <button
                  className="navbar-icon-button"
                  onClick={() => handleIconClick("chat")}
                  aria-label="Tin nhắn"
                >
                  <MessageCircle className="navbar-icon" />
                </button>


                <button
                  className="navbar-icon-button"
                  onClick={() => handleIconClick("orders")}
                  aria-label="Đơn hàng"
                >
                  <Package className="navbar-icon" />
                </button>


                {/* Bell & Notifications */}
                <div style={{ position: "relative", zIndex: 100 }}> {/* Added zIndex */}
                  <button
                    className="navbar-notification-button"
                    onClick={(e) => { e.stopPropagation(); handleIconClick("bell"); }} // Added stopPropagation
                    aria-label="Thông báo"
                  >
                    <Bell className="navbar-icon" />
                    {notificationCount > 0 && (
                      <span className="navbar-notification-badge">
                        {notificationCount}
                      </span>
                    )}
                  </button>


                  {showNotificationDropdown && (
                    <NotificationList
                      isOpen={showNotificationDropdown}
                      onClose={() => setShowNotificationDropdown(false)}
                      onNotificationClick={handleNotificationPopupClick} // Reuse handler
                    />
                  )}
                </div>


                {/* Seller buttons */}
                <button
                  className="navbar-action-button"
                  onClick={() => handleSellerAction("Quản lý tin")}
                >
                  QUẢN LÝ TIN
                </button>
                <button
                  className="navbar-action-button"
                  onClick={() => handleSellerAction("Đăng tin")}
                >
                  ĐĂNG TIN
                </button>


                <UserDropdown userInfo={userInfo} onLogout={handleLogout} />
              </>
            ) : (
              <>
                {/* Login/Signup Buttons */}
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate("/signin")}
                >
                  Đăng nhập
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/signup")}
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </div>


      {/* Hamburger Menu Sidebar */}
      {hamburgerMenuOpen && (
        <div className="hamburger-overlay" onClick={closeHamburgerMenu}></div>
      )}
      <div
        className={`hamburger-sidebar ${hamburgerMenuOpen ? "open" : ""}`}
        onClick={(e) => {
          // Ngăn click trong sidebar đóng sidebar
          e.stopPropagation();
        }}
      >
        <div className="hamburger-header">
          <h3>Danh mục sản phẩm</h3>
          <button className="close-btn" onClick={closeHamburgerMenu}>
            <X />
          </button>
        </div>
        <div className="hamburger-content">
          <CategorySidebar
            onClose={closeHamburgerMenu}
            isOpen={hamburgerMenuOpen}
          />
        </div>
      </div>


      {/* Upgrade Notification Modal */}
      <UpgradeNotificationModal
        isOpen={showUpgradeModal}
        onClose={handleCloseUpgradeModal}
        onUpgrade={handleUpgrade}
        featureName={upgradeFeatureName}
      />


    </nav>
  );
}
