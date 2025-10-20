import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Search, Filter, SortAsc, ArrowRight, ArrowLeft } from "lucide-react";
import "../../components/VehicleShowcase/VehicleShowcase.css";
import "./Products.css";
import { fetchPostProducts, normalizeProduct } from "../../api/productApi";
import { searchProducts } from "../../api/searchApi";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { GlobalSearch } from "../../components/GlobalSearch/GlobalSearch";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";

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
        const searchLower = searchTerm.trim().toLowerCase();
        const list = combined
            .filter((item) => {
                const searchMatch =
                    item.title.toLowerCase().includes(searchLower) ||
                    item.brand?.toLowerCase().includes(searchLower) ||
                    item.model?.toLowerCase().includes(searchLower) ||
                    item.locationTrading.toLowerCase().includes(searchLower);
                const locationMatch = selectedLocation === "Tất cả khu vực" || item.locationTrading === selectedLocation;
                return searchMatch && locationMatch;
            })
            .sort((a, b) => (sortDate === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt)))
            .sort((a, b) => {
                if (sortPrice === "low") return a.price - b.price;
                if (sortPrice === "high") return b.price - a.price;
                return 0;
            });
        return list;
    }, [combined, searchTerm, selectedLocation, sortDate, sortPrice]);

    const totalPages = useMemo(() => serverTotalPages || 1, [serverTotalPages]);

    useEffect(() => {
        setPage(1);
    }, [selectedLocation, sortDate, sortPrice, pageSize]);

    // Smooth paging helper
    const goToPage = (targetPage) => {
        if (targetPage === page) return;
        setIsPaging(true);
        // small visual transition then change page and scroll to top
        setTimeout(() => {
            setPage(targetPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsPaging(false);
        }, 150);
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
                    </div>
                </div>

                {/* Grid */}
                {loading && (<div className="showcase-grid"><div className="showcase-card" style={{ padding: '2rem', textAlign: 'center' }}>Đang tải sản phẩm...</div></div>)}
                {error && !loading && (
                    <div className="showcase-grid"><div className="showcase-card" style={{ padding: '2rem', textAlign: 'center' }}>{error}</div></div>
                )}
                {!loading && !error && filtered.length === 0 ? (
                    <div className="showcase-grid"><div className="showcase-card" style={{ padding: '2rem', textAlign: 'center' }}>Không tìm thấy sản phẩm phù hợp.</div></div>
                ) : (
                    <div className={`showcase-grid ${isPaging ? 'is-paging' : ''}`}>
                        {paged.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                variant="default"
                                onViewDetails={(product) => navigate(`/product/${product.id}`)}
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
                {!loading && !error && filtered.length > 0 && (
                    <div className="showcase-footer" style={{ marginTop: '1rem' }}>
                        <div className="pagination">
                            <button
                                className="page-btn"
                                disabled={page <= 1}
                                onClick={() => goToPage(Math.max(1, page - 1))}
                                aria-label="Trang trước"
                            >
                                « Trước
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const pnum = i + 1;
                                return (
                                    <button
                                        key={pnum}
                                        className={`page-btn ${pnum === page ? 'active' : ''}`}
                                        aria-current={pnum === page ? 'page' : undefined}
                                        onClick={() => goToPage(pnum)}
                                    >
                                        {pnum}
                                    </button>
                                );
                            })}
                            <button
                                className="page-btn"
                                disabled={page >= totalPages}
                                onClick={() => goToPage(Math.min(totalPages, page + 1))}
                                aria-label="Trang sau"
                            >
                                Sau »
                            </button>
                            <div className="pagination-info">Trang {page}/{totalPages}</div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default Products;


