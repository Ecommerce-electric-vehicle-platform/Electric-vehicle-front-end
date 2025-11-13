import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, ImageIcon } from 'lucide-react';
import './ViewDisputeResult.css';

// === IMPORT API THẬT ===
import profileApi from '../../api/profileApi'; // <<< ĐẢM BẢO ĐƯỜNG DẪN NÀY CHÍNH XÁC

// Định nghĩa lại các trạng thái API
const STATUS_TYPES = {
    ALL: 'ALL',
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED'
};


// --- DISPUTECARD COMPONENT (GIỮ NGUYÊN) ---
const DisputeCard = ({ dispute, orderId }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    const getStatusConfig = (status) => {
        switch(status) {
            case STATUS_TYPES.PENDING:
                return {
                    className: 'status-pending',
                    icon: <Clock className="status-icon" />,
                    text: 'Đơn khiếu nại của bạn đang trong quá trình xử lý'
                };
            case STATUS_TYPES.ACCEPTED:
                return {
                    className: 'status-accepted',
                    icon: <CheckCircle className="status-icon" />,
                    text: 'Đơn khiếu nại đã được chấp nhận'
                };
            case STATUS_TYPES.REJECTED:
                return {
                    className: 'status-rejected',
                    icon: <AlertCircle className="status-icon" />,
                    text: 'Đơn khiếu nại đã bị từ chối'
                };
            default:
                return {
                    className: 'status-default',
                    icon: <AlertCircle className="status-icon" />,
                    text: 'Trạng thái không xác định'
                };
        }
    };
    
    const statusConfig = getStatusConfig(dispute.status);
    
    // Lấy order ID để hiển thị (Ưu tiên: dispute object > prop orderId)
    const displayOrderId = dispute.orderId || orderId;

    return (
        <div className="dispute-card">
            {/* Header với trạng thái */}
            <div className={`dispute-card-header ${statusConfig.className}`}>
                <div className="status-content">
                    <div className="status-info">
                        {statusConfig.icon}
                        <span className="status-text">{statusConfig.text}</span>
                    </div>
                    <span className="dispute-id-badge">
                        #{dispute.disputeId}
                    </span>
                </div>
            </div>
            {/* Nội dung */}
            <div className="dispute-card-body">
                {/* Thông tin đơn hàng */}
                <div className="order-info">
                    <span className="label">Mã đơn hàng:</span>
                    <span className="order-id">#{displayOrderId || 'N/A'}</span> 
                </div>
                {/* Loại khiếu nại */}
                <div className="info-section">
                    <h3 className="section-title">Loại khiếu nại</h3>
                    <p className="category-name">{dispute.disputeCategoryName}</p>
                </div>
                {/* Mô tả */}
                <div className="info-section">
                    <h3 className="section-title">Nội dung khiếu nại</h3>
                    <p className="description">{dispute.description}</p>
                </div>
                {/* Kết quả xử lý */}
                {dispute.status !== STATUS_TYPES.PENDING && (
                    <div className="info-section">
                        <h3 className="section-title">Kết quả xử lý</h3>
                        <p className="resolution">{dispute.resolution}</p>
                    </div>
                )}
                {/* Bằng chứng */}
                {dispute.evidences && dispute.evidences.length > 0 && (
                    <div className="info-section">
                        <h3 className="section-title">
                            Bằng chứng đã gửi ({dispute.evidences.length} ảnh)
                        </h3>
                        <div className="evidence-grid">
                            {dispute.evidences.map((evidence) => (
                                <div 
                                    key={evidence.id}
                                    className="evidence-item"
                                    onClick={() => setSelectedImage(evidence.imageUrl)}
                                >
                                    <img 
                                        src={evidence.imageUrl}
                                        alt={`Bằng chứng ${evidence.order}`}
                                        className="evidence-image"
                                    />
                                    <div className="evidence-overlay">
                                        <ImageIcon className="evidence-icon" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* Modal xem ảnh phóng to */}
            {selectedImage && (
                <div 
                    className="image-modal"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={selectedImage}
                            alt="Xem chi tiết"
                            className="modal-image"
                        />
                        <button 
                            className="close-button"
                            onClick={() => setSelectedImage(null)}
                        >
                            <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- VIEWDISPUTERESULT COMPONENT (CẬP NHẬT LOGIC API) ---
const ViewDisputeResult = ({ orderId }) => { // Đã xóa giá trị mặc định, nhận orderId hoặc undefined
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 
    const [filterStatus, setFilterStatus] = useState(STATUS_TYPES.ALL);
    
    // Lấy Buyer ID từ localStorage (Cần cho luồng tổng hợp)
    const buyerId = localStorage.getItem('buyerId'); 

    useEffect(() => {
        const fetchDisputes = async () => {
            setLoading(true);
            setError(null);
            
            try {
                let response;
                let disputesArray = [];
                
                if (orderId) {
                    // LUỒNG 1: XEM KHIẾU NẠI CỦA ĐƠN HÀNG CỤ THỂ (Từ OrderList)
                    console.log(`[DisputeResult] Fetching by Order ID: ${orderId}`);
                    response = await profileApi.getDisputeByOrderId(orderId);
                    
                    const data = response.data?.data;
                    disputesArray = Array.isArray(data) ? data : (data ? [data] : []);

                } else {
                    // LUỒNG 2: XEM TẤT CẢ KHIẾU NẠI (Từ UserSidebar)
                    if (!buyerId) {
                         setError("Lỗi: Không tìm thấy ID người mua. Vui lòng đăng nhập lại.");
                         setLoading(false);
                         return;
                    }
                    console.log(`[DisputeResult] Fetching ALL disputes for Buyer ID: ${buyerId}`);
                    response = await profileApi.getAllBuyerDisputes(buyerId); 

                    // API tổng hợp trả về data: { disputes: [...] }
                    const rawDisputes = response.data?.data?.disputes || [];
                    
                    // Gán orderId cho mỗi dispute (Sử dụng trường 'order' trong evidences)
                    disputesArray = rawDisputes.map(d => ({ 
                        ...d, 
                        // Lấy order ID từ trường 'order' trong evidences (API của bạn)
                        orderId: d.evidences?.[0]?.order || 'N/A' 
                    }));
                }
                
                setDisputes(disputesArray);

            } catch (err) {
                console.error("Lỗi khi tải khiếu nại:", err);
                setError(err.response?.data?.message || "Không thể tải danh sách khiếu nại.");
                setDisputes([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchDisputes();
    // Dependency array: orderId (cho luồng 1), buyerId (cho luồng 2)
    }, [orderId, buyerId]); 


    // Lấy danh sách cho bộ lọc (Giữ nguyên)
    const filterButtons = [
        { label: 'Tất cả', value: STATUS_TYPES.ALL, count: disputes.length },
        { label: 'Đang xử lý', value: STATUS_TYPES.PENDING, count: disputes.filter(d => d.status === STATUS_TYPES.PENDING).length },
        { label: 'Đã chấp nhận', value: STATUS_TYPES.ACCEPTED, count: disputes.filter(d => d.status === STATUS_TYPES.ACCEPTED).length },
        { label: 'Đã từ chối', value: STATUS_TYPES.REJECTED, count: disputes.filter(d => d.status === STATUS_TYPES.REJECTED).length }
    ];

    // Lọc dữ liệu theo trạng thái (Giữ nguyên)
    const filteredDisputes = filterStatus === STATUS_TYPES.ALL
        ? disputes
        : disputes.filter(d => d.status === filterStatus);

    // --- RENDER ---
    if (loading) {
        return (
            <div className="container">
                <div className="loading-skeleton">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-card"></div>
                    <div className="skeleton-card"></div>
                </div>
            </div>
        );
    }

    // Hiển thị lỗi (nếu có)
    if (error) {
        return (
            <div className="container">
                <div className="error-state">
                    <AlertCircle className="error-icon" />
                    <h3 className="error-title">Lỗi tải dữ liệu</h3>
                    <p className="error-message">{error}</p>
                    <p className="error-tip">Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Khiếu nại của tôi</h1>
                <p className="page-subtitle">
                    {orderId 
                        ? `Kết quả khiếu nại cho đơn hàng #${orderId}` 
                        : "Theo dõi tình trạng xử lý các khiếu nại đã gửi" // Dành cho Sidebar
                    }
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="filter-container">
                <div className="filter-buttons">
                    {filterButtons.map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => setFilterStatus(btn.value)}
                            className={`filter-button ${filterStatus === btn.value ? 'active' : ''}`}
                        >
                            <span>{btn.label}</span>
                            {btn.count > 0 && (
                                <span className="count-badge">
                                    {btn.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Danh sách khiếu nại */}
            {filteredDisputes.length === 0 ? (
                <div className="empty-state">
                    <AlertCircle className="empty-icon" />
                    <p className="empty-text">
                        {orderId 
                            ? `Đơn hàng #${orderId} chưa có khiếu nại nào.`
                            : `Bạn chưa có khiếu nại nào.`
                        }
                    </p>
                </div>
            ) : (
                <div className="dispute-list">
                    {filteredDisputes.map((dispute) => (
                        <DisputeCard 
                            key={dispute.disputeId} 
                            dispute={dispute} 
                            // Truyền orderId (dùng orderId trong dispute nếu có, hoặc prop orderId)
                            orderId={dispute.orderId || orderId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewDisputeResult;

