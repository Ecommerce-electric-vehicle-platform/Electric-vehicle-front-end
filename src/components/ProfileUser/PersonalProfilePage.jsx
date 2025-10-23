"use client"

// 🔹 1. Import thêm useEffect (nếu chưa có) và useLocation
import { useState, useEffect, useCallback } from "react"; // Giữ useCallback nếu bạn đang debug
import { useLocation } from "react-router-dom"; // Thêm useLocation
import UserSidebar from "./UserSidebar";
import PersonalProfileForm from "./PersonalProfileForm";
import "./PersonalProfilePage.css";
import ChangePassword from "./ChangePassword";
import UpgradeToSeller from "./UpgradeToSeller";
import PersonalEWallet from "./PersonalEWallet";
import SellerBuyPackage from "./SellerBuyPackage"; // Đảm bảo import đúng

export default function PersonalProfilePage() {
  const location = useLocation()
  const [activeSection, setActiveSection] = useState("Hồ sơ cá nhân")
  const [avatarFile, setAvatarFile] = useState(null)
  const [username, setUsername] = useState("")
  //const [userId, setUserId] = useState(null)

  // Hàm wrapper để log (tùy chọn, giữ lại để debug)
  const setActiveSection = useCallback((newSection) => {
    console.log(`>>> setActiveSection called with: "${newSection}"`);
    _setActiveSection(newSection);
  }, []); // Dependency rỗng cho useCallback là OK

  console.log("PersonalProfilePage rendering with activeSection:", activeSection);

  // useEffect lấy username (giữ nguyên)
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
    // Không cần cleanup listener ở đây vì không add listener nào
  }, []); // Dependency rỗng OK vì chỉ đọc localStorage 1 lần

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

  // Hàm xử lý avatar (có thể không cần nữa)
  // const handleAvatarChange = (file) => {
  //   setAvatarFile(file);
  // };

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
  );
}