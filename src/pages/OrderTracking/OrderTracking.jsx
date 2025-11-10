import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Home,
    MapPin,
    Phone,
    CreditCard,
    Calendar,
    Package,
    User,
    Truck,
    Clock,
    CheckCircle,
    AlertCircle,
    Star,
    FileDown,
    MessageSquareWarning
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../test-mock-data/data/productsData';
import OrderStatus from '../../components/OrderStatus/OrderStatus';
import './OrderTracking.css';
import { getOrderHistory, getOrderStatus, getOrderDetails, hasOrderReview, getOrderPayment, getCancelReasons } from '../../api/orderApi';
import { fetchPostProductById } from '../../api/productApi';
import profileApi from '../../api/profileApi';
import { AnimatedButton } from '../../components/ui/AnimatedButton';



function OrderTracking() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(true);
    const [hasReview, setHasReview] = useState(false); // Trạng thái đánh giá
    const [cancelReasonMap, setCancelReasonMap] = useState({});

    const pickFirstTruthy = (...values) => {
        for (const value of values) {
            if (value === undefined || value === null) continue;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed) return trimmed;
            } else if (value !== '') {
                return value;
            }
        }
        return '';
    };

    const extractCancelInfo = (source) => {
        const raw = source?._raw || {};
        const response =
            source?.cancelOrderReasonResponse ||
            raw?.cancelOrderReasonResponse ||
            raw?.cancelReasonResponse ||
            raw?.cancelOrderReason ||
            null;

        const reasonText = pickFirstTruthy(
            source?.cancelReason,
            source?.cancel_reason,
            raw?.cancelReason,
            raw?.cancel_reason,
            raw?.cancelReasonName,
            raw?.cancelOrderReasonName,
            response?.cancelOrderReasonName,
            response?.name,
            response?.title
        );

        const reasonId = pickFirstTruthy(
            source?.cancelReasonId,
            source?.cancel_reason_id,
            raw?.cancelReasonId,
            raw?.cancel_reason_id,
            response?.id,
            response?.cancelOrderReasonId,
            raw?.cancelReasonCode,
            raw?.cancel_order_reason_id
        );

        const rawValue = pickFirstTruthy(reasonText, reasonId);

        return {
            text: reasonText || '',
            id: reasonId ? String(reasonId).trim() : '',
            raw: rawValue ? String(rawValue).trim() : ''
        };
    };

    const normalizeCancelReason = (value) => {
        if (!value) return '';
        const key = String(value).trim();
        if (!key) return '';
        if (cancelReasonMap[key]) return cancelReasonMap[key];
        const lowerKey = key.toLowerCase();
        for (const mapKey of Object.keys(cancelReasonMap || {})) {
            if (mapKey.toLowerCase() === lowerKey) {
                return cancelReasonMap[mapKey];
            }
        }
        return key;
    };


    const getPaymentMethodLabel = (method) => {
        if (method === 'cod') return 'Thanh toán khi nhận hàng';
        if (method === 'bank_transfer') return 'Chuyển khoản ngân hàng';
        if (method === 'ewallet') return 'Ví điện tử';
        return 'Khác';
    };

    const getPaymentStatusInfo = (method, rawStatus) => {
        const normalizedMethod = String(method || '').toLowerCase();
        const normalizedRawStatus = String(rawStatus || '').toUpperCase();

        if (normalizedMethod === 'cod') {
            return { label: 'Chưa thanh toán', statusClass: 'pending' };
        }

        if (normalizedRawStatus === 'PENDING_PAYMENT') {
            return { label: 'Chờ thanh toán', statusClass: 'pending' };
        }

        return { label: 'Đã thanh toán', statusClass: 'paid' };
    };

    const toAbsoluteUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        if (!trimmed) return '';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        const base = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
        const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return `${base}${path}`;
    };

    const extractImageFromRawProduct = (rawProduct) => {
        try {
            if (!rawProduct || typeof rawProduct !== 'object') return '';
            // direct fields
            const direct = rawProduct.productImage || rawProduct.image || rawProduct.imageUrl || rawProduct.thumbnail || rawProduct.coverUrl;
            if (typeof direct === 'string' && direct.trim()) return toAbsoluteUrl(direct);
            // array fields
            const images = rawProduct.images || rawProduct.imageUrls || rawProduct.pictures || [];
            if (Array.isArray(images) && images.length > 0) {
                const first = images[0];
                if (typeof first === 'string') return toAbsoluteUrl(first);
                if (first && typeof first === 'object') {
                    const candidate = first.imgUrl || first.url || first.image;
                    if (typeof candidate === 'string' && candidate.trim()) return toAbsoluteUrl(candidate);
                }
            }
        } catch { /* ignore */ }
        return '';
    };

    // Chuẩn hóa tên phương thức thanh toán từ nhiều nguồn BE (VNPay/MoMo/COD/CASH/...)
    const normalizePaymentMethod = (value) => {
        const v = String(value || '').toUpperCase();
        if (!v) return '';
        if (v.includes('COD') || v.includes('CASH') || v.includes('CASH_ON_DELIVERY')) return 'cod';
        if (v.includes('BANK')) return 'bank_transfer';
        // Mặc định gom VNPay/MoMo/ZaloPay/Wallet về ewallet
        if (v.includes('VNPAY') || v.includes('MOMO') || v.includes('ZALO') || v.includes('WALLET') || v.includes('E-WALLET')) return 'ewallet';
        return '';
    };

    const getStatusLabel = (status, rawStatus) => {
        const normalizedRaw = String(rawStatus || '').toUpperCase();
        switch (status) {
            case 'pending':
                return 'Chờ xác nhận';
            case 'confirmed':
                if (normalizedRaw === 'PICKED') {
                    return 'Đơn vị vận chuyển đã lấy hàng';
                }
                return 'Đã xác nhận';
            case 'shipping':
                return 'Đang giao hàng';
            case 'delivered':
                return 'Đã giao hàng';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return 'Không xác định';
        }
    };

    // Xử lý đánh giá đơn hàng
    const handleRateOrder = () => {
        const realId = order?.realId || order?.id || orderId;
        navigate(`/order/review/${orderId}`, {
            state: {
                orderIdRaw: realId,
                orderCode: order?.id || order?._raw?.orderCode || null,
                from: location.pathname // Sử dụng đường dẫn thực tế hiện tại
            }
        });
    };

    // Xử lý xem đánh giá đã có
    const handleViewReview = () => {
        const realId = order?.realId || order?.id || orderId;
        navigate(`/order/review/${orderId}`, {
            state: {
                orderIdRaw: realId,
                orderCode: order?.id || order?._raw?.orderCode || null,
                viewMode: true, // Đánh dấu là chế độ xem lại
                from: location.pathname // Sử dụng đường dẫn thực tế hiện tại
            }
        });
    };

    useEffect(() => {
        let isMounted = true;
        const loadCancelReasons = async () => {
            try {
                const reasons = await getCancelReasons();
                if (!isMounted || !Array.isArray(reasons)) return;
                const map = {};
                reasons.forEach((reason) => {
                    if (!reason) return;
                    const id = pickFirstTruthy(reason.id, reason.cancelOrderReasonId, reason.code, reason.value);
                    const text = pickFirstTruthy(reason.cancelOrderReasonName, reason.name, reason.reasonName, reason.title, reason.description);
                    const idKey = id ? String(id).trim() : '';
                    const textValue = text ? String(text).trim() : '';
                    if (idKey) {
                        map[idKey] = textValue || idKey;
                    }
                    if (textValue) {
                        map[textValue] = textValue;
                    }
                });
                setCancelReasonMap(map);
            } catch (error) {
                console.warn('[OrderTracking] Failed to load cancel reasons:', error);
            }
        };
        loadCancelReasons();
        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Kiểm tra đăng nhập
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsGuest(!token);

        if (!token) {
            navigate('/signin');
            return;
        }
    }, [navigate]);

    // Tải thông tin đơn hàng - ưu tiên Order Detail API, fallback order history hoặc localStorage
    useEffect(() => {
        const loadOrder = async () => {
            try {
                setLoading(true);

                // Ưu tiên 1: Gọi API Order Detail trực tiếp
                try {
                    const orderDetailRes = await getOrderDetails(orderId);

                    if (orderDetailRes.success && orderDetailRes.data) {
                        const orderDetailData = orderDetailRes.data;

                        // Lấy buyerName từ nhiều nguồn
                        let buyerName = '';

                        // Nguồn 1: Từ API order detail (_raw.buyerName hoặc data.buyerName)
                        buyerName = orderDetailData._raw?.buyerName ||
                            orderDetailData._raw?.buyer?.name ||
                            orderDetailData.buyerName ||
                            orderDetailData.buyer?.name ||
                            '';

                        // Nguồn 2: Nếu không có từ API, lấy từ profile API
                        if (!buyerName) {
                            try {
                                const profileRes = await profileApi.getProfile();
                                if (profileRes?.data?.data) {
                                    buyerName = profileRes.data.data.fullName ||
                                        profileRes.data.data.name ||
                                        profileRes.data.fullName ||
                                        '';
                                }
                            } catch (profileError) {
                                console.warn('[OrderTracking] Failed to get buyerName from profile API:', profileError);
                            }
                        }

                        // Nguồn 3: Fallback từ localStorage nếu có
                        if (!buyerName) {
                            const userEmail = localStorage.getItem('userEmail') || '';
                            // Không có fullName trong localStorage, nhưng có thể có username
                            const username = localStorage.getItem('username') || '';
                            buyerName = username || userEmail || '';
                        }

                        const cancelInfo = extractCancelInfo(orderDetailData);

                        // Map từ order detail API response sang format của OrderTracking
                        const mappedOrder = {
                            id: orderDetailData.orderCode || String(orderDetailData.id || orderId),
                            realId: orderDetailData.id || orderId, // Lưu id thực từ backend
                            createdAt: orderDetailData.createdAt || new Date().toISOString(),
                            estimatedDelivery: orderDetailData.updatedAt || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                            status: orderDetailData.status || 'pending', // Normalized status
                            rawStatus: orderDetailData.rawStatus || 'PROCESSING',

                            // Product info
                            product: {
                                image: toAbsoluteUrl(orderDetailData._raw?.productImage) || extractImageFromRawProduct(orderDetailData._raw?.product) || '',
                                title: orderDetailData._raw?.productName || `Đơn hàng ${orderDetailData.orderCode}`,
                                price: orderDetailData.price || 0
                            },
                            items: [], // API không trả items array

                            // Price info
                            totalPrice: orderDetailData.price || 0,
                            shippingFee: orderDetailData.shippingFee || 0,
                            finalPrice: orderDetailData.finalPrice || (orderDetailData.price + orderDetailData.shippingFee),

                            // Buyer & shipping info
                            buyerName: buyerName, // Đã lấy từ nhiều nguồn ở trên
                            buyerPhone: orderDetailData.phoneNumber || '',
                            deliveryAddress: orderDetailData.shippingAddress || '',

                            // Payment info (sẽ xác nhận lại bằng API chuyên biệt phía dưới)
                            paymentMethod: normalizePaymentMethod(orderDetailData._raw?.paymentMethod || orderDetailData.paymentMethod) || 'cod',

                            // Shipping tracking info
                            deliveredAt: orderDetailData._raw?.deliveredAt || null,
                            shippedAt: orderDetailData._raw?.shippedAt || null,
                            trackingNumber: orderDetailData._raw?.trackingNumber || '',
                            // Normalize carrier: BE may return an object; UI needs a string
                            carrier: (() => {
                                const rawCarrier = orderDetailData._raw?.carrier || orderDetailData._raw?.shippingPartner || '';
                                if (typeof rawCarrier === 'string') return rawCarrier;
                                if (!rawCarrier || typeof rawCarrier !== 'object') return '';
                                const nameCandidate = rawCarrier.partnerName || rawCarrier.name || rawCarrier.title || rawCarrier.providerName;
                                if (typeof nameCandidate === 'string' && nameCandidate.trim()) return nameCandidate;
                                try { return JSON.stringify(rawCarrier); } catch { return ''; }
                            })(),

                            // Invoice
                            needInvoice: Boolean(orderDetailData._raw?.needInvoice || false),

                            // Cancel info
                            canceledAt: orderDetailData.canceledAt || null,
                            cancelReason: cancelInfo.text || cancelInfo.raw || null,
                            cancelReasonId: cancelInfo.id || null,
                            cancelReasonRaw: cancelInfo.raw || null,

                            // Raw data reference
                            _raw: orderDetailData._raw || {}
                        };

                        // Fallback: nếu vẫn chưa có lý do, đọc từ localStorage (được lưu sau khi người dùng hủy)
                        try {
                            if (!mappedOrder.cancelReason) {
                                const localMap = JSON.parse(localStorage.getItem('cancel_reason_map') || '{}');
                                const localReason = localMap[String(mappedOrder.realId)] || localMap[String(orderId)] || '';
                                if (localReason && String(localReason).trim()) {
                                    mappedOrder.cancelReason = String(localReason).trim();
                                }
                            }
                        } catch { /* ignore */ }

                        // Lấy hình ảnh sản phẩm nếu thiếu từ Order Detail (dùng post/product API)
                        try {
                            if (!mappedOrder.product.image) {
                                const productId = orderDetailData._raw?.postId || orderDetailData._raw?.productId || orderDetailData._raw?.product?.id;
                                if (productId) {
                                    const prod = await fetchPostProductById(productId);
                                    if (prod && prod.image) {
                                        mappedOrder.product.image = prod.image;
                                        if (!mappedOrder.product.title && prod.title) mappedOrder.product.title = prod.title;
                                        if (!mappedOrder.product.price && prod.price) mappedOrder.product.price = prod.price;
                                    }
                                }
                            }
                        } catch (imgErr) {
                            console.warn('[OrderTracking] fetchPostProductById failed for image:', imgErr);
                            // cuối cùng dùng placeholder
                            if (!mappedOrder.product.image) mappedOrder.product.image = '/vite.svg';
                        }

                        // Lấy phương thức thanh toán từ API chuyên biệt (chính xác hơn)
                        try {
                            const payRes = await getOrderPayment(orderDetailData.id || orderId);
                            if (payRes?.success && payRes?.data?.gatewayName) {
                                const normalized = normalizePaymentMethod(payRes.data.gatewayName);
                                if (normalized) {
                                    mappedOrder.paymentMethod = normalized;
                                }
                            }
                        } catch (pmErr) {
                            console.warn('[OrderTracking] getOrderPayment failed (fallback to detail/raw):', pmErr);
                        }

                        // Cập nhật status từ shipping API để có status mới nhất
                        const realOrderId = orderDetailData.id || orderId;
                        if (realOrderId) {
                            try {
                                const statusResponse = await getOrderStatus(realOrderId);
                                if (statusResponse.success && statusResponse.status) {
                                    mappedOrder.status = statusResponse.status;
                                    mappedOrder.rawStatus = statusResponse.rawStatus || mappedOrder.rawStatus;

                                    // Nếu đơn hàng đã giao, kiểm tra xem đã có đánh giá chưa
                                    if (statusResponse.status === 'delivered') {
                                        try {
                                            const reviewStatus = await hasOrderReview(realOrderId);
                                            setHasReview(reviewStatus);
                                        } catch (reviewError) {
                                            console.warn('[OrderTracking] Failed to check review status:', reviewError);
                                        }
                                    } else {
                                        setHasReview(false);
                                    }
                                }
                            } catch (error) {
                                console.warn('[OrderTracking] Failed to get order status from API:', error);
                                // Nếu API fail nhưng order status từ order detail là delivered, vẫn check review
                                if (mappedOrder.status === 'delivered') {
                                    try {
                                        const reviewStatus = await hasOrderReview(realOrderId);
                                        setHasReview(reviewStatus);
                                    } catch (reviewError) {
                                        console.warn('[OrderTracking] Failed to check review status:', reviewError);
                                    }
                                }
                            }
                        } else {
                            // Nếu không lấy được status từ shipping API nhưng order status từ order detail là delivered
                            if (mappedOrder.status === 'delivered') {
                                try {
                                    const reviewStatus = await hasOrderReview(realOrderId);
                                    setHasReview(reviewStatus);
                                } catch (reviewError) {
                                    console.warn('[OrderTracking] Failed to check review status:', reviewError);
                                }
                            }
                        }

                        // Cập nhật theo nguyên tắc "không lùi trạng thái"
                        setOrder(prev => {
                            const rank = { pending: 1, confirmed: 2, shipping: 3, delivered: 4, canceled: 5, cancelled: 5 };
                            if (prev && prev.status) {
                                const pr = rank[String(prev.status)] || 0;
                                const nr = rank[String(mappedOrder.status)] || 0;
                                const isBackward = nr > 0 && pr > 0 && nr < pr && mappedOrder.status !== 'canceled' && mappedOrder.status !== 'cancelled';
                                if (isBackward) return prev;
                                return { ...prev, ...mappedOrder };
                            }
                            return mappedOrder;
                        });
                        setLoading(false);
                        return;
                    }
                } catch (orderDetailError) {
                    console.warn('[OrderTracking] Failed to load from order detail API, trying fallback:', orderDetailError);
                }

                // Fallback 1: Gọi Backend order history và tìm theo id hoặc orderCode
                try {
                    const { items } = await getOrderHistory({ page: 1, size: 50 });
                    const byId = (items || []).find(x => String(x?.id) === String(orderId));
                    const byCode = (items || []).find(x => String(x?._raw?.orderCode) === String(orderId) || String(x?.orderCode) === String(orderId));
                    const beOrder = byId || byCode || null;

                    if (beOrder) {
                        const mapped = mapHistoryItemToTracking(beOrder);

                        // Lấy buyerName từ profile API nếu không có
                        if (!mapped.buyerName || mapped.buyerName === '') {
                            try {
                                const profileRes = await profileApi.getProfile();
                                if (profileRes?.data?.data) {
                                    mapped.buyerName = profileRes.data.data.fullName ||
                                        profileRes.data.data.name ||
                                        profileRes.data.fullName ||
                                        '';
                                }
                            } catch (profileError) {
                                console.warn('[OrderTracking] Failed to get buyerName from profile API:', profileError);
                            }
                        }

                        // Cập nhật trạng thái từ API
                        const realOrderId = beOrder._raw?.id ?? beOrder.id;
                        if (realOrderId) {
                            try {
                                const statusResponse = await getOrderStatus(realOrderId);
                                if (statusResponse.success && statusResponse.status) {
                                    mapped.status = statusResponse.status;

                                    // Nếu đơn hàng đã giao, kiểm tra xem đã có đánh giá chưa
                                    if (statusResponse.status === 'delivered') {
                                        try {
                                            const reviewStatus = await hasOrderReview(realOrderId);
                                            setHasReview(reviewStatus);
                                        } catch (reviewError) {
                                            console.warn('[OrderTracking] Failed to check review status:', reviewError);
                                        }
                                    } else {
                                        setHasReview(false);
                                    }
                                }
                            } catch (error) {
                                console.warn('[OrderTracking] Failed to get order status from API:', error);
                            }
                        }

                        // Nếu order đã delivered nhưng chưa check review, check ngay
                        if (mapped.status === 'delivered') {
                            const realIdForReview = beOrder._raw?.id ?? beOrder.id;
                            if (realIdForReview) {
                                hasOrderReview(realIdForReview).then(setHasReview).catch(console.warn);
                            }
                        }

                        // Cập nhật theo nguyên tắc "không lùi trạng thái"
                        setOrder(prev => {
                            const rank = { pending: 1, confirmed: 2, shipping: 3, delivered: 4, canceled: 5, cancelled: 5 };
                            if (prev && prev.status) {
                                const pr = rank[String(prev.status)] || 0;
                                const nr = rank[String(mapped.status)] || 0;
                                const isBackward = nr > 0 && pr > 0 && nr < pr && mapped.status !== 'canceled' && mapped.status !== 'cancelled';
                                if (isBackward) return prev;
                                return { ...prev, ...mapped };
                            }
                            return mapped;
                        });
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.warn('[OrderTracking] Failed to load from order history:', e);
                }

                // Fallback 2: localStorage (theo từng user)
                try {
                    const currentUsername = localStorage.getItem('username') || '';
                    const storageKey = currentUsername ? `orders_${currentUsername}` : 'orders_guest';
                    const orders = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const foundOrder = orders.find(o => String(o.id) === String(orderId));

                    if (foundOrder) {
                        // Lấy buyerName từ localStorage order nếu có
                        let buyerName = foundOrder.buyerName || foundOrder.buyer_name || '';

                        // Nếu không có trong localStorage order, lấy từ profile API
                        if (!buyerName) {
                            try {
                                const profileRes = await profileApi.getProfile();
                                if (profileRes?.data?.data) {
                                    buyerName = profileRes.data.data.fullName ||
                                        profileRes.data.data.name ||
                                        profileRes.data.fullName ||
                                        '';
                                }
                            } catch (profileError) {
                                console.warn('[OrderTracking] Failed to get buyerName from profile API:', profileError);
                            }
                        }

                        const mapped = mapHistoryItemToTracking({
                            id: foundOrder.id,
                            _raw: {
                                ...foundOrder,
                                buyerName: buyerName || foundOrder.buyerName || ''
                            },
                            status: foundOrder.status || 'pending'
                        });

                        // Cập nhật buyerName nếu có
                        if (buyerName) {
                            mapped.buyerName = buyerName;
                        }

                        // Nếu order đã delivered, check review status
                        if (mapped.status === 'delivered') {
                            const realIdForReview = foundOrder._raw?.id ?? foundOrder.id ?? orderId;
                            if (realIdForReview) {
                                hasOrderReview(realIdForReview).then(setHasReview).catch(console.warn);
                            }
                        }

                        // Cập nhật theo nguyên tắc "không lùi trạng thái"
                        setOrder(prev => {
                            const rank = { pending: 1, confirmed: 2, shipping: 3, delivered: 4, canceled: 5, cancelled: 5 };
                            if (prev && prev.status) {
                                const pr = rank[String(prev.status)] || 0;
                                const nr = rank[String(mapped.status)] || 0;
                                const isBackward = nr > 0 && pr > 0 && nr < pr && mapped.status !== 'canceled' && mapped.status !== 'cancelled';
                                if (isBackward) return prev;
                                return { ...prev, ...mapped };
                            }
                            return mapped;
                        });
                        setLoading(false);
                        return;
                    }
                } catch (localError) {
                    console.warn('[OrderTracking] Failed to load from localStorage:', localError);
                }

                // Không tìm thấy đơn hàng
                setOrder(null);
            } catch (error) {
                console.error('[OrderTracking] Error loading order:', error);
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [orderId]);

    // Auto-refresh order details định kỳ (mỗi 30 giây) để luôn có dữ liệu mới nhất
    useEffect(() => {
        if (!order || !orderId) return;

        const refreshOrder = async () => {
            try {
                // Lấy orderId thực từ order (ưu tiên realId, fallback id)
                const realOrderId = order.realId || order.id || orderId;
                if (!realOrderId) return;

                console.log('[OrderTracking] Auto-refreshing order details...');

                // Gọi API order detail để lấy thông tin mới nhất
                try {
                    const orderDetailRes = await getOrderDetails(realOrderId);

                    if (orderDetailRes.success && orderDetailRes.data) {
                        const orderDetailData = orderDetailRes.data;

                        // Cập nhật order với dữ liệu mới
                        const cancelInfo = extractCancelInfo(orderDetailData);

                        setOrder(prevOrder => {
                            if (!prevOrder) return prevOrder;

                            const statusChanged = orderDetailData.status !== prevOrder.status;
                            const cancelChanged = Boolean(orderDetailData.canceledAt) !== Boolean(prevOrder.canceledAt);

                            // Nếu đơn hàng đã giao, luôn kiểm tra review status (ngay cả khi không có thay đổi)
                            if (orderDetailData.status === 'delivered' || prevOrder.status === 'delivered') {
                                hasOrderReview(realOrderId).then(setHasReview).catch(console.warn);
                            } else {
                                setHasReview(false);
                            }

                            if (statusChanged || cancelChanged || orderDetailData.updatedAt !== prevOrder.estimatedDelivery) {
                                console.log(`[OrderTracking] Order updated: status=${orderDetailData.status}, canceledAt=${orderDetailData.canceledAt}`);

                                return {
                                    ...prevOrder,
                                    status: orderDetailData.status || prevOrder.status,
                                    rawStatus: orderDetailData.rawStatus || prevOrder.rawStatus,
                                    canceledAt: orderDetailData.canceledAt || prevOrder.canceledAt,
                                    cancelReason: (() => {
                                        const fromApi = cancelInfo.text || cancelInfo.raw || prevOrder.cancelReason;
                                        if (fromApi) return fromApi;
                                        try {
                                            const map = JSON.parse(localStorage.getItem('cancel_reason_map') || '{}');
                                            return map[String(prevOrder.realId)] || map[String(prevOrder.id)] || '';
                                        } catch {
                                            return fromApi;
                                        }
                                    })(),
                                    cancelReasonId: cancelInfo.id || prevOrder.cancelReasonId,
                                    cancelReasonRaw: cancelInfo.raw || prevOrder.cancelReasonRaw,
                                    estimatedDelivery: orderDetailData.updatedAt || prevOrder.estimatedDelivery,
                                    totalPrice: orderDetailData.price ?? prevOrder.totalPrice,
                                    shippingFee: orderDetailData.shippingFee ?? prevOrder.shippingFee,
                                    finalPrice: orderDetailData.finalPrice ?? prevOrder.finalPrice,
                                    deliveryAddress: orderDetailData.shippingAddress || prevOrder.deliveryAddress,
                                    buyerPhone: orderDetailData.phoneNumber || prevOrder.buyerPhone
                                };
                            }

                            return prevOrder;
                        });
                    }
                } catch (orderDetailError) {
                    console.warn('[OrderTracking] Failed to refresh from order detail API:', orderDetailError);
                }

                // Sau đó cập nhật status từ shipping API
                try {
                    const statusResponse = await getOrderStatus(realOrderId);
                    if (statusResponse.success && statusResponse.status && statusResponse.status !== order.status) {
                        console.log(`[OrderTracking] Status updated from shipping API: ${order.status} -> ${statusResponse.status}`);
                        setOrder(prevOrder => {
                            const rank = { pending: 1, confirmed: 2, shipping: 3, delivered: 4, canceled: 5, cancelled: 5 };
                            const pr = rank[String(prevOrder?.status)] || 0;
                            const nr = rank[String(statusResponse.status)] || 0;
                            const isBackward = nr > 0 && pr > 0 && nr < pr && statusResponse.status !== 'canceled' && statusResponse.status !== 'cancelled';
                            if (isBackward) return prevOrder;
                            return {
                                ...prevOrder,
                                status: statusResponse.status,
                                rawStatus: statusResponse.rawStatus || prevOrder.rawStatus
                            };
                        });
                    }
                } catch (statusError) {
                    console.warn('[OrderTracking] Failed to refresh status from shipping API:', statusError);
                }
            } catch (error) {
                console.warn('[OrderTracking] Failed to refresh order:', error);
            }
        };

        // Refresh ngay khi order được load
        if (order.id || order.realId) {
            refreshOrder();
        }

        // Set interval để refresh mỗi 30 giây
        const intervalId = setInterval(refreshOrder, 30000); // 30 seconds

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order?.id, order?.realId, orderId]); // Chỉ chạy khi orderId thay đổi

    useEffect(() => {
        if (!order) return;
        const status = String(order.status || '').toLowerCase();
        if (status !== 'cancelled' && status !== 'canceled') return;
        if (!cancelReasonMap || Object.keys(cancelReasonMap).length === 0) return;
        const rawReason = pickFirstTruthy(order.cancelReasonRaw, order.cancelReasonId, order.cancelReason);
        if (!rawReason) return;
        const normalized = normalizeCancelReason(rawReason);
        if (normalized && normalized !== order.cancelReason) {
            setOrder(prev => {
                if (!prev) return prev;
                return { ...prev, cancelReason: normalized };
            });
        }
    }, [order, cancelReasonMap]);

    function mapHistoryItemToTracking(item) {
        const id = item.id ?? item._raw?.orderCode ?? String(Date.now());
        const createdAt = item.createdAt || item._raw?.createdAt || new Date().toISOString();
        const shippingFee = Number(item.shippingFee || item._raw?.shippingFee || 0);
        const fallbackSubtotal = Number(item._raw?.price || 0);
        const subtotalFromFinal = Number(item.finalPrice || 0) - shippingFee;
        const totalPrice = subtotalFromFinal > 0 ? subtotalFromFinal : fallbackSubtotal;
        const finalPrice = totalPrice + shippingFee;
        const status = item.status || 'confirmed';
        const cancelInfo = extractCancelInfo(item);

        const deliveredAt = item._raw?.deliveredAt || item._raw?.delivered_at || null;
        const shippedAt = item._raw?.shippedAt || item._raw?.shipped_at || null;
        const trackingNumber = item._raw?.trackingNumber || item._raw?.tracking_code || '';
        const carrier = item._raw?.shippingPartner || item._raw?.carrier || '';
        const paymentMethod = normalizePaymentMethod(item._raw?.paymentMethod) || (status === 'confirmed' ? 'ewallet' : 'cod');
        const needInvoice = Boolean(item._raw?.needInvoice || item._raw?.invoiceRequired);

        const product = {
            image: item.product?.image || '/vite.svg',
            title: item.product?.title || `Đơn hàng ${item._raw?.orderCode || id}`,
            price: totalPrice,
        };

        return {
            id,
            createdAt,
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            status,
            product,
            items: [],
            totalPrice,
            shippingFee,
            finalPrice,
            buyerName: '',
            buyerPhone: item._raw?.phoneNumber || '',
            deliveryAddress: item._raw?.shippingAddress || '',
            paymentMethod,
            deliveredAt,
            shippedAt,
            trackingNumber,
            carrier,
            needInvoice,
            canceledAt: item.canceledAt || item._raw?.canceledAt || item._raw?.canceled_at || null,
            cancelReason: (() => {
                const fromData = cancelInfo.text || cancelInfo.raw || '';
                if (fromData) return fromData;
                try {
                    const map = JSON.parse(localStorage.getItem('cancel_reason_map') || '{}');
                    return map[String(item._raw?.id ?? item.id)] || '';
                } catch {
                    return fromData;
                }
            })(),
            cancelReasonId: cancelInfo.id || '',
            cancelReasonRaw: cancelInfo.raw || '',
        };
    }
    // Xử lý về trang chủ
    const handleGoHome = () => {
        navigate('/');
    };

    // Xử lý liên hệ người bán
    const handleContactSeller = () => {
        alert('Chức năng liên hệ người bán sẽ được phát triển');
    };

    // Xử lý hủy đơn hàng
    const handleCancelOrder = () => {
        if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
            const currentUsername = localStorage.getItem('username') || '';
            const storageKey = currentUsername ? `orders_${currentUsername}` : 'orders_guest';
            const orders = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const updatedOrders = orders.map(o =>
                o.id === orderId ? { ...o, status: 'cancelled' } : o
            );
            localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
            setOrder({ ...order, status: 'cancelled' });
        }
    };

    if (isGuest) {
        return null; // Sẽ redirect về login
    }

    if (loading) {
        return (
            <div className="order-tracking-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin đơn hàng...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-tracking-error">
                <div className="error-icon">
                    <AlertCircle size={64} color="#dc3545" />
                </div>
                <h3>Không tìm thấy đơn hàng</h3>
                <p>Đơn hàng với mã {orderId} không tồn tại hoặc đã bị xóa.</p>
                <button className="btn btn-primary" onClick={handleGoHome}>
                    Về trang chủ
                </button>
            </div>
        );
    }

    const paymentStatusInfo = getPaymentStatusInfo(order.paymentMethod, order.rawStatus);
    const isCancelled = order.status === 'cancelled' || order.status === 'canceled';

    return (
        <div className="order-tracking-page">
            <div className="order-tracking-container">
                {/* Header */}
                <div className="order-tracking-header">
                    <h1 className="page-title">Theo dõi đơn hàng</h1>
                    <div className="page-meta">
                        <div className="meta-left">
                            <span className="chip">
                                <Package size={14} />
                                Mã đơn: {order.id}
                            </span>
                            <span className="chip">
                                <Calendar size={14} />
                                Đặt: {formatDate(order.createdAt)}
                            </span>
                            <span className="chip">
                                <Clock size={14} />
                                Dự kiến: {formatDate(order.estimatedDelivery)}
                            </span>
                            <span className="chip">
                                <CreditCard size={14} />
                                {getPaymentMethodLabel(order.paymentMethod)}
                            </span>
                            <span className={`status-badge ${order.status}`}>
                                {getStatusLabel(order.status, order.rawStatus)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Delivered Hero (Magic UI style) */}
                {order.status === 'delivered' && (
                    <div className="delivered-hero">
                        <div className="delivered-glow"></div>
                        <div className="delivered-card shine-border">
                            <div className="delivered-left">
                                <div className="delivered-icon">
                                    <CheckCircle size={28} />
                                </div>
                                <div className="delivered-texts">
                                    <h2>Đã giao thành công</h2>
                                    <p>
                                        Mã đơn <span className="badge-code">#{order.id}</span> đã được giao tới bạn
                                        {order.deliveredAt ? ` vào ${formatDate(order.deliveredAt)}` : ''}.
                                    </p>
                                    <div className="delivered-meta">
                                        {order.carrier && <span className="chip alt">Đơn vị: {order.carrier}</span>}
                                        {order.trackingNumber && <span className="chip alt">Vận đơn: {order.trackingNumber}</span>}
                                        <span className="chip success">Tổng: {formatCurrency(order.finalPrice)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="delivered-actions">
                                <button className="btn btn-warning" onClick={() => alert('Khiếu nại đơn hàng (sẽ triển khai)')}>
                                    <MessageSquareWarning className="btn-icon" /> Khiếu nại
                                </button>
                                {hasReview ? (
                                    <button className="btn btn-secondary" onClick={handleViewReview}>
                                        <Star className="btn-icon" /> Xem đánh giá
                                    </button>
                                ) : (
                                    <button className="btn btn-success" onClick={handleRateOrder}>
                                        <Star className="btn-icon" /> Đánh giá
                                    </button>
                                )}
                                {order.needInvoice && (
                                    <button className="btn btn-soft" onClick={() => alert('Tải hóa đơn (sẽ triển khai)')}>
                                        <FileDown className="btn-icon" /> Tải hóa đơn
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancellation banner */}
                {isCancelled && (
                    <div className="cancelled-hero">
                        <div className="cancelled-glow"></div>
                        <div className="cancelled-card">
                            <div className="cancelled-icon">
                                <AlertCircle size={28} />
                            </div>
                            <div className="cancelled-content">
                                <h2>Đơn hàng đã bị hủy</h2>
                                <p>
                                    Đơn hàng <span className="badge-code">#{order.id}</span> đã được hủy
                                    {order.canceledAt ? ` vào ${formatDate(order.canceledAt)}` : ''}.
                                </p>
                                <div className="cancelled-meta">
                                    <span className="chip danger">Tổng: {formatCurrency(order.finalPrice)}</span>
                                    <span className="chip neutral">
                                        Lý do: {order.cancelReason || 'Không có thông tin'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="order-tracking-content">
                    {/* Cột trái - Thông tin đơn hàng */}
                    <div className="order-info-column">
                        {/* Header thành công + bước tiến trình (theo mẫu) */}
                        {!isCancelled && order.status !== 'delivered' && (
                            <div className="success-header">
                                <div className="success-icon">
                                    <CheckCircle size={28} color="#2bb673" />
                                </div>
                                <h2 className="success-title">Đặt hàng thành công!</h2>
                                <p className="success-subtitle">Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.</p>
                            </div>
                        )}

                        <div className={`progress-card ${isCancelled ? 'is-cancelled' : ''}`}>
                            <div className="progress-steps">
                                <div className={`p-step ${['pending', 'confirmed', 'shipping', 'delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}>
                                    <div className="p-dot"><CheckCircle size={16} color="#fff" /></div>
                                    <div className="p-label">Đã đặt hàng</div>
                                    <div className="p-time">{formatDate(order.createdAt)}</div>
                                </div>
                                <div className={`p-sep ${['confirmed', 'shipping', 'delivered'].includes(order.status) ? 'active' : ''}`}></div>
                                <div className={`p-step ${['confirmed', 'shipping', 'delivered'].includes(order.status) ? 'active' : ''}`}>
                                    <div className="p-dot"><CheckCircle size={16} color="#fff" /></div>
                                    <div className="p-label">Đơn vị vận chuyển đã lấy hàng</div>
                                    <div className="p-time">{formatDate(order.createdAt)}</div>
                                </div>
                                <div className={`p-sep ${['shipping', 'delivered'].includes(order.status) ? 'active' : ''}`}></div>
                                <div className={`p-step ${['shipping', 'delivered'].includes(order.status) ? 'active' : ''}`}>
                                    <div className="p-dot"><Truck size={16} color="#fff" /></div>
                                    <div className="p-label">Đang vận chuyển</div>
                                    <div className="p-time">{formatDate(order.estimatedDelivery)}</div>
                                </div>
                                <div className={`p-sep ${order.status === 'delivered' ? 'active' : ''}`}></div>
                                <div className={`p-step ${order.status === 'delivered' ? 'active' : ''}`}>
                                    <div className="p-dot"><Package size={16} color="#fff" /></div>
                                    <div className="p-label">Đã giao hàng</div>
                                    <div className="p-time">{formatDate(order.deliveredAt || order.estimatedDelivery)}</div>
                                </div>
                            </div>
                            {isCancelled && (
                                <div className="cancelled-progress-note">
                                    Đơn hàng đã bị hủy {order.canceledAt ? `vào ${formatDate(order.canceledAt)}` : ''}.
                                </div>
                            )}
                        </div>

                        {/* Danh sách sản phẩm (theo mẫu) */}
                        <div className="order-items-card">
                            <div className="card-head">
                                <h3>Chi tiết đơn hàng</h3>
                                <span className="code-badge">#{order.id}</span>
                            </div>
                            {(order.items && Array.isArray(order.items) && order.items.length > 0)
                                ? (
                                    order.items.map((it) => (
                                        <div key={it.id || it.name} className="item-row">
                                            <div className="i-thumb">
                                                <img
                                                    src={it.image}
                                                    alt={it.name}
                                                    onError={(e) => {
                                                        if (e.target && !e.target.dataset.fallback) {
                                                            e.target.dataset.fallback = 'true';
                                                            e.target.src = '/default-avatar.png';
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="i-info">
                                                <div className="i-name">{it.name}</div>
                                                <div className="i-sub">Số lượng: {it.quantity}</div>
                                            </div>
                                            <div className="i-price">{formatCurrency(it.price)}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="item-row">
                                        <div className="i-thumb">
                                            <img
                                                src={order.product.image}
                                                alt={order.product.title}
                                                onError={(e) => {
                                                    if (e.target && !e.target.dataset.fallback) {
                                                        e.target.dataset.fallback = 'true';
                                                        e.target.src = '/default-avatar.png';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="i-info">
                                            <div className="i-name">{order.product.title}</div>
                                            <div className="i-sub">Số lượng: 1</div>
                                        </div>
                                        <div className="i-price">{formatCurrency(order.product.price)}</div>
                                    </div>
                                )}

                            {/* Tổng tiền nằm cùng trong chi tiết đơn hàng */}
                            <div className="price-breakdown">
                                <div className="price-item">
                                    <span className="price-label">Tạm tính</span>
                                    <span className="price-value">{formatCurrency(order.totalPrice)}</span>
                                </div>
                                <div className="price-item">
                                    <span className="price-label">Phí vận chuyển</span>
                                    <span className="price-value">{formatCurrency(order.shippingFee)}</span>
                                </div>
                                <div className="price-item total">
                                    <span className="price-label">Tổng cộng</span>
                                    <span className="price-value">{formatCurrency(order.finalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Thông tin giao hàng & thanh toán (2 cột) */}
                        <div className="info-grid">
                            <div className="info-card">
                                <div className="card-head">
                                    <h4>
                                        <MapPin size={16} className="card-icon" />
                                        Thông tin giao hàng
                                    </h4>
                                </div>
                                <div className="info-line"><User size={16} /> {order.buyerName}</div>
                                <div className="info-line"><Phone size={16} /> {order.buyerPhone}</div>
                                <div className="info-line"><MapPin size={16} /> {order.deliveryAddress}</div>
                                {order.carrier && (
                                    <div className="info-line"><Truck size={16} /> Đơn vị: {order.carrier}</div>
                                )}
                                {order.trackingNumber && (
                                    <div className="info-line"><Package size={16} /> Mã vận đơn: {order.trackingNumber}</div>
                                )}
                                {order.deliveredAt && (
                                    <div className="info-line"><CheckCircle size={16} /> Giao thành công: {formatDate(order.deliveredAt)}</div>
                                )}
                            </div>
                            <div className="info-card">
                                <div className="card-head">
                                    <h4>
                                        <CreditCard size={16} className="card-icon" />
                                        Phương thức thanh toán
                                    </h4>
                                </div>
                                <div className="payment-method">
                                    <div className="payment-icon">
                                        <CreditCard size={20} color="white" />
                                    </div>
                                    <div className="payment-info">
                                        <div className="payment-label">{getPaymentMethodLabel(order.paymentMethod)}</div>
                                        {paymentStatusInfo?.label && (
                                            <div className={`payment-status ${paymentStatusInfo.statusClass}`}>
                                                {paymentStatusInfo.label}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {isCancelled && (
                                <div className="info-card cancellation-card">
                                    <div className="card-head">
                                        <h4>
                                            <AlertCircle size={16} className="card-icon danger" />
                                            Thông tin hủy đơn
                                        </h4>
                                    </div>
                                    <div className="info-line">
                                        <Calendar size={16} />
                                        <span>Ngày hủy: {order.canceledAt ? formatDate(order.canceledAt) : 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="info-line">
                                        <AlertCircle size={16} />
                                        <span>Lý do: {order.cancelReason || 'Không có'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="action-buttons-bottom">
                            {order.needInvoice && (
                                <button className="btn btn-success" onClick={() => alert('Tải hóa đơn (sẽ triển khai)')}>
                                    <Package className="btn-icon" />
                                    Tải hóa đơn
                                </button>
                            )}
                            <button className="btn btn-primary continue-shopping-btn" onClick={() => navigate('/products')}>
                                <Home className="btn-icon" />
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    </div>

                    {/* Cột phải - Hành động & hỗ trợ (tổng tiền đã chuyển sang chi tiết đơn hàng) */}
                    <div className="order-actions-column">
                        {/* Bỏ card tổng tiền riêng để tránh trùng lặp */}

                        {/* Hành động */}
                        <div className="order-actions">
                            {order.status === 'pending' && (
                                <div className="action-buttons">
                                    <AnimatedButton
                                        variant="primary"
                                        shimmer={true}
                                        onClick={handleContactSeller}
                                        className="action-btn-primary"
                                    >
                                        <Phone size={18} />
                                        Liên hệ người bán
                                    </AnimatedButton>
                                    <AnimatedButton
                                        variant="outline-danger"
                                        onClick={handleCancelOrder}
                                        className="action-btn-danger"
                                    >
                                        <AlertCircle size={18} />
                                        Hủy đơn hàng
                                    </AnimatedButton>
                                </div>
                            )}

                            {order.status === 'confirmed' && (
                                <div className="action-buttons">
                                    <AnimatedButton
                                        variant="primary"
                                        shimmer={true}
                                        onClick={handleContactSeller}
                                        className="action-btn-primary"
                                    >
                                        <Phone size={18} />
                                        Liên hệ người bán
                                    </AnimatedButton>
                                    <div className="status-note status-note-animated">
                                        <Clock className="note-icon" />
                                        <span>Đơn hàng đang được chuẩn bị</span>
                                    </div>
                                </div>
                            )}

                            {order.status === 'shipping' && (
                                <div className="action-buttons">
                                    <AnimatedButton
                                        variant="primary"
                                        shimmer={true}
                                        onClick={handleContactSeller}
                                        className="action-btn-primary"
                                    >
                                        <Phone size={18} />
                                        Liên hệ người bán
                                    </AnimatedButton>
                                    <div className="status-note status-note-animated status-note-shipping">
                                        <Truck className="note-icon" />
                                        <span>Đơn hàng đang trên đường</span>
                                    </div>
                                </div>
                            )}

                            {order.status === 'delivered' && (
                                <div className="action-buttons">
                                    <div className="status-note success status-note-animated status-note-success">
                                        <CheckCircle className="note-icon" />
                                        <span>Đơn hàng đã được giao thành công</span>
                                    </div>
                                    <div className="delivered-action-buttons">
                                        <AnimatedButton
                                            variant="warning"
                                            onClick={() => alert('Khiếu nại đơn hàng (sẽ triển khai)')}
                                            size="sm"
                                        >
                                            <MessageSquareWarning size={16} />
                                            Khiếu nại
                                        </AnimatedButton>
                                        {hasReview ? (
                                            <AnimatedButton
                                                variant="secondary"
                                                onClick={handleViewReview}
                                                size="sm"
                                            >
                                                <Star size={16} />
                                                Xem đánh giá
                                            </AnimatedButton>
                                        ) : (
                                            <AnimatedButton
                                                variant="success"
                                                shimmer={true}
                                                onClick={handleRateOrder}
                                                size="sm"
                                            >
                                                <Star size={16} />
                                                Đánh giá
                                            </AnimatedButton>
                                        )}
                                        <AnimatedButton
                                            variant="secondary"
                                            onClick={() => alert('Đặt lại đơn (sẽ triển khai)')}
                                            size="sm"
                                        >
                                            Đặt lại
                                        </AnimatedButton>
                                    </div>
                                </div>
                            )}

                            {order.status === 'cancelled' && (
                                <div className="action-buttons">
                                    <div className="status-note error status-note-animated status-note-error">
                                        <AlertCircle className="note-icon" />
                                        <span>Đơn hàng đã bị hủy</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thông tin hỗ trợ */}
                        <div className="support-info support-info-enhanced">
                            <h4 className="support-title">Cần hỗ trợ?</h4>
                            <p className="support-desc">
                                Nếu bạn có bất kỳ thắc mắc nào về đơn hàng, vui lòng liên hệ với chúng tôi.
                            </p>
                            <AnimatedButton
                                variant="outline-primary"
                                onClick={() => alert('Liên hệ hỗ trợ (sẽ triển khai)')}
                                className="support-button"
                            >
                                <Phone size={18} />
                                Liên hệ hỗ trợ
                            </AnimatedButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderTracking;
