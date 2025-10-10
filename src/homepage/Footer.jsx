import React from "react";
import { Leaf, Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* ===== BRAND ===== */}
                    <div className="footer-col">
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <Leaf size={22} color="white" />
                            </div>
                            <span className="footer-title">EcoMarket</span>
                        </div>
                        <p className="footer-desc">
                            Nền tảng mua bán xe điện và phụ kiện đã qua sử dụng uy tín, thân thiện với môi trường.
                        </p>
                        <div className="footer-socials">
                            <Button className="btn-social">
                                <Facebook size={18} />
                            </Button>
                            <Button className="btn-social">
                                <Instagram size={18} />
                            </Button>
                            <Button className="btn-social">
                                <Youtube size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* ===== QUICK LINKS ===== */}
                    <div className="footer-col">
                        <h3>Danh mục</h3>
                        <ul>
                            <li><a href="#">Xe điện</a></li>
                            <li><a href="#">Pin & Sạc</a></li>
                            <li><a href="#">Phụ kiện</a></li>
                            <li><a href="#">Phụ tùng</a></li>
                            <li><a href="#">Dịch vụ</a></li>
                        </ul>
                    </div>

                    {/* ===== SUPPORT ===== */}
                    <div className="footer-col">
                        <h3>Hỗ trợ</h3>
                        <ul>
                            <li><a href="#">Trung tâm trợ giúp</a></li>
                            <li><a href="#">Quy định đăng tin</a></li>
                            <li><a href="#">Chính sách bảo mật</a></li>
                            <li><a href="#">Điều khoản sử dụng</a></li>
                            <li><a href="#">Liên hệ</a></li>
                        </ul>
                    </div>

                    {/* ===== NEWSLETTER ===== */}
                    <div className="footer-col">
                        <h3>Nhận tin mới nhất</h3>
                        <p className="footer-desc">
                            Đăng ký để nhận thông báo về sản phẩm mới và ưu đãi đặc biệt
                        </p>
                        <div className="footer-newsletter">
                            <Input type="email" placeholder="Email của bạn" />
                            <Button className="btn-mail">
                                <Mail size={18} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ===== COPYRIGHT ===== */}
                <div className="footer-bottom">
                    <p>© 2025 EcoMarket. Tất cả quyền được bảo lưu.</p>
                    <div className="footer-links">
                        <a href="#">Chính sách bảo mật</a>
                        <a href="#">Điều khoản dịch vụ</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
