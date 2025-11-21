import React, { useRef, useState } from 'react';

export default function ImageUploader({ files = [], onChange, max = 5 }) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const addFiles = (fileList) => {
        const list = Array.from(fileList || []);
        const next = [...files, ...list].slice(0, max);
        if (typeof onChange === 'function') onChange(next);
    };

    const handlePick = (e) => addFiles(e.target.files);

    const removeAt = (idx) => {
        const next = files.filter((_, i) => i !== idx);
        if (typeof onChange === 'function') onChange(next);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
    };

    return (
        <div>
            {files.length < max && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    style={{
                        width: '100%',
                        height: 140,
                        borderRadius: 12,
                        border: `2px dashed ${dragOver ? '#10b981' : '#cbd5e1'}`,
                        background: dragOver ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        marginBottom: 16,
                        boxShadow: dragOver ? '0 4px 6px -1px rgba(16, 185, 129, 0.2)' : 'none'
                    }}
                >
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: dragOver ? 'linear-gradient(135deg, #d1fae5 0%, #bfdbfe 100%)' : '#e2e8f0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 10px',
                            fontSize: '24px',
                            transition: 'all 0.3s ease',
                            border: dragOver ? '2px solid #10b981' : 'none'
                        }}>📸</div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: dragOver ? '#10b981' : '#64748b', transition: 'color 0.3s ease' }}>
                            Bấm để tải lên hoặc kéo thả
                        </div>
                        <div style={{ fontSize: 13, marginTop: '4px', color: '#94a3b8' }}>PNG, JPG hoặc MP4 (tối đa 5 tệp)</div>
                    </div>
                </div>
            )}

            {files.length > 0 && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: '8px' }}>
                    {files.map((file, idx) => {
                        const url = typeof file === 'string' ? file : URL.createObjectURL(file);
                        return (
                            <div 
                                key={`${idx}-${url}`} 
                                style={{ 
                                    position: 'relative', 
                                    width: 100, 
                                    height: 100, 
                                    borderRadius: 12, 
                                    overflow: 'hidden', 
                                    border: '2px solid #d1fae5', 
                                    background: '#fff',
                                    boxShadow: '0 2px 4px -1px rgba(16, 185, 129, 0.15)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px -2px rgba(16, 185, 129, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(16, 185, 129, 0.15)';
                                }}
                            >
                                <img src={url} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); removeAt(idx); }} 
                                    style={{ 
                                        position: 'absolute', 
                                        top: 6, 
                                        right: 6, 
                                        background: 'rgba(220, 38, 38, 0.9)', 
                                        color: 'white', 
                                        border: 'none', 
                                        width: 24, 
                                        height: 24, 
                                        borderRadius: '50%', 
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s ease',
                                        lineHeight: 1,
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(220, 38, 38, 1)';
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <input ref={inputRef} type="file" accept="image/*,video/mp4" multiple hidden onChange={handlePick} />
        </div>
    );
}


