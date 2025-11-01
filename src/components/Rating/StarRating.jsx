import React from 'react';

export default function StarRating({ value = 0, onChange, size = 28, max = 5, readOnly = false }) {
    const stars = Array.from({ length: max }, (_, i) => i + 1);
    const handleClick = (v) => {
        if (readOnly) return;
        if (typeof onChange === 'function') onChange(v);
    };
    return (
        <div style={{ display: 'flex', gap: 8 }}>
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
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            cursor: readOnly ? 'default' : 'pointer',
                            filter: active ? 'drop-shadow(0 0 8px rgba(255,193,7,0.45))' : 'none'
                        }}
                    >
                        <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? '#ffc107' : 'none'} stroke={active ? '#d39e00' : '#adb5bd'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
                        </svg>
                    </button>
                );
            })}
        </div>
    );
}


