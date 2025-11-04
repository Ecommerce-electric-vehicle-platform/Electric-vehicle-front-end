import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Search, Filter, SortAsc, ArrowRight, ArrowLeft, Grid3x3, List, X, Sparkles } from "lucide-react";
import "../../components/VehicleShowcase/VehicleShowcase.css";
import "./Products.css";
import { fetchPostProducts, normalizeProduct } from "../../api/productApi";
import { searchProducts } from "../../api/searchApi";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { GlobalSearch } from "../../components/GlobalSearch/GlobalSearch";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";
import { searchInProduct, calculateSearchScore } from "../../utils/textUtils";
import { ProductSkeleton } from "../../components/ProductSkeleton/ProductSkeleton";

export function Products() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get search term from URL
    const urlSearchTerm = searchParams.get('search') || '';

    // State management
    const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
    const [selectedLocation, setSelectedLocation] = useState("Tất cả khu vực");
    const [sortDate, setSortDate] = useState("newest");
    const [sortPrice, setSortPrice] = useState("none");
    const [page, setPage] = useState(1);
    const [isPaging, setIsPaging] = useState(false);
    const [pageSize, setPageSize] = useState(12);
    const [isSearchMode, setIsSearchMode] = useState(!!urlSearchTerm);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [serverTotalPages, setServerTotalPages] = useState(1);
    const [items, setItems] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [pageInputValue, setPageInputValue] = useState('');
    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem('productsViewMode');
        return saved === 'list' ? 'list' : 'grid';
    });
    const [priceRange, setPriceRange] = useState(null); // { min: number, max: number } or null

    // Clear search and return to default product list
    const clearSearch = () => {
        setSearchTerm("");
        setIsSearchMode(false);
        // remove query param and navigate back to default Products
        navigate("/products");
    };

    // Fetch data based on mode (search or normal)
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError("");

        if (isSearchMode && searchTerm.trim()) {
            // Search mode
            searchProducts({ query: searchTerm, page, size: pageSize })
                .then(({ items, totalPages }) => {
                    if (!mounted) return;
                    setSearchResults(items || []);
                    setServerTotalPages(totalPages || 1);
                })
                .catch((err) => {
                    if (!mounted) return;
                    setError(err?.message || "Không thể tìm kiếm");
                })
                .finally(() => {
                    if (!mounted) return;
                    setLoading(false);
                });
        } else {
            // Normal mode
            const params = {};
            fetchPostProducts({ page, size: pageSize, params })
                .then(({ items, totalPages }) => {
                    if (!mounted) return;
                    setItems(items || []);
                    setServerTotalPages(totalPages || 1);
                })
                .catch((err) => {
                    if (!mounted) return;
                    setError(err?.message || "Không thể tải sản phẩm");
                })
                .finally(() => {
                    if (!mounted) return;
                    setLoading(false);
                });
        }

        return () => {
            mounted = false;
        };
    }, [page, pageSize, searchTerm, isSearchMode]);

    // Update search mode when URL changes
    useEffect(() => {
        const newSearchTerm = searchParams.get('search') || '';
        setSearchTerm(newSearchTerm);
        setIsSearchMode(!!newSearchTerm);
        setPage(1); // Reset to first page when search changes
    }, [searchParams]);

    const combined = useMemo(() => {
        if (isSearchMode) {
            return (searchResults || []).map(normalizeProduct).filter(Boolean);
        }
        return (items || []).map(normalizeProduct).filter(Boolean);
    }, [items, searchResults, isSearchMode]);

    const allLocations = useMemo(() => {
        return ["Tất cả khu vực", ...new Set(combined.map((i) => i.locationTrading))];
    }, [combined]);

    const filtered = useMemo(() => {
        const list = combined
            .filter((item) => {
                // Sử dụng tìm kiếm cải tiến hỗ trợ có dấu và không dấu
                const searchMatch = searchTerm.trim()
                    ? searchInProduct(item, searchTerm, ['title', 'brand', 'model', 'description', 'locationTrading', 'condition', 'manufactureYear'])
                    : true;
                const locationMatch = selectedLocation === "Tất cả khu vực" || item.locationTrading === selectedLocation;

                // Price range filter
                const priceMatch = !priceRange || (item.price >= priceRange.min && item.price <= priceRange.max);

                // Debug logging cho từ khóa "Katali"
                if (searchTerm.trim() === "Katali" && searchMatch) {
                    console.log("🔍 Found match for 'Katali':", {
                        title: item.title,
                        brand: item.brand,
                        model: item.model,
                        description: item.description?.substring(0, 100) + "...",
                        locationTrading: item.locationTrading,
                        condition: item.condition,
                        manufactureYear: item.manufactureYear
                    });
                }

                return searchMatch && locationMatch && priceMatch;
            })
            .sort((a, b) => {
                // Sắp xếp theo độ phù hợp với search term trước
                if (searchTerm.trim()) {
                    const scoreA = calculateSearchScore(a, searchTerm);
                    const scoreB = calculateSearchScore(b, searchTerm);
                    if (scoreA !== scoreB) return scoreB - scoreA;
                }

                // Sau đó sắp xếp theo ngày
                if (sortDate === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
                if (sortDate === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
                return 0;
            })
            .sort((a, b) => {
                // Cuối cùng sắp xếp theo giá
                if (sortPrice === "low") return a.price - b.price;
                if (sortPrice === "high") return b.price - a.price;
                return 0;
            });
        return list;
    }, [combined, searchTerm, selectedLocation, sortDate, sortPrice, priceRange]);

    const totalPages = useMemo(() => serverTotalPages || 1, [serverTotalPages]);

    // Save view mode to localStorage
    useEffect(() => {
        localStorage.setItem('productsViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        setPage(1);
    }, [selectedLocation, sortDate, sortPrice, pageSize, priceRange]);

    // Smooth paging helper
    const goToPage = (targetPage) => {
        if (targetPage === page || targetPage < 1 || targetPage > totalPages) return;
        setIsPaging(true);
        // small visual transition then change page and scroll to top
        setTimeout(() => {
            setPage(targetPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsPaging(false);
        }, 150);
    };

    // Pagination helpers - similar to wishlist
    const getVisiblePages = () => {
        const maxVisible = 7;
        const pages = [];

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (page <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('ellipsis');
                pages.push(totalPages);
            } else if (page >= totalPages - 3) {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = page - 1; i <= page + 1; i++) pages.push(i);
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const handlePageChange = (newPage) => {
        const validPage = Math.max(1, Math.min(newPage, totalPages));
        goToPage(validPage);
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

    // Active filters helper
    const activeFilters = useMemo(() => {
        const filters = [];
        if (selectedLocation !== "Tất cả khu vực") {
            filters.push({ key: 'location', label: selectedLocation, type: 'location' });
        }
        if (priceRange) {
            filters.push({
                key: 'price',
                label: `${(priceRange.min / 1000000).toFixed(1)}M - ${(priceRange.max / 1000000).toFixed(1)}M`,
                type: 'price'
            });
        }
        if (sortDate !== "newest") {
            filters.push({ key: 'date', label: 'Cũ nhất', type: 'date' });
        }
        if (sortPrice !== "none") {
            filters.push({
                key: 'priceSort',
                label: sortPrice === "low" ? "Giá: Thấp → Cao" : "Giá: Cao → Thấp",
                type: 'priceSort'
            });
        }
        return filters;
    }, [selectedLocation, priceRange, sortDate, sortPrice]);

    const removeFilter = (filterType) => {
        switch (filterType) {
            case 'location':
                setSelectedLocation("Tất cả khu vực");
                break;
            case 'price':
                setPriceRange(null);
                break;
            case 'date':
                setSortDate("newest");
                break;
            case 'priceSort':
                setSortPrice("none");
                break;
        }
    };

    const clearAllFilters = () => {
        setSelectedLocation("Tất cả khu vực");
        setPriceRange(null);
        setSortDate("newest");
        setSortPrice("none");
    };

    // Quick filter handlers
    const handleQuickPriceFilter = (range) => {
        setPriceRange(range);
    };

    const handleQuickSort = (sortType) => {
        if (sortType === 'price-low') {
            setSortPrice("low");
            setSortDate("newest");
        } else if (sortType === 'price-high') {
            setSortPrice("high");
            setSortDate("newest");
        } else if (sortType === 'newest') {
            setSortDate("newest");
            setSortPrice("none");
        } else if (sortType === 'verified') {
            // This would need to be implemented in the filter logic
            // For now, we'll just sort by newest and note that verified filter would need backend support
        }
    };

    const paged = filtered; // Dữ liệu đã phân trang từ server

    return (
        <section className="vehicle-showcase-section">
            <div className="vehicle-showcase-container">
                <div className="showcase-header">
                    <div className="header-content">
                        <div className="header-badge"><span>Danh mục đầy đủ</span></div>
                        <h2 className="showcase-title">Tất cả sản phẩm</h2>
                        <p className="showcase-description">Xe máy điện, xe đạp điện và pin đã qua sử dụng.</p>
                    </div>
                </div>

                {/* Breadcrumbs */}
                <Breadcrumbs />

                {/* Global Search */}
                <div className="products-search-section">
                    <GlobalSearch
                        placeholder="Tìm kiếm sản phẩm, thương hiệu, model..."
                        className="products-search"
                    />
                </div>

                {/* Search Results Header */}
                {isSearchMode && (
                    <div className="search-results-header">
                        <h3 className="search-results-title">
                            Kết quả tìm kiếm cho "{searchTerm}"
                            {combined.length > 0 && (
                                <span className="search-results-count">({combined.length} sản phẩm)</span>
                            )}
                        </h3>
                        <button
                            onClick={clearSearch}
                            className="btn-back-to-all"
                            aria-label="Quay về tất cả sản phẩm"
                        >
                            <ArrowLeft size={16} className="btn-back-icon" />
                            <span>Tất cả sản phẩm</span>
                        </button>
                    </div>
                )}

                {/* Quick Filters */}
                <div className="quick-filters-section">
                    <div className="quick-filters-header">
                        <span className="quick-filters-label">
                            <Sparkles size={16} />
                            Lọc nhanh
                        </span>
                        <div className="quick-filters-buttons">
                            <button
                                className={`quick-filter-btn ${!priceRange ? 'active' : ''}`}
                                onClick={() => setPriceRange(null)}
                            >
                                Tất cả giá
                            </button>
                            <button
                                className={`quick-filter-btn ${priceRange && priceRange.min === 0 && priceRange.max === 5000000 ? 'active' : ''}`}
                                onClick={() => handleQuickPriceFilter({ min: 0, max: 5000000 })}
                            >
                                Dưới 5M
                            </button>
                            <button
                                className={`quick-filter-btn ${priceRange && priceRange.min === 5000000 && priceRange.max === 10000000 ? 'active' : ''}`}
                                onClick={() => handleQuickPriceFilter({ min: 5000000, max: 10000000 })}
                            >
                                5M - 10M
                            </button>
                            <button
                                className={`quick-filter-btn ${priceRange && priceRange.min === 10000000 && priceRange.max === 20000000 ? 'active' : ''}`}
                                onClick={() => handleQuickPriceFilter({ min: 10000000, max: 20000000 })}
                            >
                                10M - 20M
                            </button>
                            <button
                                className={`quick-filter-btn ${priceRange && priceRange.min === 20000000 ? 'active' : ''}`}
                                onClick={() => handleQuickPriceFilter({ min: 20000000, max: 999999999 })}
                            >
                                Trên 20M
                            </button>
                        </div>
                    </div>
                    <div className="quick-sort-buttons">
                        <button
                            className={`quick-sort-btn ${sortDate === 'newest' && sortPrice === 'none' ? 'active' : ''}`}
                            onClick={() => handleQuickSort('newest')}
                        >
                            Mới đăng
                        </button>
                        <button
                            className={`quick-sort-btn ${sortPrice === 'low' ? 'active' : ''}`}
                            onClick={() => handleQuickSort('price-low')}
                        >
                            Giá tốt nhất
                        </button>
                        <button
                            className={`quick-sort-btn ${sortPrice === 'high' ? 'active' : ''}`}
                            onClick={() => handleQuickSort('price-high')}
                        >
                            Giá cao nhất
                        </button>
                    </div>
                </div>

                {/* Active Filters Chips */}
                {activeFilters.length > 0 && (
                    <div className="active-filters-section">
                        <div className="active-filters-header">
                            <span className="active-filters-label">Bộ lọc đang áp dụng:</span>
                            <button className="clear-all-filters-btn" onClick={clearAllFilters}>
                                Xóa tất cả
                            </button>
                        </div>
                        <div className="active-filters-chips">
                            {activeFilters.map((filter) => (
                                <div key={filter.key} className="filter-chip">
                                    <span className="filter-chip-label">{filter.label}</span>
                                    <button
                                        className="filter-chip-remove"
                                        onClick={() => removeFilter(filter.type)}
                                        aria-label={`Xóa bộ lọc ${filter.label}`}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="filter-section">
                    <div className="filter-bar">
                        <div className="filter-controls">
                            <div className="filter-group">
                                <MapPin className="filter-icon" />
                                <select className="filter-select" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                                    {allLocations.map((loc) => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <SortAsc className="filter-icon" />
                                <select className="filter-select" value={sortDate} onChange={(e) => setSortDate(e.target.value)}>
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <Filter className="filter-icon" />
                                <select className="filter-select" value={sortPrice} onChange={(e) => setSortPrice(e.target.value)}>
                                    <option value="none">Sắp xếp theo giá</option>
                                    <option value="low">Giá thấp đến cao</option>
                                    <option value="high">Giá cao đến thấp</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <span>Kích thước trang</span>
                                <select className="filter-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                                    <option value={12}>12</option>
                                    <option value={16}>16</option>
                                    <option value={24}>24</option>
                                    <option value={32}>32</option>
                                </select>
                            </div>
                        </div>
                        {/* View Toggle */}
                        <div className="view-toggle-container">
                            <button
                                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                aria-label="Xem dạng lưới"
                                title="Xem dạng lưới"
                            >
                                <Grid3x3 size={18} />
                            </button>
                            <button
                                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                aria-label="Xem dạng danh sách"
                                title="Xem dạng danh sách"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid/List View */}
                {loading && (
                    <div className={`showcase-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                        <ProductSkeleton count={pageSize} />
                    </div>
                )}
                {error && !loading && (
                    <div className="showcase-grid"><div className="showcase-card" style={{ padding: '2rem', textAlign: 'center' }}>{error}</div></div>
                )}
                {!loading && !error && filtered.length === 0 ? (
                    <div className="showcase-grid no-results-container">
                        <div className="showcase-card no-results-card" style={{ padding: '3rem', textAlign: 'center' }}>
                            {isSearchMode ? (
                                <div className="no-results-content">
                                    <h3 className="no-results-title">Không tìm thấy sản phẩm</h3>
                                    <p className="no-results-message">
                                        Không có sản phẩm nào chứa từ khóa "<strong>{searchTerm}</strong>"
                                    </p>
                                    <div className="no-results-suggestions">
                                        <p className="suggestions-text">
                                            Thử <strong>kiểm tra chính tả</strong> hoặc <strong>từ khóa ngắn gọn hơn</strong>
                                        </p>
                                    </div>
                                    <button
                                        onClick={clearSearch}
                                        className="btn-back-to-all"
                                    >
                                        <ArrowLeft size={16} className="btn-back-icon" />
                                        <span>Xem tất cả sản phẩm</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="no-results-content">
                                    <div className="no-results-icon">📦</div>
                                    <h3 className="no-results-title">Không có sản phẩm nào</h3>
                                    <p className="no-results-message">
                                        Hiện tại chưa có sản phẩm nào phù hợp với bộ lọc đã chọn.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`showcase-grid ${viewMode === 'list' ? 'list-view' : ''} ${isPaging ? 'is-paging' : ''}`}>
                        {paged.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                variant={viewMode === 'list' ? 'compact' : 'default'}
                                onViewDetails={(product) => navigate(`/product/${product.postId ?? product.id}`)}
                                showActions={true}
                                showCondition={true}
                                showLocation={true}
                                showDate={true}
                                showVerified={true}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && filtered.length > 0 && totalPages > 0 && (
                    <div className="showcase-footer" style={{ marginTop: '2rem' }}>
                        {/* Pagination Info - Always visible */}
                        <div className="products-pagination-info">
                            <div className="pagination-info-text">
                                <span className="pagination-info-label">Hiển thị</span>
                                <span className="pagination-info-value">{paged.length}</span>
                                <span className="pagination-info-label">trên trang</span>
                                <span className="pagination-info-value">{page}</span>
                                <span className="pagination-info-separator">/</span>
                                <span className="pagination-info-value">{totalPages}</span>
                                <span className="pagination-info-separator">•</span>
                                <span className="pagination-info-label">Tổng</span>
                                <span className="pagination-info-value">{filtered.length}</span>
                                <span className="pagination-info-label">sản phẩm</span>
                            </div>
                        </div>

                        {/* Enhanced Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="products-pagination">
                                {/* First Page Button */}
                                <button
                                    className="pagination-btn pagination-btn-first"
                                    disabled={page <= 1 || loading}
                                    onClick={handleFirstPage}
                                    aria-label="Trang đầu"
                                    title="Trang đầu"
                                >
                                    ««
                                </button>

                                {/* Previous Button */}
                                <button
                                    className="pagination-btn pagination-btn-prev"
                                    disabled={page <= 1 || loading}
                                    onClick={() => handlePageChange(page - 1)}
                                    aria-label="Trang trước"
                                    title="Trang trước"
                                >
                                    ‹
                                </button>

                                {/* Page Numbers */}
                                <div className="pagination-numbers">
                                    {getVisiblePages().map((pageNum, idx) => {
                                        if (pageNum === 'ellipsis') {
                                            return (
                                                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                                                    ...
                                                </span>
                                            );
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`pagination-number ${pageNum === page ? 'active' : ''}`}
                                                onClick={() => handlePageChange(pageNum)}
                                                disabled={loading}
                                                aria-label={`Trang ${pageNum}`}
                                                aria-current={pageNum === page ? 'page' : undefined}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Next Button */}
                                <button
                                    className="pagination-btn pagination-btn-next"
                                    disabled={page >= totalPages || loading}
                                    onClick={() => handlePageChange(page + 1)}
                                    aria-label="Trang sau"
                                    title="Trang sau"
                                >
                                    ›
                                </button>

                                {/* Last Page Button */}
                                <button
                                    className="pagination-btn pagination-btn-last"
                                    disabled={page >= totalPages || loading}
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
                                            placeholder={page.toString()}
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
                    </div>
                )}
            </div>
        </section>
    );
}

export default Products;


