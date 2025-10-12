import { Zap, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import "./Footer.css"

export function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* 🌿 Brand Section */}
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              <div className="footer-logo-icon">
                <Zap className="footer-zap" />
              </div>
              <span className="footer-logo-text">GreenTrade</span>
            </a>
            <p className="footer-tagline">
              Nền tảng giao dịch đáng tin cậy cho xe điện và pin đã qua sử dụng.
              Giao thông bền vững dễ tiếp cận.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Facebook">
                <Facebook className="social-icon" />
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter className="social-icon" />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <Instagram className="social-icon" />
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <Linkedin className="social-icon" />
              </a>
            </div>
          </div>

          {/* 🌎 Thị trường */}
          <div className="footer-links-section">
            <h3 className="footer-heading">Thị trường</h3>
            <ul className="footer-links">
              <li><a href="#vehicleshowcase-section">Xem xe điện</a></li>
              <li><a href="#vehicleshowcase-section">Xem pin xe điện</a></li>
              <li><a href="#sell">Bán sản phẩm</a></li>
              <li><a href="#pricing">Bảng giá</a></li>
            </ul>
          </div>

          {/* 🏢 Công ty */}
          <div className="footer-links-section">
            <h3 className="footer-heading">Công ty</h3>
            <ul className="footer-links">
              <li><a href="#about">Về chúng tôi</a></li>
              <li><a href="#features">Tính năng</a></li>
              <li><a href="#blog">Tin tức</a></li>
              <li><a href="#careers">Tuyển dụng</a></li>
            </ul>
          </div>

          {/* 🛠 Hỗ trợ */}
          <div className="footer-links-section">
            <h3 className="footer-heading">Hỗ trợ</h3>
            <ul className="footer-links">
              <li><a href="#help">Trung tâm trợ giúp</a></li>
              <li><a href="#contact">Liên hệ</a></li>
              <li><a href="#faq">Câu hỏi thường gặp</a></li>
              <li><a href="#warranty">Thông tin bảo hành</a></li>
            </ul>
          </div>

          {/* ⚖ Pháp lý */}
          <div className="footer-links-section">
            <h3 className="footer-heading">Pháp lý</h3>
            <ul className="footer-links">
              <li><a href="#privacy">Chính sách bảo mật</a></li>
              <li><a href="#terms">Điều khoản dịch vụ</a></li>
              <li><a href="#cookies">Chính sách cookie</a></li>
              <li><a href="#disclaimer">Miễn trừ trách nhiệm</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2025 Grand Trade. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  )
}
