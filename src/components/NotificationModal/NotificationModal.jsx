import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User } from "lucide-react";
import "./NotificationModal.css";

export function NotificationModal({ isOpen, onClose, onLogin, onRegister, notificationType = 'login' }) {
    // Xử lý phím ESC để đóng modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                console.log('Escape key pressed - closing modal');
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        // Chỉ đóng modal khi click vào overlay (không phải vào modal content)
        if (e.target === e.currentTarget) {
            console.log('Overlay clicked - closing modal');
            onClose();
        }
    };

    const handleCloseClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Close button clicked');
        if (onClose) {
            onClose();
        } else {
            console.error('onClose function is not provided');
        }
    };

    return createPortal(
        <div className="notification-modal-overlay" onClick={handleOverlayClick}>
            <div className="notification-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    className="notification-modal-close"
                    onClick={handleCloseClick}
                    type="button"
                >
                    <X size={20} />
                </button>

                {/* Modal Content */}
                <div className="notification-modal-content">
                    {/* Title */}
                    <h2 className="notification-modal-title">GreenTrade</h2>

                    {/* Character Icon */}
                    <div className="notification-modal-icon">
                        <div className="character-icon">
                            <User size={48} />
                            <div className="character-badge">5</div>
                        </div>
                    </div>

                    {/* Message */}
                    <p className="notification-modal-message">
                        {notificationType === 'login'
                            ? "Vui lòng đăng nhập tài khoản GreenTrade để xem ưu đãi đặc biệt cho xe điện và pin, đồng thời thanh toán dễ dàng hơn."
                            : "Chỉ người dùng đã mua sản phẩm này mới có thể để lại đánh giá. Đây là chính sách để đảm bảo tính xác thực của đánh giá."
                        }
                    </p>

                    {/* Action Buttons */}
                    <div className="notification-modal-actions">
                        {notificationType === 'login' ? (
                            <>
                                <button
                                    className="notification-btn register-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onRegister();
                                    }}
                                    type="button"
                                >
                                    Đăng ký
                                </button>
                                <button
                                    className="notification-btn login-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onLogin();
                                    }}
                                    type="button"
                                >
                                    Đăng nhập
                                </button>
                            </>
                        ) : (
                            <button
                                className="notification-btn login-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onClose();
                                }}
                                type="button"
                                style={{ width: '100%' }}
                            >
                                Đóng
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
