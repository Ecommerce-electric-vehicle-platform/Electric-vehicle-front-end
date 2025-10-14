import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const usePageTransition = () => {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const navigate = useNavigate();

    const navigateWithTransition = useCallback((path, options = {}) => {
        const {
            transitionType = 'slide-right',
            delay = 300,
            onStart = () => { },
            onComplete = () => { }
        } = options;

        // Bắt đầu transition
        setIsTransitioning(true);
        onStart();

        // Delay để hiệu ứng transition hoàn thành
        setTimeout(() => {
            navigate(path);
            setIsTransitioning(false);
            onComplete();
        }, delay);
    }, [navigate]);

    const navigateToProduct = useCallback((productId) => {
        navigateWithTransition(`/product/${productId}`, {
            transitionType: 'slide-right',
            delay: 400,
            onStart: () => {
                // Thêm class để trigger hiệu ứng
                document.body.classList.add('page-transitioning');
            },
            onComplete: () => {
                document.body.classList.remove('page-transitioning');
            }
        });
    }, [navigateWithTransition]);

    return {
        isTransitioning,
        navigateWithTransition,
        navigateToProduct
    };
};
