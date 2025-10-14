import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { HomeGuest } from "../../components/HomeGuest/HomeGuest"
import { HomeUser } from "../../components/HomeUser/HomeUser"
import "./Home.css"

export function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };

    // Kiểm tra lần đầu
    checkAuthStatus();

    // Lắng nghe thay đổi localStorage
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    // Cũng lắng nghe sự kiện custom khi đăng nhập/đăng xuất
    window.addEventListener('authStatusChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStatusChanged', handleStorageChange);
    };
  }, []);

  // Xử lý hash trong URL để scroll đến section tương ứng
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = location.hash;
      if (hash) {
        // Đợi một chút để đảm bảo component đã render xong
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    };

    handleHashScroll();
  }, [location.hash]);

  // Render component phù hợp dựa trên trạng thái đăng nhập
  if (isAuthenticated) {
    return <HomeUser />;
  }

  return <HomeGuest />;
}
