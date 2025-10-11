"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
} from "lucide-react";
import "./Header.css";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();


  // ✅ Hàm cuộn mượt tới section
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
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

  return (
    <header className="header">
      <div className="header-container">
        {/* 🌿 Logo */}
        <div className="header-logo" onClick={handleLogoClick}>
          <h1 className="logo-text">
            <span className="logo-green">GREEN</span>
            <span className="logo-trade">TRADE</span>
          </h1>
        </div>

        {/* 🌎 Navigation */}
        <nav className="header-nav">
          <button className="nav-link" onClick={() => scrollToSection("vehicleshowcase-section")}>
            Sản phẩm
          </button>
          <button className="nav-link" onClick={() => scrollToSection("upgrade-section")}>
            Đăng tin
          </button>
          <button className="nav-link" onClick={() => scrollToSection("footer")}>
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
    </header>
  );
}
