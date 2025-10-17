// Utility functions for order validation

/**
 * Kiểm tra trạng thái ví điện tử
 * @returns {boolean} true nếu đã liên kết ví
 */
export const checkWalletStatus = () => {
    // Trong thực tế sẽ gọi API để kiểm tra
    // Hiện tại check từ localStorage
    const walletStatus = localStorage.getItem('walletLinked');
    return walletStatus === 'true';
};

/**
 * Liên kết ví điện tử (dùng để test)
 */
export const linkWallet = () => {
    localStorage.setItem('walletLinked', 'true');
};

/**
 * Hủy liên kết ví (dùng để test)
 */
export const unlinkWallet = () => {
    localStorage.setItem('walletLinked', 'false');
};

/**
 * Kiểm tra sản phẩm còn hàng
 * @param {Object} product - Thông tin sản phẩm
 * @returns {Object} { available: boolean, reason: string }
 */
export const checkProductAvailability = (product) => {
    if (!product) {
        return {
            available: false,
            reason: 'Không tìm thấy sản phẩm'
        };
    }

    if (product.status === 'sold') {
        return {
            available: false,
            reason: 'Sản phẩm đã được bán'
        };
    }

    if (product.status === 'unavailable') {
        return {
            available: false,
            reason: 'Sản phẩm tạm thời không có sẵn'
        };
    }

    return {
        available: true,
        reason: null
    };
};

/**
 * Kiểm tra giỏ hàng có sản phẩm từ nhiều người bán không
 * @param {Array} cartItems - Danh sách sản phẩm trong giỏ
 * @returns {Object} { valid: boolean, sellers: Array }
 */
export const checkMultipleSellers = (cartItems) => {
    if (!cartItems || cartItems.length === 0) {
        return { valid: true, sellers: [] };
    }

    // Lấy danh sách unique sellers
    const sellers = [...new Set(cartItems.map(item => item.sellerId))];

    if (sellers.length > 1) {
        return {
            valid: false,
            sellers: sellers,
            message: 'Mỗi đơn hàng chỉ được chứa sản phẩm từ một người bán'
        };
    }

    return {
        valid: true,
        sellers: sellers
    };
};

/**
 * Tính phí vận chuyển dựa trên địa chỉ
 * @param {string} address - Địa chỉ giao hàng
 * @returns {number} Phí vận chuyển
 */
export const calculateShippingFee = (address) => {
    if (!address) return 0;

    const addressLower = address.toLowerCase();

    // Nội thành các thành phố lớn
    if (addressLower.includes('tp.hcm') ||
        addressLower.includes('hà nội') ||
        addressLower.includes('ha noi')) {
        return 50000;
    }

    // Các thành phố lớn khác
    if (addressLower.includes('đà nẵng') ||
        addressLower.includes('da nang') ||
        addressLower.includes('cần thơ') ||
        addressLower.includes('can tho') ||
        addressLower.includes('hải phòng') ||
        addressLower.includes('hai phong')) {
        return 100000;
    }

    // Các tỉnh khác
    return 150000;
};

/**
 * Validate thông tin đặt hàng
 * @param {Object} orderData - Dữ liệu đơn hàng
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateOrderData = (orderData) => {
    const errors = [];

    // Kiểm tra thông tin người mua
    if (!orderData.buyerName || orderData.buyerName.trim() === '') {
        errors.push({ field: 'buyerName', message: 'Vui lòng nhập họ tên' });
    }

    if (!orderData.buyerPhone || orderData.buyerPhone.trim() === '') {
        errors.push({ field: 'buyerPhone', message: 'Vui lòng nhập số điện thoại' });
    } else if (!/^[0-9]{10,11}$/.test(orderData.buyerPhone.replace(/\s/g, ''))) {
        errors.push({ field: 'buyerPhone', message: 'Số điện thoại không hợp lệ' });
    }

    if (!orderData.buyerEmail || orderData.buyerEmail.trim() === '') {
        errors.push({ field: 'buyerEmail', message: 'Vui lòng nhập email' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.buyerEmail)) {
        errors.push({ field: 'buyerEmail', message: 'Email không hợp lệ' });
    }

    // Kiểm tra thông tin giao hàng
    if (!orderData.deliveryAddress || orderData.deliveryAddress.trim() === '') {
        errors.push({ field: 'deliveryAddress', message: 'Vui lòng nhập địa chỉ giao hàng' });
    }

    if (!orderData.deliveryPhone || orderData.deliveryPhone.trim() === '') {
        errors.push({ field: 'deliveryPhone', message: 'Vui lòng nhập số điện thoại nhận hàng' });
    } else if (!/^[0-9]{10,11}$/.test(orderData.deliveryPhone.replace(/\s/g, ''))) {
        errors.push({ field: 'deliveryPhone', message: 'Số điện thoại nhận hàng không hợp lệ' });
    }

    // Kiểm tra phương thức thanh toán
    if (!orderData.paymentMethod) {
        errors.push({ field: 'paymentMethod', message: 'Vui lòng chọn phương thức thanh toán' });
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
};

/**
 * Format số điện thoại
 * @param {string} phone - Số điện thoại
 * @returns {string} Số điện thoại đã format
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    // Loại bỏ tất cả ký tự không phải số
    const cleaned = phone.replace(/\D/g, '');

    // Format: 0xxx xxx xxx hoặc 0xxx xxxx xxx
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (cleaned.length === 11) {
        return cleaned.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3');
    }

    return cleaned;
};

/**
 * Tạo mã đơn hàng
 * @returns {string} Mã đơn hàng
 */
export const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp}${random}`;
};

/**
 * Tính tổng tiền đơn hàng
 * @param {number} productPrice - Giá sản phẩm
 * @param {number} shippingFee - Phí vận chuyển
 * @param {number} quantity - Số lượng
 * @returns {number} Tổng tiền
 */
export const calculateTotalPrice = (productPrice, shippingFee, quantity = 1) => {
    return (productPrice * quantity) + shippingFee;
};

