import { useEffect, useState } from "react";
import "./UserSidebar.css"; // Import CSS mới




export default function UserSidebar({ activeItem, onItemClick, username, userRole }) {
    const [localName, setLocalName] = useState(username || "");
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        setLocalName(username || "");
    }, [username]);

    useEffect(() => {
        const loadAvatar = () => {
            const storedAvatar = localStorage.getItem("buyerAvatar");
            // Use placeholder if storedAvatar is null or empty string
            setAvatarUrl(storedAvatar || "/default-avatar.png");
            console.log("Sidebar: Loaded avatar:", storedAvatar || "/default-avatar.png");
        };

        const handleAvatarChange = (event) => {
            const newAvatarUrl = event.detail?.avatarUrl;
            // Use placeholder if newAvatarUrl is null or empty string
            setAvatarUrl(newAvatarUrl || "/default-avatar.png");
            console.log("Sidebar: Avatar changed:", newAvatarUrl || "/default-avatar.png");
        };

        loadAvatar();
        window.addEventListener("buyerAvatarChanged", handleAvatarChange);

        return () => {
            window.removeEventListener("buyerAvatarChanged", handleAvatarChange);
        };
    }, []);

    const baseItems = [
        "Hồ sơ cá nhân",
        "Đổi mật khẩu",
        "Đơn hàng của tôi",
        "Ví điện tử",
        "Gửi khiếu nại" // Giữ lại mục chung
    ];
   
    // Đảm bảo tạo một bản sao mới để không thay đổi baseItems
    const items = [...baseItems];
   
    // Thêm mục quản lý giấy tờ và mua gói chỉ khi là seller
    // Mục nâng cấp thành người bán phải nằm ở cuối cùng
    if (userRole === "seller") {
        // Chèn "Quản lý giấy tờ kinh doanh" trước "Ví điện tử"
        items.splice(3, 0, "Quản lý giấy tờ kinh doanh");
        // Thêm "Mua gói dịch vụ" ở cuối
        items.push("Mua gói dịch vụ");
    } else {
        items.push("Nâng cấp thành người bán");
    };

    // --- RENDER ĐÃ CẬP NHẬT CLASS CSS ---
    return (
        <aside className="user-sidebar">
            <div className="sidebar-profile">
                {/* Container cho avatar */}
                <div className="profile-avatar">
                    <img
                        src={avatarUrl} // State now includes fallback
                        alt="User Avatar"
                        className="avatar-image" // Use new class for the image itself
                        onError={(e) => {
                            // Prevent infinite loop if default also fails
                            if (e.target.src !== "/default-avatar.png") {
                                e.target.onerror = null;
                                e.target.src = "/default-avatar.png";
                            }
                        }}
                    />
                </div>
                <div className="profile-info">
                    <div className="profile-name">{localName || "Người dùng"}</div>
                    <div className="profile-role">{userRole === "seller" ? "Seller" : "Buyer"}</div>
                </div>
            </div>
            <nav className="sidebar-nav">
                {items.map((item) => (
                    <button
                        key={item}
                        // Đổi class thành "nav-item"
                        className={`nav-item ${item === activeItem ? "active" : ""}`}
                        onClick={() => onItemClick && onItemClick(item)}
                    >
                        {item}
                    </button>
                ))}
            </nav>
        </aside>
    );
}



