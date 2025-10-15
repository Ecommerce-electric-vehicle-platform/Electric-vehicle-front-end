import { useEffect } from "react";
import { HeroSection } from "../HeroSection/HeroSection";
import { FeaturedSlider } from "../FeaturedSlider/FeaturedSlider";
import { FeaturesSection } from "../FeaturesSection/FeaturesSection";
import { VehicleShowcase } from "../VehicleShowcase/VehicleShowcase";
import { UpgradeSection } from "../UpgradeSection/UpgradeSection";
import { ProductsSection } from "../ProductsSection/ProductsSection";
import "./HomeGuest.css";

export function HomeGuest({ onRequireAuth }) {
    // ✅ Xử lý hash navigation khi load và khi thay đổi hash
    useEffect(() => {
        const handleHashNavigation = () => {
            const hash = window.location.hash;
            if (hash) {
                const sectionId = hash.substring(1);
                const section = document.getElementById(sectionId);
                if (section) {
                    setTimeout(() => {
                        section.scrollIntoView({ behavior: "smooth" });
                    }, 20);
                }
            }
        };

        handleHashNavigation();
        window.addEventListener("hashchange", handleHashNavigation);
        return () => {
            window.removeEventListener("hashchange", handleHashNavigation);
        };
    }, []);

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
                    <UpgradeSection requireAuth={true} onRequireAuth={onRequireAuth} />
                </section>

                <FeaturesSection />
            </main>

        </div>
    );
}
