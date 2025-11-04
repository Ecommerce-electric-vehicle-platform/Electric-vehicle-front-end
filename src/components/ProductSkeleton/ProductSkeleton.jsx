import React from 'react';
import './ProductSkeleton.css';

export function ProductSkeleton({ count = 12 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="product-skeleton">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                        <div className="skeleton-line skeleton-title"></div>
                        <div className="skeleton-line skeleton-brand"></div>
                        <div className="skeleton-line skeleton-price"></div>
                        <div className="skeleton-line skeleton-location"></div>
                    </div>
                </div>
            ))}
        </>
    );
}

