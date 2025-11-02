// src/api/orderApi.js
import axiosInstance from './axiosInstance';

// Get shipping partners
export const getShippingPartners = async () => {
    try {
        const response = await axiosInstance.get('/api/v1/shipping-partner/partners');
        return response.data;
    } catch (error) {
        console.error('Error fetching shipping partners:', error);
        throw error;
    }
};

// Get shipping fee for a post and destination address (GHN via BE)
// Send BOTH names and ids to avoid mapping ambiguity on BE
// { postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId }
export const getShippingFee = async ({ postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId }) => {
    const payload = { postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId };
    try {
        console.log('📦 Shipping fee payload:', payload);
        const res = await axiosInstance.post('/api/v1/shipping/shipping-fee', payload);
        console.log('🚀 Shipping fee response:', res.data);
        return res.data;
    } catch (error) {
        console.error('Error fetching shipping fee:', error);
        throw error;
    }
};

// Get payment methods for user
export const getPaymentMethods = async () => {
    try {
        const response = await axiosInstance.get('/api/v1/payment-methods');
        return response.data;
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
    }
};

// Get user's e-wallet balance
export const getWalletBalance = async () => {
    try {
        const response = await axiosInstance.get('/api/v1/wallet/balance');
        return response.data;
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        throw error;
    }
};

// Place order
export const placeOrder = async (orderData) => {
    try {
        const response = await axiosInstance.post('/api/v1/buyer/place-order', orderData);
        return response.data;
    } catch (error) {
        console.error('Error placing order:', error);
        throw error;
    }
};

// Get order details
export const getOrderDetails = async () => {
    // BE hiện không có API chi tiết đơn → trả rỗng để UI dùng fallback, không gọi network
    return {};
};

// Get user's orders
export const getUserOrders = async (page = 1, limit = 10) => {
    try {
        const response = await axiosInstance.get(`/api/v1/orders?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user orders:', error);
        throw error;
    }

};




// Order history for current user
// GET /api/v1/order/history
export const getOrderHistory = async ({ page = 1, size = 10 } = {}) => {
    const pageIndex = Math.max(0, Number(page) - 1);
    const safeSize = Math.max(1, Number(size) || 10);
    try {
        const res = await axiosInstance.get('/api/v1/order/history', {
            params: { page: pageIndex, size: safeSize }
        });
        const raw = res?.data ?? {};
        const data = raw?.data ?? raw;
        const list =
            data?.orderResponses ||
            data?.orders ||
            data?.content ||
            data?.items ||
            (Array.isArray(data) ? data : []);
        const items = Array.isArray(list) ? list : [];
        return { items: items.map(normalizeOrderHistoryItem) };
    } catch {
        // Retry with minimal valid params
        const res = await axiosInstance.get('/api/v1/order/history', {
            params: { page: 0, size: safeSize }
        });
        const raw = res?.data ?? {};
        const data = raw?.data ?? raw;
        const list =
            data?.orderResponses ||
            data?.orders ||
            data?.content ||
            data?.items ||
            (Array.isArray(data) ? data : []);
        const items = Array.isArray(list) ? list : [];
        return { items: items.map(normalizeOrderHistoryItem) };
    }
};

// Chuẩn hóa 1 item từ BE → UI OrderList.jsx
function normalizeOrderHistoryItem(item) {
    if (!item || typeof item !== 'object') return null;

    const id = item.id ?? item.orderId ?? item.order_id ?? String(Math.random());
    const createdAt = item.createdAt || item.created_at || item.updatedAt || new Date().toISOString();

    // Map status từ BE sang UI filter keys
    const rawStatus = String(item.status || '').toUpperCase();
    let status = 'pending';
    if (rawStatus === 'PAID' || rawStatus === 'PROCESSING' || rawStatus === 'CONFIRMED') status = 'confirmed';
    else if (rawStatus === 'SHIPPED' || rawStatus === 'DELIVERING') status = 'shipping';
    else if (rawStatus === 'DELIVERED' || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS') status = 'delivered';
    else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED' || rawStatus === 'FAILED') status = 'cancelled';

    const price = Number(item.price ?? 0);
    const shippingFee = Number(item.shippingFee ?? 0);
    const finalPrice = price + shippingFee;

    // Giao diện cần có product info; dùng placeholder nếu BE không trả
    const product = {
        image: '/vite.svg',
        title: `Đơn hàng ${item.orderCode || id}`,
        brand: '',
        model: '',
        conditionLevel: ''
    };

    return {
        id,
        status,
        createdAt,
        finalPrice,
        shippingFee,
        product,
        _raw: item,
    };
}

// Create product review for an order (rating/feedback with optional images)
// POST /api/v1/order/review
// Content-Type: multipart/form-data
// Fields:
// - request: JSON object { orderId, rating, feedback }
// - pictures: optional list of image files
export const createOrderReview = async ({ orderId, rating, feedback, pictures = [] }) => {
    // Theo BE: @ModelAttribute ReviewRequest + @RequestPart("pictures")
    // → cần gửi multipart với các field phẳng: orderId, rating, feedback và part "pictures"
    const files = Array.from(pictures || []);

    const fd = new FormData();
    fd.append('orderId', String(orderId));
    fd.append('rating', String(rating));
    fd.append('feedback', String(feedback || ''));
    files.forEach((file) => { if (file) fd.append('pictures', file); });

    const res = await axiosInstance.post('/api/v1/order/review', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    const ok = (res?.data?.success !== false);
    if (!ok) throw new Error('Backend returned unsuccessful response');

    try {
        const store = JSON.parse(localStorage.getItem('orderReviews') || '{}');
        store[String(orderId)] = {
            rating: Number(rating),
            feedback: String(feedback || ''),
            picturesCount: files.length,
            reviewedAt: new Date().toISOString()
        };
        localStorage.setItem('orderReviews', JSON.stringify(store));
    } catch { /* no-op */ }

    return res.data;
};

// GET /api/v1/order/get-review/{orderId}
// Lấy đánh giá của đơn hàng từ Backend
export const getOrderReviewById = async (orderId) => {
    try {
        const response = await axiosInstance.get(`/api/v1/order/get-review/${orderId}`);
        const raw = response?.data ?? {};

        // Chỉ trả về review nếu success === true VÀ có data hợp lệ với orderId và rating
        if (raw.success === true && raw.data && raw.data.orderId && raw.data.rating != null) {
            const rating = Number(raw.data.rating);
            // Rating phải trong khoảng 1-5 để hợp lệ
            if (rating >= 1 && rating <= 5) {
                return {
                    success: true,
                    orderId: Number(raw.data.orderId),
                    rating: rating,
                    feedback: String(raw.data.feedback ?? ''),
                    reviewImages: Array.isArray(raw.data.reviewImages) ? raw.data.reviewImages : []
                };
            }
        }
        return null;
    } catch (error) {
        // Nếu API trả 404 hoặc lỗi không tìm thấy → không có review
        if (error?.response?.status === 404) {
            return null;
        }
        console.error('Error fetching order review:', error);
        return null;
    }
};

// Kiểm tra đơn hàng đã có đánh giá hay chưa
// Trả về { hasReview: boolean, review: object|null }
export const getOrderReview = async (orderId) => {
    // Chỉ dùng API từ BE - không fallback localStorage để tránh hiển thị sai
    try {
        const review = await getOrderReviewById(orderId);
        if (review && review.success && review.orderId && review.rating >= 1 && review.rating <= 5) {
            return { hasReview: true, review };
        }
    } catch { /* no-op */; }

    // Không check localStorage nữa vì API là nguồn chính xác nhất
    return { hasReview: false, review: null };
};

export const hasOrderReview = async (orderId) => {
    try {
        const { hasReview } = await getOrderReview(orderId);
        return Boolean(hasReview);
    } catch {
        return false;
    }
};
// tui thêm 2 api này nha Vy !!!!!!!

// Get cancel reasons
// GET /api/v1/cancel-order-reason
export const getCancelReasons = async () => {
    try {
        const response = await axiosInstance.get('/api/v1/cancel-order-reason');
        const raw = response?.data ?? {};
        return Array.isArray(raw.data) ? raw.data : [];
    } catch (error) {
        console.error('Error fetching cancel reasons:', error);
        throw error;
    }
};

// Cancel an order
// POST /api/v1/order/cancel/{orderId}
export const cancelOrder = async (orderId, cancelData = {}) => {
    if (!orderId) throw new Error('orderId is required to cancel order');

    try {
        const response = await axiosInstance.post(`/api/v1/order/cancel/${orderId}`, cancelData);
        return response.data;
    } catch (error) {
        console.error(`Error cancelling order ${orderId}:`, error);
        throw error;
    }
};


