import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Seller.css";
import sellerApi from '../../api/sellerApi';
import { addToWishlist, fetchWishlist } from '../../api/wishlistApi';
import { Package, Plus, BarChart3, Star, MapPin, Calendar, Clock, MessageCircle, Users, Heart, Shield } from "lucide-react";

export function Seller() {
    const { id: sellerId } = useParams();
    const navigate = useNavigate();
    const [seller, setSeller] = useState(null);
    const [sellerLoading, setSellerLoading] = useState(false);
    const [sellerError, setSellerError] = useState(null);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState(null);
    const [postFilter, setPostFilter] = useState("displaying"); // displaying | sold
    const [wishlistItems, setWishlistItems] = useState(new Set()); // Set chứa postId đã có trong wishlist
    const [wishlistLoading, setWishlistLoading] = useState({}); // Track loading state cho từng sản phẩm
    
    // Kiểm tra xem seller có đang xem chính profile của mình không
    // QUAN TRỌNG: Chỉ hiển thị button seller khi user thực sự là seller
    const currentSellerIdFromStorage = localStorage.getItem("sellerId");
    const currentSellerIdFromData = seller?.sellerId || seller?.id;
    const userRole = localStorage.getItem("userRole"); // "buyer" hoặc "seller"
    
    // Chỉ lấy sellerId từ storage hoặc data (KHÔNG dùng buyerId làm fallback)
    // Vì buyer không nên thấy button seller ngay cả khi buyerId trùng với sellerId
    const currentSellerId = currentSellerIdFromStorage || currentSellerIdFromData;
    
    // Kiểm tra user có phải seller không
    const isCurrentUserSeller = userRole === "seller" || !!currentSellerIdFromStorage;
    
    // So sánh sellerId từ URL với sellerId hiện tại
    // VÀ chỉ true khi user thực sự là seller
    const isViewingOwnProfile = isCurrentUserSeller && currentSellerId && sellerId && (
        String(sellerId) === String(currentSellerId) || 
        Number(sellerId) === Number(currentSellerId) ||
        sellerId === currentSellerId
    );
    

    // Bước 1: Lấy sản phẩm của seller
    // Sử dụng pagination để lấy TẤT CẢ sản phẩm (giống ManagePosts)
    useEffect(() => {
        let mounted = true;
        if (sellerId) {
            setProductsLoading(true);
            // Thêm pagination để lấy tất cả sản phẩm (0-100 tương tự ManagePosts)
            sellerApi.getProductsBySeller(sellerId, { page: 0, size: 100 })
                .then(items => {
                    if (!mounted) return;
                    const list = Array.isArray(items) ? items : [];
                    setProducts(list);
                    setProductsError(null);
                })
                .catch(() => {
                    if (!mounted) return;
                    setProducts([]);
                    setProductsError("Không tải được danh sách sản phẩm.");
                })
                .finally(() => {
                    if (!mounted) return;
                    setProductsLoading(false);
                });
        }
        return () => { mounted = false; };
    }, [sellerId]);


    // Bước 3: Khi có post đầu tiên: lấy info seller từ postId đó
    useEffect(() => {
        let mounted = true;
        if (Array.isArray(products) && products.length > 0) {
            const postId = products[0].postId || products[0].id;
            if (postId) {
                setSellerLoading(true);
                sellerApi.getSellerByProductId(postId)
                    .then(data => {
                        if (!mounted) return;
                        if (data) {
                            setSeller(data);
                            setSellerError(null);
                        } else {
                            setSeller(null);
                            setSellerError("Không tìm thấy seller.");
                        }
                    })
                    .catch(() => {
                        if (!mounted) return;
                        setSeller(null);
                        setSellerError("Không tìm thấy seller.");
                    })
                    .finally(() => {
                        if (!mounted) return;
                        setSellerLoading(false);
                    });
            }
        } else if (!productsLoading) {
            setSeller(null);
        }
        return () => { mounted = false; };
    }, [products, productsLoading]);

    // Load wishlist để check sản phẩm nào đã có trong wishlist
    useEffect(() => {
        const isAuthenticated = localStorage.getItem("accessToken");
        if (!isAuthenticated) {
            setWishlistItems(new Set());
            return;
        }

        let mounted = true;
        fetchWishlist({ page: 0, size: 100 })
            .then(result => {
                if (!mounted) return;
                const items = result.items || [];
                const postIds = new Set(items.map(item => String(item.postId || item.id)));
                setWishlistItems(postIds);
            })
            .catch(() => {
                if (!mounted) return;
                setWishlistItems(new Set());
            });

        return () => { mounted = false; };
    }, []);

    // Handle click vào nút trái tim để thêm vào wishlist
    const handleToggleWishlist = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        const isAuthenticated = localStorage.getItem("accessToken");
        if (!isAuthenticated) {
            alert("Vui lòng đăng nhập để thêm vào danh sách yêu thích");
            return;
        }

        const postId = product.postId || product.id;
        if (!postId) return;

        const postIdStr = String(postId);
        const isInWishlist = wishlistItems.has(postIdStr);

        // Set loading state
        setWishlistLoading(prev => ({ ...prev, [postIdStr]: true }));

        try {
            if (isInWishlist) {
                // Nếu đã có trong wishlist, có thể cần remove (nhưng theo yêu cầu chỉ cần add)
                // Ở đây chỉ thông báo
                alert("Sản phẩm đã có trong danh sách yêu thích");
            } else {
                // Thêm vào wishlist
                const result = await addToWishlist({
                    postId: Number(postId),
                    priority: "LOW",
                    note: ""
                });

                if (result.success) {
                    // Cập nhật state
                    setWishlistItems(prev => {
                        const newSet = new Set(prev);
                        newSet.add(postIdStr);
                        return newSet;
                    });
                } else {
                    alert(result.message || "Không thể thêm vào danh sách yêu thích");
                }
            }
        } catch (error) {
            console.error('[Seller] Error toggling wishlist:', error);
            const errorMsg = error?.response?.data?.message || error?.message || "Không thể thêm vào danh sách yêu thích";
            alert(errorMsg);
        } finally {
            setWishlistLoading(prev => ({ ...prev, [postIdStr]: false }));
        }
    };

    // Filter theo loại sản phẩm (luôn hiển thị tất cả)
    const typeFiltered = products;
    
    // Xác định sản phẩm đã bán: chỉ kiểm tra field isSold
    const getIsSold = (product) => {
        return product.isSold === true || product.isSold === 1 || product.is_sold === true || product.is_sold === 1;
    };
    
    // Filter theo trạng thái (đang hiển thị / đã bán)
    // Logic đồng bộ với ManagePosts.jsx
    const filtered = typeFiltered.filter(p => {
        const isSold = getIsSold(p);
        if (postFilter === 'sold') {
            return isSold;
        } else {
            // Đang hiển thị: active + not sold + not rejected
            // Logic giống ManagePosts.jsx
            const isActive = p.active !== false && p.active !== 0;
            const isNotSold = !isSold;
            const isNotRejected = p.verifiedDecisionStatus !== "REJECTED";
            return isActive && isNotSold && isNotRejected;
        }
    });
    
    // Đếm số lượng - logic đồng bộ với ManagePosts.jsx
    const displayingCount = typeFiltered.filter(p => {
        const isSold = getIsSold(p);
        const isActive = p.active !== false && p.active !== 0;
        const isNotSold = !isSold;
        const isNotRejected = p.verifiedDecisionStatus !== "REJECTED";
        return isActive && isNotSold && isNotRejected;
    }).length;
    
    const soldCount = typeFiltered.filter(p => {
        return getIsSold(p);
    }).length;

    // Format date - giống ProductCard trên homepage
    const formatDate = (dateString) => {
        if (!dateString) {
            // Fallback: sử dụng ngày hiện tại nếu không có date
            return new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // Invalid date, fallback to current date
                return new Date().toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            // Fallback to current date on error
            return new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    };

    return (
        <div className="seller-page">
            <div className="seller-layout">
                {/* Left Column - Profile Card */}
                <div className="seller-profile-sidebar">
                    {sellerLoading ? (
                        <div className="profile-card">Đang tải thông tin người bán…</div>
                    ) : sellerError ? (
                        <div className="profile-card" style={{ color: '#ef4444' }}>{sellerError}</div>
                    ) : seller ? (
                        <div className="profile-card">
                            <div className="profile-avatar-large">
                                <div className="avatar-circle-large">
                                    {(seller.storeName || seller.sellerName || 'S')[0]}
                                </div>
                            </div>
                            <div className="profile-name-section">
                                <h2 className="profile-name">{seller.storeName || seller.sellerName || 'Seller'}</h2>
                                {seller.status && (
                                    <span className="status-badge-large">
                                        {seller.status === 'ACCEPTED' ? 'Đã xác thực' : seller.status}
                                    </span>
                                )}
                            </div>
                            
                            {/* Rating */}
                            {seller.rating && (
                                <div className="profile-rating">
                                    <div className="rating-stars">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} size={16} fill={i <= (seller.rating || 0) ? "#fbbf24" : "#e5e7eb"} stroke={i <= (seller.rating || 0) ? "#fbbf24" : "#e5e7eb"} />
                                        ))}
                                    </div>
                                    <span className="rating-text">{seller.rating?.toFixed(1) || '0.0'} ({seller.reviewCount || 0} đánh giá)</span>
                                </div>
                            )}

                            {/* Followers */}
                            {(seller.followerCount !== undefined || seller.followingCount !== undefined) && (
                                <div className="profile-stats">
                                    {seller.followerCount !== undefined && (
                                        <div className="stat-item">
                                            <Users size={16} />
                                            <span>Người theo dõi: <strong>{seller.followerCount}</strong></span>
                                        </div>
                                    )}
                                    {seller.followingCount !== undefined && (
                                        <div className="stat-item">
                                            <Users size={16} />
                                            <span>Đang theo dõi: <strong>{seller.followingCount}</strong></span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Chat Response */}
                            {seller.chatResponseTime && (
                                <div className="profile-info-item">
                                    <MessageCircle size={16} />
                                    <span>Phản hồi chat: <strong>{seller.chatResponseTime}</strong></span>
                                </div>
                            )}

                            {/* Join Date */}
                            {seller.joinDate && (
                                <div className="profile-info-item">
                                    <Calendar size={16} />
                                    <span>Đã tham gia: <strong>{seller.joinDate}</strong></span>
                                </div>
                            )}

                            {/* Address */}
                            <div className="profile-info-item">
                                <MapPin size={16} />
                                <span>Địa chỉ: <strong>{seller.home || seller.nationality || "Chưa cung cấp"}</strong></span>
                            </div>

                            {/* Management Buttons (nếu seller xem chính mình) */}
                            {isViewingOwnProfile && (
                                <div className="profile-management-buttons">
                                    <button className="mgmt-btn primary" onClick={() => navigate('/seller-dashboard')}>
                                        <BarChart3 size={16} />
                                        Bảng điều khiển
                                    </button>
                                    <button className="mgmt-btn secondary" onClick={() => navigate('/seller/manage-posts')}>
                                        <Package size={16} />
                                        Quản lý tin
                                    </button>
                                    <button className="mgmt-btn success" onClick={() => navigate('/seller/create-post')}>
                                        <Plus size={16} />
                                        Đăng tin
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="profile-card">Không tìm thấy thông tin người bán.</div>
                    )}
                </div>

                {/* Right Column - Products */}
                <div className="seller-products-main">
                    <div className="products-section">
                        {/* Tab Filter */}
                        <div className="post-filter-tabs">
                            <button 
                                className={`post-tab ${postFilter === 'displaying' ? 'active' : ''}`}
                                onClick={() => setPostFilter('displaying')}
                            >
                                Đang hiển thị ({displayingCount})
                            </button>
                            <button 
                                className={`post-tab ${postFilter === 'sold' ? 'active' : ''}`}
                                onClick={() => setPostFilter('sold')}
                            >
                                Đã bán ({soldCount})
                            </button>
                        </div>

                    {productsLoading ? (
                        <div className="product-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="product-card skeleton">
                                    <div className="thumb skeleton-thumb"></div>
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-price"></div>
                                </div>
                            ))}
                        </div>
                    ) : productsError ? (
                        <div style={{ color: '#ef4444' }}>{productsError}</div>
                    ) : (
                        <div className="product-grid">
                            {filtered && filtered.length > 0 ? filtered.map(p => {
                                const isSold = getIsSold(p);
                                const isVerified = p.verifiedDecisionStatus === 'APPROVED';
                                
                                // Ưu tiên: images (mảng) > image > imageUrls (mảng) > thumbnail > fallback
                                // Giống logic trong ProductDetail.jsx
                                let imageUrl = null;
                                
                                // Kiểm tra images (mảng) - có thể là mảng string hoặc mảng object
                                if (Array.isArray(p.images) && p.images.length > 0) {
                                    const firstImage = p.images[0];
                                    if (typeof firstImage === 'string') {
                                        imageUrl = firstImage;
                                    } else if (typeof firstImage === 'object' && firstImage !== null) {
                                        imageUrl = firstImage.imgUrl || firstImage.url || firstImage.image || null;
                                    }
                                }
                                
                                // Fallback sang image (string)
                                if (!imageUrl && p.image && typeof p.image === 'string') {
                                    imageUrl = p.image;
                                }
                                
                                // Fallback sang imageUrls (mảng)
                                if (!imageUrl && Array.isArray(p.imageUrls) && p.imageUrls.length > 0) {
                                    imageUrl = p.imageUrls[0];
                                }
                                
                                // Fallback sang thumbnail
                                if (!imageUrl && p.thumbnail && typeof p.thumbnail === 'string') {
                                    imageUrl = p.thumbnail;
                                }
                                
                                // Nếu không có ảnh, dùng placeholder đẹp hơn
                                const hasImage = imageUrl && imageUrl.trim() !== "" && imageUrl !== "/default-avatar.png" && !imageUrl.includes("default");
                                
                                return (
                                    <a 
                                        key={p.id || p.postId} 
                                        className={`product-card ${isSold ? 'sold' : ''}`} 
                                        href={`/product/${p.postId || p.id}`}
                                    >
                                        <div className="product-card-header">
                                            <div className="thumb">
                                                {hasImage ? (
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={p.title}
                                                        onError={(e) => {
                                                            // Fallback nếu ảnh lỗi
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`thumb-placeholder ${hasImage ? 'hidden' : ''}`}>
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L22 16M2 20H22C23.105 20 24 19.105 24 18V6C24 4.895 23.105 4 22 4H2C0.895 4 0 4.895 0 6V18C0 19.105 0.895 20 2 20Z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <span>Chưa có ảnh</span>
                                                </div>
                                                {/* Badge "Đã xác minh" - góc trên bên trái, đồng bộ với homepage */}
                                                {isVerified && (
                                                    <div className="verified-badge">
                                                        <Shield size={12} />
                                                        <span>Đã xác minh</span>
                                                    </div>
                                                )}
                                                {isSold && <div className="sold-overlay">
                                                    <span className="sold-badge">Đã bán</span>
                                                </div>}
                                                <button 
                                                    className="heart-btn" 
                                                    onClick={(e) => handleToggleWishlist(e, p)}
                                                    disabled={wishlistLoading[String(p.postId || p.id)]}
                                                    title={wishlistItems.has(String(p.postId || p.id)) ? "Đã có trong danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
                                                >
                                                    <Heart 
                                                        size={18} 
                                                        fill={wishlistItems.has(String(p.postId || p.id)) ? "#ef4444" : "transparent"} 
                                                        stroke={wishlistItems.has(String(p.postId || p.id)) ? "#ef4444" : "#fff"} 
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="product-card-body">
                                            <div className="title" title={p.title}>{p.title}</div>
                                            {p.color || p.model ? (
                                                <div className="product-model">{p.color || p.model}</div>
                                            ) : null}
                                            <div className="meta">
                                                <span className="price">{p.price ? p.price.toLocaleString('vi-VN') + ' ₫' : 'Liên hệ'}</span>
                                            </div>
                                            <div className="product-meta-footer">
                                                <div className="post-time-location">
                                                    <Clock size={12} />
                                                    <span>{formatDate(p.createdAt || p.created_at || p.postDate || p.post_date || p.dateCreated || p.date_created || p.updatedAt || p.updated_at)}</span>
                                                    {p.location && (
                                                        <>
                                                            <span className="separator">-</span>
                                                            <MapPin size={12} />
                                                            <span>{p.location}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                );
                            }) : (
                                <div className="empty-state">
                                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="32" cy="32" r="30" stroke="#e5e7eb" strokeWidth="2"/>
                                        <path d="M20 32L28 40L44 24" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <p>Không có sản phẩm nào</p>
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Seller;


