import React from 'react';
import './ConfirmationModal.css'; // Tạo file CSS tương ứng


export default function ConfirmationModal({ message, onConfirm, onCancel, isVisible }) {
  if (!isVisible) {
    return null;
  }


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          <button onClick={onConfirm} className="modal-button confirm">
            OK
          </button>
          <button onClick={onCancel} className="modal-button cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}



