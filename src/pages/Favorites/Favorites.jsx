import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MessageCircle, Trash2, Loader2 } from "lucide-react";
import "./Favorites.css";
import { fetchWishlist, removeFromWishlist } from "../../api/wishlistApi";

export function Favorites() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState("date"); // date | priceLow | priceHigh | batteryType
    const [priorityFilter, setPriorityFilter] = useState(null); // null | "LOW" | "MEDIUM" | "HIGH"
    const [displayPage, setDisplayPage] = useState(1); // Client-side pagination (1-indexed)
    const [pageSize] = useState(4); // Fixed page size for display
    const [removingId, setRemovingId] = useState(null);

    // Fetch wishlist from API - lấy tất cả items vì cần sort và filter client-side
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        // Lấy nhiều items hơn để đảm bảo có đủ sau khi filter
        fetchWishlist({
            page: 0,
            size: 100, // Lấy nhiều items để sort và paginate client-side
            priority: priorityFilter,
        })
            .then((result) => {
                if (!mounted) return;

                // Items đã được filter và validate trong wishlistApi, chỉ cần kiểm tra lại
                const validItems = (result.items || []).filter((item) => {
                    // Item phải có wishlistId
                    if (!item.wishlistId) return false;

                    // Item phải có product ID hợp lệ
                    const rawProductId = item.postId || item.id;
                    if (!rawProductId) return false;

                    const productIdNum = Number(rawProductId);
                    if (isNaN(productIdNum) || productIdNum <= 0 || !Number.isInteger(productIdNum)) {
                        return false;
                    }

                    return true;
                });

                setItems(validItems);
            })
            .catch((err) => {
                if (!mounted) return;
                console.error("Error fetching wishlist:", err);

                // Xử lý các loại lỗi khác nhau
                let errorMessage = "Không thể tải danh sách yêu thích";
                if (err?.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err?.message) {
                    errorMessage = err.message;
                } else if (err?.response?.status === 401) {
                    errorMessage = "Vui lòng đăng nhập để xem danh sách yêu thích";
                } else if (err?.response?.status >= 500) {
                    errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau";
                }

                setError(errorMessage);
                setItems([]);
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [priorityFilter]); // Chỉ refetch khi priority filter thay đổi

    // Client-side sorting (since API doesn't support sorting)
    const sortedItems = useMemo(() => {
        let list = [...items];

        // Sắp xếp
        if (sortBy === "date") {
            // Sort by addedAt (newest first)
            list.sort((a, b) => {
                const dateA = new Date(a.addedAt || 0);
                const dateB = new Date(b.addedAt || 0);
                return dateB - dateA; // Newest first
            });
        } else if (sortBy === "priceLow") {
            list.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === "priceHigh") {
            list.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortBy === "batteryType") {
            list.sort((a, b) => (a.batteryType || "").localeCompare(b.batteryType || ""));
        }

        return list;
    }, [items, sortBy]);

    // Client-side pagination
    const totalElements = sortedItems.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

    // Ensure page is valid when items change
    useEffect(() => {
        if (displayPage > totalPages && totalPages > 0) {
            setDisplayPage(1);
        }
    }, [totalPages, displayPage]);

    // Get items for current page
    const pagedItems = useMemo(() => {
        const start = (displayPage - 1) * pageSize;
        return sortedItems.slice(start, start + pageSize);
    }, [sortedItems, displayPage, pageSize]);

    const handleRemove = async (wishlistId) => {
        // Validate wishlistId
        if (!wishlistId) {
            console.error("[Favorites] Không tìm thấy wishlistId để xóa");
            alert("Không tìm thấy ID sản phẩm yêu thích. Vui lòng thử lại.");
            return;
        }

        // Validate wishlistId là số hợp lệ
        const normalizedWishId = Number(wishlistId);
        if (isNaN(normalizedWishId) || normalizedWishId <= 0 || !Number.isInteger(normalizedWishId)) {
            console.error("[Favorites] wishlistId không hợp lệ:", wishlistId);
            alert("ID sản phẩm yêu thích không hợp lệ. Vui lòng thử lại.");
            return;
        }

        // Confirm với user
        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?")) {
            return;
        }

        setRemovingId(normalizedWishId);
        try {
            // Gọi API remove từ wishlist (POST /api/v1/buyer/remove-wish-list/{wishId})
            const result = await removeFromWishlist(normalizedWishId);

            if (!result.success) {
                throw new Error(result.message || "Không thể xóa sản phẩm khỏi danh sách yêu thích");
            }

            // Remove item from local state immediately for better UX
            setItems((prev) => {
                const updated = prev.filter((item) => {
                    // So sánh cả number và string để đảm bảo match
                    const itemWishId = Number(item.wishlistId);
                    return itemWishId !== normalizedWishId;
                });

                // If current page becomes empty and not on first page, go to previous page
                const remainingAfterSort = [...updated].sort((a, b) => {
                    const dateA = new Date(a.addedAt || 0);
                    const dateB = new Date(b.addedAt || 0);
                    return dateB - dateA;
                });
                const remainingTotalPages = Math.max(1, Math.ceil(remainingAfterSort.length / pageSize));
                if (remainingTotalPages < displayPage && remainingTotalPages > 0) {
                    setDisplayPage(remainingTotalPages);
                } else if (remainingAfterSort.length === 0 && displayPage > 1) {
                    setDisplayPage(1);
                }

                return updated;
            });

            // Hiển thị thông báo thành công (optional, có thể bỏ nếu không cần)
            console.log("[Favorites] Đã xóa sản phẩm khỏi wishlist:", result.message);
        } catch (err) {
            console.error("[Favorites] Error removing from wishlist:", err);

            // Hiển thị thông báo lỗi chi tiết
            const errorMessage = err?.message ||
                err?.response?.data?.message ||
                "Không thể xóa sản phẩm khỏi danh sách yêu thích";

            alert(errorMessage);
        } finally {
            setRemovingId(null);
        }
    };

    const handleChatWithSeller = () => {
        // Navigate to chat page
        window.location.href = `/chat`;
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case "date": return "Ngày thêm";
            case "priceLow": return "Giá: Thấp đến Cao";
            case "priceHigh": return "Giá: Cao đến Thấp";
            case "batteryType": return "Loại Pin";
            default: return "Ngày thêm";
        }
    };

    const getPriorityFilterLabel = () => {
        switch (priorityFilter) {
            case null: return "Tất cả Ưu tiên";
            case "LOW": return "Ưu tiên: Thấp";
            case "MEDIUM": return "Ưu tiên: Trung bình";
            case "HIGH": return "Ưu tiên: Cao";
            default: return "Tất cả Ưu tiên";
        }
    };

    // Pagination helpers
    const getVisiblePages = () => {
        const maxVisible = 7;
        const pages = [];

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (displayPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('ellipsis');
                pages.push(totalPages);
            } else if (displayPage >= totalPages - 3) {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = displayPage - 1; i <= displayPage + 1; i++) pages.push(i);
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const handlePageChange = (newPage) => {
        // newPage is 1-indexed
        setDisplayPage(Math.max(1, Math.min(newPage, totalPages)));
    };

    return (
        <div className="wishlist-page">
            <div className="wishlist-container">
                <h1 className="wishlist-title">Danh sách yêu thích</h1>

                {loading && items.length === 0 ? (
                    <div className="wishlist-loading">
                        <Loader2 className="spinner" size={48} />
                        <p>Đang tải danh sách yêu thích...</p>
                    </div>
                ) : error && items.length === 0 ? (
                    <div className="wishlist-error">
                        <p>{error}</p>
                        <button
                            className="retry-btn"
                            onClick={() => {
                                setDisplayPage(1);
                                setError(null);
                            }}
                        >
                            Thử lại
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="wishlist-empty">
                        <p>Chưa có sản phẩm yêu thích</p>
                    </div>
                ) : (
                    <>
                        <div className="wishlist-filters">
                            <div className="filter-dropdown">
                                <button
                                    className="filter-dropdown-btn"
                                    onClick={() => {
                                        const options = ["date", "priceLow", "priceHigh", "batteryType"];
                                        const currentIndex = options.indexOf(sortBy);
                                        setSortBy(options[(currentIndex + 1) % options.length]);
                                        setDisplayPage(1); // Reset to first page when sort changes
                                    }}
                                >
                                    <span>Sắp xếp theo: {getSortLabel()}</span>
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            <div className="filter-dropdown">
                                <button
                                    className="filter-dropdown-btn"
                                    onClick={() => {
                                        const options = [null, "LOW", "MEDIUM", "HIGH"];
                                        const currentIndex = options.indexOf(priorityFilter);
                                        const nextIndex = (currentIndex + 1) % options.length;
                                        setPriorityFilter(options[nextIndex]);
                                        setDisplayPage(1); // Reset to first page when filter changes
                                    }}
                                >
                                    <span>{getPriorityFilterLabel()}</span>
                                    <ChevronDown size={16} />
                                </button>
                            </div>
                        </div>

                        {loading && (
                            <div className="wishlist-loading-overlay">
                                <Loader2 className="spinner" size={32} />
                            </div>
                        )}

                        <div className="wishlist-grid">
                            {pagedItems
                                .filter((product) => {
                                    // Additional safety check: ensure product has valid ID (integer)
                                    const rawId = product.postId || product.id;
                                    if (!rawId) return false;

                                    const idNum = Number(rawId);
                                    // Phải là số nguyên dương, không phải số thập phân
                                    return !isNaN(idNum) && idNum > 0 && Number.isInteger(idNum);
                                })
                                .map((product) => {
                                    // Đảm bảo chỉ dùng postId hoặc id hợp lệ (số nguyên)
                                    const rawId = product.postId || product.id;
                                    const productIdNum = Number(rawId);

                                    // Validate: phải là số nguyên dương
                                    if (!rawId || isNaN(productIdNum) || productIdNum <= 0 || !Number.isInteger(productIdNum)) {
                                        console.error('[Favorites] Invalid product ID:', {
                                            rawId,
                                            postId: product.postId,
                                            id: product.id,
                                            product
                                        });
                                        return null; // Skip invalid product
                                    }

                                    // Đảm bảo productIdNum là số nguyên hợp lệ trước khi convert sang string
                                    if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
                                        console.error('[Favorites] Product ID is not a valid integer:', {
                                            productIdNum,
                                            rawId,
                                            product
                                        });
                                        return null;
                                    }

                                    // Đảm bảo productId là số nguyên
                                    const finalProductId = String(Math.floor(productIdNum));
                                    const sellerId = product.sellerId ? String(product.sellerId) : null;

                                    // Xử lý ảnh - đảm bảo luôn có fallback
                                    const productImage = product.image || product.images?.[0];
                                    const displayImage = (productImage && typeof productImage === 'string' && productImage.trim() !== '')
                                        ? productImage
                                        : "/default-avatar.png";

                                    return (
                                        <div key={product.wishlistId || finalProductId} className="wishlist-card">
                                            <a className="wishlist-card-image" href={`/product/${finalProductId}`}>
                                                <img
                                                    src={displayImage}
                                                    alt={product.title || "Sản phẩm"}
                                                    onError={(e) => {
                                                        if (e.target.src !== "/default-avatar.png") {
                                                            e.target.src = "/default-avatar.png";
                                                        }
                                                    }}
                                                    loading="lazy"
                                                />
                                            </a>
                                            <div className="wishlist-card-content">
                                                <a
                                                    className="wishlist-card-title"
                                                    href={`/product/${finalProductId}`}
                                                    title={product.title}
                                                >
                                                    {product.title || "Sản phẩm không có tên"}
                                                </a>
                                                {product.sellerName && sellerId && (
                                                    <div className="wishlist-card-seller">
                                                        Bán bởi:{" "}
                                                        <a href={`/seller/${sellerId}`} className="seller-link">
                                                            {product.sellerName}
                                                        </a>
                                                    </div>
                                                )}
                                                <div className="wishlist-card-price">
                                                    {product.price ? product.price.toLocaleString("vi-VN") : "0"} ₫
                                                </div>
                                                {product.priority && (
                                                    <div className="wishlist-card-priority">
                                                        Ưu tiên: <span className={`priority-badge priority-${product.priority.toLowerCase()}`}>
                                                            {product.priority === "HIGH" ? "Cao" : product.priority === "MEDIUM" ? "Trung bình" : "Thấp"}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="wishlist-card-actions">
                                                    <button
                                                        className="wishlist-btn-chat"
                                                        onClick={() => handleChatWithSeller()}
                                                        disabled={!sellerId}
                                                    >
                                                        <MessageCircle size={16} />
                                                        Chat với người bán
                                                    </button>
                                                    <button
                                                        className="wishlist-btn-delete"
                                                        onClick={() => {
                                                            const wishId = product.wishlistId;
                                                            if (!wishId) {
                                                                console.error('[Favorites] Product missing wishlistId:', product);
                                                                alert('Không tìm thấy ID sản phẩm yêu thích');
                                                                return;
                                                            }
                                                            handleRemove(wishId);
                                                        }}
                                                        disabled={removingId === Number(product.wishlistId) || !product.wishlistId}
                                                        title={product.wishlistId ? "Xóa khỏi danh sách yêu thích" : "Không thể xóa"}
                                                    >
                                                        {removingId === Number(product.wishlistId) ? (
                                                            <Loader2 size={16} className="spinning" />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                                .filter(Boolean)
                            }
                        </div>

                        {totalPages > 1 && sortedItems.length > 0 && (
                            <div className="wishlist-pagination">
                                <button
                                    className="pagination-btn pagination-btn-prev"
                                    disabled={displayPage <= 1 || loading}
                                    onClick={() => handlePageChange(displayPage - 1)}
                                    aria-label="Trang trước"
                                >
                                    ‹
                                </button>

                                <div className="pagination-numbers">
                                    {getVisiblePages().map((pageNum, idx) => {
                                        if (pageNum === "ellipsis") {
                                            return (
                                                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                                                    ...
                                                </span>
                                            );
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`pagination-number ${pageNum === displayPage ? "active" : ""}`}
                                                onClick={() => handlePageChange(pageNum)}
                                                disabled={loading}
                                                aria-label={`Trang ${pageNum}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    className="pagination-btn pagination-btn-next"
                                    disabled={displayPage >= totalPages || loading}
                                    onClick={() => handlePageChange(displayPage + 1)}
                                    aria-label="Trang sau"
                                >
                                    ›
                                </button>
                            </div>
                        )}

                        {sortedItems.length > 0 && (
                            <div className="wishlist-info">
                                Hiển thị {pagedItems.length} trên trang {displayPage} / {totalPages} • Tổng {totalElements} sản phẩm
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Favorites;
