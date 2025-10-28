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
import { NotificationPopup } from "../NotificationPopup/NotificationPopup";
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
  const [notificationPopups, setNotificationPopups] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");


  const navigate = useNavigate();
  const location = useLocation();


  // ========== AUTH STATE SYNC (ĐÃ SỬA ĐỂ ĐỌC userRole) ==========
  useEffect(() => {
    const checkAuthAndRole = () => {
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");
      const userEmail = localStorage.getItem("userEmail");
      // === SỬA: Đọc key "userRole" ===
      const role = localStorage.getItem("userRole") || "guest";


      setIsAuthenticated(!!token);
      // === SỬA: Cập nhật state userRole ===
      setUserRole(role);
      setUserInfo(token ? { username, email: userEmail } : null);


      console.log(
        `[Header] Auth check → Authenticated: ${!!token}, Role: ${role}, Username: ${username}`
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
        setNotificationCount(response?.data?.unreadCount || 0);
      } catch {
        console.warn("Cannot load notification count");
        setNotificationCount(0);
      }
    };
    loadNotificationCount();
  }, [isAuthenticated]);


  // ========== SUBSCRIBE REALTIME NOTIFICATION (Giữ nguyên) ==========
  useEffect(() => {
     if (!isAuthenticated) return;


    notificationService.init();
    const unsubscribe = notificationService.subscribe((notification) => {
      console.log("New notification:", notification);
      setNotificationPopups((prev) => [...prev, notification]);
      setNotificationCount((prev) => prev + 1);


      setTimeout(() => {
        setNotificationPopups((prev) =>
          prev.filter((n) => n.notificationId !== notification.notificationId)
        );
      }, 5000);
    });


    const handleNotificationRead = async () => {
      try {
        const response = await notificationApi.getUnreadCount();
        setNotificationCount(response?.data?.unreadCount || 0);
      } catch (error) {
        console.error("Error updating notification count:", error);
      }
    };


    window.addEventListener("notificationRead", handleNotificationRead);
    return () => {
      unsubscribe();
      window.removeEventListener("notificationRead", handleNotificationRead);
    };
  }, [isAuthenticated]);


  // ========== LOGOUT (ĐÃ SỬA ĐỂ XÓA ĐÚNG KEY) ==========
  const handleLogout = () => {
    console.log("Logging out...");
    [
      "token",
      "accessToken",
      "refreshToken",
      "username",
      "userEmail",
      "buyerId", // Vẫn xóa key này nếu có thể tồn tại
      "sellerId", // Vẫn xóa key này nếu có thể tồn tại
      "buyerAvatar",
      "authType", // Xóa key cũ không dùng nữa
      "userRole", // <<< Xóa key mới
      "activeSellerPackage" // <<< Xóa thông tin gói
    ].forEach((key) => {
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
     setNotificationPopups((prev) =>
      prev.filter((n) => n.notificationId !== notification.notificationId)
    );


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


  const handleNotificationPopupClose = (notificationId) => {
     setNotificationPopups((prev) =>
      prev.filter((n) => n.notificationId !== notificationId)
    );
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
      <div className={`hamburger-sidebar ${hamburgerMenuOpen ? "open" : ""}`}>
        <div className="hamburger-header">
          <h3>Danh mục sản phẩm</h3>
          <button className="close-btn" onClick={closeHamburgerMenu}>
            <X />
          </button>
        </div>
        <div className="hamburger-content">
          <CategorySidebar />
        </div>
      </div>


      {/* Upgrade Notification Modal */}
      <UpgradeNotificationModal
        isOpen={showUpgradeModal}
        onClose={handleCloseUpgradeModal}
        onUpgrade={handleUpgrade}
        featureName={upgradeFeatureName}
      />


      {/* Notification Popup Toast */}
      <NotificationPopup
        notifications={notificationPopups}
        onClose={handleNotificationPopupClose}
        onClick={handleNotificationPopupClick}
      />
    </nav>
  );
}







