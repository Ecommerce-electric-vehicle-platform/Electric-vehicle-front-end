"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import UserSidebar from "./UserSidebar"
import PersonalProfileForm from "./PersonalProfileForm"
import "./PersonalProfilePage.css"
import ChangePassword from "./ChangePassword"
import UpgradeToSeller from "./UpgradeToSeller"
import PersonalEWallet from "./PersonalEWallet"

export default function PersonalProfilePage() {
  const location = useLocation()
  const [activeSection, setActiveSection] = useState("Hồ sơ cá nhân")
  const [avatarFile, setAvatarFile] = useState(null)
  const [username, setUsername] = useState("")
  //const [userId, setUserId] = useState(null)

  //  Lấy username & userId từ localStorage khi load trang
  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    //const storedUserId = localStorage.getItem("buyerId")
    if (storedUsername) setUsername(storedUsername)
    //if (storedUserId) setUserId(storedUserId)
  }, [])

  //  Đọc query string để mở đúng tab khi điều hướng từ nơi khác
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = (params.get("tab") || params.get("section") || "").toLowerCase()

    if (tab === "wallet" || tab === "e-wallet" || tab === "ewallet") {
      setActiveSection("Ví điện tử")
    } else if (tab === "profile") {
      setActiveSection("Hồ sơ cá nhân")
    } else if (tab === "password") {
      setActiveSection("Đổi mật khẩu")
    } else if (tab === "orders" || tab === "order") {
      setActiveSection("Đơn hàng của tôi")
    } else if (tab === "upgrade") {
      setActiveSection("Nâng cấp thành người bán")
    }
  }, [location.search])

  //  Nhận file avatar từ Sidebar (chỉ preview, upload xử lý ở form)
  const handleAvatarChange = (file) => {
    setAvatarFile(file)
  }

  //  Xử lý click sidebar với scroll smooth
  const handleSidebarClick = (section) => {
    setActiveSection(section)

    // Scroll smooth đến vị trí hiển thị khung bên phải
    setTimeout(() => {
      const profileContainer = document.querySelector('.profile-container')
      if (profileContainer) {
        profileContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        })
      }
    }, 100) // Delay nhỏ để đảm bảo state đã update
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <UserSidebar
          activeItem={activeSection}
          onItemClick={handleSidebarClick}
          onAvatarChange={handleAvatarChange}
          username={username}
        />

        <main className="profile-main">
          {activeSection === "Hồ sơ cá nhân" && (
            <PersonalProfileForm avatarFile={avatarFile} />
          )}

          {activeSection === "Đổi mật khẩu" && <ChangePassword />}
          {activeSection === "Đơn hàng của tôi" && (
            <div>Nội dung đơn hàng sẽ sớm có...</div>
          )}
          {activeSection === "Ví điện tử" && <PersonalEWallet />}
          {activeSection === "Nâng cấp thành người bán" && <UpgradeToSeller />}
        </main>
      </div>
    </div>
  )
}
