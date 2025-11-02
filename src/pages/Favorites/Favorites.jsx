import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MessageCircle, Trash2 } from "lucide-react";
import "./Favorites.css";

export function Favorites() {
    const [items, setItems] = useState([]);
    const [sortBy, setSortBy] = useState("date"); // date | priceLow | priceHigh | batteryType
    const [filterByBattery, setFilterByBattery] = useState("all"); // all | lithium | agm | lead
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(4);

    useEffect(() => {
        // Lấy danh sách yêu thích từ localStorage (mock). Cấu trúc mỗi item: {id, title, price, type, thumbnail, condition, warranty, meta, sellerName, sellerId}
        try {
            const saved = JSON.parse(localStorage.getItem("favorites_items") || "null");
            if (saved && Array.isArray(saved)) setItems(saved);
            else {
                // seed mẫu cho nền tảng pin/xe điện
                setItems([
                    { id: 1, title: "Pin Lithium-Ion EV - 95% Dung lượng", price: 1250000, type: "battery", thumbnail: "/default-avatar.png", condition: "Đã qua sử dụng", warranty: "3 tháng", meta: { cycles: 300, batteryType: "Lithium-Ion" }, sellerName: "EcoPower Inc.", sellerId: 1 },
                    { id: 2, title: "Pin AGM Deep Cycle - 12V 100Ah", price: 180000, type: "battery", thumbnail: "/default-avatar.png", condition: "Mới", warranty: "6 tháng", meta: { batteryType: "AGM" }, sellerName: "BatterySavers", sellerId: 2 },
                    { id: 3, title: "Pin Laptop Tái Chế cho Dell XPS", price: 45500, type: "battery", thumbnail: "/default-avatar.png", condition: "Đã qua sử dụng", warranty: "1 tháng", meta: { batteryType: "Lithium-Ion" }, sellerName: "TechRenew", sellerId: 3 },
                    { id: 4, title: "Pin Lưu Trữ Năng Lượng Mặt Trời - 88% Sức khỏe", price: 899000, type: "battery", thumbnail: "/default-avatar.png", condition: "Đã qua sử dụng", warranty: "12 tháng", meta: { batteryType: "Lead-Acid" }, sellerName: "SunCycle", sellerId: 4 },
                    { id: 5, title: "Pin EV 72V 30Ah - Dung lượng cao", price: 2500000, type: "battery", thumbnail: "/default-avatar.png", condition: "Mới", warranty: "24 tháng", meta: { cycles: 0, batteryType: "Lithium-Ion" }, sellerName: "EcoPower Inc.", sellerId: 1 },
                    { id: 6, title: "Pin AGM 12V 200Ah - Công suất lớn", price: 450000, type: "battery", thumbnail: "/default-avatar.png", condition: "Mới", warranty: "12 tháng", meta: { batteryType: "AGM" }, sellerName: "BatterySavers", sellerId: 2 }
                ]);
            }
        } catch (err) {
            console.warn("Không thể đọc favorites từ localStorage:", err);
        }
    }, []);

    const filtered = useMemo(() => {
        let list = [...items];

        // Lọc theo loại pin
        if (filterByBattery !== "all") {
            list = list.filter(x => x.meta?.batteryType?.toLowerCase().includes(filterByBattery.toLowerCase()));
        }

        // Sắp xếp
        if (sortBy === "date") {
            // Giữ nguyên thứ tự (giả sử mới nhất ở đầu)
        } else if (sortBy === "priceLow") {
            list.sort((a, b) => a.price - b.price);
        } else if (sortBy === "priceHigh") {
            list.sort((a, b) => b.price - a.price);
        } else if (sortBy === "batteryType") {
            list.sort((a, b) => (a.meta?.batteryType || "").localeCompare(b.meta?.batteryType || ""));
        }

        return list;
    }, [items, sortBy, filterByBattery]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

    // Ensure current page is valid when filter/items/pageSize change
    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [page, totalPages]);

    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const handleRemove = (id) => {
        const next = items.filter(x => x.id !== id);
        setItems(next);
        localStorage.setItem("favorites_items", JSON.stringify(next));
    };

    const handleClearAll = () => {
        if (window.confirm("Bạn có chắc muốn xóa tất cả sản phẩm yêu thích?")) {
            setItems([]);
            localStorage.setItem("favorites_items", JSON.stringify([]));
        }
    };

    const handleChatWithSeller = (sellerId, sellerName) => {
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

    const getBatteryFilterLabel = () => {
        switch (filterByBattery) {
            case "all": return "Tất cả Loại Pin";
            case "lithium": return "Lithium-Ion";
            case "agm": return "AGM";
            case "lead": return "Lead-Acid";
            default: return "Tất cả Loại Pin";
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

    return (
        <div className="wishlist-page">
            <div className="wishlist-container">
                <h1 className="wishlist-title">Danh sách yêu thích</h1>

                {filtered.length > 0 && (
                    <div className="wishlist-filters">
                        <div className="filter-dropdown">
                            <button className="filter-dropdown-btn" onClick={() => {
                                const options = ["date", "priceLow", "priceHigh", "batteryType"];
                                const currentIndex = options.indexOf(sortBy);
                                setSortBy(options[(currentIndex + 1) % options.length]);
                                setPage(1);
                            }}>
                                <span>Sắp xếp theo: {getSortLabel()}</span>
                                <ChevronDown size={16} />
                            </button>
                        </div>

                        <div className="filter-dropdown">
                            <button className="filter-dropdown-btn" onClick={() => {
                                const options = ["all", "lithium", "agm", "lead"];
                                const currentIndex = options.indexOf(filterByBattery);
                                setFilterByBattery(options[(currentIndex + 1) % options.length]);
                                setPage(1);
                            }}>
                                <span>Loại Pin: {getBatteryFilterLabel()}</span>
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {filtered.length === 0 ? (
                    <div className="wishlist-empty">
                        <p>Chưa có sản phẩm yêu thích</p>
                    </div>
                ) : (
                    <>
                        <div className="wishlist-grid">
                            {paged.map(product => (
                                <div key={product.id} className="wishlist-card">
                                    <a className="wishlist-card-image" href={`/product/${product.id}`}>
                                        <img src={product.thumbnail || "/default-avatar.png"} alt={product.title} />
                                    </a>
                                    <div className="wishlist-card-content">
                                        <a className="wishlist-card-title" href={`/product/${product.id}`} title={product.title}>
                                            {product.title}
                                        </a>
                                        {product.sellerName && (
                                            <div className="wishlist-card-seller">
                                                Bán bởi: <a href={`/seller/${product.sellerId}`} className="seller-link">{product.sellerName}</a>
                                            </div>
                                        )}
                                        <div className="wishlist-card-price">
                                            {product.price.toLocaleString('vi-VN')} ₫
                                        </div>
                                        <div className="wishlist-card-actions">
                                            <button
                                                className="wishlist-btn-chat"
                                                onClick={() => handleChatWithSeller(product.sellerId, product.sellerName)}
                                            >
                                                <MessageCircle size={16} />
                                                Chat với người bán
                                            </button>
                                            <button
                                                className="wishlist-btn-delete"
                                                onClick={() => handleRemove(product.id)}
                                            >
                                                <Trash2 size={16} />
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="wishlist-pagination">
                                <button
                                    className="pagination-btn pagination-btn-prev"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    aria-label="Trang trước"
                                >
                                    ‹
                                </button>

                                <div className="pagination-numbers">
                                    {getVisiblePages().map((pageNum, idx) => {
                                        if (pageNum === 'ellipsis') {
                                            return <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`pagination-number ${pageNum === page ? 'active' : ''}`}
                                                onClick={() => setPage(pageNum)}
                                                aria-label={`Trang ${pageNum}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    className="pagination-btn pagination-btn-next"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    aria-label="Trang sau"
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Favorites;


