import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import './ScrollToTop.css';

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    // Hiển thị mũi tên khi scroll xuống 300px
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    // Cuộn lên đầu trang
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <>
            {isVisible && (
                <button
                    className="scroll-to-top"
                    onClick={scrollToTop}
                    aria-label="Cuộn lên đầu trang"
                >
                    <ChevronUp className="scroll-icon" />
                    <span className="scroll-text">Lên đầu</span>
                </button>
            )}
        </>
    );
}

//hello world
