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
    Star,
    User,
    Send,
    ArrowLeft,
    Home,
    ShoppingCart,
    Zap,
    Shield,
    Info,
    Eye
} from 'lucide-react';
import { fetchPostProductById } from '../../api/productApi';
import { NotificationModal } from '../../components/NotificationModal/NotificationModal';
import './ProductDetail.css';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
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
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationType, setNotificationType] = useState('login'); // 'login' hoặc 'purchase'
    const [fav, setFav] = useState(false);

    // Helper functions
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(new Date(dateString));
    };


    // Xác định trạng thái đăng nhập
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const legacyToken = localStorage.getItem('token');

        // Có token nào đó thì không phải guest
        const hasToken = accessToken || refreshToken || legacyToken;
        setIsGuest(!hasToken);
    }, []);

    // Tải sản phẩm theo ID từ BE
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const p = await fetchPostProductById(id);
                if (!mounted) return;
                setProduct(p);
                if (p) setFav(isFavorite(p.id));
            } catch {
                if (!mounted) return;
                setProduct(null);
            }
        })();
        return () => { mounted = false; };
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


    // Xử lý quay lại
    const handleGoBack = () => {
        navigate(-1); // Quay lại trang trước đó
    };



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

    // Market price data
    const marketPriceData = {
        lowest: 8260000,
        highest: 10100000,
        currentDiscount: 21,
    };

    const pricePercentage = ((product.price - marketPriceData.lowest) / (marketPriceData.highest - marketPriceData.lowest)) * 100;

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#fafafa" }}>
            {/* Header */}
            <header
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(8px)",
                }}
            >
                <div
                    style={{
                        maxWidth: "1280px",
                        margin: "0 auto",
                        display: "flex",
                        height: "64px",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 16px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <button
                            onClick={handleGoBack}
                            style={{
                                padding: "8px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                borderRadius: "6px",
                            }}
                        >
                            <ChevronLeft />
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Zap />
                            <span style={{ fontSize: "18px", fontWeight: 600 }}>GREENTRADE</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                            onClick={() => {
                                if (isGuest) {
                                    handleRequireLogin();
                                } else {
                                    const added = toggleFavorite({ ...product, type: product.batteryType ? 'battery' : 'vehicle' });
                                    setFav(added);
                                }
                            }}
                            style={{
                                padding: "8px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                color: fav ? "#ef4444" : "#6b7280",
                            }}
                        >
                            <Heart fill={fav ? "#ef4444" : "none"} />
                        </button>
                        <button style={{ padding: "8px", border: "none", background: "transparent", cursor: "pointer" }}>
                            <Share2 />
                        </button>
                        <button style={{ padding: "8px", border: "none", background: "transparent", cursor: "pointer" }}>
                            <MoreHorizontal />
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}>
                {/* Breadcrumb */}
                <Breadcrumbs labelMap={{ products: 'Sản phẩm', product: 'Chi tiết' }} />

                <div style={{ display: "grid", gap: "32px", gridTemplateColumns: "1fr", maxWidth: "100%" }}>
                    <div style={{ display: "grid", gap: "32px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                        {/* Left Column */}
                        <div style={{ minWidth: 0 }}>
                            {/* Image Gallery */}
                            <div
                                style={{
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    border: "1px solid #e5e7eb",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <div style={{ position: "relative", paddingBottom: "75%", backgroundColor: "#f3f4f6" }}>
                                    <img
                                        src={productImages[currentImageIndex] || "/placeholder.svg"}
                                        alt={`${product.title} - Image ${currentImageIndex + 1}`}
                                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: "16px",
                                            top: "16px",
                                            borderRadius: "9999px",
                                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                                            padding: "4px 12px",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            backdropFilter: "blur(8px)",
                                        }}
                                    >
                                        {currentImageIndex + 1}/{productImages.length}
                                    </div>
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "16px",
                                        }}
                                    >
                                        <button
                                            onClick={prevImage}
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "9999px",
                                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                                                border: "none",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backdropFilter: "blur(8px)",
                                            }}
                                        >
                                            <ChevronLeft />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "9999px",
                                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                                                border: "none",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backdropFilter: "blur(8px)",
                                            }}
                                        >
                                            <ChevronRight />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Thumbnails */}
                            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                                {productImages.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        style={{
                                            position: "relative",
                                            paddingBottom: "100%",
                                            overflow: "hidden",
                                            borderRadius: "8px",
                                            border: index === currentImageIndex ? "2px solid #10b981" : "2px solid transparent",
                                            cursor: "pointer",
                                            background: "transparent",
                                        }}
                                    >
                                        <img
                                            src={image || "/placeholder.svg"}
                                            alt={`Thumbnail ${index + 1}`}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Mô tả chi tiết */}
                            <div
                                style={{
                                    marginTop: "32px",
                                    padding: "24px",
                                    borderRadius: "12px",
                                    border: "1px solid #e5e7eb",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Mô tả chi tiết</h3>
                                <p style={{ color: "#6b7280", lineHeight: 1.6, marginBottom: "16px" }}>
                                    {product.description || `Xe điện ${product.brand} ${product.model} với thiết kế thể thao, phù hợp cho người dùng yêu thích tốc độ.`}
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            paddingBottom: "8px",
                                            borderBottom: "1px solid #f3f4f6",
                                        }}
                                    >
                                        <span style={{ color: "#6b7280" }}>Tình trạng:</span>
                                        <span style={{ fontWeight: 600 }}>{product.condition || "Tốt"}</span>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            paddingBottom: "8px",
                                            borderBottom: "1px solid #f3f4f6",
                                        }}
                                    >
                                        <span style={{ color: "#6b7280" }}>Năm sản xuất:</span>
                                        <span style={{ fontWeight: 600 }}>{product.manufactureYear}</span>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            paddingBottom: "8px",
                                            borderBottom: "1px solid #f3f4f6",
                                        }}
                                    >
                                        <span style={{ color: "#6b7280" }}>Thời gian sử dụng:</span>
                                        <span style={{ fontWeight: 600 }}>{product.usedDuration ? `${product.usedDuration.toLocaleString()} km` : "Chưa có thông tin"}</span>
                                    </div>
                                    {product.batteryType && (
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                paddingBottom: "8px",
                                                borderBottom: "1px solid #f3f4f6",
                                            }}
                                        >
                                            <span style={{ color: "#6b7280" }}>Loại pin:</span>
                                            <span style={{ fontWeight: 600 }}>{product.batteryType}</span>
                                        </div>
                                    )}
                                    {product.range && (
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#6b7280" }}>Tầm xa:</span>
                                            <span style={{ fontWeight: 600 }}>{product.range} km</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Thông tin chi tiết */}
                            <div
                                style={{
                                    marginTop: "24px",
                                    padding: "24px",
                                    borderRadius: "12px",
                                    border: "1px solid #e5e7eb",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Thông tin chi tiết</h3>
                                <div
                                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}
                                >
                                    {product.brand && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Hãng:</span>
                                            <span style={{ fontWeight: 500 }}>{product.brand}</span>
                                        </div>
                                    )}
                                    {product.model && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Model:</span>
                                            <span style={{ fontWeight: 500 }}>{product.model}</span>
                                        </div>
                                    )}
                                    {product.condition && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Tình trạng:</span>
                                            <span style={{ fontWeight: 500 }}>{product.condition}</span>
                                        </div>
                                    )}
                                    {product.manufactureYear && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Năm sản xuất:</span>
                                            <span style={{ fontWeight: 500 }}>{product.manufactureYear}</span>
                                        </div>
                                    )}
                                    {product.usedDuration && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Thời gian sử dụng:</span>
                                            <span style={{ fontWeight: 500 }}>{product.usedDuration.toLocaleString()} km</span>
                                        </div>
                                    )}
                                    {product.batteryType && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Loại pin:</span>
                                            <span style={{ fontWeight: 500 }}>{product.batteryType}</span>
                                        </div>
                                    )}
                                    {product.range && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Tầm xa:</span>
                                            <span style={{ fontWeight: 500 }}>{product.range} km</span>
                                        </div>
                                    )}
                                    {product.locationTrading && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Địa điểm:</span>
                                            <span style={{ fontWeight: 500 }}>{product.locationTrading}</span>
                                        </div>
                                    )}
                                    {product.isSold !== undefined && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Trạng thái:</span>
                                            <span style={{ fontWeight: 500, color: product.isSold ? "#ef4444" : "#10b981" }}>
                                                {product.isSold ? "Đã bán" : "Còn hàng"}
                                            </span>
                                        </div>
                                    )}
                                    {product.verified !== undefined && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                                            <span style={{ color: "#6b7280" }}>Xác minh:</span>
                                            <span style={{ fontWeight: 500, color: product.verified ? "#10b981" : "#6b7280" }}>
                                                {product.verified ? "Đã xác minh" : "Chưa xác minh"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div style={{ minWidth: 0 }}>
                            <div style={{ position: "sticky", top: "96px", display: "flex", flexDirection: "column", gap: "16px" }}>
                                {/* Pricing Card */}
                                <div
                                    style={{
                                        padding: "24px",
                                        borderRadius: "12px",
                                        border: "1px solid #e5e7eb",
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    <div
                                        style={{
                                            marginBottom: "16px",
                                            display: "flex",
                                            alignItems: "start",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <div>
                                            <h2 style={{ marginBottom: "4px", fontSize: "24px", fontWeight: 700 }}>{product.title}</h2>
                                            <p style={{ fontSize: "14px", color: "#6b7280" }}>
                                                {product.brand} • {product.model}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (isGuest) {
                                                    handleRequireLogin();
                                                } else {
                                                    const added = toggleFavorite({ ...product, type: product.batteryType ? 'battery' : 'vehicle' });
                                                    setFav(added);
                                                }
                                            }}
                                            style={{
                                                padding: "8px",
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                color: fav ? "#ef4444" : "#6b7280",
                                            }}
                                        >
                                            <Heart fill={fav ? "#ef4444" : "none"} />
                                        </button>
                                    </div>

                                    <div style={{ marginBottom: "8px", fontSize: "32px", fontWeight: 700, color: "#10b981" }}>
                                        {formatPrice(product.price)}
                                    </div>

                                    <div
                                        style={{
                                            marginBottom: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            fontSize: "14px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        <MapPin size={16} />
                                        <span>{product.locationTrading}</span>
                                    </div>

                                    <div
                                        style={{
                                            marginBottom: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            fontSize: "14px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        <Clock size={16} />
                                        <span>Cập nhật {formatDate(product.createdAt)}</span>
                                    </div>

                                    <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "16px 0" }} />

                                    {/* Market Price */}
                                    <div
                                        style={{ marginBottom: "16px", borderRadius: "8px", backgroundColor: "#f9fafb", padding: "16px" }}
                                    >
                                        <div
                                            style={{
                                                marginBottom: "8px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                fontSize: "14px",
                                            }}
                                        >
                                            <span style={{ fontWeight: 500 }}>Giá xe mới trên thị trường</span>
                                            <Info size={16} />
                                        </div>
                                        <p style={{ marginBottom: "12px", fontSize: "12px", color: "#6b7280" }}>
                                            Giá thực tế của loại xe này trên thị trường
                                        </p>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                fontSize: "14px",
                                            }}
                                        >
                                            <div>
                                                <p style={{ fontSize: "12px", color: "#6b7280" }}>Giá thấp nhất</p>
                                                <p style={{ fontWeight: 600 }}>{(marketPriceData.lowest / 1000000).toFixed(1)} tr</p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ fontSize: "12px", color: "#6b7280" }}>Giá cao nhất</p>
                                                <p style={{ fontWeight: 600 }}>{(marketPriceData.highest / 1000000).toFixed(1)} tr</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price Progress */}
                                    <div style={{ marginBottom: "24px" }}>
                                        <div
                                            style={{
                                                marginBottom: "8px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                fontSize: "14px",
                                            }}
                                        >
                                            <span style={{ fontWeight: 500 }}>Giá hiện tại</span>
                                            <span
                                                style={{
                                                    padding: "2px 8px",
                                                    borderRadius: "4px",
                                                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                                                    color: "#10b981",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Giá kiến {marketPriceData.currentDiscount}%
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                position: "relative",
                                                height: "8px",
                                                width: "100%",
                                                overflow: "hidden",
                                                borderRadius: "9999px",
                                                backgroundColor: "#f3f4f6",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    background: "linear-gradient(to right, #10b981, #3b82f6)",
                                                    width: `${pricePercentage}%`,
                                                    transition: "width 0.3s",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={isGuest ? handleRequireLogin : () => navigate(`/place-order/${product.id}`, { state: { product } })}
                                        disabled={product.isSold}
                                        style={{
                                            marginBottom: "12px",
                                            width: "100%",
                                            padding: "12px 24px",
                                            borderRadius: "8px",
                                            border: "none",
                                            backgroundColor: product.isSold ? "#9ca3af" : "#10b981",
                                            color: "#fff",
                                            fontSize: "16px",
                                            fontWeight: 600,
                                            cursor: product.isSold ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            opacity: product.isSold ? 0.6 : 1,
                                        }}
                                    >
                                        <Zap />
                                        {product.isSold ? "Đã bán" : "Mua ngay"}
                                    </button>

                                    <button
                                        onClick={isGuest ? handleRequireLogin : () => { window.location.href = '/chat'; }}
                                        style={{
                                            width: "100%",
                                            padding: "12px 16px",
                                            borderRadius: "8px",
                                            border: "1px solid #fbbf24",
                                            backgroundColor: "rgba(251, 191, 36, 0.1)",
                                            color: "#f59e0b",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        <MessageCircle size={16} />
                                        Chat
                                    </button>
                                </div>

                                {/* Seller Info */}
                                <div
                                    style={{
                                        padding: "24px",
                                        borderRadius: "12px",
                                        border: "1px solid #e5e7eb",
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                overflow: "hidden",
                                                borderRadius: "9999px",
                                                backgroundColor: "#f3f4f6",
                                            }}
                                        >
                                            <img
                                                src="/professional-seller-avatar.jpg"
                                                alt="Seller"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <h3 style={{ fontWeight: 600 }}>Người bán</h3>
                                                {product.verified && (
                                                    <span
                                                        style={{
                                                            height: "20px",
                                                            padding: "0 8px",
                                                            borderRadius: "4px",
                                                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                                                            color: "#10b981",
                                                            fontSize: "12px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "4px",
                                                        }}
                                                    >
                                                        <Shield size={12} />
                                                        Đã xác minh
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: "14px", color: "#6b7280" }}>
                                                Cập nhật {formatDate(product.updatedAt || product.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            marginBottom: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            fontSize: "14px",
                                        }}
                                    >
                                        <span style={{ color: "#6b7280" }}>Phản hồi:</span>
                                        <span style={{ fontWeight: 600 }}>86%</span>
                                    </div>
                                    <div style={{ marginBottom: "16px", fontSize: "14px", color: "#6b7280" }}>77 Đã bán</div>
                                    <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span style={{ fontWeight: 600 }}>4.6</span>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={16} fill={star <= 4 ? "#fbbf24" : "none"} />
                                        ))}
                                        <span style={{ marginLeft: "4px", fontSize: "14px", color: "#6b7280" }}>(23 đánh giá)</span>
                                    </div>

                                    <button
                                        style={{
                                            width: "100%",
                                            padding: "8px 16px",
                                            borderRadius: "8px",
                                            border: "1px solid #e5e7eb",
                                            backgroundColor: "transparent",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        <Eye size={16} />
                                        Xem trang
                                    </button>
                                </div>

                                {/* FAQ */}
                                <div
                                    style={{
                                        padding: "24px",
                                        borderRadius: "12px",
                                        border: "1px solid #e5e7eb",
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <button
                                            style={{
                                                width: "100%",
                                                padding: "8px 16px",
                                                borderRadius: "8px",
                                                border: "1px solid #e5e7eb",
                                                backgroundColor: "transparent",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                fontSize: "14px",
                                            }}
                                        >
                                            Sản phẩm này còn không?
                                        </button>
                                        <button
                                            style={{
                                                width: "100%",
                                                padding: "8px 16px",
                                                borderRadius: "8px",
                                                border: "1px solid #e5e7eb",
                                                backgroundColor: "transparent",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                fontSize: "14px",
                                            }}
                                        >
                                            Bạn có ship hàng không?
                                        </button>
                                        <button
                                            style={{
                                                width: "100%",
                                                padding: "8px 16px",
                                                borderRadius: "8px",
                                                border: "1px solid #e5e7eb",
                                                backgroundColor: "transparent",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                fontSize: "14px",
                                            }}
                                        >
                                            Sản phẩm còn bảo hành không?
                                        </button>
                                    </div>
                                </div>

                                {/* Safety Tips */}
                                <div
                                    style={{
                                        padding: "24px",
                                        borderRadius: "12px",
                                        border: "1px solid rgba(16, 185, 129, 0.2)",
                                        backgroundColor: "rgba(16, 185, 129, 0.05)",
                                    }}
                                >
                                    <h3
                                        style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}
                                    >
                                        <Shield size={16} />
                                        Lưu ý an toàn
                                    </h3>
                                    <ul
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            paddingLeft: 0,
                                            listStyle: "none",
                                        }}
                                    >
                                        <li>• Luôn kiểm tra xe trực tiếp</li>
                                        <li>• Xác minh giấy tờ pháp lý</li>
                                        <li>• Không chuyển tiền trước</li>
                                        <li>• Gặp tại nơi công cộng</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Đánh giá sản phẩm */}
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}>
                <div
                    style={{
                        padding: "24px",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#fff",
                    }}
                >
                    <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", textAlign: "center" }}>Đánh giá sản phẩm</h3>

                    <div
                        style={{
                            marginBottom: "16px",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                            <Info size={14} />
                            <span>Chỉ khách hàng đã mua sản phẩm mới có thể đánh giá</span>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={{ marginBottom: "6px", display: "block", fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                                Đánh giá của bạn:
                            </label>
                            <div style={{ display: "flex", justifyContent: "center", gap: "4px" }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            color: star <= rating ? "#fbbf24" : "#d1d5db",
                                            transition: "all 0.2s",
                                            padding: "2px",
                                        }}
                                    >
                                        <Star size={18} fill={star <= rating ? "#fbbf24" : "none"} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ marginBottom: "6px", display: "block", fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                                Nhận xét:
                            </label>
                            <textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="Chia sẻ trải nghiệm của bạn..."
                                style={{
                                    minHeight: "70px",
                                    width: "100%",
                                    borderRadius: "6px",
                                    border: "1px solid #d1d5db",
                                    backgroundColor: "#fff",
                                    padding: "8px 12px",
                                    fontSize: "13px",
                                    outline: "none",
                                    resize: "vertical",
                                }}
                            />
                        </div>

                        <button
                            disabled
                            style={{
                                width: "100%",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "#f3f4f6",
                                color: "#9ca3af",
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                            }}
                        >
                            <Shield size={14} />
                            Cần mua sản phẩm để đánh giá
                        </button>
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
