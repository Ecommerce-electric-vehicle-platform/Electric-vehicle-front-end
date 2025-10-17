import React, { useState, useEffect } from 'react';
import {
    Package,
    Truck,
    DollarSign,
    TrendingUp,
    Bell,
    Settings,
    Plus,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    AlertCircle,
    Star,
    Users,
    ShoppingCart,
    BarChart3,
    Calendar,
    MapPin,
    Phone,
    Mail
} from 'lucide-react';
import SellerNotification from '../../components/SellerNotification/SellerNotification';
import './SellerDashboard.css';

function SellerDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [sellerInfo, setSellerInfo] = useState({
        id: "seller_001",
        name: "Nguyễn Văn Minh",
        email: "minh.nguyen@email.com",
        phone: "0901234567",
        address: "123 Đường ABC, Quận 1, TP.HCM",
        rating: 4.9,
        totalSales: 156,
        joinDate: "2023-06-15",
        totalRevenue: 2450000000,
        activeProducts: 12,
        pendingOrders: 8
    });

    // Load notifications và orders từ localStorage
    useEffect(() => {
        // Load notifications
        const savedNotifications = JSON.parse(localStorage.getItem('sellerNotifications') || '[]');
        setNotifications(savedNotifications);

        // Load orders từ localStorage (từ PlaceOrder)
        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');

        // Mock data cho orders (fallback)
        const mockOrders = [
            {
                id: 'ORD001',
                customerName: 'Lê Văn An',
                customerPhone: '0901234567',
                product: 'VinFast Feliz S',
                quantity: 1,
                totalAmount: 20850000,
                status: 'pending',
                orderDate: '2024-02-20',
                deliveryAddress: '456 Đường DEF, Quận 2, TP.HCM',
                notes: 'Giao hàng vào buổi chiều'
            },
            {
                id: 'ORD002',
                customerName: 'Phạm Thị Bình',
                customerPhone: '0907654321',
                product: 'Giant M133S',
                quantity: 1,
                totalAmount: 16550000,
                status: 'preparing',
                orderDate: '2024-02-19',
                deliveryAddress: '789 Đường GHI, Quận 3, TP.HCM',
                notes: 'Kiểm tra kỹ trước khi giao'
            },
            {
                id: 'ORD003',
                customerName: 'Hoàng Văn Cường',
                customerPhone: '0909876543',
                product: 'Pin Bridgestone 36V 10Ah',
                quantity: 2,
                totalAmount: 2100000,
                status: 'shipped',
                orderDate: '2024-02-18',
                deliveryAddress: '321 Đường JKL, Quận 4, TP.HCM',
                trackingNumber: 'VN123456789'
            }
        ];

        // Kết hợp orders từ localStorage và mock data
        const allOrders = [...savedOrders, ...mockOrders];

        // Đảm bảo tất cả orders có cấu trúc đúng
        const validatedOrders = allOrders.map(order => ({
            id: order.id || 'UNKNOWN',
            customerName: order.customerName || order.buyerName || 'Khách hàng không xác định',
            customerPhone: order.customerPhone || order.buyerPhone || 'N/A',
            product: typeof order.product === 'string' ? order.product : order.product?.title || 'Sản phẩm không xác định',
            quantity: order.quantity || 1,
            totalAmount: order.totalAmount || order.finalPrice || 0,
            status: order.status || 'pending',
            orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
            deliveryAddress: order.deliveryAddress || 'Địa chỉ không xác định',
            notes: order.notes || order.deliveryNote || '',
            trackingNumber: order.trackingNumber || ''
        }));

        setOrders(validatedOrders);

        const mockProducts = [
            {
                id: 1,
                title: 'VinFast Feliz S',
                price: 20800000,
                status: 'available',
                views: 245,
                orders: 12,
                revenue: 249600000
            },
            {
                id: 3,
                title: 'Giant M133S',
                price: 16500000,
                status: 'available',
                views: 189,
                orders: 8,
                revenue: 132000000
            }
        ];
        setProducts(mockProducts);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#F59E0B';
            case 'preparing': return '#3B82F6';
            case 'shipped': return '#10B981';
            case 'delivered': return '#059669';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Chờ xử lý';
            case 'preparing': return 'Đang chuẩn bị';
            case 'shipped': return 'Đã gửi hàng';
            case 'delivered': return 'Đã giao hàng';
            case 'cancelled': return 'Đã hủy';
            default: return 'Không xác định';
        }
    };

    const handleOrderAction = (orderId, action) => {
        setOrders(prev => prev.map(order => {
            if (order.id === orderId) {
                switch (action) {
                    case 'accept':
                        return { ...order, status: 'preparing' };
                    case 'prepare':
                        return { ...order, status: 'shipped' };
                    case 'ship':
                        return { ...order, status: 'shipped', trackingNumber: 'VN' + Math.random().toString(36).substr(2, 9).toUpperCase() };
                    default:
                        return order;
                }
            }
            return order;
        }));
    };

    // Xử lý thông báo
    const handleMarkAsRead = (notificationIndex) => {
        setNotifications(prev => {
            const updated = [...prev];
            updated[notificationIndex] = { ...updated[notificationIndex], read: true };
            localStorage.setItem('sellerNotifications', JSON.stringify(updated));
            return updated;
        });
    };

    const handleViewOrder = (orderId) => {
        setShowNotifications(false);
        setActiveTab('orders');
        // Có thể thêm logic scroll đến đơn hàng cụ thể
    };

    const handleNotificationClick = () => {
        setShowNotifications(true);
    };

    const formatCurrency = (value) => {
        if (value === undefined || value === null) {
            return "0 ₫";
        }
        return value.toLocaleString("vi-VN") + " ₫";
    };

    const renderOverview = () => (
        <div className="overview-section">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon revenue">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{formatCurrency(sellerInfo.totalRevenue)}</h3>
                        <p className="stat-label">Tổng doanh thu</p>
                        <span className="stat-change positive">+12.5%</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orders">
                        <ShoppingCart size={24} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{sellerInfo.totalSales}</h3>
                        <p className="stat-label">Tổng đơn hàng</p>
                        <span className="stat-change positive">+8.2%</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon products">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{sellerInfo.activeProducts}</h3>
                        <p className="stat-label">Sản phẩm đang bán</p>
                        <span className="stat-change neutral">0%</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon pending">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{sellerInfo.pendingOrders}</h3>
                        <p className="stat-label">Đơn hàng chờ</p>
                        <span className="stat-change negative">-3.1%</span>
                    </div>
                </div>
            </div>

            <div className="recent-orders">
                <h3>Đơn hàng gần đây</h3>
                <div className="orders-list">
                    {orders.slice(0, 5).map(order => (
                        <div key={order.id} className="order-item">
                            <div className="order-info">
                                <div className="order-id">#{order.id}</div>
                                <div className="order-customer">{order.customerName}</div>
                                <div className="order-product">{typeof order.product === 'string' ? order.product : order.product?.title || 'Sản phẩm không xác định'}</div>
                            </div>
                            <div className="order-status">
                                <span
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(order.status) }}
                                >
                                    {getStatusText(order.status)}
                                </span>
                            </div>
                            <div className="order-amount">{formatCurrency(order.totalAmount || order.finalPrice || 0)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="orders-section">
            <div className="section-header">
                <h2>Quản lý đơn hàng</h2>
                <div className="filter-tabs">
                    <button className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}>Tất cả</button>
                    <button className={`filter-tab ${activeTab === 'pending' ? 'active' : ''}`}>Chờ xử lý</button>
                    <button className={`filter-tab ${activeTab === 'preparing' ? 'active' : ''}`}>Đang chuẩn bị</button>
                    <button className={`filter-tab ${activeTab === 'shipped' ? 'active' : ''}`}>Đã gửi hàng</button>
                </div>
            </div>

            <div className="orders-table">
                {orders.map(order => (
                    <div key={order.id} className="order-card">
                        <div className="order-header">
                            <div className="order-id">#{order.id}</div>
                            <div className="order-date">{order.orderDate}</div>
                            <span
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(order.status) }}
                            >
                                {getStatusText(order.status)}
                            </span>
                        </div>

                        <div className="order-details">
                            <div className="customer-info">
                                <h4>{order.customerName || 'Khách hàng không xác định'}</h4>
                                <p><Phone size={16} /> {order.customerPhone || 'N/A'}</p>
                                <p><MapPin size={16} /> {order.deliveryAddress || 'Địa chỉ không xác định'}</p>
                                {order.notes && <p><AlertCircle size={16} /> {order.notes}</p>}
                            </div>

                            <div className="product-info">
                                <h4>{typeof order.product === 'string' ? order.product : order.product?.title || 'Sản phẩm không xác định'}</h4>
                                <p>Số lượng: {order.quantity || 1}</p>
                                <p className="total-amount">{formatCurrency(order.totalAmount || order.finalPrice || 0)}</p>
                            </div>
                        </div>

                        <div className="order-actions">
                            {order.status === 'pending' && (
                                <>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleOrderAction(order.id, 'accept')}
                                    >
                                        <CheckCircle size={16} />
                                        Xác nhận đơn hàng
                                    </button>
                                    <button className="btn btn-danger">
                                        <AlertCircle size={16} />
                                        Từ chối
                                    </button>
                                </>
                            )}

                            {order.status === 'preparing' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleOrderAction(order.id, 'ship')}
                                >
                                    <Truck size={16} />
                                    Gửi hàng đến 3PL
                                </button>
                            )}

                            {order.status === 'shipped' && (
                                <div className="shipped-info">
                                    <p><strong>Mã vận đơn:</strong> {order.trackingNumber}</p>
                                    <p><strong>Trạng thái:</strong> Đã gửi đến 3PL</p>
                                </div>
                            )}

                            <button className="btn btn-secondary">
                                <Eye size={16} />
                                Chi tiết
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderProducts = () => (
        <div className="products-section">
            <div className="section-header">
                <h2>Sản phẩm của tôi</h2>
                <button className="btn btn-primary">
                    <Plus size={16} />
                    Thêm sản phẩm
                </button>
            </div>

            <div className="products-grid">
                {products.map(product => (
                    <div key={product.id} className="product-card">
                        <div className="product-image">
                            <img src="/src/assets/imgs_old/1.jpg" alt={product.title || 'Sản phẩm'} />
                        </div>
                        <div className="product-info">
                            <h4>{product.title || 'Sản phẩm không xác định'}</h4>
                            <p className="product-price">{formatCurrency(product.price || 0)}</p>
                            <div className="product-stats">
                                <span><Eye size={14} /> {product.views || 0} lượt xem</span>
                                <span><ShoppingCart size={14} /> {product.orders || 0} đơn hàng</span>
                                <span><DollarSign size={14} /> {formatCurrency(product.revenue || 0)}</span>
                            </div>
                        </div>
                        <div className="product-actions">
                            <button className="btn btn-secondary">
                                <Edit size={16} />
                                Sửa
                            </button>
                            <button className="btn btn-danger">
                                <Trash2 size={16} />
                                Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="profile-section">
            <div className="profile-header">
                <div className="profile-avatar">
                    <div className="avatar-circle">
                        <span>{sellerInfo.name.charAt(0)}</span>
                    </div>
                </div>
                <div className="profile-info">
                    <h2>{sellerInfo.name}</h2>
                    <div className="seller-rating">
                        <Star size={20} fill="#FCD34D" color="#FCD34D" />
                        <span>{sellerInfo.rating}</span>
                        <span className="rating-text">({sellerInfo.totalSales} đánh giá)</span>
                    </div>
                    <p>Tham gia từ {new Date(sellerInfo.joinDate).toLocaleDateString('vi-VN')}</p>
                </div>
            </div>

            <div className="profile-details">
                <div className="detail-group">
                    <h3>Thông tin liên hệ</h3>
                    <div className="detail-item">
                        <Mail size={20} />
                        <span>{sellerInfo.email}</span>
                    </div>
                    <div className="detail-item">
                        <Phone size={20} />
                        <span>{sellerInfo.phone}</span>
                    </div>
                    <div className="detail-item">
                        <MapPin size={20} />
                        <span>{sellerInfo.address}</span>
                    </div>
                </div>

                <div className="detail-group">
                    <h3>Thống kê bán hàng</h3>
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-label">Tổng doanh thu:</span>
                            <span className="stat-value">{formatCurrency(sellerInfo.totalRevenue)}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Tổng đơn hàng:</span>
                            <span className="stat-value">{sellerInfo.totalSales}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Sản phẩm đang bán:</span>
                            <span className="stat-value">{sellerInfo.activeProducts}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-actions">
                <button className="btn btn-primary">
                    <Edit size={16} />
                    Chỉnh sửa thông tin
                </button>
                <button className="btn btn-secondary">
                    <Settings size={16} />
                    Cài đặt tài khoản
                </button>
            </div>
        </div>
    );

    return (
        <div className="seller-dashboard">
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>Seller Dashboard</h1>
                    <p>Chào mừng trở lại, {sellerInfo.name}!</p>
                </div>
                <div className="header-right">
                    <button className="notification-btn" onClick={handleNotificationClick}>
                        <Bell size={20} />
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
                        )}
                    </button>
                    <button className="settings-btn">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="sidebar">
                    <nav className="sidebar-nav">
                        <button
                            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <BarChart3 size={20} />
                            Tổng quan
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            <ShoppingCart size={20} />
                            Đơn hàng
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                            onClick={() => setActiveTab('products')}
                        >
                            <Package size={20} />
                            Sản phẩm
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <Users size={20} />
                            Hồ sơ
                        </button>
                    </nav>
                </div>

                <div className="main-content">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'orders' && renderOrders()}
                    {activeTab === 'products' && renderProducts()}
                    {activeTab === 'profile' && renderProfile()}
                </div>
            </div>

            {/* Seller Notification Modal */}
            <SellerNotification
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onViewOrder={handleViewOrder}
            />
        </div>
    );
}

export default SellerDashboard;
