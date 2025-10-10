import React from "react";
import logo from "../assets/logo/Logo 2.png";

export default function Header() {
    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    <img src={logo} alt="EcoMarket Logo" className="logo-img" />
                    <h1>EcoMarket</h1>
                </div>

                <div className="header-search">
                    <input type="text" placeholder="Tìm kiếm sản phẩm, phụ kiện..." />
                </div>

                <div className="header-right">
                    <button className="btn-outline">Đăng nhập</button>
                    <button className="btn-primary">Đăng ký</button>
                </div>
            </div>
        </header>
    );
}
