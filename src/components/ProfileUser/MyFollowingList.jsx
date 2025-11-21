import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import profileApi from "../../api/profileApi";
import sellerApi from "../../api/sellerApi"; 
import { MapPin, UserMinus, ExternalLink, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"; // Thêm icon mũi tên
import "./MyFollowingList.css";

export default function MyFollowingList() {
    const navigate = useNavigate();
    
    // --- STATE ---
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unfollowLoading, setUnfollowLoading] = useState(null);
    
    // State phân trang
    const [currentPage, setCurrentPage] = useState(0); // Backend bắt đầu từ 0
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10; // Số lượng item mỗi trang

    // --- LẤY DANH SÁCH (GỌI LẠI KHI currentPage THAY ĐỔI) ---
    useEffect(() => {
        const fetchList = async () => {
            try {
                setLoading(true);
                // Gọi API với page và size
                const response = await profileApi.getFollowedSellers(currentPage, pageSize);
                
                const backendData = response.data; // ProfileApi trả về nguyên gói axios
                
                if (backendData.success && backendData.data) {
                    // Cập nhật danh sách và thông tin phân trang
                    setSellers(backendData.data.followings || []);
                    setTotalPages(backendData.data.totalPages || 0);
                } else {
                    setSellers([]);
                }
            } catch (err) {
                console.error("Error fetching following list:", err);
                setError("Có lỗi xảy ra khi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };

        fetchList();
    }, [currentPage]); // Chạy lại khi đổi trang

    // --- XỬ LÝ BỎ THEO DÕI ---
    const handleUnfollow = async (sellerId, storeName) => {
        const confirm = window.confirm(`Bạn có chắc muốn bỏ theo dõi "${storeName}" không?`);
        if (!confirm) return;

        setUnfollowLoading(sellerId);
        try {
            const response = await sellerApi.unfollowSeller(sellerId);
            
            if (response.success) {
                // Xóa khỏi danh sách hiển thị hiện tại
                setSellers(prev => prev.filter(item => item.seller?.sellerId !== sellerId));
                
                // Nếu xóa hết item ở trang hiện tại và không phải trang đầu -> lùi 1 trang
                if (sellers.length === 1 && currentPage > 0) {
                    setCurrentPage(prev => prev - 1);
                }
            }
        } catch (err) {
            console.error("Unfollow error:", err);
            alert("Lỗi: Không thể bỏ theo dõi lúc này.");
        } finally {
            setUnfollowLoading(null);
        }
    };

    // --- XỬ LÝ CHUYỂN TRANG ---
    const handlePrevPage = () => {
        if (currentPage > 0) setCurrentPage(prev => prev - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
    };

    if (loading) return <div className="following-loading">Đang tải danh sách...</div>;
    if (error) return <div className="following-error">{error}</div>;

    return (
        <div className="following-page">
            <h2 className="following-title">Shop đang theo dõi</h2>

            {sellers.length === 0 ? (
                <div className="empty-following">
                    <AlertCircle size={48} color="#9ca3af" />
                    <p>Bạn chưa theo dõi shop nào.</p>
                    <button className="explore-btn" onClick={() => navigate("/")}>Khám phá ngay</button>
                </div>
            ) : (
                <>
                    {/* DANH SÁCH SHOP */}
                    <div className="following-grid">
                        {sellers.map((item) => {
                            // Lấy thông tin từ object "seller" bên trong
                            const info = item.seller || {}; 
                            const sId = info.sellerId;
                            const name = info.storeName || info.sellerName || "Người bán";
                            const address = info.home || info.nationality || "Chưa cập nhật";
                            const avatarChar = name.charAt(0).toUpperCase();

                            return (
                                <div key={sId} className="following-card">
                                    <div className="card-header">
                                        <div className="shop-avatar">
                                            {avatarChar}
                                        </div>
                                        <div className="shop-info">
                                            <h3 className="shop-name" onClick={() => navigate(`/seller/${sId}`)}>
                                                {name}
                                            </h3>
                                            <div className="shop-meta">
                                                <MapPin size={12} />
                                                <span className="truncate-text">{address}</span>
                                            </div>
                                            {/* Hiển thị ngày follow nếu cần */}
                                            <div className="follow-date">
                                                Đã theo dõi: {new Date(item.followedAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button 
                                            className="action-btn view-btn"
                                            onClick={() => navigate(`/seller/${sId}`)}
                                        >
                                            <ExternalLink size={16} /> Xem Shop
                                        </button>
                                        <button 
                                            className="action-btn unfollow-btn"
                                            onClick={() => handleUnfollow(sId, name)}
                                            disabled={unfollowLoading === sId}
                                        >
                                            {unfollowLoading === sId ? "..." : <><UserMinus size={16} /> Bỏ theo dõi</>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* THANH PHÂN TRANG (Chỉ hiện khi có nhiều hơn 1 trang) */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button 
                                className="page-btn" 
                                onClick={handlePrevPage} 
                                disabled={currentPage === 0}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            
                            <span className="page-info">
                                Trang {currentPage + 1} / {totalPages}
                            </span>
                            
                            <button 
                                className="page-btn" 
                                onClick={handleNextPage} 
                                disabled={currentPage >= totalPages - 1}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}