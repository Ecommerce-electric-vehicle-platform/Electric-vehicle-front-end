import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./Seller.css";

export function Seller() {
    const { id } = useParams();
    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all"); // all | battery | vehicle | accessory

    useEffect(() => {
        // Mock cá nhân bán hàng (không phải cửa hàng)
        const profile = {
            id,
            name: "Nguyễn Văn A",
            avatar: "/default-avatar.png",
            rating: 4.8,
            totalReviews: 37,
            responseRate: 98, // %
            lastActive: "Hoạt động 2 giờ trước",
            joinedAt: "Tham gia 2023",
            location: "Quận Bình Thạnh, TP.HCM",
            meetupNote: "Ưu tiên hẹn xem xe tại Bình Thạnh hoặc giao pin tại các quận lân cận.",
            bio: "Cá nhân cần thanh lý pin/xe điện đã qua sử dụng, cam kết thông tin trung thực và kiểm định pin trước khi bán.",
            verifications: ["Số điện thoại xác minh", "CMND/CCCD xác minh"],
        };
        setSeller(profile);

        // Mock tin đăng — phân loại theo loại hàng
        setProducts([
            { id: 101, title: "Pin Lithium 48V 20Ah", price: 2800000, thumbnail: "/default-avatar.png", condition: "Đã qua sử dụng", warranty: "3 tháng", type: "battery", cycles: 320 },
            { id: 102, title: "Xe máy điện VinFast Klara S 2021", price: 11500000, thumbnail: "/default-avatar.png", condition: "Đã qua sử dụng", warranty: "6 tháng", type: "vehicle", km: 4200 },
            { id: 103, title: "Bộ sạc nhanh 54.6V", price: 450000, thumbnail: "/default-avatar.png", condition: "Mới", warranty: "1 tháng", type: "accessory" },
            { id: 104, title: "Pin 60V 24Ah – đo dung lượng 88%", price: 3500000, thumbnail: "/default-avatar.png", condition: "Đã qua sử dụng", warranty: "2 tháng", type: "battery", cycles: 410 },
            { id: 105, title: "Xe đạp điện JVC 2020", price: 3800000, thumbnail: "/default-avatar.png", condition: "Đã qua sử dụng", warranty: "1 tháng", type: "vehicle", km: 1800 }
        ]);
    }, [id]);

    const filtered = useMemo(() => {
        if (activeFilter === "all") return products;
        return products.filter(p => p.type === activeFilter);
    }, [products, activeFilter]);

    if (!seller) return null;

    return (
        <div className="seller-page">
            <div className="seller-hero">
                <img className="seller-avatar" src={seller.avatar} alt={seller.name} />
                <div className="seller-meta">
                    <h1>{seller.name}</h1>
                    <div className="seller-stats">
                        <span>⭐ {seller.rating} ({seller.totalReviews} đánh giá)</span>
                        <span>• Tỉ lệ phản hồi {seller.responseRate}%</span>
                        <span>• {seller.lastActive}</span>
                        <span>• {seller.joinedAt}</span>
                    </div>
                    <div className="seller-badges">
                        {seller.verifications.map((b, idx) => <span key={idx} className="badge">{b}</span>)}
                    </div>
                    <p className="seller-desc">{seller.bio}</p>
                    <div className="seller-actions">
                        <a className="btn-primary" href="/chat">Chat với người bán</a>
                        <span className="meetup-note">{seller.location} • {seller.meetupNote}</span>
                    </div>
                </div>
            </div>

            <div className="seller-sections">
                <div className="section">
                    <div className="section-header">
                        <h2>Tin đang bán</h2>
                        <div className="filters">
                            <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>Tất cả</button>
                            <button className={`filter-btn ${activeFilter === 'battery' ? 'active' : ''}`} onClick={() => setActiveFilter('battery')}>Pin</button>
                            <button className={`filter-btn ${activeFilter === 'vehicle' ? 'active' : ''}`} onClick={() => setActiveFilter('vehicle')}>Xe điện</button>
                            <button className={`filter-btn ${activeFilter === 'accessory' ? 'active' : ''}`} onClick={() => setActiveFilter('accessory')}>Phụ kiện & Sạc</button>
                        </div>
                    </div>
                    <div className="product-grid">
                        {filtered.map(p => (
                            <a key={p.id} className="product-card" href={`/product/${p.id}`}>
                                <div className="thumb"><img src={p.thumbnail} alt={p.title} /></div>
                                <div className="title" title={p.title}>{p.title}</div>
                                <div className="meta">
                                    <span className="price">{p.price.toLocaleString('vi-VN')} đ</span>
                                    <span className="dot">•</span>
                                    <span className="cond">{p.condition}</span>
                                </div>
                                <div className="warranty">Bảo hành: {p.warranty}</div>
                                {p.type === 'battery' && <div className="spec">Số chu kỳ sạc ~ {p.cycles}</div>}
                                {p.type === 'vehicle' && <div className="spec">Odo ~ {p.km.toLocaleString('vi-VN')} km</div>}
                            </a>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h2>Lưu ý an toàn giao dịch</h2>
                    <ul className="policy-list">
                        <li>Luôn kiểm tra dung lượng pin thực tế và số chu kỳ sạc trước khi nhận hàng.</li>
                        <li>Test xe: phanh, đèn, motor, bộ điều tốc, tiếng ồn bất thường.</li>
                        <li>Giao dịch tại nơi đông người; ưu tiên thanh toán qua nền tảng/biên nhận rõ ràng.</li>
                        <li>Không mua pin phồng, nứt, đã can thiệp mạch BMS; yêu cầu bảo hành tối thiểu theo mô tả.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Seller;


