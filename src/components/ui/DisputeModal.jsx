import React from 'react';
import './DisputeModal.css';
// Chấp nhận isOpen, onClose và children (là DisputeForm)
export default function DisputeModal({ isOpen, onClose, children }) {
    if (!isOpen) {
        return null;
    }

    // Modal Backdrop: Sử dụng class CSS bạn đã cung cấp
    return (
        <div 
            className="cancel-order-popup-wrapper" 
            onClick={onClose} // Đóng Modal khi click vào nền đen
        >
            {/* Modal Content: Ngăn chặn sự kiện click nền lan vào nội dung Form */}
            <div 
                className="dispute-modal-content" // Thêm class mới để styling cho hộp thoại
                onClick={(e) => e.stopPropagation()} 
            >
                {/* children chính là DisputeForm */}
                {children}
            </div>
        </div>
    );
}