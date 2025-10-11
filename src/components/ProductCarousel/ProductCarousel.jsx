import React, { useState } from "react"
import Slider from "react-slick"
import "./ProductCarousel.css"
import { MapPin, Car, Battery } from "lucide-react"

// 🏍 ẢNH XE ĐIỆN
import xe1 from "../../assets/imgs_old/1.jpg"
import xe2 from "../../assets/imgs_old/2.jpg"
import xe3 from "../../assets/imgs_old/3.jpg"
import xe4 from "../../assets/imgs_old/4.jpg"

// 🔋 ẢNH PIN XE ĐIỆN
import pin1 from "../../assets/imgs_pin/Cell-pin-Lipo-1.jpg"
import pin2 from "../../assets/imgs_pin/Pin-xe-dap-dien-Bridgestone-36V-10Ah-600x600.jpg"
import pin3 from "../../assets/imgs_pin/Pin-xe-dap-dien-Hitasa-600x600.jpg"
import pin4 from "../../assets/imgs_pin/Dong-pin-xe-dap-dien-theo-yeu-cau-scaled-600x600.jpg"

export function ProductCarousel({ title, showCategoryToggle = false }) {
    const [activeCategory, setActiveCategory] = useState("vehicles")

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
    }

    // 🚗 Xe điện (giả lập có sản phẩm đã bán)
    const vehicleProducts = [
        { name: "VinFast Feliz S", price: 20800000, location: "Hà Nội", discount: 10, image: xe1, status: "available" },
        { name: "YADEA Xmen Neo", price: 19000000, location: "TP.HCM", discount: 8, image: xe2, status: "sold" },
        { name: "Giant M133S", price: 16500000, location: "Đà Nẵng", discount: 6, image: xe3, status: "available" },
        { name: "Pega Aura", price: 21500000, location: "Cần Thơ", discount: 12, image: xe4, status: "sold" },
    ]

    // 🔋 Pin xe điện
    const batteryProducts = [
        { name: "Pin Bridgestone 36V 10Ah", price: 1050000, location: "Hà Nội", discount: 15, image: pin2, status: "available" },
        { name: "Pin xe đạp điện Hitasa", price: 1250000, location: "TP.HCM", discount: 10, image: pin3, status: "sold" },
        { name: "Cell Pin Lipo 3.7V 8000mAh", price: 850000, location: "Đà Nẵng", discount: 8, image: pin1, status: "available" },
        { name: "Pin xe điện đặt theo yêu cầu", price: 1300000, location: "Cần Thơ", discount: 12, image: pin4, status: "available" },
    ]

    const products = activeCategory === "vehicles" ? vehicleProducts : batteryProducts

    // 💵 Định dạng tiền VNĐ
    const formatCurrency = (value) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })

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
                        className={`category-tab ${activeCategory === "vehicles" ? "active" : ""}`}
                        onClick={() => setActiveCategory("vehicles")}
                    >
                        <Car className="tab-icon" /> Xe điện
                    </button>
                    <button
                        className={`category-tab ${activeCategory === "batteries" ? "active" : ""}`}
                        onClick={() => setActiveCategory("batteries")}
                    >
                        <Battery className="tab-icon" /> Pin xe điện
                    </button>
                </div>
            )}

            {/* 🎠 Slider */}
            <Slider {...settings} className="product-slider">
                {products.map((item, index) => (
                    <div key={index} className="product-card">
                        <div className="product-img-wrapper">
                            <img src={item.image} alt={item.name} className="product-img" />

                            {/* Hiển thị discount badge cho tất cả sản phẩm có discount */}
                            {item.discount && (
                                <div className="discount-badge">-{item.discount}%</div>
                            )}
                        </div>

                        <div className="product-info">
                            <h3 className="product-name">{item.name}</h3>
                            <p className="product-price">{formatCurrency(item.price)}</p>

                            <div className="product-details">
                                <MapPin className="detail-icon" />
                                <span>{item.location}</span>
                            </div>

                            {/* Hiển thị nút cho tất cả sản phẩm */}
                            <button className="product-btn">Xem chi tiết</button>
                        </div>
                    </div>
                ))}
            </Slider>
        </section>
    )
}
