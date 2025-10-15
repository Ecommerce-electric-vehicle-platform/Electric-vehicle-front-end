import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Battery, Car, MapPin, Search, Filter, SortAsc, ArrowRight } from "lucide-react";
import "../../components/VehicleShowcase/VehicleShowcase.css";
import "./Products.css";

import { vehicleProducts, batteryProducts, formatCurrency } from "../../data/productsData";

export function Products() {
    const navigate = useNavigate();

    // Tabs: all | vehicles | batteries
    const [activeTab, setActiveTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("Tất cả khu vực");
    const [sortDate, setSortDate] = useState("newest");
    const [sortPrice, setSortPrice] = useState("none");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const combined = useMemo(() => {
        if (activeTab === "vehicles") return vehicleProducts;
        if (activeTab === "batteries") return batteryProducts;
        return [...vehicleProducts, ...batteryProducts];
    }, [activeTab]);

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

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [activeTab, selectedLocation, sortDate, sortPrice, pageSize]);

    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

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

                {/* Tabs */}
                <div className="showcase-tabs">
                    <button className={`tab-button ${activeTab === 'all' ? 'tab-active' : ''}`} onClick={() => setActiveTab('all')}>
                        <Car className="tab-icon" />
                        <Battery className="tab-icon" />
                        <span>Tất cả</span>
                    </button>
                    <button className={`tab-button ${activeTab === 'vehicles' ? 'tab-active' : ''}`} onClick={() => setActiveTab('vehicles')}>
                        <Car className="tab-icon" />
                        <span>Xe điện</span>
                    </button>
                    <button className={`tab-button ${activeTab === 'batteries' ? 'tab-active' : ''}`} onClick={() => setActiveTab('batteries')}>
                        <Battery className="tab-icon" />
                        <span>Pin xe điện</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="filter-section">
                    <div className="filter-bar">
                        <div className="search-bar">
                            <Search className="search-icon" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm, hãng, khu vực..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            {searchTerm && (
                                <button className="search-clear" onClick={() => setSearchTerm("")}>Xoá</button>
                            )}
                        </div>
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
                {filtered.length === 0 ? (
                    <div className="showcase-grid"><div className="showcase-card" style={{ padding: '2rem', textAlign: 'center' }}>Không tìm thấy sản phẩm phù hợp.</div></div>
                ) : (
                    <div className="showcase-grid">
                        {paged.map((p) => (
                            <div key={p.id} className="showcase-card">
                                <div className="card-image-wrapper">
                                    <img src={p.image} alt={p.title} className="card-image" />
                                </div>
                                <div className="card-content">
                                    <div className="card-header">
                                        <h3 className="card-title" title={p.title}>{p.title}</h3>
                                    </div>
                                    <div className="card-brand">{p.brand} - {p.model}</div>
                                    <div className="card-price-section">
                                        <div className="price-current">{formatCurrency(p.price)}</div>
                                    </div>
                                    <div className="card-location">
                                        <MapPin className="location-icon" />
                                        <span>{p.locationTrading}</span>
                                    </div>
                                    <button className="card-button" onClick={() => navigate(`/product/${p.id}`)}>
                                        <span>Xem chi tiết</span>
                                        <ArrowRight className="btn-arrow" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {filtered.length > 0 && (
                    <div className="showcase-footer" style={{ marginTop: '1rem' }}>
                        <div className="pagination">
                            <button className="btn-outline-large" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>« Trước</button>
                            {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                                const pnum = i + 1;
                                return (
                                    <button key={pnum} className={`btn-outline-large ${pnum === page ? 'active' : ''}`} onClick={() => setPage(pnum)}>{pnum}</button>
                                );
                            })}
                            {totalPages > 7 && <span className="showcase-description" style={{ margin: '0 8px' }}>...</span>}
                            <button className="btn-outline-large" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau »</button>
                            <div className="showcase-description" style={{ marginTop: '10px' }}>Trang {page}/{totalPages} • {filtered.length} sản phẩm</div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default Products;


