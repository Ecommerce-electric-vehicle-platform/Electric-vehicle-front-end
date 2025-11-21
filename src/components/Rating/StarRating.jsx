import React from 'react';

export default function StarRating({ value = 0, onChange, size = 28, max = 5, readOnly = false }) {
    const stars = Array.from({ length: max }, (_, i) => i + 1);
    const handleClick = (v) => {
        if (readOnly) return;
        if (typeof onChange === 'function') onChange(v);
    };
    return (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {stars.map((v) => {
                const active = v <= Number(value || 0);
                return (
                    <button
                        key={v}
                        type="button"
                        onClick={() => handleClick(v)}
                        aria-label={`rate-${v}`}
                        style={{
                            width: size,
                            height: size,
                            borderRadius: 4,
                            border: 'none',
                            background: 'transparent',
                            cursor: readOnly ? 'default' : 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s ease',
                            filter: active ? 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.4))' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (!readOnly) {
                                e.currentTarget.style.transform = 'scale(1.15)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!readOnly) {
                                e.currentTarget.style.transform = 'scale(1)';
                            }
                        }}
                    >
                        <svg 
                            width={size} 
                            height={size} 
                            viewBox="0 0 24 24" 
                            fill={active ? '#F59E0B' : 'none'} 
                            stroke={active ? '#D97706' : '#cbd5e1'} 
                            strokeWidth={active ? '0' : '2'} 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            style={{ transition: 'all 0.2s ease' }}
                        >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                    </button>
                );
            })}
        </div>
    );
}


