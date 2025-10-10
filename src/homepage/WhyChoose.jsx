import React from "react";
import { Shield, Leaf, TrendingDown, Users } from "lucide-react";
import { Card, CardContent } from "./ui/Card";

const features = [
    {
        icon: Shield,
        title: "Uy tín & An toàn",
        description: "Mọi giao dịch được bảo vệ, kiểm duyệt kỹ lưỡng trước khi đăng tin",
    },
    {
        icon: Leaf,
        title: "Thân thiện môi trường",
        description: "Góp phần giảm thiểu rác thải điện tử và bảo vệ hành tinh xanh",
    },
    {
        icon: TrendingDown,
        title: "Tiết kiệm chi phí",
        description: "Giá cả hợp lý, tiết kiệm đến 50% so với mua sản phẩm mới",
    },
    {
        icon: Users,
        title: "Cộng đồng lớn",
        description: "Hàng ngàn người dùng tin tưởng và giao dịch mỗi ngày",
    },
];

export default function WhyChooseUs() {
    return (
        <section className="why-section">
            <div className="why-header">
                <h2>
                    Tại sao chọn <span className="highlight">EcoMarket?</span>
                </h2>
                <p>Chúng tôi cam kết mang đến trải nghiệm mua bán tốt nhất cho bạn</p>
            </div>

            <div className="why-grid">
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <Card key={index} className="why-card">
                            <CardContent className="why-card-content">
                                <div className="why-icon">
                                    <Icon size={26} strokeWidth={2.2} color="#16a34a" />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}
