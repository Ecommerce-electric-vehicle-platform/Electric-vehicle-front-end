"use client"
import { useState, useEffect } from "react"
import "./UserSidebar.css"

export default function UserSidebar({
  activeItem = "Hồ sơ cá nhân",
  onItemClick,
  username = "Tên người dùng",

}) {
  const [avatarImage, setAvatarImage] = useState("/default-avatar.png") // ảnh mặc định


  //  Load avatar từ localStorage
  const loadAvatar = () => {
    const storedAvatar = localStorage.getItem("buyerAvatar")
    if (storedAvatar) {
      setAvatarImage(storedAvatar)
    } else {
      setAvatarImage("/default-avatar.png")
    }
  }

  useEffect(() => {
    loadAvatar()

    //  Lắng nghe event storage để cập nhật realtime khi form cập nhật
    const handleStorageChange = () => loadAvatar()
    window.addEventListener("storage", handleStorageChange)

    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const menuItems = [
    "Hồ sơ cá nhân",
    "Đổi mật khẩu",
    "Đơn hàng của tôi",
    "Ví điện tử",
    "Nâng cấp thành người bán",
  ]




  return (
    <aside className="user-sidebar">
      <div className="sidebar-profile">
        <div className="profile-avatar">
          <img
            src={avatarImage}
            alt="User avatar"
            className="avatar-image"
          />
        </div>
        <p className="profile-name">{username}</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => onItemClick?.(item)}
            className={`nav-item ${activeItem === item ? "active" : ""}`}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  )
}
