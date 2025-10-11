import React, { useEffect, useRef } from 'react';
import { ProductCarousel } from '../ProductCarousel/ProductCarousel';
import './ProductsSection.css';

export function ProductsSection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        // Thêm hiệu ứng highlight khi section được cuộn đến
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-visible');
                    }
                });
            },
            { threshold: 0.3 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    return (
        <section className="products-section" ref={sectionRef}>
            <div className="products-container">
                {/* 🌿 Sản phẩm mới nhất với bộ lọc danh mục */}
                <ProductCarousel title="Sản phẩm mới nhất" showCategoryToggle={true} />

                {/* 💰 Ưu đãi giá tốt */}
                <ProductCarousel title="Ưu đãi giá tốt" showCategoryToggle={false} />
            </div>
        </section>
    );
}
