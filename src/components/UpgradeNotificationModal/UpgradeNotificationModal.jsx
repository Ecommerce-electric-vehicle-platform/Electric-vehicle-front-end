import React, { useEffect, useRef } from 'react';
import { X, Crown, ArrowRight } from 'lucide-react';
import './UpgradeNotificationModal.css';

export function UpgradeNotificationModal({ isOpen, onClose, onUpgrade, featureName }) {
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

    const handleUpgrade = () => {
        onUpgrade();
        onClose();
    };

    const handleOverlayClick = () => {
        // Ngăn chặn mọi scroll event trong thời gian ngắn
        const preventScroll = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        document.addEventListener('scroll', preventScroll, { passive: false });
        setTimeout(() => {
            document.removeEventListener('scroll', preventScroll);
        }, 100);
        onClose();
    };

    return (
        <div className="upgrade-modal-overlay" onClick={handleOverlayClick}>
            <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="upgrade-modal-close" onClick={handleOverlayClick}>
                    <X size={20} />
                </button>

                {/* Modal Content */}
                <div className="upgrade-modal-content">
                    {/* Icon */}
                    <div className="upgrade-modal-icon">
                        <Crown className="crown-icon" />
                    </div>

                    {/* Title */}
                    <h2 className="upgrade-modal-title">
                        Nâng cấp tài khoản Người bán
                    </h2>

                    {/* Message */}
                    <p className="upgrade-modal-message">
                        Bạn cần nâng cấp lên tài khoản <strong>Người bán</strong> để sử dụng tính năng
                        <span className="feature-highlight"> "{featureName}"</span>.
                    </p>

                    <p className="upgrade-modal-submessage">
                        Vui lòng truy cập trang cá nhân để nâng cấp tài khoản của bạn.
                    </p>

                    {/* Action Buttons */}
                    <div className="upgrade-modal-actions">
                        <button
                            className="upgrade-btn-secondary"
                            onClick={handleOverlayClick}
                        >
                            Hủy
                        </button>
                        <button
                            className="upgrade-btn-primary"
                            onClick={handleUpgrade}
                        >
                            <span>Nâng cấp ngay</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
