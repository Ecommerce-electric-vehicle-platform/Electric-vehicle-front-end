import { ArrowRight, Search, Zap, Shield, Recycle, TrendingUp } from "lucide-react"
import { CategorySidebar } from "../CategorySidebar/CategorySidebar"
import { useState, useEffect } from "react"
import "./HeroSection.css"

export function HeroSection() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Disable scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open')
    } else {
      document.body.classList.remove('menu-open')
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('menu-open')
    }
  }, [isMenuOpen])

  // Hàm smooth scroll đến section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  // Xử lý click button "Xem sản phẩm"
  const handleViewProducts = (e) => {
    e.preventDefault()
    scrollToSection('vehicleshowcase-section')
  }

  // Xử lý click button "Bán sản phẩm"
  const handleSellProducts = (e) => {
    e.preventDefault()
    scrollToSection('upgrade-section')
  }

  // Xử lý toggle menu
  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Xử lý đóng menu
  const handleCloseMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <section className="hero-section">
      {/* Background Elements */}
      <div className="hero-background">
        <div className="electric-grid"></div>
        <div className="floating-elements">
          <div className="floating-battery"></div>
          <div className="floating-car"></div>
          <div className="floating-charge"></div>
        </div>
        <div className="gradient-overlay"></div>
      </div>

      <div className="hero-container">
        {/* Hamburger Menu Button */}
        <div className="hero-menu-button">
          <button
            className="hamburger-btn"
            onClick={handleToggleMenu}
          >
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </button>
        </div>

        {/* Overlay Backdrop */}
        <div
          className={`hero-overlay ${isMenuOpen ? 'active' : ''}`}
          onClick={handleCloseMenu}
        ></div>

        {/* Category Sidebar - Hidden by default */}
        <div className={`hero-sidebar ${isMenuOpen ? 'active' : ''}`}>
          <CategorySidebar />
        </div>

        <div className="hero-content">
          {/* Badge */}
          <div className="hero-badge">
            <span className="badge-pulse">
              <span className="pulse-ring"></span>
              <span className="pulse-dot"></span>
            </span>
            <Zap className="badge-icon" />
            Nền tảng giao dịch uy tín
          </div>

          {/* Main Title */}
          <h1 className="hero-title">
            Nền tảng giao dịch <span className="hero-gradient">Pin & Xe điện</span> đã qua sử dụng
          </h1>

          {/* Description */}
          <p className="hero-description">
            Mua bán xe điện và pin đã qua sử dụng một cách an toàn, minh bạch.
            Góp phần xây dựng tương lai giao thông bền vững và tiết kiệm chi phí.
          </p>

          {/* Action Buttons */}
          <div className="hero-actions">
            <button className="btn btn-large btn-primary" onClick={handleViewProducts}>
              <Search className="btn-icon" />
              <span>Xem sản phẩm</span>
              <div className="btn-shine"></div>
            </button>
            <button className="btn btn-large btn-outline-hero" onClick={handleSellProducts}>
              <span>Bán sản phẩm</span>
              <ArrowRight className="btn-icon" />
              <div className="btn-glow"></div>
            </button>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <Shield />
              </div>
              <div className="stat-content">
                <span className="stat-number">100%</span>
                <span className="stat-label">An toàn</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Recycle />
              </div>
              <div className="stat-content">
                <span className="stat-number">500+</span>
                <span className="stat-label">Sản phẩm</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <TrendingUp />
              </div>
              <div className="stat-content">
                <span className="stat-number">95%</span>
                <span className="stat-label">Hài lòng</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
