import React from 'react';
import { X, Crown, ArrowRight } from 'lucide-react';
import './UpgradeNotificationModal.css';

export function UpgradeNotificationModal({ isOpen, onClose, onUpgrade, featureName }) {
    if (!isOpen) return null;

    const handleUpgrade = () => {
        onUpgrade();
        onClose();
    };

    return (
        <div className="upgrade-modal-overlay" onClick={onClose}>
            <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="upgrade-modal-close" onClick={onClose}>
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
                            onClick={onClose}
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
