import React from "react";
import ProductCard from "./ProductCard";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/Button";

const featuredProducts = [
    {
        image: "/electric-scooter-green.jpg",
        title: "Xe điện VinFast Klara S 2022 - Còn mới 95%",
        price: "18.500.000đ",
        location: "Quận 1, TP. Hồ Chí Minh",
        condition: "Như mới",
        featured: true,
    },
    {
        image: "/electric-bike-battery.jpg",
        title: "Pin Lithium 60V 20Ah chính hãng - Bảo hành 12 tháng",
        price: "4.200.000đ",
        location: "Quận Tân Bình, TP. HCM",
        condition: "Đã qua sử dụng",
    },
    {
        image: "/electric-motorcycle-helmet.jpg",
        title: "Mũ bảo hiểm Royal M139 kèm kính - Fullbox",
        price: "850.000đ",
        location: "Quận 7, TP. Hồ Chí Minh",
        condition: "Còn mới",
    },
    {
        image: "/electric-scooter-blue.jpg",
        title: "Xe máy điện Yadea S3 2023 - Đi 3000km",
        price: "12.800.000đ",
        location: "Quận Bình Thạnh, TP. HCM",
        condition: "Đã qua sử dụng",
        featured: true,
    },
];

export default function FeaturedProducts() {
    return (
        <section className="featured-section">
            <div className="featured-header">
                <div>
                    <h2>Sản phẩm nổi bật</h2>
                    <p>Những sản phẩm được quan tâm nhiều nhất</p>
                </div>
                <Button className="btn-outline desktop-only">
                    Xem tất cả
                    <ArrowRight size={16} />
                </Button>
            </div>

            <div className="product-grid">
                {featuredProducts.map((p, i) => (
                    <ProductCard key={i} {...p} />
                ))}
            </div>

            <div className="mobile-only" style={{ textAlign: "center", marginTop: "2rem" }}>
                <Button className="btn-primary">
                    Xem tất cả sản phẩm <ArrowRight size={16} />
                </Button>
            </div>
        </section>
    );
}
