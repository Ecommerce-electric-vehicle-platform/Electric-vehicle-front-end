import { ArrowRight, Sparkles, Users, Shield, Zap } from "lucide-react"
import "./CTASection.css"

export function CTASection() {
  // Hàm cuộn mượt đến phần sản phẩm
  const scrollToProducts = () => {
    const productsSection = document.getElementById('products-section')
    if (productsSection) {
      productsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  // Hàm cuộn mượt đến phần upgrade
  const scrollToUpgrade = () => {
    const upgradeSection = document.getElementById('upgrade-section')
    if (upgradeSection) {
      upgradeSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }
  return (
    <section className="cta-section">
      <div className="cta-background">
        <div className="cta-gradient"></div>
        <div className="cta-pattern"></div>
        <div className="cta-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="cta-container">
        <div className="cta-content">
          <div className="cta-badge">
            <Sparkles className="badge-icon" />
            <span>Bắt đầu ngay hôm nay</span>
          </div>

          <h2 className="cta-title">
            Sẵn sàng tham gia <span className="title-highlight">giao dịch</span>?
          </h2>

          <p className="cta-description">
            Tham gia cùng hàng nghìn khách hàng hài lòng và bắt đầu hành trình giao thông bền vững ngay hôm nay
          </p>

          <div className="cta-actions">
            <button className="cta-btn cta-btn-primary" onClick={scrollToProducts}>
              <Zap className="btn-icon" />
              <span>Xem sản phẩm</span>
              <ArrowRight className="btn-arrow" />
            </button>
            <button className="cta-btn cta-btn-secondary" onClick={scrollToUpgrade}>
              <span>Bán sản phẩm</span>
              <ArrowRight className="btn-arrow" />
            </button>
          </div>

          <div className="cta-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <Users className="stat-icon-svg" />
              </div>
              <div className="stat-content">
                <div className="stat-number">1000+</div>
                <div className="stat-label">Người dùng</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Shield className="stat-icon-svg" />
              </div>
              <div className="stat-content">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">An toàn</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Zap className="stat-icon-svg" />
              </div>
              <div className="stat-content">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Hỗ trợ</div>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-visual">
          <div className="cta-card">
            <div className="card-header">
              <div className="card-avatar"></div>
              <div className="card-info">
                <div className="card-name">Nguyễn Văn A</div>
                <div className="card-role">Người bán</div>
              </div>
              <div className="card-rating">
                <span>⭐⭐⭐⭐⭐</span>
              </div>
            </div>
            <div className="card-content">
              <div className="card-message">
                "Nền tảng này giúp tôi bán xe điện cũ một cách dễ dàng và an toàn. Rất hài lòng!"
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}