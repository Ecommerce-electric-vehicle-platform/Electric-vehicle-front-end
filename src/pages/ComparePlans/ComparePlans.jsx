import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { UpgradeNotificationModal } from '../../components/UpgradeNotificationModal/UpgradeNotificationModal';
import './ComparePlans.css';

export function ComparePlans() {
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('semi'); // 'semi' | 'year'
    const [userRole, setUserRole] = useState('guest'); // buyer | seller | guest
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeFeatureName, setUpgradeFeatureName] = useState('');

    // Kiểm tra role của user
    useEffect(() => {
        const checkUserRole = () => {
            const authType = localStorage.getItem('authType');
            // Nếu là admin, không hiển thị user info
            if (authType === 'admin') {
                setUserRole('guest');
                return;
            }
            const role = localStorage.getItem('userRole') || 'guest';
            setUserRole(role);
        };
        
        checkUserRole();
        
        // Lắng nghe sự kiện storage để cập nhật role khi user đăng nhập/đăng xuất
        const handleStorageChange = (e) => {
            if (e.key === 'userRole' || e.key === 'authType' || e.key === 'token') {
                checkUserRole();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Lắng nghe custom event khi user đăng nhập/đăng xuất trong cùng tab
        const handleAuthChange = () => {
            checkUserRole();
        };
        
        window.addEventListener('authStateChanged', handleAuthChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authStateChanged', handleAuthChange);
        };
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        requestAnimationFrame(() => el.classList.add('enter'));
        document.body.classList.add('no-footer');
        
        return () => {
            document.body.classList.remove('no-footer');
        };
    }, []);

    const plans = [
        {
            id: 'standard',
            name: 'Tiêu chuẩn',
            price: '30 ngày dùng thử',
            badge: 'Cá nhân',
            tiers: [
                { label: '200.000 VND / 1 tháng' },
                { label: '540.000 VND / 3 tháng' },
                { label: '900.000 VND / 6 tháng' }
            ]
        },
        {
            id: 'pro',
            name: 'Chuyên nghiệp',
            price: billingCycle === 'year' ? 'Ưu tiên hiển thị 12 tháng' : 'Hiển thị ưu tiên',
            badge: 'Khuyến nghị',
            highlight: true,
            tiers: [
                { label: '400.000 VND / 1 tháng' },
                { label: '1.080.000 VND / 3 tháng' },
                { label: '1.800.000 VND / 6 tháng' }
            ]
        },
        {
            id: 'vip',
            name: 'VIP',
            price: 'Doanh nghiệp',
            badge: 'Nâng cao',
            tiers: [
                { label: '1.200.000 VND / 1 tháng' },
                { label: '3.240.000 VND / 3 tháng' },
                { label: '5.400.000 VND / 6 tháng' }
            ]
        }
    ];

    const featureRows = [
        {
            title: 'Quản lý & Sản phẩm',
            standard: 'Tối đa 10 sản phẩm, 5 ảnh/sản phẩm',
            pro: 'Tối đa 30 sản phẩm, 7 ảnh/sản phẩm',
            vip: 'Tối đa 100 sản phẩm, 10 ảnh/sản phẩm; duyệt ưu tiên'
        },
        {
            title: 'Hiển thị & Thương hiệu',
            standard: 'Hiển thị cơ bản trong danh mục và tìm kiếm',
            pro: 'Ưu tiên hiển thị trong danh mục (xếp hạng cao hơn Standard)',
            vip: 'Ưu tiên cao trong tìm kiếm; hiển thị logo thương hiệu'
        },
        {
            title: 'Hỗ trợ & Phí',
            standard: 'Email/chat, phản hồi tiêu chuẩn; hoa hồng ~7%',
            pro: 'Phản hồi nhanh; email/chat hoặc hotline giờ hành chính; ~5%',
            vip: 'Hỗ trợ 24/7 ưu tiên, phản hồi nhanh nhất; ~3%'
        }
    ];

    const faqs = [
        {
            q: 'Khác nhau giữa các gói Standard / Pro / VIP là gì?',
            a: 'Standard: tối đa 10 sản phẩm, hiển thị cơ bản. Pro: tối đa 30 sản phẩm, ưu tiên hiển thị trong danh mục. VIP: tối đa 100 sản phẩm, ưu tiên tìm kiếm cao và hiển thị logo thương hiệu.'
        },
        {
            q: 'Chu kỳ thanh toán và cách tính giá ra sao?',
            a: 'Hỗ trợ thanh toán theo 1/3/6 tháng (xem mức giá trong từng gói). Một số gói có tuỳ chọn ưu tiên hiển thị 12 tháng. Thanh toán qua thẻ quốc tế hoặc chuyển khoản, có thể bật/tắt gia hạn tự động trong Cài đặt.'
        },
        {
            q: 'Dùng thử 30 ngày hoạt động thế nào?',
            a: 'Gói Tiêu chuẩn có 30 ngày dùng thử miễn phí. Hết thời gian dùng thử, bạn có thể tiếp tục với mức phí tương ứng hoặc nâng cấp lên Pro/VIP để có ưu tiên hiển thị.'
        },
        {
            q: 'Tôi có thể nâng/giảm gói đang dùng không?',
            a: 'Có. Bạn có thể chuyển gói bất cứ lúc nào. Phí sẽ được tính theo phần thời gian còn lại (pro‑rate) và xử lý trong vòng 24 giờ.'
        },
        {
            q: 'Hủy gia hạn và chính sách hoàn tiền như thế nào?',
            a: 'Bạn có thể tắt gia hạn tự động bất cứ lúc nào. Hoàn tiền trong 7 ngày nếu lỗi hệ thống khiến bạn không thể sử dụng dịch vụ; các trường hợp khác vui lòng liên hệ hỗ trợ để được xem xét.'
        },
        {
            q: 'Tôi có thể xuất hoá đơn VAT không?',
            a: 'Có. Hỗ trợ xuất hoá đơn VAT theo yêu cầu cho gói Pro/VIP. Vui lòng cung cấp đầy đủ thông tin doanh nghiệp khi thanh toán.'
        },
        {
            q: 'Ưu tiên hiển thị hoạt động ra sao?',
            a: 'Pro được xếp hạng cao hơn Standard trong danh mục; VIP có thứ hạng tìm kiếm cao và hiển thị logo. Ưu tiên giúp tăng khả năng tiếp cận nhưng không đảm bảo vị trí cố định.'
        },
        {
            q: 'Kênh hỗ trợ cho từng gói?',
            a: 'Standard: email/chat, phản hồi tiêu chuẩn. Pro: email/chat hoặc hotline giờ hành chính, phản hồi nhanh. VIP: hỗ trợ 24/7 ưu tiên.'
        }
    ];

    const handleChoose = (id) => {
        const currentRole = userRole;
        console.log(`handleChoose called for plan "${id}". Current role: ${currentRole}`);
        
        // Lấy tên gói để hiển thị trong modal
        const planName = plans.find(p => p.id === id)?.name || 'gói này';
        
        // Buyer or guest → show upgrade modal
        if (currentRole === 'buyer' || currentRole === 'guest') {
            setUpgradeFeatureName(`Chọn ${planName}`);
            setShowUpgradeModal(true);
        }
        // Seller → navigate directly
        else if (currentRole === 'seller') {
            navigate(`/seller?plan=${id}`);
        }
    };

    const handleUpgrade = () => {
        navigate('/profile?tab=upgrade');
        setShowUpgradeModal(false);
        setUpgradeFeatureName('');
    };

    const handleCloseUpgradeModal = () => {
        setShowUpgradeModal(false);
        setUpgradeFeatureName('');
    };

    const content = (
        <section className="cp-section" ref={containerRef} aria-labelledby="cp-title">
            <div className="cp-hero">
                <h1 id="cp-title" className="cp-title">Chọn gói phù hợp và bắt đầu bán ngay</h1>
                <p className="cp-sub">Bảng giá hiện đại, rõ ràng — tối ưu hiển thị cho quyết định nhanh. Nâng tầm thương hiệu và tiếp cận nhiều khách hàng hơn.</p>
                <div className="cp-switch">
                    <button className={`cp-switch-btn ${billingCycle === 'semi' ? 'active' : ''}`} onClick={() => setBillingCycle('semi')}>6 tháng</button>
                    <button className={`cp-switch-btn ${billingCycle === 'year' ? 'active' : ''}`} onClick={() => setBillingCycle('year')}>12 tháng <span className="save-tag">Tiết kiệm 12%</span></button>
                </div>
                <div className="cp-trust">
                    <span className="trust-item">Thanh toán an toàn</span>
                    <span className="trust-dot" />
                    <span className="trust-item">Hủy bất cứ lúc nào</span>
                    <span className="trust-dot" />
                    <span className="trust-item">Hỗ trợ 24/7</span>
                </div>
            </div>

            <div className="cp-table-wrap" role="region" aria-label="So sánh gói">
                <div className="cp-table" role="table">
                    <div className="cp-head" role="row">
                        <div className="cp-cell feature-col" />
                        {plans.map(p => (
                            <div className={`cp-cell plan-col plan-${p.id} ${p.highlight ? 'is-hot' : ''}`} key={p.id} role="columnheader" aria-label={p.name}>
                                <div className="plan-head">
                                    <span className="plan-badge">{p.badge}</span>
                                    <h3 className="plan-name">{p.name}</h3>
                                    <div className="plan-price">{p.price}</div>
                                    <div className="plan-tiers">
                                        {p.tiers.map((t, i) => (
                                            <div className="plan-tier" key={p.id + 't' + i}>{t.label}</div>
                                        ))}
                                    </div>
                                    {p.highlight && <div className="plan-suggest">Phổ biến nhất</div>}
                                    <button className="plan-cta" onClick={() => handleChoose(p.id)}>Chọn gói này</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {featureRows.map((row, idx) => (
                        <div className="cp-row" key={row.title} role="row" style={{ animationDelay: `${0.05 * (idx + 1)}s` }}>
                            <div className="cp-cell feature-col" role="rowheader">
                                <span className="feature-name">{row.title}</span>
                            </div>
                            <div className="cp-cell plan-col plan-standard" role="cell"><div className="feature-value with-icon icon-manage">{row.standard}</div></div>
                            <div className="cp-cell plan-col plan-pro is-hot" role="cell"><div className="feature-value with-icon icon-visibility">{row.pro}</div></div>
                            <div className="cp-cell plan-col plan-vip" role="cell"><div className="feature-value with-icon icon-support">{row.vip}</div></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="cp-trust-policies">
                <div className="cp-policy"><span className="cp-dot" /> Thanh toán bảo mật SSL</div>
                <div className="cp-policy"><span className="cp-dot" /> Xuất hoá đơn VAT theo yêu cầu</div>
                <div className="cp-policy"><span className="cp-dot" /> Hỗ trợ chuyển đổi gói trong 24h</div>
            </div>

            <section className="cp-faqs" aria-labelledby="faq-title">
                <h3 id="faq-title" className="cp-faq-title">Các câu hỏi thường gặp</h3>
                <div className="cp-faq-list">
                    {faqs.map((item, i) => (
                        <details key={i} className="cp-faq-card" open={i === 0}>
                            <summary>
                                <span className="faq-q">{item.q}</span>
                                <span className="faq-chevron" aria-hidden>›</span>
                            </summary>
                            <div className="faq-a">{item.a}</div>
                        </details>
                    ))}
                </div>
            </section>

            <div className="cp-secondary-cta">
                <button className="plan-cta" onClick={() => window.location.href = '/contact'}>Liên hệ tư vấn</button>
                <a className="cp-legal" href="/terms" target="_self" rel="noopener">Điều khoản & Chính sách</a>
            </div>

            <div className="cp-note">Giá có thể thay đổi tuỳ chương trình ưu đãi. Bạn có thể nâng cấp bất cứ lúc nào.</div>
        </section>
    );
    
    // Render modal using Portal to ensure it appears on top
    return (
        <>
            {content}
            {showUpgradeModal && createPortal(
                <UpgradeNotificationModal
                    isOpen={showUpgradeModal}
                    onClose={handleCloseUpgradeModal}
                    onUpgrade={handleUpgrade}
                    featureName={upgradeFeatureName}
                />,
                document.body
            )}
        </>
    );
}

export default ComparePlans;


