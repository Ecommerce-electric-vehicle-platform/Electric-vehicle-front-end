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
                        height: 132,
                        borderRadius: 12,
                        border: `2px dashed ${dragOver ? '#137fec' : '#cbd5e1'}`,
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'border-color .2s ease, background .2s ease',
                        marginBottom: 12
                    }}
                >
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 999,
                            background: '#e2e8f0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px'
                        }}>☁️</div>
                        <div style={{ fontWeight: 600 }}>Bấm để tải lên hoặc kéo thả</div>
                        <div style={{ fontSize: 12 }}>PNG, JPG hoặc MP4 (tối đa 800x400px)</div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {files.map((file, idx) => {
                    const url = typeof file === 'string' ? file : URL.createObjectURL(file);
                    return (
                        <div key={`${idx}-${url}`} style={{ position: 'relative', width: 96, height: 96, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>
                            <img src={url} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => removeAt(idx)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(15,23,42,0.75)', color: 'white', border: 'none', width: 22, height: 22, borderRadius: 999, cursor: 'pointer' }}>×</button>
                        </div>
                    );
                })}
            </div>

            <input ref={inputRef} type="file" accept="image/*,video/mp4" multiple hidden onChange={handlePick} />
        </div>
    );
}


