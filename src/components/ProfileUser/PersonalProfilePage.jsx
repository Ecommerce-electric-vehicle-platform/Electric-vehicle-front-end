"use client"

import { useState, useEffect } from "react"
import UserSidebar from "./UserSidebar"
import PersonalProfileForm from "./PersonalProfileForm"
import "./PersonalProfilePage.css"
import ChangePassword from "./ChangePassword"
import UpgradeToSeller from "./UpgradeToSeller"
import PersonalEWallet from "./PersonalEWallet"
import SellerBuyPackage from "./SellerBuyPackage"

export default function PersonalProfilePage() {
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
        {activeSection === "Seller business package" && <SellerBuyPackage />}
      </main>
    </div>
  )
}
