import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function AutoScrollToTop() {
    const location = useLocation();

    useEffect(() => {
        // Scroll to top when route changes (không cần delay dài)
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }, 0);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return null;
}
