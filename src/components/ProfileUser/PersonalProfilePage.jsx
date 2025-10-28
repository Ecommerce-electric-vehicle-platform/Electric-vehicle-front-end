import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import PersonalProfileForm from "./PersonalProfileForm";
import "./PersonalProfilePage.css";
import ChangePassword from "./ChangePassword";
import UpgradeToSeller from "./UpgradeToSeller";
import PersonalEWallet from "./PersonalEWallet";
import SellerBuyPackage from "./SellerBuyPackage";

export default function PersonalProfilePage() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("Hồ sơ cá nhân");
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("buyer"); // mặc định buyer

  console.log("🔄 PersonalProfilePage render | Section:", activeSection, "| Role:", userRole);

  // === LẤY USERNAME ===
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  // === LẤY VÀ THEO DÕI ROLE NGƯỜI DÙNG ===
  useEffect(() => {
    const checkRole = () => {
      const storedRole = localStorage.getItem("userRole") || "buyer";
      setUserRole(storedRole);
      console.log("👤 User role cập nhật:", storedRole);
    };

    checkRole(); // đọc lần đầu
    window.addEventListener("roleChanged", checkRole);
    window.addEventListener("authStatusChanged", checkRole);

    return () => {
      window.removeEventListener("roleChanged", checkRole);
      window.removeEventListener("authStatusChanged", checkRole);
    };
  }, []);

  // === ĐỌC QUERY PARAM (?tab=...) ===
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    console.log("🔗 URL tab =", tab);

    switch (tab) {
      case "wallet":
        setActiveSection("Ví điện tử");
        break;
      case "profile":
        setActiveSection("Hồ sơ cá nhân");
        break;
      case "password":
        setActiveSection("Đổi mật khẩu");
        break;
      case "orders":
        setActiveSection("Đơn hàng của tôi");
        break;
      case "upgrade":
        setActiveSection("Nâng cấp thành người bán");
        break;
      case "buy-seller-package":
        setActiveSection("Mua gói dịch vụ");
        break;
      default:
        // nếu tab không hợp lệ, giữ nguyên
        break;
    }
  }, [location.search]);

  // === HANDLE SIDEBAR CLICK ===
  const handleSidebarClick = (section) => {
    if (section === activeSection) return; // ✅ tránh render lại không cần thiết
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKycAccepted = () => {
    console.log("KYC Accepted! Navigating to Buy Package...");
    // Đổi activeSection sang "Mua gói dịch vụ"
    setActiveSection("Mua gói dịch vụ");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // === JSX ===
  return (
    <div className="profile-page">
      <div className="profile-container">
        <UserSidebar
          activeItem={activeSection}
          onItemClick={handleSidebarClick}
          username={username}
          userRole={userRole}
        />

        <main className="profile-main">
          {activeSection === "Hồ sơ cá nhân" && <PersonalProfileForm />}
          {activeSection === "Đổi mật khẩu" && <ChangePassword />}
          {activeSection === "Đơn hàng của tôi" && <div>📦 Nội dung đơn hàng đang được cập nhật...</div>}
          {activeSection === "Ví điện tử" && <PersonalEWallet />}
          {activeSection === "Nâng cấp thành người bán" && (
            <UpgradeToSeller onGoToProfile={() => setActiveSection("Hồ sơ cá nhân")}
              onKycAccepted={handleKycAccepted}
            />
          )}

          {/* 🔹 Chỉ render SellerBuyPackage nếu role là seller hoặc đang mở đúng tab */}
          {activeSection === "Mua gói dịch vụ" && <SellerBuyPackage />}
        </main>
      </div>
    </div>
  );
}