import React from "react";
import "./homepage.css";
import Header from "./Header";
import HeroSection from "./HeroSection";
import FeaturedProducts from "./FeaturedProducts";
import WhyChoose from "./WhyChoose";
import SellBanner from "./SellBanner";
import Footer from "./Footer";

export default function HomePage() {
    return (
        <div className="homepage">
            <Header />
            <HeroSection />
            <FeaturedProducts />
            <WhyChoose />
            <SellBanner />
            <Footer />
        </div>
    );
}
