import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    MessageSquareWarning,
    FileText,
    Download,
    RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../test-mock-data/data/productsData';

// Hàm format ngày và giờ
const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        const dateStr = date.toLocaleDateString("vi-VN", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString("vi-VN", {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        return `${dateStr} ${timeStr}`;
    } catch (error) {
        console.warn('[OrderTracking] formatDateTime error:', error);
        return formatDate(dateString);
    }
};
import OrderStatus from '../../components/OrderStatus/OrderStatus';
import './OrderTracking.css';
import { getOrderHistory, getOrderStatus, getOrderDetails, hasOrderReview, getOrderPayment, getCancelReasons, confirmOrderDelivery, getOrderInvoice } from '../../api/orderApi';
import { fetchPostProductById } from '../../api/productApi';
import profileApi from '../../api/profileApi';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import DisputeForm from '../../components/BuyerRaiseDispute/DisputeForm';
import DisputeModal from '../../components/ui/DisputeModal';
import CancelOrderRequest from '../../components/CancelOrderModal/CancelOrderRequest';
import { Toast } from '../../components/Toast/Toast';
import ViewDisputeResult from '../../components/ProfileUser/ViewDisputeResult';
import { useAuth } from '../../hooks/useAuth';

function OrderTracking() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isSeller: isSellerFromAuth, user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(true);

    // Helper function để kiểm tra role seller - kiểm tra từ nhiều nguồn
    const checkIsSeller = useCallback(() => {
        // 1. Kiểm tra từ user object từ useAuth
        if (user?.role === 'SELLER') {
            return true;
        }
        // 2. Kiểm tra từ hàm isSellerFromAuth
        if (isSellerFromAuth && typeof isSellerFromAuth === 'function') {
            try {
                const result = isSellerFromAuth();
                if (result === true) {
                    return true;
                }
            } catch (e) {
                console.warn('[OrderTracking] Error calling isSellerFromAuth:', e);
            }
        }
        // 3. Fallback: kiểm tra trực tiếp từ localStorage
        const authType = localStorage.getItem("authType");
        const userRole = localStorage.getItem("userRole");
        const sellerId = localStorage.getItem("sellerId");
        return authType === "seller" || userRole === "seller" || !!sellerId;
    }, [user, isSellerFromAuth]);

    // Sử dụng useMemo để cache giá trị isSeller
    const isSeller = useMemo(() => checkIsSeller(), [checkIsSeller]);
    const [hasReview, setHasReview] = useState(false); // Trạng thái đánh giá
    const [cancelReasonMap, setCancelReasonMap] = useState({});

    const [isDisputeFormVisible, setIsDisputeFormVisible] = useState(false);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const [hasAnyDispute, setHasAnyDispute] = useState(false);
    const [isDisputePending, setIsDisputePending] = useState(false);
    const [isViewingDisputeResult, setIsViewingDisputeResult] = useState(false);

    // Invoice state
    const [invoiceData, setInvoiceData] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [invoiceError, setInvoiceError] = useState('');
    const [hasInvoiceAttempted, setHasInvoiceAttempted] = useState(false); // Track if we've tried to load invoice

    const showToastMessage = (message) => {
        if (!message) return;
        setToastMessage(message);
        setShowToast(true);
    };

    const toastPortal = (
        <Toast
            message={toastMessage}
            show={showToast}
            onClose={() => setShowToast(false)}
        />
    );

    const updateOrderState = (updater) => {
        setOrder(prev => {
            const nextValue = typeof updater === 'function' ? updater(prev) : updater;
            if (nextValue === undefined) return prev;
            return nextValue;
        });
    };
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

        // Xử lý COD: Nếu đơn hàng đã COMPLETED/SUCCESS (người dùng đã xác nhận), 
        // có nghĩa là đã thanh toán cho shipper rồi
        if (normalizedMethod === 'cod') {
            // Nếu đơn hàng đã hoàn thành (COMPLETED/SUCCESS), nghĩa là đã thanh toán
            if (normalizedRawStatus === 'COMPLETED' || normalizedRawStatus === 'SUCCESS') {
                return { label: 'Đã thanh toán', statusClass: 'paid' };
            }
            // Các trạng thái khác (PENDING, PROCESSING, SHIPPED, DELIVERED) = chưa thanh toán
            return { label: 'Chưa thanh toán', statusClass: 'pending' };
        }

        // Xử lý các phương thức thanh toán khác (Ví điện tử, VnPay, etc.)
        if (normalizedRawStatus === 'PENDING_PAYMENT' || normalizedRawStatus === 'PENDING') {
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

    const handleViewDisputeResult = () => {
        // Mở component ViewDisputeResult (cần import nó nếu chưa có, hoặc dùng modal/nav)
        setIsViewingDisputeResult(true);
    };

    // 👇 HÀM ĐÓNG KẾT QUẢ KHIẾU NẠI (Khi người dùng muốn quay lại chi tiết đơn hàng)
    const handleCloseDisputeResult = () => {
        setIsViewingDisputeResult(false);
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

    const handleConfirmOrder = async () => {
        const realId = order?.realId || order?.id || orderId;
        if (!realId || confirming) return;

        // Get status from multiple possible locations
        const currentStatus = String(
            order?.rawStatus ||
            order?._raw?.status ||
            order?._raw?.orderStatus ||
            order?._raw?.rawStatus ||
            ''
        ).toUpperCase();

        // Also check normalized status
        const normalizedStatus = String(order?.status || '').toLowerCase();

        console.log('[OrderTracking] handleConfirmOrder - Status check:', {
            rawStatus: order?.rawStatus,
            _raw_status: order?._raw?.status,
            _raw_rawStatus: order?._raw?.rawStatus,
            status: order?.status,
            currentStatus,
            normalizedStatus
        });

        // Check if order is already COMPLETED
        if (['COMPLETED', 'SUCCESS'].includes(currentStatus)) {
            showToastMessage('Đơn hàng đã được xác nhận hoặc đang ở trạng thái hoàn tất.');
            return;
        }

        // Check if order is DELIVERED (check both raw status and normalized status)
        const isDelivered = currentStatus === 'DELIVERED' || normalizedStatus === 'delivered';
        if (!isDelivered) {
            showToastMessage('Chỉ có thể xác nhận đơn hàng khi đơn hàng đã được giao thành công (DELIVERED).');
            return;
        }

        setConfirming(true);
        try {
            // Call the real API to confirm order
            const response = await confirmOrderDelivery(realId);

            if (!response.success) {
                throw new Error(response.message || 'Không thể xác nhận đơn hàng.');
            }

            console.log('[OrderTracking] Confirm order response:', {
                success: response.success,
                rawStatus: response.rawStatus,
                status: response.status,
                data: response.data
            });

            showToastMessage(response.message || 'Đơn hàng đã được xác nhận thành công!');

            // Use status from confirm response first, then refresh from backend
            const confirmedRawStatus = response.rawStatus || response.data?.status || 'COMPLETED';
            const confirmedNormalizedStatus = String(confirmedRawStatus).toUpperCase() === 'COMPLETED' ? 'completed' : 'delivered';
            const completedAtTime = new Date().toISOString(); // Thời điểm xác nhận hoàn thành

            // Optimistically update UI immediately with confirmed status
            // completedAt sẽ được lấy từ updatedAt khi backend trả về, nhưng tạm thời set để UI cập nhật ngay
            updateOrderState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    rawStatus: confirmedRawStatus,
                    status: confirmedNormalizedStatus,
                    completedAt: completedAtTime, // Tạm thời set, sẽ được cập nhật từ backend updatedAt
                    updatedAt: completedAtTime,
                    _raw: {
                        ...(prev._raw || {}),
                        rawStatus: confirmedRawStatus,
                        status: confirmedRawStatus,
                        orderStatus: confirmedRawStatus,
                        updatedAt: completedAtTime // Backend sẽ trả về updatedAt, đó chính là completedAt
                    }
                };
            });

            // Refresh order data from backend to get the updated status (may take a moment)
            try {
                const refreshedRes = await getOrderDetails(realId);
                if (refreshedRes.success && refreshedRes.data) {
                    const orderDetailData = refreshedRes.data;
                    const rawStatus = orderDetailData.rawStatus || confirmedRawStatus;
                    const normalizedStatus = String(rawStatus).toUpperCase() === 'COMPLETED' ? 'completed' : (orderDetailData.status || confirmedNormalizedStatus);

                    console.log('[OrderTracking] Refreshed order data after confirm:', {
                        rawStatus,
                        normalizedStatus,
                        orderDetailDataRawStatus: orderDetailData.rawStatus
                    });

                    // Reconstruct order object similar to loadOrderTracking
                    // Ensure all required fields are set with proper defaults
                    const price = Number(orderDetailData.price || order?.price || 0);
                    const shippingFee = Number(orderDetailData.shippingFee || order?.shippingFee || 0);
                    const finalPrice = Number(orderDetailData.finalPrice || order?.finalPrice || (price + shippingFee));
                    const totalPrice = price > 0 ? price : (finalPrice - shippingFee);

                    const trackingOrder = {
                        ...order, // Preserve existing order data
                        id: orderDetailData.id || realId,
                        realId: orderDetailData.id || realId,
                        orderCode: orderDetailData.orderCode || order?.orderCode || String(realId),
                        status: normalizedStatus,
                        rawStatus: rawStatus,
                        createdAt: orderDetailData.createdAt || order?.createdAt,
                        updatedAt: orderDetailData.updatedAt || new Date().toISOString(),
                        deliveredAt: orderDetailData.deliveredAt || order?.deliveredAt || new Date().toISOString(),
                        // completedAt: thời điểm đơn hàng được xác nhận hoàn thành
                        // completedAt chính là updatedAt khi đơn hàng ở trạng thái COMPLETED
                        completedAt: (normalizedStatus === 'completed' || rawStatus === 'COMPLETED'
                            ? (orderDetailData.completedAt ||
                                orderDetailData._raw?.completedAt ||
                                orderDetailData.updatedAt ||
                                order?.completedAt)
                            : order?.completedAt),
                        canceledAt: orderDetailData.canceledAt || order?.canceledAt,
                        cancelReason: orderDetailData.cancelReason || order?.cancelReason,
                        price: price,
                        totalPrice: totalPrice, // Ensure totalPrice is set
                        shippingFee: shippingFee,
                        finalPrice: finalPrice,
                        product: {
                            ...(order?.product || {}),
                            price: totalPrice, // Ensure product.price is set
                            title: order?.product?.title || `Đơn hàng ${orderDetailData.orderCode || realId}`,
                            image: order?.product?.image || '/vite.svg'
                        },
                        buyer: order?.buyer || {},
                        shipping: {
                            ...(order?.shipping || {}),
                            address: orderDetailData.shippingAddress || order?.shipping?.address,
                            phone: orderDetailData.phoneNumber || order?.shipping?.phone,
                        },
                        payment: order?.payment || {},
                        _raw: {
                            ...(order?._raw || {}),
                            ...(orderDetailData._raw || {}),
                            rawStatus: rawStatus,
                            status: rawStatus,
                            orderStatus: rawStatus
                        }
                    };
                    setOrder(trackingOrder);
                }
            } catch (refreshError) {
                console.warn('[OrderTracking] Failed to refresh order data after confirm, using optimistic update:', refreshError);
                // Keep the optimistic update if refresh fails
            }
        } catch (error) {
            const message = error?.message || error?.response?.data?.message || 'Không thể xác nhận đơn hàng.';
            showToastMessage(message);
            console.error('[OrderTracking] Failed to confirm order:', error);
        } finally {
            setConfirming(false);
        }
    };

    // Load invoice for order
    const loadInvoice = async (targetOrderId) => {
        const realId = targetOrderId || order?.realId || order?.id || orderId;
        if (!realId) {
            setInvoiceError('Không tìm thấy mã đơn hàng để tải hóa đơn.');
            setHasInvoiceAttempted(true);
            return;
        }

        setInvoiceLoading(true);
        setInvoiceError('');
        setInvoiceData(null);
        setHasInvoiceAttempted(true);

        try {
            const response = await getOrderInvoice(realId);
            if (response.success && response.data) {
                const data = response.data;
                if (data.pdfUrl) {
                    setInvoiceData(data);
                    setInvoiceError('');
                } else {
                    const fallbackMessage = response.message || 'Hóa đơn chưa sẵn sàng. Vui lòng thử lại sau.';
                    setInvoiceData(data);
                    setInvoiceError(fallbackMessage);
                }
            } else {
                // If API returns success:false, invoice might not exist yet
                const fallbackMessage = response.message || 'Không thể tải hóa đơn. Vui lòng thử lại sau.';
                setInvoiceError(fallbackMessage);
                setInvoiceData(null);
            }
        } catch (error) {
            console.error('❌ Error fetching invoice:', error);
            // If 404, invoice doesn't exist - don't show error, just don't show invoice section
            if (error?.response?.status === 404) {
                setInvoiceError('');
                setInvoiceData(null);
            } else {
                const message = error?.response?.data?.message || error?.message || 'Không thể tải hóa đơn. Vui lòng thử lại sau.';
                setInvoiceError(message);
                setInvoiceData(null);
            }
        } finally {
            setInvoiceLoading(false);
        }
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

    // === LOGIC FETCH TRẠNG THÁI KHIẾU NẠI ===
    useEffect(() => {
        let isMounted = true;
        const checkDisputeStatus = async () => {
            const realId = order?.realId || order?.id || orderId;
            if (!realId) return;

            try {
                // 1. Kiểm tra đã có khiếu nại nào chưa (Dùng API lấy danh sách)
                const disputeListRes = await profileApi.getDisputeByOrderId(realId);
                const data = disputeListRes.data?.data;
                const disputesArray = Array.isArray(data) ? data : (data ? [data] : []);

                if (!isMounted) return;

                const hasDispute = disputesArray.length > 0;
                setHasAnyDispute(hasDispute);

                if (hasDispute) {
                    // 2. Nếu đã có, kiểm tra có đang Pending không (Dùng API mới)
                    const pendingRes = await profileApi.checkOrderDisputePendingStatus(realId);
                    const isPending = pendingRes.data?.data === true;

                    if (!isMounted) return;
                    setIsDisputePending(isPending);
                } else {
                    setIsDisputePending(false);
                }

            } catch (error) {
                if (isMounted) {
                    // Nếu API trả lỗi (vd: 404/không tìm thấy), coi như chưa có khiếu nại
                    console.warn('[OrderTracking] Failed to check dispute status:', error);
                    setHasAnyDispute(false);
                    setIsDisputePending(false);
                }
            }
        };

        if (orderId) {
            checkDisputeStatus();
        }

        return () => { isMounted = false; };
    }, [orderId, order?.realId, order?.id]);

    // Reset invoice state when orderId changes
    useEffect(() => {
        setInvoiceData(null);
        setInvoiceLoading(false);
        setInvoiceError('');
        setHasInvoiceAttempted(false);
    }, [orderId]);

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

                            // Completed info: thời điểm đơn hàng được xác nhận hoàn thành
                            // completedAt chính là updatedAt khi đơn hàng ở trạng thái COMPLETED
                            completedAt: (orderDetailData.rawStatus === 'COMPLETED' || orderDetailData.status === 'completed'
                                ? (orderDetailData.completedAt ||
                                    orderDetailData._raw?.completedAt ||
                                    orderDetailData.updatedAt ||
                                    null)
                                : null),

                            // Invoice - kiểm tra nhiều nguồn: invoiceApi, needInvoice, need_order_invoice
                            needInvoice: (() => {
                                // Nếu có invoiceApi URL thì có nghĩa là có hóa đơn
                                const hasInvoiceApi = Boolean(
                                    orderDetailData._raw?.invoiceApi ||
                                    orderDetailData.invoiceApi ||
                                    false
                                );
                                const hasInvoiceFlag = Boolean(
                                    orderDetailData._raw?.needInvoice ||
                                    orderDetailData._raw?.need_order_invoice ||
                                    orderDetailData.needInvoice ||
                                    orderDetailData.need_order_invoice ||
                                    false
                                );
                                const hasInvoice = hasInvoiceApi || hasInvoiceFlag;
                                console.log('[OrderTracking] needInvoice check:', {
                                    orderId: orderDetailData.id || orderId,
                                    invoiceApi: orderDetailData._raw?.invoiceApi || orderDetailData.invoiceApi,
                                    _raw_needInvoice: orderDetailData._raw?.needInvoice,
                                    _raw_need_order_invoice: orderDetailData._raw?.need_order_invoice,
                                    needInvoice: orderDetailData.needInvoice,
                                    need_order_invoice: orderDetailData.need_order_invoice,
                                    hasInvoiceApi,
                                    hasInvoiceFlag,
                                    result: hasInvoice
                                });
                                return hasInvoice;
                            })(),

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

                                    // Nếu đơn hàng đã giao hoặc completed, kiểm tra xem đã có đánh giá chưa
                                    if (statusResponse.status === 'delivered' || statusResponse.status === 'completed') {
                                        try {
                                            const reviewStatus = await hasOrderReview(realOrderId);
                                            console.log('[OrderTracking] Review status checked on load:', reviewStatus, 'for order:', realOrderId);
                                            setHasReview(reviewStatus);
                                        } catch (reviewError) {
                                            console.warn('[OrderTracking] Failed to check review status:', reviewError);
                                        }
                                    }
                                    // KHÔNG set false ở đây - để tránh reset khi order đã completed nhưng status response chưa đúng
                                }
                            } catch (error) {
                                console.warn('[OrderTracking] Failed to get order status from API:', error);
                                // Nếu API fail nhưng order status từ order detail là delivered hoặc completed, vẫn check review
                                if (mappedOrder.status === 'delivered' || mappedOrder.status === 'completed') {
                                    try {
                                        const reviewStatus = await hasOrderReview(realOrderId);
                                        console.log('[OrderTracking] Review status checked (error fallback):', reviewStatus, 'for order:', realOrderId);
                                        setHasReview(reviewStatus);
                                    } catch (reviewError) {
                                        console.warn('[OrderTracking] Failed to check review status:', reviewError);
                                    }
                                }
                            }
                        } else {
                            // Nếu không lấy được status từ shipping API nhưng order status từ order detail là delivered hoặc completed
                            if (mappedOrder.status === 'delivered' || mappedOrder.status === 'completed') {
                                try {
                                    const reviewStatus = await hasOrderReview(realOrderId);
                                    console.log('[OrderTracking] Review status checked (no status API):', reviewStatus, 'for order:', realOrderId);
                                    setHasReview(reviewStatus);
                                } catch (reviewError) {
                                    console.warn('[OrderTracking] Failed to check review status:', reviewError);
                                }
                            }
                        }

                        // Cập nhật theo nguyên tắc "không lùi trạng thái"
                        // Thêm "completed" vào rank với giá trị cao nhất (6) để không bao giờ lùi từ completed
                        updateOrderState(prev => {
                            const rank = {
                                pending: 1,
                                confirmed: 2,
                                shipping: 3,
                                delivered: 4,
                                completed: 6,  // Completed là trạng thái cuối cùng, không được lùi
                                success: 6,    // Success tương đương completed
                                canceled: 5,
                                cancelled: 5
                            };
                            if (prev && prev.status) {
                                const pr = rank[String(prev.status)] || 0;
                                const nr = rank[String(mappedOrder.status)] || 0;
                                // Không cho phép lùi trạng thái, đặc biệt là từ completed về delivered/pending
                                const isBackward = nr > 0 && pr > 0 && nr < pr && mappedOrder.status !== 'canceled' && mappedOrder.status !== 'cancelled';
                                if (isBackward) {
                                    console.log('[OrderTracking] Preventing backward status update:', {
                                        from: prev.status,
                                        to: mappedOrder.status,
                                        prevRank: pr,
                                        newRank: nr
                                    });
                                    return prev;
                                }
                                return { ...prev, ...mappedOrder };
                            }
                            return mappedOrder;
                        });

                        // Đảm bảo check review status sau khi update order state (nếu order đã delivered/completed)
                        if (mappedOrder.status === 'delivered' || mappedOrder.status === 'completed') {
                            const finalRealOrderId = orderDetailData.id || orderId;
                            if (finalRealOrderId) {
                                hasOrderReview(finalRealOrderId)
                                    .then(reviewStatus => {
                                        console.log('[OrderTracking] Review status checked after state update:', reviewStatus, 'for order:', finalRealOrderId);
                                        setHasReview(reviewStatus);
                                    })
                                    .catch(console.warn);
                            }
                        }

                        // Always try to load invoice for the order (regardless of flags)
                        // Reuse realOrderId from above (line 792)
                        if (realOrderId) {
                            loadInvoice(realOrderId);
                        }

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

                                    // Nếu đơn hàng đã giao hoặc completed, kiểm tra xem đã có đánh giá chưa
                                    if (statusResponse.status === 'delivered' || statusResponse.status === 'completed') {
                                        try {
                                            const reviewStatus = await hasOrderReview(realOrderId);
                                            console.log('[OrderTracking] Review status checked (history fallback):', reviewStatus, 'for order:', realOrderId);
                                            setHasReview(reviewStatus);
                                        } catch (reviewError) {
                                            console.warn('[OrderTracking] Failed to check review status:', reviewError);
                                        }
                                    }
                                    // KHÔNG set false ở đây - để tránh reset khi order đã completed nhưng status response chưa đúng
                                }
                            } catch (error) {
                                console.warn('[OrderTracking] Failed to get order status from API:', error);
                            }
                        }

                        // Nếu order đã delivered hoặc completed, check review status (đảm bảo check ngay cả khi không có status API)
                        if (mapped.status === 'delivered' || mapped.status === 'completed') {
                            const realIdForReview = beOrder._raw?.id ?? beOrder.id;
                            if (realIdForReview) {
                                hasOrderReview(realIdForReview).then(setHasReview).catch(console.warn);
                            }
                        }

                        // Cập nhật theo nguyên tắc "không lùi trạng thái"
                        updateOrderState(prev => {
                            const rank = {
                                pending: 1,
                                confirmed: 2,
                                shipping: 3,
                                delivered: 4,
                                completed: 6,
                                success: 6,
                                canceled: 5,
                                cancelled: 5
                            };
                            if (prev && prev.status) {
                                const pr = rank[String(prev.status)] || 0;
                                const nr = rank[String(mapped.status)] || 0;
                                const isBackward = nr > 0 && pr > 0 && nr < pr && mapped.status !== 'canceled' && mapped.status !== 'cancelled';
                                if (isBackward) {
                                    console.log('[OrderTracking] Preventing backward status update from history:', {
                                        from: prev.status,
                                        to: mapped.status
                                    });
                                    return prev;
                                }
                                return { ...prev, ...mapped };
                            }
                            return mapped;
                        });

                        // Always try to load invoice for the order (regardless of flags)
                        const realIdForInvoice = beOrder._raw?.id ?? beOrder.id ?? orderId;
                        if (realIdForInvoice) {
                            loadInvoice(realIdForInvoice);
                        }

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

                        // Nếu order đã delivered hoặc completed, check review status (đảm bảo check ngay cả khi load từ localStorage)
                        if (mapped.status === 'delivered' || mapped.status === 'completed') {
                            const realIdForReview = foundOrder._raw?.id ?? foundOrder.id ?? orderId;
                            if (realIdForReview) {
                                hasOrderReview(realIdForReview)
                                    .then(reviewStatus => {
                                        console.log('[OrderTracking] Review status checked (localStorage fallback):', reviewStatus, 'for order:', realIdForReview);
                                        setHasReview(reviewStatus);
                                    })
                                    .catch(console.warn);
                            }
                        }

                        // Cập nhật theo nguyên tắc "không lùi trạng thái"
                        updateOrderState(prev => {
                            const rank = {
                                pending: 1,
                                confirmed: 2,
                                shipping: 3,
                                delivered: 4,
                                completed: 6,
                                success: 6,
                                canceled: 5,
                                cancelled: 5
                            };
                            if (prev && prev.status) {
                                const pr = rank[String(prev.status)] || 0;
                                const nr = rank[String(mapped.status)] || 0;
                                const isBackward = nr > 0 && pr > 0 && nr < pr && mapped.status !== 'canceled' && mapped.status !== 'cancelled';
                                if (isBackward) {
                                    console.log('[OrderTracking] Preventing backward status update from localStorage:', {
                                        from: prev.status,
                                        to: mapped.status
                                    });
                                    return prev;
                                }
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
                updateOrderState(null);
            } catch (error) {
                console.error('[OrderTracking] Error loading order:', error);
                updateOrderState(null);
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

                        updateOrderState(prevOrder => {
                            if (!prevOrder) return prevOrder;

                            // Kiểm tra nếu đơn hàng hiện tại đã completed, không cho phép lùi về trạng thái cũ
                            const currentRawStatus = String(prevOrder?.rawStatus || prevOrder?._raw?.status || '').toUpperCase();
                            const currentNormalizedStatus = String(prevOrder?.status || '').toLowerCase();
                            const isCurrentlyCompleted = ['COMPLETED', 'SUCCESS'].includes(currentRawStatus) ||
                                currentNormalizedStatus === 'completed' ||
                                currentNormalizedStatus === 'success';

                            // Nếu đơn hàng đã completed, chỉ cập nhật các thông tin khác, không cập nhật status
                            if (isCurrentlyCompleted) {
                                const newRawStatus = String(orderDetailData.rawStatus || '').toUpperCase();
                                const newNormalizedStatus = String(orderDetailData.status || '').toLowerCase();
                                const newIsCompleted = ['COMPLETED', 'SUCCESS'].includes(newRawStatus) ||
                                    newNormalizedStatus === 'completed' ||
                                    newNormalizedStatus === 'success';

                                // Chỉ cập nhật nếu backend trả về completed, không cho phép lùi về delivered
                                if (!newIsCompleted) {
                                    console.log('[OrderTracking] Order is completed, preventing status downgrade in auto-refresh');
                                    // Vẫn cập nhật các thông tin khác nhưng giữ nguyên status completed
                                    return {
                                        ...prevOrder,
                                        // Giữ nguyên status và rawStatus
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
                            }

                            const statusChanged = orderDetailData.status !== prevOrder.status;
                            const cancelChanged = Boolean(orderDetailData.canceledAt) !== Boolean(prevOrder.canceledAt);

                            // Nếu đơn hàng đã giao hoặc completed, luôn kiểm tra review status
                            if (orderDetailData.status === 'delivered' || prevOrder.status === 'delivered' ||
                                orderDetailData.status === 'completed' || prevOrder.status === 'completed') {
                                hasOrderReview(realOrderId)
                                    .then(reviewStatus => {
                                        console.log('[OrderTracking] Review status refreshed in auto-refresh:', reviewStatus, 'for order:', realOrderId);
                                        setHasReview(reviewStatus);
                                    })
                                    .catch(console.warn);
                            }
                            // KHÔNG set false ở đây - để tránh reset khi order đã completed

                            if (statusChanged || cancelChanged || orderDetailData.updatedAt !== prevOrder.estimatedDelivery) {
                                console.log(`[OrderTracking] Order updated: status=${orderDetailData.status}, canceledAt=${orderDetailData.canceledAt}`);

                                // Áp dụng logic "không lùi trạng thái" khi cập nhật
                                const rank = {
                                    pending: 1,
                                    confirmed: 2,
                                    shipping: 3,
                                    delivered: 4,
                                    completed: 6,
                                    success: 6,
                                    canceled: 5,
                                    cancelled: 5
                                };
                                const pr = rank[String(prevOrder?.status)] || 0;
                                const nr = rank[String(orderDetailData.status)] || 0;
                                const isBackward = nr > 0 && pr > 0 && nr < pr &&
                                    orderDetailData.status !== 'canceled' &&
                                    orderDetailData.status !== 'cancelled';

                                if (isBackward) {
                                    console.log('[OrderTracking] Preventing backward status update in auto-refresh:', {
                                        from: prevOrder.status,
                                        to: orderDetailData.status
                                    });
                                    // Vẫn cập nhật các thông tin khác nhưng giữ nguyên status
                                    return {
                                        ...prevOrder,
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

                                return {
                                    ...prevOrder,
                                    status: orderDetailData.status || prevOrder.status,
                                    rawStatus: orderDetailData.rawStatus || prevOrder.rawStatus,
                                    // completedAt chính là updatedAt khi đơn hàng ở trạng thái COMPLETED
                                    completedAt: (orderDetailData.rawStatus === 'COMPLETED' || orderDetailData.status === 'completed'
                                        ? (orderDetailData.completedAt ||
                                            orderDetailData._raw?.completedAt ||
                                            orderDetailData.updatedAt ||
                                            prevOrder.completedAt)
                                        : prevOrder.completedAt),
                                    deliveredAt: orderDetailData.deliveredAt || orderDetailData._raw?.deliveredAt || prevOrder.deliveredAt,
                                    shippedAt: orderDetailData.shippedAt || orderDetailData._raw?.shippedAt || prevOrder.shippedAt,
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
                // QUAN TRỌNG: Không cập nhật nếu đơn hàng đã completed (đã xác nhận)
                try {
                    const statusResponse = await getOrderStatus(realOrderId);
                    if (statusResponse.success && statusResponse.status && statusResponse.status !== order.status) {
                        // Kiểm tra nếu đơn hàng hiện tại đã completed, không cho phép lùi về delivered
                        const currentRawStatus = String(order?.rawStatus || order?._raw?.status || '').toUpperCase();
                        const currentNormalizedStatus = String(order?.status || '').toLowerCase();
                        const isCurrentlyCompleted = ['COMPLETED', 'SUCCESS'].includes(currentRawStatus) ||
                            currentNormalizedStatus === 'completed' ||
                            currentNormalizedStatus === 'success';

                        // Nếu đơn hàng đã completed, không cập nhật về trạng thái cũ hơn
                        if (isCurrentlyCompleted) {
                            console.log('[OrderTracking] Order is already completed, skipping status update from shipping API');
                            return;
                        }

                        console.log(`[OrderTracking] Status updated from shipping API: ${order.status} -> ${statusResponse.status}`);
                        updateOrderState(prevOrder => {
                            const rank = {
                                pending: 1,
                                confirmed: 2,
                                shipping: 3,
                                delivered: 4,
                                completed: 6,
                                success: 6,
                                canceled: 5,
                                cancelled: 5
                            };
                            const pr = rank[String(prevOrder?.status)] || 0;
                            const nr = rank[String(statusResponse.status)] || 0;
                            const isBackward = nr > 0 && pr > 0 && nr < pr && statusResponse.status !== 'canceled' && statusResponse.status !== 'cancelled';
                            if (isBackward) {
                                console.log('[OrderTracking] Preventing backward status update from shipping API:', {
                                    from: prevOrder?.status,
                                    to: statusResponse.status
                                });
                                return prevOrder;
                            }
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

    // Refresh hasReview khi quay lại từ trang review (khi location thay đổi hoặc component mount lại)
    useEffect(() => {
        if (!order || !orderId) return;

        const realOrderId = order.realId || order.id || orderId;
        if (!realOrderId) return;

        // Kiểm tra xem đơn hàng đã completed hoặc delivered chưa
        const rawStatusUpper = String(order?.rawStatus || order?._raw?.rawStatus || order?._raw?.status || '').toUpperCase();
        const normalizedStatus = String(order?.status || '').toLowerCase();
        const isOrderCompleted = ['COMPLETED', 'SUCCESS'].includes(rawStatusUpper) ||
            normalizedStatus === 'completed' ||
            normalizedStatus === 'success';
        const isDelivered = normalizedStatus === 'delivered' || rawStatusUpper === 'DELIVERED' || isOrderCompleted;

        // Nếu đơn hàng đã completed hoặc delivered, refresh review status
        if (isDelivered || isOrderCompleted) {
            hasOrderReview(realOrderId)
                .then(reviewStatus => {
                    console.log('[OrderTracking] Refreshed review status:', reviewStatus, 'for order:', realOrderId);
                    setHasReview(reviewStatus);
                })
                .catch(error => {
                    console.warn('[OrderTracking] Failed to refresh review status:', error);
                });
        }
    }, [location.pathname, location.key, order?.id, order?.realId, order?.status, orderId]); // Refresh khi location thay đổi hoặc order status thay đổi

    // Refresh hasReview khi window focus (khi quay lại tab từ trang review)
    useEffect(() => {
        if (!order || !orderId) return;

        const realOrderId = order.realId || order.id || orderId;
        if (!realOrderId) return;

        const handleFocus = () => {
            const currentOrder = order; // Capture current order value
            if (!currentOrder) return;

            const rawStatusUpper = String(currentOrder?.rawStatus || currentOrder?._raw?.rawStatus || currentOrder?._raw?.status || '').toUpperCase();
            const normalizedStatus = String(currentOrder?.status || '').toLowerCase();
            const isOrderCompleted = ['COMPLETED', 'SUCCESS'].includes(rawStatusUpper) ||
                normalizedStatus === 'completed' ||
                normalizedStatus === 'success';
            const isDelivered = normalizedStatus === 'delivered' || rawStatusUpper === 'DELIVERED' || isOrderCompleted;

            if (isDelivered || isOrderCompleted) {
                hasOrderReview(realOrderId)
                    .then(reviewStatus => {
                        console.log('[OrderTracking] Refreshed review status on window focus:', reviewStatus);
                        setHasReview(reviewStatus);
                    })
                    .catch(error => {
                        console.warn('[OrderTracking] Failed to refresh review status on focus:', error);
                    });
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order?.id, order?.realId, order?.status, orderId]);

    useEffect(() => {
        if (!order) return;
        const status = String(order.status || '').toLowerCase();
        if (status !== 'cancelled' && status !== 'canceled') return;
        if (!cancelReasonMap || Object.keys(cancelReasonMap).length === 0) return;
        const rawReason = pickFirstTruthy(order.cancelReasonRaw, order.cancelReasonId, order.cancelReason);
        if (!rawReason) return;
        const normalized = normalizeCancelReason(rawReason);
        if (normalized && normalized !== order.cancelReason) {
            updateOrderState(prev => {
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
        // Kiểm tra invoiceApi URL hoặc các flag boolean
        const hasInvoiceApi = Boolean(
            item._raw?.invoiceApi ||
            item.invoiceApi ||
            false
        );
        const needInvoice = Boolean(
            hasInvoiceApi ||
            item._raw?.needInvoice ||
            item._raw?.need_order_invoice ||
            item.needInvoice ||
            item.need_order_invoice ||
            item._raw?.invoiceRequired ||
            false
        );
        // completedAt: thời điểm đơn hàng được xác nhận hoàn thành
        // completedAt chính là updatedAt khi đơn hàng ở trạng thái completed
        const completedAt = (status === 'completed'
            ? (item._raw?.completedAt ||
                item._raw?.completed_at ||
                item._raw?.updatedAt ||
                item.updatedAt ||
                null)
            : null);

        const product = {
            image: item.product?.image || '/vite.svg',
            title: item.product?.title || `Đơn hàng ${item._raw?.orderCode || id}`,
            price: totalPrice,
        };

        const trackingOrder = {
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
            completedAt,
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
        return trackingOrder;
    }
    // 👇 HÀM MỞ FORM KHIẾU NẠI
    const handleRaiseDisputeClick = () => {
        if (isDisputePending) {
            showToastMessage("Đơn khiếu nại của bạn đang trong quá trình xử lý. Vui lòng quay lại sau.");
            return;
        }
        setIsDisputeFormVisible(true);
    };

    // 👇 HÀM ĐÓNG FORM (Dùng khi Submit thành công hoặc nhấn Hủy)
    const handleDisputeFormClose = (submittedSuccessfully = false) => {
        setIsDisputeFormVisible(false);

        if (submittedSuccessfully) {
            showToastMessage("Đơn khiếu nại đã được gửi thành công!");

            // CẬP NHẬT TRẠNG THÁI UI:
            setHasAnyDispute(true);    // Kích hoạt nút "Xem khiếu nại đã gửi"
            setIsDisputePending(true); // Kích hoạt logic chặn trên nút "Gửi khiếu nại"
        }
    };
    // Xử lý về trang chủ
    const handleGoHome = () => {
        navigate('/');
    };

    // Xử lý liên hệ người bán
    const handleContactSeller = () => {
        alert('Chức năng liên hệ người bán sẽ được phát triển');
    };

    // Xử lý hủy đơn hàng
    const handleCancelOrderClick = () => { // Đổi tên để dễ phân biệt với hàm cũ
        setIsCancelModalVisible(true);
    };

    //  HÀM CALLBACK KHI HỦY THÀNH CÔNG/HỦY BỎ TỪ FORM
    const handleCancelFormClose = (canceledSuccessfully = false, reason = '') => {
        setIsCancelModalVisible(false);
        if (canceledSuccessfully) {
            // Nếu hủy thành công, cập nhật trạng thái đơn hàng (từ callback của CancelOrderRequest)
            updateOrderState(prev => ({
                ...prev,
                status: 'cancelled',
                canceledAt: new Date().toISOString(), // Cập nhật ngày hủy
                cancelReason: reason || 'Đã hủy thành công' // Cập nhật lý do
            }));
        }
    };

    if (isGuest) {
        return null; // Sẽ redirect về login
    }

    if (loading) {
        return (
            <>
                {toastPortal}
                <div className="order-tracking-loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải thông tin đơn hàng...</p>
                </div>
            </>
        );
    }

    if (!order) {
        return (
            <>
                {toastPortal}
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
            </>
        );
    }

    const rawStatusUpper = String(
        order?.rawStatus ||
        order?._raw?.status ||
        order?._raw?.orderStatus ||
        order?._raw?.rawStatus ||
        ''
    ).toUpperCase();
    const normalizedStatus = String(order?.status || '').toLowerCase();
    const realIdForOrder = order?.realId || order?.id || orderId;

    // Check if order is completed from multiple sources
    const isOrderCompleted = ['COMPLETED', 'SUCCESS'].includes(rawStatusUpper) ||
        normalizedStatus === 'completed' ||
        normalizedStatus === 'success';

    if (isViewingDisputeResult) {
        return (
            <div className="order-tracking-page">
                <div className="order-tracking-container">
                    <button
                        className="btn btn-secondary back-to-tracking-btn"
                        onClick={handleCloseDisputeResult}
                        style={{ marginBottom: '20px' }}
                    >
                        <ArrowLeft size={18} style={{ marginRight: '8px' }} />
                        Quay lại chi tiết đơn hàng #{order.id}
                    </button>
                    {/* Sử dụng ViewDisputeResult component */}
                    <ViewDisputeResult orderId={realIdForOrder} />
                </div>
            </div>
        );
    }
    // Get status from multiple possible locations (same as in handleConfirmOrder)


    // Đảm bảo completedAt luôn được set khi đơn hàng ở trạng thái completed
    // completedAt chính là updatedAt khi đơn hàng ở trạng thái COMPLETED
    const completedAt = isOrderCompleted
        ? (order?.completedAt ||
            order?._raw?.completedAt ||
            order?.updatedAt ||
            null)
        : null;

    // Only show confirm button if status is DELIVERED and NOT completed
    const canConfirmOrder = (rawStatusUpper === 'DELIVERED' || normalizedStatus === 'delivered') && !isOrderCompleted;

    // Debug logging for button visibility
    if (order && (normalizedStatus === 'delivered' || isOrderCompleted)) {
        console.log('[OrderTracking] Button visibility check:', {
            orderId: realIdForOrder,
            rawStatus: order?.rawStatus,
            status: order?.status,
            _raw_rawStatus: order?._raw?.rawStatus,
            _raw_status: order?._raw?.status,
            _raw_orderStatus: order?._raw?.orderStatus,
            rawStatusUpper,
            normalizedStatus,
            isOrderCompleted,
            canConfirmOrder
        });
    }
    // isDeliveredStatus: hiển thị banner "Đã giao thành công" cho cả delivered và completed
    const isDeliveredStatus = normalizedStatus === 'delivered' || rawStatusUpper === 'DELIVERED' || isOrderCompleted;

    // Chỉ hiển thị nút đánh giá và khiếu nại khi đơn hàng đã completed (sau khi xác nhận)
    //const canRateOrDispute = isOrderCompleted;

    const paymentStatusInfo = getPaymentStatusInfo(order.paymentMethod, order.rawStatus);
    const isCancelled = order.status === 'cancelled' || order.status === 'canceled';

    return (
        <>
            {toastPortal}
            <div className="order-tracking-page">
                <div className="order-tracking-container">
                    {/* Header */}
                    <div className="order-tracking-header">
                        <h1 className="page-title">{isSeller ? 'Chi tiết đơn hàng' : 'Theo dõi đơn hàng'}</h1>
                        <div className="page-meta">
                            <div className="meta-left">
                                <span className="chip">
                                    <Package size={14} />
                                    Mã đơn: {order.id}
                                </span>
                                <span className="chip">
                                    <Calendar size={14} />
                                    Đặt: {formatDateTime(order.createdAt)}
                                </span>
                                {/* Hiển thị thời gian hoàn thành khi đơn hàng đã completed */}
                                {completedAt && (
                                    <span className="chip">
                                        <CheckCircle size={14} />
                                        Hoàn thành: {formatDateTime(completedAt)}
                                    </span>
                                )}
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
                    {isDeliveredStatus && (
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
                                            Mã đơn <span className="badge-code">#{order.id}</span> {isSeller ? 'đã được giao tới người mua' : 'đã được giao tới bạn'}
                                            {order.deliveredAt ? ` vào ${formatDateTime(order.deliveredAt)}` : ''}
                                            {completedAt && (
                                                <span> và đã được xác nhận hoàn thành vào {formatDateTime(completedAt)}</span>
                                            )}
                                        </p>
                                        <div className="delivered-meta">
                                            {order.carrier && <span className="chip alt">Đơn vị: {order.carrier}</span>}
                                            {order.trackingNumber && <span className="chip alt">Vận đơn: {order.trackingNumber}</span>}
                                            <span className="chip success">Tổng: {formatCurrency(order.finalPrice || (order.totalPrice || order.price || 0) + (order.shippingFee || 0))}</span>
                                        </div>
                                    </div>
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
                                        <span className="chip danger">Tổng: {formatCurrency(order.finalPrice || (order.totalPrice || order.price || 0) + (order.shippingFee || 0))}</span>
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
                                    <h2 className="success-title">{isSeller ? 'Đơn hàng đã được đặt' : 'Đặt hàng thành công!'}</h2>
                                    <p className="success-subtitle">
                                        {isSeller
                                            ? 'Người mua đã đặt hàng thành công. Đơn hàng đang được xử lý.'
                                            : 'Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.'}
                                    </p>
                                </div>
                            )}

                            <div className={`progress-card ${isCancelled ? 'is-cancelled' : ''}`}>
                                <div className="progress-steps">
                                    <div className={`p-step ${['pending', 'confirmed', 'shipping', 'delivered', 'completed', 'success'].indexOf(order.status) >= 0 ? 'active' : ''}`}>
                                        <div className="p-dot"><CheckCircle size={16} color="#fff" /></div>
                                        <div className="p-label">Đã đặt hàng</div>
                                        <div className="p-time">{formatDateTime(order.createdAt)}</div>
                                    </div>
                                    <div className={`p-sep ${['confirmed', 'shipping', 'delivered', 'completed', 'success'].includes(order.status) ? 'active' : ''}`}></div>
                                    <div className={`p-step ${['confirmed', 'shipping', 'delivered', 'completed', 'success'].includes(order.status) ? 'active' : ''}`}>
                                        <div className="p-dot"><CheckCircle size={16} color="#fff" /></div>
                                        <div className="p-label">Đơn vị vận chuyển đã lấy hàng</div>
                                        <div className="p-time">{order.shippedAt ? formatDateTime(order.shippedAt) : formatDateTime(order.createdAt)}</div>
                                    </div>
                                    <div className={`p-sep ${['shipping', 'delivered', 'completed', 'success'].includes(order.status) ? 'active' : ''}`}></div>
                                    <div className={`p-step ${['shipping', 'delivered', 'completed', 'success'].includes(order.status) ? 'active' : ''}`}>
                                        <div className="p-dot"><Truck size={16} color="#fff" /></div>
                                        <div className="p-label">Đang vận chuyển</div>
                                        <div className="p-time">{order.shippedAt ? formatDateTime(order.shippedAt) : formatDate(order.estimatedDelivery)}</div>
                                    </div>
                                    <div className={`p-sep ${['delivered', 'completed', 'success'].includes(order.status) ? 'active' : ''}`}></div>
                                    <div className={`p-step ${['delivered', 'completed', 'success'].includes(order.status) ? 'active' : ''}`}>
                                        <div className="p-dot"><Package size={16} color="#fff" /></div>
                                        <div className="p-label">Đã giao hàng</div>
                                        <div className="p-time">{order.deliveredAt ? formatDateTime(order.deliveredAt) : formatDate(order.estimatedDelivery)}</div>
                                    </div>
                                    {completedAt && (
                                        <>
                                            <div className={`p-sep active`}></div>
                                            <div className={`p-step active`}>
                                                <div className="p-dot"><CheckCircle size={16} color="#fff" /></div>
                                                <div className="p-label">Đã xác nhận hoàn thành</div>
                                                <div className="p-time">{formatDateTime(completedAt)}</div>
                                            </div>
                                        </>
                                    )}
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
                                    <h3>{isSeller ? 'Chi tiết đơn hàng của người mua' : 'Chi tiết đơn hàng'}</h3>
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
                                                <div className="i-price">{formatCurrency(it.price || 0)}</div>
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
                                            <div className="i-price">{formatCurrency(order.product?.price || order.totalPrice || order.price || 0)}</div>
                                        </div>
                                    )}

                                {/* Tổng tiền nằm cùng trong chi tiết đơn hàng */}
                                <div className="price-breakdown">
                                    <div className="price-item">
                                        <span className="price-label">Tạm tính</span>
                                        <span className="price-value">{formatCurrency(order.totalPrice || order.price || 0)}</span>
                                    </div>
                                    <div className="price-item">
                                        <span className="price-label">Phí vận chuyển</span>
                                        <span className="price-value">{formatCurrency(order.shippingFee || 0)}</span>
                                    </div>
                                    <div className="price-item total">
                                        <span className="price-label">Tổng cộng</span>
                                        <span className="price-value">{formatCurrency(order.finalPrice || (order.totalPrice || order.price || 0) + (order.shippingFee || 0))}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin giao hàng & thanh toán (2 cột) */}
                            <div className="info-grid">
                                <div className="info-card">
                                    <div className="card-head">
                                        <h4>
                                            <MapPin size={16} className="card-icon" />
                                            {isSeller ? 'Thông tin giao hàng của người mua' : 'Thông tin giao hàng'}
                                        </h4>
                                    </div>
                                    <div className="info-line"><User size={16} /> {order.buyerName}</div>
                                    <div className="info-line"><Phone size={16} /> {order.buyerPhone}</div>
                                    <div className="info-line"><MapPin size={16} /> {order.deliveryAddress}</div>
                                    <div className="info-line"><Calendar size={16} /> Đặt hàng: {formatDateTime(order.createdAt)}</div>
                                    {order.shippedAt && (
                                        <div className="info-line"><Truck size={16} /> Đã lấy hàng: {formatDateTime(order.shippedAt)}</div>
                                    )}
                                    {order.deliveredAt && (
                                        <div className="info-line"><Package size={16} /> Giao hàng: {formatDateTime(order.deliveredAt)}</div>
                                    )}
                                    {completedAt && (
                                        <div className="info-line"><CheckCircle size={16} /> Xác nhận hoàn thành: {formatDateTime(completedAt)}</div>
                                    )}
                                    {order.carrier && (
                                        <div className="info-line"><Truck size={16} /> Đơn vị: {order.carrier}</div>
                                    )}
                                    {order.trackingNumber && (
                                        <div className="info-line"><Package size={16} /> Mã vận đơn: {order.trackingNumber}</div>
                                    )}
                                    {completedAt && (
                                        <div className="info-line"><CheckCircle size={16} /> Xác nhận hoàn thành: {formatDateTime(completedAt)}</div>
                                    )}
                                </div>
                                <div className="info-card">
                                    <div className="card-head">
                                        <h4>
                                            <CreditCard size={16} className="card-icon" />
                                            {isSeller ? 'Phương thức thanh toán của người mua' : 'Phương thức thanh toán'}
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
                            {!isSeller && (
                                <div className="action-buttons-bottom">
                                    <button className="btn btn-primary continue-shopping-btn" onClick={() => navigate('/products')}>
                                        <Home className="btn-icon" />
                                        Tiếp tục mua sắm
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cột phải - Hành động & hỗ trợ (tổng tiền đã chuyển sang chi tiết đơn hàng) */}
                        <div className="order-actions-column">
                            {/* Bỏ card tổng tiền riêng để tránh trùng lặp */}

                            {/* Hành động */}
                            <div className="order-actions">
                                {order.status === 'pending' && (
                                    <div className="action-buttons">
                                        {!isSeller && (
                                            <AnimatedButton
                                                variant="primary"
                                                shimmer={true}
                                                onClick={handleContactSeller}
                                                className="action-btn-primary"
                                            >
                                                <Phone size={18} />
                                                Liên hệ người bán
                                            </AnimatedButton>
                                        )}
                                        {isSeller && (
                                            <AnimatedButton
                                                variant="primary"
                                                shimmer={true}
                                                onClick={handleContactSeller}
                                                className="action-btn-primary"
                                            >
                                                <Phone size={18} />
                                                Liên hệ người mua
                                            </AnimatedButton>
                                        )}
                                        {!isSeller && !isCancelModalVisible && (
                                            <AnimatedButton
                                                variant="outline-danger"
                                                onClick={handleCancelOrderClick} // 👈 Gắn hàm mở Modal
                                                className="action-btn-danger"
                                            >
                                                <AlertCircle size={18} />
                                                Hủy đơn hàng
                                            </AnimatedButton>
                                        )}
                                    </div>
                                )}

                                {order.status === 'confirmed' && (
                                    <div className="action-buttons">
                                        {!isSeller && (
                                            <AnimatedButton
                                                variant="primary"
                                                shimmer={true}
                                                onClick={handleContactSeller}
                                                className="action-btn-primary"
                                            >
                                                <Phone size={18} />
                                                Liên hệ người bán
                                            </AnimatedButton>
                                        )}
                                        {isSeller && (
                                            <AnimatedButton
                                                variant="primary"
                                                shimmer={true}
                                                onClick={handleContactSeller}
                                                className="action-btn-primary"
                                            >
                                                <Phone size={18} />
                                                Liên hệ người mua
                                            </AnimatedButton>
                                        )}
                                        <div className="status-note status-note-animated">
                                            <Clock className="note-icon" />
                                            <span>Đơn hàng đang được chuẩn bị</span>
                                        </div>
                                    </div>
                                )}

                                {order.status === 'shipping' && (
                                    <div className="action-buttons">
                                        {!isSeller && (
                                            <AnimatedButton
                                                variant="primary"
                                                shimmer={true}
                                                onClick={handleContactSeller}
                                                className="action-btn-primary"
                                            >
                                                <Phone size={18} />
                                                Liên hệ người bán
                                            </AnimatedButton>
                                        )}
                                        {isSeller && (
                                            <AnimatedButton
                                                variant="primary"
                                                shimmer={true}
                                                onClick={handleContactSeller}
                                                className="action-btn-primary"
                                            >
                                                <Phone size={18} />
                                                Liên hệ người mua
                                            </AnimatedButton>
                                        )}
                                        <div className="status-note status-note-animated status-note-shipping">
                                            <Truck className="note-icon" />
                                            <span>Đơn hàng đang trên đường</span>
                                        </div>
                                    </div>
                                )}

                                {isDeliveredStatus && (
                                    <div className="action-buttons">
                                        <div className="status-note success status-note-animated status-note-success">
                                            <CheckCircle className="note-icon" />
                                            <span>
                                                {isOrderCompleted
                                                    ? 'Đơn hàng đã được xác nhận và hoàn tất'
                                                    : 'Đơn hàng đã được giao thành công'}
                                            </span>
                                        </div>
                                        {!isSeller && (
                                            <div className="delivered-action-buttons">
                                                {/* Chỉ hiển thị nút xác nhận khi đơn hàng ở trạng thái delivered và chưa completed */}
                                                {canConfirmOrder && (
                                                    <AnimatedButton
                                                        variant="primary"
                                                        shimmer={true}
                                                        onClick={handleConfirmOrder}
                                                        size="sm"
                                                        disabled={confirming}
                                                    >
                                                        {confirming ? 'Đang xác nhận...' : 'Xác nhận đơn hàng'}
                                                    </AnimatedButton>
                                                )}
                                                {isDisputeFormVisible ? (
                                                    <DisputeForm
                                                        initialOrderId={order.realId || order.id || orderId}
                                                        onCancelDispute={handleDisputeFormClose}
                                                        onDisputeSubmitted={() => handleDisputeFormClose(true)}
                                                    />
                                                ) : (
                                                    // Nếu Form KHÔNG mở, hiển thị các nút hành động
                                                    // CHỈ hiển thị khi đơn hàng đã được xác nhận (COMPLETED)
                                                    isOrderCompleted && (
                                                        <>
                                                            {/* NÚT 1: Gửi khiếu nại (Chỉ hiển thị sau khi xác nhận đơn hàng) */}
                                                            <AnimatedButton
                                                                variant="warning"
                                                                onClick={handleRaiseDisputeClick}
                                                                size="sm"
                                                            >
                                                                <MessageSquareWarning size={16} />
                                                                Gửi khiếu nại
                                                            </AnimatedButton>

                                                            {/* NÚT 2: Xem khiếu nại đã gửi (Chỉ hiển thị khi đã có dispute) */}
                                                            {hasAnyDispute && (
                                                                <AnimatedButton
                                                                    variant="secondary" // Có thể dùng màu khác để phân biệt
                                                                    onClick={handleViewDisputeResult}
                                                                    size="sm"
                                                                >
                                                                    <MessageSquareWarning size={16} />
                                                                    Xem khiếu nại đã gửi
                                                                </AnimatedButton>
                                                            )}
                                                        </>
                                                    )
                                                )}
                                                {/* NÚT ĐÁNH GIÁ: Chỉ hiển thị sau khi xác nhận đơn hàng */}
                                                {isOrderCompleted && (
                                                    hasReview ? (
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
                                                    )
                                                )}
                                            </div>
                                        )}
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

                            {/* Hóa đơn điện tử - đặt sau phần hỗ trợ - CHỈ hiển thị cho buyer */}
                            {!isSeller && (() => {
                                // Show invoice section if:
                                // 1. We have invoice data (successfully loaded)
                                // 2. We're currently loading invoice
                                // 3. Order has invoice flags/URLs indicating invoice should exist
                                // 4. We've attempted to load and got an error (to show retry option)
                                const hasInvoiceData = Boolean(invoiceData);
                                const isInvoiceLoading = invoiceLoading;

                                // Check for invoice flags/URLs in order data
                                const hasInvoiceApi = Boolean(
                                    order?._raw?.invoiceApi ||
                                    order?.invoiceApi ||
                                    false
                                );
                                const hasInvoiceFlag = Boolean(
                                    order?.needInvoice ||
                                    order?._raw?.needInvoice ||
                                    order?._raw?.need_order_invoice ||
                                    false
                                );
                                const hasInvoiceIndicators = hasInvoiceApi || hasInvoiceFlag;

                                // Show if we have data, are loading, have indicators, or have attempted (even if failed)
                                const shouldShowInvoice = hasInvoiceData || isInvoiceLoading || hasInvoiceIndicators || (hasInvoiceAttempted && invoiceError);

                                console.log('[OrderTracking] Rendering invoice section check:', {
                                    orderId: order?.id || orderId,
                                    hasInvoiceData,
                                    isInvoiceLoading,
                                    hasInvoiceIndicators,
                                    hasInvoiceAttempted,
                                    invoiceError: invoiceError || 'none',
                                    invoiceApi: order?._raw?.invoiceApi || order?.invoiceApi,
                                    needInvoice: order?.needInvoice,
                                    _raw_needInvoice: order?._raw?.needInvoice,
                                    _raw_need_order_invoice: order?._raw?.need_order_invoice,
                                    willRender: shouldShowInvoice
                                });
                                return shouldShowInvoice;
                            })() && (
                                    <div className="info-card invoice-card">
                                        <div className="card-head">
                                            <h4>
                                                <FileText size={16} className="card-icon" />
                                                Hóa đơn điện tử
                                            </h4>
                                        </div>
                                        {invoiceLoading ? (
                                            <div className="invoice-loading-state">
                                                <div className="spinner-small" style={{ display: 'inline-block', marginRight: '8px', width: '16px', height: '16px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                                                <span>Đang tải hóa đơn...</span>
                                            </div>
                                        ) : invoiceData?.pdfUrl ? (
                                            <div className="invoice-ready-state">
                                                <div className="invoice-info">
                                                    <div className="invoice-info-line">
                                                        <span className="invoice-label">Mã hóa đơn:</span>
                                                        <strong className="invoice-value">{invoiceData.invoiceNumber || invoiceData.invoiceId || '--'}</strong>
                                                    </div>
                                                </div>
                                                <div className="invoice-actions-group">
                                                    <a
                                                        href={invoiceData.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                        className="btn btn-primary invoice-download-link"
                                                        title="Tải hóa đơn PDF"
                                                    >
                                                        <Download size={18} />
                                                        <span>Tải hóa đơn</span>
                                                    </a>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary invoice-refresh-btn"
                                                        onClick={() => {
                                                            const realId = order?.realId || order?.id || orderId;
                                                            if (realId) loadInvoice(realId);
                                                        }}
                                                        title="Tải lại hóa đơn"
                                                    >
                                                        <RefreshCw size={16} />
                                                        <span>Tải lại</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="invoice-pending-state">
                                                <div className={`invoice-message ${invoiceError ? 'invoice-error' : 'invoice-info'}`}>
                                                    {invoiceError ? (
                                                        <>
                                                            <AlertCircle size={18} />
                                                            <span>{invoiceError}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock size={18} />
                                                            <span>Hóa đơn đang được xử lý. Vui lòng thử lại sau ít phút.</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="invoice-actions-group">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary invoice-retry-btn"
                                                        onClick={() => {
                                                            const realId = order?.realId || order?.id || orderId;
                                                            if (realId) loadInvoice(realId);
                                                        }}
                                                        disabled={!orderId}
                                                        title="Thử tải lại hóa đơn"
                                                    >
                                                        <RefreshCw size={16} />
                                                        <span>Thử lại</span>
                                                    </button>
                                                </div>
                                                {invoiceData?.invoiceNumber && (
                                                    <div className="invoice-hint">
                                                        Mã hóa đơn: <strong>{invoiceData.invoiceNumber}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Chỉ hiển thị modals cho buyer, không hiển thị cho seller */}
            {!isSeller && (
                <>
                    <DisputeModal // Dùng lại DisputeModal , nếu đổi là CustomModel thì rõ ràng hơn, tại...
                        isOpen={isCancelModalVisible}
                        onClose={handleCancelFormClose}
                    >
                        <CancelOrderRequest
                            orderId={order.realId || order.id || orderId}
                            onCancelSuccess={handleCancelFormClose} // Form gọi hàm này khi hủy thành công
                            onBack={handleCancelFormClose} // Form gọi hàm này khi bấm nút Back/Hủy trong Form
                        />
                    </DisputeModal>
                    <DisputeModal
                        isOpen={isDisputeFormVisible}
                        onClose={handleDisputeFormClose}
                    >
                        <DisputeForm
                            initialOrderId={order.realId || order.id || orderId}
                            // Truyền hàm đóng modal khi gửi thành công HOẶC hủy
                            onCancelDispute={handleDisputeFormClose}
                        />
                    </DisputeModal>
                </>
            )}
        </>
    );
}

export default OrderTracking;
