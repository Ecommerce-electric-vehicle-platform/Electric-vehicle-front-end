"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
} from "lucide-react";
import { CategorySidebar } from '../CategorySidebar/CategorySidebar';
import "./Header.css";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra xem có đang ở trang ProductDetail không
  const isProductDetail = location.pathname.startsWith('/product/');


  // ✅ Hàm cuộn mượt tới section
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ✅ Hàm navigation thông minh
  const handleSmartNavigation = (sectionId) => {
    if (isProductDetail) {
      // Nếu đang ở ProductDetail, chuyển về trang chủ với hash
      navigate(`/#${sectionId}`);
    } else {
      // Nếu đang ở trang chủ, chỉ cần cuộn
      scrollToSection(sectionId);
    }
  };

  // ✅ Hàm điều hướng
  const handleNavigate = (path) => {
    navigate(path);
  };

  // ✅ Hàm reload trang khi click logo
  const handleLogoClick = () => {
    window.location.reload();
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
          {/* 👤 Auth buttons */}
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
    </header>
  );
}
