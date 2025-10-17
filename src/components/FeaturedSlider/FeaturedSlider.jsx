import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import Slider from "react-slick"
import { ArrowLeft, ArrowRight, Eye, MapPin } from "lucide-react"
import "./FeaturedSlider.css"
import { vehicleProducts, batteryProducts, formatCurrency } from "../../test-mock-data/data/productsData"

export function FeaturedSlider() {
    const navigate = useNavigate()

    // Lấy sản phẩm nổi bật từ dữ liệu mới
    const featuredItems = [
        vehicleProducts[0], // VinFast Feliz S
        vehicleProducts[1], // YADEA Xmen Neo
        vehicleProducts[2], // Giant M133S
        batteryProducts[0], // Pin Bridgestone
        batteryProducts[2], // Cell Pin Lipo
    ]

    // Xử lý click xem chi tiết
    const handleViewDetails = (product) => {
        navigate(`/product/${product.id}`)
    }

    // ⚙️ Cấu hình slider
    const settings = {
        dots: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 3500,
        speed: 700,
        pauseOnHover: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        prevArrow: <PrevArrow />,
        nextArrow: <NextArrow />,
    }

    // ✅ Cuộn xuống phần xe điện
    const scrollToShowcase = () => {
        const section = document.querySelector("#vehicles")
        if (section) {
            section.scrollIntoView({ behavior: "smooth" })
        }
    }

    return (
        <section className="featured-slider-wrapper">
            {/* 🌿 Header */}
            <div className="featured-header" onClick={scrollToShowcase}>
                <h2 className="featured-title">Sản phẩm nổi bật</h2>
                <p className="featured-subtitle">Khám phá những sản phẩm được yêu thích nhất ↓</p>
            </div>

            {/* 🌟 Slider */}
            <div className="featured-slider-container">
                <Slider {...settings}>
                    {featuredItems.map((product) => (
                        <div
                            key={product.id}
                            className="featured-slide"
                        >
                            <img src={product.image} alt={product.title} className="featured-image" />
                            <div className="featured-overlay">
                                <h3 className="featured-name">{product.title}</h3>
                                <p className="featured-brand">{product.brand} - {product.model}</p>
                                <p className="featured-price">{formatCurrency(product.price)}</p>

                                <div className="featured-location">
                                    <MapPin className="detail-icon" />
                                    <span>{product.locationTrading}</span>
                                </div>

                                <button
                                    className="featured-btn"
                                    onClick={() => handleViewDetails(product)}
                                >
                                    <Eye className="btn-icon" />
                                    <span>Xem chi tiết</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>

        </section>
    )
}

// 🔹 Nút điều hướng
function PrevArrow({ onClick }) {
    return (
        <div className="arrow arrow-left" onClick={onClick}>
            <ArrowLeft />
        </div>
    )
}

function NextArrow({ onClick }) {
    return (
        <div className="arrow arrow-right" onClick={onClick}>
            <ArrowRight />
        </div>
    )
}
