import React, { useEffect, useMemo, useState } from "react";
import Slider from "react-slick";
import "./ProductCarousel.css";
import { Car, Battery } from "lucide-react";
import { usePageTransition } from "../../hooks/usePageTransition";
import { fetchPostProducts, normalizeProduct } from "../../api/productApi";
import { ProductCard } from "../ProductCard/ProductCard";
import { useFavoritesList } from "../../hooks/useFavorite";

export function ProductCarousel({ title, showCategoryToggle = false }) {
    const [activeCategory, setActiveCategory] = useState("vehicles");
    const { navigateToProduct } = usePageTransition();

    // ⚙️ Slider config
    const settings = {
        dots: false,
        infinite: true,
        speed: 800,
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3500,
        responsive: [
            { breakpoint: 1280, settings: { slidesToShow: 3 } },
            { breakpoint: 992, settings: { slidesToShow: 2 } },
            { breakpoint: 640, settings: { slidesToShow: 1 } },
        ],
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [page] = useState(1);
    const [size] = useState(12);
    const [productsRaw, setProductsRaw] = useState([]);

    // Favorite management hook
    const { getFavoriteStatus, toggleFavoriteForProduct } = useFavoritesList();

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError("");

        // Có thể truyền tham số category vào params nếu BE hỗ trợ
        const params = {};
        fetchPostProducts({ page, size, params })
            .then(({ items }) => {
                if (!mounted) return;
                setProductsRaw(items || []);
            })
            .catch((err) => {
                if (!mounted) return;
                setError(err?.message || "Không thể tải sản phẩm");
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [page, size]);

    const products = useMemo(() => {
        const mapped = (productsRaw || [])
            .map(normalizeProduct)
            .filter(Boolean)
            .filter((p) => !(p?.isSold || String(p?.status).toLowerCase() === "sold"))
            .filter((p) => p?.verifiedDecisionStatus !== "REJECTED");
        // Nếu có phân loại, ở đây chỉ demo filter client theo brand/model chứa từ khoá
        if (activeCategory === "vehicles") return mapped;
        if (activeCategory === "batteries") return mapped;
        return mapped;
    }, [productsRaw, activeCategory]);

    // Xử lý click xem chi tiết với hiệu ứng transition
    const handleViewDetails = (product) => {
        navigateToProduct(product.postId ?? product.id);
    };

    return (
        <section className="carousel-section">
            <div className="carousel-header">
                <h2 className="carousel-title">{title}</h2>
                <div className="carousel-line"></div>
            </div>


            {/* 🎠 Slider */}
            {loading && (<div className="product-loading">Đang tải sản phẩm...</div>)}
            {error && !loading && (<div className="product-error">{error}</div>)}
            {!loading && !error && (
                <Slider {...settings} className="product-slider">
                    {products.map((product) => (
                        <div key={product.id} className="product-slide">
                            <ProductCard
                                product={product}
                                variant="default"
                                onViewDetails={handleViewDetails}
                                onToggleFavorite={toggleFavoriteForProduct}
                                isFavorite={getFavoriteStatus(product.postId || product.id)}
                                showActions={true}
                                showCondition={true}
                                showLocation={true}
                                showDate={true}
                                showVerified={true}
                            />
                        </div>
                    ))}
                </Slider>
            )}
        </section>
    );
}
