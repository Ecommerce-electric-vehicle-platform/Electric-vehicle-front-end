import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Heart,
    MapPin,
    Clock,
    Share2,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Phone,
    Star,
    User,
    Send,
    ArrowLeft,
    Home,
    ShoppingCart
} from 'lucide-react';
import { vehicleProducts, batteryProducts, formatCurrency, formatDate } from '../../data/productsData';
import { NotificationModal } from '../../components/NotificationModal/NotificationModal';
import './ProductDetail.css';
import { toggleFavorite, isFavorite } from '../../utils/favorites';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isGuest, setIsGuest] = useState(true);
    const [hasPurchased] = useState(false); // Giả sử chưa mua sản phẩm này
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [reviews, setReviews] = useState([]);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationType, setNotificationType] = useState('login'); // 'login' hoặc 'purchase'
    const [fav, setFav] = useState(false);

    // Xác định trạng thái đăng nhập
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsGuest(!token);
    }, []);

    // Tìm sản phẩm theo ID
    useEffect(() => {
        const allProducts = [...vehicleProducts, ...batteryProducts];
        const foundProduct = allProducts.find(p => p.id === parseInt(id));
        setProduct(foundProduct);
        if (foundProduct) setFav(isFavorite(foundProduct.id));
    }, [id]);

    // Xử lý chuyển ảnh
    const nextImage = () => {
        if (product && product.images) {
            setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
        }
    };

    const prevImage = () => {
        if (product && product.images) {
            setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
        }
    };

    // Xử lý gửi đánh giá
    const handleSubmitReview = () => {
        if (canReview && rating > 0 && review.trim()) {
            const newReview = {
                id: Date.now(),
                user: 'Bạn',
                rating: rating,
                content: review,
                time: 'Vừa xong'
            };
            setReviews([...reviews, newReview]);
            setReview('');
            setRating(0);
        }
    };

    // Xử lý click sao
    const handleStarClick = (starRating) => {
        if (canReview) {
            setRating(starRating);
        } else {
            handleRequireLogin();
        }
    };

    // Xử lý quay lại
    const handleGoBack = () => {
        navigate(-1); // Quay lại trang trước đó
    };

    // Xử lý về trang chủ
    const handleGoHome = () => {
        navigate('/');
    };

    // Kiểm tra quyền đánh giá
    const canReview = !isGuest && hasPurchased;

    // Xử lý mở modal thông báo
    const handleRequireLogin = () => {
        if (isGuest) {
            setNotificationType('login');
            document.body.classList.add('modal-open');
            setShowNotificationModal(true);
        } else if (!hasPurchased) {
            setNotificationType('purchase');
            document.body.classList.add('modal-open');
            setShowNotificationModal(true);
        }
    };

    // Xử lý đóng modal
    const handleCloseNotificationModal = () => {
        console.log('Closing notification modal');
        // Cho phép scroll lại khi modal đóng
        document.body.classList.remove('modal-open');
        setShowNotificationModal(false);
    };

    // Xử lý chuyển đến trang đăng nhập
    const handleGoToLogin = () => {
        document.body.classList.remove('modal-open');
        setShowNotificationModal(false);
        navigate('/signin');
    };

    // Xử lý chuyển đến trang đăng ký
    const handleGoToRegister = () => {
        document.body.classList.remove('modal-open');
        setShowNotificationModal(false);
        navigate('/signup');
    };

    if (!product) {
        return (
            <div className="product-detail-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin sản phẩm...</p>
            </div>
        );
    }

    // Tạo danh sách ảnh (giả sử có nhiều ảnh)
    const productImages = product.images || [product.image];

    return (
        <div className={`product-detail-page ${showNotificationModal ? 'modal-open' : ''}`}>
            <div className="product-detail-container">
                {/* Breadcrumb Navigation */}
                <div className="breadcrumb-nav">
                    <button className="breadcrumb-btn" onClick={handleGoHome}>
                        <Home size={16} />
                        <span>Trang chủ</span>
                    </button>
                    <span className="breadcrumb-separator">/</span>
                    <button className="breadcrumb-btn" onClick={handleGoBack}>
                        <ArrowLeft size={16} />
                        <span>Quay lại</span>
                    </button>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-current">Chi tiết sản phẩm</span>
                </div>

                <div className="product-content">
                    {/* Cột trái - Image Gallery */}
                    <div className="product-left-column">
                        {/* Image Gallery */}
                        <div className="image-gallery">
                            <div className="main-image-container">
                                <img
                                    src={productImages[currentImageIndex]}
                                    alt={product.title}
                                    className="main-image"
                                />

                                {/* Navigation arrows */}
                                {productImages.length > 1 && (
                                    <>
                                        <button className="nav-arrow nav-arrow-left" onClick={prevImage}>
                                            <ChevronLeft />
                                        </button>
                                        <button className="nav-arrow nav-arrow-right" onClick={nextImage}>
                                            <ChevronRight />
                                        </button>
                                    </>
                                )}

                                {/* Image counter */}
                                <div className="image-counter">
                                    {currentImageIndex + 1}/{productImages.length}
                                </div>

                                {/* Action buttons */}
                                <div className="image-actions">
                                    <button className="image-action-btn">
                                        <Share2 />
                                    </button>
                                    <button className="image-action-btn">
                                        <MoreHorizontal />
                                    </button>
                                </div>
                            </div>

                            {/* Thumbnails */}
                            {productImages.length > 1 && (
                                <div className="thumbnails">
                                    {productImages.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`${product.title} ${index + 1}`}
                                            className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                                            onClick={() => setCurrentImageIndex(index)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mô tả chi tiết */}
                        <div className="product-description">
                            <h3>Mô tả chi tiết</h3>
                            <div className="description-content">
                                <p>{product.description}</p>
                                <ul className="description-list">
                                    <li>Tình trạng: {product.conditionLevel}</li>
                                    <li>Năm sản xuất: {product.manufactureYear}</li>
                                    <li>Thời gian sử dụng: {product.usedDuration}</li>
                                    {product.batteryType && <li>Loại pin: {product.batteryType}</li>}
                                    {product.range && <li>Tầm xa: {product.range}</li>}
                                </ul>
                            </div>
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="product-specs">
                            <h3>Thông tin chi tiết</h3>
                            <div className="specs-grid">
                                <div className="spec-item">
                                    <span className="spec-label">Hãng:</span>
                                    <span className="spec-value">{product.brand}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Model:</span>
                                    <span className="spec-value">{product.model}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Tình trạng:</span>
                                    <span className="spec-value">{product.conditionLevel}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Năm sản xuất:</span>
                                    <span className="spec-value">{product.manufactureYear}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Thời gian sử dụng:</span>
                                    <span className="spec-value">{product.usedDuration}</span>
                                </div>
                                {product.batteryType && (
                                    <div className="spec-item">
                                        <span className="spec-label">Loại pin:</span>
                                        <span className="spec-value">{product.batteryType}</span>
                                    </div>
                                )}
                                {product.range && (
                                    <div className="spec-item">
                                        <span className="spec-label">Tầm xa:</span>
                                        <span className="spec-value">{product.range}</span>
                                    </div>
                                )}
                                <div className="spec-item">
                                    <span className="spec-label">Địa điểm:</span>
                                    <span className="spec-value">{product.locationTrading}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải - Thông tin sản phẩm và người bán */}
                    <div className="product-right-column">
                        {/* Product Header - Di chuyển từ trên xuống */}
                        <div className="product-header-right">
                            <div className="product-actions-top">
                                <button
                                    className={`save-btn ${isGuest ? 'disabled' : ''}`}
                                    onClick={isGuest ? handleRequireLogin : () => { const added = toggleFavorite({ ...product, type: product.batteryType ? 'battery' : 'vehicle' }); setFav(added); }}
                                >
                                    <Heart className={`action-icon ${fav ? 'heart-active' : ''}`} color={fav ? '#dc3545' : 'currentColor'} fill={fav ? '#dc3545' : 'none'} />
                                    <span>{fav ? 'Đã lưu' : 'Lưu'}</span>
                                </button>
                            </div>

                            <div className="product-title-section">
                                <h1 className="product-title">{product.title}</h1>
                                <p className="product-subtitle">{product.brand} • {product.model}</p>
                                <div className="product-price">{formatCurrency(product.price)}</div>
                            </div>

                            <div className="product-meta">
                                <div className="location-info">
                                    <MapPin className="meta-icon" />
                                    <span>{product.locationTrading}</span>
                                </div>
                                <div className="update-time">
                                    <Clock className="meta-icon" />
                                    <span>Cập nhật {formatDate(product.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Giá xe mới trên thị trường */}
                        <div className="market-price-section">
                            <div className="market-price-header">
                                <h3>Giá xe mới trên thị trường</h3>
                                <div className="info-icon">ⓘ</div>
                            </div>
                            <p className="market-price-note">Giá thực tế của loại xe này trên thị trường</p>

                            <div className="price-comparison">
                                <div className="price-item">
                                    <div className="price-label">Giá thấp nhất</div>
                                    <div className="price-value low-price">8.26 tr</div>
                                </div>

                                <div className="price-item current">
                                    <div className="price-label">Giá hiện tại</div>
                                    <div className="price-value current-price">6.5 tr</div>
                                    <div className="price-badge">Tiết kiệm 21%</div>
                                </div>

                                <div className="price-item">
                                    <div className="price-label">Giá cao nhất</div>
                                    <div className="price-value high-price">10.1 tr</div>
                                </div>
                            </div>
                        </div>

                        {/* Nút mua hàng */}
                        <div className="buy-section">
                            <button
                                className={`buy-btn ${isGuest ? 'disabled' : ''}`}
                                onClick={isGuest ? handleRequireLogin : () => alert('Mua ngay - hành động dành cho user đăng nhập')}
                            >
                                <ShoppingCart className="btn-icon" />
                                <span>Mua ngay</span>
                            </button>
                        </div>

                        {/* Thông tin người bán */}
                        <div className="seller-section">
                            <div className="contact-buttons">
                                <button
                                    className={`contact-btn phone-btn ${isGuest ? 'disabled' : ''}`}
                                    onClick={isGuest ? handleRequireLogin : () => alert('Hiện số điện thoại người bán: 093682****')}
                                >
                                    <Phone className="btn-icon" />
                                    <span>{isGuest ? 'Hiện số 093682****' : 'Hiện số 093682****'}</span>
                                </button>
                                <button
                                    className={`contact-btn chat-btn ${isGuest ? 'disabled' : ''}`}
                                    onClick={isGuest ? handleRequireLogin : () => { window.location.href = '/chat'; }}
                                >
                                    <MessageCircle className="btn-icon" />
                                    <span>Chat</span>
                                </button>
                            </div>

                            <div className="seller-profile">
                                <div className="seller-avatar">
                                    <User />
                                </div>
                                <div className="seller-info">
                                    <div className="seller-name">
                                        <span>Người bán</span>
                                        <div className="verified-badge">✓</div>
                                    </div>
                                    <div className="seller-activity">Hoạt động 7 giờ trước</div>
                                    <div className="seller-stats">
                                        <span>Phản hồi: 86%</span>
                                        <span>77 Đã bán</span>
                                        <span>4.6 ⭐ 23 đánh giá</span>
                                    </div>
                                    <button className="view-profile-btn">Xem trang</button>
                                </div>
                            </div>

                            {/* Quick chat options */}
                            <div className="quick-chat">
                                <div className="quick-chat-options">
                                    <button
                                        className={`quick-chat-btn ${isGuest ? 'disabled' : ''}`}
                                        onClick={isGuest ? handleRequireLogin : undefined}
                                    >
                                        Sản phẩm này còn không?
                                    </button>
                                    <button
                                        className={`quick-chat-btn ${isGuest ? 'disabled' : ''}`}
                                        onClick={isGuest ? handleRequireLogin : undefined}
                                    >
                                        Bạn có ship hàng không?
                                    </button>
                                    <button
                                        className={`quick-chat-btn ${isGuest ? 'disabled' : ''}`}
                                        onClick={isGuest ? handleRequireLogin : undefined}
                                    >
                                        Sản phẩm còn bảo hành không?
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Đánh giá */}
                        <div className="reviews-section">
                            <h3>Đánh giá sản phẩm</h3>

                            {/* Thông báo về chính sách đánh giá */}
                            {!canReview && (
                                <div className="review-policy-notice">
                                    <p>
                                        {isGuest
                                            ? "Đăng nhập để có thể mua hàng và đánh giá"
                                            : "Chỉ người đã mua sản phẩm mới có thể đánh giá"
                                        }
                                    </p>
                                </div>
                            )}

                            {reviews.length === 0 ? (
                                <div className="no-reviews">
                                    <Star className="review-icon" />
                                    <p>Chưa có đánh giá nào. Hãy để lại đánh giá cho sản phẩm này.</p>
                                </div>
                            ) : (
                                <div className="reviews-list">
                                    {reviews.map(review => (
                                        <div key={review.id} className="review-item">
                                            <div className="review-avatar">
                                                <User />
                                            </div>
                                            <div className="review-content">
                                                <div className="review-header">
                                                    <span className="review-user">{review.user}</span>
                                                    <div className="review-rating">
                                                        {[...Array(5)].map((_, index) => (
                                                            <Star
                                                                key={index}
                                                                className={`star ${index < review.rating ? 'filled' : 'empty'}`}
                                                                size={16}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="review-time">{review.time}</span>
                                                </div>
                                                <p className="review-text">{review.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="review-input">
                                <div className="review-avatar">
                                    <User />
                                </div>
                                <div className="review-form">
                                    <div className="rating-input">
                                        <span className="rating-label">Đánh giá:</span>
                                        <div className="stars">
                                            {[...Array(5)].map((_, index) => (
                                                <Star
                                                    key={index}
                                                    className={`star ${index < rating ? 'filled' : 'empty'} ${canReview ? 'clickable' : 'disabled'}`}
                                                    size={20}
                                                    onClick={() => handleStarClick(index + 1)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="review-text-input">
                                        <textarea
                                            placeholder={canReview
                                                ? "Viết đánh giá của bạn..."
                                                : (isGuest
                                                    ? "Đăng nhập để viết đánh giá..."
                                                    : "Chỉ người đã mua sản phẩm mới có thể đánh giá..."
                                                )
                                            }
                                            value={review}
                                            onChange={(e) => setReview(e.target.value)}
                                            disabled={!canReview}
                                            className={!canReview ? 'disabled' : ''}
                                            onClick={!canReview ? handleRequireLogin : undefined}
                                            rows={3}
                                        />
                                        <button
                                            className="submit-btn"
                                            onClick={canReview ? handleSubmitReview : handleRequireLogin}
                                            disabled={canReview && (!review.trim() || rating === 0)}
                                        >
                                            <Send />
                                            {canReview
                                                ? 'Gửi đánh giá'
                                                : (isGuest
                                                    ? 'Đăng nhập để mua hàng và đánh giá'
                                                    : 'Chỉ người đã mua mới được đánh giá'
                                                )
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Modal */}
            <NotificationModal
                isOpen={showNotificationModal}
                onClose={handleCloseNotificationModal}
                onLogin={handleGoToLogin}
                onRegister={handleGoToRegister}
                notificationType={notificationType}
            />
        </div>
    );
}

export default ProductDetail;
