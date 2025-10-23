

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
  // Khởi tạo state vẫn là "Personal profile"
  const [activeSection, _setActiveSection] = useState("Personal profile");
  // const [avatarFile, setAvatarFile] = useState(null); // Có thể không cần nữa
  const [username, setUsername] = useState("");
  const location = useLocation(); // Lấy thông tin đường dẫn

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

  // 🔹 2. THÊM useEffect NÀY ĐỂ ÉP SECTION KHI VÀO TRANG `/profile` 🔹
  useEffect(() => {
    // Khi component này được mount HOẶC đường dẫn thay đổi ĐẾN trang này,
    // luôn đặt lại activeSection về giá trị mặc định.
    console.log("Forcing activeSection to 'Personal profile' due to mount or location change.");
    // Sử dụng _setActiveSection trực tiếp để tránh vòng lặp nếu dùng wrapper setActiveSection trong dependency
    _setActiveSection("Personal profile");
    // 🔹 Chạy lại effect này nếu đường dẫn pathname thay đổi (để reset khi quay lại)
  }, [location.pathname]);
  // ---------------------------------------------------

  // Hàm xử lý avatar (có thể không cần nữa)
  // const handleAvatarChange = (file) => {
  //   setAvatarFile(file);
  // };

  return (
    <div className="profile-page">
      <UserSidebar
        activeItem={activeSection}
        onItemClick={setActiveSection} // Dùng hàm wrapper hoặc _setActiveSection trực tiếp
        // onAvatarChange={handleAvatarChange} // Bỏ dòng này nếu không dùng avatarFile
        username={username}
      />

      <main className="profile-main">
        {/* Logic render giữ nguyên, giờ nó sẽ luôn thấy "Personal profile" khi mới vào */}
        {activeSection === "Personal profile" && (
          <PersonalProfileForm /* avatarFile={avatarFile} - Bỏ prop này nếu không dùng */ />
        )}
        {activeSection === "Change password" && <ChangePassword />}
        {activeSection === "My order" && (
          <div>My order content coming soon...</div>
        )}
        {activeSection === "Personal E-wallet" && <PersonalEWallet />}
        {/* {activeSection === "Upgrade to Seller" && <UpgradeToSeller />} */}
        {activeSection === "Upgrade to Seller" && (
          <UpgradeToSeller onGoToProfile={() => setActiveSection("Personal profile")} />
        )}
        {activeSection === "Seller business package" && <SellerBuyPackage />}
      </main>
    </div>
  );
}