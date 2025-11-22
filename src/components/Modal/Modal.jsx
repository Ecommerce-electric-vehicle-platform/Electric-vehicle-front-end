import React, { useEffect } from "react";
import "./Modal.css";
import ReactDOM from "react-dom";
// Component này nhận vào: isOpen (có mở ko), type (loại màu), title, message, và hàm onClose
const Modal = ({ isOpen, onClose, title, message, type = "info" }) => {
  

  //  2. Thêm đoạn logic này để Khóa/Mở scroll
  useEffect(() => {
    if (isOpen) {
      // Khóa cuộn cả body và html
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden"; 
    } else {
      // Mở lại
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset"; 
    }

    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, [isOpen]);
  // Nếu isOpen = false thì không render gì cả
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header đổi màu dựa theo props 'type' */}
        <div className={`modal-header ${type}`}>
          {title}
        </div>
        
        <div className="modal-body">
          {message}
        </div>

        <div className="modal-footer">
          <button className="modal-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;