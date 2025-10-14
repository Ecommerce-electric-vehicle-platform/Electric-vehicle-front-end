import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children, className = '', showLoading = true }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Reset states khi location thay đổi
        setIsVisible(false);
        setIsExiting(false);
        setIsLoading(true);

        // Hiệu ứng vào trang
        const enterTimer = setTimeout(() => {
            setIsVisible(true);
        }, 100);

        // Ẩn loading sau khi trang đã load
        const loadingTimer = setTimeout(() => {
            setIsLoading(false);
        }, 800);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(loadingTimer);
        };
    }, [location.pathname]);

    return (
        <div
            className={`page-transition ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''} ${className}`}
        >
            <div className="page-transition-content">
                {children}
            </div>

            {/* Loading overlay - chỉ hiển thị khi cần thiết */}
            {showLoading && isLoading && (
                <div className="page-transition-overlay">
                    <div className="loading-spinner">
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageTransition;
