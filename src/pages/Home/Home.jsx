import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Khi chưa đăng nhập
import { Header } from "../../components/Header/Header";
import { HeroSection } from "../../components/HeroSection/HeroSection";
import { FeaturedSlider } from "../../components/FeaturedSlider/FeaturedSlider";
import { FeaturesSection } from "../../components/FeaturesSection/FeaturesSection";
import { VehicleShowcase } from "../../components/VehicleShowcase/VehicleShowcase";
import { CTASection } from "../../components/CTASection/CTASection";
import { UpgradeSection } from "../../components/UpgradeSection/UpgradeSection";
import { ProductsSection } from "../../components/ProductsSection/ProductsSection";
import { Footer } from "../../components/Footer/Footer";
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

    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStatusChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStatusChanged", handleStorageChange);
    };
  }, []);

  // Khi có hash trong URL thì scroll xuống đúng section
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 20);
    }
  }, [location.hash]);

  // Nếu đã đăng nhập → vào trang user
  if (isAuthenticated) {
    return <HomeUser />;
  }

  // Nếu chưa → hiển thị giao diện marketing
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

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

        <FeaturesSection />
        <CTASection />

        <section id="upgrade-section">
          <UpgradeSection />
        </section>
      </main>

      <footer id="footer">
        <Footer />
      </footer>

      <ScrollToTop />
    </div>
  );
}

export default Home;
