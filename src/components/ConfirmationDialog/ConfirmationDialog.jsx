import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmationDialog.css';

export function ConfirmationDialog({
    isOpen,
    onConfirm,
    onCancel,
    title = "Xác nhận",
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    type = "warning" // warning, danger, info
}) {
    // All hooks must be called at top level, before any conditional returns
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onCancel?.();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            return () => window.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onCancel]);

    // Early return after all hooks
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel?.();
        }
    };

    // Render using Portal to ensure dialog is always on top
    const dialogContent = (
        <div
            className={`confirmation-dialog-overlay ${isOpen ? 'show' : ''}`}
            onClick={handleOverlayClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div
                className={`confirmation-dialog ${isOpen ? 'show' : ''} type-${type}`}
                style={{
                    position: 'relative',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                <div className="confirmation-dialog-content">
                    {/* Icon */}
                    <div className={`confirmation-dialog-icon icon-${type}`}>
                        <AlertTriangle size={32} />
                    </div>

                    {/* Title */}
                    {title && (
                        <h3 className="confirmation-dialog-title">{title}</h3>
                    )}

                    {/* Message */}
                    {message && (
                        <p className="confirmation-dialog-message">{message}</p>
                    )}

                    {/* Buttons */}
                    <div className="confirmation-dialog-buttons">
                        <button
                            className="confirmation-dialog-btn confirmation-dialog-btn-cancel"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                        <button
                            className={`confirmation-dialog-btn confirmation-dialog-btn-confirm btn-${type}`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
}

export default ConfirmationDialog;

