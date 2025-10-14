import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    User,
    LogOut,
    ChevronDown,
    Heart,
    History,
    Settings,
    Edit3,
    Star,
    Bookmark,
    Coins
} from "lucide-react"
import "./UserDropdown.css"

export function UserDropdown({ userInfo, onLogout }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Menu items theo giao diện trong ảnh - chỉ hiển thị trong dropdown
    const utilityItems = [
        {
            id: 'saved-posts',
            label: 'Tin đăng đã lưu',
            icon: <Heart className="menu-icon" />
        },
        {
            id: 'saved-searches',
            label: 'Tìm kiếm đã lưu',
            icon: <Bookmark className="menu-icon" />
        },
        {
            id: 'view-history',
            label: 'Lịch sử xem tin',
            icon: <History className="menu-icon" />
        },
        {
            id: 'my-reviews',
            label: 'Đánh giá từ tôi',
            icon: <Star className="menu-icon" />
        }
    ]


    const handleMenuClick = (item) => {
        // Chỉ hiển thị thông báo hoặc xử lý logic trong dropdown
        console.log(`Clicked: ${item.label}`)
        // Có thể thêm logic xử lý khác ở đây nếu cần
    }

    const handleLogout = () => {
        onLogout()
        setIsOpen(false)
    }

    const handleSettingsClick = () => {
        navigate('/profile')
        setIsOpen(false)
    }

    return (
        <div className="user-dropdown" ref={dropdownRef}>
            {/* Avatar Button */}
            <button
                className="avatar-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Mở menu người dùng"
            >
                <div className="avatar">
                    <User className="avatar-icon" />
                </div>
                <span className="username">{userInfo?.username}</span>
                <ChevronDown className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="dropdown-menu">
                    {/* User Profile Section */}
                    <div className="profile-section">
                        <div className="profile-avatar-container">
                            <div className="profile-avatar">
                                <User className="profile-avatar-icon" />
                            </div>
                            <button className="edit-avatar-btn">
                                <Edit3 className="edit-icon" />
                            </button>
                        </div>
                        <div className="profile-name">{userInfo?.username}</div>
                        <div className="profile-stats">
                            <span>Người theo dõi 0</span>
                            <span>Đang theo dõi 0</span>
                        </div>
                    </div>

                    {/* Đồng Tốt Section */}
                    <div className="coins-section">
                        <div className="coins-header">
                            <Coins className="coins-icon" />
                            <span>Đồng Tốt</span>
                        </div>
                        <div className="coins-balance">0</div>
                        <button className="recharge-btn">Nạp ngay</button>
                    </div>

                    {/* Tiện ích Section */}
                    <div className="utilities-section">
                        <div className="section-title">Tiện ích</div>
                        <div className="utility-items">
                            {utilityItems.map((item) => (
                                <button
                                    key={item.id}
                                    className="utility-item"
                                    onClick={() => handleMenuClick(item)}
                                >
                                    <div className="utility-icon">{item.icon}</div>
                                    <span className="utility-label">{item.label}</span>
                                    <ChevronDown className="utility-arrow" />
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* Settings & Logout */}
                    <div className="menu-footer">
                        <button className="menu-item settings-item" onClick={handleSettingsClick}>
                            <div className="menu-item-content">
                                <div className="menu-item-icon">
                                    <Settings className="menu-icon" />
                                </div>
                                <div className="menu-item-text">
                                    <div className="menu-item-label">Cài đặt</div>
                                </div>
                            </div>
                        </button>

                        <button className="menu-item logout-item" onClick={handleLogout}>
                            <div className="menu-item-content">
                                <div className="menu-item-icon">
                                    <LogOut className="menu-icon" />
                                </div>
                                <div className="menu-item-text">
                                    <div className="menu-item-label">Đăng xuất</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
