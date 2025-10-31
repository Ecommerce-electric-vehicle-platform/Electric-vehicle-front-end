import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import StarRating from '../../components/Rating/StarRating';
import ImageUploader from '../../components/Rating/ImageUploader';
import { createOrderReview, getOrderDetails } from '../../api/orderApi';
import './OrderReview.css';

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

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const data = await getOrderDetails(orderId);
                if (mounted) setOrder(data?.data || data || null);
            } catch {
                // ignore; show minimal header using orderId
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [orderId]);

    const canSubmit = useMemo(() => Number(rating) > 0 && String(feedback).trim().length >= 5, [rating, feedback]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        try {
            const rawId = location?.state?.orderIdRaw;
            const submitOrderId = Number(rawId ?? orderId); // đảm bảo gửi dạng số đúng với BE
            console.log('[OrderReview] Submitting review with orderId =', submitOrderId, 'rating =', Number(rating), 'feedbackLen =', feedback.trim().length);
            await createOrderReview({ orderId: submitOrderId, rating: Number(rating), feedback: feedback.trim(), pictures });
            navigate('/orders', { replace: true, state: { toast: 'Cảm ơn bạn đã đánh giá!' } });
        } catch (err) {
            alert('Gửi đánh giá thất bại. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-page">
            <div className="layout">
                <div className="breadcrumbs">
                    <button type="button" className="crumb" onClick={() => navigate('/orders')}>Đơn hàng của bạn</button>
                    <span className="crumb-sep">/</span>
                    <button type="button" className="crumb" onClick={() => navigate(-1)}>Đơn #{order?.orderCode || orderId}</button>
                    <span className="crumb-sep">/</span>
                    <span className="crumb current">Viết đánh giá</span>
                </div>

                <h1 className="page-title">Đánh giá sản phẩm</h1>

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

                    <form className="card-section" onSubmit={handleSubmit}>
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
                            <div className="hint">Hỗ trợ PNG, JPG hoặc MP4 (tối đa 800x400px).</div>
                        </div>

                        <div className="submit-wrap">
                            <button type="submit" className="btn-submit" disabled={!canSubmit || submitting}>
                                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


