// src/utils/profileValidation.js
import profileApi from '../api/profileApi';

/**
 * Kiểm tra xem user profile có đầy đủ thông tin cần thiết để đặt hàng không
 * @returns {Promise<{isComplete: boolean, missingFields: string[], profileData: object}>}
 */
export const validateUserProfile = async () => {
    try {
        const response = await profileApi.getProfile();
        const profileData = response.data.data;

        if (!profileData) {
            return {
                isComplete: false,
                missingFields: ['Tất cả thông tin'],
                profileData: null
            };
        }

        const requiredFields = [
            'fullName',
            'phoneNumber',
            'email',
            'defaultShippingAddress',
            'provinceId',
            'districtId',
            'wardId'
        ];

        const missingFields = [];

        requiredFields.forEach(field => {
            if (!profileData[field] || profileData[field].toString().trim() === '') {
                missingFields.push(field);
            }
        });

        return {
            isComplete: missingFields.length === 0,
            missingFields,
            profileData
        };
    } catch (error) {
        console.error('Error validating user profile:', error);
        return {
            isComplete: false,
            missingFields: ['Không thể tải thông tin profile'],
            profileData: null
        };
    }
};

/**
 * Lấy thông tin profile đầy đủ để điền vào form đặt hàng
 * @returns {Promise<object>}
 */
export const getProfileForOrder = async () => {
    try {
        const response = await profileApi.getProfile();
        const profileData = response.data.data;

        if (!profileData) {
            throw new Error('Không tìm thấy thông tin profile');
        }

        // Tạo địa chỉ đầy đủ
        const fullAddress = [
            profileData.defaultShippingAddress,
            profileData.wardName,
            profileData.districtName,
            profileData.provinceName
        ].filter(Boolean).join(', ');

        return {
            fullName: profileData.fullName || '',
            phoneNumber: profileData.phoneNumber || '',
            email: profileData.email || '',
            address: fullAddress,
            provinceId: profileData.provinceId || '',
            districtId: profileData.districtId || '',
            wardId: profileData.wardId || '',
            provinceName: profileData.provinceName || '',
            districtName: profileData.districtName || '',
            wardName: profileData.wardName || '',
            defaultShippingAddress: profileData.defaultShippingAddress || ''
        };
    } catch (error) {
        console.error('Error getting profile for order:', error);
        throw error;
    }
};
