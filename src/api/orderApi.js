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
        console.log("🧾 [BEFORE PLACE ORDER] orderData being sent:", orderData);
        const response = await axiosInstance.post('/api/v1/buyer/place-order', orderData);
        console.log("✅ [AFTER PLACE ORDER] backend response:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error placing order:', error);
        throw error;
    }
};

// Get order details by orderId
// GET /api/v1/order/{orderId}
// Response: { success: true, message: "string", data: { id, orderCode, shippingAddress, phoneNumber, price, shippingFee, status, createdAt, updatedAt, canceledAt, cancelReason }, error: {} }
export const getOrderDetails = async (orderId) => {
    try {
        if (!orderId) {
            throw new Error('Order ID is required');
        }

        const response = await axiosInstance.get(`/api/v1/order/${orderId}`);
        const raw = response?.data ?? {};

        // Extract data from response
        const data = raw?.data ?? raw;

        if (!data || (raw?.success === false)) {
            throw new Error(raw?.message || 'Failed to fetch order details');
        }

        // Normalize status from backend to frontend format
        // Backend status: PENDING_PAYMENT, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELED
        const rawStatus = String(data.status || '').toUpperCase();
        let normalizedStatus = 'pending';

        if (rawStatus === 'PENDING_PAYMENT' || rawStatus === 'PENDING') {
            normalizedStatus = 'pending';
        } else if (rawStatus === 'PAID' || rawStatus === 'PROCESSING' || rawStatus === 'CONFIRMED') {
            normalizedStatus = 'confirmed';
        } else if (rawStatus === 'SHIPPED' || rawStatus === 'DELIVERING') {
            normalizedStatus = 'shipping';
        } else if (rawStatus === 'DELIVERED' || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS') {
            normalizedStatus = 'delivered';
        } else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED' || rawStatus === 'FAILED') {
            normalizedStatus = 'canceled';  // CHỈNH ĐÂY LUN
        }

        // Normalize price fields (support nested structures from BE)
        const price = Number(
            data.price ??
            data.productPrice ??
            data.product_price ??
            data.product?.price ??
            data.order?.productPrice ??
            data.order?.product_price ??
            data.order?.price ??
            0
        );

        // Prefer service_fee consistently across FE/BE to match placement time
        const serviceFeePreferred = Number(
            data.service_fee ??
            data.order?.service_fee ??
            data.breakdown?.service_fee ??
            data.shipping?.service_fee ??
            0
        );

        const shippingFee = serviceFeePreferred > 0 ? serviceFeePreferred : Number(
            data.shippingFee ??
            data.shipping_fee ??
            data.order?.shippingFee ??
            data.order?.shipping_fee ??
            data.fee ??
            0
        );

        const finalPrice = Number(
            data.finalPrice ??
            data.final_price ??
            data.totalPrice ??
            data.total_price ??
            data.order?.finalPrice ??
            data.order?.final_price ??
            data.order?.totalPrice ??
            data.order?.total_price ??
            (price + shippingFee)
        );

        // Normalize timestamps
        const createdAt = data.createdAt || data.created_at || data.order?.createdAt || data.order?.created_at || null;
        const updatedAt = data.updatedAt || data.updated_at || data.order?.updatedAt || data.order?.updated_at || null;
        const canceledAt = data.canceledAt || data.canceled_at || data.order?.canceledAt || data.order?.canceled_at || null;
        const cancelReason = data.cancelReason || data.cancel_reason || data.order?.cancelReason || data.order?.cancel_reason || null;

        // Build normalized response
        const normalized = {
            id: data.id ?? data.order?.id ?? orderId,
            orderCode: data.orderCode || data.order_code || data.order?.orderCode || data.order?.order_code || String(orderId),
            shippingAddress: data.shippingAddress || data.shipping_address || data.order?.shippingAddress || data.order?.shipping_address || '',
            phoneNumber: data.phoneNumber || data.phone_number || data.order?.phoneNumber || data.order?.phone_number || '',
            price: price,
            shippingFee: shippingFee,
            finalPrice: finalPrice,
            status: normalizedStatus,
            rawStatus: rawStatus,
            createdAt: createdAt,
            updatedAt: updatedAt,
            canceledAt: canceledAt,
            cancelReason: cancelReason,
            _raw: data // Keep raw data for reference
        };

        console.log('[orderApi] getOrderDetails - Normalized response:', {
            orderId: orderId,
            raw: data,
            normalized: normalized
        });

        return {
            success: raw?.success !== false,
            message: raw?.message || '',
            data: normalized,
            error: raw?.error || null
        };
    } catch (error) {
        // Xử lý lỗi 404 - đơn hàng không tồn tại
        if (error?.response?.status === 404) {
            // Silent - không log vì đây có thể là trường hợp bình thường
            return {
                success: false,
                message: 'Order not found',
                data: null,
                error: 'NOT_FOUND'
            };
        }

        // Xử lý lỗi 5xx - server error
        if (error?.response?.status >= 500) {
            // Chỉ log debug, không log error vì đây có thể là trường hợp bình thường
            // (đơn hàng có thể đã bị xóa hoặc không tồn tại trong hệ thống)
            console.debug(`[orderApi] Server error when fetching order details for order ${orderId}:`, error?.response?.status);
            return {
                success: false,
                message: error?.response?.data?.message || 'Internal Server Error',
                data: null,
                error: 'SERVER_ERROR'
            };
        }

        // Log error cho các lỗi khác (400, 401, 403, etc.)
        console.error(`[orderApi] Error fetching order details for order ${orderId}:`, error);

        // Return structured error response
        return {
            success: false,
            message: error?.response?.data?.message || error?.message || 'Failed to fetch order details',
            data: null,
            error: error?.response?.data?.error || error?.message || 'UNKNOWN_ERROR'
        };
    }
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
    else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED' || rawStatus === 'FAILED') status = 'canceled';    // CHONH23 CÁI NÀY CHO ĐỒNG NHẤT BACKEND

    // QUAN TRỌNG: Theo thông tin từ Backend:
    // - Backend xử lý: 'price' = giá sản phẩm riêng (KHÔNG bao gồm shippingFee)
    // - Backend xử lý: 'shippingFee' = phí ship riêng
    // - Frontend xử lý: 'totalPrice' = price + shippingFee (tính và hiển thị)
    // 
    // Vì vậy:
    // - productPrice = price (từ backend)
    // - shippingFee = shippingFee (từ backend)
    // - finalPrice = productPrice + shippingFee (tính trong frontend)

    // Lấy phí ship từ backend response
    // Prefer service_fee if provided by BE
    const serviceFeePreferred = Number(
        item.service_fee ??
        item.breakdown?.service_fee ??
        item.shipping?.service_fee ??
        0
    );

    const shippingFee = serviceFeePreferred > 0 ? serviceFeePreferred : Number(
        item.shippingFee ??
        item.shipping_fee ??
        item.deliveryFee ??
        item.delivery_fee ??
        0
    );

    // Lấy giá sản phẩm từ backend
    // QUAN TRỌNG: Backend trả về 'price' là PRODUCT PRICE (chưa bao gồm shippingFee)
    let productPrice = Number(
        item.price ??
        item.productPrice ??
        item.product_price ??
        item.itemPrice ??
        item.item_price ??
        0
    );

    // Lấy totalPrice/finalPrice từ backend nếu có (ưu tiên cao nhất)
    // Backend có thể không trả về totalPrice (do FE tự tính)
    const backendTotalPrice = Number(
        item.finalPrice ??
        item.final_price ??
        item.totalPrice ??
        item.total_price ??
        item.total ??
        0
    );

    let finalPrice = 0;

    // Logic đơn giản và rõ ràng:
    // 1. Nếu có backendTotalPrice từ backend → dùng nó
    // 2. Nếu không có → tính từ productPrice + shippingFee (theo cách FE xử lý)

    if (backendTotalPrice > 0) {
        // Backend có trả về totalPrice/finalPrice
        finalPrice = backendTotalPrice;

        // Verify: productPrice + shippingFee có bằng backendTotalPrice không?
        const calculatedTotal = productPrice + shippingFee;
        const diff = Math.abs(calculatedTotal - backendTotalPrice);

        if (diff > 100) {
            // Có sự khác biệt, log warning
            console.warn('[orderApi] normalizeOrderHistoryItem - Price mismatch:', {
                productPrice: productPrice,
                shippingFee: shippingFee,
                calculatedTotal: calculatedTotal,
                backendTotalPrice: backendTotalPrice,
                difference: diff
            });
        }
    } else {
        // Backend KHÔNG trả về totalPrice
        // Frontend tự tính: finalPrice = productPrice + shippingFee
        finalPrice = productPrice + shippingFee;
    }

    // Đảm bảo giá không âm và hợp lý
    productPrice = Math.max(0, productPrice);
    finalPrice = Math.max(0, finalPrice);

    // Log để debug - CHI TIẾT
    console.log('[orderApi] normalizeOrderHistoryItem - Price normalization:', {
        orderCode: item.orderCode || item.order_code,
        orderId: item.id,
        raw: {
            price: item.price,                    // ← Backend: giá sản phẩm riêng
            productPrice: item.productPrice,
            shippingFee: item.shippingFee,        // ← Backend: phí ship riêng
            finalPrice: item.finalPrice,
            totalPrice: item.totalPrice
        },
        normalized: {
            productPrice: productPrice,            // ← = price từ backend
            shippingFee: shippingFee,              // ← = shippingFee từ backend
            finalPrice: finalPrice                 // ← = productPrice + shippingFee (FE tính)
        },
        calculation: {
            backendPrice: item.price,              // Giá sản phẩm từ backend
            backendShippingFee: item.shippingFee,  // Phí ship từ backend
            backendTotalPrice: backendTotalPrice,  // Tổng giá từ backend (nếu có)
            calculatedFinalPrice: productPrice + shippingFee, // FE tự tính
            usedFinalPrice: finalPrice,
            assumption: backendTotalPrice > 0 ? 'use_backendTotalPrice' : 'calculate_from_productPrice_plus_shippingFee'
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
            backendPrice: item.price,
            backendTotalPrice: backendTotalPrice
        });
    }

    // Log ERROR nếu finalPrice không khớp với productPrice + shippingFee
    const expectedFinalPrice = productPrice + shippingFee;
    const diff = Math.abs(finalPrice - expectedFinalPrice);
    if (diff > 100) {
        console.error('[orderApi] normalizeOrderHistoryItem - FinalPrice MISMATCH!', {
            orderCode: item.orderCode || item.order_code,
            expected: expectedFinalPrice,
            actual: finalPrice,
            difference: diff,
            backendPrice: item.price,
            productPrice: productPrice,
            shippingFee: shippingFee,
            backendTotalPrice: backendTotalPrice
        });
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


    // thêm cái này để lấy phương thức thanh toán 
    // Get payment method for an order
// GET /api/v1/order/payment/{orderId}
// Response example: { success: true, message: "OK", data: { gatewayName: "VNPay" } }
export const getOrderPayment = async (orderId) => {
    if (!orderId) throw new Error('orderId is required to get payment method');
    try {
        const response = await axiosInstance.get(`/api/v1/order/payment/${orderId}`);
        const raw = response?.data ?? {};
        const data = raw?.data ?? raw;

        return {
            success: raw?.success !== false,
            message: raw?.message || '',
            data: {
                gatewayName: data?.gatewayName || data?.paymentMethod || data?.method || 'COD'
            },
            error: raw?.error || null
        };
    } catch (error) {
        console.error(`Error fetching payment method for order ${orderId}:`, error);
        return {
            success: false,
            message: error?.response?.data?.message || 'Failed to fetch payment info',
            data: { gatewayName: 'COD' },
            error: error?.response?.data?.error || 'UNKNOWN_ERROR'
        };
    }
};



// Get order status from shipping service
// GET /api/v1/shipping/order/{orderId}/status
// Response: { success: true, message: "string", data: {}, error: {} }
export const getOrderStatus = async (orderId) => {
    try {
        const response = await axiosInstance.get(`/api/v1/shipping/order/${orderId}/status`);
        const raw = response?.data ?? {};

        // Extract status from response
        // The data field may contain status information
        const data = raw?.data ?? {};

        // Normalize status from backend to frontend format
        // Backend status: PENDING_PAYMENT, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELED
        // Frontend status: pending, confirmed, shipping, delivered, cancelled
        const rawStatus = String(data?.status || raw?.status || '').toUpperCase();
        let normalizedStatus = 'pending';

        if (rawStatus === 'PENDING_PAYMENT' || rawStatus === 'PENDING') {
            normalizedStatus = 'pending';
        } else if (rawStatus === 'PAID' || rawStatus === 'PROCESSING' || rawStatus === 'CONFIRMED') {
            normalizedStatus = 'confirmed';
        } else if (rawStatus === 'SHIPPED' || rawStatus === 'DELIVERING') {
            normalizedStatus = 'shipping';
        } else if (rawStatus === 'DELIVERED' || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS') {
            normalizedStatus = 'delivered';
        } else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED' || rawStatus === 'FAILED') {
            normalizedStatus = 'canceled';   // CHỈNH NÀY LUN NHE
        }

        return {
            success: raw?.success !== false,
            message: raw?.message || '',
            status: normalizedStatus,
            rawStatus: rawStatus,
            data: {
                ...data,
                status: normalizedStatus,
                rawStatus: rawStatus
            },
            error: raw?.error || null
        };
    } catch (error) {
        // If 404, order might not exist in shipping service yet
        if (error?.response?.status === 404) {
            // Silent - không log vì đây là trường hợp bình thường
            return {
                success: false,
                message: 'Order not found in shipping service',
                status: null,
                rawStatus: null,
                data: null,
                error: 'NOT_FOUND'
            };
        }

        // Gracefully handle 5xx errors from shipping service by returning a structured failure
        if (error?.response?.status >= 500) {
            // Chỉ log warning, không log error vì đây có thể là trường hợp bình thường
            // (shipping service chưa có đơn hàng này hoặc đơn hàng đã ở trạng thái terminal)
            console.debug(`[orderApi] Shipping service returned 5xx for order ${orderId}:`, error?.response?.status);
            return {
                success: false,
                message: error?.response?.data?.message || 'Shipping service error',
                status: null,
                rawStatus: null,
                data: null,
                error: 'SERVER_ERROR'
            };
        }

        // Log error cho các lỗi khác (400, 401, 403, etc.)
        console.error(`[orderApi] Error fetching order status for order ${orderId}:`, error);
        throw error;
    }
};
