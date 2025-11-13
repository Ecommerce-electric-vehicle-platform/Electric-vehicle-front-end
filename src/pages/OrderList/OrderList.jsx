import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Home,
    Package,
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
    Star,
    Eye,
    Phone,
    Calendar,
    ChevronDown,
    ChevronUp,
    CreditCard,
    MapPin,
    ShoppingBag,
    RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../test-mock-data/data/productsData';
import { getOrderHistory, hasOrderReview, getOrderStatus, getOrderDetails } from '../../api/orderApi';
// tui có thêm phần này
import DisputeForm from "../../components/BuyerRaiseDispute/DisputeForm";
import './OrderList.css';
import CancelOrderRequest from "../../components/CancelOrderModal/CancelOrderRequest";
import { fetchPostProductById } from "../../api/productApi";
import ViewDisputeResult from '../../components/ProfileUser/ViewDisputeResult';

function OrderList() {
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, shipping, delivered, cancelled
    const [query, setQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [pageInputValue, setPageInputValue] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [reviewedMap, setReviewedMap] = useState({}); // orderId -> true/false

    // thêm dòng này nữa
    const [selectedDisputeOrderId, setSelectedDisputeOrderId] = useState(null);
    const [selectedCancelOrderId, setSelectedCancelOrderId] = useState(null);
    const [viewingDisputeResultId, setViewingDisputeResultId] = useState(null);
    // Kiểm tra đăng nhập (đúng key token thực tế)
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const legacyToken = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const hasToken = Boolean(accessToken || legacyToken || refreshToken);
        setIsGuest(!hasToken);

        if (!hasToken) {
            navigate('/signin');
            return;
        }
    }, [navigate]);

    // Function để load order history (có thể gọi lại khi cần refresh)
    const loadOrders = useCallback(async (forceRefresh = false) => {
        let isMounted = true;

        if (forceRefresh) {
            setLoading(true);
        }

        try {
            console.log('[OrderList] Loading order history...', { forceRefresh });
            const pageSize = 20;
            const maxPagesToFetch = 20;
            let aggregatedMeta = null;
            let combinedList = [];

            for (let page = 1; page <= maxPagesToFetch; page++) {
                const { items, meta } = await getOrderHistory({ page, size: pageSize });
                const sanitized = Array.isArray(items) ? items.filter(Boolean) : [];

                console.log(`[OrderList] Fetch page ${page} - items: ${sanitized.length}`, { meta });

                if (!aggregatedMeta) {
                    aggregatedMeta = meta || null;
                } else if (meta) {
                    aggregatedMeta = { ...aggregatedMeta, ...meta };
                }

                combinedList = combinedList.concat(sanitized);

                const totalPages =
                    Number(meta?.totalPages ?? meta?.totalPage ?? meta?.pages ?? meta?.pageCount ?? aggregatedMeta?.totalPages ?? aggregatedMeta?.totalPage ?? 0) || null;
                const totalItems =
                    Number(meta?.totalElements ?? meta?.totalItems ?? meta?.total ?? meta?.count ?? aggregatedMeta?.totalElements ?? aggregatedMeta?.total ?? 0) || null;

                const reachedLastPage = totalPages ? page >= totalPages : false;
                const collectedAllItems = totalItems ? combinedList.length >= totalItems : false;
                const isShortPage = sanitized.length < pageSize;

                if (reachedLastPage || collectedAllItems || isShortPage) {
                    console.log('[OrderList] Stop fetching more pages', {
                        page,
                        reachedLastPage,
                        collectedAllItems,
                        isShortPage,
                        totalPages,
                        totalItems,
                        combinedCount: combinedList.length
                    });
                    break;
                }
            }

            console.log('[OrderList] Combined order count:', combinedList.length, { aggregatedMeta });

            let list = combinedList;

            // Log để debug giá từ backend
            if (list.length > 0) {
                console.log('[OrderList] Orders from backend:', list.map(o => ({
                    id: o.id,
                    orderCode: o.orderCode,
                    price: o.price,
                    shippingFee: o.shippingFee,
                    finalPrice: o.finalPrice,
                    _raw: o._raw
                })));
            }

            // Không merge dữ liệu localStorage. Chỉ hiển thị đơn từ backend để đảm bảo tính chính xác.

            const reversed = list.reverse();
            if (isMounted) setOrders(reversed);

            // Cập nhật trạng thái đơn hàng từ API order detail và shipping status
            if (isMounted && reversed.length > 0) {
                console.log('[OrderList] Updating order statuses from API...');
                const statusUpdateTasks = reversed.map(async (order) => {
                    try {
                        // Lấy orderId thực từ backend (ưu tiên _raw.id, fallback id)
                        const realOrderId = order._raw?.id ?? order.id;
                        // Bỏ qua nếu không có id hợp lệ hoặc là đơn local-only (id không phải số nguyên dương)
                        const isNumericId = /^\d+$/.test(String(realOrderId));
                        if (!realOrderId || !isNumericId) {
                            console.warn('[OrderList] No real orderId found for order:', order);
                            return null;
                        }

                        // Ưu tiên 1: Gọi API order detail để lấy thông tin mới nhất
                        try {
                            const orderDetailRes = await getOrderDetails(realOrderId);
                            if (orderDetailRes.success && orderDetailRes.data) {
                                const orderDetailData = orderDetailRes.data;
                                // Log để debug
                                console.log(`[OrderList] Order ${order.id} (realId: ${realOrderId}) status check:`, {
                                    currentStatus: order.status,
                                    newStatus: orderDetailData.status,
                                    rawStatus: orderDetailData.rawStatus,
                                    willUpdate: orderDetailData.status !== order.status
                                });
                                // Chỉ update nếu status thay đổi
                                if (orderDetailData.status !== order.status) {
                                    return {
                                        orderId: String(order.id),
                                        realOrderId: realOrderId,
                                        newStatus: orderDetailData.status,
                                        rawStatus: orderDetailData.rawStatus,
                                        canceledAt: orderDetailData.canceledAt,
                                        cancelReason: orderDetailData.cancelReason,
                                        updatedAt: orderDetailData.updatedAt,
                                        source: 'orderDetail'
                                    };
                                }
                            } else if (orderDetailRes && orderDetailRes.success === false && orderDetailRes.error === 'NOT_FOUND') {
                                // Nếu BE trả 404 → coi là đơn không hợp lệ và loại khỏi UI
                                if (order._fromLocalStorage === true) {
                                    try {
                                        const currentUsername = localStorage.getItem('username') || '';
                                        const storageKey = currentUsername ? `orders_${currentUsername}` : 'orders_guest';
                                        const rawLocalOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
                                        if (Array.isArray(rawLocalOrders) && rawLocalOrders.length > 0) {
                                            const filteredLocal = rawLocalOrders.filter(lo => {
                                                const localId = String(lo?.id ?? lo?.orderCode ?? lo?.order_code ?? '');
                                                return localId !== String(order.id);
                                            });
                                            if (filteredLocal.length !== rawLocalOrders.length) {
                                                console.log('[OrderList] Removing stale localStorage order (backend 404):', {
                                                    orderId: order.id,
                                                    orderCode: order.orderCode
                                                });
                                                localStorage.setItem(storageKey, JSON.stringify(filteredLocal));
                                            }
                                        }
                                    } catch (cleanupError) {
                                        console.warn('[OrderList] Failed to cleanup localStorage for stale order:', cleanupError);
                                    }
                                }
                                console.warn('[OrderList] Removing order not found on backend:', {
                                    orderId: order.id,
                                    realOrderId: realOrderId,
                                    orderCode: order.orderCode
                                });
                                return {
                                    orderId: String(order.id),
                                    remove: true,
                                    source: 'orderDetail_not_found'
                                };
                            }
                            // Nếu getOrderDetails trả về lỗi (404, 500, etc.), bỏ qua im lặng
                            // Vì đơn hàng có thể không tồn tại hoặc đã bị xóa
                        } catch (orderDetailError) {
                            // Chỉ log warning cho các lỗi không phải 404/500 (network errors, etc.)
                            if (orderDetailError?.response?.status !== 404 && orderDetailError?.response?.status !== 500) {
                                console.warn(`[OrderList] Failed to get order detail for ${order.id}:`, orderDetailError);
                            }
                        }

                        // Fallback: chỉ gọi API shipping status nếu order đang ở trạng thái có thể thay đổi bởi đơn vị vận chuyển
                        // Giảm lỗi 500 từ BE shipping khi order đã ở trạng thái terminal
                        try {
                            // Chỉ gọi shipping status nếu:
                            // 1. Order đang ở trạng thái shipping hoặc confirmed
                            // 2. Order chưa bị hủy (không có canceledAt)
                            // 3. Order chưa delivered
                            const isTerminalStatus = order.status === 'delivered' || order.status === 'cancelled' || order.status === 'canceled';
                            const hasCanceledAt = (order.canceledAt || order._raw?.canceledAt) != null;
                            const shouldQueryShipping = (order.status === 'shipping' || order.status === 'confirmed')
                                && !isTerminalStatus
                                && !hasCanceledAt;

                            if (shouldQueryShipping) {
                                const statusResponse = await getOrderStatus(realOrderId);
                                if (statusResponse.success && statusResponse.status && statusResponse.status !== order.status) {
                                    return {
                                        orderId: String(order.id),
                                        realOrderId: realOrderId,
                                        newStatus: statusResponse.status,
                                        rawStatus: statusResponse.rawStatus,
                                        message: statusResponse.message,
                                        source: 'orderStatus'
                                    };
                                }
                            }
                        } catch (statusError) {
                            // Xử lý lỗi 500 một cách silent - chỉ log khi không phải lỗi 500
                            // Vì backend shipping service có thể chưa có đơn hàng này
                            if (statusError?.response?.status !== 500) {
                                console.warn(`[OrderList] Failed to get shipping status for order ${order.id}:`, statusError);
                            }
                            // Lỗi 500 từ shipping service là bình thường, không cần log
                        }

                        return null;
                    } catch (error) {
                        // Nếu lỗi 404 hoặc lỗi khác, bỏ qua và giữ nguyên trạng thái hiện tại
                        console.warn(`[OrderList] Failed to get status for order ${order.id}:`, error);
                        return null;
                    }
                });

                const statusUpdates = await Promise.allSettled(statusUpdateTasks);
                const validUpdates = statusUpdates
                    .filter(p => p.status === 'fulfilled' && p.value !== null)
                    .map(p => p.value);

                if (validUpdates.length > 0 && isMounted) {
                    console.log('[OrderList] Status updates:', validUpdates);
                    // Cập nhật trạng thái cho các orders có thay đổi
                    setOrders(prevOrders => {
                        console.log('[OrderList] setOrders callback - prevOrders:', prevOrders.map(o => ({ id: o.id, status: o.status })));
                        // 1) Loại bỏ các đơn localStorage không tồn tại trên BE (NOT_FOUND)
                        const toRemoveIds = new Set(
                            validUpdates
                                .filter(u => u && u.remove === true)
                                .map(u => String(u.orderId))
                        );
                        const filtered = prevOrders.filter(o => !toRemoveIds.has(String(o.id)));
                        // 2) Cập nhật trạng thái cho các đơn còn lại
                        const updated = filtered.map(order => {
                            const update = validUpdates.find(u => String(u.orderId) === String(order.id));
                            if (update) {
                                console.log(`[OrderList] Found update for order ${order.id}:`, {
                                    currentStatus: order.status,
                                    newStatus: update.newStatus,
                                    willUpdate: update.newStatus !== order.status,
                                    orderIdMatch: String(update.orderId) === String(order.id)
                                });
                                // Không cho phép "lùi trạng thái" (ví dụ: confirmed -> pending)
                                const rank = { pending: 1, confirmed: 2, shipping: 3, delivered: 4, canceled: 5, cancelled: 5 };
                                const currentRank = rank[String(order.status)] || 0;
                                const newRank = rank[String(update.newStatus)] || 0;
                                const isBackward = newRank > 0 && currentRank > 0 && newRank < currentRank;
                                if (isBackward) {
                                    console.warn(`[OrderList] Skipping backward transition ${order.status} -> ${update.newStatus} for order ${order.id}`);
                                    return order;
                                }
                                if (update.newStatus !== order.status) {
                                    console.log(`[OrderList] ✅ Updating order ${order.id} status: ${order.status} -> ${update.newStatus} (from ${update.source})`);
                                    return {
                                        ...order,
                                        status: update.newStatus,
                                        canceledAt: update.canceledAt || order.canceledAt,
                                        cancelReason: update.cancelReason || order.cancelReason,
                                        updatedAt: update.updatedAt || order.updatedAt,
                                        _raw: {
                                            ...order._raw,
                                            status: update.rawStatus,
                                            canceledAt: update.canceledAt || order._raw?.canceledAt,
                                            cancelReason: update.cancelReason || order._raw?.cancelReason,
                                            updatedAt: update.updatedAt || order._raw?.updatedAt
                                        }
                                    };
                                } else {
                                    console.log(`[OrderList] ⚠️ Skipping update for order ${order.id} - status unchanged (${order.status})`);
                                }
                            }
                            return order;
                        });
                        console.log('[OrderList] setOrders callback - updated orders:', updated.map(o => ({ id: o.id, status: o.status })));
                        return updated;
                    });
                } else {
                    if (validUpdates.length === 0) {
                        console.log('[OrderList] ⚠️ No valid updates to apply');
                    }
                    if (!isMounted) {
                        console.log('[OrderList] ⚠️ Component unmounted, skipping update');
                    }
                }
            }

            // tải trạng thái đánh giá cho các đơn đã giao (check theo id thực từ BE)
            const delivered = reversed.filter(o => o.status === 'delivered');
            const tasks = delivered.map(async (o) => {
                const realId = o._raw?.id ?? o.id; // ưu tiên id thực từ BE
                const ok = await hasOrderReview(realId);
                return [String(o.id), realId, ok]; // [normalizedId, realId, hasReview]
            });
            const pairs = await Promise.allSettled(tasks);
            if (isMounted) {
                const map = {};
                pairs.forEach((p) => {
                    if (p.status === 'fulfilled' && Array.isArray(p.value)) {
                        const [normalizedId, realId, hasReview] = p.value;
                        map[normalizedId] = { hasReview: Boolean(hasReview), realId };
                    }
                });
                setReviewedMap(map);
            }
        } catch (err) {
            console.error('[OrderList] Không tải được lịch sử đơn hàng:', err);
            if (isMounted) setOrders([]);
        } finally {
            if (isMounted) setLoading(false);
        }
    },
        [] // useCallback dependencies
    );

    // Load orders khi component mount
    useEffect(() => {
        loadOrders(true);
    }, [loadOrders]);

    // Sau khi orders tải về, bổ sung ảnh còn thiếu bằng cách gọi API sản phẩm theo postId/productId
    useEffect(() => {
        const enhanceImages = async () => {
            if (!Array.isArray(orders) || orders.length === 0) return;

            const tasks = orders.map(async (o) => {
                const hasImage = Boolean(o?.product?.image);
                const raw = o?._raw || {};
                const productId = raw.postId || raw.productId || raw.product?.id;
                if (hasImage || !productId) return null;
                try {
                    const prod = await fetchPostProductById(productId);
                    if (prod && prod.image) {
                        return { id: o.id, image: prod.image, title: prod.title, price: prod.price };
                    }
                } catch (e) {
                    console.warn('[OrderList] fetchPostProductById failed for order', o.id, e);
                }
                return null;
            });

            const results = await Promise.allSettled(tasks);
            const updates = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
            if (updates.length > 0) {
                setOrders(prev => prev.map(o => {
                    const u = updates.find(x => String(x.id) === String(o.id));
                    if (!u) return o;
                    return {
                        ...o,
                        product: {
                            ...(o.product || {}),
                            image: u.image || o.product?.image,
                            title: o.product?.title || u.title,
                            price: o.product?.price || u.price
                        }
                    };
                }));
            }
        };

        enhanceImages();
    }, [orders]);

    // Refresh khi navigate từ place order (có state refresh)
    useEffect(() => {
        if (location.state?.refreshOrders || location.state?.orderPlaced) {
            console.log('[OrderList] Refreshing orders due to navigation state');
            // Đợi một chút để backend lưu xong
            setTimeout(() => {
                loadOrders(true);
            }, 1000);
        }
    }, [location.state, loadOrders]);

    // Refresh khi window focus (user quay lại tab)
    useEffect(() => {
        const handleFocus = () => {
            console.log('[OrderList] Window focused, refreshing orders...');
            loadOrders(true);
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [loadOrders]);

    // Auto-refresh order statuses định kỳ (mỗi 30 giây) sử dụng order detail API
    useEffect(() => {
        if (orders.length === 0) return;

        const refreshStatuses = async () => {
            console.log('[OrderList] Auto-refreshing order statuses from order detail API...');
            const statusUpdateTasks = orders.map(async (order) => {
                try {
                    const realOrderId = order._raw?.id ?? order.id;
                    const isNumericId = /^\d+$/.test(String(realOrderId));
                    if (!realOrderId || !isNumericId) return null;

                    // Ưu tiên gọi order detail API để lấy thông tin mới nhất
                    try {
                        const orderDetailRes = await getOrderDetails(realOrderId);
                        if (orderDetailRes.success && orderDetailRes.data) {
                            const orderDetailData = orderDetailRes.data;
                            // Log để debug
                            console.log(`[OrderList] Auto-refresh - Order ${order.id} (realId: ${realOrderId}) status check:`, {
                                currentStatus: order.status,
                                newStatus: orderDetailData.status,
                                rawStatus: orderDetailData.rawStatus,
                                statusChanged: orderDetailData.status !== order.status,
                                cancelStatusChanged: Boolean(orderDetailData.canceledAt) !== Boolean(order.canceledAt)
                            });
                            // Chỉ update nếu status hoặc cancel status thay đổi
                            if (orderDetailData.status !== order.status ||
                                Boolean(orderDetailData.canceledAt) !== Boolean(order.canceledAt)) {
                                return {
                                    orderId: String(order.id),
                                    realOrderId: realOrderId,
                                    newStatus: orderDetailData.status,
                                    rawStatus: orderDetailData.rawStatus,
                                    canceledAt: orderDetailData.canceledAt,
                                    cancelReason: orderDetailData.cancelReason,
                                    updatedAt: orderDetailData.updatedAt,
                                    source: 'orderDetail'
                                };
                            }
                        }
                        // Nếu getOrderDetails trả về lỗi (404, 500, etc.), bỏ qua im lặng
                        // Vì đơn hàng có thể không tồn tại hoặc đã bị xóa
                    } catch (orderDetailError) {
                        // Chỉ log warning cho các lỗi không phải 404/500 (network errors, etc.)
                        if (orderDetailError?.response?.status !== 404 && orderDetailError?.response?.status !== 500) {
                            console.warn(`[OrderList] Failed to refresh order detail for ${order.id}:`, orderDetailError);
                        }
                    }

                    // Fallback: chỉ gọi shipping status nếu order đang ở trạng thái có thể thay đổi
                    try {
                        // Chỉ gọi shipping status nếu:
                        // 1. Order đang ở trạng thái shipping hoặc confirmed
                        // 2. Order chưa bị hủy (không có canceledAt)
                        // 3. Order chưa delivered
                        const isTerminalStatus = order.status === 'delivered' || order.status === 'cancelled' || order.status === 'canceled';
                        const hasCanceledAt = (order.canceledAt || order._raw?.canceledAt) != null;
                        const shouldQueryShipping = (order.status === 'shipping' || order.status === 'confirmed')
                            && !isTerminalStatus
                            && !hasCanceledAt;

                        if (shouldQueryShipping) {
                            const statusResponse = await getOrderStatus(realOrderId);
                            if (statusResponse.success && statusResponse.status && statusResponse.status !== order.status) {
                                return {
                                    orderId: String(order.id),
                                    newStatus: statusResponse.status,
                                    rawStatus: statusResponse.rawStatus,
                                    source: 'orderStatus'
                                };
                            }
                        }
                    } catch (statusError) {
                        // Xử lý lỗi 500 một cách silent - chỉ log khi không phải lỗi 500
                        // Vì backend shipping service có thể chưa có đơn hàng này
                        if (statusError?.response?.status !== 500) {
                            console.warn(`[OrderList] Failed to refresh shipping status for order ${order.id}:`, statusError);
                        }
                        // Lỗi 500 từ shipping service là bình thường, không cần log
                    }

                    return null;
                } catch {
                    return null;
                }
            });

            const statusUpdates = await Promise.allSettled(statusUpdateTasks);
            const validUpdates = statusUpdates
                .filter(p => p.status === 'fulfilled' && p.value !== null)
                .map(p => p.value);

            if (validUpdates.length > 0) {
                console.log('[OrderList] Auto-refresh - Status updates:', validUpdates);
                setOrders(prevOrders => {
                    console.log('[OrderList] Auto-refresh - setOrders callback - prevOrders:', prevOrders.map(o => ({ id: o.id, status: o.status })));
                    const updated = prevOrders.map(order => {
                        const update = validUpdates.find(u => String(u.orderId) === String(order.id));
                        if (update) {
                            const isCanceled = order.status === 'canceled';
                            const isTryingToRevertCancel = update.newStatus === 'pending';

                            console.log(`[OrderList] Auto-refresh - Found update for order ${order.id}:`, {
                                currentStatus: order.status,
                                newStatus: update.newStatus,
                                isCanceled: isCanceled,
                                isTryingToRevertCancel: isTryingToRevertCancel,
                                willUpdate: !isCanceled && !isTryingToRevertCancel && update.newStatus !== order.status
                            });

                            if (!isCanceled && !isTryingToRevertCancel && update.newStatus !== order.status) {
                                console.log(`[OrderList] ✅ Auto-refresh - Updating order ${order.id} status: ${order.status} -> ${update.newStatus} (from ${update.source})`);
                                return {
                                    ...order,
                                    status: update.newStatus,
                                    canceledAt: update.canceledAt || order.canceledAt,
                                    cancelReason: update.cancelReason || order.cancelReason,
                                    updatedAt: update.updatedAt || order.updatedAt,
                                    _raw: {
                                        ...order._raw,
                                        status: update.rawStatus,
                                        canceledAt: update.canceledAt || order._raw?.canceledAt,
                                        cancelReason: update.cancelReason || order._raw?.cancelReason,
                                        updatedAt: update.updatedAt || order._raw?.updatedAt,
                                    },
                                };
                            } else {
                                console.log(`[OrderList] ⚠️ Auto-refresh - Skipping update for order ${order.id}:`, {
                                    reason: isCanceled ? 'order is canceled' : isTryingToRevertCancel ? 'trying to revert cancel' : 'status unchanged',
                                    currentStatus: order.status,
                                    newStatus: update.newStatus
                                });
                            }
                        }

                        return order;
                    });
                    console.log('[OrderList] Auto-refresh - setOrders callback - updated orders:', updated.map(o => ({ id: o.id, status: o.status })));
                    return updated;
                });
            } else {
                console.log('[OrderList] Auto-refresh - ⚠️ No valid updates to apply');
            }
        };

        // Refresh ngay khi component mount với orders
        refreshStatuses();

        // Set interval để refresh mỗi 15 giây (giảm từ 30s để cập nhật nhanh hơn)
        const intervalId = setInterval(refreshStatuses, 15000); // 15 seconds

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders.length]); // Chỉ chạy khi số lượng orders thay đổi

    // Helper function để kiểm tra đơn có bị hủy không (khớp với logic lọc)

    // OrderList.jsx

    // Helper function để kiểm tra đơn có bị hủy không (khớp với logic lọc)
    // OrderList.jsx (Trong component OrderList)
    const isOrderCancelled = (order) => {
        const feStatus = (order.status || '').toLowerCase();
        const rawStatus = (order._raw?.status || '').toUpperCase();
        return (
            feStatus === 'canceled' ||
            rawStatus === 'CANCELED' ||
            rawStatus === 'CANCELLED' ||
            rawStatus === 'FAILED'
        );
    };

    // Cho phép hủy khi đơn ở pending hoặc confirmed và CHƯA giao cho DVVC
    const canCancelOrder = (order) => {
        if (!order) return false;
        if (isOrderCancelled(order)) return false;
        const fe = String(order.status || '').toLowerCase();
        const raw = String(order._raw?.status || '').toUpperCase();
        const isPending = fe === 'pending' || raw === 'PENDING' || raw === 'PENDING_PAYMENT';
        const isConfirmed = fe === 'confirmed' || ['PAID', 'PROCESSING', 'CONFIRMED', 'VERIFIED'].includes(raw);
        const isShipping = fe === 'shipping' || fe === 'delivered' || ['SHIPPED', 'DELIVERING', 'DELIVERED', 'COMPLETED'].includes(raw);
        const hasCanceledAt = (order.canceledAt || order._raw?.canceledAt) != null;
        const handedOver = Boolean(order._raw?.handoverAt || order._raw?.shippingId);
        return (isPending || isConfirmed) && !isShipping && !hasCanceledAt && !handedOver;
    };

    // Lọc theo trạng thái + tìm kiếm
    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => {
                if (filter === 'all') return true;
                if (filter === 'cancelled' || filter === 'canceled') {
                    // Logic: Đơn bị hủy nếu có canceledAt hoặc status là cancelled/canceled
                    return isOrderCancelled(order);
                }
                return order.status === filter;
            })
            .filter(order => {
                if (!query.trim()) return true;
                const q = query.trim().toLowerCase();
                const idStr = String(order.id || '').toLowerCase();
                const title = String(order.product?.title || '').toLowerCase();
                const code = String(order.orderCode || order._raw?.orderCode || '').toLowerCase();
                return idStr.includes(q) || title.includes(q) || code.includes(q);
            });
    }, [orders, filter, query]);

    const totalPages = filteredOrders.length === 0 ? 0 : Math.ceil(filteredOrders.length / pageSize);

    useEffect(() => {
        if (totalPages === 0) {
            if (currentPage !== 1) {
                setCurrentPage(1);
            }
            return;
        }
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        } else if (currentPage < 1) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
        setPageInputValue('');
    }, [filter, query, pageSize]);

    const paginatedOrders = useMemo(() => {
        if (filteredOrders.length === 0) return [];
        const clampedPage = Math.min(Math.max(currentPage, 1), totalPages || 1);
        const start = (clampedPage - 1) * pageSize;
        return filteredOrders.slice(start, start + pageSize);
    }, [filteredOrders, currentPage, pageSize, totalPages]);

    const getVisiblePages = useCallback(() => {
        if (totalPages <= 1) return [];

        const pages = [];
        const maxVisible = 7;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('ellipsis');
            pages.push(totalPages);
            return pages;
        }

        if (currentPage >= totalPages - 3) {
            pages.push(1);
            pages.push('ellipsis');
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
        return pages;
    }, [totalPages, currentPage]);

    const visiblePages = useMemo(() => getVisiblePages(), [getVisiblePages]);

    const handlePageChange = (page) => {
        if (totalPages === 0) {
            setCurrentPage(1);
            return;
        }
        const validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
        setPageInputValue('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNextPage = () => handlePageChange(currentPage + 1);
    const handlePrevPage = () => handlePageChange(currentPage - 1);
    const handleFirstPage = () => handlePageChange(1);
    const handleLastPage = () => handlePageChange(totalPages);

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        if (value === '') {
            setPageInputValue('');
            return;
        }
        if (/^\d+$/.test(value)) {
            setPageInputValue(value);
        }
    };

    const handlePageInputSubmit = (e) => {
        e.preventDefault();
        if (!pageInputValue) return;
        const pageNumber = Number(pageInputValue);
        if (!Number.isNaN(pageNumber) && pageNumber >= 1 && (totalPages === 0 || pageNumber <= totalPages)) {
            handlePageChange(pageNumber);
        }
    };

    const handlePageSizeChange = (e) => {
        const nextSize = Number(e.target.value) || 10;
        setPageSize(nextSize);
    };

    const pageSizeOptions = [5, 10];

    // Tính số lượng đơn bị hủy


    // Stats
    const totalOrders = orders.length;
    const totalDelivered = orders.filter(o => o.status === 'delivered').length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.finalPrice || 0), 0);

    // Xử lý về trang chủ
    const handleGoHome = () => {
        navigate('/');
    };

    // Xử lý xem chi tiết đơn hàng
    const handleViewOrder = (orderId) => {
        navigate(`/order-tracking/${orderId}`);
    };

    // Hành động theo trạng thái
    // Mở form hủy đơn
    // QUAN TRỌNG: Cần truyền realOrderId từ backend, không phải normalized ID
    const handleCancelOrder = (orderId, order) => {
        // Lấy real ID từ backend (ưu tiên _raw.id, fallback id)
        const realOrderId = order?._raw?.id ?? orderId;
        console.log('[OrderList] handleCancelOrder:', {
            normalizedId: orderId,
            realOrderId: realOrderId,
            orderCode: order?.orderCode || order?._raw?.orderCode
        });
        setSelectedCancelOrderId(realOrderId);
    };

    // Khi user nhấn "Quay lại" trong form hủy đơn
    const handleCancelOrderBack = () => {
        setSelectedCancelOrderId(null);
    };

    // Khi user gửi hủy thành công
    // Trong OrderList.jsx

    // Sửa hàm để nhận thêm lý do hủy (reasonName)
    const handleCancelOrderSuccess = async (orderId, reasonName) => { // <-- CHÚ Ý CHỖ NÀY
        // 1. Cập nhật ngay trạng thái local để UI phản ứng tức thì
        setOrders(prev =>
            prev.map(o =>
                String(o.id) === String(orderId)
                    ? {
                        ...o,
                        status: 'canceled', // status chuẩn FE để khớp với filter
                        canceledAt: new Date().toISOString(), // Set tạm để đảm bảo đồng bộ
                        cancelReason: reasonName // Cập nhật lý do để hiển thị và xác nhận hủy
                    }
                    : o
            )
        );

        // 2. Tự động chuyển sang tab “Đã hủy”
        setFilter('canceled');
        setSelectedCancelOrderId(null);

        // 3. Chờ 500ms rồi tải lại toàn bộ danh sách từ server (loadOrders)
        setTimeout(() => {
            loadOrders(true);
        }, 500);
    };


    const handleTrackShipment = (orderId) => {
        navigate(`/order-tracking/${orderId}`);
    };
    // ******


    const handleDisputeSuccess = (submittedOrderId) => {
        // 1. Thoát khỏi DisputeForm và chuyển sang chế độ xem kết quả
        setSelectedDisputeOrderId(null);
        setViewingDisputeResultId(submittedOrderId);

        // 2. Tải lại Orders (tùy chọn)
        setTimeout(() => { loadOrders(true); }, 500);
    };

    const handleCancelDispute = () => {
        setSelectedDisputeOrderId(null);
        setViewingDisputeResultId(null);
    };

    const handleViewDisputeResult = (orderId) => {
        // Hàm này được gọi khi nhấp vào nút "Xem khiếu nại"
        setSelectedDisputeOrderId(null);
        setViewingDisputeResultId(orderId);
    }


    const handleRaiseDispute = (orderId, order) => {
        const realOrderId = order?._raw?.id ?? orderId;
        setSelectedDisputeOrderId(realOrderId); // Mở form Dispute
        setViewingDisputeResultId(null);  // thêm dòng này thay thế cho cái alert nha Vy
    };



    // // HÀM MỚI: Xử lý khi gửi khiếu nại thành công từ DisputeForm
    // const handleDisputeSuccess = (submittedOrderId) => {
    //     console.log(`[Dispute] Success for order ID: ${submittedOrderId}. Showing result...`);

    //     // 1. Thoát khỏi DisputeForm
    //     setSelectedDisputeOrderId(null);

    //     // 2. Chuyển sang chế độ xem kết quả khiếu nại (ViewDisputeResult)
    //     setViewingDisputeResultId(submittedOrderId); // Bật chế độ xem kết quả

    //     // 3. Tải lại danh sách đơn hàng sau một chút để BE kịp cập nhật
    //     setTimeout(() => {
    //         loadOrders(true);
    //     }, 500);
    // };

    // const handleCancelDispute = () => {
    //     setSelectedDisputeOrderId(null);
    //     // Khi nhấn Quay lại từ form Dispute, chuyển về list, tắt chế độ xem kết quả
    //     setViewingDisputeResultId(null);
    // };

    // const handleViewDisputeResult = (orderId) => {
    //     setSelectedDisputeOrderId(null); // Tắt form Dispute (nếu có)
    //     setViewingDisputeResultId(orderId); // Bật chế độ xem kết quả
    // }

    const handleRateOrder = (orderId, order) => {
        // Truyền kèm id thực từ BE nếu có để BE nhận diện đúng đơn hàng
        const realId = order?._raw?.id ?? orderId;
        navigate(`/order/review/${orderId}`, {
            state: {
                orderIdRaw: realId,
                orderCode: order?._raw?.orderCode || null,
                from: location.pathname // Sử dụng đường dẫn thực tế hiện tại
            }
        });
    };

    const handleViewReview = (orderId, order) => {
        // Điều hướng tới trang xem đánh giá với realId từ BE
        const realId = reviewedMap[orderId]?.realId ?? order?._raw?.id ?? orderId;
        navigate(`/order/review/${orderId}`, {
            state: {
                orderIdRaw: realId,
                orderCode: order?._raw?.orderCode || null,
                viewMode: true, // Đánh dấu là chế độ xem lại
                from: location.pathname // Sử dụng đường dẫn thực tế hiện tại
            }
        });
    };

    const handleReorder = (orderId) => {
        alert(`Đặt lại đơn #${orderId} (sẽ thiết kế sau)`);
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

    const extractImageFromOrder = (order) => {
        try {
            // 1) Prefer normalized image if provided
            if (order?.product?.image) return toAbsoluteUrl(order.product.image) || order.product.image;

            const raw = order?._raw || {};
            const rawProduct = raw.product || {};
            // 2) Direct fields
            const direct = raw.productImage || rawProduct.productImage || rawProduct.image || rawProduct.imageUrl || order.image || raw.image || raw.imageUrl;
            if (typeof direct === 'string' && direct.trim()) return toAbsoluteUrl(direct);
            // 3) Arrays
            const images = rawProduct.images || rawProduct.imageUrls || raw.images || [];
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

    const getActionsForStatus = (status, orderId) => {
        switch (status) {
            case 'pending':
                return [
                    { key: 'cancel', label: 'Hủy đơn', className: 'btn btn-danger btn-sm btn-animate', onClick: () => handleCancelOrder(orderId) }
                ];
            case 'confirmed':
                // Không cho phép hủy đơn ở trạng thái đã xác nhận
                return [];
            case 'shipping':
                return [
                    { key: 'track', label: 'Theo dõi vận đơn', className: 'btn btn-primary btn-sm btn-animate', onClick: () => handleTrackShipment(orderId) }
                ];
            case 'delivered': {
                const isReviewed = reviewedMap[orderId]?.hasReview === true;
                return [
                    { key: 'dispute', label: 'Khiếu nại', className: 'btn btn-warning btn-sm btn-animate', onClick: () => handleRaiseDispute(orderId) },
                    isReviewed
                        ? { key: 'view-review', label: 'Xem đánh giá', className: 'btn btn-secondary btn-sm btn-animate', onClick: () => handleViewReview(orderId, null) }
                        : { key: 'rate', label: 'Đánh giá', className: 'btn btn-success btn-sm btn-animate', onClick: () => handleRateOrder(orderId, null) }
                ];
            }
            case 'cancelled':
                return [
                    { key: 'reorder', label: 'Đặt lại', className: 'btn btn-secondary btn-sm btn-animate', onClick: () => handleReorder(orderId) }
                ];
            default:
                return [];
        }
    };


    if (viewingDisputeResultId !== null) {
        return (
            <div className="dispute-flow-wrapper">
                <button
                    className="btn-back-order-list"
                    onClick={() => setViewingDisputeResultId(null)} // Quay lại danh sách Order
                    style={{
                        marginBottom: "15px",
                        padding: "8px 15px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        background: "#f8f9fa"
                    }}
                >
                    <ArrowLeft size={16} style={{ marginRight: 5 }} /> Quay lại danh sách đơn hàng
                </button>
                <ViewDisputeResult
                    orderId={viewingDisputeResultId} // Truyền orderId để component gọi API chi tiết
                />
            </div>
        );
    }

    // === HIỂN THỊ FORM TẠO KHIẾU NẠI (DisputeForm) ===
    if (selectedDisputeOrderId !== null) {
        return (
            <div className="dispute-flow-wrapper">
                <button
                    className="btn-back-order-list"
                    onClick={handleCancelDispute}
                    style={{ marginBottom: '15px', padding: '8px 15px', border: '1px solid #ccc', borderRadius: '4px', background: '#f8f9fa' }}
                >
                    <ArrowLeft size={16} style={{ marginRight: 5 }} /> Quay lại danh sách đơn hàng
                </button>
                <DisputeForm
                    initialOrderId={selectedDisputeOrderId}
                    onCancelDispute={handleCancelDispute}
                    onDisputeSuccess={handleDisputeSuccess} // <<< QUAN TRỌNG: Gửi thành công sẽ chuyển sang View Result
                />
            </div>
        );
    }



    // Xử lý liên hệ người bán (không dùng ở layout mới)

    // Lấy icon và màu sắc cho trạng thái (label theo mockup)
    // cái này là của cancel order



    if (selectedCancelOrderId !== null) {
        return (
            <div className="cancel-order-flow-wrapper">
                <button
                    className="btn-back-order-list"
                    onClick={handleCancelOrderBack}
                    style={{
                        marginBottom: "15px",
                        padding: "8px 15px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        background: "#f8f9fa"
                    }}
                >
                    <ArrowLeft size={16} style={{ marginRight: 5 }} /> Quay lại danh sách đơn hàng
                </button>
                <CancelOrderRequest
                    orderId={selectedCancelOrderId}
                    onCancelSuccess={handleCancelOrderSuccess}
                    onBack={handleCancelOrderBack}
                />
            </div>
        );
    }


    if (selectedDisputeOrderId !== null) {
        return (
            <div className="dispute-flow-wrapper">
                <button
                    className="btn-back-order-list"
                    onClick={handleCancelDispute}
                    style={{ marginBottom: '15px', padding: '8px 15px', border: '1px solid #ccc', borderRadius: '4px', background: '#f8f9fa' }}
                >
                    <ArrowLeft size={16} style={{ marginRight: 5 }} /> Quay lại danh sách đơn hàng
                </button>
                <DisputeForm
                    initialOrderId={selectedDisputeOrderId}
                    onCancelDispute={handleCancelDispute} // Thêm prop để form có thể tự thoát
                />
            </div>
        );
    }

    // 2. Nếu đang ở chế độ xem Danh sách đơn hàng

    // OrderList.jsx (Trong component OrderList)
    const getStatusInfo = (status) => {
        const statusConfig = {
            pending: { icon: Clock, color: '#ffc107', label: 'Chờ xử lý' },
            confirmed: { icon: CheckCircle, color: '#0d6efd', label: 'Đã xác nhận' },
            shipping: { icon: Truck, color: '#0d6efd', label: 'Đang giao' },
            delivered: { icon: Package, color: '#28a745', label: 'Đã giao' },
            // Đã sửa thành 'canceled'

            canceled: { icon: AlertCircle, color: '#dc3545', label: 'Đã hủy' } // <-- SỬA TẠI ĐÂY

        };
        return statusConfig[status] || statusConfig.pending;
    };

    if (isGuest) {
        return null; // Sẽ redirect về login
    }

    if (loading) {
        return (
            <div className="order-list-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải danh sách đơn hàng...</p>
            </div>
        );
    }

    //debug
    //     console.table(
    //     orders.map(o => ({
    //         id: o.id,
    //         status: o.status,
    //         rawStatus: o._raw?.status,
    //         canceledAt: o.canceledAt,
    //     }))
    // );

    return (
        <div className="order-list-page">
            <div className="order-list-container">
                {/* Header */}
                <div className="order-list-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h1 className="page-title" style={{ margin: 0 }}>Lịch sử đơn hàng</h1>
                        <button
                            onClick={() => {
                                console.log('[OrderList] Manual refresh triggered');
                                loadOrders(true);
                            }}
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 8,
                                border: '1px solid #0d6efd',
                                background: loading ? '#e9ecef' : '#0d6efd',
                                color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 14,
                                fontWeight: 500
                            }}
                        >
                            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                            {loading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ marginBottom: 16 }}>
                        <input
                            type="text"
                            placeholder="Tìm kiếm đơn hàng theo mã hoặc sản phẩm..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: '2px solid #e9ecef',
                                outline: 'none',
                                fontSize: 14
                            }}
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Tất cả ({orders.length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Chờ xác nhận ({orders.filter(o => o.status === 'pending').length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
                            onClick={() => setFilter('confirmed')}
                        >
                            Đã xác nhận ({orders.filter(o => o.status === 'confirmed').length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'shipping' ? 'active' : ''}`}
                            onClick={() => setFilter('shipping')}
                        >
                            Đang giao ({orders.filter(o => o.status === 'shipping').length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'delivered' ? 'active' : ''}`}
                            onClick={() => setFilter('delivered')}
                        >
                            Đã giao ({orders.filter(o => o.status === 'delivered').length})
                        </button>

                        <button
                            className={`filter-tab ${filter === 'canceled' ? 'active' : ''}`}
                            onClick={() => setFilter('canceled')}
                        >
                            Đã hủy ({orders.filter(isOrderCancelled).length})
                        </button>



                    </div>
                </div>

                {/* Orders List */}
                <div className="orders-content">
                    {filteredOrders.length === 0 ? (
                        <div className="empty-orders">
                            <div className="empty-hero">
                                <div className="empty-hero-glow"></div>
                                <div className="empty-hero-icon">
                                    <ShoppingBag className="empty-hero-svg" />
                                </div>
                            </div>
                            <h3 className="empty-title">Chưa có đơn hàng nào</h3>
                            <p className="empty-subtitle">Bạn chưa có đơn hàng nào. Hãy khám phá và mua sắm sản phẩm yêu thích!</p>
                            <button className="btn btn-primary" onClick={handleGoHome}>Bắt đầu mua sắm</button>
                        </div>
                    ) : (
                        <>
                            <div className="orders-toolbar">
                                <div className="orders-toolbar-info">
                                    Đang hiển thị <strong>{paginatedOrders.length}</strong> / {filteredOrders.length} đơn
                                    {filter !== 'all' && (
                                        <span className="orders-toolbar-filter">• Bộ lọc: {filter === 'canceled' ? 'Đã hủy' : filter}</span>
                                    )}
                                </div>
                                <div className="orders-toolbar-actions">
                                    <label htmlFor="order-page-size">Đơn mỗi trang</label>
                                    <select
                                        id="order-page-size"
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                    >
                                        {pageSizeOptions.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="orders-list">
                                {paginatedOrders.map(order => {
                                    const orderCode = order.orderCode || order._raw?.orderCode || order.id;
                                    const productCount = Number(order._raw?.quantity || 1);
                                    const shippingAddress = order.shippingAddress || order._raw?.shippingAddress || '';
                                    const phoneNumber = order.phoneNumber || order._raw?.phoneNumber || '';
                                    const canceledAt = order.canceledAt || order._raw?.canceledAt || null;
                                    const cancelReason = order.cancelReason || order._raw?.cancelReason || '';

                                    // Xác định xem đơn có bị hủy không sử dụng helper thống nhất
                                    const isCancelled = isOrderCancelled(order);

                                    // Xác định status để hiển thị (ưu tiên canceled nếu đơn đã bị hủy)
                                    const displayStatus = isCancelled ? 'canceled' : order.status;
                                    const displayStatusInfo = getStatusInfo(displayStatus);
                                    const DisplayStatusIcon = displayStatusInfo.icon;

                                    const imgSrc = extractImageFromOrder(order) || '/vite.svg';

                                    return (
                                        <div
                                            key={order.id}
                                            className={`order-card ${isCancelled ? 'order-cancelled' : ''}`}
                                            onClick={() => handleViewOrder(order.id)}
                                        >
                                            <div className="order-header">
                                                <div className="order-info">
                                                    <h3 className="order-id">Đơn hàng #{orderCode}</h3>
                                                    <div className="order-date">
                                                        <Calendar className="date-icon" />
                                                        <span>{formatDate(order.createdAt)}</span>
                                                        {isCancelled && canceledAt && (
                                                            <span style={{ marginLeft: '8px', color: '#dc3545', fontSize: '12px' }}>
                                                                • Hủy: {formatDate(canceledAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="order-status">
                                                    <div
                                                        className="status-badge"
                                                        style={{ backgroundColor: displayStatusInfo.color }}
                                                    >
                                                        <DisplayStatusIcon size={16} color="white" />
                                                        <span>{displayStatusInfo.label}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="order-content">
                                                <div className="order-product-row">
                                                    <div className="thumb">
                                                        <img src={imgSrc} alt={order.product?.title || 'product'} />
                                                    </div>
                                                    <div className="info-rows">
                                                        <div className="info-row">
                                                            <span className="label">Số lượng sản phẩm:</span>
                                                            <span className="value">{productCount} sản phẩm</span>
                                                        </div>
                                                        <div className="info-row">
                                                            <span className="label">Tổng cộng:</span>
                                                            <span className="value total-price-blue">{formatCurrency(order.finalPrice)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="expand-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {/* Chỉ giữ action trái cho trạng thái cần thiết (ví dụ: shipping: theo dõi vận đơn) */}
                                                {order.status === 'shipping' && getActionsForStatus(order.status, order.id).map(action => (
                                                    <button
                                                        key={action.key}
                                                        className={action.className}
                                                        onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                                                    >
                                                        {action.label}
                                                    </button>
                                                ))}
                                                {/* Nút xem chi tiết */}
                                                <button
                                                    className="btn btn-soft-primary btn-sm btn-animate"
                                                    onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === order.id ? null : order.id); }}
                                                >
                                                    {expandedId === order.id ? (
                                                        <>
                                                            Thu gọn <ChevronUp className="btn-icon" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            Xem chi tiết <ChevronDown className="btn-icon" />
                                                        </>
                                                    )}
                                                </button>
                                                {/* Nút theo dõi đơn hàng */}
                                                <button
                                                    className="btn btn-primary btn-sm btn-animate"
                                                    onClick={(e) => { e.stopPropagation(); handleViewOrder(order.id); }}
                                                >
                                                    <Eye className="btn-icon" />
                                                    Theo dõi đơn hàng
                                                </button>
                                                {/* Nhóm bên phải: Actions theo trạng thái */}
                                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                                    {/* Actions cho đơn đã hủy */}
                                                    {isCancelled && (
                                                        <button
                                                            className="btn btn-secondary btn-sm btn-animate"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleReorder(order.id);
                                                            }}
                                                        >
                                                            Đặt lại
                                                        </button>
                                                    )}
                                                    {/* Actions cho đơn chưa hủy */}
                                                    {!isCancelled && (
                                                        <>
                                                            {/* Cho phép hủy khi pending hoặc confirmed và chưa handed-over */}
                                                            {canCancelOrder(order) && (
                                                                <button
                                                                    className="btn btn-danger btn-sm btn-animate"
                                                                    onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id, order); }}
                                                                >
                                                                    Hủy đơn
                                                                </button>
                                                            )}

                                                            {order.status === 'delivered' && (
                                                                <>
                                                                    {reviewedMap[order.id]?.hasReview ? (
                                                                        <button
                                                                            className="btn btn-secondary btn-sm btn-animate"
                                                                            onClick={(e) => { e.stopPropagation(); handleViewReview(order.id, order); }}
                                                                        >
                                                                            Xem đánh giá
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            className="btn btn-success btn-sm btn-animate"
                                                                            style={{ backgroundColor: '#28a745', boxShadow: '0 0 0 0 rgba(0,0,0,0)', filter: 'drop-shadow(0 0 8px rgba(40,167,69,0.45))' }}
                                                                            onClick={(e) => { e.stopPropagation(); handleRateOrder(order.id, order); }}
                                                                        >
                                                                            Đánh giá
                                                                        </button>
                                                                    )}
                                                                    {order._raw?.disputeStatus || viewingDisputeResultId === order.id ? (
                                                                        // HIỂN THỊ: Xem khiếu nại (Đơn đã được khiếu nại)
                                                                        <button
                                                                            className="btn btn-secondary btn-sm btn-animate"
                                                                            onClick={(e) => { e.stopPropagation(); handleViewDisputeResult(order.id); }}
                                                                        >
                                                                            Xem khiếu nại
                                                                        </button>
                                                                    ) : (
                                                                        // HIỂN THỊ: Khiếu nại (Chưa khiếu nại)
                                                                        <button
                                                                            className="btn btn-warning btn-sm btn-animate"
                                                                            style={{ backgroundColor: '#ffc107', color: '#212529', filter: 'drop-shadow(0 0 8px rgba(255,193,7,0.45))' }}
                                                                            onClick={(e) => { e.stopPropagation(); handleRaiseDispute(order.id, order); }} // <<< ĐÃ TRUYỀN 'order'
                                                                        >
                                                                            Khiếu nại
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {expandedId === order.id && (
                                                <div className="order-expanded">
                                                    {/* Status-specific information */}
                                                    {order.status === 'pending' && (
                                                        <>
                                                            <div className="expanded-status-info pending-info">
                                                                <Clock size={18} />
                                                                <div>
                                                                    <div className="status-info-title">Đơn hàng đang chờ xác nhận</div>
                                                                    <div className="status-info-desc">Chúng tôi đang xử lý đơn hàng của bạn. Vui lòng đợi trong giây lát.</div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {order.status === 'confirmed' && (
                                                        <>
                                                            <div className="expanded-status-info confirmed-info">
                                                                <CheckCircle size={18} />
                                                                <div>
                                                                    <div className="status-info-title">Đơn hàng đã được xác nhận</div>
                                                                    <div className="status-info-desc">Đơn hàng đang được chuẩn bị để giao đến bạn.</div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {order.status === 'shipping' && (
                                                        <>
                                                            <div className="expanded-status-info shipping-info">
                                                                <Truck size={18} />
                                                                <div>
                                                                    <div className="status-info-title">Đơn hàng đang trên đường</div>
                                                                    <div className="status-info-desc">Đơn hàng đã được giao cho đơn vị vận chuyển và đang trên đường đến bạn.</div>
                                                                </div>
                                                            </div>
                                                            {order._raw?.trackingNumber && (
                                                                <div className="expanded-section tracking-section">
                                                                    <h4>
                                                                        <Package className="section-icon" />
                                                                        Thông tin vận đơn
                                                                    </h4>
                                                                    <div className="expanded-row">
                                                                        <div className="expanded-info-group">
                                                                            <div className="expanded-label">Mã vận đơn</div>
                                                                            <div className="expanded-text tracking-code">{order._raw.trackingNumber}</div>
                                                                        </div>
                                                                        {order._raw?.carrier && (
                                                                            <div className="expanded-info-group">
                                                                                <div className="expanded-label">Đơn vị vận chuyển</div>
                                                                                <div className="expanded-text">{order._raw.carrier}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {order.status === 'delivered' && (
                                                        <>
                                                            <div className="expanded-status-info delivered-info">
                                                                <CheckCircle size={18} />
                                                                <div>
                                                                    <div className="status-info-title">Đơn hàng đã được giao thành công</div>
                                                                    <div className="status-info-desc">
                                                                        {order._raw?.deliveredAt
                                                                            ? `Giao hàng vào ${formatDate(order._raw.deliveredAt)}`
                                                                            : 'Đơn hàng đã được giao đến bạn thành công.'
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {order._raw?.trackingNumber && (
                                                                <div className="expanded-section tracking-section">
                                                                    <h4>
                                                                        <Package className="section-icon" />
                                                                        Thông tin vận đơn
                                                                    </h4>
                                                                    <div className="expanded-row">
                                                                        <div className="expanded-info-group">
                                                                            <div className="expanded-label">Mã vận đơn</div>
                                                                            <div className="expanded-text tracking-code">{order._raw.trackingNumber}</div>
                                                                        </div>
                                                                        {order._raw?.carrier && (
                                                                            <div className="expanded-info-group">
                                                                                <div className="expanded-label">Đơn vị vận chuyển</div>
                                                                                <div className="expanded-text">{order._raw.carrier}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {isCancelled && (
                                                        <>
                                                            <div className="expanded-status-info cancelled-info">
                                                                <AlertCircle size={18} />
                                                                <div>
                                                                    <div className="status-info-title">Đơn hàng đã bị hủy</div>
                                                                    <div className="status-info-desc">
                                                                        {cancelReason ? (
                                                                            <>
                                                                                <strong>Lý do hủy:</strong> {cancelReason}
                                                                                {canceledAt && ` - ${formatDate(canceledAt)}`}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                Đơn hàng này đã bị hủy.
                                                                                {canceledAt && ` (${formatDate(canceledAt)})`}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Common information */}
                                                    <div className="expanded-sections-grid">
                                                        <div className="expanded-section">
                                                            <h4>
                                                                <MapPin className="section-icon" />
                                                                Thông tin giao hàng
                                                            </h4>
                                                            <div className="expanded-details">
                                                                {phoneNumber && (
                                                                    <div className="expanded-detail-row">
                                                                        <Phone className="expanded-icon" />
                                                                        <div>
                                                                            <div className="expanded-label">Số điện thoại</div>
                                                                            <div className="expanded-text">{phoneNumber}</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {shippingAddress ? (
                                                                    <div className="expanded-detail-row">
                                                                        <MapPin className="expanded-icon" />
                                                                        <div>
                                                                            <div className="expanded-label">Địa chỉ giao hàng</div>
                                                                            <div className="expanded-text">{shippingAddress}</div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="expanded-detail-row">
                                                                        <MapPin className="expanded-icon" />
                                                                        <div className="expanded-text text-muted">Chưa cập nhật địa chỉ</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="expanded-section">
                                                            <h4>
                                                                <CreditCard className="section-icon" />
                                                                Thanh toán
                                                            </h4>
                                                            <div className="expanded-details">
                                                                <div className="expanded-detail-row">
                                                                    <CreditCard className="expanded-icon" />
                                                                    <div>
                                                                        <div className="expanded-label">Phương thức thanh toán</div>
                                                                        <div className="expanded-text">
                                                                            {order._raw?.paymentMethod || (order.status === 'confirmed' ? 'Ví điện tử' : order.status === 'delivered' ? 'Ví điện tử' : 'Thanh toán khi nhận hàng (COD)')}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="expanded-detail-row">
                                                                    <div className="expanded-label">Tổng tiền</div>
                                                                    <div className="expanded-text price-highlight">{formatCurrency(order.finalPrice)}</div>
                                                                </div>
                                                                <div className="expanded-detail-row price-breakdown">
                                                                    <div className="expanded-label">Tạm tính</div>
                                                                    <div className="expanded-text">{formatCurrency(order.price || order.finalPrice - order.shippingFee)}</div>
                                                                </div>
                                                                <div className="expanded-detail-row price-breakdown">
                                                                    <div className="expanded-label">Phí vận chuyển</div>
                                                                    <div className="expanded-text">{formatCurrency(order.shippingFee)}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="expanded-section timeline-section">
                                                        <h4>
                                                            <Calendar className="section-icon" />
                                                            Mốc thời gian
                                                        </h4>
                                                        <div className="timeline">
                                                            <div className="timeline-item active">
                                                                <div className="timeline-dot"></div>
                                                                <div className="timeline-content">
                                                                    <div className="timeline-label">Đặt hàng</div>
                                                                    <div className="timeline-date">{formatDate(order.createdAt)}</div>
                                                                </div>
                                                            </div>
                                                            {order.status !== 'pending' && !isCancelled && (
                                                                <div className="timeline-item active">
                                                                    <div className="timeline-dot"></div>
                                                                    <div className="timeline-content">
                                                                        <div className="timeline-label">Xác nhận đơn hàng</div>
                                                                        <div className="timeline-date">{formatDate(order.updatedAt || order.createdAt)}</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {(order.status === 'shipping' || order.status === 'delivered') && (
                                                                <div className="timeline-item active">
                                                                    <div className="timeline-dot"></div>
                                                                    <div className="timeline-content">
                                                                        <div className="timeline-label">Đang vận chuyển</div>
                                                                        <div className="timeline-date">{formatDate(order._raw?.shippedAt || order.updatedAt || order.createdAt)}</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {order.status === 'delivered' && (
                                                                <div className="timeline-item active">
                                                                    <div className="timeline-dot delivered"></div>
                                                                    <div className="timeline-content">
                                                                        <div className="timeline-label">Giao hàng thành công</div>
                                                                        <div className="timeline-date">{formatDate(order._raw?.deliveredAt || order.updatedAt)}</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {isCancelled && (
                                                                <div className="timeline-item cancelled">
                                                                    <div className="timeline-dot cancelled"></div>
                                                                    <div className="timeline-content">
                                                                        <div className="timeline-label">Đơn hàng bị hủy</div>
                                                                        <div className="timeline-date">
                                                                            {formatDate(canceledAt || order.updatedAt || order.createdAt)}
                                                                        </div>
                                                                        {cancelReason && (
                                                                            <div className="timeline-reason" style={{
                                                                                marginTop: '4px',
                                                                                fontSize: '12px',
                                                                                color: '#dc3545',
                                                                                fontStyle: 'italic'
                                                                            }}>
                                                                                {cancelReason}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {totalPages > 1 && (
                                <div className="order-pagination">
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={handleFirstPage}
                                        disabled={currentPage === 1}
                                    >
                                        Đầu
                                    </button>
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                    >
                                        Trước
                                    </button>
                                    {visiblePages.map((item, index) => (
                                        item === 'ellipsis' ? (
                                            <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                                        ) : (
                                            <button
                                                key={item}
                                                type="button"
                                                className={`pagination-btn ${currentPage === item ? 'active' : ''}`}
                                                onClick={() => handlePageChange(item)}
                                            >
                                                {item}
                                            </button>
                                        )
                                    ))}
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        Sau
                                    </button>
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={handleLastPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        Cuối
                                    </button>
                                    <form className="pagination-go-form" onSubmit={handlePageInputSubmit}>
                                        <span>Đi tới</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={pageInputValue}
                                            onChange={handlePageInputChange}
                                            placeholder={`${currentPage}/${totalPages}`}
                                        />
                                        <button type="submit" className="pagination-btn go-button">Đi</button>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {/* Summary Footer */}
                <div className="order-card" style={{ marginTop: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center' }}>
                        <div>
                            <div style={{ color: '#6c757d', marginBottom: 6 }}>Tổng đơn hàng</div>
                            <div style={{ fontWeight: 700, color: '#0d6efd' }}>{totalOrders}</div>
                        </div>
                        <div>
                            <div style={{ color: '#6c757d', marginBottom: 6 }}>Đã giao thành công</div>
                            <div style={{ fontWeight: 700, color: '#28a745' }}>{totalDelivered}</div>
                        </div>
                        <div>
                            <div style={{ color: '#6c757d', marginBottom: 6 }}>Tổng chi tiêu</div>
                            <div style={{ fontWeight: 700, color: '#0d6efd' }}>{formatCurrency(totalSpent)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderList;
