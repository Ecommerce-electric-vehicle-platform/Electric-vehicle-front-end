import React from 'react';
import { X, Crown, Star, DollarSign, Users, TrendingUp, ArrowRight } from 'lucide-react';
import './UpgradeConfirmationModal.css';

export function UpgradeConfirmationModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="upgrade-confirmation-overlay" onClick={onClose}>
            <div className="upgrade-confirmation-modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="upgrade-confirmation-header">
                    <div className="upgrade-confirmation-header-content">
                        <div className="header-icon">
                            <Crown className="crown-icon" />
                        </div>
                        <h2 className="upgrade-confirmation-title">
                            Trở thành Người bán
                        </h2>
                        <button className="upgrade-confirmation-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="upgrade-confirmation-content">
                    {/* Main Message */}
                    <div className="main-message">
                        <h3 className="message-title">
                            🎉 Chào mừng bạn đến với cộng đồng Người bán!
                        </h3>
                        <p className="message-description">
                            Bạn có muốn mở rộng kinh doanh và kiếm thêm thu nhập bằng cách trở thành Người bán trên nền tảng GreenTrade không?
                        </p>
                    </div>

                    {/* Benefits Section */}
                    <div className="benefits-section">
                        <h4 className="benefits-title">✨ Lợi ích khi trở thành Người bán:</h4>
                        <div className="benefits-grid">
                            <div className="benefit-item">
                                <div className="benefit-icon">
                                    <DollarSign className="icon" />
                                </div>
                                <div className="benefit-content">
                                    <h5>Tăng thu nhập</h5>
                                    <p>Bán sản phẩm và kiếm lợi nhuận từ mỗi giao dịch</p>
                                </div>
                            </div>

                            <div className="benefit-item">
                                <div className="benefit-icon">
                                    <Users className="icon" />
                                </div>
                                <div className="benefit-content">
                                    <h5>Tiếp cận khách hàng</h5>
                                    <p>Kết nối với hàng nghìn khách hàng tiềm năng</p>
                                </div>
                            </div>

                            <div className="benefit-item">
                                <div className="benefit-icon">
                                    <TrendingUp className="icon" />
                                </div>
                                <div className="benefit-content">
                                    <h5>Mở rộng kinh doanh</h5>
                                    <p>Phát triển thương hiệu và mở rộng thị trường</p>
                                </div>
                            </div>

                            <div className="benefit-item">
                                <div className="benefit-icon">
                                    <Star className="icon" />
                                </div>
                                <div className="benefit-content">
                                    <h5>Hỗ trợ chuyên nghiệp</h5>
                                    <p>Được hỗ trợ tư vấn và công cụ quản lý hiện đại</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="cta-section">
                        <p className="cta-text">
                            <strong>Hãy bắt đầu hành trình kinh doanh của bạn ngay hôm nay!</strong>
                        </p>
                        <p className="cta-subtext">
                            Chỉ cần vài bước đơn giản để trở thành Người Bán Hàng chính thức.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="upgrade-confirmation-actions">
                        <button
                            className="upgrade-confirmation-btn-secondary"
                            onClick={onClose}
                        >
                            Để sau
                        </button>
                        <button
                            className="upgrade-confirmation-btn-primary"
                            onClick={handleConfirm}
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
