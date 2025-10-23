import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, DollarSign, Users, TrendingUp, ArrowRight } from 'lucide-react';
import './UpgradeConfirmationModal.css';

export function UpgradeConfirmationModal({ isOpen, onClose, onConfirm, isGuest = false }) {
    const scrollRef = useRef(0); // Lưu vị trí cuộn trước khi mở modal

    useEffect(() => {
        if (!isOpen) return;

        // 👉 Lưu vị trí scroll hiện tại
        scrollRef.current = window.scrollY;

        const prevOverflow = document.body.style.overflow;
        const prevPaddingRight = document.body.style.paddingRight;
        const prevPosition = document.body.style.position;
        const prevTop = document.body.style.top;
        const prevWidth = document.body.style.width;

        // Tính toán chiều rộng thanh cuộn để tránh xê dịch layout
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        // Khóa scroll nền
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollRef.current}px`;
        document.body.style.width = '100%';

        return () => {
            // Khôi phục trạng thái trước đó
            document.body.style.overflow = prevOverflow;
            document.body.style.paddingRight = prevPaddingRight;
            document.body.style.position = prevPosition;
            document.body.style.top = prevTop;
            document.body.style.width = prevWidth;

            // ✅ Đặt lại vị trí scroll chính xác sau khi modal đóng
            // Sử dụng multiple attempts để đảm bảo scroll position được khôi phục
            const restoreScroll = () => {
                // Sử dụng behavior: 'instant' để tránh animation
                window.scrollTo({
                    top: scrollRef.current,
                    left: 0,
                    behavior: 'instant'
                });
            };

            // Thực hiện ngay lập tức
            restoreScroll();

            // Thực hiện lại sau khi DOM được cập nhật
            setTimeout(restoreScroll, 0);
            setTimeout(restoreScroll, 10);
            setTimeout(restoreScroll, 50);

            // Thêm một lần nữa sau khi tất cả các effect khác đã chạy
            requestAnimationFrame(() => {
                restoreScroll();
            });
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm?.();
        // Đặt flag để báo hiệu modal đang đóng
        sessionStorage.setItem('fromUpgradeModal', 'true');
        onClose?.();
    };

    const handleCompare = () => {
        // Đặt flag để báo hiệu modal đang đóng
        sessionStorage.setItem('fromUpgradeModal', 'true');
        onClose?.();
        window.location.href = '/compare-plans';
    };

    const portalTarget = document.getElementById('modal-root') || document.body;

    const handleOverlayClick = () => {
        // Đặt flag để báo hiệu modal đang đóng
        sessionStorage.setItem('fromUpgradeModal', 'true');
        // Ngăn chặn mọi scroll event trong thời gian ngắn
        const preventScroll = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        document.addEventListener('scroll', preventScroll, { passive: false });
        setTimeout(() => {
            document.removeEventListener('scroll', preventScroll);
        }, 100);
        onClose?.();
    };

    return createPortal(
        <div className="upgrade-confirmation-overlay" onClick={handleOverlayClick}>
            <div
                className="upgrade-confirmation-modal"
                onClick={(e) => e.stopPropagation()}
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
                        <h2 className="upgrade-confirmation-title">
                            {isGuest ? 'Đăng nhập để trở thành Người bán' : 'Trở thành Người bán'}
                        </h2>
                        <button className="upgrade-confirmation-close" onClick={handleOverlayClick}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="upgrade-confirmation-content">
                    <div className="main-message">
                        <h3 className="message-title">
                            {isGuest ? 'Tạo tài khoản để bắt đầu bán hàng' : 'Đăng bán chỉ trong vài bước'}
                        </h3>
                        <p className="message-description">
                            {isGuest
                                ? 'Đăng ký miễn phí để có tài khoản và trở thành người bán chuyên nghiệp'
                                : 'Ưu tiên hiển thị • Tăng uy tín • Tiếp cận khách sẵn nhu cầu'
                            }
                        </p>
                    </div>

                    <div className="benefits-grid">
                        {isGuest ? (
                            <>
                                <div className="benefit-item">
                                    <div className="benefit-icon">
                                        <Users className="icon" />
                                    </div>
                                    <div className="benefit-content">
                                        <h5>Tạo tài khoản miễn phí</h5>
                                        <p>Đăng ký nhanh chóng và dễ dàng</p>
                                    </div>
                                </div>

                                <div className="benefit-item">
                                    <div className="benefit-icon">
                                        <DollarSign className="icon" />
                                    </div>
                                    <div className="benefit-content">
                                        <h5>Trở thành người bán</h5>
                                        <p>Nâng cấp để đăng bán sản phẩm</p>
                                    </div>
                                </div>

                                <div className="benefit-item">
                                    <div className="benefit-icon">
                                        <TrendingUp className="icon" />
                                    </div>
                                    <div className="benefit-content">
                                        <h5>Kiếm thu nhập</h5>
                                        <p>Bán hàng và tạo nguồn thu</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="benefit-item">
                                    <div className="benefit-icon">
                                        <DollarSign className="icon" />
                                    </div>
                                    <div className="benefit-content">
                                        <h5>Đăng bán ngay</h5>
                                        <p>Nhanh chóng tiếp cận khách hàng</p>
                                    </div>
                                </div>

                                <div className="benefit-item">
                                    <div className="benefit-icon">
                                        <Users className="icon" />
                                    </div>
                                    <div className="benefit-content">
                                        <h5>Ưu tiên hiển thị</h5>
                                        <p>Tăng lượt xem & liên hệ</p>
                                    </div>
                                </div>

                                <div className="benefit-item">
                                    <div className="benefit-icon">
                                        <TrendingUp className="icon" />
                                    </div>
                                    <div className="benefit-content">
                                        <h5>Uy tín cửa hàng</h5>
                                        <p>Gắn nhãn người bán</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="upgrade-confirmation-actions">
                        <button
                            className="upgrade-confirmation-btn-primary"
                            onClick={handleConfirm}
                        >
                            <span>{isGuest ? 'Đăng nhập / Đăng ký' : 'Nâng cấp ngay'}</span>
                            <ArrowRight size={16} />
                        </button>
                        {!isGuest && (
                            <button
                                className="upgrade-confirmation-btn-secondary"
                                onClick={handleCompare}
                            >
                                So sánh gói
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        portalTarget
    );
}
