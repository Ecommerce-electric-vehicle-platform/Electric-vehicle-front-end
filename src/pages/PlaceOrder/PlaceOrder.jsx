import React, { useState, useEffect, useCallback } from 'react';
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
    Settings,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { vehicleProducts, batteryProducts, formatCurrency } from '../../test-mock-data/data/productsData';
import {
    getShippingPartners,
    placeOrder
} from '../../api/orderApi';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import './PlaceOrder.css';

function PlaceOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [product, setProduct] = useState(null);
    const [isGuest, setIsGuest] = useState(true);

    // States cho các bước kiểm tra
    const [validationStep, setValidationStep] = useState('checking'); // checking, product_check, seller_check, payment, success
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        type: 'info', // info, warning, error, success
        title: '',
        message: '',
        actions: []
    });

    // API data states
    const [shippingPartners, setShippingPartners] = useState([]);
    const [showShippingOptions, setShowShippingOptions] = useState(false);

    // Sử dụng custom hook để quản lý số dư ví
    const { balance: walletBalance, loading: walletLoading, error: walletError, refreshBalance: refreshWalletBalance, formatCurrency: formatWalletCurrency } = useWalletBalance();
    const [, setUserProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [orderData, setOrderData] = useState({
        // API required fields only
        postProductId: null,
        username: '', // This will be the username for API
        shippingAddress: '',
        phoneNumber: '',
        shippingPartnerId: 1, // Default to Fast Delivery (id = 1)
        paymentId: 1, // Default to e-wallet payment

        // UI display fields (not sent to API)
        shippingFee: 0,
        total_price: 0,
        final_price: 0,
        buyer_name: '',
        buyer_email: '',
        delivery_phone: '',
        delivery_note: '',
        need_order_invoice: false
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

    // Load user profile
    const loadUserProfile = useCallback(async () => {
        setLoadingProfile(true);
        try {
            // Lấy thông tin từ localStorage hoặc gọi API profile
            const username = localStorage.getItem('username') || 'user123';
            const email = localStorage.getItem('email') || 'user@example.com';
            const phone = localStorage.getItem('phone') || '+84911213150';
            const address = localStorage.getItem('address') || '123 Đường ABC, Quận 1, TP.HCM';

            const profile = {
                username: username,
                email: email,
                phone: phone,
                address: address,
                fullName: localStorage.getItem('fullName') || 'Nguyễn Văn A'
            };

            setUserProfile(profile);

            // Cập nhật orderData với thông tin từ profile
            setOrderData(prev => ({
                ...prev,
                username: profile.username,
                buyer_name: profile.fullName,
                buyer_email: profile.email,
                phoneNumber: profile.phone,
                shippingAddress: profile.address,
                delivery_phone: profile.phone
            }));

        } catch (error) {
            console.error('Error loading user profile:', error);
            // Set default profile data
            const defaultProfile = {
                username: 'user123',
                email: 'user@example.com',
                phone: '+84911213150',
                address: '123 Đường ABC, Quận 1, TP.HCM',
                fullName: 'Nguyễn Văn A'
            };
            setUserProfile(defaultProfile);

            setOrderData(prev => ({
                ...prev,
                username: defaultProfile.username,
                buyer_name: defaultProfile.fullName,
                buyer_email: defaultProfile.email,
                phoneNumber: defaultProfile.phone,
                shippingAddress: defaultProfile.address,
                delivery_phone: defaultProfile.phone
            }));
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    // Load API data
    const loadApiData = useCallback(async () => {
        try {
            const shippingData = await getShippingPartners();
            setShippingPartners(shippingData || []);
        } catch (error) {
            console.error('Error loading shipping partners:', error);
            // Set default shipping partners if API fails
            setShippingPartners([
                { id: 1, name: 'Fast Delivery', description: 'Giao hàng nhanh trong 24h', fee: 50000 },
                { id: 2, name: 'Standard Delivery', description: 'Giao hàng tiêu chuẩn 2-3 ngày', fee: 30000 },
                { id: 3, name: 'Economy Delivery', description: 'Giao hàng tiết kiệm 3-5 ngày', fee: 20000 }
            ]);
        }
    }, []);


    // Kiểm tra đăng nhập và load data
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const legacyToken = localStorage.getItem('token');

        // Có token nào đó thì không phải guest
        const hasToken = accessToken || refreshToken || legacyToken;
        setIsGuest(!hasToken);

        // Nếu không có token nào thì redirect về signin
        if (!hasToken) {
            navigate('/signin');
            return;
        }

        // Load user profile và API data
        loadUserProfile();
        loadApiData();
    }, [navigate, loadUserProfile, loadApiData]);

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
            const defaultShippingFee = 50000; // Fast Delivery fee
            setOrderData(prev => ({
                ...prev,
                postProductId: foundProduct.id,
                total_price: foundProduct.price,
                shippingFee: defaultShippingFee,
                final_price: foundProduct.price + defaultShippingFee,
                order_code: generateOrderCode(),
                username: localStorage.getItem('username') || ''
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
                postProductId: location.state.product.id,
                total_price: location.state.product.price,
                shippingFee: defaultShippingFee,
                final_price: location.state.product.price + defaultShippingFee,
                order_code: generateOrderCode(),
                username: localStorage.getItem('username') || ''
            }));
        }
    }, [location.state, product]);

    // Kiểm tra sản phẩm còn hàng
    const checkProductAvailability = useCallback(() => {
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
                return { available: false, reason: 'Sản phẩm đã được bán' };
            }

            if (testScenario === 'unavailable') {
                console.log('   ❌ Test scenario: UNAVAILABLE');
                return { available: false, reason: 'Sản phẩm tạm thời không có sẵn' };
            }

            // Kiểm tra trạng thái thực tế của sản phẩm
            if (product.status === 'sold') {
                console.log('   ❌ Product status: SOLD');
                return { available: false, reason: 'Sản phẩm đã được bán' };
            }

            if (product.status === 'unavailable') {
                console.log('   ❌ Product status: UNAVAILABLE');
                return { available: false, reason: 'Sản phẩm tạm thời không có sẵn' };
            }

            // Mặc định: sản phẩm có sẵn
            console.log('   ✅ Product is AVAILABLE');
            return { available: true, reason: null };
        }
        console.log('   ❌ No product found');
        return { available: false, reason: 'Không tìm thấy sản phẩm' };
    }, [product]);

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

    // Hiển thị modal sản phẩm hết hàng
    const showProductUnavailableModal = useCallback(() => {
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
    }, [navigate]);

    // Hiển thị modal nhiều người bán
    const showMultipleSellersModal = useCallback(() => {
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
    }, [navigate]);

    // Quy trình kiểm tra validation
    const startValidationProcess = useCallback(async () => {
        console.log('🚀 Starting validation process...');
        console.log('🔍 Current product state:', product);
        console.log('🔍 Product ID from URL:', id);
        setValidationStep('checking');

        // Giả lập delay để hiển thị loading
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Bước 1: Kiểm tra trạng thái sản phẩm
        console.log('🔍 Step 1: Checking product availability...');
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

        // Bước 2: Kiểm tra người bán (nếu có nhiều sản phẩm trong giỏ)
        console.log('🔍 Step 2: Checking multiple sellers...');
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
    }, [product, id, checkProductAvailability, showMultipleSellersModal, showProductUnavailableModal]);

    // Tự động bắt đầu validation khi product đã được load
    useEffect(() => {
        if (product && validationStep === 'checking') {
            console.log('🔍 Product loaded, starting validation...');
            startValidationProcess();
        }
    }, [product, validationStep, startValidationProcess]);

    // Hiển thị modal số dư không đủ
    const showInsufficientBalanceModal = useCallback((neededAmount) => {
        setModalConfig({
            type: 'warning',
            title: 'Số dư ví không đủ',
            message: `Số dư ví của bạn không đủ để thanh toán số tiền ${formatCurrency(neededAmount)}. Vui lòng nạp tiền để tiếp tục.`,
            actions: [
                {
                    label: 'Nạp tiền ngay',
                    type: 'primary',
                    onClick: () => {
                        setShowModal(false);
                        navigate('/wallet/deposit');
                    }
                },
                {
                    label: 'Quay lại',
                    type: 'secondary',
                    onClick: () => setShowModal(false)
                }
            ]
        });
        setShowModal(true);
    }, [navigate]);

    // Xử lý thay đổi input
    const handleInputChange = (field, value) => {
        setOrderData(prev => ({
            ...prev,
            [field]: value
        }));
    };


    // Xử lý thay đổi địa chỉ
    const handleDeliveryAddressChange = (value) => {
        const selectedPartner = shippingPartners.find(p => p.id === orderData.shippingPartnerId);
        const shippingFee = selectedPartner?.fee || 50000;
        setOrderData(prev => ({
            ...prev,
            shippingAddress: value,
            shippingFee: shippingFee,
            final_price: prev.total_price + shippingFee
        }));
    };

    // Xử lý thay đổi đối tác vận chuyển
    const handleShippingPartnerChange = (partnerId) => {
        const selectedPartner = shippingPartners.find(p => p.id === partnerId);
        const shippingFee = selectedPartner?.fee || 50000;
        setOrderData(prev => ({
            ...prev,
            shippingPartnerId: partnerId,
            shippingFee: shippingFee,
            final_price: prev.total_price + shippingFee
        }));
    };

    // Kiểm tra form hợp lệ
    const isFormValid = () => {
        // Các field từ profile đã được điền sẵn, chỉ cần kiểm tra địa chỉ giao hàng
        const shippingValidation = orderData.shippingAddress.trim() && orderData.delivery_phone.trim();

        // Kiểm tra các field bắt buộc từ profile
        const profileValidation = orderData.buyer_name.trim() &&
            orderData.phoneNumber.trim() &&
            orderData.buyer_email.trim();

        return shippingValidation && profileValidation;
    };

    // Xử lý đặt hàng
    const handlePlaceOrder = async () => {
        if (!isFormValid()) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        // Kiểm tra số dư ví trước khi đặt hàng
        const amountToPay = orderData.final_price || 0;
        if (walletBalance < amountToPay) {
            showInsufficientBalanceModal(amountToPay);
            return;
        }

        setIsSubmitting(true);

        try {
            // Chuẩn bị dữ liệu theo format API - chỉ 6 field cần thiết theo yêu cầu
            // Các field khác sẽ được backend tự động tạo hoặc sử dụng fake data
            const apiOrderData = {
                postProductId: orderData.postProductId,        // ID sản phẩm
                username: orderData.username,                  // Tên đăng nhập
                shippingAddress: orderData.shippingAddress,    // Địa chỉ giao hàng
                phoneNumber: orderData.phoneNumber,            // Số điện thoại
                shippingPartnerId: orderData.shippingPartnerId, // ID đối tác vận chuyển
                paymentId: orderData.paymentId                 // ID phương thức thanh toán
            };

            console.log('🚀 Sending order data to API:', apiOrderData);

            // Gọi API đặt hàng
            const response = await placeOrder(apiOrderData);

            if (response.success) {
                // Refresh số dư ví sau khi đặt hàng thành công
                refreshWalletBalance();

                const newOrderId = response.data.orderId || `ORD${Date.now()}`;
                setOrderId(newOrderId);

                // Lưu đơn hàng vào localStorage để có thể theo dõi
                const newOrder = {
                    id: newOrderId,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 ngày
                    product: product,
                    buyerName: orderData.buyerName,
                    buyerPhone: orderData.buyerPhone,
                    buyerEmail: orderData.buyerEmail,
                    deliveryAddress: orderData.shippingAddress,
                    deliveryPhone: orderData.phoneNumber,
                    deliveryNote: orderData.deliveryNote || '',
                    paymentMethod: 'ewallet',
                    totalPrice: product.price,
                    shippingFee: shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.fee || 50000,
                    finalPrice: product.price + (shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.fee || 50000)
                };

                // Lưu vào localStorage
                const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                existingOrders.push(newOrder);
                localStorage.setItem('orders', JSON.stringify(existingOrders));

                setCurrentStep(3);
            } else {
                throw new Error(response.message || 'Có lỗi xảy ra khi đặt hàng');
            }
        } catch (error) {
            console.error('Place order error:', error);
            // Nếu API lỗi, vẫn cho phép đặt hàng với fake data
            console.log('🔄 API failed, proceeding with fake order...');

            // Refresh số dư ví (fake)
            refreshWalletBalance();

            const fakeOrderId = `ORD${Date.now()}`;
            setOrderId(fakeOrderId);

            // Lưu đơn hàng fake vào localStorage để có thể theo dõi
            const fakeOrder = {
                id: fakeOrderId,
                status: 'pending',
                createdAt: new Date().toISOString(),
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 ngày
                product: product,
                buyerName: orderData.buyerName,
                buyerPhone: orderData.buyerPhone,
                buyerEmail: orderData.buyerEmail,
                deliveryAddress: orderData.shippingAddress,
                deliveryPhone: orderData.phoneNumber,
                deliveryNote: orderData.deliveryNote || '',
                paymentMethod: 'ewallet',
                totalPrice: product.price,
                shippingFee: shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.fee || 50000,
                finalPrice: product.price + (shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.fee || 50000)
            };

            // Lưu vào localStorage
            const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            existingOrders.push(fakeOrder);
            localStorage.setItem('orders', JSON.stringify(existingOrders));

            setCurrentStep(3);
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


    if (isGuest) {
        return (
            <div className="place-order-page">
                <div className="validation-screen">
                    <div className="validation-content">
                        <div className="loading-spinner"></div>
                        <h3>Đang kiểm tra đăng nhập...</h3>
                        <p>Vui lòng đợi trong giây lát...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="place-order-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin sản phẩm...</p>
            </div>
        );
    }

    if (loadingProfile) {
        return (
            <div className="place-order-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin profile...</p>
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
                                            readOnly
                                            style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                                        />
                                        <small className="form-help">Thông tin từ profile của bạn</small>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Số điện thoại *</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={orderData.phoneNumber}
                                            readOnly
                                            style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                                        />
                                        <small className="form-help">Thông tin từ profile của bạn</small>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={orderData.buyer_email}
                                            readOnly
                                            style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                                        />
                                        <small className="form-help">Thông tin từ profile của bạn</small>
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
                                            value={orderData.order_code || `ORD${Date.now()}`}
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
                                            value={orderData.shippingAddress}
                                            onChange={(e) => handleDeliveryAddressChange(e.target.value)}
                                            placeholder="Nhập địa chỉ giao hàng chi tiết"
                                            rows={3}
                                        />
                                        <small className="form-help">Có thể chỉnh sửa địa chỉ giao hàng khác với địa chỉ profile</small>
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
                                        <small className="form-help">Có thể chỉnh sửa số điện thoại nhận hàng khác với profile</small>
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

                                {/* Đối tác vận chuyển */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <Truck className="section-icon" />
                                        Đối tác vận chuyển
                                    </h3>
                                    <div className="form-group">
                                        <label className="form-label">Chọn đối tác vận chuyển *</label>
                                        <div className="shipping-partners-container">
                                            <div
                                                className="shipping-partner-selected"
                                                onClick={() => setShowShippingOptions(!showShippingOptions)}
                                            >
                                                <div className="shipping-partner-info">
                                                    <div className="shipping-partner-name">
                                                        {shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.name || 'Fast Delivery'}
                                                    </div>
                                                    <div className="shipping-partner-desc">
                                                        {shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.description || 'Giao hàng nhanh trong 24h'}
                                                    </div>
                                                </div>
                                                <div className="shipping-partner-fee">
                                                    {formatCurrency(shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.fee || 50000)}
                                                </div>
                                                {showShippingOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>

                                            {showShippingOptions && (
                                                <div className="shipping-partners-list">
                                                    {shippingPartners.map((partner) => (
                                                        <div
                                                            key={partner.id}
                                                            className={`shipping-partner-option ${orderData.shippingPartnerId === partner.id ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                handleShippingPartnerChange(partner.id);
                                                                setShowShippingOptions(false);
                                                            }}
                                                        >
                                                            <div className="shipping-partner-info">
                                                                <div className="shipping-partner-name">{partner.name}</div>
                                                                <div className="shipping-partner-desc">{partner.description}</div>
                                                            </div>
                                                            <div className="shipping-partner-fee">
                                                                {formatCurrency(partner.fee)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Phương thức thanh toán */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <CreditCard className="section-icon" />
                                        Phương thức thanh toán
                                    </h3>
                                    <div className="payment-methods">
                                        <div className="payment-option selected">
                                            <div className="payment-info">
                                                <div className="payment-name">
                                                    <Wallet size={20} />
                                                    Ví điện tử
                                                </div>
                                                <div className="payment-desc">Thanh toán qua ví điện tử</div>
                                                <div className="wallet-balance">
                                                    {walletLoading ? (
                                                        <div className="wallet-loading">
                                                            <div className="loading-spinner-small"></div>
                                                            Đang tải số dư ví...
                                                        </div>
                                                    ) : walletError ? (
                                                        <div className="wallet-error">
                                                            <AlertCircle size={16} />
                                                            {walletError}
                                                            <button
                                                                className="retry-btn"
                                                                onClick={refreshWalletBalance}
                                                                title="Thử lại"
                                                            >
                                                                🔄
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="wallet-success">
                                                            Số dư hiện tại: <span className="balance-amount">{formatWalletCurrency(walletBalance)}</span>
                                                            <button
                                                                className="refresh-btn"
                                                                onClick={refreshWalletBalance}
                                                                title="Cập nhật số dư"
                                                            >
                                                                🔄
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
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
                                        <span className="info-value">{orderData.shippingAddress}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Số điện thoại:</span>
                                        <span className="info-value">{orderData.delivery_phone}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Đối tác vận chuyển:</span>
                                        <span className="info-value">
                                            {shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.name || 'Fast Delivery'}
                                        </span>
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
                                        <span className="info-value">{orderData.order_code || `ORD${Date.now()}`}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Trạng thái:</span>
                                        <span className="info-value">Chờ xử lý</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Đối tác vận chuyển:</span>
                                        <span className="info-value">
                                            {shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.name || 'Fast Delivery'}
                                        </span>
                                    </div>
                                </div>

                                <div className="confirmation-section">
                                    <h4>Phương thức thanh toán</h4>
                                    <div className="info-item">
                                        <span className="info-label">Phương thức:</span>
                                        <span className="info-value">Ví điện tử</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Số dư hiện tại:</span>
                                        <span className="info-value">{formatCurrency(walletBalance)}</span>
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
                                            <span className="font-mono text-xs text-foreground">{orderData.order_code || `ORD${Date.now()}`}</span>
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
                                            <span className="font-medium text-foreground">{formatCurrency(orderData.shippingFee)}</span>
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

        </div>
    );
}

export default PlaceOrder;

//Hello
