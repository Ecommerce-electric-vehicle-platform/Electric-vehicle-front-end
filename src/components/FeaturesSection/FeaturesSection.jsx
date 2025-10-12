import { Shield, Zap, Award, HeadphonesIcon, Leaf, TrendingUp, CheckCircle } from "lucide-react"
import "./FeaturesSection.css"

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Kiểm định chất lượng",
      description: "Mọi sản phẩm đều được kiểm tra kỹ lưỡng để đảm bảo chất lượng tốt nhất.",
      color: "blue"
    },
    {
      icon: Zap,
      title: "Kiểm tra pin chi tiết",
      description: "Báo cáo tình trạng pin chi tiết và minh bạch cho người mua.",
      color: "yellow"
    },
    {
      icon: Award,
      title: "Bảo hành đầy đủ",
      description: "Bảo hành toàn diện cho tất cả sản phẩm đã được kiểm định.",
      color: "purple"
    },
    {
      icon: HeadphonesIcon,
      title: "Hỗ trợ 24/7",
      description: "Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ mọi thắc mắc của bạn.",
      color: "green"
    },
    {
      icon: Leaf,
      title: "Thân thiện môi trường",
      description: "Góp phần xây dựng tương lai bền vững với mỗi giao dịch.",
      color: "emerald"
    },
    {
      icon: TrendingUp,
      title: "Giá cả cạnh tranh",
      description: "Định giá minh bạch và cạnh tranh trên thị trường.",
      color: "orange"
    },
  ]

  const benefits = [
    "Giao dịch an toàn 100%",
    "Kiểm tra kỹ thuật miễn phí",
    "Bảo hành 12 tháng",
    "Hỗ trợ vận chuyển"
  ]

  return (
    <section className="features-section" id="features">
      <div className="features-container">
        <div className="features-header">
          <div className="features-badge">
            <CheckCircle className="badge-icon" />
            <span>Tính năng nổi bật</span>
          </div>
          <h2 className="features-title">
            Tại sao chọn <span className="title-highlight">nền tảng</span> của chúng tôi?
          </h2>
          <p className="features-description">
            Chúng tôi cung cấp nền tảng đáng tin cậy nhất để mua bán xe điện và pin đã qua sử dụng
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className={`feature-card feature-card-${feature.color}`}>
                <div className="feature-card-inner">
                  <div className="feature-icon-wrapper">
                    <Icon className="feature-icon" />
                  </div>
                  <div className="feature-content">
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                  <div className="feature-decoration"></div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="features-benefits">
          <div className="benefits-header">
            <h3>Lợi ích khi sử dụng</h3>
          </div>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
