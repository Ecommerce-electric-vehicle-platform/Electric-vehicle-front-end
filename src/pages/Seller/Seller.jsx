import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Seller.css";
import sellerApi from '../../api/sellerApi';
import { addToWishlist, fetchWishlist } from '../../api/wishlistApi';
import { Package, Plus, BarChart3,
         Star, MapPin, Calendar, 
         Clock, MessageCircle, 
         Users, Heart, Shield, 
         UserPlus, UserCheck, UserMinus 
        } from "lucide-react";

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
    
    // State để lưu buyerId của user hiện tại (từ localStorage)
    const currentUserBuyerId = localStorage.getItem("buyerId");
   // const currentSellerId = localStorage.getItem("sellerId");
    // State để lưu buyerId của seller đang được xem (từ seller profile)
    const [viewedSellerBuyerId, setViewedSellerBuyerId] = useState(null);
    
    // Kiểm tra xem user có đang xem chính profile của mình không
    // So sánh buyerId vì seller được nâng cấp từ buyer và sellerId có thể khác buyerId
    // QUAN TRỌNG: Chỉ true khi cả hai buyerId đều tồn tại và khớp nhau
    const isViewingOwnProfile = !!(
        currentUserBuyerId && 
        viewedSellerBuyerId && 
        (String(currentUserBuyerId) === String(viewedSellerBuyerId) || 
         Number(currentUserBuyerId) === Number(viewedSellerBuyerId))
    );
    
    // following feature 

    const [isFollowing, setIsFollowing] = useState(false); // Trạng thái follow
    const [followLoading, setFollowLoading] = useState(false); // Loading khi bấm nút

    console.log("[Seller] sellerId from URL:", sellerId);
    console.log("[Seller] currentUserBuyerId:", currentUserBuyerId);
    console.log("[Seller] viewedSellerBuyerId:", viewedSellerBuyerId);
    console.log("[Seller] isViewingOwnProfile (based on buyerId):", isViewingOwnProfile);

    // Bước 1: Lấy sản phẩm của seller
    // Luôn dùng getProductsBySeller, sau đó merge dữ liệu sold từ getMyPosts nếu đang xem profile của chính mình
    useEffect(() => {
        let mounted = true;
        if (sellerId) {
            console.log("[Seller] Fetching products for sellerId from URL:", sellerId);
            setProductsLoading(true);
            
            // Lấy products từ getProductsBySeller
            const productsPromise = sellerApi.getProductsBySeller(sellerId, { page: 0, size: 100 });
            
            // Luôn gọi getMyPosts nếu có accessToken (đang đăng nhập) để merge dữ liệu sold
            // getMyPosts chỉ trả về posts của user hiện tại, nên chỉ merge khi đúng seller
            const accessToken = localStorage.getItem("accessToken");
            const shouldFetchMyPosts = !!accessToken;
            
            console.log("[Seller] Checking if should fetch myPosts:", {
                hasAccessToken: !!accessToken,
                shouldFetchMyPosts,
                sellerId
            });
            
            // Gọi getMyPosts để lấy dữ liệu sold chính xác
            const myPostsPromise = shouldFetchMyPosts ? sellerApi.getMyPosts(0, 100).catch((err) => {
                console.error("[Seller] Error fetching myPosts for merge:", err);
                return null;
            }) : Promise.resolve(null);
            
            Promise.all([productsPromise, myPostsPromise])
                .then(([items, myPostsResponse]) => {
                    if (!mounted) return;
                    
                    const allItems = Array.isArray(items) ? items : [];
                    console.log("[Seller] Received products from API:", allItems.length, "items");
                    
                    // Filter để chỉ lấy posts của sellerId đúng
                    let filteredProducts = allItems.filter(post => {
                        const postSellerId = post.sellerId || post.seller_id || post.seller?.id || post.seller?.sellerId;
                        const matches = String(postSellerId) === String(sellerId) || Number(postSellerId) === Number(sellerId);
                        return matches;
                    });
                    
                    // Nếu có dữ liệu từ getMyPosts, merge trường sold vào products dựa trên postId
                    // getMyPosts chỉ trả về posts của user hiện tại, nên nếu có data thì merge
                    if (myPostsResponse) {
                        const myPosts = myPostsResponse?.data?.data?.content || [];
                        console.log("[Seller] Merging sold data from getMyPosts:", myPosts.length, "posts");
                        console.log("[Seller] Sample myPost sold:", myPosts[0] ? {
                            postId: myPosts[0].postId || myPosts[0].id,
                            sold: myPosts[0].sold,
                            soldType: typeof myPosts[0].sold
                        } : "No posts");
                        
                        // Tạo map từ postId -> sold
                        const soldMap = new Map();
                        myPosts.forEach(post => {
                            const postId = post.postId || post.id;
                            if (postId) {
                                const sold = post.sold === true || post.sold === 1 || post.sold === "true" || String(post.sold).toLowerCase() === "true";
                                soldMap.set(String(postId), sold);
                                console.log("[Seller] Added to soldMap:", { postId: String(postId), sold });
                            }
                        });
                        
                        console.log("[Seller] soldMap size:", soldMap.size);
                        console.log("[Seller] soldMap entries:", Array.from(soldMap.entries()));
                        
                        // Merge sold vào filteredProducts
                        filteredProducts = filteredProducts.map(product => {
                            const postId = product.postId || product.id;
                            const postIdStr = postId ? String(postId) : null;
                            const soldFromMyPosts = postIdStr ? soldMap.get(postIdStr) : undefined;
                            
                            if (soldFromMyPosts !== undefined) {
                                console.log("[Seller] Merging sold for postId:", postIdStr, "sold:", soldFromMyPosts);
                                return {
                                    ...product,
                                    sold: soldFromMyPosts,
                                    isSold: soldFromMyPosts,
                                    is_sold: soldFromMyPosts
                                };
                            } else if (postIdStr) {
                                console.log("[Seller] No sold data found for postId:", postIdStr, "in soldMap");
                            }
                            return product;
                        });
                        
                        console.log("[Seller] After merge - Sample products sold:", filteredProducts.slice(0, 3).map(p => ({
                            postId: p.postId || p.id,
                            sold: p.sold
                        })));
                    } else {
                        console.log("[Seller] Not merging sold data - shouldFetchMyPosts:", shouldFetchMyPosts, "myPostsResponse:", !!myPostsResponse);
                    }
                    
                    console.log("[Seller] Final filtered products:", filteredProducts.length, "items");
                    setProducts(filteredProducts);
                    setProductsError(null);
                })
                .catch((error) => {
                    if (!mounted) return;
                    console.error("[Seller] Error fetching products:", error);
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
    // Và lấy buyerId của seller để so sánh với buyerId của user hiện tại
    useEffect(() => {
        let mounted = true;
        if (Array.isArray(products) && products.length > 0) {
            const firstPost = products[0];
            const postId = firstPost.postId || firstPost.id;
            
            // KHÔNG lấy buyerId từ post data vì có thể sai
            // Chỉ lấy buyerId từ API getSellerByProductId để đảm bảo chính xác
            console.log("[Seller] Will get buyerId from seller API, not from post data");
            
            if (postId) {
                setSellerLoading(true);
                sellerApi.getSellerByProductId(postId)
                    .then(data => {
                        if (!mounted) return;
                        if (data) {
                            console.log("[Seller] Seller data from API:", data);
                            setSeller(data);
                            
                            // Lấy buyerId của seller từ seller profile
                            // QUAN TRỌNG: Chỉ lấy buyerId thực sự từ API, không dùng fallback
                            const sellerBuyerId = data.buyerId || data.buyer_id || 
                                                 data.seller?.buyerId || data.seller?.buyer_id;
                            
                            console.log("[Seller] Seller buyerId from API:", sellerBuyerId);
                            console.log("[Seller] Current user buyerId:", currentUserBuyerId);
                            
                            if (sellerBuyerId && !isNaN(Number(sellerBuyerId))) {
                                setViewedSellerBuyerId(sellerBuyerId);
                                console.log("[Seller] Set viewedSellerBuyerId to:", sellerBuyerId);
                            } else {
                                console.warn("[Seller] No valid buyerId found in API response, assuming viewing other seller");
                                setViewedSellerBuyerId(null); // Set null để isViewingOwnProfile = false
                            }
                            setSellerError(null);
                        } else {
                            // Nếu không lấy được từ API, mặc định là xem cửa hàng người khác
                            console.warn("[Seller] Cannot get seller info from API, assuming viewing other seller's profile");
                            setViewedSellerBuyerId(null); // Set null để isViewingOwnProfile = false
                            setSeller(null);
                            setSellerError("Không tìm thấy seller.");
                        }
                    })
                    .catch(() => {
                        if (!mounted) return;
                        // Nếu API lỗi, mặc định là xem cửa hàng người khác
                        console.warn("[Seller] API error, assuming viewing other seller's profile");
                        setViewedSellerBuyerId(null); // Set null để isViewingOwnProfile = false
                        setSeller(null);
                        setSellerError("Không tìm thấy seller.");
                    })
                    .finally(() => {
                        if (!mounted) return;
                        setSellerLoading(false);
                    });
            } else {
                // Không có postId, không thể lấy buyerId, mặc định là xem cửa hàng người khác
                console.warn("[Seller] No postId available, cannot determine buyerId, assuming viewing other seller");
                setViewedSellerBuyerId(null);
            }
        } else if (!productsLoading) {
            setSeller(null);
            setViewedSellerBuyerId(null);
        }
        return () => { mounted = false; };
    }, [products, productsLoading, currentUserBuyerId]);

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
    
    // Xác định sản phẩm đã bán: chỉ kiểm tra trường sold từ backend
    const getSold = (product) => {
        // Kiểm tra nhiều định dạng có thể có
        return product.sold === true || 
               product.sold === 1 || 
               product.sold === "true" ||
               String(product.sold).toLowerCase() === "true";
    };
    
    // Filter theo trạng thái (đang hiển thị / đã bán)
    // Logic đồng bộ với ManagePosts.jsx
    const filtered = typeFiltered.filter(p => {
        const sold = getSold(p);
        
        // Debug log để kiểm tra
        if (postFilter === 'sold') {
            console.log("[Seller] Filtering sold posts - postId:", p.postId || p.id, "sold:", p.sold, "getSold result:", sold);
        }
        
        if (postFilter === 'sold') {
            return sold;
        } else {
            // Đang hiển thị: active + not sold + not rejected
            // Logic giống ManagePosts.jsx
            const isActive = p.active !== false && p.active !== 0;
            const isNotSold = !sold;
            const isNotRejected = p.verifiedDecisionStatus !== "REJECTED";
            return isActive && isNotSold && isNotRejected;
        }
    });
    
    // Đếm số lượng - logic đồng bộ với ManagePosts.jsx
    const displayingCount = typeFiltered.filter(p => {
        const sold = getSold(p);
        const isActive = p.active !== false && p.active !== 0;
        const isNotSold = !sold;
        const isNotRejected = p.verifiedDecisionStatus !== "REJECTED";
        return isActive && isNotSold && isNotRejected;
    }).length;
    
    const soldCount = typeFiltered.filter(p => {
        return getSold(p);
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

    // xu ly phan following
    // useEffect(() => {
    //     let mounted = true;
    //     const accessToken = localStorage.getItem("accessToken");
        
    //     // Chỉ check khi đã đăng nhập, có sellerId và KHÔNG phải xem shop mình
    //     if (accessToken && sellerId && !isViewingOwnProfile) {
    //         sellerApi.checkFollowStatus(sellerId)
    //             .then((response) => {
    //                 if (!mounted) return;
    //                 // JSON trả về: { success: true, data: { isFollowing: true/false, ... } }
    //                 if (response && response.success && response.data) {
    //                     setIsFollowing(response.data.isFollowing);
    //                 }
    //             })
    //             .catch((err) => {
    //                 console.error("[Seller] Error checking follow status:", err);
    //             });
    //     }
    //     return () => { mounted = false; };
    // }, [sellerId, isViewingOwnProfile]);

     useEffect(() => {
        let mounted = true;
        const accessToken = localStorage.getItem("accessToken");
        
        // [TEST MODE] Đã comment điều kiện !isViewingOwnProfile để hiện nút cho bạn test
        if (accessToken && sellerId /* && !isViewingOwnProfile */) {
            sellerApi.checkFollowStatus(sellerId)
                .then((response) => {
                    if (!mounted) return;
                    if (response && response.success && response.data) {
                        setIsFollowing(response.data.isFollowing);
                    }
                })
                .catch((err) => console.error("[Seller] Error checking follow status:", err));
        }
        return () => { mounted = false; };
    }, [sellerId, isViewingOwnProfile]);

    // ========================================================================
    // === 2. HÀM XỬ LÝ LOGIC BẤM NÚT (POST / DELETE API) ===
    // ========================================================================
    // const handleFollowAction = async () => {
    //     const accessToken = localStorage.getItem("accessToken");
        
    //     // 1. Validate Login
    //     if (!accessToken) {
    //         alert("Vui lòng đăng nhập để thực hiện chức năng này!");
    //         return;
    //     }

    //     // 2. Chặn spam click
    //     if (followLoading) return;

    //     // === TRƯỜNG HỢP A: ĐANG FOLLOW -> MUỐN HỦY (DELETE) ===
    //     if (isFollowing) {
    //         // Popup xác nhận Yes/No
    //         const confirmUnfollow = window.confirm("Bạn muốn bỏ theo dõi người bán chứ?");
            
    //         if (confirmUnfollow) { // Nếu chọn YES
    //             setFollowLoading(true);
    //             try {
    //                 console.log("[Seller] Action: Unfollow");
    //                 const res = await sellerApi.unfollowSeller(sellerId);
                    
    //                 if (res && res.success) {
    //                     setIsFollowing(false); // Đổi nút về "Theo dõi"
                        
    //                     // Giảm số follower hiển thị ngay lập tức (Optimistic Update)
    //                     if (seller) {
    //                         setSeller(prev => ({ 
    //                             ...prev, 
    //                             followerCount: Math.max(0, (prev.followerCount || 0) - 1) 
    //                         }));
    //                     }
    //                 }
    //             } catch (error) {
    //                 console.error(error);
    //                 alert("Lỗi khi bỏ theo dõi.");
    //             } finally {
    //                 setFollowLoading(false);
    //             }
    //         }
    //     } 
        
    //     // === TRƯỜNG HỢP B: CHƯA FOLLOW -> MUỐN THEO DÕI (POST) ===
    //     else {
    //         setFollowLoading(true);
    //         try {
    //             console.log("[Seller] Action: Follow");
    //             const res = await sellerApi.followSeller(sellerId);
                
    //             if (res && res.success) {
    //                 setIsFollowing(true); // Đổi nút thành "Bỏ theo dõi"
                    
    //                 // Lấy tên Shop từ Response để hiện Popup
    //                 // Cấu trúc JSON: { data: { seller: { storeName: "..." } } }
    //                 const storeName = res.data?.seller?.storeName || res.data?.seller?.sellerName || "Shop này";
                    
    //                 // Popup thông báo thành công
    //                 alert(`Bạn đã theo dõi "${storeName}" thành công!`);

    //                 // Tăng số follower hiển thị ngay lập tức
    //                 if (seller) {
    //                     setSeller(prev => ({ 
    //                         ...prev, 
    //                         followerCount: (prev.followerCount || 0) + 1 
    //                     }));
    //                 }
    //             }
    //         } catch (error) {
    //             console.error("[Seller] Follow error:", error);
    //             const msg = error?.response?.data?.message || "";
    //             const errData = error?.response?.data?.error || "";

    //             // Validate: Không cho tự follow
    //             if (msg.includes("Cannot follow yourself") || errData.includes("Cannot follow yourself")) {
    //                 alert("Bạn không thể tự theo dõi chính mình!");
    //             } 
    //             // Validate: Đã follow rồi (đồng bộ lại UI)
    //             else if (msg.includes("Already following") || errData.includes("Already following")) {
    //                 setIsFollowing(true); 
    //                 alert("Hệ thống cập nhật: Bạn đang theo dõi shop này rồi.");
    //             } else {
    //                 alert("Có lỗi xảy ra, vui lòng thử lại.");
    //             }
    //         } finally {
    //             setFollowLoading(false);
    //         }
    //     }
    // };

    const handleFollowAction = async () => {
        const accessToken = localStorage.getItem("accessToken");
        
        if (!accessToken) {
            alert("Vui lòng đăng nhập để thực hiện chức năng này!");
            return;
        }

        if (followLoading) return;

        // A: UNFOLLOW
        if (isFollowing) {
            const confirm = window.confirm("Bạn có chắc chắn muốn bỏ theo dõi người bán này không?");
            
            if (confirm) {
                setFollowLoading(true);
                try {
                    const res = await sellerApi.unfollowSeller(sellerId);
                    if (res && res.success) {
                        setIsFollowing(false);
                        if (seller) {
                            setSeller(prev => ({ 
                                ...prev, 
                                followerCount: Math.max(0, (prev.followerCount || 0) - 1) 
                            }));
                        }
                    } else {
                        alert(res?.message || "Lỗi khi bỏ theo dõi.");
                    }
                } catch (error) {
                    console.error(error);
                    alert("Lỗi kết nối khi bỏ theo dõi.");
                } finally {
                    setFollowLoading(false);
                }
            }
        } 
        // B: FOLLOW
        else {
            setFollowLoading(true);
            try {
                const res = await sellerApi.followSeller(sellerId);
                
                // 1. THÀNH CÔNG
                if (res && res.success) {
                    setIsFollowing(true); 
                    const storeName = res.data?.seller?.storeName || "Shop này";
                    alert(`Bạn đã theo dõi "${storeName}" thành công!`);

                    if (seller) {
                        setSeller(prev => ({ 
                            ...prev, 
                            followerCount: (prev.followerCount || 0) + 1 
                        }));
                    }
                } 
                // 2. THẤT BẠI LOGIC (HTTP 200 nhưng success: false)
                else {
                    console.log("Follow logic failed:", res);
                    const msg = res?.message || "";
                    const errText = res?.error || "";

                    // Check lỗi tự follow
                    if (msg.includes("Cannot follow yourself") || errText.includes("Cannot follow yourself")) {
                        alert("Bạn không thể tự theo dõi chính mình!"); 
                    } 
                    // Check lỗi đã follow rồi
                    else if (msg.includes("Already following") || errText.includes("Already following")) {
                        setIsFollowing(true); 
                        alert("Hệ thống cập nhật: Bạn đang theo dõi shop này rồi.");
                    } else {
                        alert(msg || "Có lỗi xảy ra, vui lòng thử lại.");
                    }
                }
            } catch (error) {
                // 3. LỖI MẠNG (HTTP 400, 500)
                console.error("[Seller] Follow network error:", error);
                const resData = error?.response?.data || {};
                const msg = resData.message || "";
                const errText = resData.error || "";

                if (msg.includes("Cannot follow yourself") || errText.includes("Cannot follow yourself")) {
                    alert("Bạn không thể tự theo dõi chính mình!");
                } else if (msg.includes("Already following")) {
                    setIsFollowing(true); 
                    alert("Hệ thống cập nhật: Bạn đang theo dõi shop này rồi.");
                } else {
                    alert(msg || errText || "Có lỗi xảy ra, vui lòng thử lại.");
                }
            } finally {
                setFollowLoading(false);
            }
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

                            {/* 6. NÚT THEO DÕI (MỚI THÊM - QUAN TRỌNG NHẤT) */}
                            {/* Logic: Ẩn nếu đang xem chính mình. Nút đổi màu/icon dựa trên isFollowing */}
                            {!isViewingOwnProfile && (
                                <>
                                    <button 
                                        onClick={handleFollowAction}
                                        disabled={followLoading}
                                        className={`follow-btn ${isFollowing ? 'unfollow-mode' : 'follow-mode'}`}
                                    >
                                        {followLoading ? (
                                            <span className="loader-dots">...</span>
                                        ) : isFollowing ? (
                                            <>
                                                <UserMinus size={18} />
                                                <span>Bỏ theo dõi</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={18} />
                                                <span>Theo dõi</span>
                                            </>
                                        )}
                                    </button>
                                    
                                    {/* Tag trạng thái nhỏ bên dưới nút (chỉ hiện khi đang follow) */}
                                    {isFollowing && (
                                        <div className="following-status-tag">
                                            <UserCheck size={14} /> Đang theo dõi
                                        </div>
                                    )}
                                </>
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
                                const sold = getSold(p);
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
                                        className={`product-card ${sold ? 'sold' : ''}`} 
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
                                                {sold && <div className="sold-overlay">
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


