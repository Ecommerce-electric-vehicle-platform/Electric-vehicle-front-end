import React, { useState, useEffect, useCallback } from 'react';
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
import { ConfirmationDialog } from '../../components/ConfirmationDialog/ConfirmationDialog';
import './ProductDetail.css';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import sellerApi from '../../api/sellerApi';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../../api/wishlistApi';
import chatApi from '../../api/chatApi';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [seller, setSeller] = useState(null);
    const [sellerLoading, setSellerLoading] = useState(false);
    const [sellerError, setSellerError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isGuest, setIsGuest] = useState(true);
    const [hasPurchased] = useState(false); // Giả sử chưa mua sản phẩm này
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationType, setNotificationType] = useState('login'); // 'login' hoặc 'purchase'
    const [fav, setFav] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [showRemoveConfirmDialog, setShowRemoveConfirmDialog] = useState(false);
    const [pendingRemoveWishlistId, setPendingRemoveWishlistId] = useState(null);

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

    // Check xem product có trong wishlist không
    const checkWishlistStatus = useCallback(async (postId) => {
        if (!postId || isGuest) {
            setFav(false);
            return;
        }

        try {
            setWishlistLoading(true);
            // Fetch wishlist với size lớn để check
            const result = await fetchWishlist({ page: 0, size: 100 });
            const productId = Number(postId);
            const isInWishlist = (result.items || []).some(
                item => Number(item.postId || item.id) === productId
            );
            setFav(isInWishlist);
        } catch (err) {
            console.error('[ProductDetail] Error checking wishlist status:', err);
            setFav(false);
        } finally {
            setWishlistLoading(false);
        }
    }, [isGuest]);

    // Re-check wishlist status khi isGuest thay đổi hoặc product thay đổi
    useEffect(() => {
        if (product && !isGuest) {
            checkWishlistStatus(product.postId || product.id);
        } else {
            setFav(false);
        }
    }, [isGuest, product?.postId, product?.id, checkWishlistStatus, product]);

    // Toggle wishlist (add hoặc remove)
    const handleToggleFavorite = async () => {
        if (isGuest) {
            handleRequireLogin();
            return;
        }

        if (!product || !product.postId) {
            console.error('[ProductDetail] Cannot toggle favorite: missing product or postId');
            return;
        }

        const postId = product.postId || product.id;

        if (fav) {
            // Remove from wishlist - hiển thị dialog xác nhận trước
            try {
                setWishlistLoading(true);
                const result = await fetchWishlist({ page: 0, size: 100 });
                const wishlistItem = (result.items || []).find(
                    item => Number(item.postId || item.id) === Number(postId)
                );

                if (wishlistItem && wishlistItem.wishlistId) {
                    // Hiển thị dialog xác nhận
                    setPendingRemoveWishlistId(wishlistItem.wishlistId);
                    setShowRemoveConfirmDialog(true);
                } else {
                    console.warn('[ProductDetail] Could not find wishlistId to remove');
                }
            } catch (err) {
                console.error('[ProductDetail] Error fetching wishlist:', err);
            } finally {
                setWishlistLoading(false);
            }
        } else {
            // Add to wishlist - không cần xác nhận
            try {
                setWishlistLoading(true);
                const result = await addToWishlist({
                    postId: Number(postId),
                    priority: "LOW",
                    note: ""
                });
                if (result.success) {
                    setFav(true);
                    console.log('[ProductDetail] Added to wishlist');
                } else {
                    console.error('[ProductDetail] Failed to add to wishlist:', result.message);
                    const errorMsg = result.message || "Không thể thêm vào danh sách yêu thích";
                    alert(errorMsg);
                }
            } catch (err) {
                console.error('[ProductDetail] Error adding to wishlist:', err);
                const errorMsg = err?.response?.data?.message || err?.message || "Không thể thêm vào danh sách yêu thích";
                alert(errorMsg);
            } finally {
                setWishlistLoading(false);
            }
        }
    };

    // Xác nhận xóa khỏi wishlist
    const handleConfirmRemoveFromWishlist = async () => {
        if (!pendingRemoveWishlistId) return;

        setShowRemoveConfirmDialog(false);
        const wishlistId = pendingRemoveWishlistId;

        try {
            setWishlistLoading(true);
            await removeFromWishlist(wishlistId);
            setFav(false);
            console.log('[ProductDetail] Removed from wishlist');
        } catch (err) {
            console.error('[ProductDetail] Error removing from wishlist:', err);
            const errorMsg = err?.response?.data?.message || err?.message || "Không thể xóa khỏi danh sách yêu thích";
            alert(errorMsg);
        } finally {
            setWishlistLoading(false);
            setPendingRemoveWishlistId(null);
        }
    };

    // Hủy xóa khỏi wishlist
    const handleCancelRemoveFromWishlist = () => {
        setShowRemoveConfirmDialog(false);
        setPendingRemoveWishlistId(null);
    };

    // Tải sản phẩm theo ID từ BE
    useEffect(() => {
        let mounted = true;
        console.log('[ProductDetail] useEffect - URL parameter id:', id, 'Type:', typeof id);
        (async () => {
            try {
                const p = await fetchPostProductById(id);
                console.log('[ProductDetail] Received product from API:', p);
                console.log('[ProductDetail] Product ID:', p?.id, 'Type:', typeof p?.id);
                console.log('[ProductDetail] Product postId:', p?.postId);
                console.log('[ProductDetail] Product full data:', {
                    id: p?.id,
                    postId: p?.postId,
                    title: p?.title,
                    price: p?.price,
                    images: p?.images?.length,
                    sellerId: p?.sellerId
                });

                if (!mounted) return;

                // Kiểm tra product có dữ liệu hợp lệ không
                if (!p) {
                    console.error('[ProductDetail] Product is null after fetch');
                    setProduct(null);
                    setSeller(null);
                    return;
                }

                setProduct(p);
                // Wishlist status sẽ được check trong useEffect riêng
                // Seller sẽ được fetch trong useEffect thứ hai dựa trên product.postId
            } catch (error) {
                console.error('[ProductDetail] Error in useEffect:', error);
                console.error('[ProductDetail] Error details:', {
                    message: error?.message,
                    response: error?.response?.data,
                    status: error?.response?.status
                });
                if (!mounted) return;
                setProduct(null);
                setSeller(null);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    // Tải seller info khi product.postId có giá trị
    // Ưu tiên dùng postId vì đây là ID thực sự của post-product
    useEffect(() => {
        if (!product) {
            setSeller(null);
            setSellerError(null);
            setSellerLoading(false);
            return;
        }

        // Ưu tiên postId, nếu không có thì mới dùng id
        let pid = product.postId || product.id;

        // Validate và convert postId
        if (pid != null) {
            const pidStr = String(pid).trim();
            const pidNum = Number(pidStr);

            // Kiểm tra xem có phải là số hợp lệ không (số nguyên dương, không phải số thập phân lạ)
            if (isNaN(pidNum) || pidNum <= 0 || !Number.isInteger(pidNum)) {
                console.error('[ProductDetail] Invalid product ID detected:', pid, 'Type:', typeof pid, 'Product:', product);
                setSeller(null);
                setSellerError("INVALID_ID");
                setSellerLoading(false);
                return;
            }

            // Đảm bảo pid là số nguyên
            pid = pidNum;
        }

        if (!pid) {
            console.warn('[ProductDetail] Product has no postId or id, cannot fetch seller. Product:', product);
            setSeller(null);
            setSellerError("NO_SELLER");
            setSellerLoading(false);
            return;
        }

        console.log('[ProductDetail] Fetching seller with product ID:', pid, 'Type:', typeof pid, 'from product:', {
            id: product.id,
            postId: product.postId,
            using: pid === product.postId ? 'postId' : 'id'
        });

        setSellerLoading(true);
        setSellerError(null);
        setSeller(null);

        sellerApi.getSellerByProductId(pid)
            .then(data => {
                if (data) {
                    console.log('[ProductDetail] Received seller data:', data);
                    setSeller(data);
                    setSellerError(null);
                } else {
                    console.warn('[ProductDetail] Seller API returned null/empty data');
                    setSeller(null);
                    setSellerError("NO_SELLER");
                }
            })
            .catch((error) => {
                console.error("[ProductDetail] Error fetching seller info:", error);
                setSeller(null);
                setSellerError("NO_SELLER");
            })
            .finally(() => {
                setSellerLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.postId, product?.id]);

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

    // Handle chat button click - create conversation if needed, then navigate to chat
    const handleChatClick = async () => {
        if (isGuest) {
            handleRequireLogin();
            return;
        }

        if (!product || !product.postId) {
            console.error('[ProductDetail] Cannot chat: missing product or postId');
            alert("Không thể tìm thấy thông tin sản phẩm. Vui lòng thử lại!");
            return;
        }

        try {
            console.log('[ProductDetail] Creating conversation for postId:', product.postId);
            const response = await chatApi.createConversation(product.postId);
            console.log('[ProductDetail] Conversation created:', response.data);
            
            if (response?.data?.success) {
                console.log('[ProductDetail] Navigating to chat page');
                navigate('/chat');
            } else {
                console.warn('[ProductDetail] Conversation creation response:', response?.data);
                // Try to navigate anyway
                navigate('/chat');
            }
        } catch (error) {
            console.error('[ProductDetail] Error creating conversation:', error);
            // If error is because conversation already exists, navigate anyway
            if (error?.response?.data?.message?.includes('exist') || 
                error?.response?.data?.error?.includes('exist')) {
                console.log('[ProductDetail] Conversation already exists, navigating to chat');
                navigate('/chat');
            } else {
                alert("Không thể tạo cuộc trò chuyện. Vui lòng thử lại!");
            }
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
                                handleToggleFavorite();
                            }}
                            disabled={wishlistLoading}
                            style={{
                                padding: "8px",
                                border: "none",
                                background: "transparent",
                                cursor: wishlistLoading ? "wait" : "pointer",
                                color: fav ? "#ef4444" : "#6b7280",
                                opacity: wishlistLoading ? 0.6 : 1,
                            }}
                            title={wishlistLoading ? "Đang xử lý..." : (fav ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích")}
                        >
                            {wishlistLoading ? (
                                <span style={{ fontSize: "16px" }}>⏳</span>
                            ) : (
                                <Heart fill={fav ? "#ef4444" : "none"} />
                            )}
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
                                                handleToggleFavorite();
                                            }}
                                            disabled={wishlistLoading}
                                            style={{
                                                padding: "8px",
                                                border: "none",
                                                background: "transparent",
                                                cursor: wishlistLoading ? "wait" : "pointer",
                                                color: fav ? "#ef4444" : "#6b7280",
                                                opacity: wishlistLoading ? 0.6 : 1,
                                            }}
                                            title={wishlistLoading ? "Đang xử lý..." : (fav ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích")}
                                        >
                                            {wishlistLoading ? (
                                                <span style={{ fontSize: "16px" }}>⏳</span>
                                            ) : (
                                                <Heart fill={fav ? "#ef4444" : "none"} />
                                            )}
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
                                        onClick={handleChatClick}
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

                                {/* Thông tin người bán - Design chuyên nghiệp */}
                                <section
                                    style={{
                                        marginBottom: 24,
                                        position: 'relative',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                        borderRadius: 16,
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Animated border effect */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: 'linear-gradient(90deg, #10b981, #3b82f6, #10b981)',
                                            backgroundSize: '200% 100%',
                                            animation: 'gradientShift 3s ease infinite',
                                        }}
                                    />

                                    <div style={{ padding: '16px' }}>
                                        <h3
                                            style={{
                                                marginBottom: 12,
                                                fontWeight: 700,
                                                fontSize: '16px',
                                                color: '#1f2937',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <User size={18} style={{ color: '#10b981' }} />
                                            Thông tin người bán
                                        </h3>

                                        {sellerLoading ? (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '16px',
                                                background: '#f9fafb',
                                                borderRadius: '12px'
                                            }}>
                                                <div
                                                    style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        border: '3px solid #e5e7eb',
                                                        borderTop: '3px solid #10b981',
                                                        borderRadius: '50%',
                                                        animation: 'spin 0.8s linear infinite'
                                                    }}
                                                />
                                                <span style={{ color: '#6b7280', fontSize: '14px' }}>Đang tải thông tin người bán...</span>
                                            </div>
                                        ) : sellerError === 'INVALID_ID' ? (
                                            <div style={{
                                                padding: '16px',
                                                background: '#fef2f2',
                                                borderRadius: '12px',
                                                border: '1px solid #fecaca'
                                            }}>
                                                <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>
                                                    ⚠️ Lỗi: ID sản phẩm không hợp lệ. Vui lòng thử lại sau.
                                                </p>
                                            </div>
                                        ) : sellerError ? (
                                            <div style={{
                                                padding: '16px',
                                                background: '#fef2f2',
                                                borderRadius: '12px',
                                                border: '1px solid #fecaca'
                                            }}>
                                                <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>
                                                    ⚠️ Không tìm thấy thông tin người bán.
                                                </p>
                                            </div>
                                        ) : seller ? (
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => seller?.sellerId && navigate(`/seller/${seller.sellerId}`, { state: { sellerPrefetch: seller } })}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.3)';
                                                    const glow = e.currentTarget.querySelector('[data-glow]');
                                                    if (glow) glow.style.opacity = '1';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                                    const glow = e.currentTarget.querySelector('[data-glow]');
                                                    if (glow) glow.style.opacity = '0';
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    cursor: seller?.sellerId ? 'pointer' : 'not-allowed',
                                                    padding: '12px 14px',
                                                    borderRadius: 10,
                                                    border: '1.5px solid #10b981',
                                                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {/* Hover glow effect */}
                                                <div
                                                    data-glow
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-50%',
                                                        left: '-50%',
                                                        width: '200%',
                                                        height: '200%',
                                                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                                                        opacity: 0,
                                                        transition: 'opacity 0.3s ease',
                                                        pointerEvents: 'none',
                                                        zIndex: 0
                                                    }}
                                                />

                                                {/* Avatar với gradient background */}
                                                <div style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: 20,
                                                    color: '#fff',
                                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    flexShrink: 0
                                                }}>
                                                    {(seller.storeName || seller.sellerName || 'N')[0].toUpperCase()}
                                                </div>

                                                <div style={{ flex: 1, position: 'relative', zIndex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                                        <span style={{
                                                            fontWeight: 600,
                                                            fontSize: '15px',
                                                            color: '#1f2937',
                                                            lineHeight: '1.4',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {seller.storeName || seller.sellerName || 'Người bán'}
                                                        </span>
                                                        {seller.status && (
                                                            <span
                                                                style={{
                                                                    padding: '3px 8px',
                                                                    fontSize: '10px',
                                                                    fontWeight: 600,
                                                                    background: seller.status === 'ACCEPTED'
                                                                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                                                                        : '#fef3c7',
                                                                    color: seller.status === 'ACCEPTED' ? '#065f46' : '#92400e',
                                                                    borderRadius: 5,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.3px',
                                                                    border: seller.status === 'ACCEPTED'
                                                                        ? '1px solid #10b981'
                                                                        : '1px solid #fbbf24',
                                                                    whiteSpace: 'nowrap',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '3px'
                                                                }}
                                                            >
                                                                <span>✓</span>
                                                                <span>{seller.status === 'ACCEPTED' ? 'Đã xác thực' : seller.status}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 13,
                                                        color: '#64748b',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        <MapPin size={12} style={{ flexShrink: 0 }} />
                                                        <span>{seller.home || seller.nationality || 'Địa chỉ chưa cập nhật'}</span>
                                                    </div>
                                                </div>

                                                {seller?.sellerId && (
                                                    <ChevronRight
                                                        size={18}
                                                        style={{
                                                            color: '#10b981',
                                                            opacity: 0.5,
                                                            transition: 'all 0.2s ease',
                                                            flexShrink: 0
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.opacity = '1';
                                                            e.currentTarget.style.transform = 'translateX(3px)';
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </section>

                                {/* Câu hỏi thường gặp */}
                                <div
                                    style={{
                                        padding: "24px",
                                        borderRadius: "16px",
                                        border: "1px solid rgba(59, 130, 246, 0.2)",
                                        background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            marginBottom: 16,
                                            fontWeight: 700,
                                            fontSize: '18px',
                                            color: '#1f2937',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Info size={20} style={{ color: '#3b82f6' }} />
                                        Câu hỏi thường gặp
                                    </h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {[
                                            "Sản phẩm này còn không?",
                                            "Bạn có ship hàng không?",
                                            "Sản phẩm còn bảo hành không?"
                                        ].map((question, index) => (
                                            <button
                                                key={index}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                                                    e.currentTarget.style.borderColor = '#3b82f6';
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#ffffff';
                                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                }}
                                                style={{
                                                    width: "100%",
                                                    padding: "12px 16px",
                                                    borderRadius: "10px",
                                                    border: "1.5px solid #e5e7eb",
                                                    backgroundColor: "#ffffff",
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    fontSize: "14px",
                                                    fontWeight: 500,
                                                    color: '#374151',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <span style={{ color: '#3b82f6' }}>💬</span>
                                                {question}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Lưu ý an toàn */}
                                <div
                                    style={{
                                        padding: "24px",
                                        borderRadius: "16px",
                                        border: "2px solid rgba(16, 185, 129, 0.3)",
                                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(236, 253, 245, 0.5) 100%)",
                                        boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Decorative corner accent */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: '100px',
                                            height: '100px',
                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                                            borderRadius: '0 16px 0 100px',
                                        }}
                                    />

                                    <h3
                                        style={{
                                            marginBottom: 16,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            fontWeight: 700,
                                            fontSize: '18px',
                                            color: '#065f46',
                                            position: 'relative',
                                            zIndex: 1
                                        }}
                                    >
                                        <Shield size={20} style={{ color: '#10b981' }} />
                                        Lưu ý an toàn khi mua hàng
                                    </h3>
                                    <ul
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "12px",
                                            fontSize: "14px",
                                            color: "#374151",
                                            paddingLeft: 0,
                                            listStyle: "none",
                                            position: 'relative',
                                            zIndex: 1
                                        }}
                                    >
                                        {[
                                            "Luôn kiểm tra sản phẩm trực tiếp",
                                            "Xác minh giấy tờ pháp lý đầy đủ",
                                            "Không chuyển tiền trước khi nhận hàng",
                                            "Gặp mặt tại nơi công cộng, an toàn"
                                        ].map((tip, index) => (
                                            <li
                                                key={index}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '8px 12px',
                                                    background: 'rgba(255, 255, 255, 0.6)',
                                                    borderRadius: '8px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                }}
                                            >
                                                <span style={{
                                                    color: '#10b981',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    ✓
                                                </span>
                                                <span style={{ fontWeight: 500 }}>{tip}</span>
                                            </li>
                                        ))}
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

            {/* Confirmation Dialog for removing from wishlist */}
            <ConfirmationDialog
                isOpen={showRemoveConfirmDialog}
                onConfirm={handleConfirmRemoveFromWishlist}
                onCancel={handleCancelRemoveFromWishlist}
                title="Xác nhận xóa"
                message="Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?"
                confirmText="Xóa"
                cancelText="Hủy"
                type="warning"
            />
        </div>
    );
}

export default ProductDetail;
