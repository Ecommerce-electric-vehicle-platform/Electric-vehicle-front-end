import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  CheckCircle,
  Clock,
  Phone,
  MapPin,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import sellerApi from "../../../api/sellerApi";
import "./SellerPendingOrders.css";

function SellerPendingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(null);
  const size = 10;

  const loadPendingOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sellerApi.getPendingOrders(page, size);

      // Xử lý response từ BE: response.data.data.content
      const responseData = response?.data?.data;
      const ordersData = responseData?.content || [];
      const totalPagesData = responseData?.totalPages || 0;

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setTotalPages(totalPagesData);
    } catch (error) {
      console.error("Error loading pending orders:", error);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    loadPendingOrders();
  }, [loadPendingOrders]);

  const handleVerifyOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xác nhận đơn hàng này?")) {
      return;
    }

    try {
      setVerifying((prev) => ({ ...prev, [orderId]: true }));
      await sellerApi.verifyOrder(orderId);

      // Xóa order khỏi danh sách sau khi verify thành công
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId)
      );

      alert("Xác nhận đơn hàng thành công!");

      // Reload danh sách để cập nhật
      await loadPendingOrders();
    } catch (error) {
      console.error("Error verifying order:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể xác nhận đơn hàng. Vui lòng thử lại.";
      alert(errorMessage);
    } finally {
      setVerifying((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="seller-pending-orders-container">
        <div className="loading-container">
          <RefreshCw className="spinner" size={48} />
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-pending-orders-container">
      <div className="pending-orders-header">
        <div className="header-content">
          <h1>
            <Package size={32} />
            Đơn hàng đang chờ xác nhận
          </h1>
          <p>Xem và xác nhận các đơn hàng từ người mua</p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => loadPendingOrders()}
          disabled={loading}
        >
          <RefreshCw size={18} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 && !loading ? (
        <div className="empty-state">
          <Package size={64} className="empty-icon" />
          <h3>Chưa có đơn hàng nào đang chờ</h3>
          <p>Hiện tại bạn không có đơn hàng nào đang chờ xác nhận.</p>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => {
              const orderId = order.id;
              const isVerifying = verifying[orderId];
              const totalAmount = (order.price || 0) + (order.shippingFee || 0);

              return (
                <div key={orderId} className="order-card">
                  <div className="order-card-header">
                    <div className="order-info">
                      <span className="order-id">
                        Đơn hàng #{order.orderCode || orderId}
                      </span>
                      <span className="order-date">
                        <Clock size={14} />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className="order-status-badge pending">
                      <Clock size={14} />
                      Đang chờ xác nhận
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="order-section">
                      <h3 className="section-title">
                        <MapPin size={18} />
                        Địa chỉ giao hàng
                      </h3>
                      <div className="buyer-info">
                        <div className="info-item">
                          <MapPin size={16} />
                          <span>{order.shippingAddress || "N/A"}</span>
                        </div>
                        <div className="info-item">
                          <Phone size={16} />
                          <span>{order.phoneNumber || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-section">
                      <h3 className="section-title">
                        <DollarSign size={18} />
                        Thông tin thanh toán
                      </h3>
                      <div className="payment-info">
                        <div className="payment-row">
                          <span>Giá sản phẩm:</span>
                          <span>{formatCurrency(order.price || 0)}</span>
                        </div>
                        <div className="payment-row">
                          <span>Phí vận chuyển:</span>
                          <span>{formatCurrency(order.shippingFee || 0)}</span>
                        </div>
                        <div className="payment-divider"></div>
                        <div className="total-amount">
                          Tổng tiền: {formatCurrency(totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <button
                      className="verify-btn"
                      onClick={() => handleVerifyOrder(orderId)}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="spinner-small" size={16} />
                          Đang xác nhận...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Xác nhận đơn hàng
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0 || loading}
              >
                Trước
              </button>
              <span className="page-info">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages - 1 || loading}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SellerPendingOrders;
