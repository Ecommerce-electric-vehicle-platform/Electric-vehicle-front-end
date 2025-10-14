"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Home, ArrowLeft } from "lucide-react"
import UserSidebar from "./UserSidebar"
import PersonalProfileForm from "./PersonalProfileForm"
import { Header } from "./Header/Header"
import { Footer } from "./Footer/Footer"
import "./PersonalProfilePage.css"
import ChangePassword from "./ChangePassword"
import UpgradeToSeller from "./UpgradeToSeller"

export default function PersonalProfilePage() {
  const [activeSection, setActiveSection] = useState("Personal profile")
  const [avatarFile, setAvatarFile] = useState(null)
  const [username, setUsername] = useState("")
  const [userId, setUserId] = useState(null)
  const navigate = useNavigate()

  //  Lấy username & userId từ localStorage khi load trang
  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    const storedUserId = localStorage.getItem("buyerId")
    if (storedUsername) setUsername(storedUsername)
    if (storedUserId) setUserId(storedUserId)
  }, [])

  //  Nhận file avatar từ Sidebar (chỉ preview, upload xử lý ở form)
  const handleAvatarChange = (file) => {
    setAvatarFile(file)
  }

  // Hàm xử lý quay lại trang trước
  const handleGoBack = () => {
    navigate(-1)
  }

  // Hàm lấy tên section hiện tại để hiển thị trong breadcrumb
  const getCurrentSectionName = () => {
    switch (activeSection) {
      case "Personal profile":
        return "Thông tin cá nhân"
      case "Change password":
        return "Đổi mật khẩu"
      case "My order":
        return "Đơn hàng của tôi"
      case "Personal E-wallet":
        return "Ví điện tử"
      case "Upgrade to Seller":
        return "Nâng cấp thành người bán"
      default:
        return "Cài đặt"
    }
  }

  return (
    <div className="profile-page-layout">
      {/* <Header /> */}

      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-item">
          <Home className="breadcrumb-icon" />
          Trang chủ
        </Link>
        <span className="breadcrumb-separator">/</span>
        <button className="breadcrumb-item" onClick={handleGoBack}>
          <ArrowLeft className="breadcrumb-icon" />
          Quay lại
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{getCurrentSectionName()}</span>
      </div>

      <div className="profile-page">
        <UserSidebar
          activeItem={activeSection}
          onItemClick={setActiveSection}
          onAvatarChange={handleAvatarChange}
          username={username}
        />

        <main className="profile-main">
          {activeSection === "Personal profile" && (
            <PersonalProfileForm avatarFile={avatarFile} />
          )}

          {activeSection === "Change password" && <ChangePassword />}
          {activeSection === "My order" && (
            <div>My order content coming soon...</div>
          )}
          {activeSection === "Personal E-wallet" && (
            <div>Personal E-wallet content coming soon...</div>
          )}
          {activeSection === "Upgrade to Seller" && <UpgradeToSeller />}
        </main>
      </div>

      {/* <Footer /> */}
    </div>
  )
}
