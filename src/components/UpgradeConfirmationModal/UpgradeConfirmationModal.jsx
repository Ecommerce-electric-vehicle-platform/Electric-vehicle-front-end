import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, DollarSign, Users, TrendingUp, ArrowRight } from 'lucide-react';
import './UpgradeConfirmationModal.css';

export function UpgradeConfirmationModal({ isOpen, onClose, onConfirm }) {
    // Khóa cuộn + bù thanh cuộn để không xê dịch layout
    useEffect(() => {
        if (!isOpen) return;

        const prevOverflow = document.body.style.overflow;
        const prevPaddingRight = document.body.style.paddingRight;

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.paddingRight = prevPaddingRight;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm?.();
        onClose?.();
    };

    const handleCompare = () => {
        onClose?.();
        window.location.href = '/compare-plans';
    };

    const portalTarget = document.getElementById('modal-root') || document.body;

    return createPortal(
        <div className="upgrade-confirmation-overlay" onClick={onClose}>
            <div
                className="upgrade-confirmation-modal"
                onClick={(e) => e.stopPropagation()}
                // Giữ cố định giữa màn hình ngay từ paint đầu tiên
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999
                }}
            >
                {/* Header */}
                <div className="upgrade-confirmation-header">
                    <div className="upgrade-confirmation-header-content">
                        <div className="header-icon">
                            <Crown className="crown-icon" />
                        </div>
                        <h2 className="upgrade-confirmation-title">Trở thành Người bán ngay</h2>
                        <button className="upgrade-confirmation-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="upgrade-confirmation-content">
                    <div className="main-message">
                        <h3 className="message-title">Mở bán sản phẩm của bạn ngay hôm nay</h3>
                        <p className="message-description">Đăng bán tức thì, ưu tiên hiển thị và tăng uy tín cửa hàng.</p>
                    </div>

                    <div className="benefits-section">
                        <h4 className="benefits-title">Lợi ích chính:</h4>
                        <div className="benefits-grid">
                            <div className="benefit-item">
                                <div className="benefit-icon"><DollarSign className="icon" /></div>
                                <div className="benefit-content">
                                    <h5>Đăng bán ngay</h5>
                                    <p>Tiếp cận khách có nhu cầu thực, chốt đơn nhanh</p>
                                </div>
                            </div>

                            <div className="benefit-item">
                                <div className="benefit-icon"><Users className="icon" /></div>
                                <div className="benefit-content">
                                    <h5>Ưu tiên hiển thị</h5>
                                    <p>Vị trí nổi bật giúp tăng lượt xem và liên hệ</p>
                                </div>
                            </div>

                            <div className="benefit-item">
                                <div className="benefit-icon"><TrendingUp className="icon" /></div>
                                <div className="benefit-content">
                                    <h5>Uy tín cửa hàng</h5>
                                    <p>Gắn nhãn người bán, tăng độ tin cậy khi giao dịch</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cta-section">
                        <p className="cta-text"><strong>Bắt đầu ngay — chỉ vài bước để trở thành Người bán.</strong></p>
                        <p className="cta-subtext">Bạn có thể nâng cấp lại bất cứ lúc nào trong trang cá nhân.</p>
                    </div>

                    <div className="upgrade-confirmation-actions">
                        <button className="upgrade-confirmation-btn-primary" onClick={handleConfirm}>
                            <span>Nâng cấp để đăng bán ngay</span>
                            <ArrowRight size={16} />
                        </button>
                        <button
                            className="upgrade-confirmation-btn-secondary"
                            onClick={handleCompare}
                            style={{ background: '#f9fafb', color: '#065f46', border: '1px dashed #10b981' }}
                        >
                            So sánh các gói
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        portalTarget
    );
}
