import { useEffect, useState } from "react";
import "./UserSidebar.css";

// Lightweight sidebar component to avoid recursive imports and render loops.
export default function UserSidebar({ activeItem, onItemClick, username, userRole }) {
    const [localName, setLocalName] = useState(username || "");

    useEffect(() => {
        setLocalName(username || "");
    }, [username]);

    // Listen for avatar changes (custom event)
        useEffect(() => {
            const handleAvatar = () => {
                // placeholder: when avatar changes we could update local cache or trigger light UI updates
            };
            window.addEventListener("buyerAvatarChanged", handleAvatar);
            return () => window.removeEventListener("buyerAvatarChanged", handleAvatar);
        }, []);

    const baseItems = [
        "Hồ sơ cá nhân",
        "Đổi mật khẩu",
        "Đơn hàng của tôi",
        "Ví điện tử",
    ];
    
    const items = [...baseItems];
    
    if (userRole === "seller") {
        items.push("Mua gói dịch vụ");
    } else {
        items.push("Nâng cấp thành người bán");
    };

    return (
        <aside className="user-sidebar">
            <div className="sidebar-profile">
                <div className="profile-name">{localName || "Người dùng"}</div>
                <div className="profile-role">{userRole === "seller" ? "Seller" : "Buyer"}</div>
            </div>
            <nav className="sidebar-nav">
                {items.map((it) => (
                    <button
                        key={it}
                        className={`sidebar-item ${it === activeItem ? "active" : ""}`}
                        onClick={() => onItemClick && onItemClick(it)}
                    >
                        {it}
                    </button>
                ))}
            </nav>
        </aside>
    );
}