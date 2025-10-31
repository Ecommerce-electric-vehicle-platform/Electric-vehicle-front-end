import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import sellerApi from "../../api/sellerApi";

const SellerProfile = () => {
    const { sellerId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const prefetch = location.state?.sellerPrefetch || null;

    const [seller, setSeller] = useState(prefetch || null);
    const [sellerLoading, setSellerLoading] = useState(false);
    const [sellerError, setSellerError] = useState(null);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState(null);

    useEffect(() => {
        let mounted = true;
        if (!prefetch && sellerId) {
            setSellerLoading(true);
            sellerApi.getSellerProfile(sellerId).then(data => {
                if (!mounted) return;
                if (!data) {
                    setSellerError("Không tìm thấy người bán.");
                    setSeller(null);
                } else {
                    setSeller(data);
                    setSellerError(null);
                }
                setSellerLoading(false);
            }).catch(e => {
                setSellerError("Đã có lỗi khi tải hồ sơ người bán.");
                setSeller(null);
                setSellerLoading(false);
            });
        }
        return () => { mounted = false; };
    }, [sellerId, prefetch]);

    useEffect(() => {
        let mounted = true;
        if (sellerId) {
            setProductsLoading(true);
            sellerApi.getProductsBySeller(sellerId)
                .then(items => {
                    if (!mounted) return;
                    setProducts(Array.isArray(items) ? items : []);
                    setProductsError(null);
                    setProductsLoading(false);
                })
                .catch(() => {
                    if (!mounted) return;
                    setProducts([]);
                    setProductsError("Không tải được danh sách sản phẩm.");
                    setProductsLoading(false);
                });
        }
        return () => { mounted = false; };
    }, [sellerId]);

    const nameToShow = seller?.storeName || seller?.sellerName || "Seller";
    const statusToShow = seller?.status || "";
    const locationToShow = seller?.home || seller?.nationality || "";

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
            <section style={{ marginBottom: 32, padding: 24, background: "#fff", borderRadius: 12, border: '1px solid #e5e7eb' }}>
                {/* Seller header */}
                <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Seller Information</h2>
                {sellerLoading ? <p>Đang tải thông tin người bán…</p> : sellerError ? <p style={{ color: "#ef4444" }}>{sellerError}</p> : seller ? (
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                            <div style={{ width: 60, height: 60, borderRadius: "50%", backgroundColor: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: "#10b981" }}>{nameToShow[0]}</div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{nameToShow}</div>
                                {statusToShow && <span style={{ padding: "2px 8px", fontSize: 12, borderRadius: 4, backgroundColor: "#f3f4f6", marginRight: 8 }}>{statusToShow}</span>}
                                {locationToShow && <span style={{ fontSize: 14, color: '#6b7280' }}>{locationToShow}</span>}
                            </div>
                        </div>
                    </div>
                ) : <p>Không tìm thấy thông tin người bán.</p>}
            </section>

            {/* Seller's products grid/list */}
            <section style={{ marginBottom: 32, padding: 24, background: "#fff", borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Sản phẩm của người bán</h3>
                {productsLoading ? <p>Đang tải sản phẩm…</p> : productsError ? <p style={{ color: "#ef4444" }}>{productsError}</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        {products.length === 0 ? <div>Không có sản phẩm nào</div> : products.map(p => (
                            <div key={p.id || p.postId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: "#fafbfc", display: "flex", flexDirection: "column", gap: 8 }}>
                                <img src={p.thumbnail || p.image || (Array.isArray(p.imageUrls) ? p.imageUrls[0] : null) || "/default-avatar.png"} alt={p.title} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
                                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{p.title}</div>
                                <div style={{ fontSize: 14, color: '#10b981', fontWeight: 500 }}>{p.price ? p.price.toLocaleString('vi-VN') + ' đ' : ''}</div>
                                <button style={{ padding: '6px 0', marginTop: 8, width: '100%', border: '1px solid #10b981', borderRadius: 4, background: '#fff', color: '#10b981', cursor: 'pointer' }} onClick={() => navigate(`/product/${p.postId || p.id}`)}>Xem chi tiết</button>
                            </div>
                        ))}
                    </div>)
                }
            </section>
        </div>
    );
};

export default SellerProfile;
