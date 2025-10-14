import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function AutoScrollToTop() {
    const location = useLocation();

    useEffect(() => {
        // Scroll to top when route changes
        // Sử dụng setTimeout để đảm bảo DOM đã render xong
        const timer = setTimeout(() => {
            // Scroll ngay lập tức lên đầu trang
            window.scrollTo(0, 0);

            // Sau đó scroll smooth để có hiệu ứng đẹp
            setTimeout(() => {
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
            }, 50);
        }, 100);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return null;
}
