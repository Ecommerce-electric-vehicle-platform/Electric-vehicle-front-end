import { useEffect, useMemo, useState } from "react";
import "./Favorites.css";

export function Favorites() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("all"); // all | battery | vehicle | accessory

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
        } catch { }
    }, []);

    const filtered = useMemo(() => {
        if (filter === "all") return items;
        return items.filter(x => x.type === filter);
    }, [items, filter]);

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
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả</button>
                        <button className={`filter-btn ${filter === 'battery' ? 'active' : ''}`} onClick={() => setFilter('battery')}>Pin</button>
                        <button className={`filter-btn ${filter === 'vehicle' ? 'active' : ''}`} onClick={() => setFilter('vehicle')}>Xe điện</button>
                        <button className={`filter-btn ${filter === 'accessory' ? 'active' : ''}`} onClick={() => setFilter('accessory')}>Phụ kiện & Sạc</button>
                    </div>
                    {items.length > 0 && <button className="btn-clear" onClick={handleClearAll}>Xoá tất cả</button>}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="fav-empty">Chưa có sản phẩm yêu thích</div>
            ) : (
                <div className="fav-grid">
                    {filtered.map(p => (
                        <div key={p.id} className="fav-card">
                            <a className="thumb" href={`/product/${p.id}`}>
                                <img src={p.thumbnail} alt={p.title} />
                            </a>
                            <div className="content">
                                <a className="title" href={`/product/${p.id}`} title={p.title}>{p.title}</a>
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
        </div>
    );
}

export default Favorites;


