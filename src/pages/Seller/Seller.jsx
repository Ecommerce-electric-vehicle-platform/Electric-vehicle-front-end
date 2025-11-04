import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Seller.css";
import sellerApi from '../../api/sellerApi';
import { Package, Plus, BarChart3, Star, MapPin, Calendar, CheckCircle, Clock, MessageCircle, Users, Heart } from "lucide-react";

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
    
    // Kiểm tra xem seller có đang xem chính profile của mình không
    // Lấy sellerId từ nhiều nguồn để đảm bảo chính xác
    // Lưu ý: sellerId có thể bằng buyerId vì seller được nâng cấp từ buyer
    const currentSellerIdFromStorage = localStorage.getItem("sellerId");
    const currentBuyerIdFromStorage = localStorage.getItem("buyerId");
    const currentSellerIdFromData = seller?.sellerId || seller?.id || seller?.buyerId;
    
    // Ưu tiên: sellerId từ storage > sellerId từ data > buyerId từ storage
    // (vì buyerId = sellerId khi seller được nâng cấp từ buyer)
    const currentSellerId = currentSellerIdFromStorage || currentSellerIdFromData || currentBuyerIdFromStorage;
    
    // So sánh sellerId từ URL với sellerId/buyerId hiện tại
    const isViewingOwnProfile = currentSellerId && sellerId && (
        String(sellerId) === String(currentSellerId) || 
        Number(sellerId) === Number(currentSellerId) ||
        sellerId === currentSellerId
    );
    
    // Debug: Log để kiểm tra
    useEffect(() => {
        console.log("[Seller Profile] Debug:", {
            sellerIdFromURL: sellerId,
            currentSellerIdFromStorage: currentSellerIdFromStorage,
            currentBuyerIdFromStorage: currentBuyerIdFromStorage,
            currentSellerIdFromData: currentSellerIdFromData,
            currentSellerId: currentSellerId,
            isViewingOwnProfile: isViewingOwnProfile,
            sellerData: seller
        });
    }, [sellerId, currentSellerIdFromStorage, currentBuyerIdFromStorage, currentSellerIdFromData, currentSellerId, isViewingOwnProfile, seller]);

    // Bước 1: Lấy sản phẩm của seller
    useEffect(() => {
        let mounted = true;
        if (sellerId) {
            setProductsLoading(true);
            sellerApi.getProductsBySeller(sellerId)
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

    // Bước 2: Khi có post đầu tiên: lấy info seller từ postId đó
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

    // Filter theo loại sản phẩm (luôn hiển thị tất cả)
    const typeFiltered = products;
    
    // Filter theo trạng thái (đang hiển thị / đã bán)
    const filtered = typeFiltered.filter(p => {
        const isSold = p.isSold || p.status?.toLowerCase() === 'sold';
        if (postFilter === 'sold') {
            return isSold;
        } else {
            // Đang hiển thị: active + not sold + not rejected
            const isActive = p.active !== false && p.active !== 0;
            const isNotSold = !isSold;
            const isNotRejected = p.verifiedDecisionStatus !== "REJECTED";
            return isActive && isNotSold && isNotRejected;
        }
    });
    
    // Đếm số lượng
    const displayingCount = typeFiltered.filter(p => {
        const isSold = p.isSold || p.status?.toLowerCase() === 'sold';
        const isActive = p.active !== false && p.active !== 0;
        const isNotSold = !isSold;
        const isNotRejected = p.verifiedDecisionStatus !== "REJECTED";
        return isActive && isNotSold && isNotRejected;
    }).length;
    
    const soldCount = typeFiltered.filter(p => {
        return p.isSold || p.status?.toLowerCase() === 'sold';
    }).length;

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return "Hôm nay";
        if (diffDays === 1) return "Hôm qua";
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
        return `${Math.floor(diffDays / 365)} năm trước`;
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
                                    <span className="status-badge-large">{seller.status}</span>
                                )}
                            </div>
                            
                            {/* Rating */}
                            <div className="profile-rating">
                                <div className="rating-stars">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} size={16} fill={i <= 3.7 ? "#fbbf24" : "#e5e7eb"} stroke={i <= 3.7 ? "#fbbf24" : "#e5e7eb"} />
                                    ))}
                                </div>
                                <span className="rating-text">3.7 (6 đánh giá)</span>
                            </div>

                            {/* Followers */}
                            <div className="profile-stats">
                                <div className="stat-item">
                                    <Users size={16} />
                                    <span>Người theo dõi: <strong>7</strong></span>
                                </div>
                                <div className="stat-item">
                                    <Users size={16} />
                                    <span>Đang theo dõi: <strong>0</strong></span>
                                </div>
                            </div>

                            {/* Follow Button (nếu không phải seller xem chính mình) */}
                            {!isViewingOwnProfile && (
                                <button className="follow-btn">
                                    <Plus size={16} />
                                    Theo dõi
                                </button>
                            )}

                            {/* Chat Response */}
                            <div className="profile-info-item">
                                <MessageCircle size={16} />
                                <span>Phản hồi chat: <strong>Thỉnh thoảng</strong> (Phản hồi chậm)</span>
                            </div>

                            {/* Join Date */}
                            <div className="profile-info-item">
                                <Calendar size={16} />
                                <span>Đã tham gia: <strong>6 năm 6 tháng</strong></span>
                            </div>

                            {/* Verification */}
                            <div className="profile-info-item">
                                <CheckCircle size={16} />
                                <span>Đã xác thực:</span>
                                <div className="verification-icons">
                                    <CheckCircle size={14} fill="#10b981" color="#10b981" />
                                    <CheckCircle size={14} fill="#10b981" color="#10b981" />
                                    <CheckCircle size={14} fill="#10b981" color="#10b981" />
                                </div>
                            </div>

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
                                const isSold = p.isSold || p.status?.toLowerCase() === 'sold';
                                const isVerified = p.verifiedDecisionStatus === 'APPROVED';
                                
                                // Ưu tiên: thumbnail > image > imageUrls[0] > fallback
                                let imageUrl = p.thumbnail || p.image || (Array.isArray(p.imageUrls) && p.imageUrls.length > 0 ? p.imageUrls[0] : null);
                                
                                // Nếu không có ảnh, dùng placeholder đẹp hơn
                                const hasImage = imageUrl && imageUrl !== "/default-avatar.png" && !imageUrl.includes("default");
                                
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
                                                {isSold && <div className="sold-overlay">
                                                    <span className="sold-badge">Đã bán</span>
                                                </div>}
                                                <button className="heart-btn" onClick={(e) => { e.preventDefault(); }}>
                                                    <Heart size={18} fill="transparent" stroke="#fff" />
                                                </button>
                                            </div>
                                            {isVerified && (
                                                <div className="verified-badge">
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M8 0L10.1632 5.52786L16 6.09017L12 10.1632L12.9443 16L8 13.5279L3.05573 16L4 10.1632L0 6.09017L5.83679 5.52786L8 0Z" fill="#10b981"/>
                                                    </svg>
                                                    <span>Đã xác minh</span>
                                                </div>
                                            )}
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
                                                    <span>{formatDate(p.createdAt || p.postDate)}</span>
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


