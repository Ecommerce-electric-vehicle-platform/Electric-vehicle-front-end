import React, { useEffect, useRef } from 'react';
import './UpgradeSection.css';

export function UpgradeSection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        // Thêm hiệu ứng highlight khi section được cuộn đến
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
        if (currentSection) {
            observer.observe(currentSection);
        }

        return () => {
            if (currentSection) {
                observer.unobserve(currentSection);
            }
        };
    }, []);

    const packages = [
        {
            id: 'basic',
            name: 'GÓI CƠ BẢN',
            price: '299,000₫',
            duration: '1 tháng',
            features: [
                'Đăng bán tối đa 5 sản phẩm',
                'Hiển thị thông tin liên hệ',
                'Tạo cửa hàng cá nhân',
                'Nhận đánh giá từ khách hàng',
                'Hỗ trợ cơ bản 24/7'
            ],
            icon: '⭐'
        },
        {
            id: 'premium',
            name: 'GÓI PREMIUM',
            price: '799,000₫',
            duration: '6 tháng',
            features: [
                'Đăng bán không giới hạn sản phẩm',
                'Ưu tiên hiển thị trong tìm kiếm',
                'Thống kê bán hàng chi tiết',
                'Quảng cáo miễn phí 1 tuần',
                'Hỗ trợ ưu tiên và tư vấn chuyên sâu'
            ],
            icon: '⭐',
            featured: true
        },
        {
            id: 'enterprise',
            name: 'GÓI DOANH NGHIỆP',
            price: '1,999,000₫',
            duration: '1 năm',
            features: [
                'Toàn quyền của gói Premium',
                'Quản lý nhiều cửa hàng',
                'Tích hợp hệ thống thanh toán',
                'API và công cụ quản lý nâng cao',
                'Hỗ trợ chuyên nghiệp 1-1'
            ],
            icon: '⭐'
        }
    ];

    const handleUpgrade = (packageId) => {
        // Xử lý logic nâng cấp
        console.log(`Nâng cấp lên gói: ${packageId}`);
        // Có thể chuyển hướng đến trang thanh toán hoặc hiển thị modal
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
                        >
                            {pkg.featured && (
                                <div className="featured-badge">
                                    <span>KHUYẾN MÃI</span>
                                </div>
                            )}

                            <div className="package-header">
                                <div className="package-icon">{pkg.icon}</div>
                                <h3 className="package-name">{pkg.name}</h3>
                                <div className="package-price">
                                    <span className="price">{pkg.price}</span>
                                    <span className="duration">cho {pkg.duration}</span>
                                </div>
                            </div>

                            <div className="package-divider">
                                <svg viewBox="0 0 200 20" className="wave-divider">
                                    <path d="M0,10 Q50,0 100,10 T200,10 L200,20 L0,20 Z" fill="white" />
                                </svg>
                            </div>

                            <div className="package-content">
                                <ul className="features-list">
                                    {pkg.features.map((feature, index) => (
                                        <li key={index} className="feature-item">
                                            <span className="feature-text">{feature}</span>
                                            <span className="check-icon">✓</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className="upgrade-button"
                                    onClick={() => handleUpgrade(pkg.id)}
                                >
                                    <span className="button-icon">💳</span>
                                    <span className="button-text">Nâng cấp ngay</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
