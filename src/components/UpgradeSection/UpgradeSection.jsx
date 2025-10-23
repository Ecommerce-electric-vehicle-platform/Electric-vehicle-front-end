import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  Shield,
  Store,
  Image as ImageIcon,
  Sparkles,
  Headphones,
  Clock,
  TrendingUp,
  Crown,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { UpgradeConfirmationModal } from "../UpgradeConfirmationModal/UpgradeConfirmationModal";
import "./UpgradeSection.css";

export function UpgradeSection({ requireAuth = false }) {
  const sectionRef = useRef(null);
  const openedViaURLRef = useRef(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 🪄 Hiệu ứng fade-in khi section vào viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("section-visible");
          }
        });
      },
      { threshold: 0.3 }
    );

    const currentSection = sectionRef.current;
    if (currentSection) observer.observe(currentSection);

    return () => {
      if (currentSection) observer.unobserve(currentSection);
    };
  }, []);

  // 🌐 Global trigger từ URL hoặc hàm ngoài (chỉ scroll khi từ URL)
  useEffect(() => {
    const scrollToSection = () => {
      const el = sectionRef.current;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    // Global function để mở modal từ bên ngoài (có thể scroll)
    window.openUpgradePlans = () => {
      scrollToSection();
      setTimeout(() => setShowUpgradeModal(true), 450);
    };

    // Chỉ scroll khi có hash hoặc param từ URL
    const params = new URLSearchParams(location.search);
    const hasHash = location.hash === "#upgrade" || location.hash === "#upgrade-section";
    const wantsOpen = params.get("openUpgrade") === "1";
    if ((hasHash || wantsOpen) && !openedViaURLRef.current) {
      openedViaURLRef.current = true;
      scrollToSection();
      if (wantsOpen) {
        setTimeout(() => setShowUpgradeModal(true), 450);
      }
    }

    return () => {
      try {
        delete window.openUpgradePlans;
      } catch {
        /* noop */
      }
    };
  }, [location, requireAuth]);

  const packages = [
    {
      id: "standard",
      name: "Standard Package",
      tagline: "Phù hợp cá nhân dùng thử",
      icon: "⭐",
      featured: false,
      benefits: [
        { icon: Store, text: "Tối đa 10 sản phẩm, 5 ảnh/sản phẩm" },
        { icon: TrendingUp, text: "Hiển thị cơ bản trong danh mục & tìm kiếm" },
        {
          icon: Headphones,
          text: "Hỗ trợ email/chat, phản hồi tiêu chuẩn (~7% phí)",
        },
      ],
      monthlyPrice: 200000,
    },
    {
      id: "pro",
      name: "Pro Package",
      tagline: "Dành cho cửa hàng nhỏ",
      icon: "🌟",
      featured: true,
      benefits: [
        { icon: Store, text: "Tối đa 30 sản phẩm, 7 ảnh/sản phẩm" },
        {
          icon: Sparkles,
          text: "Ưu tiên hiển thị trong danh mục (trên Standard)",
        },
        {
          icon: Headphones,
          text: "Hỗ trợ nhanh (email/chat, hotline giờ hành chính) ~5% phí",
        },
      ],
      monthlyPrice: 400000,
    },
    {
      id: "vip",
      name: "VIP Package",
      tagline: "Cho doanh nghiệp",
      icon: "🏆",
      featured: false,
      benefits: [
        {
          icon: ImageIcon,
          text: "Tối đa 100 sản phẩm, 10 ảnh/sản phẩm; duyệt ưu tiên",
        },
        {
          icon: Crown,
          text: "Ưu tiên cao trong tìm kiếm; hiển thị logo thương hiệu",
        },
        {
          icon: Shield,
          text: "Hỗ trợ ưu tiên 24/7, phản hồi nhanh nhất (~3% phí)",
        },
      ],
      monthlyPrice: 1200000,
    },
  ];

  // 🔁 Billing toggle: tháng / quý / năm
  const [billingCycle, setBillingCycle] = useState("month"); // 'month' | 'quarter' | 'year'
  const billingMeta = {
    month: { label: "Tháng", months: 1, discount: 0 },
    quarter: { label: "Quý", months: 3, discount: 0.1 },
    year: { label: "Năm", months: 12, discount: 0.2 },
  };

  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);

  // 🟢 Khi click: mở modal ngay, KHÔNG cuộn trang
  const handleUpgrade = () => {
    // ✅ Hiển thị modal tức thì tại vị trí hiện tại
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = () => {
    if (requireAuth) {
      // Nếu là guest, điều hướng đến trang đăng nhập
      navigate("/signin");
    } else {
      // Nếu đã đăng nhập, điều hướng đến trang profile để nâng cấp
      navigate("/profile?tab=upgrade");
    }
  };

  const handleCloseModal = () => {
    setShowUpgradeModal(false);
  };


  return (
    <section id="upgrade" className="upgrade-section" ref={sectionRef}>
      <div className="upgrade-container">
        <div className="upgrade-header">
          <h2 className="upgrade-title">Nâng cấp tài khoản của bạn</h2>
          <p className="upgrade-subtitle">
            Từ người mua hàng thành người bán hàng chuyên nghiệp
          </p>
        </div>

        {/* Billing toggle */}
        <div
          className="billing-toggle"
          role="tablist"
          aria-label="Chọn chu kỳ thanh toán"
        >
          {Object.entries(billingMeta).map(([key, meta]) => (
            <button
              key={key}
              role="tab"
              aria-selected={billingCycle === key}
              className={`toggle-btn ${billingCycle === key ? "active" : ""}`}
              onClick={() => setBillingCycle(key)}
            >
              {meta.label}
            </button>
          ))}
        </div>

        <div className="packages-grid">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`package-card ${pkg.featured ? "featured" : ""}`}
              onClick={handleUpgrade}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleUpgrade();
              }}
            >
              {pkg.featured && (
                <div className="featured-badge">
                  <span>KHUYẾN MÃI</span>
                </div>
              )}

              <div className="package-header">
                <div className="package-icon">{pkg.icon}</div>
                <h3 className="package-name">{pkg.name}</h3>
                {pkg.tagline && (
                  <div className="package-tagline">{pkg.tagline}</div>
                )}
              </div>

              <div className="package-divider">
                <svg viewBox="0 0 200 20" className="wave-divider">
                  <path
                    d="M0,10 Q50,0 100,10 T200,10 L200,20 L0,20 Z"
                    fill="white"
                  />
                </svg>
              </div>

              <div className="package-content">
                <ul className="features-list">
                  {pkg.benefits.map((benefit, index) => {
                    const Icon = benefit.icon || CheckCircle;
                    return (
                      <li key={index} className="feature-item">
                        <Icon
                          size={18}
                          color="#10b981"
                          style={{ marginRight: 8 }}
                        />
                        <span className="feature-text">
                          {benefit.text || benefit}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* dynamic price by billing cycle */}
                {(() => {
                  const meta = billingMeta[billingCycle];
                  const subtotal = pkg.monthlyPrice * meta.months;
                  const discountAmount = subtotal * meta.discount;
                  const total = subtotal - discountAmount;
                  const hasDiscount = meta.discount > 0;
                  return (
                    <div className="dynamic-price">
                      <div className="price-line">
                        <span className="duration-label">{meta.label}</span>
                        <span className="price-value">{formatVND(total)}</span>
                      </div>
                      {hasDiscount && (
                        <div className="save-ribbon">
                          Tiết kiệm {Math.round(meta.discount * 100)}%
                        </div>
                      )}
                    </div>
                  );
                })()}

                <button className="upgrade-button" onClick={handleUpgrade}>
                  <span className="button-icon">💳</span>
                  <span className="button-text">Nâng cấp ngay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nâng cấp */}
      <UpgradeConfirmationModal
        isOpen={showUpgradeModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmUpgrade}
        isGuest={requireAuth}
        anchorRef={sectionRef}
      />
    </section>
  );
}
