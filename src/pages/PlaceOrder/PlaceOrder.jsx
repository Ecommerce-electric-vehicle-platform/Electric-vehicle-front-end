import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    Phone,
    User,
    CreditCard,
    Truck,
    CheckCircle,
    AlertCircle,
    Clock,
    Package,
    Home,
    Wallet,
    XCircle,
    ShoppingCart,
    Settings
} from 'lucide-react';
import { vehicleProducts, batteryProducts, formatCurrency } from '../../test-mock-data/data/productsData';
import DebugPanel from '../../components/DebugPanel/DebugPanel';
import TestEnvironmentSetup from '../../test-mock-data/components/TestEnvironmentSetup/TestEnvironmentSetup';
import './PlaceOrder.css';

function PlaceOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [product, setProduct] = useState(null);
    const [isGuest, setIsGuest] = useState(true);

    // States cho các bước kiểm tra
    const [validationStep, setValidationStep] = useState('checking'); // checking, wallet_required, product_check, seller_check, payment, success
    const [hasWallet, setHasWallet] = useState(false);
    const [productAvailable, setProductAvailable] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        type: 'info', // info, warning, error, success
        title: '',
        message: '',
        actions: []
    });

    const [orderData, setOrderData] = useState({
        // Core order information
        order_id: null,
        order_code: '',
        status: 'pending', // Mặc định pending khi buyer đặt hàng

        // User and admin information
        admin_id: null,
        buyer_id: null,

        // Product and shipping information
        post_product_id: null,
        shipping_partner_id: null,
        shipping_address: '',
        phone_number: '',
        shipping_fee: 0,

        // Additional order details
        buyer_name: '',
        buyer_email: '',
        buyer_address: '',
        delivery_phone: '',
        delivery_note: '',
        payment_method: 'wallet', // wallet, cod
        quantity: 1,
        total_price: 0,
        final_price: 0,

        // Invoice information
        need_order_invoice: false, // true, false

        // Timestamps
        created_at: null,
        updated_at: null,
        cancel_at: null,
        cancel_reason: ''
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState(null);

    // Generate unique order code
    const generateOrderCode = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD${timestamp}${random}`;
    };

    // Kiểm tra đăng nhập
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsGuest(!token);

        if (!token) {
            navigate('/signin');
            return;
        }

        // Validation sẽ được bắt đầu tự động khi product được load
    }, [navigate]);

    // Tìm sản phẩm
    useEffect(() => {
        console.log('🔍 Debug product search:');
        console.log('   Looking for product ID:', id);

        const allProducts = [...vehicleProducts, ...batteryProducts];
        console.log('   Total products available:', allProducts.length);
        console.log('   Available product IDs:', allProducts.map(p => p.id));

        const foundProduct = allProducts.find(p => p.id === parseInt(id));
        console.log('   Found product:', foundProduct);

        setProduct(foundProduct);

        if (foundProduct) {
            console.log('   ✅ Product found, setting up order data');
            const defaultShippingFee = 50000;
            setOrderData(prev => ({
                ...prev,
                post_product_id: foundProduct.id,
                total_price: foundProduct.price,
                shipping_fee: defaultShippingFee,
                final_price: foundProduct.price + defaultShippingFee,
                order_code: generateOrderCode()
            }));
        } else {
            console.log('   ❌ Product not found');
        }
    }, [id]);

    // Lấy thông tin từ state (chỉ khi có product trong state và chưa có product từ URL)
    useEffect(() => {
        if (location.state?.product && !product) {
            console.log('🔍 Setting product from location.state:', location.state.product);
            setProduct(location.state.product);
            const defaultShippingFee = 50000;
            setOrderData(prev => ({
                ...prev,
                post_product_id: location.state.product.id,
                total_price: location.state.product.price,
                shipping_fee: defaultShippingFee,
                final_price: location.state.product.price + defaultShippingFee,
                order_code: generateOrderCode()
            }));
        }
    }, [location.state, product]);

    // Tự động bắt đầu validation khi product đã được load
    useEffect(() => {
        if (product && validationStep === 'checking') {
            console.log('🔍 Product loaded, starting validation...');
            startValidationProcess();
        }
    }, [product]);

    // Quy trình kiểm tra validation
    const startValidationProcess = async () => {
        console.log('🚀 Starting validation process...');
        console.log('🔍 Current product state:', product);
        console.log('🔍 Product ID from URL:', id);
        setValidationStep('checking');

        // Giả lập delay để hiển thị loading
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Bước 1: Kiểm tra ví điện tử
        console.log('🔍 Step 1: Checking wallet...');
        const walletLinked = checkWalletStatus();

        if (!walletLinked) {
            console.log('   ❌ Wallet not linked');
            setValidationStep('wallet_required');
            showWalletRequiredModal();
            return;
        }
        console.log('   ✅ Wallet is linked');

        // Bước 2: Kiểm tra trạng thái sản phẩm
        console.log('🔍 Step 2: Checking product availability...');
        console.log('🔍 Product before availability check:', product);

        // Đảm bảo product có sẵn trước khi kiểm tra
        if (!product) {
            console.log('   ❌ No product available for checking');
            setValidationStep('product_unavailable');
            showProductUnavailableModal();
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        const productStatus = checkProductAvailability();

        if (!productStatus.available) {
            console.log('   ❌ Product not available:', productStatus.reason);
            setValidationStep('product_unavailable');
            showProductUnavailableModal();
            return;
        }
        console.log('   ✅ Product is available');

        // Bước 3: Kiểm tra người bán (nếu có nhiều sản phẩm trong giỏ)
        console.log('🔍 Step 3: Checking multiple sellers...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const sellerCheck = checkMultipleSellers();

        if (!sellerCheck.valid) {
            console.log('   ❌ Multiple sellers detected');
            setValidationStep('multiple_sellers');
            showMultipleSellersModal();
            return;
        }
        console.log('   ✅ Single seller confirmed');

        // Tất cả kiểm tra đều pass -> chuyển sang form đặt hàng
        console.log('✅ All validations passed, proceeding to payment form');
        setValidationStep('payment');
    };

    // Kiểm tra trạng thái ví
    const checkWalletStatus = () => {
        // Giả lập kiểm tra ví - trong thực tế sẽ gọi API
        const walletStatus = localStorage.getItem('walletLinked');
        const isLinked = walletStatus === 'true';
        setHasWallet(isLinked);

        // Giả lập: Nếu chưa có setting thì mặc định là đã liên kết để test flow
        if (walletStatus === null) {
            localStorage.setItem('walletLinked', 'true');
            setHasWallet(true);
            return true;
        }

        return isLinked;
    };

    // Kiểm tra sản phẩm còn hàng
    const checkProductAvailability = () => {
        console.log('🔍 Debug checkProductAvailability:');
        console.log('   Product:', product);
        console.log('   Product ID:', product?.id);
        console.log('   Product Status:', product?.status);

        // Giả lập kiểm tra - trong thực tế sẽ gọi API
        if (product) {
            // Giả lập: Có thể test các trường hợp khác nhau
            const testScenario = localStorage.getItem('testProductScenario');
            console.log('   Test Scenario:', testScenario);

            if (testScenario === 'sold') {
                console.log('   ❌ Test scenario: SOLD');
                setProductAvailable(false);
                return { available: false, reason: 'Sản phẩm đã được bán' };
            }

            if (testScenario === 'unavailable') {
                console.log('   ❌ Test scenario: UNAVAILABLE');
                setProductAvailable(false);
                return { available: false, reason: 'Sản phẩm tạm thời không có sẵn' };
            }

            // Kiểm tra trạng thái thực tế của sản phẩm
            if (product.status === 'sold') {
                console.log('   ❌ Product status: SOLD');
                setProductAvailable(false);
                return { available: false, reason: 'Sản phẩm đã được bán' };
            }

            if (product.status === 'unavailable') {
                console.log('   ❌ Product status: UNAVAILABLE');
                setProductAvailable(false);
                return { available: false, reason: 'Sản phẩm tạm thời không có sẵn' };
            }

            // Mặc định: sản phẩm có sẵn
            console.log('   ✅ Product is AVAILABLE');
            setProductAvailable(true);
            return { available: true, reason: null };
        }
        console.log('   ❌ No product found');
        return { available: false, reason: 'Không tìm thấy sản phẩm' };
    };

    // Kiểm tra nhiều người bán
    const checkMultipleSellers = () => {
        // Giả lập kiểm tra - trong thực tế sẽ kiểm tra giỏ hàng
        const testScenario = localStorage.getItem('testMultipleSellers');

        if (testScenario === 'true') {
            return {
                valid: false,
                sellers: ['seller1', 'seller2'],
                message: 'Mỗi đơn hàng chỉ được chứa sản phẩm từ một người bán'
            };
        }

        // Mặc định: chỉ có 1 người bán (valid)
        return { valid: true, sellers: ['seller1'] };
    };

    // Hiển thị modal yêu cầu liên kết ví
    const showWalletRequiredModal = () => {
        setModalConfig({
            type: 'warning',
            title: 'Yêu cầu liên kết ví điện tử',
            message: 'Bạn cần liên kết ví điện tử để có thể đặt hàng. Vui lòng liên kết ví trong trang cá nhân.',
            actions: [
                {
                    label: 'Liên kết ví ngay',
                    type: 'primary',
                    onClick: () => {
                        setShowModal(false);
                        navigate('/profile');
                    }
                },
                {
                    label: 'Quay lại',
                    type: 'secondary',
                    onClick: () => {
                        setShowModal(false);
                        navigate(-1);
                    }
                }
            ]
        });
        setShowModal(true);
    };

    // Hiển thị modal sản phẩm hết hàng
    const showProductUnavailableModal = () => {
        setModalConfig({
            type: 'error',
            title: 'Sản phẩm không còn hàng',
            message: 'Rất tiếc, sản phẩm này đã được bán hoặc không còn hàng. Vui lòng chọn sản phẩm khác.',
            actions: [
                {
                    label: 'Xem sản phẩm tương tự',
                    type: 'primary',
                    onClick: () => {
                        setShowModal(false);
                        navigate('/products');
                    }
                },
                {
                    label: 'Về trang chủ',
                    type: 'secondary',
                    onClick: () => {
                        setShowModal(false);
                        navigate('/');
                    }
                }
            ]
        });
        setShowModal(true);
    };

    // Hiển thị modal nhiều người bán
    const showMultipleSellersModal = () => {
        setModalConfig({
            type: 'warning',
            title: 'Không thể đặt hàng',
            message: 'Mỗi đơn hàng chỉ được chứa sản phẩm từ một người bán. Vui lòng tách đơn thành nhiều đơn hàng riêng.',
            actions: [
                {
                    label: 'Xem giỏ hàng',
                    type: 'primary',
                    onClick: () => {
                        setShowModal(false);
                        navigate('/cart');
                    }
                },
                {
                    label: 'Quay lại',
                    type: 'secondary',
                    onClick: () => {
                        setShowModal(false);
                        navigate(-1);
                    }
                }
            ]
        });
        setShowModal(true);
    };

    // Xử lý thay đổi input
    const handleInputChange = (field, value) => {
        setOrderData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Tính phí ship
    const calculateShippingFee = (address) => {
        if (!address) return 0;

        if (address.includes('TP.HCM') || address.includes('Hà Nội')) {
            return 50000;
        } else if (address.includes('Đà Nẵng') || address.includes('Cần Thơ') || address.includes('Hải Phòng')) {
            return 100000;
        } else {
            return 150000;
        }
    };

    // Xử lý thay đổi địa chỉ
    const handleDeliveryAddressChange = (value) => {
        const shippingFee = calculateShippingFee(value);
        setOrderData(prev => ({
            ...prev,
            shipping_address: value,
            shipping_fee: shippingFee,
            final_price: prev.total_price + shippingFee
        }));
    };

    // Kiểm tra form hợp lệ
    const isFormValid = () => {
        const basicValidation = orderData.buyer_name.trim() &&
            orderData.phone_number.trim() &&
            orderData.buyer_email.trim() &&
            orderData.shipping_address.trim() &&
            orderData.delivery_phone.trim();

        // Nếu cần xuất hóa đơn đơn hàng, không cần validation thêm
        // Chỉ cần thông tin cơ bản của người mua
        return basicValidation;
    };

    // Xử lý đặt hàng
    const handlePlaceOrder = async () => {
        if (!isFormValid()) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setIsSubmitting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const newOrderId = 'ORD' + Date.now();
            setOrderId(newOrderId);

            // Cập nhật orderData với thông tin đầy đủ
            const completeOrderData = {
                ...orderData,
                order_id: newOrderId,
                order_code: orderData.order_code || generateOrderCode(),
                status: 'pending', // Mặc định là pending khi buyer đặt hàng
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                buyer_id: localStorage.getItem('userId') || null,
                admin_id: null, // Sẽ được set bởi admin khi xử lý
                shipping_partner_id: null, // Sẽ được set bởi admin khi chọn đối tác vận chuyển
                estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at: null, // Chỉ set khi admin hủy đơn hàng
                cancel_reason: '' // Chỉ set khi admin hủy đơn hàng
            };

            const order = {
                ...completeOrderData,
                product: product
            };

            const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            existingOrders.push(order);
            localStorage.setItem('orders', JSON.stringify(existingOrders));

            // Tạo thông báo cho seller
            createSellerNotification(order);

            setCurrentStep(3);
        } catch (error) {
            alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Navigation handlers
    const handleGoBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigate(-1);
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleViewOrder = () => {
        navigate(`/order-tracking/${orderId}`);
    };

    // Tạo thông báo cho seller
    const createSellerNotification = (order) => {
        const notification = {
            id: Date.now().toString(),
            type: 'new_order',
            title: 'Đơn hàng mới',
            message: `Bạn có đơn hàng mới từ ${order.buyerName}`,
            timestamp: new Date().toISOString(),
            read: false,
            orderId: order.id,
            orderDetails: {
                id: order.id,
                customerName: order.buyerName,
                customerPhone: order.buyerPhone,
                deliveryAddress: order.deliveryAddress,
                product: product.title,
                totalAmount: order.finalPrice
            }
        };

        // Lưu thông báo vào localStorage
        const existingNotifications = JSON.parse(localStorage.getItem('sellerNotifications') || '[]');
        existingNotifications.unshift(notification); // Thêm vào đầu danh sách
        localStorage.setItem('sellerNotifications', JSON.stringify(existingNotifications));

        console.log('🔔 Đã tạo thông báo cho seller:', notification);
    };

    if (isGuest) {
        return null;
    }

    if (!product) {
        return (
            <div className="place-order-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin sản phẩm...</p>
            </div>
        );
    }

    // Hiển thị màn hình kiểm tra
    if (validationStep === 'checking') {
        return (
            <div className="place-order-page">
                <div className="validation-screen">
                    <div className="validation-content">
                        <div className="loading-spinner"></div>
                        <h3>Đang kiểm tra thông tin</h3>
                        <p>Vui lòng đợi trong giây lát...</p>
                        <div className="validation-steps">
                            <div className="validation-step active">
                                <Wallet className="step-icon" />
                                <span>Kiểm tra ví điện tử</span>
                            </div>
                            <div className="validation-step">
                                <Package className="step-icon" />
                                <span>Kiểm tra sản phẩm</span>
                            </div>
                            <div className="validation-step">
                                <ShoppingCart className="step-icon" />
                                <span>Kiểm tra đơn hàng</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Hiển thị modal nếu có lỗi
    if (showModal && validationStep !== 'payment') {
        return (
            <div className="place-order-page">
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="validation-modal" onClick={(e) => e.stopPropagation()}>
                        <div className={`modal-icon ${modalConfig.type}`}>
                            {modalConfig.type === 'warning' && <AlertCircle size={48} />}
                            {modalConfig.type === 'error' && <XCircle size={48} />}
                            {modalConfig.type === 'success' && <CheckCircle size={48} />}
                        </div>
                        <h3 className="modal-title">{modalConfig.title}</h3>
                        <p className="modal-message">{modalConfig.message}</p>
                        <div className="modal-actions">
                            {modalConfig.actions.map((action, index) => (
                                <button
                                    key={index}
                                    className={`btn btn-${action.type}`}
                                    onClick={action.onClick}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="place-order-page">
            <TestEnvironmentSetup />
            <div className="place-order-container">
                {/* Header */}
                <div className="place-order-header">
                    <div className="breadcrumb-nav">
                        <button className="breadcrumb-btn" onClick={handleGoHome}>
                            <Home size={16} />
                            <span>Trang chủ</span>
                        </button>
                        <span className="breadcrumb-separator">/</span>
                        <button className="breadcrumb-btn" onClick={handleGoBack}>
                            <ArrowLeft size={16} />
                            <span>Quay lại</span>
                        </button>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-current">Đặt hàng</span>
                    </div>

                    <h1 className="page-title">Đặt hàng</h1>

                    {/* Debug Button */}
                    <button
                        className="debug-toggle-btn"
                        onClick={() => setShowDebugPanel(true)}
                        title="Mở Debug Panel"
                    >
                        <Settings size={16} />
                        Debug
                    </button>

                    {/* Progress Steps */}
                    <div className="progress-steps">
                        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                            <div className="step-number">1</div>
                            <div className="step-label">Thông tin</div>
                        </div>
                        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                            <div className="step-number">2</div>
                            <div className="step-label">Xác nhận</div>
                        </div>
                        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <div className="step-label">Hoàn thành</div>
                        </div>
                    </div>
                </div>

                <div className="place-order-content">
                    {/* Cột trái - Form */}
                    <div className="order-form-column">
                        {currentStep === 1 && (
                            <div className="order-form">
                                {/* Thông tin người mua */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <User className="section-icon" />
                                        Thông tin người mua
                                    </h3>
                                    <div className="form-group">
                                        <label className="form-label">Họ và tên *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={orderData.buyer_name}
                                            onChange={(e) => handleInputChange('buyer_name', e.target.value)}
                                            placeholder="Nhập họ và tên"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Số điện thoại *</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={orderData.phone_number}
                                            onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={orderData.buyer_email}
                                            onChange={(e) => handleInputChange('buyer_email', e.target.value)}
                                            placeholder="Nhập email"
                                        />
                                    </div>
                                </div>

                                {/* Thông tin đơn hàng */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <Settings className="section-icon" />
                                        Thông tin đơn hàng
                                    </h3>
                                    <div className="form-group">
                                        <label className="form-label">Mã đơn hàng</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={orderData.order_code}
                                            readOnly
                                            style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                                        />
                                        <small className="form-help">Mã đơn hàng được tạo tự động</small>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Trạng thái đơn hàng</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value="Chờ xử lý"
                                            readOnly
                                            style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                                        />
                                        <small className="form-help">Trạng thái sẽ được cập nhật bởi hệ thống</small>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Đối tác vận chuyển</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value="Sẽ được chọn sau khi xác nhận đơn hàng"
                                            readOnly
                                            style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                                        />
                                        <small className="form-help">Đối tác vận chuyển sẽ được chọn bởi admin</small>
                                    </div>
                                </div>

                                {/* Thông tin giao hàng */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <MapPin className="section-icon" />
                                        Thông tin giao hàng
                                    </h3>
                                    <div className="form-group">
                                        <label className="form-label">Địa chỉ giao hàng *</label>
                                        <textarea
                                            className="form-textarea"
                                            value={orderData.shipping_address}
                                            onChange={(e) => handleDeliveryAddressChange(e.target.value)}
                                            placeholder="Nhập địa chỉ giao hàng chi tiết"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Số điện thoại nhận hàng *</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={orderData.delivery_phone}
                                            onChange={(e) => handleInputChange('delivery_phone', e.target.value)}
                                            placeholder="Nhập số điện thoại nhận hàng"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ghi chú giao hàng</label>
                                        <textarea
                                            className="form-textarea"
                                            value={orderData.delivery_note}
                                            onChange={(e) => handleInputChange('delivery_note', e.target.value)}
                                            placeholder="Ghi chú thêm cho người giao hàng"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                {/* Phương thức thanh toán */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <CreditCard className="section-icon" />
                                        Phương thức thanh toán
                                    </h3>
                                    <div className="payment-methods">
                                        <label className="payment-option">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="wallet"
                                                checked={orderData.payment_method === 'wallet'}
                                                onChange={(e) => handleInputChange('payment_method', e.target.value)}
                                            />
                                            <div className="payment-info">
                                                <div className="payment-name">
                                                    <Wallet size={20} />
                                                    Ví điện tử
                                                </div>
                                                <div className="payment-desc">Thanh toán qua ví điện tử đã liên kết</div>
                                            </div>
                                        </label>
                                        <label className="payment-option">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={orderData.payment_method === 'cod'}
                                                onChange={(e) => handleInputChange('payment_method', e.target.value)}
                                            />
                                            <div className="payment-info">
                                                <div className="payment-name">
                                                    <Package size={20} />
                                                    Thanh toán khi nhận hàng (COD)
                                                </div>
                                                <div className="payment-desc">Thanh toán bằng tiền mặt khi nhận hàng</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Xuất hóa đơn đơn hàng */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <Package className="section-icon" />
                                        Xuất hóa đơn đơn hàng
                                    </h3>

                                    <div className="invoice-question">
                                        <div className="invoice-question-text">
                                            Quý khách có muốn xuất hóa đơn cho đơn hàng này không?
                                        </div>
                                        <div className="invoice-options">
                                            <label className="invoice-option">
                                                <input
                                                    type="radio"
                                                    name="needOrderInvoice"
                                                    value="true"
                                                    checked={orderData.need_order_invoice === true}
                                                    onChange={(e) => handleInputChange('need_order_invoice', e.target.value === 'true')}
                                                />
                                                <span className="invoice-option-label">Có</span>
                                            </label>
                                            <label className="invoice-option">
                                                <input
                                                    type="radio"
                                                    name="needOrderInvoice"
                                                    value="false"
                                                    checked={orderData.need_order_invoice === false}
                                                    onChange={(e) => handleInputChange('need_order_invoice', e.target.value === 'true')}
                                                />
                                                <span className="invoice-option-label">Không</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* )} */}
                                </div>

                                <div className="form-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setCurrentStep(2)}
                                        disabled={!isFormValid()}
                                    >
                                        Tiếp tục
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="order-confirmation">
                                <h3 className="section-title">Xác nhận đơn hàng</h3>

                                <div className="confirmation-section">
                                    <h4>Thông tin người mua</h4>
                                    <div className="info-item">
                                        <span className="info-label">Họ tên:</span>
                                        <span className="info-value">{orderData.buyer_name}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Số điện thoại:</span>
                                        <span className="info-value">{orderData.phone_number}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Email:</span>
                                        <span className="info-value">{orderData.buyer_email}</span>
                                    </div>
                                </div>

                                <div className="confirmation-section">
                                    <h4>Thông tin giao hàng</h4>
                                    <div className="info-item">
                                        <span className="info-label">Địa chỉ:</span>
                                        <span className="info-value">{orderData.shipping_address}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Số điện thoại:</span>
                                        <span className="info-value">{orderData.delivery_phone}</span>
                                    </div>
                                    {orderData.delivery_note && (
                                        <div className="info-item">
                                            <span className="info-label">Ghi chú:</span>
                                            <span className="info-value">{orderData.delivery_note}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="confirmation-section">
                                    <h4>Thông tin đơn hàng</h4>
                                    <div className="info-item">
                                        <span className="info-label">Mã đơn hàng:</span>
                                        <span className="info-value">{orderData.order_code}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Trạng thái:</span>
                                        <span className="info-value">Chờ xử lý</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Đối tác vận chuyển:</span>
                                        <span className="info-value">Sẽ được chọn sau khi xác nhận</span>
                                    </div>
                                </div>

                                <div className="confirmation-section">
                                    <h4>Phương thức thanh toán</h4>
                                    <div className="info-item">
                                        <span className="info-label">Phương thức:</span>
                                        <span className="info-value">
                                            {orderData.payment_method === 'wallet' ? 'Ví điện tử' : 'Thanh toán khi nhận hàng'}
                                        </span>
                                    </div>
                                </div>

                                <div className="confirmation-section">
                                    <h4>Xuất hóa đơn đơn hàng</h4>
                                    <div className="info-item">
                                        <span className="info-label">Xuất hóa đơn:</span>
                                        <span className="info-value">
                                            {orderData.need_order_invoice ? 'Có' : 'Không'}
                                        </span>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setCurrentStep(1)}
                                    >
                                        Quay lại
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handlePlaceOrder}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="order-success">
                                <div className="success-icon">
                                    <CheckCircle size={64} color="#28a745" />
                                </div>
                                <h3 className="success-title">Đặt hàng thành công!</h3>
                                <p className="success-message">
                                    Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
                                </p>

                                <div className="order-info">
                                    <div className="info-item">
                                        <span className="info-label">Mã đơn hàng:</span>
                                        <span className="info-value">{orderId}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Dự kiến giao hàng:</span>
                                        <span className="info-value">
                                            {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>

                                <div className="success-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleGoHome}
                                    >
                                        Về trang chủ
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleViewOrder}
                                    >
                                        Theo dõi đơn hàng
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cột phải - Thông tin sản phẩm */}
                    <div className="order-summary-column">
                        <div className="space-y-6">
                            <div className="card sticky top-4">
                                <div className="card-header">
                                    <h3 className="card-title">Tóm tắt đơn hàng</h3>
                                </div>
                                <div className="card-content space-y-4">
                                    <div className="rounded-lg bg-muted p-3 space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Mã đơn hàng:</span>
                                            <span className="font-mono text-xs text-foreground">{orderData.order_code}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Trạng thái:</span>
                                            <span className="badge badge-secondary text-xs">
                                                Chờ xác nhận
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Ngày tạo:</span>
                                            <span className="text-xs text-foreground">{new Date().toLocaleDateString("vi-VN")}</span>
                                        </div>
                                    </div>

                                    <div className="separator"></div>

                                    <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                                        <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-card-foreground">{product.title}</h3>
                                            <p className="text-sm text-muted-foreground">{product.brand} • {product.model}</p>
                                            <p className="text-xs text-muted-foreground font-mono mt-1">ID: PROD-{product.id}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="badge badge-accent">
                                                Đã kiểm định
                                            </span>
                                            <span className="badge badge-outline">{product.conditionLevel}</span>
                                        </div>
                                    </div>

                                    <div className="separator"></div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Giá sản phẩm</span>
                                            <span className="font-medium text-foreground">{formatCurrency(orderData.total_price)}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Phí kiểm định</span>
                                            <span className="font-medium text-foreground">500.000₫</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Phí vận chuyển</span>
                                            <span className="font-medium text-foreground">{formatCurrency(orderData.shipping_fee)}</span>
                                        </div>

                                        <div className="separator"></div>

                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground">Tổng cộng</span>
                                            <span className="text-2xl font-bold text-foreground">{formatCurrency(orderData.final_price)}</span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-accent/20 p-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <span className="font-semibold text-foreground">Cam kết chất lượng</span>
                                        </div>
                                        <ul className="space-y-1 text-sm text-muted-foreground">
                                            <li>✓ Kiểm định kỹ thuật 100%</li>
                                            <li>✓ Bảo hành 6 tháng</li>
                                            <li>✓ Đổi trả trong 7 ngày</li>
                                            <li>✓ Hỗ trợ trả góp 0%</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title text-base">Cần hỗ trợ?</h3>
                                </div>
                                <div className="card-content space-y-3">
                                    <div className="flex items-start gap-3">
                                        <svg className="mt-0.5 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                            />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Hotline: 1900 xxxx</p>
                                            <p className="text-xs text-muted-foreground">Hỗ trợ 24/7</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <svg className="mt-0.5 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">support@evmarket.vn</p>
                                            <p className="text-xs text-muted-foreground">Phản hồi trong 2h</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Debug Panel */}
            <DebugPanel
                isOpen={showDebugPanel}
                onClose={() => setShowDebugPanel(false)}
            />
        </div>
    );
}

export default PlaceOrder;

//Hello
