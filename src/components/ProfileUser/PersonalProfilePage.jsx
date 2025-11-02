import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import PersonalProfileForm from "./PersonalProfileForm";
import "./PersonalProfilePage.css";
import ChangePassword from "./ChangePassword";
import UpgradeToSeller from "./UpgradeToSeller";
import PersonalEWallet from "./PersonalEWallet";
import SellerBuyPackage from "./SellerBuyPackage";
// test raise dispute
// ĐÃ XÓA: import DisputeForm from "../../BuyerRaiseDispute/DisputeForm";
import SellerDocumentView from "./SellerDocumentView";
// === THÊM IMPORT OrderList (Cần có) ===
import OrderList from "../../pages/OrderList/OrderList.jsx";






export default function PersonalProfilePage() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("Hồ sơ cá nhân");
  const [username, setUsername] = useState("");
  // Dùng state này để buộc component re-render khi sessionStorage thay đổi
  const [, forceUpdate] = useState({});




  console.log(" PersonalProfilePage render | Section:", activeSection);




  // === LẤY USERNAME (Đã sửa để đọc từ sessionStorage) ===
  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);




  // === useEffect chỉ lắng nghe event để trigger re-render (ỔN ĐỊNH VAI TRÒ) ===
  useEffect(() => {
    const handleAuthChange = () => {
      console.log("Auth status changed, forcing re-render of PersonalProfilePage.");
      forceUpdate({}); // Buộc component re-render để đọc lại sessionStorage
    };




    const handleRoleChange = () => {
      console.log("Role changed event received, forcing re-render of PersonalProfilePage.");
      forceUpdate({}); // Buộc component re-render để đọc lại sessionStorage
    };




    // Lắng nghe sự kiện đăng nhập/đăng xuất và thay đổi role
    window.addEventListener("authStatusChanged", handleAuthChange);
    window.addEventListener("roleChanged", handleRoleChange);




    // Dọn dẹp listener khi component unmount
    return () => {
      window.removeEventListener("authStatusChanged", handleAuthChange);
      window.removeEventListener("roleChanged", handleAuthChange);
    };
  }, []); // Chỉ chạy 1 lần khi mount và cleanup




  // === ĐỌC QUERY PARAM (?tab=...) (Không đổi) ===
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    console.log(" URL tab =", tab);




    switch (tab) {
      case "wallet": setActiveSection("Ví điện tử"); break;
      case "profile": setActiveSection("Hồ sơ cá nhân"); break;
      case "password": setActiveSection("Đổi mật khẩu"); break;
      case "orders": setActiveSection("Đơn hàng của tôi"); break;
      case "upgrade": setActiveSection("Nâng cấp thành người bán"); break;
      case "buy-seller-package": setActiveSection("Mua gói dịch vụ"); break;
      // Thêm case cho tab quản lý giấy tờ
      case "seller-docs": setActiveSection("Quản lý giấy tờ kinh doanh"); break;
      // XÓA case "dispute" (Logic xử lý Dispute giờ nằm trong OrderList)
      default: break; // Giữ nguyên nếu tab không hợp lệ
    }
  }, [location.search]); // Chạy lại khi URL search thay đổi




  // === HANDLE SIDEBAR CLICK (Không đổi) ===
  const handleSidebarClick = (section) => {
    if (section === activeSection) return;
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };




  // === HANDLE KYC ACCEPTED (Không đổi) ===
  const handleKycAccepted = () => {
    console.log("KYC Accepted! Navigating to Buy Package tab...");
    setActiveSection("Mua gói dịch vụ");
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Không cần forceUpdate ở đây vì sự kiện "roleChanged" sẽ tự trigger re-render
  };




  // === ĐỌC userRole trực tiếp từ sessionStorage trước khi render ===
  const currentUserRole = sessionStorage.getItem("userRole") || "buyer"; // Nhanh và ổn định nhất
  console.log(`👤 Reading userRole directly before render: '${currentUserRole}'`);




  // === JSX ===
  return (
    <div className="profile-page">
      <div className="profile-container">
        <UserSidebar
          activeItem={activeSection}
          onItemClick={handleSidebarClick}
          username={username}
          userRole={currentUserRole} // <<< Truyền giá trị đọc trực tiếp
        />




        <main className="profile-main">
          {activeSection === "Hồ sơ cá nhân" && <PersonalProfileForm />}
          {activeSection === "Đổi mật khẩu" && <ChangePassword />}


          {/* === TÍCH HỢP OrderList VÀO TAB "Đơn hàng của tôi" (Đã fix cú pháp) === */}
          {activeSection === "Đơn hàng của tôi" && (
            <OrderList />
          )}
          {/* === TÍCH HỢP SELLER DOCUMENT VIEW (Chỉ hiển thị khi chọn tab) === */}
          {activeSection === "Quản lý giấy tờ kinh doanh" && (
            <SellerDocumentView />
          )}


          {activeSection === "Ví điện tử" && <PersonalEWallet />}
          {/* XÓA: Tạm thời render DisputeForm vào tab Gửi Khiếu Nại */}
          {activeSection === "Gửi khiếu nại" && (
            // KHÔNG CÒN GỌI DISPUTEFORM Ở ĐÂY NỮA
            <p>Form khiếu nại đã được tích hợp vào Lịch sử đơn hàng.</p>
          )}


          {activeSection === "Nâng cấp thành người bán" && (
            <UpgradeToSeller
              onGoToProfile={() => setActiveSection("Hồ sơ cá nhân")}
              onKycAccepted={handleKycAccepted}
            />
          )}
          {/* Truyền giá trị đọc trực tiếp xuống SellerBuyPackage */}
          {activeSection === "Mua gói dịch vụ" && <SellerBuyPackage userRole={currentUserRole} />}
        </main>
     </div>
   </div>
 );
}



