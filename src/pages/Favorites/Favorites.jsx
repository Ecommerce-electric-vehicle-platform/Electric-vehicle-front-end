import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Trash2, Loader2, Search, CheckSquare, Square, Heart } from "lucide-react";
import "./Favorites.css";
import { fetchWishlist, removeFromWishlist } from "../../api/wishlistApi";
import { ConfirmationDialog } from "../../components/ConfirmationDialog/ConfirmationDialog";
import { PRODUCT_TYPE_FILTERS, matchesProductTypeFilter } from "../../utils/productType";

export function Favorites() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, _setSortBy] = useState("date"); // date | priceLow | priceHigh | batteryType
    const [priorityFilter, _setPriorityFilter] = useState(null); // null | "LOW" | "MEDIUM" | "HIGH"
    const [displayPage, setDisplayPage] = useState(1); // Client-side pagination (1-indexed)
    const [pageSize] = useState(4); // Fixed page size for display
    const [removingId, setRemovingId] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingWishlistId, setPendingWishlistId] = useState(null);
    const [pageInputValue, setPageInputValue] = useState('');
    const [selectedItems, setSelectedItems] = useState(new Set()); // Bulk selection
    const [searchQuery, setSearchQuery] = useState(''); // Search filter
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [productTypeFilter, setProductTypeFilter] = useState(PRODUCT_TYPE_FILTERS.ALL);

    const handleProductTypeFilterChange = (nextFilter) => {
        setProductTypeFilter((prev) => {
            const updated = prev === nextFilter ? PRODUCT_TYPE_FILTERS.ALL : nextFilter;
            return updated;
        });
        setDisplayPage(1);
    };

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

    // Client-side sorting and filtering (since API doesn't support sorting)
    const sortedItems = useMemo(() => {
        let list = [...items];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter((item) => {
                const title = (item.title || "").toLowerCase();
                const brand = (item.brand || "").toLowerCase();
                const model = (item.model || "").toLowerCase();
                const sellerName = (item.sellerName || "").toLowerCase();
                return (
                    title.includes(query) ||
                    brand.includes(query) ||
                    model.includes(query) ||
                    sellerName.includes(query)
                );
            });
        }

        if (productTypeFilter !== "all") {
            list = list.filter((item) =>
                matchesProductTypeFilter(item, productTypeFilter)
            );
        }

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
    }, [items, sortBy, searchQuery, productTypeFilter]);

    // Client-side pagination
    const totalElements = sortedItems.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

    // Ensure page is valid when items change
    useEffect(() => {
        if (displayPage > totalPages && totalPages > 0) {
            setDisplayPage(1);
        }
    }, [totalPages, displayPage]);

    // Clear selections when page changes or search changes
    useEffect(() => {
        setSelectedItems(new Set());
        setShowBulkActions(false);
    }, [displayPage, searchQuery, productTypeFilter]);

    // Get items for current page
    const pagedItems = useMemo(() => {
        const start = (displayPage - 1) * pageSize;
        return sortedItems.slice(start, start + pageSize);
    }, [sortedItems, displayPage, pageSize]);

    const handleRemoveClick = (wishlistId) => {
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

        // Hiển thị dialog xác nhận
        setPendingWishlistId(normalizedWishId);
        setShowConfirmDialog(true);
    };

    const handleConfirmRemove = async () => {
        // Check if this is bulk delete
        if (selectedItems.size > 0 && !pendingWishlistId) {
            return handleConfirmBulkDelete();
        }

        if (!pendingWishlistId) return;

        const normalizedWishId = pendingWishlistId;
        setShowConfirmDialog(false);
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
            setPendingWishlistId(null);
        }
    };

    const handleCancelRemove = () => {
        setShowConfirmDialog(false);
        // Only clear pendingWishlistId if it's a single delete
        if (selectedItems.size === 0) {
            setPendingWishlistId(null);
        }
    };

    const handleChatWithSeller = () => {
        // Navigate to chat page
        window.location.href = `/chat`;
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
        const validPage = Math.max(1, Math.min(newPage, totalPages));
        setDisplayPage(validPage);
        setPageInputValue('');
    };

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        if (value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= totalPages)) {
            setPageInputValue(value);
        }
    };

    const handlePageInputSubmit = (e) => {
        e.preventDefault();
        if (pageInputValue && pageInputValue !== '') {
            const pageNum = Number(pageInputValue);
            if (pageNum >= 1 && pageNum <= totalPages) {
                handlePageChange(pageNum);
            }
        }
    };

    const handleFirstPage = () => {
        handlePageChange(1);
    };

    const handleLastPage = () => {
        handlePageChange(totalPages);
    };

    // Bulk selection handlers
    const handleSelectAll = () => {
        if (selectedItems.size === pagedItems.length) {
            setSelectedItems(new Set());
            setShowBulkActions(false);
        } else {
            const allIds = new Set(pagedItems.map(item => item.wishlistId));
            setSelectedItems(allIds);
            setShowBulkActions(true);
        }
    };

    const handleSelectItem = (wishlistId) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(wishlistId)) {
            newSelected.delete(wishlistId);
        } else {
            newSelected.add(wishlistId);
        }
        setSelectedItems(newSelected);
        setShowBulkActions(newSelected.size > 0);
    };

    const handleBulkDelete = () => {
        if (selectedItems.size === 0) return;
        setShowConfirmDialog(true);
    };

    const handleConfirmBulkDelete = async () => {
        if (selectedItems.size === 0) return;

        const idsToDelete = Array.from(selectedItems);
        setShowConfirmDialog(false);
        setRemovingId(-1); // Special ID to indicate bulk delete in progress

        // Delete all selected items
        for (const wishId of idsToDelete) {
            try {
                await removeFromWishlist(Number(wishId));
            } catch (err) {
                console.error(`[Favorites] Error deleting ${wishId}:`, err);
            }
        }

        // Update local state
        setItems(prev => prev.filter(item => !idsToDelete.includes(item.wishlistId)));
        setSelectedItems(new Set());
        setShowBulkActions(false);
        setRemovingId(null);
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
                        <Heart size={64} className="wishlist-empty-icon" />
                        <h2 className="wishlist-empty-title">Danh sách yêu thích trống</h2>
                        <p className="wishlist-empty-text">Bạn chưa có sản phẩm nào trong danh sách yêu thích</p>
                        <button
                            className="wishlist-empty-btn"
                            onClick={() => window.location.href = '/products'}
                        >
                            Khám phá sản phẩm
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Search Bar */}
                        <div className="wishlist-search">
                            <div className="wishlist-search-container">
                                <Search size={20} className="wishlist-search-icon" />
                                <input
                                    type="text"
                                    className="wishlist-search-input"
                                    placeholder="Tìm kiếm sản phẩm, thương hiệu, model..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        className="wishlist-search-clear"
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Xóa tìm kiếm"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            {searchQuery && (
                                <div className="wishlist-search-results">
                                    Tìm thấy {sortedItems.length} sản phẩm
                                </div>
                            )}
                        </div>

                        {/* Bulk Actions Bar */}
                        {showBulkActions && selectedItems.size > 0 && (
                            <div className="wishlist-bulk-actions">
                                <div className="bulk-actions-info">
                                    <CheckSquare size={20} />
                                    <span>Đã chọn {selectedItems.size} sản phẩm</span>
                                </div>
                                <div className="bulk-actions-buttons">
                                    <button
                                        className="bulk-action-btn bulk-action-delete"
                                        onClick={handleBulkDelete}
                                        disabled={removingId === -1}
                                    >
                                        <Trash2 size={16} />
                                        Xóa đã chọn ({selectedItems.size})
                                    </button>
                                    <button
                                        className="bulk-action-btn bulk-action-cancel"
                                        onClick={() => {
                                            setSelectedItems(new Set());
                                            setShowBulkActions(false);
                                        }}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="wishlist-filters">
                            <div className="wishlist-type-filters" role="group" aria-label="Lọc loại sản phẩm">
                                <button
                                    className={`wishlist-type-btn ${productTypeFilter === PRODUCT_TYPE_FILTERS.ALL ? "active" : ""}`}
                                    onClick={() => handleProductTypeFilterChange(PRODUCT_TYPE_FILTERS.ALL)}
                                    type="button"
                                >
                                    Tất cả
                                </button>
                                <button
                                    className={`wishlist-type-btn ${productTypeFilter === PRODUCT_TYPE_FILTERS.VEHICLE ? "active" : ""}`}
                                    onClick={() => handleProductTypeFilterChange(PRODUCT_TYPE_FILTERS.VEHICLE)}
                                    type="button"
                                >
                                    Xe điện
                                </button>
                                <button
                                    className={`wishlist-type-btn ${productTypeFilter === PRODUCT_TYPE_FILTERS.BATTERY ? "active" : ""}`}
                                    onClick={() => handleProductTypeFilterChange(PRODUCT_TYPE_FILTERS.BATTERY)}
                                    type="button"
                                >
                                    Pin
                                </button>
                            </div>
                            {/* Select All Checkbox */}
                            {sortedItems.length > 0 && (
                                <button
                                    className="wishlist-select-all"
                                    onClick={handleSelectAll}
                                    title={selectedItems.size === pagedItems.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                >
                                    {selectedItems.size === pagedItems.length ? (
                                        <CheckSquare size={20} />
                                    ) : (
                                        <Square size={20} />
                                    )}
                                    <span>Chọn tất cả</span>
                                </button>
                            )}
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

                                    const isSelected = selectedItems.has(product.wishlistId);
                                    return (
                                        <div key={product.wishlistId || finalProductId} className={`wishlist-card ${isSelected ? 'selected' : ''}`}>
                                            {/* Selection Checkbox */}
                                            <button
                                                className="wishlist-card-select"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectItem(product.wishlistId);
                                                }}
                                                aria-label={isSelected ? "Bỏ chọn" : "Chọn"}
                                            >
                                                {isSelected ? (
                                                    <CheckSquare size={18} />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
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
                                                        <MessageCircle size={14} />
                                                        Chat
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
                                                            handleRemoveClick(wishId);
                                                        }}
                                                        disabled={removingId === Number(product.wishlistId) || !product.wishlistId}
                                                        title={product.wishlistId ? "Xóa khỏi danh sách yêu thích" : "Không thể xóa"}
                                                    >
                                                        {removingId === Number(product.wishlistId) ? (
                                                            <Loader2 size={14} className="spinning" />
                                                        ) : (
                                                            <Trash2 size={14} />
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

                        {sortedItems.length > 0 && (
                            <>
                                {/* Pagination Info - Always visible */}
                                <div className="wishlist-pagination-info">
                                    <div className="pagination-info-text">
                                        <span className="pagination-info-label">Hiển thị</span>
                                        <span className="pagination-info-value">{pagedItems.length}</span>
                                        <span className="pagination-info-label">trên trang</span>
                                        <span className="pagination-info-value">{displayPage}</span>
                                        <span className="pagination-info-separator">/</span>
                                        <span className="pagination-info-value">{totalPages}</span>
                                        <span className="pagination-info-separator">•</span>
                                        <span className="pagination-info-label">Tổng</span>
                                        <span className="pagination-info-value">{totalElements}</span>
                                        <span className="pagination-info-label">sản phẩm</span>
                                    </div>
                                </div>

                                {/* Enhanced Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="wishlist-pagination">
                                        {/* First Page Button */}
                                        <button
                                            className="pagination-btn pagination-btn-first"
                                            disabled={displayPage <= 1 || loading}
                                            onClick={handleFirstPage}
                                            aria-label="Trang đầu"
                                            title="Trang đầu"
                                        >
                                            ««
                                        </button>

                                        {/* Previous Button */}
                                        <button
                                            className="pagination-btn pagination-btn-prev"
                                            disabled={displayPage <= 1 || loading}
                                            onClick={() => handlePageChange(displayPage - 1)}
                                            aria-label="Trang trước"
                                            title="Trang trước"
                                        >
                                            ‹
                                        </button>

                                        {/* Page Numbers */}
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
                                                        aria-current={pageNum === displayPage ? "page" : undefined}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Next Button */}
                                        <button
                                            className="pagination-btn pagination-btn-next"
                                            disabled={displayPage >= totalPages || loading}
                                            onClick={() => handlePageChange(displayPage + 1)}
                                            aria-label="Trang sau"
                                            title="Trang sau"
                                        >
                                            ›
                                        </button>

                                        {/* Last Page Button */}
                                        <button
                                            className="pagination-btn pagination-btn-last"
                                            disabled={displayPage >= totalPages || loading}
                                            onClick={handleLastPage}
                                            aria-label="Trang cuối"
                                            title="Trang cuối"
                                        >
                                            »»
                                        </button>

                                        {/* Go to Page Input */}
                                        <div className="pagination-go-to">
                                            <span className="pagination-go-to-label">Đến trang:</span>
                                            <form onSubmit={handlePageInputSubmit} className="pagination-go-to-form">
                                                <input
                                                    type="text"
                                                    className="pagination-go-to-input"
                                                    value={pageInputValue}
                                                    onChange={handlePageInputChange}
                                                    placeholder={displayPage.toString()}
                                                    disabled={loading || totalPages <= 1}
                                                    min="1"
                                                    max={totalPages}
                                                />
                                                <button
                                                    type="submit"
                                                    className="pagination-go-to-btn"
                                                    disabled={loading || totalPages <= 1 || !pageInputValue}
                                                    title="Chuyển đến trang"
                                                >
                                                    Đi
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={showConfirmDialog}
                onConfirm={handleConfirmRemove}
                onCancel={handleCancelRemove}
                title={selectedItems.size > 0 ? "Xác nhận xóa nhiều sản phẩm" : "Xác nhận xóa"}
                message={
                    selectedItems.size > 0
                        ? `Bạn có chắc muốn xóa ${selectedItems.size} sản phẩm đã chọn khỏi danh sách yêu thích?`
                        : "Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?"
                }
                confirmText="Xóa"
                cancelText="Hủy"
                type="warning"
            />
        </div>
    );
}

export default Favorites;
