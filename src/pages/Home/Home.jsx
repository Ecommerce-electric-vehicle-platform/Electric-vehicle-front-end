import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Khi chưa đăng nhập
import { HeroSection } from "../../components/HeroSection/HeroSection";
import { FeaturedSlider } from "../../components/FeaturedSlider/FeaturedSlider";
import { FeaturesSection } from "../../components/FeaturesSection/FeaturesSection";
import { VehicleShowcase } from "../../components/VehicleShowcase/VehicleShowcase";
import { UpgradeSection } from "../../components/UpgradeSection/UpgradeSection";
import { ProductsSection } from "../../components/ProductsSection/ProductsSection";
import { ScrollToTop } from "../../components/ScrollToTop/ScrollToTop";

// Khi đã đăng nhập
import { HomeUser } from "../../components/HomeUser/HomeUser";
import "./Home.css";

export function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };

    checkAuthStatus();

    const handleStorageChange = () => checkAuthStatus();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStatusChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStatusChanged", handleStorageChange);
    };
  }, []);

  // ✅ Dọn dẹp layout admin còn sót lại khi trở về Home
  useEffect(() => {
    const adminLayout = document.getElementById("admin-layout");
    if (adminLayout) adminLayout.remove();

    const coreLayout = document.getElementById("core-admin-layout");
    if (coreLayout) coreLayout.remove();

    document.body.style.marginLeft = "0";
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.background = "#fff";

    return () => {
      document.body.style.marginLeft = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Khi có hash trong URL thì scroll tới đúng section (chỉ khi không phải từ modal)
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      // Chỉ scroll khi không phải từ việc đóng modal
      // Kiểm tra xem có phải từ modal upgrade không
      const isFromModal = sessionStorage.getItem('fromUpgradeModal');
      if (!isFromModal) {
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          } else if (hash === "#upgrade") {
            // Fallback: nếu không tìm thấy #upgrade, thử tìm #upgrade-section
            const fallbackElement = document.querySelector("#upgrade-section");
            if (fallbackElement) {
              fallbackElement.scrollIntoView({ behavior: "smooth" });
            }
          }
        }, 20);
      } else {
        // Xóa flag sau khi xử lý
        sessionStorage.removeItem('fromUpgradeModal');
      }
    }
  }, [location.hash]);

  if (isAuthenticated) return <HomeUser />;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <HeroSection />

        <section className="featured-section">
          <FeaturedSlider />
        </section>

        <section id="products-section">
          <ProductsSection />
        </section>

        <section id="vehicleshowcase-section">
          <VehicleShowcase />
        </section>

        <section id="upgrade-section">
          <UpgradeSection requireAuth={true} />
        </section>
        <FeaturesSection />
      </main>

      <ScrollToTop />
    </div>
  );
}

export default Home;
