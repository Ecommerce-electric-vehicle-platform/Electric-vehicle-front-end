// src/components/Toast/Toast.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import "./Toast.css";

export function Toast({ message, show, onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Tự động ẩn sau duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      if (onClose) onClose();
    }, 300); // Animation duration
  };

  if (!isVisible) return null;

  return createPortal(
    <div className={`toast-container ${isExiting ? "toast-exit" : "toast-enter"}`}>
      <div className="toast-content">
        <div className="toast-icon">
          <Bell size={20} />
        </div>
        <div className="toast-message">{message}</div>
        <button className="toast-close" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

