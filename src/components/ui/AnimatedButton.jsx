import React from 'react';
import './AnimatedButton.css';

/**
 * Animated Button Component với các hiệu ứng đẹp mắt
 * @param {Object} props
 * @param {string} props.variant - 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'outline-primary' | 'outline-danger'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {boolean} props.shimmer - Thêm shimmer effect
 * @param {boolean} props.ripple - Thêm ripple effect khi click
 * @param {React.ReactNode} props.children
 */
export function AnimatedButton({
    variant = 'primary',
    size = 'md',
    shimmer = false,
    ripple = true,
    className = '',
    children,
    onClick,
    ...props
}) {
    const handleClick = (e) => {
        if (ripple) {
            createRipple(e);
        }
        onClick?.(e);
    };

    const createRipple = (e) => {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    };

    return (
        <button
            className={`animated-btn animated-btn-${variant} animated-btn-${size} ${shimmer ? 'animated-btn-shimmer' : ''} ${className}`}
            onClick={handleClick}
            {...props}
        >
            {shimmer && <span className="shimmer-overlay" />}
            <span className="animated-btn-content">{children}</span>
        </button>
    );
}

