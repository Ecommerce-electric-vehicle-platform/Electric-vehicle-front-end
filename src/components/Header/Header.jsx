"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Heart,
  MessageCircle,
  Bell,
} from "lucide-react";
import { CategorySidebar } from '../CategorySidebar/CategorySidebar';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import { UpgradeNotificationModal } from '../UpgradeNotificationModal/UpgradeNotificationModal';
import "./Header.css";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, _setUserRole] = useState('buyer'); // 'buyer' hoặc 'người bán'
  const [notificationCount, _setNotificationCount] = useState(4);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra xem có đang ở trang ProductDetail không
  const _isProductDetail = location.pathname.startsWith('/product/');

  // Kiểm tra xem có đang ở trang home không
  const isHomePage = location.pathname === '/';

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");
      const userEmail = localStorage.getItem("userEmail");

      setIsAuthenticated(!!token);
      if (token && username) {
        setUserInfo({ username, email: userEmail });
      } else {
        setUserInfo(null);
      }
    };

    checkAuthStatus();
    window.addEventListener('authStatusChanged', checkAuthStatus);

    return () => {
      window.removeEventListener('authStatusChanged', checkAuthStatus);
    };
  }, []);

  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("buyerId");
    localStorage.removeItem("userEmail");

    setUserInfo(null);
    setIsAuthenticated(false);

    // Dispatch event để thông báo đăng xuất
    window.dispatchEvent(new CustomEvent('authStatusChanged'));

    navigate("/");
  };

  // ✅ Hàm cuộn mượt tới section
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ✅ Hàm navigation thông minh
  const handleSmartNavigation = (sectionId) => {
    if (isHomePage) {
      // Nếu đang ở trang chủ, chỉ cần cuộn
      scrollToSection(sectionId);
    } else {
      // Nếu đang ở trang khác (profile, product detail, etc.), chuyển về trang chủ với hash
      navigate(`/#${sectionId}`);
    }
  };

  // ✅ Hàm điều hướng
  const handleNavigate = (path) => {
    navigate(path);
  };

  // ✅ Điều hướng về trang Home theo role (Home.jsx sẽ chọn HomeUser/HomeGuest)
  const handleLogoClick = () => {
    if (isHomePage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  // ✅ Hàm toggle hamburger menu
  const toggleHamburgerMenu = () => {
    setHamburgerMenuOpen(!hamburgerMenuOpen);
    // Ngăn scroll khi menu mở
    if (!hamburgerMenuOpen) {
      document.body.classList.add('hamburger-menu-open');
    } else {
      document.body.classList.remove('hamburger-menu-open');
    }
  };

  // ✅ Hàm đóng hamburger menu
  const closeHamburgerMenu = () => {
    setHamburgerMenuOpen(false);
    document.body.classList.remove('hamburger-menu-open');
  };

  // ✅ Hàm xử lý click vào nút người bán khi user là buyer
  const handleSellerAction = (action) => {
    if (userRole === 'buyer') {
      // Hiển thị modal yêu cầu upgrade
      setUpgradeFeatureName(action);
      setShowUpgradeModal(true);
    } else {
      // Xử lý action cho người bán
      if (action === 'Quản lý tin') {
        // TODO: Navigate to manage posts page
        console.log('Navigate to manage posts');
      } else if (action === 'Đăng tin') {
        // TODO: Navigate to create post page
        console.log('Navigate to create post');
      }
    }
  };

  // ✅ Hàm xử lý nâng cấp tài khoản
  const handleUpgrade = () => {
    navigate('/profile');
  };

  // ✅ Hàm đóng modal
  const handleCloseUpgradeModal = () => {
    setShowUpgradeModal(false);
    setUpgradeFeatureName('');
  };

  // ✅ Hàm xử lý click vào các icon
  const handleIconClick = (iconType) => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    switch (iconType) {
      case 'heart':
        navigate('/favorites');
        break;
      case 'chat':
        navigate('/chat');
        break;
      case 'bell':
        // TODO: Navigate to notifications page
        console.log('Navigate to notifications');
        break;
      default:
        break;
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* 🍔 Hamburger Menu Button */}
        <button
          className="hamburger-menu-btn"
          onClick={toggleHamburgerMenu}
          aria-label="Mở menu danh mục"
        >
          <Menu className="hamburger-icon" />
        </button>

        {/* 🌿 Logo */}
        <div className="header-logo" onClick={handleLogoClick}>
          <h1 className="logo-text">
            <span className="logo-green">GREEN</span>
            <span className="logo-trade">TRADE</span>
          </h1>
        </div>

        {/* 🌎 Navigation */}
        <nav className="header-nav">
          <button className="nav-link" onClick={() => handleSmartNavigation("vehicleshowcase-section")}>
            Sản phẩm
          </button>
          <button className="nav-link" onClick={() => handleSmartNavigation("upgrade-section")}>
            Đăng tin
          </button>
          <button className="nav-link" onClick={() => handleSmartNavigation("footer")}>
            Về chúng tôi
          </button>
        </nav>

        {/* 🧭 Actions */}
        <div className="header-actions">
          {isAuthenticated ? (
            /* 👤 User Actions */
            <div className="user-actions">
              {/* Icons */}
              <div className="action-icons">
                <button
                  className="action-icon-btn"
                  onClick={() => handleIconClick('heart')}
                  aria-label="Yêu thích"
                >
                  <Heart className="action-icon" />
                </button>

                <button
                  className="action-icon-btn"
                  onClick={() => handleIconClick('chat')}
                  aria-label="Tin nhắn"
                >
                  <MessageCircle className="action-icon" />
                </button>

                <button
                  className="action-icon-btn notification-btn"
                  onClick={() => handleIconClick('bell')}
                  aria-label="Thông báo"
                >
                  <Bell className="action-icon" />
                  {notificationCount > 0 && (
                    <span className="notification-badge">{notificationCount}</span>
                  )}
                </button>
              </div>

              {/* Người bán Buttons */}
              <div className="seller-buttons">
                <button
                  className="btn btn-seller-secondary"
                  onClick={() => handleSellerAction('Quản lý tin')}
                >
                  Quản lý tin
                </button>
                <button
                  className="btn btn-seller-primary"
                  onClick={() => handleSellerAction('Đăng tin')}
                >
                  Đăng tin
                </button>
              </div>

              {/* User Dropdown */}
              <UserDropdown
                userInfo={userInfo}
                onLogout={handleLogout}
              />
            </div>
          ) : (
            /* 👤 Auth buttons */
            <div className="auth-buttons">
              <button
                className="btn btn-ghost"
                onClick={() => handleNavigate("/signin")}
              >
                Đăng nhập
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleNavigate("/signup")}
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>

        {/* 📱 Mobile Toggle */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
        </button>
      </div>

      {/* 🍔 Hamburger Menu Sidebar */}
      {hamburgerMenuOpen && (
        <div className="hamburger-overlay" onClick={closeHamburgerMenu}></div>
      )}

      <div className={`hamburger-sidebar ${hamburgerMenuOpen ? 'open' : ''}`}>
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

      {/* 🎯 Upgrade Notification Modal */}
      <UpgradeNotificationModal
        isOpen={showUpgradeModal}
        onClose={handleCloseUpgradeModal}
        onUpgrade={handleUpgrade}
        featureName={upgradeFeatureName}
      />
    </header>
  );
}
