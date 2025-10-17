import React, { useState } from "react";
import Slider from "react-slick";
import "./ProductCarousel.css";
import { MapPin, Car, Battery, Eye } from "lucide-react";
import { usePageTransition } from "../../hooks/usePageTransition";
import {
    vehicleProducts,
    batteryProducts,
    formatCurrency,
} from "../../test-mock-data/data/productsData";

export function ProductCarousel({ title, showCategoryToggle = false }) {
    const [activeCategory, setActiveCategory] = useState("vehicles");
    const { navigateToProduct, isTransitioning } = usePageTransition();

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

    const products =
        activeCategory === "vehicles" ? vehicleProducts : batteryProducts;

    // Xử lý click xem chi tiết với hiệu ứng transition
    const handleViewDetails = (product) => {
        navigateToProduct(product.id);
    };

    return (
        <section className="carousel-section">
            <div className="carousel-header">
                <h2 className="carousel-title">{title}</h2>
                <div className="carousel-line"></div>
            </div>

            {/* 🌿 Category Toggle */}
            {showCategoryToggle && (
                <div className="category-tabs">
                    <button
                        className={`category-tab ${activeCategory === "vehicles" ? "active" : ""
                            }`}
                        onClick={() => setActiveCategory("vehicles")}
                    >
                        <Car className="tab-icon" /> Xe điện
                    </button>
                    <button
                        className={`category-tab ${activeCategory === "batteries" ? "active" : ""
                            }`}
                        onClick={() => setActiveCategory("batteries")}
                    >
                        <Battery className="tab-icon" /> Pin xe điện
                    </button>
                </div>
            )}

            {/* 🎠 Slider */}
            <Slider {...settings} className="product-slider">
                {products.map((product) => {
                    return (
                        <div key={product.id} className="product-card">
                            <div className="product-img-wrapper">
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="product-img"
                                />

                                {/* Badge giảm giá */}
                                {product.discount && (
                                    <div className="discount-badge">-{product.discount}%</div>
                                )}
                            </div>

                            <div className="product-info">
                                <h3 className="product-name">{product.title}</h3>
                                <p className="product-brand">
                                    {product.brand} - {product.model}
                                </p>

                                {/* 💰 Giá sản phẩm */}
                                <div className="product-price-wrapper">
                                    <span className="product-price-current">
                                        {formatCurrency(product.price)}
                                    </span>
                                    {product.originalPrice &&
                                        product.originalPrice > product.price && (
                                            <span className="product-price-old">
                                                {formatCurrency(product.originalPrice)}
                                            </span>
                                        )}
                                </div>

                                {/* 📍 Địa điểm đẹp hơn */}
                                <div className="product-location-card">
                                    <div className="location-icon-wrap">
                                        <MapPin className="location-icon" />
                                    </div>
                                    <div className="location-text">{product.locationTrading}</div>
                                </div>

                                {/* 👁️ Nút xem chi tiết */}
                                <button
                                    className="product-btn"
                                    onClick={() => handleViewDetails(product)}
                                    disabled={isTransitioning}
                                >
                                    <Eye className="btn-icon" />
                                    {isTransitioning ? 'Đang chuyển...' : 'Xem chi tiết'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </Slider>
        </section>
    );
}
