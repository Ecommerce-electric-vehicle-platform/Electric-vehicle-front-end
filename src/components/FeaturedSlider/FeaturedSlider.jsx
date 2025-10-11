import React from "react"
import Slider from "react-slick"
import { ArrowLeft, ArrowRight } from "lucide-react"
import "./FeaturedSlider.css"

// 🏍 ẢNH XE ĐIỆN
import xe1 from "../../assets/imgs_old/1.jpg"
import xe2 from "../../assets/imgs_old/2.jpg"
import xe3 from "../../assets/imgs_old/3.jpg"
import xe4 from "../../assets/imgs_old/4.jpg"

// 🔋 ẢNH PIN XE ĐIỆN
import pin1 from "../../assets/imgs_pin/Cell-pin-Lipo-1.jpg"
import pin2 from "../../assets/imgs_pin/Pin-xe-dap-dien-Bridgestone-36V-10Ah-600x600.jpg"

export function FeaturedSlider() {
    const featuredItems = [
        {
            id: 1,
            name: "VinFast Feliz S",
            price: 20800000,
            image: xe1,
            link: "/products/vinfast-feliz-s",
        },
        {
            id: 2,
            name: "YADEA Xmen Neo",
            price: 19000000,
            image: xe2,
            link: "/products/yadea-xmen-neo",
        },
        {
            id: 3,
            name: "Giant M133S",
            price: 16500000,
            image: xe3,
            link: "/products/giant-m133s",
        },
        {
            id: 4,
            name: "Pin Bridgestone 36V 10Ah",
            price: 1050000,
            image: pin2,
            link: "/products/pin-bridgestone-36v",
        },
        {
            id: 5,
            name: "Cell Pin Lipo 3.7V 6000mAh",
            price: 850000,
            image: pin1,
            link: "/products/pin-lipo-6000mah",
        },
    ]

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

    // 💵 Hàm định dạng giá tiền VNĐ
    const formatCurrency = (value) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })

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
                    {featuredItems.map((item) => (
                        <div
                            key={item.id}
                            className="featured-slide"
                            onClick={() => (window.location.href = item.link)}
                        >
                            <img src={item.image} alt={item.name} className="featured-image" />
                            <div className="featured-overlay">
                                <h3 className="featured-name">{item.name}</h3>
                                <p className="featured-price">{formatCurrency(item.price)}</p>
                                <button className="featured-btn">
                                    <span>Xem chi tiết</span>
                                    <span>→</span>
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
