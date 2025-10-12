import React from 'react';
import { X, MapPin, Calendar, Clock, AlertTriangle, Star, DollarSign, FileText, Shield } from 'lucide-react';
import './ProductDetailModal.css';

export function ProductDetailModal({ product, isOpen, onClose }) {
    if (!isOpen || !product) return null;

    const formatCurrency = (value) => {
        return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return '#10B981'; // green
            case 'sold':
                return '#EF4444'; // red
            case 'pending':
                return '#F59E0B'; // yellow
            default:
                return '#6B7280'; // gray
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'available':
                return 'Có sẵn';
            case 'sold':
                return 'Đã bán';
            case 'pending':
                return 'Chờ xử lý';
            default:
                return 'Không xác định';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">Chi tiết sản phẩm</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="modal-body">
                    {/* Hình ảnh sản phẩm */}
                    <div className="product-image-section">
                        <img src={product.image} alt={product.title} className="product-detail-image" />
                        {product.discount && (
                            <div className="discount-badge-large">-{product.discount}%</div>
                        )}
                    </div>

                    {/* Thông tin cơ bản */}
                    <div className="product-basic-info">
                        <h3 className="product-detail-title">{product.title}</h3>
                        <div className="price-section">
                            <span className="product-detail-price">{formatCurrency(product.price)}</span>
                            {product.discount && (
                                <span className="original-price">
                                    {formatCurrency(product.price / (1 - product.discount / 100))}
                                </span>
                            )}
                        </div>
                        <div className="status-badge" style={{ backgroundColor: getStatusColor(product.status) }}>
                            {getStatusText(product.status)}
                        </div>
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="product-details-grid">
                        <div className="detail-item">
                            <Shield className="detail-icon" />
                            <div className="detail-content">
                                <span className="detail-label">Thương hiệu</span>
                                <span className="detail-value">{product.brand}</span>
                            </div>
                        </div>

                        <div className="detail-item">
                            <FileText className="detail-icon" />
                            <div className="detail-content">
                                <span className="detail-label">Model</span>
                                <span className="detail-value">{product.model}</span>
                            </div>
                        </div>

                        <div className="detail-item">
                            <Calendar className="detail-icon" />
                            <div className="detail-content">
                                <span className="detail-label">Năm sản xuất</span>
                                <span className="detail-value">{product.manufactureYear}</span>
                            </div>
                        </div>

                        <div className="detail-item">
                            <Clock className="detail-icon" />
                            <div className="detail-content">
                                <span className="detail-label">Thời gian sử dụng</span>
                                <span className="detail-value">{product.usedDuration}</span>
                            </div>
                        </div>

                        <div className="detail-item">
                            <Star className="detail-icon" />
                            <div className="detail-content">
                                <span className="detail-label">Tình trạng</span>
                                <span className="detail-value">{product.conditionLevel}</span>
                            </div>
                        </div>

                        <div className="detail-item">
                            <MapPin className="detail-icon" />
                            <div className="detail-content">
                                <span className="detail-label">Địa điểm giao dịch</span>
                                <span className="detail-value">{product.locationTrading}</span>
                            </div>
                        </div>

                        <div className="detail-item">
                            <Calendar className="detail-icon" />
                            <div className="detail-content">
                                <span className="detail-label">Ngày tạo</span>
                                <span className="detail-value">{formatDate(product.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mô tả sản phẩm */}
                    <div className="product-description">
                        <h4 className="description-title">Mô tả sản phẩm</h4>
                        <p className="description-text">{product.description}</p>
                    </div>

                    {/* Lý do từ chối (nếu có) */}
                    {product.rejectedReason && (
                        <div className="rejected-reason">
                            <AlertTriangle className="warning-icon" />
                            <div className="warning-content">
                                <h4 className="warning-title">Lý do từ chối</h4>
                                <p className="warning-text">{product.rejectedReason}</p>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={onClose}>
                            Đóng
                        </button>
                        {product.status === 'available' && (
                            <button className="btn-primary">
                                Liên hệ mua
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
