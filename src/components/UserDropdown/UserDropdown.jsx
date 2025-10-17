import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    User,
    LogOut,
    ChevronDown,
    Heart,
    Package,
    Plus
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

    // Menu items theo giao diện trong ảnh
    const accountItems = [
        {
            id: 'profile',
            label: 'Hồ sơ',
            icon: <User className="menu-icon" />
        },
        {
            id: 'wishlist',
            label: 'Yêu thích',
            icon: <Heart className="menu-icon" />
        },
        {
            id: 'my-orders',
            label: 'Đơn hàng của tôi',
            icon: <Package className="menu-icon" />
        }
    ]

    const postItems = [
        {
            id: 'post-management',
            label: 'Quản lý tin đăng',
            icon: <Plus className="menu-icon" />
        },
        {
            id: 'create-new-post',
            label: 'Tạo tin đăng mới',
            icon: <Plus className="menu-icon" />
        }
    ]


    const handleMenuClick = (item) => {
        switch (item.id) {
            case 'profile':
                navigate('/profile')
                break
            case 'wishlist':
                navigate('/favorites')
                break
            case 'my-orders':
                navigate('/orders')
                break
            case 'post-management':
                navigate('/seller-dashboard')
                break
            case 'create-new-post':
                // TODO: Navigate to create post page
                console.log('Navigate to create post')
                break
            default:
                console.log(`Clicked: ${item.label}`)
        }
        setIsOpen(false)
    }

    const handleLogout = () => {
        onLogout()
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
                    {/* Header */}
                    <div className="dropdown-header">
                        <span className="header-title">Tài khoản của tôi</span>
                    </div>

                    {/* Account Items */}
                    <div className="dropdown-section">
                        {accountItems.map((item) => (
                            <button
                                key={item.id}
                                className="dropdown-item"
                                onClick={() => handleMenuClick(item)}
                            >
                                <div className="item-icon">{item.icon}</div>
                                <span className="item-label">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Post Management Items */}
                    <div className="dropdown-section">
                        {postItems.map((item) => (
                            <button
                                key={item.id}
                                className="dropdown-item"
                                onClick={() => handleMenuClick(item)}
                            >
                                <div className="item-icon">{item.icon}</div>
                                <span className="item-label">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Logout */}
                    <div className="dropdown-section">
                        <button className="dropdown-item logout-item" onClick={handleLogout}>
                            <span className="item-label">Đăng xuất</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
