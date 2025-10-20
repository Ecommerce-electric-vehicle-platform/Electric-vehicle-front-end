import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import "./Breadcrumbs.css";

// Optional: pass a map to rename segments
export function Breadcrumbs({ labelMap = {} }) {
    const location = useLocation();
    const segments = location.pathname.split("/").filter(Boolean);

    // Vietnamese defaults for common segments
    const defaultViMap = {
        products: "Sản phẩm",
        product: "Chi tiết sản phẩm",
        categories: "Danh mục",
        category: "Danh mục",
        search: "Tìm kiếm",
        cart: "Giỏ hàng",
        checkout: "Thanh toán",
        account: "Tài khoản",
        profile: "Hồ sơ",
        orders: "Đơn hàng",
        favorites: "Yêu thích",
        about: "Giới thiệu",
        contact: "Liên hệ",
    };

    const items = [
        { label: "Trang chủ", to: "/" },
        ...segments.map((seg, idx) => {
            const to = "/" + segments.slice(0, idx + 1).join("/");
            const label = labelMap[seg] || defaultViMap[seg] || decodeURIComponent(seg).replace(/-/g, " ");
            return { label, to };
        }),
    ];

    return (
        <nav className="breadcrumbs" aria-label="breadcrumb">
            <ol className="breadcrumbs-list">
                {items.map((item, idx) => {
                    const isLast = idx === items.length - 1;
                    return (
                        <li key={item.to} className={`breadcrumbs-item ${isLast ? "current" : ""}`}>
                            {idx === 0 ? (
                                <Link to={item.to} className="breadcrumbs-link home">
                                    <Home size={16} />
                                    <span>{item.label}</span>
                                </Link>
                            ) : isLast ? (
                                <span className="breadcrumbs-current">{item.label}</span>
                            ) : (
                                <Link to={item.to} className="breadcrumbs-link">
                                    {item.label}
                                </Link>
                            )}
                            {!isLast && <ChevronRight size={16} className="breadcrumbs-sep" />}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export default Breadcrumbs;


