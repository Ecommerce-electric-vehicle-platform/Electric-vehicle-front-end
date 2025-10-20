import React from 'react';
import { MapPin, Eye, Heart, Clock, Star, Shield } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import './ProductCard.css';

export function ProductCard({
    product,
    variant = 'default', // 'default', 'compact', 'featured'
    onViewDetails,
    onToggleFavorite,
    isFavorite = false,
    showActions = true,
    showCondition = true,
    showLocation = true,
    showDate = true,
    showVerified = true
}) {
    if (!product) return null;

    const handleViewDetails = () => {
        if (onViewDetails) onViewDetails(product);
    };

    const handleToggleFavorite = (e) => {
        e.stopPropagation();
        if (onToggleFavorite) onToggleFavorite(product);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getConditionColor = (condition) => {
        const conditionMap = {
            'Xuất sắc': '#10b981',
            'Rất tốt': '#3b82f6',
            'Tốt': '#f59e0b',
            'Khá tốt': '#8b5cf6',
            'Trung bình': '#6b7280'
        };
        return conditionMap[condition] || '#6b7280';
    };

    return (
        <div
            className={`product-card product-card--${variant}`}
            onClick={handleViewDetails}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleViewDetails();
                }
            }}
        >
            {/* Image Container */}
            <div className="product-card__image-container">
                <img
                    src={product.image || '/placeholder.svg'}
                    alt={product.title}
                    className="product-card__image"
                    loading="lazy"
                />

                {/* Badges */}
                <div className="product-card__badges">
                    {product.verified && showVerified && (
                        <div className="product-card__badge product-card__badge--verified">
                            <Shield size={12} />
                            <span>Đã xác minh</span>
                        </div>
                    )}
                    {product.condition && showCondition && (
                        <div
                            className="product-card__badge product-card__badge--condition"
                            style={{ backgroundColor: getConditionColor(product.condition) }}
                        >
                            {product.condition}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {showActions && (
                    <div className="product-card__actions">
                        <button
                            className="product-card__action product-card__action--favorite"
                            onClick={handleToggleFavorite}
                            aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
                        >
                            <Heart
                                size={16}
                                fill={isFavorite ? '#ef4444' : 'none'}
                                color={isFavorite ? '#ef4444' : '#6b7280'}
                            />
                        </button>
                        <button
                            className="product-card__action product-card__action--view"
                            onClick={handleViewDetails}
                            aria-label="Xem chi tiết"
                        >
                            <Eye size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="product-card__content">
                {/* Header */}
                <div className="product-card__header">
                    <h3 className="product-card__title" title={product.title}>
                        {product.title}
                    </h3>
                    <p className="product-card__brand">
                        {product.brand && product.model
                            ? `${product.brand} - ${product.model}`
                            : product.brand || product.model || 'Không xác định'
                        }
                    </p>
                </div>

                {/* Price */}
                <div className="product-card__price">
                    <span className="product-card__price-current">
                        {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                        <span className="product-card__price-original">
                            {formatCurrency(product.originalPrice)}
                        </span>
                    )}
                </div>

                {/* Details */}
                <div className="product-card__details">
                    {product.locationTrading && showLocation && (
                        <div className="product-card__detail">
                            <MapPin size={14} />
                            <span>{product.locationTrading}</span>
                        </div>
                    )}

                    {product.createdAt && showDate && (
                        <div className="product-card__detail">
                            <Clock size={14} />
                            <span>{formatDate(product.createdAt)}</span>
                        </div>
                    )}
                </div>

                {/* Additional Info */}
                {(product.manufactureYear || product.usedDuration) && (
                    <div className="product-card__additional">
                        {product.manufactureYear && (
                            <div className="product-card__info-item">
                                <span className="product-card__info-label">Năm SX:</span>
                                <span className="product-card__info-value">{product.manufactureYear}</span>
                            </div>
                        )}
                        {product.usedDuration && (
                            <div className="product-card__info-item">
                                <span className="product-card__info-label">Đã sử dụng:</span>
                                <span className="product-card__info-value">{product.usedDuration}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Button */}
                <button
                    className="product-card__button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails();
                    }}
                >
                    <Eye size={16} />
                    <span>Xem chi tiết</span>
                </button>
            </div>
        </div>
    );
}

export default ProductCard;
