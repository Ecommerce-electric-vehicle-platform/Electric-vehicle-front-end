import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Seller.css";
import sellerApi from '../../api/sellerApi';

export function Seller() {
    const { id: sellerId } = useParams();
    const [seller, setSeller] = useState(null);
    const [sellerLoading, setSellerLoading] = useState(false);
    const [sellerError, setSellerError] = useState(null);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState(null);
    const [activeFilter, setActiveFilter] = useState("all"); // all | battery | vehicle | accessory

    // Bước 1: Lấy sản phẩm của seller
    useEffect(() => {
        let mounted = true;
        if (sellerId) {
            setProductsLoading(true);
            sellerApi.getProductsBySeller(sellerId)
                .then(items => {
                    if (!mounted) return;
                    const list = Array.isArray(items) ? items : [];
                    setProducts(list);
                    setProductsError(null);
                })
                .catch(() => {
                    if (!mounted) return;
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

    // Bước 2: Khi có post đầu tiên: lấy info seller từ postId đó
    useEffect(() => {
        let mounted = true;
        if (Array.isArray(products) && products.length > 0) {
            const postId = products[0].postId || products[0].id;
            if (postId) {
                setSellerLoading(true);
                sellerApi.getSellerByProductId(postId)
                    .then(data => {
                        if (!mounted) return;
                        if (data) {
                            setSeller(data);
                            setSellerError(null);
                        } else {
                            setSeller(null);
                            setSellerError("Không tìm thấy seller.");
                        }
                    })
                    .catch(() => {
                        if (!mounted) return;
                        setSeller(null);
                        setSellerError("Không tìm thấy seller.");
                    })
                    .finally(() => {
                        if (!mounted) return;
                        setSellerLoading(false);
                    });
            }
        } else if (!productsLoading) {
            setSeller(null);
        }
        return () => { mounted = false; };
    }, [products, productsLoading]);

    const filtered = activeFilter === "all"
        ? products
        : products.filter(p => p.type === activeFilter);

    return (
        <div className="seller-page">
            <div className="seller-hero">
                {sellerLoading ? (
                    <div>Đang tải thông tin người bán…</div>
                ) : sellerError ? (
                    <div style={{ color: '#ef4444' }}>{sellerError}</div>
                ) : seller ? (
                    <>
                        <div className="seller-avatar" style={{ background: '#eee', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 32, color: '#10b981' }}>
                            {(seller.storeName || seller.sellerName || 'S')[0]}
                        </div>
                        <div className="seller-meta">
                            <h1>{seller.storeName || seller.sellerName || 'Seller'}</h1>
                            {seller.status && <span className="badge">{seller.status}</span>}
                            {(seller.home || seller.nationality) && <span className="meetup-note">{seller.home || seller.nationality}</span>}
                        </div>
                    </>
                ) : (
                    <div>Không tìm thấy thông tin người bán.</div>
                )}
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
                    {productsLoading ? (
                        <div>Đang tải sản phẩm…</div>
                    ) : productsError ? (
                        <div style={{ color: '#ef4444' }}>{productsError}</div>
                    ) : (
                        <div className="product-grid">
                            {filtered && filtered.length > 0 ? filtered.map(p => (
                                <a key={p.id || p.postId} className="product-card" href={`/product/${p.postId || p.id}`}>
                                    <div className="thumb"><img src={p.thumbnail || p.image || (Array.isArray(p.imageUrls) ? p.imageUrls[0] : null) || "/default-avatar.png"} alt={p.title} /></div>
                                    <div className="title" title={p.title}>{p.title}</div>
                                    <div className="meta">
                                        <span className="price">{p.price ? p.price.toLocaleString('vi-VN') + ' đ' : ''}</span>
                                        <span className="dot">•</span>
                                        <span className="cond">{p.condition}</span>
                                    </div>
                                    {p.warranty && <div className="warranty">Bảo hành: {p.warranty}</div>}
                                    {p.type === 'battery' && p.cycles && <div className="spec">Số chu kỳ sạc ~ {p.cycles}</div>}
                                    {p.type === 'vehicle' && p.km && <div className="spec">Odo ~ {p.km.toLocaleString('vi-VN')} km</div>}
                                </a>
                            )) : <div>Không có sản phẩm nào</div>}
                        </div>
                    )}
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


