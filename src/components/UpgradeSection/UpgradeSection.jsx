import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UpgradeConfirmationModal } from '../UpgradeConfirmationModal/UpgradeConfirmationModal';
import { NotificationModal } from '../NotificationModal/NotificationModal';
import './UpgradeSection.css';

export function UpgradeSection({ requireAuth = false }) {
    const sectionRef = useRef(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // 🪄 Hiệu ứng fade-in khi section vào viewport
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-visible');
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

    // 🌐 Global trigger từ URL hoặc hàm ngoài
    useEffect(() => {
        const scrollToSection = () => {
            const el = sectionRef.current;
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        window.openUpgradePlans = () => {
            scrollToSection();
            setTimeout(() => setShowUpgradeModal(true), 450);
        };

        const params = new URLSearchParams(location.search);
        if (location.hash === '#upgrade' || params.get('openUpgrade') === '1') {
            scrollToSection();
            if (params.get('openUpgrade') === '1') {
                setTimeout(() => setShowUpgradeModal(true), 450);
            }
        }

        return () => {
            try { delete window.openUpgradePlans; } catch { /* noop */ }
        };
    }, [location]);

    const packages = [
        {
            id: 'standard',
            name: 'Standard Package',
            tagline: 'Phù hợp cá nhân dùng thử',
            icon: '⭐',
            featured: false,
            benefits: [
                'Quản lý & Sản phẩm: tối đa 10 sản phẩm, 5 ảnh/sản phẩm',
                'Hiển thị & Thương hiệu: hiển thị cơ bản trong danh mục và tìm kiếm',
                'Hỗ trợ & Phí: hỗ trợ email/chat, thời gian phản hồi tiêu chuẩn. Hoa hồng ~7%'
            ],
            prices: [
                { label: '1 tháng', value: '200,000 VND' },
                { label: '3 tháng', value: '540,000 VND' },
                { label: '6 tháng', value: '900,000 VND' }
            ]
        },
        {
            id: 'pro',
            name: 'Pro Package',
            tagline: 'Dành cho cửa hàng nhỏ',
            icon: '🌟',
            featured: true,
            benefits: [
                'Quản lý & Sản phẩm: tối đa 30 sản phẩm, 7 ảnh/sản phẩm',
                'Hiển thị & Thương hiệu: ưu tiên trong danh mục (xếp hạng cao hơn Standard)',
                'Hỗ trợ & Phí: phản hồi nhanh hơn (email/chat, hotline giờ hành chính). Hoa hồng ~5%'
            ],
            prices: [
                { label: '1 tháng', value: '400,000 VND' },
                { label: '3 tháng', value: '1,080,000 VND' },
                { label: '6 tháng', value: '1,800,000 VND' }
            ]
        },
        {
            id: 'vip',
            name: 'VIP Package',
            tagline: 'Cho doanh nghiệp',
            icon: '🏆',
            featured: false,
            benefits: [
                'Quản lý & Sản phẩm: tối đa 100 sản phẩm, 10 ảnh/sản phẩm; duyệt ưu tiên khi đăng mới',
                'Hiển thị & Thương hiệu: ưu tiên cao trong kết quả tìm kiếm tổng; hiển thị logo thương hiệu',
                'Hỗ trợ & Phí: hỗ trợ ưu tiên 24/7, phản hồi nhanh nhất. Hoa hồng ~3%'
            ],
            prices: [
                { label: '1 tháng', value: '1,200,000 VND' },
                { label: '3 tháng', value: '3,240,000 VND' },
                { label: '6 tháng', value: '5,400,000 VND' }
            ]
        }
    ];

    // 🟢 Khi click: mở modal ngay, sau đó cuộn xuống section
    const handleUpgrade = () => {
        // ✅ Hiển thị modal tức thì
        if (requireAuth) setShowAuthModal(true);
        else setShowUpgradeModal(true);

        // 📜 Sau đó mới cuộn xuống UpgradeSection (modal vẫn ở giữa viewport)
        const sectionEl = sectionRef.current;
        if (sectionEl) {
            setTimeout(() => {
                sectionEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
        }
    };

    const handleConfirmUpgrade = () => {
        navigate('/profile?tab=upgrade');
    };

    const handleCloseModal = () => {
        setShowUpgradeModal(false);
    };

    const handleGoLogin = () => {
        setShowAuthModal(false);
        navigate('/signin');
    };

    const handleGoRegister = () => {
        setShowAuthModal(false);
        navigate('/signup');
    };

    return (
        <section id="upgrade-section" className="upgrade-section" ref={sectionRef}>
            <div className="upgrade-container">
                <div className="upgrade-header">
                    <h2 className="upgrade-title">Nâng cấp tài khoản của bạn</h2>
                    <p className="upgrade-subtitle">
                        Từ người mua hàng thành người bán hàng chuyên nghiệp
                    </p>
                </div>

                <div className="packages-grid">
                    {packages.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`package-card ${pkg.featured ? 'featured' : ''}`}
                            onClick={handleUpgrade}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUpgrade(); }}
                        >
                            {pkg.featured && (
                                <div className="featured-badge">
                                    <span>KHUYẾN MÃI</span>
                                </div>
                            )}

                            <div className="package-header">
                                <div className="package-icon">{pkg.icon}</div>
                                <h3 className="package-name">{pkg.name}</h3>
                                {pkg.tagline && <div className="package-tagline">{pkg.tagline}</div>}
                            </div>

                            <div className="package-divider">
                                <svg viewBox="0 0 200 20" className="wave-divider">
                                    <path d="M0,10 Q50,0 100,10 T200,10 L200,20 L0,20 Z" fill="white" />
                                </svg>
                            </div>

                            <div className="package-content">
                                <ul className="features-list">
                                    {pkg.benefits.map((benefit, index) => (
                                        <li key={index} className="feature-item">
                                            <span className="feature-text">{benefit}</span>
                                            <span className="check-icon">✓</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="package-prices">
                                    {pkg.prices.map((p, idx) => (
                                        <div
                                            key={idx}
                                            className="price-tier"
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                border: '1px dashed #d1d5db',
                                                borderRadius: 10,
                                                marginBottom: 8
                                            }}
                                        >
                                            <span style={{ fontWeight: 700 }}>{p.label}</span>
                                            <span style={{ fontWeight: 800, color: '#065f46' }}>{p.value}</span>
                                        </div>
                                    ))}
                                </div>

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
                anchorRef={sectionRef}
            />

            {/* Modal đăng nhập khi chưa có tài khoản */}
            <NotificationModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onLogin={handleGoLogin}
                onRegister={handleGoRegister}
                notificationType="login"
            />
        </section>
    );
}
