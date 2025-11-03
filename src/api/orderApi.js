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
// Response: { success: true, data: { orderResponses: [...], meta: {...} } }
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
        const meta = data?.meta || raw?.meta || null;

        // Log để debug giá từ backend
        if (items.length > 0) {
            console.log('[orderApi] getOrderHistory - Raw response sample:', {
                firstItem: items[0],
                priceFields: {
                    price: items[0]?.price,
                    productPrice: items[0]?.productPrice,
                    shippingFee: items[0]?.shippingFee,
                    finalPrice: items[0]?.finalPrice,
                    totalPrice: items[0]?.totalPrice
                }
            });
        }

        const normalizedItems = items.map(normalizeOrderHistoryItem);

        // Log sau khi normalize để so sánh
        if (normalizedItems.length > 0) {
            console.log('[orderApi] getOrderHistory - Normalized sample:', {
                firstItem: normalizedItems[0],
                priceComparison: {
                    raw_price: items[0]?.price,
                    normalized_price: normalizedItems[0]?.price,
                    raw_shippingFee: items[0]?.shippingFee,
                    normalized_shippingFee: normalizedItems[0]?.shippingFee,
                    raw_finalPrice: items[0]?.finalPrice || (items[0]?.price + items[0]?.shippingFee),
                    normalized_finalPrice: normalizedItems[0]?.finalPrice
                }
            });
        }

        return {
            items: normalizedItems,
            meta: meta, // Trả về meta để có thể dùng pagination
            success: raw?.success !== false
        };
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
        const meta = data?.meta || raw?.meta || null;
        return {
            items: items.map(normalizeOrderHistoryItem),
            meta: meta,
            success: raw?.success !== false
        };
    }
};

// Chuẩn hóa 1 item từ BE → UI OrderList.jsx
// Response structure từ backend:
// { id, orderCode, shippingAddress, phoneNumber, price, shippingFee, status, 
//   createdAt, updatedAt, canceledAt, cancelReason }
function normalizeOrderHistoryItem(item) {
    if (!item || typeof item !== 'object') return null;

    const id = item.id ?? item.orderId ?? item.order_id ?? String(Math.random());
    const orderCode = item.orderCode || item.order_code || id; // Extract orderCode trực tiếp
    const createdAt = item.createdAt || item.created_at || item.updatedAt || new Date().toISOString();
    const updatedAt = item.updatedAt || item.updated_at || null;
    const canceledAt = item.canceledAt || item.canceled_at || null;
    const cancelReason = item.cancelReason || item.cancel_reason || null;

    // Map status từ BE sang UI filter keys
    // Backend có: PENDING_PAYMENT, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELED
    const rawStatus = String(item.status || '').toUpperCase();
    let status = 'pending';
    if (rawStatus === 'PENDING_PAYMENT' || rawStatus === 'PENDING') status = 'pending';
    else if (rawStatus === 'PAID' || rawStatus === 'PROCESSING' || rawStatus === 'CONFIRMED') status = 'confirmed';
    else if (rawStatus === 'SHIPPED' || rawStatus === 'DELIVERING') status = 'shipping';
    else if (rawStatus === 'DELIVERED' || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS') status = 'delivered';
    else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED' || rawStatus === 'FAILED') status = 'cancelled';

    // QUAN TRỌNG: Phân tích từ dữ liệu thực tế:
    // - Place order: totalPrice = 26450000 (productPrice: 25900000 + shippingFee: 550000)
    // - Order history từ backend: price = 26450000, shippingFee = 550000
    // 
    // KẾT LUẬN: Backend trả về 'price' là TOTAL PRICE (đã bao gồm shippingFee)
    // KHÔNG PHẢI productPrice!
    // 
    // Vì vậy:
    // - productPrice = price - shippingFee
    // - finalPrice = price (KHÔNG cộng thêm shippingFee!)

    // Lấy phí ship từ backend response
    const shippingFee = Number(
        item.shippingFee ??
        item.shipping_fee ??
        item.deliveryFee ??
        item.delivery_fee ??
        0
    );

    // Lấy giá từ backend
    // QUAN TRỌNG: Backend trả về 'price' là totalPrice (đã bao gồm shippingFee)
    const rawPrice = Number(
        item.price ??
        item.productPrice ??
        item.product_price ??
        item.itemPrice ??
        item.item_price ??
        0
    );

    // Lấy totalPrice/finalPrice từ backend nếu có (ưu tiên cao nhất)
    // Nếu backend có trả về finalPrice/totalPrice riêng, dùng nó
    const backendTotalPrice = Number(
        item.finalPrice ??
        item.final_price ??
        item.totalPrice ??
        item.total_price ??
        item.total ??
        0
    );

    let productPrice = 0;
    let finalPrice = 0;

    // Logic đơn giản và rõ ràng:
    // 1. Nếu có backendTotalPrice (finalPrice/totalPrice từ backend) → dùng nó
    // 2. Nếu không có, giả định rawPrice là totalPrice (theo dữ liệu thực tế)

    if (backendTotalPrice > 0) {
        // Có finalPrice từ backend, dùng nó
        finalPrice = backendTotalPrice;

        // Tính productPrice: Nếu rawPrice + shippingFee = backendTotalPrice thì rawPrice là productPrice
        // Ngược lại, nếu rawPrice = backendTotalPrice thì rawPrice là totalPrice
        const calculatedTotal = rawPrice + shippingFee;
        const diff1 = Math.abs(calculatedTotal - backendTotalPrice);
        const diff2 = Math.abs(rawPrice - backendTotalPrice);

        if (diff1 < diff2 && diff1 < 100) {
            // rawPrice + shippingFee ≈ backendTotalPrice → rawPrice là productPrice
            productPrice = rawPrice;
        } else if (diff2 < 100) {
            // rawPrice ≈ backendTotalPrice → rawPrice là totalPrice
            productPrice = Math.max(0, rawPrice - shippingFee);
        } else {
            // Tính từ backendTotalPrice
            productPrice = Math.max(0, backendTotalPrice - shippingFee);
        }
    } else {
        // KHÔNG có backendTotalPrice
        // Theo dữ liệu thực tế: backend LUÔN trả về 'price' là TOTAL PRICE (đã bao gồm shippingFee)
        // Ví dụ: price = 26450000, shippingFee = 550000
        // → productPrice = 26450000 - 550000 = 25900000
        // → finalPrice = 26450000 (KHÔNG cộng thêm shippingFee!)

        if (rawPrice > 0 && shippingFee >= 0) {
            // Kiểm tra hợp lý: rawPrice phải lớn hơn hoặc bằng shippingFee
            if (rawPrice >= shippingFee) {
                // rawPrice là totalPrice (đã bao gồm shippingFee)
                productPrice = rawPrice - shippingFee;
                finalPrice = rawPrice; // KHÔNG cộng thêm shippingFee
            } else {
                // Trường hợp đặc biệt: rawPrice < shippingFee (không hợp lý, nhưng xử lý an toàn)
                // Giả định rawPrice là productPrice
                productPrice = rawPrice;
                finalPrice = rawPrice + shippingFee;
            }
        } else {
            // Trường hợp rawPrice = 0 hoặc không hợp lý
            productPrice = rawPrice;
            finalPrice = rawPrice + shippingFee;
        }
    }

    // Đảm bảo giá không âm và hợp lý
    productPrice = Math.max(0, productPrice);
    finalPrice = Math.max(0, finalPrice);

    // Log để debug - CHI TIẾT
    console.log('[orderApi] normalizeOrderHistoryItem - Price normalization:', {
        orderCode: item.orderCode || item.order_code,
        orderId: item.id,
        raw: {
            price: item.price,
            productPrice: item.productPrice,
            shippingFee: item.shippingFee,
            finalPrice: item.finalPrice,
            totalPrice: item.totalPrice
        },
        normalized: {
            productPrice: productPrice,
            shippingFee: shippingFee,
            finalPrice: finalPrice
        },
        calculation: {
            rawPrice: rawPrice,
            backendTotalPrice: backendTotalPrice,
            assumption: backendTotalPrice > 0 ? 'use_backendTotalPrice' : 'rawPrice_is_totalPrice',
            productPriceCalculation: `${rawPrice} - ${shippingFee} = ${productPrice}`,
            finalPriceCalculation: backendTotalPrice > 0 ? `backendTotalPrice: ${backendTotalPrice}` : `rawPrice (no add shipping): ${rawPrice}`
        },
        verification: {
            productPrice_plus_shippingFee: productPrice + shippingFee,
            finalPrice: finalPrice,
            match: Math.abs((productPrice + shippingFee) - finalPrice) < 100 ? '✅ MATCH' : '⚠️ MISMATCH'
        }
    });

    // Log warning nếu có vấn đề
    if (productPrice === 0 || finalPrice <= 0) {
        console.warn('[orderApi] normalizeOrderHistoryItem - Price validation issue:', {
            id: item.id,
            orderCode: item.orderCode || item.order_code,
            productPrice: productPrice,
            shippingFee: shippingFee,
            finalPrice: finalPrice,
            rawPrice: rawPrice,
            backendTotalPrice: backendTotalPrice
        });
    }

    // Log ERROR nếu finalPrice không khớp với productPrice + shippingFee (nếu rawPrice là totalPrice)
    if (backendTotalPrice === 0) {
        const expectedFinalPrice = productPrice + shippingFee;
        const diff = Math.abs(finalPrice - expectedFinalPrice);
        if (diff > 100) {
            console.error('[orderApi] normalizeOrderHistoryItem - FinalPrice MISMATCH!', {
                orderCode: item.orderCode || item.order_code,
                expected: expectedFinalPrice,
                actual: finalPrice,
                difference: diff,
                rawPrice: rawPrice,
                shippingFee: shippingFee,
                productPrice: productPrice
            });
        }
    }

    // Extract thông tin từ response
    const shippingAddress = item.shippingAddress || item.shipping_address || '';
    const phoneNumber = item.phoneNumber || item.phone_number || '';

    // Giao diện cần có product info; dùng placeholder nếu BE không trả
    const product = {
        image: '/vite.svg',
        title: `Đơn hàng ${orderCode}`,
        brand: '',
        model: '',
        conditionLevel: ''
    };

    return {
        id,
        orderCode, // Thêm orderCode vào normalized object
        status,
        createdAt,
        updatedAt,
        canceledAt,
        cancelReason,
        price: productPrice,  // Lưu productPrice vào field 'price' để backward compatibility
        productPrice: productPrice,  // Lưu riêng productPrice
        shippingFee,
        finalPrice,
        shippingAddress, // Thêm shippingAddress
        phoneNumber, // Thêm phoneNumber
        product,
        _raw: item, // Giữ nguyên _raw để backward compatibility
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


