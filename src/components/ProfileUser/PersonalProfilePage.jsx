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
  const [activeSection, setActiveSection] = useState("Personal profile")
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
      setActiveSection("Personal E-wallet")
    } else if (tab === "profile") {
      setActiveSection("Personal profile")
    } else if (tab === "password") {
      setActiveSection("Change password")
    } else if (tab === "orders" || tab === "order") {
      setActiveSection("My order")
    } else if (tab === "upgrade") {
      setActiveSection("Upgrade to Seller")
    }
  }, [location.search])

  //  Nhận file avatar từ Sidebar (chỉ preview, upload xử lý ở form)
  const handleAvatarChange = (file) => {
    setAvatarFile(file)
  }

  return (
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
        {activeSection === "Personal E-wallet" && <PersonalEWallet />}
        {activeSection === "Upgrade to Seller" && <UpgradeToSeller />}
      </main>
    </div>
  )
}
