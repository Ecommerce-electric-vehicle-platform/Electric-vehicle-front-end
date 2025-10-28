import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AlertCircle, CheckCircle } from 'lucide-react';
import './ProfileIncompleteModal.css';

const ProfileIncompleteModal = ({
    isOpen,
    onClose,
    missingFields = [],
    onCompleteProfile
}) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleCompleteProfile = () => {
        onClose();
        navigate('/profile?tab=profile');
    };

    const getFieldDisplayName = (field) => {
        const fieldNames = {
            'fullName': 'Họ và tên',
            'phoneNumber': 'Số điện thoại',
            'email': 'Email',
            'street': 'Địa chỉ chi tiết',
            'provinceId': 'Tỉnh/Thành phố',
            'districtId': 'Quận/Huyện',
            'wardId': 'Phường/Xã'
        };
        return fieldNames[field] || field;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="profile-incomplete-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-icon warning">
                    <AlertCircle size={48} />
                </div>

                <h3 className="modal-title">Thông tin profile chưa đầy đủ</h3>

                <p className="modal-message">
                    Vui lòng hoàn thiện thông tin profile trước khi đặt hàng để đảm bảo quá trình giao hàng diễn ra thuận lợi.
                </p>

                <div className="missing-fields">
                    <h4>Các thông tin còn thiếu:</h4>
                    <ul className="missing-fields-list">
                        {missingFields.map((field, index) => (
                            <li key={index} className="missing-field-item">
                                <AlertCircle size={16} className="field-icon" />
                                <span>{getFieldDisplayName(field)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="modal-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                    >
                        Quay lại
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleCompleteProfile}
                    >
                        <User size={16} />
                        Cập nhật profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileIncompleteModal;
