import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Seller.css";
import sellerApi from '../../api/sellerApi';
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
    const [soldPostIds, setSoldPostIds] = useState([]); // Danh sách postId đã bán (từ đơn hàng COMPLETED)
    
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
                    // Debug: Log để kiểm tra dữ liệu ngày đăng
                    if (list.length > 0) {
                        console.log('[Seller] Sample product data:', {
                            createdAt: list[0].createdAt,
                            created_at: list[0].created_at,
                            postDate: list[0].postDate,
                            post_date: list[0].post_date,
                            allKeys: Object.keys(list[0])
                        });
                    }
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

    // Bước 2: Lấy danh sách đơn hàng COMPLETED để xác định sản phẩm đã bán
    // Theo DB: Chỉ COMPLETED được coi là "đã bán"
    // Các trạng thái khác: CANCELED, CONFIRMED, DELIVERED, IN_TRANSIT, PAID, PENDING, PROCESSING, REFUNDED, RETURN_REQUESTED, SHIPPED, VERIFIED
    useEffect(() => {
        let mounted = true;
        if (sellerId) {
            // Chỉ lấy đơn hàng có status COMPLETED (trạng thái chính cho "đã bán")
            sellerApi.getSellerOrders(0, 100, 'COMPLETED')
                .then(response => {
                    if (!mounted) return;
                    
                    console.log('[Seller] Raw API response for COMPLETED orders:', {
                        fullResponse: response,
                        responseData: response?.data,
                        responseDataData: response?.data?.data,
                        responseStructure: {
                            hasData: !!response?.data,
                            hasDataData: !!response?.data?.data,
                            hasContent: !!response?.data?.data?.content,
                            isArray: Array.isArray(response?.data?.data)
                        }
                    });
                    
                    // Lấy danh sách đơn hàng từ response - thử nhiều cách
                    const orders = response?.data?.data?.content || 
                                  response?.data?.data?.items ||
                                  response?.data?.data?.list ||
                                  response?.data?.data ||
                                  response?.data?.content ||
                                  response?.data?.items ||
                                  response?.data ||
                                  (Array.isArray(response?.data) ? response?.data : []);
                    
                    console.log('[Seller] Extracted orders from response:', {
                        ordersCount: orders.length,
                        orders: orders,
                        allOrdersStatus: orders.map(o => ({
                            id: o.id || o.orderId,
                            status: o.status,
                            postId: o.postId || o.postProductId,
                            allKeys: Object.keys(o)
                        }))
                    });
                    
                    // Lọc lại để chỉ lấy đơn hàng có status COMPLETED (case-insensitive)
                    // (vì API có thể trả về tất cả orders nếu không filter đúng)
                    const completedOrders = orders.filter(o => {
                        const status = String(o.status || '').toUpperCase();
                        const isCompleted = status === 'COMPLETED';
                        if (!isCompleted) {
                            console.log('[Seller] Order filtered out (not COMPLETED):', {
                                orderId: o.id || o.orderId,
                                status: o.status,
                                statusUpper: status
                            });
                        }
                        return isCompleted;
                    });
                    
                    console.log('[Seller] Filtered COMPLETED orders:', {
                        completedCount: completedOrders.length,
                        completedOrders: completedOrders.map(o => ({
                            id: o.id || o.orderId,
                            status: o.status,
                            postId: o.postId || o.postProductId,
                            allKeys: Object.keys(o)
                        }))
                    });
                    
                    // Lấy danh sách postId từ các đơn hàng đã completed
                    const soldPostIdsSet = new Set();
                    completedOrders.forEach(order => {
                        // Thử nhiều field names để tìm postId
                        const postId = order.postId || 
                                     order.postProductId || 
                                     order.post_product_id || 
                                     order.postProductId || 
                                     order.postProduct?.postId || 
                                     order.postProduct?.id ||
                                     order.productId ||
                                     order.product_id;
                        
                        console.log('[Seller] Processing order for postId:', {
                            orderId: order.id || order.orderId,
                            status: order.status,
                            foundPostId: postId,
                            orderKeys: Object.keys(order),
                            orderPostProduct: order.postProduct
                        });
                        
                        if (postId) {
                            soldPostIdsSet.add(String(postId));
                        } else {
                            console.warn('[Seller] Order has no postId:', {
                                orderId: order.id || order.orderId,
                                status: order.status,
                                allKeys: Object.keys(order)
                            });
                        }
                    });
                    
                    const soldPostIdsArray = Array.from(soldPostIdsSet);
                    setSoldPostIds(soldPostIdsArray);
                    
                    console.log('[Seller] Final result - Loaded sold products from COMPLETED orders:', {
                        totalOrdersFromAPI: orders.length,
                        filteredCompletedOrders: completedOrders.length,
                        soldPostIds: soldPostIdsArray,
                        sampleOrder: completedOrders[0] ? {
                            orderId: completedOrders[0].id || completedOrders[0].orderId,
                            postId: completedOrders[0].postId || completedOrders[0].postProductId,
                            status: completedOrders[0].status,
                            allKeys: Object.keys(completedOrders[0]),
                            fullOrder: completedOrders[0]
                        } : null
                    });
                })
                .catch(error => {
                    if (!mounted) return;
                    console.error('[Seller] Error loading COMPLETED orders:', error);
                    console.error('[Seller] Error details:', {
                        message: error?.message,
                        response: error?.response?.data,
                        status: error?.response?.status,
                        statusText: error?.response?.statusText
                    });
                    setSoldPostIds([]);
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

    // Filter theo loại sản phẩm (luôn hiển thị tất cả)
    const typeFiltered = products;
    
    // Xác định sản phẩm đã bán: kiểm tra postId có trong danh sách đơn hàng COMPLETED
    const getIsSold = (product) => {
        const postId = String(product.postId || product.id || '');
        // Kiểm tra trong danh sách đơn hàng COMPLETED
        if (soldPostIds.includes(postId)) {
            return true;
        }
        // Fallback: kiểm tra field isSold hoặc status (nếu backend set)
        return product.isSold || product.is_sold || product.status?.toLowerCase() === 'sold';
    };
    
    // Filter theo trạng thái (đang hiển thị / đã bán)
    const filtered = typeFiltered.filter(p => {
        const isSold = getIsSold(p);
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
                                                <button className="heart-btn" onClick={(e) => { e.preventDefault(); }}>
                                                    <Heart size={18} fill="transparent" stroke="#fff" />
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


