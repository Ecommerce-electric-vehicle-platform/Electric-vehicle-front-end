import { useEffect, useMemo, useState } from "react";
import "./Favorites.css";

export function Favorites() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("all"); // all | battery | vehicle | accessory
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    useEffect(() => {
        // Lấy danh sách yêu thích từ localStorage (mock). Cấu trúc mỗi item: {id, title, price, type, thumbnail, condition, warranty, meta}
        try {
            const saved = JSON.parse(localStorage.getItem("favorites_items") || "null");
            if (saved && Array.isArray(saved)) setItems(saved);
            else {
                // seed mẫu cho nền tảng pin/xe điện
                setItems([
                    { id: 1, title: "Pin 48V 20Ah đo 90%", price: 2900000, type: "battery", thumbnail: "/default-avatar.png", condition: "Đã qua sử dụng", warranty: "3 tháng", meta: { cycles: 300 } },
                    { id: 2, title: "Xe máy điện Dibao 2021", price: 6800000, type: "vehicle", thumbnail: "/default-avatar.png", condition: "Đã qua sử dụng", warranty: "2 tháng", meta: { km: 5200 } },
                    { id: 3, title: "Sạc 60V 5A", price: 550000, type: "accessory", thumbnail: "/default-avatar.png", condition: "Mới", warranty: "1 tháng", meta: {} }
                ]);
            }
        } catch (err) {
            console.warn("Không thể đọc favorites từ localStorage:", err);
        }
    }, []);

    const filtered = useMemo(() => {
        const list = filter === "all" ? items : items.filter(x => x.type === filter);
        return list;
    }, [items, filter]);

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
        setItems([]);
        localStorage.setItem("favorites_items", JSON.stringify([]));
    };

    return (
        <div className="fav-page">
            <div className="fav-header">
                <h1>Đã yêu thích</h1>
                <div className="fav-actions">
                    <div className="filters">
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); setPage(1); }}>Tất cả</button>
                        <button className={`filter-btn ${filter === 'battery' ? 'active' : ''}`} onClick={() => { setFilter('battery'); setPage(1); }}>Pin</button>
                        <button className={`filter-btn ${filter === 'vehicle' ? 'active' : ''}`} onClick={() => { setFilter('vehicle'); setPage(1); }}>Xe điện</button>
                        <button className={`filter-btn ${filter === 'accessory' ? 'active' : ''}`} onClick={() => { setFilter('accessory'); setPage(1); }}>Phụ kiện & Sạc</button>
                    </div>
                    <div className="fav-right-actions">
                        {items.length > 0 && <button className="btn-clear" onClick={handleClearAll}>Xoá tất cả</button>}
                        {filtered.length > 0 && (
                            <select
                                className="page-size-select"
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                aria-label="Số mục mỗi trang"
                            >
                                <option value={6}>6 / trang</option>
                                <option value={8}>8 / trang</option>
                                <option value={12}>12 / trang</option>
                                <option value={16}>16 / trang</option>
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="fav-empty">Chưa có sản phẩm yêu thích</div>
            ) : (
                <div className="fav-grid">
                    {paged.map(p => (
                        <div key={p.id} className="fav-card">
                            <a className="thumb" href={`/product/${p.postId ?? p.id}`}>
                                <img src={p.thumbnail} alt={p.title} />
                            </a>
                            <div className="content">
                                <a className="title" href={`/product/${p.postId ?? p.id}`} title={p.title}>{p.title}</a>
                                <div className="meta-row">
                                    <span className="price">{p.price.toLocaleString('vi-VN')} đ</span>
                                    <span className="dot">•</span>
                                    <span className="cond">{p.condition}</span>
                                </div>
                                <div className="sub">
                                    {p.type === 'battery' && <span>Dung lượng thực tế • Chu kỳ ~ {p.meta.cycles}</span>}
                                    {p.type === 'vehicle' && <span>Odo ~ {p.meta.km?.toLocaleString('vi-VN')} km</span>}
                                </div>
                                <div className="foot">
                                    <span className="warranty">Bảo hành: {p.warranty}</span>
                                    <button className="btn-remove" onClick={() => handleRemove(p.id)}>Bỏ yêu thích</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filtered.length > 0 && (
                <div className="pagination">
                    <button
                        className="pg-btn"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        « Trước
                    </button>
                    {Array.from({ length: totalPages }).slice(0, 8).map((_, idx) => {
                        const pnum = idx + 1;
                        return (
                            <button
                                key={pnum}
                                className={`pg-btn ${pnum === page ? 'active' : ''}`}
                                onClick={() => setPage(pnum)}
                            >
                                {pnum}
                            </button>
                        );
                    })}
                    {totalPages > 8 && <span className="pg-ellipsis">...</span>}
                    <button
                        className="pg-btn"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                        Sau »
                    </button>
                    <span className="pg-info">Trang {page}/{totalPages} • {filtered.length} mục</span>
                </div>
            )}
        </div>
    );
}

export default Favorites;


