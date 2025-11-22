import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import StarRating from '../../components/Rating/StarRating';
import ImageUploader from '../../components/Rating/ImageUploader';
import { createOrderReview, getOrderDetails, getOrderReview, updateOrderReview } from '../../api/orderApi';
import './OrderReview.css';

const resolveReviewIdentifier = (review) => {
    if (!review || typeof review !== 'object') return null;
    const candidates = [
        review.reviewIdentifier,
        review.reviewId,
        review.id,
        review._raw?.reviewIdentifier,
        review._raw?.reviewId,
        review._raw?.id,
        review._raw?.review?.id,
        review._raw?.review?.reviewId,
        review._raw?.reviewResponse?.id,
        review._raw?.reviewResponse?.reviewId,
        review._raw?.orderReview?.id,
        review._raw?.orderReviewResponse?.id
    ];
    if (Array.isArray(review.reviewImages)) {
        review.reviewImages.forEach((img) => {
            if (!img) return;
            candidates.push(
                img.reviewId,
                img.id,
                img.orderReviewId,
                img.orderReview?.id,
                img.review?.id
            );
        });
    }
    const found = candidates.find((val) => (
        val !== undefined &&
        val !== null &&
        val !== 0 &&
        val !== '0' &&
        String(val).trim() !== ''
    ));
    return found != null ? String(found).trim() : null;
};

export default function OrderReview() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState(null);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [pictures, setPictures] = useState([]);
    const [existingReview, setExistingReview] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                // Load order details từ API
                const orderDetailRes = await getOrderDetails(orderId);

                if (orderDetailRes.success && orderDetailRes.data) {
                    const orderDetailData = orderDetailRes.data;

                    // Map từ order detail API response sang format của OrderReview
                    const orderData = {
                        id: orderDetailData.id || orderId,
                        orderCode: orderDetailData.orderCode || String(orderId),
                        productName: orderDetailData._raw?.productName || 'Sản phẩm trong đơn hàng',
                        productImage: orderDetailData._raw?.productImage || '/vite.svg',
                        createdAt: orderDetailData.createdAt || new Date().toISOString(),
                        status: orderDetailData.status || 'pending',
                        price: orderDetailData.price || 0,
                        shippingFee: orderDetailData.shippingFee || 0,
                        finalPrice: orderDetailData.finalPrice || 0,
                        _raw: orderDetailData._raw || {}
                    };

                    if (mounted) setOrder(orderData);
                } else {
                    // Fallback: nếu API fail, tạo order data tối thiểu
                    if (mounted) setOrder({
                        id: orderId,
                        orderCode: String(orderId),
                        productName: 'Sản phẩm trong đơn hàng',
                        productImage: '/vite.svg',
                        createdAt: new Date().toISOString(),
                        status: 'pending'
                    });
                }

                // Load existing review nếu có
                const rawId = location?.state?.orderIdRaw;
                const checkId = rawId ?? orderId;

                try {
                    const reviewData = await getOrderReview(checkId);
                    if (reviewData && reviewData.hasReview && reviewData.review && mounted) {
                        setExistingReview(reviewData.review);
                        setIsViewMode(true);
                        // Pre-fill form với dữ liệu review đã có
                        setRating(Number(reviewData.review.rating ?? 0));
                        setFeedback(String(reviewData.review.feedback ?? ''));
                        // Load review images nếu có
                        if (Array.isArray(reviewData.review.reviewImages) && reviewData.review.reviewImages.length > 0) {
                            const imageUrls = reviewData.review.reviewImages.map(img =>
                                typeof img === 'string' ? img : (img.imageUrl || img.url || '')
                            ).filter(Boolean);
                            setPictures(imageUrls);
                        }
                    }
                } catch (reviewError) {
                    console.warn('[OrderReview] Failed to load existing review:', reviewError);
                }

                // Check view mode từ location state
                if (location?.state?.viewMode && mounted) {
                    setIsViewMode(true);
                }
            } catch (error) {
                console.error('[OrderReview] Error loading order details:', error);
                // Fallback: tạo order data tối thiểu
                if (mounted) setOrder({
                    id: orderId,
                    orderCode: String(orderId),
                    productName: 'Sản phẩm trong đơn hàng',
                    productImage: '/vite.svg',
                    createdAt: new Date().toISOString(),
                    status: 'pending'
                });
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [orderId, location]);

    const canSubmit = useMemo(() => Number(rating) > 0 && String(feedback).trim().length >= 5, [rating, feedback]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        setErrorMessage(''); // Clear previous errors
        try {
            const rawId = location?.state?.orderIdRaw;
            const submitOrderId = Number(rawId ?? orderId); // đảm bảo gửi dạng số đúng với BE
            console.log('[OrderReview] Submitting review with orderId =', submitOrderId, 'rating =', Number(rating), 'feedbackLen =', feedback.trim().length);
            await createOrderReview({ orderId: submitOrderId, rating: Number(rating), feedback: feedback.trim(), pictures });

            // Quay về trang trước đó (từ location.state.from) hoặc fallback về /orders
            const returnPath = location?.state?.from || '/orders';
            navigate(returnPath, { replace: true, state: { toast: 'Cảm ơn bạn đã đánh giá!' } });
        } catch (err) {
            const errorMsg = err?.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.';
            setErrorMessage(errorMsg);
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;

        const reviewIdForUpdate = resolveReviewIdentifier(existingReview);
        if (!reviewIdForUpdate) {
            setErrorMessage('Không tìm thấy ID đánh giá. Vui lòng thử lại.');
            return;
        }

        setSubmitting(true);
        setErrorMessage(''); // Clear previous errors
        try {
            // Lọc chỉ lấy File objects từ pictures (bỏ qua URL strings)
            const filePictures = pictures.filter(pic => pic instanceof File);

            console.log('[OrderReview] Updating review with reviewId =', reviewIdForUpdate, 'rating =', Number(rating), 'feedbackLen =', feedback.trim().length, 'picturesCount =', filePictures.length);

            // Gọi API update review
            const updateResult = await updateOrderReview({
                reviewId: reviewIdForUpdate,
                rating: Number(rating),
                feedback: feedback.trim(),
                pictures: filePictures
            });

            console.log('[OrderReview] Update result:', updateResult);

            // Đợi một chút để backend xử lý xong (tránh cache issue)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Reload review data từ backend để lấy data mới nhất (force refresh để tránh cache)
            const rawId = location?.state?.orderIdRaw;
            const checkId = rawId ?? orderId;

            console.log('[OrderReview] Reloading review for orderId =', checkId, '(force refresh)');
            const reviewData = await getOrderReview(checkId, true); // Force refresh để lấy data mới

            console.log('[OrderReview] Reloaded review data:', reviewData);

            if (reviewData && reviewData.hasReview && reviewData.review) {
                // Cập nhật state với data mới từ backend
                setExistingReview(reviewData.review);
                setRating(Number(reviewData.review.rating ?? 0));
                setFeedback(String(reviewData.review.feedback ?? ''));

                // Cập nhật ảnh từ review mới
                if (Array.isArray(reviewData.review.reviewImages) && reviewData.review.reviewImages.length > 0) {
                    const imageUrls = reviewData.review.reviewImages.map(img =>
                        typeof img === 'string' ? img : (img.imageUrl || img.url || img.image || '')
                    ).filter(Boolean);
                    setPictures(imageUrls);
                    console.log('[OrderReview] Updated pictures:', imageUrls);
                } else {
                    setPictures([]);
                }

                // Chuyển về view mode
                setIsEditMode(false);
                setIsViewMode(true);
                setErrorMessage(''); // Clear any previous errors

                // Show success message
                alert('Đánh giá đã được cập nhật thành công!');
            } else {
                // Nếu không load được review mới, vẫn cập nhật state với data đã submit
                console.warn('[OrderReview] Could not reload review, using submitted data');
                setRating(Number(rating));
                setFeedback(String(feedback.trim()));
                setIsEditMode(false);
                setIsViewMode(true);
                alert('Đánh giá đã được cập nhật thành công!');
            }
        } catch (err) {
            // Xử lý lỗi từ backend
            let errorMsg = err?.message || 'Cập nhật đánh giá thất bại. Vui lòng thử lại.';

            // Kiểm tra lỗi về system wallet đã hoàn thành
            // Backend trả về: "Cannot update review. The system wallet for this order has already been completed."
            const errorMsgLower = errorMsg.toLowerCase();
            if (errorMsgLower.includes('system wallet') ||
                errorMsgLower.includes('is_solved') ||
                errorMsgLower.includes('already been completed') ||
                errorMsgLower.includes('cannot update review')) {
                errorMsg = 'Không thể cập nhật đánh giá. Giao dịch thanh toán cho đơn hàng này đã được hoàn tất, do đó đánh giá không thể chỉnh sửa. Nếu bạn muốn thay đổi đánh giá, vui lòng liên hệ bộ phận hỗ trợ khách hàng.';
            }

            setErrorMessage(errorMsg);
            console.error('[OrderReview] Update review error:', err);

            // Log chi tiết để debug
            if (err?.response?.data) {
                console.error('[OrderReview] Backend error details:', err.response.data);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = () => {
        // Hiển thị cảnh báo trước khi cho phép edit
        // (Backend sẽ kiểm tra system wallet status khi submit, nhưng có thể thêm check ở đây nếu có API)
        setIsEditMode(true);
        setIsViewMode(false);
        setErrorMessage('');
    };

    const handleCancelEdit = () => {
        // Restore original review data
        if (existingReview) {
            setRating(Number(existingReview.rating ?? 0));
            setFeedback(String(existingReview.feedback ?? ''));
            if (Array.isArray(existingReview.reviewImages) && existingReview.reviewImages.length > 0) {
                const imageUrls = existingReview.reviewImages.map(img =>
                    typeof img === 'string' ? img : (img.imageUrl || img.url || '')
                ).filter(Boolean);
                setPictures(imageUrls);
            } else {
                setPictures([]);
            }
        }
        setIsEditMode(false);
        setIsViewMode(true);
        setErrorMessage('');
    };

    return (
        <div className="review-page">
            <div className="layout">
                <div className="breadcrumbs">
                    <button type="button" className="crumb" onClick={() => navigate('/orders')}>Đơn hàng của bạn</button>
                    <span className="crumb-sep">/</span>
                    <button type="button" className="crumb" onClick={() => navigate(-1)}>Đơn #{order?.orderCode || orderId}</button>
                    <span className="crumb-sep">/</span>
                    <span className="crumb current">{isEditMode ? 'Chỉnh sửa đánh giá' : (isViewMode ? 'Xem đánh giá' : 'Viết đánh giá')}</span>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <h1 className="page-title">{isEditMode ? 'Chỉnh sửa đánh giá' : (isViewMode ? 'Xem đánh giá' : 'Đánh giá sản phẩm')}</h1>
                    {!isViewMode && !isEditMode && (
                        <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '16px' }}>
                            Chia sẻ trải nghiệm của bạn để giúp cộng đồng đưa ra quyết định tốt hơn ⚡
                        </p>
                    )}
                </div>

                <div className="card">
                    <div className="card-product">
                        <div className="order-thumb">
                            <img src={order?.productImage || '/vite.svg'} alt="product" />
                        </div>
                        <div className="order-info">
                            <div className="order-title">{order?.productName || 'Sản phẩm trong đơn hàng'}</div>
                            <div className="order-sub">Đã mua vào {new Date(order?.createdAt || Date.now()).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {isViewMode && existingReview && !isEditMode && (
                        <div className="card-section">
                            <div className="section">
                                <div className="section-title">Đánh giá tổng quan</div>
                                <StarRating value={rating} onChange={() => { }} size={36} readOnly={true} />
                            </div>

                            <div className="divider" />

                            <div className="section">
                                <div className="section-title">Chia sẻ thêm</div>
                                <div className="feedback-view">{feedback || 'Không có nhận xét.'}</div>
                            </div>

                            <div className="divider" />

                            {pictures.length > 0 && (
                                <>
                                    <div className="section">
                                        <div className="section-title">Ảnh đã tải lên</div>
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                                            {pictures.map((pic, idx) => {
                                                const url = typeof pic === 'string' ? pic : (pic.imageUrl || pic.url || '');
                                                return url ? (
                                                    <img key={idx} src={url} alt={`review-${idx}`} style={{ width: 96, height: 96, borderRadius: 12, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                    <div className="divider" />
                                </>
                            )}

                            <div className="submit-wrap">
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleEditClick}
                                >
                                    Chỉnh sửa đánh giá
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => navigate('/orders')}
                                >
                                    Quay lại
                                </button>
                            </div>
                        </div>
                    )}

                    {(isEditMode || (!isViewMode && !existingReview)) && (
                        <form className="card-section" onSubmit={isEditMode ? handleUpdate : handleSubmit}>
                            {errorMessage && (
                                <div className="error-message">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="section">
                                <div className="section-title">Đánh giá tổng quan</div>
                                <StarRating value={rating} onChange={setRating} size={36} />
                            </div>

                            <div className="divider" />

                            <div className="section">
                                <div className="section-title">Chia sẻ thêm</div>
                                <textarea
                                    className="textarea"
                                    rows={6}
                                    placeholder="Hãy chia sẻ trải nghiệm của bạn về chất lượng sản phẩm, đóng gói, giao hàng..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                />
                                <div className="hint">Tối thiểu 5 ký tự để gửi đánh giá.</div>
                            </div>

                            <div className="divider" />

                            <div className="section">
                                <div className="section-title">Thêm ảnh hoặc video</div>
                                <ImageUploader files={pictures} onChange={setPictures} max={6} />
                                <div className="hint">Hỗ trợ PNG, JPG hoặc MP4 (tối đa 800x400px). {isEditMode && 'Nếu bạn tải ảnh mới, ảnh cũ sẽ bị thay thế.'}</div>
                            </div>

                            <div className="submit-wrap">
                                {isEditMode && (
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={handleCancelEdit}
                                        disabled={submitting}
                                    >
                                        Hủy
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={!canSubmit || submitting}
                                >
                                    {submitting
                                        ? (isEditMode ? 'Đang cập nhật...' : 'Đang gửi...')
                                        : (isEditMode ? 'Cập nhật đánh giá' : 'Gửi đánh giá')
                                    }
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}


