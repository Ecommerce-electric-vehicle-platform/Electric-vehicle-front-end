import { useEffect } from "react"
import { Header } from "../../components/Header/Header"
import { HeroSection } from "../../components/HeroSection/HeroSection"
import { FeaturedSlider } from "../../components/FeaturedSlider/FeaturedSlider"
import { FeaturesSection } from "../../components/FeaturesSection/FeaturesSection"
import { VehicleShowcase } from "../../components/VehicleShowcase/VehicleShowcase"
import { CTASection } from "../../components/CTASection/CTASection"
import { UpgradeSection } from "../../components/UpgradeSection/UpgradeSection"
import { ProductsSection } from "../../components/ProductsSection/ProductsSection"
import { Footer } from "../../components/Footer/Footer"
import { ScrollToTop } from "../../components/ScrollToTop/ScrollToTop"
import "./Home.css"

export function Home() {
  // Xử lý hash navigation khi trang load
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (hash) {
        const sectionId = hash.substring(1); // Bỏ dấu #
        const section = document.getElementById(sectionId);
        if (section) {
          // Delay một chút để đảm bảo trang đã render xong
          setTimeout(() => {
            section.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    };

    // Xử lý khi component mount
    handleHashNavigation();

    // Xử lý khi hash thay đổi
    window.addEventListener('hashchange', handleHashNavigation);

    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ✅ Header cố định đầu trang */}
      <Header />

      <main className="flex-grow">
        {/* 🚀 Hero Section */}
        <HeroSection />

        {/* ⚡ Featured Slider (sản phẩm nổi bật) */}
        <section className="featured-section">
          <FeaturedSlider />
        </section>

        {/* 🌿 Sản phẩm mới nhất với bộ lọc danh mục */}
        <section id="products-section">
          <ProductsSection />
        </section>

        {/* 🚗 Vehicle & Batteries Section — thêm ID để cuộn xuống từ Header */}
        <section id="vehicleshowcase-section">
          <VehicleShowcase />
        </section>

        {/* 💡 Features Section */}
        <FeaturesSection />

        {/* 🚀 CTA */}
        <CTASection />

        {/* 💎 Upgrade Section - Nâng cấp buyer lên seller */}
        <section id="upgrade-section">
          <UpgradeSection />
        </section>
      </main>

      {/* 🦶 Footer cuối trang — thêm ID để cuộn xuống từ Header */}
      <footer id="footer">
        <Footer />
      </footer>

      {/* ⬆️ Nút cuộn lên đầu trang */}
      <ScrollToTop />
    </div>
  )
}
