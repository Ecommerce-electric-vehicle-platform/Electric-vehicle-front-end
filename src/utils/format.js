export function formatCurrency(value, locale = "vi-VN", currency = "VND") {
    const number = Number(value) || 0;

    // Nếu giá < 1000, có thể là triệu VND, nhân với 1,000,000
    // Nếu giá >= 1000, có thể đã là VND
    const finalValue = number < 1000 ? number * 1000000 : number;

    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(finalValue);
}

/**
 * Normalize số điện thoại Việt Nam
 * - Loại bỏ tất cả ký tự không phải số
 * - Chuẩn hóa về format: 0xxxxxxxxx (10 số)
 * @param {string} phone - Số điện thoại input
 * @returns {string} Số điện thoại đã normalize
 */
export function normalizePhoneNumber(phone) {
    if (!phone) return '';

    // Loại bỏ tất cả ký tự không phải số
    const cleaned = String(phone).replace(/\D/g, '');

    // Nếu số bắt đầu bằng 84 (mã quốc gia), loại bỏ và thêm 0
    if (cleaned.startsWith('84') && cleaned.length === 11) {
        return '0' + cleaned.substring(2);
    }

    // Nếu số bắt đầu bằng +84, loại bỏ + và 84, thêm 0
    if (cleaned.startsWith('84') && cleaned.length === 11) {
        return '0' + cleaned.substring(2);
    }

    // Đảm bảo số bắt đầu bằng 0 và đủ 10 số
    if (cleaned.length === 10 && !cleaned.startsWith('0')) {
        return '0' + cleaned;
    }

    // Trả về số đã cleaned (nếu đã đúng format 0xxxxxxxxx)
    return cleaned;
}

/**
 * Validate số điện thoại Việt Nam
 * - Phải bắt đầu bằng 0
 * - Phải đủ 10 số
 * - Không được là số test (0123456789, 0987654321, etc.)
 * @param {string} phone - Số điện thoại cần validate
 * @returns {boolean} true nếu hợp lệ
 */
export function isValidVietnamPhoneNumber(phone) {
    if (!phone) return false;

    const normalized = normalizePhoneNumber(phone);

    // Phải đủ 10 số và bắt đầu bằng 0
    if (normalized.length !== 10 || !normalized.startsWith('0')) {
        return false;
    }

    // Kiểm tra không phải là số test phổ biến
    const testNumbers = [
        '0123456789',
        '0987654321',
        '0111111111',
        '0999999999',
        '0000000000'
    ];

    if (testNumbers.includes(normalized)) {
        return false;
    }

    // Kiểm tra regex: phải là 0 theo sau bởi 9 chữ số
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(normalized);
}

/**
 * Format số điện thoại để gửi đến API GHN
 * GHN có thể yêu cầu format khác (ví dụ: loại bỏ số 0 đầu và thêm +84)
 * Hoặc giữ nguyên format 0xxxxxxxxx
 * @param {string} phone - Số điện thoại
 * @param {string} format - 'vn' (0xxxxxxxxx) hoặc 'international' (+84xxxxxxxxx)
 * @returns {string} Số điện thoại đã format
 */
export function formatPhoneForAPI(phone, format = 'vn') {
    const normalized = normalizePhoneNumber(phone);

    if (!normalized || normalized.length !== 10) {
        return normalized; // Trả về số không hợp lệ để API báo lỗi
    }

    if (format === 'international') {
        // Loại bỏ số 0 đầu và thêm +84
        return '+84' + normalized.substring(1);
    }

    // Format Việt Nam: 0xxxxxxxxx
    return normalized;
}


