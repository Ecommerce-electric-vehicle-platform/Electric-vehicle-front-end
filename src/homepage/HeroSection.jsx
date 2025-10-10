import React from "react";
import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "./ui/Button";

export default function HeroSection() {
    return (
        <section className="hero-section">
            <div className="hero-container">
                <div className="hero-content">
                    <div className="hero-tag">
                        <Leaf size={16} /> Thân thiện với môi trường
                    </div>

                    <h1>
                        Mua bán xe điện & phụ kiện{" "}
                        <span className="highlight">đã qua sử dụng</span>
                    </h1>

                    <p>
                        Nền tảng mua bán xe điện và phụ kiện uy tín, giúp bạn tiết kiệm chi
                        phí và bảo vệ môi trường. Hàng ngàn sản phẩm chất lượng đang chờ bạn
                        khám phá.
                    </p>

                    <div className="hero-buttons">
                        <Button className="btn-primary">
                            Khám phá ngay <ArrowRight size={18} />
                        </Button>
                        <Button className="btn-outline">Đăng tin miễn phí</Button>
                    </div>

                    <div className="hero-stats">
                        <div>
                            <div className="stat-value">10K+</div>
                            <div className="stat-label">Sản phẩm</div>
                        </div>
                        <div>
                            <div className="stat-value">5K+</div>
                            <div className="stat-label">Người dùng</div>
                        </div>
                        <div>
                            <div className="stat-value">98%</div>
                            <div className="stat-label">Hài lòng</div>
                        </div>
                    </div>
                </div>

                <div className="hero-image-wrapper">
                    <img
                        src="/electric-scooter-bike-eco-friendly-green.jpg"
                        alt="Xe điện thân thiện môi trường"
                        className="hero-image"
                    />

                    <div className="eco-badge">
                        <div className="eco-icon">
                            <Leaf size={22} color="#16a34a" />
                        </div>
                        <div>
                            <div className="eco-title">Giảm 40% CO₂</div>
                            <div className="eco-sub">Khi sử dụng xe điện</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
