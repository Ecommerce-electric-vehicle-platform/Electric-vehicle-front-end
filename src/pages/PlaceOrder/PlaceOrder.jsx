import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
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
    ChevronUp,
    Eye,
    EyeOff,
    FileText,
    Download,
    RefreshCw
} from 'lucide-react';
import { vehicleProducts, batteryProducts, formatCurrency } from '../../test-mock-data/data/productsData';
import {
    getShippingPartners,
    placeOrder,
    getShippingFee,
    getOrderDetails,
    getOrderInvoice
} from '../../api/orderApi';
import { normalizePhoneNumber, isValidVietnamPhoneNumber, formatPhoneForAPI } from '../../utils/format';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import profileApi from '../../api/profileApi';
import { useAddressLoading } from '../../components/ProfileUser/hooks/useAddressLoading';
import ProfileIncompleteModal from '../../components/ProfileIncompleteModal/ProfileIncompleteModal';
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
    const [, setProfileData] = useState(null);
    const [, setMissingProfileFields] = useState([]);

    // API data states
    const [shippingPartners, setShippingPartners] = useState([]);
    const [showShippingOptions, setShowShippingOptions] = useState(false);
    // Ref để track shipping partners container cho click outside
    const shippingPartnersRef = useRef(null);
    const walletBalanceRef = useRef(null);
    // State để track shipping fee đã được fetch từ API hay chưa
    const [shippingFeeFromAPI, setShippingFeeFromAPI] = useState(false);
    const [shippingFeeLoading, setShippingFeeLoading] = useState(false);

    // Sử dụng custom hook để quản lý số dư ví
    const { balance: walletBalance, loading: walletLoading, error: walletError, refreshBalance: refreshWalletBalance, formatCurrency: formatWalletCurrency } = useWalletBalance();
    const [showWalletBalance, setShowWalletBalance] = useState(false); // State để toggle hiển thị số dư
    const [isWalletBalanceExpanded, setIsWalletBalanceExpanded] = useState(false); // State để toggle dropdown
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [orderData, setOrderData] = useState({
        // API required fields only
        postProductId: null,
        username: '', // This will be the username for API
        shippingAddress: '',
        phoneNumber: '',
        shippingPartnerId: 1, // Default to Fast Delivery (id = 1)
        paymentId: 2, // Default to e-wallet payment

        // UI display fields (not sent to API)
        shippingFee: 0,
        total_price: 0,
        final_price: 0,
        buyer_name: '',
        buyer_email: '',
        delivery_phone: '',
        delivery_note: '',
        need_order_invoice: false,

        // Thông tin đơn hàng mở rộng
        order_code: '',
        order_status: 'PENDING_PAYMENT',
        payment_method: 'WALLET',
        transaction_id: '',
        created_at: '',
        paid_at: '',
        shipped_at: '',
        delivered_at: '',
        cancelled_at: '',
        cancel_reason: '',
        shipping_partner: '',
        tracking_number: '',

        // Thông tin vận chuyển chi tiết
        shipping_distance: 0,
        shipping_base_fee: 0,
        shipping_per_km_fee: 0
    });

    // Helper: xác định storage key cho đơn hàng của user hiện tại
    const resolveOrderStorage = () => {
        const username = localStorage.getItem('username') || '';
        const storageKey = username ? `orders_${username}` : 'orders_guest';
        return { username, storageKey };
    };

    // Địa chỉ dạng từng cấp giống Profile
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const { districts, wards, isLoadingDistricts, isLoadingWards } = useAddressLoading(selectedProvince, selectedDistrict);

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState(null);
    // State để lưu order details từ API sau khi đặt hàng thành công
    const [orderDetailsFromAPI, setOrderDetailsFromAPI] = useState(null);
    // State quản lý dữ liệu hóa đơn điện tử
    const [invoiceData, setInvoiceData] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [invoiceError, setInvoiceError] = useState('');

    // Hàm tạo mã đơn hàng
    const generateOrderCode = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `GT-${year}${month}${day}-${random}`;
    };

    // Hàm format trạng thái đơn hàng
    const getOrderStatusText = (status) => {
        const statusMap = {
            'PENDING_PAYMENT': 'Chờ thanh toán',
            'PAID': 'Đã thanh toán',
            'PROCESSING': 'Đang xử lý',
            'SHIPPED': 'Đã giao cho đơn vị vận chuyển',
            'DELIVERED': 'Đã giao thành công',
            'CANCELLED': 'Đã hủy',
            'RETURN_REQUESTED': 'Yêu cầu hoàn hàng',
            'REFUNDED': 'Đã hoàn tiền'
        };
        return statusMap[status] || status;
    };

    // Hàm format phương thức thanh toán
    const getPaymentMethodText = (method) => {
        const methodMap = {
            'WALLET': 'Ví điện tử',
            'COD': 'Thanh toán khi nhận hàng',
            'VNPAY': 'VnPay',
            'BANKING': 'Chuyển khoản ngân hàng',
            'MOMO': 'Ví MoMo'
        };
        return methodMap[method] || method;
    };

    // Hàm lấy logo cho đối tác vận chuyển
    const getShippingPartnerLogo = (partnerName) => {
        if (!partnerName) return null;

        const name = partnerName.toLowerCase();

        if (name.includes('ghn') || name.includes('giao hàng nhanh')) {
            return '/ghn-logo.jpeg';
        } else if (name.includes('ghtk') || name.includes('giaohangtietkiem') || name.includes('giao hàng tiết kiệm') || name.includes('tiet kiem')) {
            return '/ghtk-logo.jpeg';
        } else if (name.includes('j&t') || name.includes('j and t') || name.includes('jandt')) {
            return '/jandtexpress-logo.jpeg';
        } else if (name.includes('viettelpost') || name.includes('viettel post')) {
            return '/vittelpost-logo.jpeg';
        } else if (name.includes('bee') || name.includes('beelogistics') || name.includes('b logistics')) {
            return '/blogistics-logo.png';
        }

        return null;
    };

    // GHN: phí vận chuyển lấy hoàn toàn từ BE → không tính mock ở FE

    // Hàm format thời gian
    const formatDateTime = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Load user profile (không bắt buộc)
    // Chỉ fill dữ liệu khi field chưa có giá trị (không ghi đè dữ liệu người dùng đã nhập)
    const loadUserProfile = useCallback(async (forceReload = false) => {
        setLoadingProfile(true);
        try {
            // Lấy thông tin profile (nếu có)
            const response = await profileApi.getProfile();
            const profileData = response.data.data;

            if (profileData) {
                setProfileData(profileData);

                // Tạm thời bỏ kiểm tra profile - luôn coi như đầy đủ
                setMissingProfileFields([]);

                console.log('🔍 Profile loaded (validation disabled):', profileData);

                // Tự động fill thông tin nếu có - CHỈ fill khi field chưa có giá trị hoặc forceReload = true
                if (profileData.fullName) {
                    // Tạo địa chỉ đầy đủ từ các trường địa chỉ
                    const fullAddress = [
                        profileData.street,
                        profileData.wardName,
                        profileData.districtName,
                        profileData.provinceName
                    ].filter(Boolean).join(', ');

                    console.log('🔍 Setting order data (only if empty):', {
                        fullName: profileData.fullName,
                        phoneNumber: profileData.phoneNumber,
                        email: profileData.email,
                        fullAddress,
                        forceReload
                    });

                    setOrderData(prev => {
                        // Chỉ fill khi field chưa có giá trị hoặc forceReload = true
                        const shouldFillName = forceReload || !prev.buyer_name || !prev.buyer_name.trim();
                        const shouldFillEmail = forceReload || !prev.buyer_email || !prev.buyer_email.trim();
                        const shouldFillPhone = forceReload || !prev.phoneNumber || !prev.phoneNumber.trim();
                        const shouldFillDeliveryPhone = forceReload || !prev.delivery_phone || !prev.delivery_phone.trim();
                        const shouldFillStreet = forceReload || !prev.street || !prev.street.trim();
                        const shouldFillProvince = forceReload || !prev.provinceId || !prev.provinceId.trim();
                        const shouldFillDistrict = forceReload || !prev.districtId || !prev.districtId.trim();
                        const shouldFillWard = forceReload || !prev.wardId || !prev.wardId.trim();
                        const shouldFillAddress = forceReload || !prev.shippingAddress || !prev.shippingAddress.trim();

                        return {
                            ...prev,
                            username: localStorage.getItem('username') || prev.username || 'user123',
                            buyer_name: shouldFillName ? (profileData.fullName || prev.buyer_name) : prev.buyer_name,
                            fullName: shouldFillName ? (profileData.fullName || prev.fullName) : prev.fullName,
                            buyer_email: shouldFillEmail ? (profileData.email || prev.buyer_email || '') : prev.buyer_email,
                            phoneNumber: shouldFillPhone ? (profileData.phoneNumber || prev.phoneNumber || '') : prev.phoneNumber,
                            shippingAddress: shouldFillAddress ? (fullAddress || prev.shippingAddress || '') : prev.shippingAddress,
                            street: shouldFillStreet ? (profileData.street || prev.street || '') : prev.street,
                            provinceId: shouldFillProvince ? (profileData.provinceId || prev.provinceId || '') : prev.provinceId,
                            districtId: shouldFillDistrict ? (profileData.districtId || prev.districtId || '') : prev.districtId,
                            wardId: shouldFillWard ? (profileData.wardId || prev.wardId || '') : prev.wardId,
                            delivery_phone: shouldFillDeliveryPhone ? (profileData.phoneNumber || prev.delivery_phone || '') : prev.delivery_phone
                        };
                    });

                    // Sync dropdowns - chỉ khi chưa có giá trị hoặc forceReload = true
                    setSelectedProvince(prev => {
                        if (forceReload || !prev) {
                            return profileData.provinceId || '';
                        }
                        return prev;
                    });
                    setSelectedDistrict(prev => {
                        if (forceReload || !prev) {
                            return profileData.districtId || '';
                        }
                        return prev;
                    });
                    setSelectedWard(prev => {
                        if (forceReload || !prev) {
                            return profileData.wardId || '';
                        }
                        return prev;
                    });
                }
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Không bắt buộc phải có profile
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    // Load API data
    const loadApiData = useCallback(async () => {
        try {
            // Load provinces for address selects
            try {
                const provincesResponse = await profileApi.getAddressProvinces();
                const data = provincesResponse.data?.data || {};
                const transformed = Object.keys(data).map(key => ({ value: key, label: data[key] }));
                setProvinces(transformed);
            } catch (e) {
                console.error('Failed to load provinces:', e);
            }

            const shippingData = await getShippingPartners();
            console.log('🚚 Shipping partners from API:', shippingData);

            // Normalize list from API → [{ id, name, description, ... }]
            const rawList = Array.isArray(shippingData?.data)
                ? shippingData.data
                : (Array.isArray(shippingData) ? shippingData : []);

            const normalizedList = rawList.map((item, idx) => {
                const id = item.id ?? item.partnerId ?? item.partner_id ?? (idx + 1);
                // Some APIs may return a nested object for name; pick a readable string
                const candidateName = item.name ?? item.partnerName ?? item.partner_name ?? item.partner?.partnerName;
                const name = typeof candidateName === 'string' ? candidateName : (candidateName?.toString?.() || 'Đối tác vận chuyển');
                const descSource = item.description ?? item.hotLine ?? item.address ?? item.websiteUrl ?? item.email;
                const description = typeof descSource === 'string' ? descSource : (descSource ? JSON.stringify(descSource) : '');
                return { ...item, id, name, description };
            });

            // Chỉ lọc và hiển thị GHN (Giao Hàng Nhanh)
            const ghnPartners = normalizedList.filter(partner => {
                const name = partner.name?.toLowerCase() || '';
                return name.includes('ghn') ||
                    name.includes('giao hàng nhanh') ||
                    name.includes('giaohangnhanh');
            });

            // Show only GHN shipping partners from API
            if (ghnPartners && ghnPartners.length > 0) {
                setShippingPartners(ghnPartners);

                // Auto-select first GHN partner
                const ghnPartner = ghnPartners[0];
                if (ghnPartner) {
                    setOrderData(prev => ({
                        ...prev,
                        shippingPartnerId: ghnPartner.id
                    }));
                }
            } else {
                // Fallback data if API fails - chỉ GHN
                setShippingPartners([
                    { id: 1, name: 'Giao hàng nhanh', description: 'Giao hàng nhanh trong 24h', fee: 50000 }
                ]);

                setOrderData(prev => ({
                    ...prev,
                    shippingPartnerId: 1
                }));
            }
        } catch (error) {
            console.error('Error loading shipping partners:', error);
            // Set default shipping partner if API fails - chỉ GHN
            setShippingPartners([
                { id: 1, name: 'Giao hàng nhanh', description: 'Giao hàng nhanh trong 24h', fee: 50000 }
            ]);

            setOrderData(prev => ({
                ...prev,
                shippingPartnerId: 1
            }));
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

        // Kiểm tra xem đã có order thành công cho product này chưa
        const { storageKey } = resolveOrderStorage();
        const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const currentProductId = parseInt(id);
        const currentUsername = localStorage.getItem('username') || '';

        // Tìm order đã thành công cho product này của user hiện tại
        const existingOrder = existingOrders.find(order =>
            order.product?.id === currentProductId &&
            order.username === currentUsername &&
            (order.order_status === 'PAID' || order.order_status === 'PENDING_PAYMENT' || order.status === 'confirmed' || order.status === 'pending')
        );

        if (existingOrder) {
            console.log('⚠️ Order already exists for this product:', existingOrder);
            // Hiển thị thông báo và redirect
            const orderId = existingOrder.id || existingOrder.order_code || existingOrder.orderId;
            setModalConfig({
                type: 'warning',
                title: 'Đơn hàng đã tồn tại',
                message: `Bạn đã đặt hàng cho sản phẩm này với mã đơn hàng: ${existingOrder.order_code || existingOrder.id}. Vui lòng kiểm tra đơn hàng của bạn.`,
                actions: [
                    {
                        label: 'Xem đơn hàng',
                        type: 'primary',
                        onClick: () => {
                            setShowModal(false);
                            // Điều hướng đến trang order tracking của đơn hàng cụ thể
                            if (orderId) {
                                navigate(`/order-tracking/${orderId}`);
                            } else {
                                navigate('/orders');
                            }
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
            return;
        }

        // Load user profile và API data
        loadUserProfile();
        loadApiData();
    }, [navigate, loadUserProfile, loadApiData, id]);

    // BỎ useEffect visibilitychange để tránh reload profile mỗi lần quay lại tab
    // Điều này gây ra việc mất dữ liệu người dùng đã nhập khi chuyển tab và quay lại
    // Profile chỉ được load một lần khi component mount (trong useEffect ở dòng 327)

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
            const defaultShippingFee = 0; // GHN fee sẽ do BE trả về
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
            const defaultShippingFee = 0;
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

    // Khôi phục thông tin đơn hàng sau khi quay lại từ trang nạp tiền
    useEffect(() => {
        // Ưu tiên lấy từ location.state (nếu navigate từ VnPayReturn/MoMoReturn)
        // Nếu không có thì lấy từ localStorage
        let orderDataToRestore = location.state?.orderData;
        if (!orderDataToRestore) {
            const saved = localStorage.getItem('walletDepositOrderData');
            if (saved) {
                try {
                    orderDataToRestore = JSON.parse(saved);
                } catch (e) {
                    console.error('Error parsing saved order data:', e);
                }
            }
        }

        let addressStatesToRestore = location.state?.addressStates;
        if (!addressStatesToRestore) {
            const saved = localStorage.getItem('walletDepositAddressStates');
            if (saved) {
                try {
                    addressStatesToRestore = JSON.parse(saved);
                } catch (e) {
                    console.error('Error parsing saved address states:', e);
                }
            }
        }

        let productToRestore = location.state?.product;
        if (!productToRestore) {
            const saved = localStorage.getItem('walletDepositProductState');
            if (saved) {
                try {
                    productToRestore = JSON.parse(saved);
                } catch (e) {
                    console.error('Error parsing saved product:', e);
                }
            }
        }

        if (orderDataToRestore || addressStatesToRestore || productToRestore) {
            console.log('🔄 Khôi phục thông tin đơn hàng sau khi nạp tiền');

            // Khôi phục product nếu có (chỉ khi chưa có product)
            if (productToRestore && !product) {
                setProduct(productToRestore);
            }

            // Khôi phục orderData nếu có
            if (orderDataToRestore) {
                try {
                    setOrderData(prev => {
                        // Chỉ khôi phục các trường người dùng đã nhập, không ghi đè các giá trị tính toán
                        return {
                            ...prev,
                            // Thông tin người dùng đã nhập
                            buyer_name: orderDataToRestore.buyer_name || prev.buyer_name,
                            buyer_email: orderDataToRestore.buyer_email || prev.buyer_email,
                            phoneNumber: orderDataToRestore.phoneNumber || prev.phoneNumber,
                            delivery_phone: orderDataToRestore.delivery_phone || prev.delivery_phone,
                            delivery_note: orderDataToRestore.delivery_note || prev.delivery_note,
                            need_order_invoice: orderDataToRestore.need_order_invoice !== undefined ? orderDataToRestore.need_order_invoice : prev.need_order_invoice,
                            // Địa chỉ
                            street: orderDataToRestore.street || prev.street,
                            provinceId: orderDataToRestore.provinceId || prev.provinceId,
                            districtId: orderDataToRestore.districtId || prev.districtId,
                            wardId: orderDataToRestore.wardId || prev.wardId,
                            // Đối tác vận chuyển và phương thức thanh toán
                            shippingPartnerId: orderDataToRestore.shippingPartnerId || prev.shippingPartnerId,
                            paymentId: orderDataToRestore.paymentId || prev.paymentId,
                            payment_method: orderDataToRestore.payment_method || prev.payment_method,
                            // Giữ nguyên các giá trị tính toán (sẽ được tính lại sau)
                            // shippingFee, total_price, final_price sẽ được tính lại
                            postProductId: orderDataToRestore.postProductId || prev.postProductId,
                            username: orderDataToRestore.username || prev.username
                        };
                    });
                } catch (e) {
                    console.error('Error restoring order data:', e);
                }
            }

            // Khôi phục address states nếu có
            if (addressStatesToRestore) {
                try {
                    if (addressStatesToRestore.selectedProvince) {
                        setSelectedProvince(addressStatesToRestore.selectedProvince);
                    }
                    if (addressStatesToRestore.selectedDistrict) {
                        setSelectedDistrict(addressStatesToRestore.selectedDistrict);
                    }
                    if (addressStatesToRestore.selectedWard) {
                        setSelectedWard(addressStatesToRestore.selectedWard);
                    }
                } catch (e) {
                    console.error('Error restoring address states:', e);
                }
            }

            // Xóa dữ liệu đã khôi phục để tránh khôi phục lại lần sau
            localStorage.removeItem('walletDepositOrderData');
            localStorage.removeItem('walletDepositAddressStates');
            localStorage.removeItem('walletDepositProductState');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]); // Chạy khi location.state thay đổi hoặc component mount

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

    // Hàm chuyển đến trang profile để điền thông tin
    const handleFillProfile = useCallback(() => {
        navigate('/profile?tab=profile');
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

    // Quy trình kiểm tra validation (bỏ kiểm tra profile)
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

    // Tự động bắt đầu validation khi product và profile đã được load
    useEffect(() => {
        if (product && !loadingProfile && validationStep === 'checking') {
            console.log('🔍 Product and profile loaded, starting validation...');
            startValidationProcess();
        }
    }, [product, loadingProfile, validationStep, startValidationProcess]);

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
                        // Lưu returnUrl để quay lại trang đặt hàng sau khi nạp tiền
                        const returnUrl = location.pathname + location.search;
                        localStorage.setItem('walletDepositReturnUrl', returnUrl);

                        // Lưu thông tin product vào state để khôi phục sau khi nạp tiền
                        if (product) {
                            localStorage.setItem('walletDepositProductState', JSON.stringify(product));
                        }

                        // Lưu toàn bộ thông tin đơn hàng đã nhập để khôi phục sau khi nạp tiền
                        const orderDataToSave = {
                            ...orderData,
                            // Đảm bảo lưu cả selectedProvince, selectedDistrict, selectedWard
                            // vì có thể chúng chưa được set vào orderData
                            provinceId: orderData.provinceId || selectedProvince,
                            districtId: orderData.districtId || selectedDistrict,
                            wardId: orderData.wardId || selectedWard
                        };
                        localStorage.setItem('walletDepositOrderData', JSON.stringify(orderDataToSave));

                        // Lưu các state địa chỉ riêng biệt
                        const addressStates = {
                            selectedProvince: selectedProvince || orderData.provinceId || '',
                            selectedDistrict: selectedDistrict || orderData.districtId || '',
                            selectedWard: selectedWard || orderData.wardId || ''
                        };
                        localStorage.setItem('walletDepositAddressStates', JSON.stringify(addressStates));

                        navigate('/wallet/deposit', {
                            state: {
                                returnUrl: returnUrl,
                                fromPlaceOrder: true,
                                product: product,
                                orderData: orderDataToSave,
                                addressStates: addressStates
                            }
                        });
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
    }, [navigate, location.pathname, location.search, product, orderData, selectedProvince, selectedDistrict, selectedWard]);

    // Xử lý thay đổi input
    const handleInputChange = (field, value) => {
        setOrderData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const loadInvoice = useCallback(async (targetOrderId) => {
        if (!targetOrderId) {
            setInvoiceError('Không tìm thấy mã đơn hàng để tải hóa đơn.');
            return;
        }

        setInvoiceLoading(true);
        setInvoiceError('');
        setInvoiceData(null);

        try {
            const response = await getOrderInvoice(targetOrderId);
            const data = response?.data || null;

            if (response?.success && data?.pdfUrl) {
                setInvoiceData(data);
                setInvoiceError('');
            } else {
                setInvoiceData(data);
                const fallbackMessage = response?.message || 'Hóa đơn đang được xử lý. Vui lòng thử lại sau ít phút.';
                setInvoiceError(fallbackMessage);
            }
        } catch (error) {
            console.error('❌ Error fetching invoice:', error);
            const message = error?.response?.data?.message || error?.message || 'Không thể tải hóa đơn. Vui lòng thử lại.';
            setInvoiceError(message);
            setInvoiceData(null);
        } finally {
            setInvoiceLoading(false);
        }
    }, []);


    // (Bỏ input địa chỉ tự do; địa chỉ được ghép tự động từ 4 field)

    // Cập nhật địa chỉ chi tiết theo từng cấp và assemble lại `shippingAddress`
    const recomputeShippingAddress = useCallback((overrides = {}) => {
        const next = { ...orderData, ...overrides };
        const provinceName = provinces.find(p => p.value === next.provinceId)?.label || '';
        const districtName = districts.find(d => d.value === next.districtId)?.label || '';
        const wardName = wards.find(w => w.value === next.wardId)?.label || '';
        const full = [next.street, wardName, districtName, provinceName].filter(Boolean).join(', ');
        setOrderData(prev => ({ ...prev, ...overrides, shippingAddress: full }));
    }, [orderData, provinces, districts, wards]);

    // Gọi API tính phí vận chuyển khi đủ dữ liệu địa chỉ + sản phẩm + phương thức thanh toán
    const refreshShippingFee = useCallback(async () => {
        const postId = orderData.postProductId || product?.id;
        const provinceId = (orderData.provinceId || selectedProvince) || '';
        const districtId = (orderData.districtId || selectedDistrict) || '';
        const wardId = (orderData.wardId || selectedWard) || '';
        const provinceName = provinces.find(p => p.value === provinceId)?.label || '';
        const districtName = districts.find(d => d.value === districtId)?.label || '';
        const wardName = wards.find(w => w.value === wardId)?.label || '';
        const paymentId = orderData.paymentId || 2;

        if (!postId || !provinceName || !districtName || !wardName) {
            // Reset flag nếu chưa đủ thông tin
            setShippingFeeFromAPI(false);
            return;
        }

        setShippingFeeLoading(true);
        try {
            const res = await getShippingFee({ postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId });

            // Log đầy đủ response để debug
            console.log('🔍 Full Shipping Fee API Response Analysis:', {
                fullResponse: res,
                res_success: res?.success,
                res_data: res?.data,
                res_data_total: res?.data?.total,
                res_data_shippingFee: res?.data?.shippingFee,
                res_data_data: res?.data?.data,
                res_data_data_total: res?.data?.data?.total,
                res_total: res?.total,
                res_shippingFee: res?.shippingFee,
                structure: {
                    hasSuccess: !!res?.success,
                    hasData: !!res?.data,
                    dataType: typeof res?.data,
                    isDataObject: res?.data && typeof res?.data === 'object' && !Array.isArray(res?.data),
                    dataHasTotal: !!res?.data?.total,
                    dataHasShippingFee: !!res?.data?.shippingFee,
                    dataHasData: !!res?.data?.data,
                    dataDataHasTotal: !!res?.data?.data?.total
                }
            });

            // Chuẩn hóa nhiều định dạng đáp ứng từ BE
            // Response structure có thể là:
            // Case 1: { success: true, data: { total: "561000", ... } }
            // Case 2: { data: { total: "561000", ... } }
            // Case 3: { total: "561000", ... } (direct)
            // Case 4: { success: true, data: { data: { total: "561000", ... } } }

            let fee = 0;
            let extractedFrom = '';
            let raw = null;
            let data = null;

            // Xử lý theo nhiều response structure
            if (res?.data?.total) {
                // Case 1: { success: true, data: { total: "561000", ... } }
                raw = res.data;
                data = raw;
                fee = Number(res.data.total);
                extractedFrom = 'res.data.total';
            } else if (res?.data?.shippingFee) {
                raw = res.data;
                data = raw;
                fee = Number(res.data.shippingFee);
                extractedFrom = 'res.data.shippingFee';
            } else if (res?.data?.data?.total) {
                // Case 4: Nested data structure
                raw = res.data;
                data = res.data.data;
                fee = Number(res.data.data.total);
                extractedFrom = 'res.data.data.total';
            } else if (res?.data?.fee) {
                raw = res.data;
                data = raw;
                fee = Number(res.data.fee);
                extractedFrom = 'res.data.fee';
            } else if (res?.total) {
                // Case 3: Direct field
                raw = res;
                data = res;
                fee = Number(res.total);
                extractedFrom = 'res.total';
            } else if (res?.shippingFee) {
                raw = res;
                data = res;
                fee = Number(res.shippingFee);
                extractedFrom = 'res.shippingFee';
            } else {
                // Fallback: Try old logic
                raw = res?.data ?? res ?? {};
                data = raw?.data ?? raw;
                fee = Number(
                    data?.total ??
                    data?.shippingFee ??
                    data?.fee ??
                    raw?.total ??
                    raw?.shippingFee ??
                    0
                );
                extractedFrom = 'fallback';
                console.warn('⚠️ Using fallback extraction logic. Response structure may be unexpected:', res);
            }

            // Tính tổng phí chi tiết để verify
            const serviceFee = Number(data?.service_fee ?? 0);
            const codFee = Number(data?.cod_fee ?? 0);
            const insuranceFee = Number(data?.insurance_fee ?? 0);
            const pickRemoteFee = Number(data?.pick_remote_areas_fee ?? 0);
            const deliverRemoteFee = Number(data?.deliver_remote_areas_fee ?? 0);
            const calculatedTotal = serviceFee + codFee + insuranceFee + pickRemoteFee + deliverRemoteFee;

            // Giữ nguyên fee đã extract (ưu tiên res.data.total) để hiển thị cho người dùng

            console.log('💰 Extracted shipping fee:', {
                fee: fee,
                extractedFrom: extractedFrom,
                rawValue: res?.data?.total ?? res?.data?.shippingFee ?? res?.data?.fee ?? res?.total ?? res?.shippingFee,
                paymentId: paymentId,
                isCOD: paymentId === 1,
                breakdown: {
                    service_fee: serviceFee,
                    cod_fee: codFee,
                    insurance_fee: insuranceFee,
                    pick_remote_areas_fee: pickRemoteFee,
                    deliver_remote_areas_fee: deliverRemoteFee,
                    calculatedTotal: calculatedTotal
                },
                verification: {
                    extractedFee: fee
                }
            });

            setOrderData(prev => {
                const oldShippingFee = prev.shippingFee;
                console.log('📝 Setting shippingFee in orderData (refreshShippingFee):', {
                    old: oldShippingFee,
                    new: fee,
                    extractedFrom: extractedFrom,
                    source: 'refreshShippingFee',
                    timestamp: new Date().toISOString(),
                    changed: oldShippingFee !== fee,
                    difference: fee - (oldShippingFee || 0)
                });

                return {
                    ...prev,
                    shippingFee: fee,
                    // Map thêm thông tin chi tiết nếu có (phục vụ UI hiển thị)
                    shipping_base_fee: Number(data?.service_fee ?? prev.shipping_base_fee ?? 0),
                    shipping_per_km_fee: Number(prev.shipping_per_km_fee ?? 0),
                    final_price: (prev.total_price || 0) + fee,
                };
            });

            // Đánh dấu shippingFee đã được fetch từ API thành công
            setShippingFeeFromAPI(true);
        } catch (e) {
            console.error('❌ Failed to fetch shipping fee from API:', e);
            // KHÔNG dùng fallback 50000 - chỉ giữ giá trị hiện tại nếu có
            // Hoặc set về 0 để hiển thị "Đang tính..."
            setOrderData(prev => ({
                ...prev,
                // Chỉ giữ giá trị cũ nếu đã có, không set fallback 50000
                shippingFee: prev.shippingFee || 0,
                final_price: (prev.total_price || 0) + (prev.shippingFee || 0)
            }));
            setShippingFeeFromAPI(false);
        } finally {
            setShippingFeeLoading(false);
        }
    }, [orderData.postProductId, orderData.paymentId, orderData.provinceId, orderData.districtId, orderData.wardId, selectedProvince, selectedDistrict, selectedWard, product?.id, provinces, districts, wards]);

    // Tự động scroll về đầu trang khi chuyển bước
    useEffect(() => {
        // Scroll về đầu trang khi currentStep thay đổi
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth' // Smooth scroll để UX tốt hơn
        });
    }, [currentStep]);

    // Tự động tính lại phí vận chuyển khi địa chỉ hoặc phương thức thanh toán thay đổi
    useEffect(() => {
        refreshShippingFee();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData.postProductId, orderData.paymentId, orderData.provinceId, orderData.districtId, orderData.wardId, selectedProvince, selectedDistrict, selectedWard]);

    // Handle click outside để đóng dropdown shipping partners
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showShippingOptions &&
                shippingPartnersRef.current &&
                !shippingPartnersRef.current.contains(event.target)
            ) {
                setShowShippingOptions(false);
            }
        };

        // Thêm event listener khi dropdown đang mở
        if (showShippingOptions) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showShippingOptions]);

    // Handle click outside để đóng dropdown wallet balance
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isWalletBalanceExpanded &&
                walletBalanceRef.current &&
                !walletBalanceRef.current.contains(event.target)
            ) {
                setIsWalletBalanceExpanded(false);
            }
        };

        // Thêm event listener khi dropdown đang mở
        if (isWalletBalanceExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isWalletBalanceExpanded]);

    const handleProvinceChange = (provId) => {
        setSelectedProvince(provId);
        setSelectedDistrict('');
        setSelectedWard('');
        // Đảm bảo sync vào orderData để validation và refreshShippingFee hoạt động đúng
        setOrderData(prev => ({ ...prev, provinceId: provId, districtId: '', wardId: '' }));
        recomputeShippingAddress({ provinceId: provId, districtId: '', wardId: '' });
    };

    const handleDistrictChange = (distId) => {
        setSelectedDistrict(distId);
        setSelectedWard('');
        // Đảm bảo sync vào orderData để validation và refreshShippingFee hoạt động đúng
        setOrderData(prev => ({ ...prev, districtId: distId, wardId: '' }));
        recomputeShippingAddress({ districtId: distId, wardId: '' });
    };

    const handleWardChange = (wardId) => {
        setSelectedWard(wardId);
        // Đảm bảo sync vào orderData để validation và refreshShippingFee hoạt động đúng
        setOrderData(prev => ({ ...prev, wardId }));
        recomputeShippingAddress({ wardId });
    };

    // Xử lý thay đổi phương thức thanh toán (1: COD, 2: Ví điện tử)
    const handlePaymentMethodChange = (paymentId) => {
        setOrderData(prev => ({
            ...prev,
            paymentId,
            payment_method: paymentId === 2 ? 'WALLET' : 'COD'
        }));
        // Đóng dropdown và reset về trạng thái ẩn số dư khi chọn COD
        if (paymentId !== 2) {
            setIsWalletBalanceExpanded(false);
            setShowWalletBalance(false); // Reset về trạng thái ẩn số dư
        }
    };

    // Xử lý thay đổi đối tác vận chuyển
    const handleShippingPartnerChange = (partnerId) => {
        const selectedPartner = shippingPartners.find(p => p.id === partnerId);
        console.log('🚚 Selected shipping partner:', selectedPartner);
        setOrderData(prev => ({
            ...prev,
            shippingPartnerId: partnerId
        }));
        // GHN: thay đổi đối tác có thể ảnh hưởng phí → tính lại nếu đủ dữ liệu
        setTimeout(() => {
            refreshShippingFee();
        }, 0);
    };

    // Kiểm tra form hợp lệ
    const isFormValid = () => {
        // Kiểm tra địa chỉ giao hàng chi tiết
        const shippingValidation = (
            (orderData.street || '').trim() &&
            (orderData.provinceId || selectedProvince) &&
            (orderData.districtId || selectedDistrict) &&
            (orderData.wardId || selectedWard) &&
            orderData.delivery_phone.trim()
        );

        // Kiểm tra các field bắt buộc từ profile
        const profileValidation = orderData.buyer_name.trim() &&
            orderData.phoneNumber.trim() &&
            orderData.buyer_email.trim();

        // Validate số điện thoại
        const phoneValidation = isValidVietnamPhoneNumber(orderData.phoneNumber || '');
        const deliveryPhoneValidation = isValidVietnamPhoneNumber(orderData.delivery_phone || '');

        return shippingValidation && profileValidation && phoneValidation && deliveryPhoneValidation;
    };

    // Xử lý đặt hàng
    const handlePlaceOrder = async () => {
        if (!isFormValid()) {
            // Kiểm tra cụ thể số điện thoại không hợp lệ
            if (!isValidVietnamPhoneNumber(orderData.phoneNumber || '')) {
                alert('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số, bắt đầu bằng 0, không được là số test như 0123456789).');
                return;
            }
            if (!isValidVietnamPhoneNumber(orderData.delivery_phone || '')) {
                alert('Số điện thoại nhận hàng không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số, bắt đầu bằng 0).');
                return;
            }
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        // Kiểm tra số dư ví trước khi đặt hàng (chỉ với ví điện tử)
        if (orderData.paymentId === 2) {
            const amountToPay = orderData.final_price || 0;
            if (walletBalance < amountToPay) {
                showInsufficientBalanceModal(amountToPay);
                return;
            }
        }

        const shouldRequestInvoice = Boolean(orderData.need_order_invoice);
        setInvoiceData(null);
        setInvoiceError('');
        if (!shouldRequestInvoice) {
            setInvoiceLoading(false);
        }

        setIsSubmitting(true);

        // Khai báo apiOrderData ở scope cao hơn để có thể truy cập trong catch block
        let apiOrderData = null;

        try {
            // QUAN TRỌNG: Gọi lại API getShippingFee ngay trước khi place order
            // để đảm bảo phí ship chính xác và mới nhất
            // Backend có thể tính lại phí ship khác với lần gọi trước
            let finalShippingFee = Number(orderData.shippingFee || 0);

            try {
                const postId = orderData.postProductId || product?.postId || product?.id;
                const provinceId = (orderData.provinceId || selectedProvince) || '';
                const districtId = (orderData.districtId || selectedDistrict) || '';
                const wardId = (orderData.wardId || selectedWard) || '';
                const provinceName = provinces.find(p => p.value === provinceId)?.label || '';
                const districtName = districts.find(d => d.value === districtId)?.label || '';
                const wardName = wards.find(w => w.value === wardId)?.label || '';
                const paymentId = orderData.paymentId || 2;

                if (postId && provinceName && districtName && wardName) {
                    console.log('🔄 Fetching latest shipping fee before place order...', {
                        postId,
                        provinceName,
                        districtName,
                        wardName,
                        paymentId,
                        currentShippingFee: finalShippingFee
                    });

                    const shippingFeeResponse = await getShippingFee({
                        postId,
                        provinceName,
                        districtName,
                        wardName,
                        provinceId,
                        districtId,
                        wardId,
                        paymentId
                    });

                    // Log đầy đủ response để debug
                    console.log('🔍 Latest Shipping Fee API Response Analysis:', {
                        fullResponse: shippingFeeResponse,
                        res_success: shippingFeeResponse?.success,
                        res_data: shippingFeeResponse?.data,
                        res_data_total: shippingFeeResponse?.data?.total,
                        res_data_shippingFee: shippingFeeResponse?.data?.shippingFee,
                        res_data_data: shippingFeeResponse?.data?.data,
                        res_data_data_total: shippingFeeResponse?.data?.data?.total,
                        res_total: shippingFeeResponse?.total,
                        res_shippingFee: shippingFeeResponse?.shippingFee,
                        structure: {
                            hasSuccess: !!shippingFeeResponse?.success,
                            hasData: !!shippingFeeResponse?.data,
                            dataType: typeof shippingFeeResponse?.data,
                            isDataObject: shippingFeeResponse?.data && typeof shippingFeeResponse?.data === 'object' && !Array.isArray(shippingFeeResponse?.data),
                            dataHasTotal: !!shippingFeeResponse?.data?.total,
                            dataHasShippingFee: !!shippingFeeResponse?.data?.shippingFee,
                            dataHasData: !!shippingFeeResponse?.data?.data,
                            dataDataHasTotal: !!shippingFeeResponse?.data?.data?.total
                        }
                    });

                    // Robust extraction với nhiều response structure
                    let latestFee = 0;
                    let extractedFrom = '';
                    let raw = null;
                    let data = null;

                    // Xử lý theo nhiều response structure (giống logic ở trên)
                    if (shippingFeeResponse?.data?.total) {
                        raw = shippingFeeResponse.data;
                        data = raw;
                        latestFee = Number(shippingFeeResponse.data.total);
                        extractedFrom = 'shippingFeeResponse.data.total';
                    } else if (shippingFeeResponse?.data?.shippingFee) {
                        raw = shippingFeeResponse.data;
                        data = raw;
                        latestFee = Number(shippingFeeResponse.data.shippingFee);
                        extractedFrom = 'shippingFeeResponse.data.shippingFee';
                    } else if (shippingFeeResponse?.data?.data?.total) {
                        raw = shippingFeeResponse.data;
                        data = shippingFeeResponse.data.data;
                        latestFee = Number(shippingFeeResponse.data.data.total);
                        extractedFrom = 'shippingFeeResponse.data.data.total';
                    } else if (shippingFeeResponse?.data?.fee) {
                        raw = shippingFeeResponse.data;
                        data = raw;
                        latestFee = Number(shippingFeeResponse.data.fee);
                        extractedFrom = 'shippingFeeResponse.data.fee';
                    } else if (shippingFeeResponse?.total) {
                        raw = shippingFeeResponse;
                        data = shippingFeeResponse;
                        latestFee = Number(shippingFeeResponse.total);
                        extractedFrom = 'shippingFeeResponse.total';
                    } else if (shippingFeeResponse?.shippingFee) {
                        raw = shippingFeeResponse;
                        data = shippingFeeResponse;
                        latestFee = Number(shippingFeeResponse.shippingFee);
                        extractedFrom = 'shippingFeeResponse.shippingFee';
                    } else {
                        // Fallback
                        raw = shippingFeeResponse?.data ?? shippingFeeResponse ?? {};
                        data = raw?.data ?? raw;
                        latestFee = Number(
                            data?.total ??
                            data?.shippingFee ??
                            data?.fee ??
                            raw?.total ??
                            raw?.shippingFee ??
                            finalShippingFee
                        );
                        extractedFrom = 'fallback';
                        console.warn('⚠️ Using fallback extraction logic for latest fee:', shippingFeeResponse);
                    }

                    // Tính tổng phí chi tiết để verify
                    const serviceFee = Number(data?.service_fee ?? 0);
                    const codFee = Number(data?.cod_fee ?? 0);
                    const insuranceFee = Number(data?.insurance_fee ?? 0);
                    const pickRemoteFee = Number(data?.pick_remote_areas_fee ?? 0);
                    const deliverRemoteFee = Number(data?.deliver_remote_areas_fee ?? 0);
                    const calculatedTotal = serviceFee + codFee + insuranceFee + pickRemoteFee + deliverRemoteFee;

                    // Chỉ sử dụng service_fee làm shippingFee hiển thị
                    latestFee = serviceFee;
                    extractedFrom = 'data.service_fee (forced)';

                    console.log('💰 Latest shipping fee extracted:', {
                        fee: latestFee,
                        extractedFrom: extractedFrom,
                        rawValue: shippingFeeResponse?.data?.total ?? shippingFeeResponse?.data?.shippingFee ?? shippingFeeResponse?.data?.fee ?? shippingFeeResponse?.total ?? shippingFeeResponse?.shippingFee,
                        paymentId: paymentId,
                        isCOD: paymentId === 1,
                        breakdown: {
                            service_fee: serviceFee,
                            cod_fee: codFee,
                            insurance_fee: insuranceFee,
                            pick_remote_areas_fee: pickRemoteFee,
                            deliver_remote_areas_fee: deliverRemoteFee,
                            calculatedTotal: calculatedTotal
                        },
                        verification: {
                            extractedFee: latestFee
                        }
                    });

                    if (latestFee !== finalShippingFee) {
                        console.warn('⚠️ Shipping fee changed between calls!', {
                            old: finalShippingFee,
                            new: latestFee,
                            difference: latestFee - finalShippingFee,
                            currentPaymentId: paymentId,
                            response: {
                                total: data?.total,
                                service_fee: data?.service_fee,
                                cod_fee: data?.cod_fee,
                                pick_remote_areas_fee: data?.pick_remote_areas_fee
                            }
                        });
                    }

                    finalShippingFee = latestFee;
                    console.log('✅ Latest shipping fee:', finalShippingFee);

                    // Cập nhật lại orderData để hiển thị đúng
                    setOrderData(prev => {
                        const oldShippingFee = prev.shippingFee;
                        console.log('📝 Setting shippingFee in orderData (before place order):', {
                            old: oldShippingFee,
                            new: finalShippingFee,
                            extractedFrom: extractedFrom,
                            source: 'beforePlaceOrder',
                            timestamp: new Date().toISOString(),
                            changed: oldShippingFee !== finalShippingFee,
                            difference: finalShippingFee - (oldShippingFee || 0)
                        });

                        return {
                            ...prev,
                            shippingFee: finalShippingFee,
                            final_price: (prev.total_price || 0) + finalShippingFee
                        };
                    });
                } else {
                    console.warn('⚠️ Cannot fetch latest shipping fee - missing address info');
                }
            } catch (shippingError) {
                console.error('⚠️ Error fetching latest shipping fee, using cached value:', shippingError);
                // Vẫn dùng giá trị cũ nếu không fetch được
            }

            // Tính toán giá trước khi gửi để đảm bảo tính nhất quán
            const productPrice = Number(orderData.total_price || product?.price || 0);
            const shippingFeeValue = finalShippingFee; // Sử dụng giá mới nhất
            const totalPriceValue = productPrice + shippingFeeValue;

            // Chuẩn bị dữ liệu theo format API
            // QUAN TRỌNG: 
            // 1. Backend PHẢI sử dụng shippingFee từ request (không tự tính lại)
            // 2. shippingFee này đã được tính từ API /api/v1/shipping/shipping-fee
            // 3. Backend không nên tự gọi lại GHN API trong placeOrder()
            // Normalize và validate số điện thoại trước khi gửi API
            const normalizedPhone = normalizePhoneNumber(orderData.phoneNumber || '');

            if (!isValidVietnamPhoneNumber(normalizedPhone)) {
                alert('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số, bắt đầu bằng 0).');
                setIsSubmitting(false);
                return;
            }

            // Format số điện thoại cho API (có thể cần format international cho GHN)
            const phoneForAPI = formatPhoneForAPI(normalizedPhone, 'vn'); // Hoặc 'international' nếu GHN yêu cầu

            // Resolve ID từ orderData hoặc selected state, đảm bảo convert sang number đúng cách
            const resolvedProvinceId = orderData.provinceId || selectedProvince || '';
            const resolvedDistrictId = orderData.districtId || selectedDistrict || '';
            const resolvedWardId = orderData.wardId || selectedWard || '';

            // Convert sang number, nếu là string rỗng hoặc invalid thì sẽ thành NaN, cần check
            const provinceIdNum = resolvedProvinceId ? Number(resolvedProvinceId) : 0;
            const districtIdNum = resolvedDistrictId ? Number(resolvedDistrictId) : 0;
            const wardIdNum = resolvedWardId ? Number(resolvedWardId) : 0;

            // Validate số ID hợp lệ (không phải NaN và > 0)
            if (isNaN(provinceIdNum) || provinceIdNum <= 0) {
                console.error('❌ Invalid provinceId:', resolvedProvinceId, '→', provinceIdNum);
                throw new Error('Thông tin tỉnh/thành phố không hợp lệ. Vui lòng chọn lại.');
            }
            if (isNaN(districtIdNum) || districtIdNum <= 0) {
                console.error('❌ Invalid districtId:', resolvedDistrictId, '→', districtIdNum);
                throw new Error('Thông tin quận/huyện không hợp lệ. Vui lòng chọn lại.');
            }
            if (isNaN(wardIdNum) || wardIdNum <= 0) {
                console.error('❌ Invalid wardId:', resolvedWardId, '→', wardIdNum);
                throw new Error('Thông tin phường/xã không hợp lệ. Vui lòng chọn lại.');
            }

            const resolvedProvinceName = provinces.find(p => p.value === resolvedProvinceId || p.value === String(resolvedProvinceId))?.label || '';
            const resolvedDistrictName = districts.find(d => d.value === resolvedDistrictId || d.value === String(resolvedDistrictId))?.label || '';
            const resolvedWardName = wards.find(w => w.value === resolvedWardId || w.value === String(resolvedWardId))?.label || '';
            const resolvedPaymentId = (orderData.paymentId === 1 || orderData.paymentId === 2) ? orderData.paymentId : 1; // 1: COD, 2: WALLET
            const resolvedShippingPartnerId = Number(orderData.shippingPartnerId || 1);

            const shippingAddressCombined = [
                (orderData.street || '').trim(),
                resolvedWardName,
                resolvedDistrictName,
                resolvedProvinceName
            ].filter(Boolean).join(', ');

            const apiOrderData = {
                postProductId: orderData.postProductId || product?.postId || product?.id,
                username: orderData.username || localStorage.getItem('username') || '',
                fullName: orderData.fullName || orderData.buyer_name || '',
                street: orderData.street || '',
                shippingAddress: shippingAddressCombined,
                provinceId: provinceIdNum,
                districtId: districtIdNum,
                wardId: wardIdNum,
                provinceName: resolvedProvinceName,
                districtName: resolvedDistrictName,
                wardName: resolvedWardName,
                phoneNumber: phoneForAPI,
                shippingPartnerId: resolvedShippingPartnerId,
                paymentId: Number(resolvedPaymentId),
                paymentMethod: resolvedPaymentId === 2 ? 'WALLET' : 'COD',
                needOrderInvoice: shouldRequestInvoice,
                // ✅ BẮT BUỘC: Backend phải sử dụng shippingFee này (đã tính từ API /api/v1/shipping/shipping-fee)
                // ⚠️ Backend KHÔNG nên tự tính lại từ GHN API trong placeOrder()
                shippingFee: shippingFeeValue,
                productPrice: productPrice,
                totalPrice: totalPriceValue
            };

            console.log('🚀 Sending order data to API:', apiOrderData);
            console.log('💰 Price breakdown (BEFORE place order):', {
                productPrice: productPrice,
                shippingFee: shippingFeeValue,
                totalPrice: totalPriceValue,
                source: {
                    orderData_total_price: orderData.total_price,
                    product_price: product?.price,
                    orderData_shippingFee: orderData.shippingFee,
                    finalShippingFee: finalShippingFee,
                    shippingFee_from_orderData: orderData.shippingFee,
                    shippingFee_used: shippingFeeValue
                },
                verification: {
                    shippingFee_sent_to_backend: shippingFeeValue,
                    shippingFee_displayed_to_user: orderData.shippingFee,
                    match: shippingFeeValue === orderData.shippingFee ? '✅ MATCH' : '⚠️ DIFFERENT'
                },
                backend_note: {
                    message: 'Backend PHẢI sử dụng shippingFee từ request (không tự tính lại)',
                    shippingFee_source: 'API /api/v1/shipping/shipping-fee',
                    shippingFee_value: shippingFeeValue,
                    warning: 'Backend không nên gọi lại GHN API trong placeOrder()',
                    important: 'Nếu Backend tự tính lại, sẽ ra giá KHÁC (ví dụ: 616000 vs 561000)'
                },
                comparison: {
                    api_shipping_fee: shippingFeeValue,  // Giá từ API /shipping-fee
                    expected_in_database: shippingFeeValue,  // Giá cần lưu vào DB
                    warning: 'Backend place-order KHÔNG nên tự tính lại. Phải dùng giá này!'
                }
            });

            // Validate các field quan trọng để tránh gửi payload không hợp lệ (gây 500 từ BE)
            console.log('🔍 Validating order data before sending:', {
                postProductId: apiOrderData.postProductId,
                username: apiOrderData.username,
                fullName: apiOrderData.fullName,
                provinceId: apiOrderData.provinceId,
                districtId: apiOrderData.districtId,
                wardId: apiOrderData.wardId,
                phoneNumber: apiOrderData.phoneNumber,
                shippingPartnerId: apiOrderData.shippingPartnerId,
                paymentId: apiOrderData.paymentId,
                shippingFee: apiOrderData.shippingFee,
                productPrice: apiOrderData.productPrice,
                totalPrice: apiOrderData.totalPrice,
                street: apiOrderData.street,
                shippingAddress: apiOrderData.shippingAddress
            });

            // QUAN TRỌNG: Kiểm tra xem đã có order thành công cho product này chưa
            const { storageKey, username: storageUsername } = resolveOrderStorage();
            const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const currentProductId = apiOrderData.postProductId;
            const currentUsername = apiOrderData.username || storageUsername;

            const existingOrder = existingOrders.find(order =>
                (order.product?.id === currentProductId || order.postProductId === currentProductId) &&
                order.username === currentUsername &&
                (order.order_status === 'PAID' || order.order_status === 'PENDING_PAYMENT' || order.status === 'confirmed' || order.status === 'pending')
            );

            if (existingOrder) {
                console.error('❌ Order already exists for this product:', existingOrder);
                throw new Error(`Bạn đã đặt hàng cho sản phẩm này với mã đơn hàng: ${existingOrder.order_code || existingOrder.id}. Vui lòng kiểm tra đơn hàng của bạn.`);
            }

            // Kiểm tra xem sản phẩm còn available không
            if (!product) {
                console.error('❌ Product not found');
                throw new Error('Sản phẩm không tồn tại hoặc đã bị xóa.');
            }

            // Validate từng field chi tiết
            if (!apiOrderData.postProductId) {
                console.error('❌ Validation failed: postProductId is missing');
                throw new Error('Thiếu thông tin sản phẩm (postProductId).');
            }
            if (!apiOrderData.username || !apiOrderData.username.trim()) {
                console.error('❌ Validation failed: username is missing or empty');
                throw new Error('Thiếu thông tin tài khoản (username).');
            }
            if (!apiOrderData.fullName || !apiOrderData.fullName.trim()) {
                console.error('❌ Validation failed: fullName is missing or empty');
                throw new Error('Thiếu thông tin tên người nhận (fullName).');
            }
            if (!apiOrderData.provinceId || Number(apiOrderData.provinceId) === 0) {
                console.error('❌ Validation failed: provinceId is missing or invalid:', apiOrderData.provinceId);
                throw new Error('Thiếu hoặc thông tin tỉnh/thành phố không hợp lệ (provinceId).');
            }
            if (!apiOrderData.districtId || Number(apiOrderData.districtId) === 0) {
                console.error('❌ Validation failed: districtId is missing or invalid:', apiOrderData.districtId);
                throw new Error('Thiếu hoặc thông tin quận/huyện không hợp lệ (districtId).');
            }
            if (!apiOrderData.wardId || Number(apiOrderData.wardId) === 0) {
                console.error('❌ Validation failed: wardId is missing or invalid:', apiOrderData.wardId);
                throw new Error('Thiếu hoặc thông tin phường/xã không hợp lệ (wardId).');
            }
            if (!apiOrderData.phoneNumber || !apiOrderData.phoneNumber.trim()) {
                console.error('❌ Validation failed: phoneNumber is missing or empty');
                throw new Error('Thiếu số điện thoại người nhận.');
            }
            if (!apiOrderData.shippingPartnerId || Number(apiOrderData.shippingPartnerId) === 0) {
                console.error('❌ Validation failed: shippingPartnerId is missing or invalid:', apiOrderData.shippingPartnerId);
                throw new Error('Thiếu đối tác vận chuyển.');
            }
            if (!(apiOrderData.paymentId === 1 || apiOrderData.paymentId === 2)) {
                console.error('❌ Validation failed: paymentId is invalid:', apiOrderData.paymentId);
                throw new Error('Phương thức thanh toán không hợp lệ (phải là 1 hoặc 2).');
            }
            if (!apiOrderData.street || !apiOrderData.street.trim()) {
                console.warn('⚠️ Warning: street is empty, but continuing...');
            }
            if (!apiOrderData.shippingAddress || !apiOrderData.shippingAddress.trim()) {
                console.warn('⚠️ Warning: shippingAddress is empty, but continuing...');
            }

            console.log('✅ All validations passed, sending order to API...');

            console.log('✅ All validations passed, sending order to API...');

            // Gọi API đặt hàng
            const response = await placeOrder(apiOrderData);

            console.log('📦 API Response:', response);
            console.log('📦 API Response - Full structure:', {
                success: response?.success,
                message: response?.message,
                data: response?.data,
                orderId: response?.data?.orderId || response?.orderId,
                orderCode: response?.data?.orderCode || response?.orderCode,
                fullResponse: response
            });

            // Backend response có thể là:
            // - response.data.orderId (nếu cấu trúc: { data: { orderId: ... } })
            // - response.orderId (nếu cấu trúc: { orderId: ... })
            // - response.success (nếu cấu trúc: { success: true, data: {...} })

            const orderId = response.data?.orderId || response.data?.id || response.orderId || response.id || null;
            const orderCode = response.data?.orderCode || response.data?.code || response.orderCode || response.code || null;

            // QUAN TRỌNG: Kiểm tra xem response có thông báo soldout không
            const responseMessage = response.message || response.data?.message || '';
            const isSoldOutResponse = responseMessage.toLowerCase().includes('soldout') ||
                responseMessage.toLowerCase().includes('hết hàng') ||
                responseMessage.toLowerCase().includes('không còn hàng') ||
                response.data?.error?.message?.toLowerCase().includes('soldout');

            // Nếu response báo soldout, throw error ngay lập tức để không lưu vào database
            if (isSoldOutResponse) {
                console.error('❌ Product is soldout from backend response:', responseMessage);
                throw new Error('Sản phẩm đã hết hàng hoặc không còn khả dụng. Vui lòng chọn sản phẩm khác.');
            }

            // QUAN TRỌNG: Chỉ coi là thành công khi response.success === true VÀ có orderId hợp lệ
            // KHÔNG dùng response.success !== false vì nó sẽ true cả khi success là undefined/null
            const isSuccess = response.success === true && orderId !== null && orderId !== undefined;

            if (isSuccess) {
                console.log('✅ Order placed successfully:', orderId);

                // CHỈ refresh số dư ví sau khi XÁC NHẬN order thực sự thành công
                // Backend đã trừ tiền và tạo order thành công
                refreshWalletBalance();

                const newOrderId = orderId || `ORD${Date.now()}`;
                const finalOrderCode = orderCode || response.data?.orderCode || generateOrderCode();
                const currentTime = new Date().toISOString();

                setOrderId(newOrderId);
                if (shouldRequestInvoice) {
                    loadInvoice(newOrderId);
                } else {
                    setInvoiceLoading(false);
                }

                // Fetch order details từ API để lấy shipping fee chính xác
                try {
                    console.log('📦 Fetching order details for shipping fee, orderId:', newOrderId);
                    const orderDetailsResponse = await getOrderDetails(newOrderId);
                    if (orderDetailsResponse?.success && orderDetailsResponse?.data) {
                        const details = orderDetailsResponse.data;
                        console.log('✅ Order details fetched:', details);
                        console.log('💰 Shipping fee from API:', details.shippingFee);

                        // Lưu order details để hiển thị
                        setOrderDetailsFromAPI(details);

                        // Cập nhật orderData với shipping fee chính xác từ API
                        setOrderData(prev => ({
                            ...prev,
                            order_code: finalOrderCode,
                            order_status: orderData.paymentId === 2 ? 'PAID' : 'PENDING_PAYMENT',
                            created_at: currentTime,
                            paid_at: orderData.paymentId === 2 ? currentTime : '',
                            transaction_id: response.data?.transactionId || `TXN${Date.now()}`,
                            shipping_partner: shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.name || 'Giao hàng nhanh',
                            // Cập nhật shipping fee từ API
                            shippingFee: details.shippingFee || prev.shippingFee || 0,
                            total_price: details.price || prev.total_price || 0,
                            final_price: details.finalPrice || (details.price + details.shippingFee) || prev.final_price || 0
                        }));
                    } else {
                        console.warn('⚠️ Failed to fetch order details, using cached values');
                        // Vẫn cập nhật orderData nhưng không có shipping fee từ API
                        setOrderData(prev => ({
                            ...prev,
                            order_code: finalOrderCode,
                            order_status: orderData.paymentId === 2 ? 'PAID' : 'PENDING_PAYMENT',
                            created_at: currentTime,
                            paid_at: orderData.paymentId === 2 ? currentTime : '',
                            transaction_id: response.data?.transactionId || `TXN${Date.now()}`,
                            shipping_partner: shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.name || 'Giao hàng nhanh'
                        }));
                    }
                } catch (orderDetailsError) {
                    console.error('❌ Error fetching order details:', orderDetailsError);
                    // Vẫn tiếp tục với cached values
                    setOrderData(prev => ({
                        ...prev,
                        order_code: finalOrderCode,
                        order_status: orderData.paymentId === 2 ? 'PAID' : 'PENDING_PAYMENT',
                        created_at: currentTime,
                        paid_at: orderData.paymentId === 2 ? currentTime : '',
                        transaction_id: response.data?.transactionId || `TXN${Date.now()}`,
                        shipping_partner: shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.name || 'Giao hàng nhanh'
                    }));
                }

                // Lưu đơn hàng vào localStorage để có thể theo dõi
                const newOrder = {
                    id: newOrderId,
                    order_code: finalOrderCode,
                    orderCode: finalOrderCode, // Lưu cả orderCode để dễ match
                    status: orderData.paymentId === 2 ? 'confirmed' : 'pending',
                    order_status: orderData.paymentId === 2 ? 'PAID' : 'PENDING_PAYMENT',
                    createdAt: currentTime,
                    paidAt: orderData.paymentId === 2 ? currentTime : '',
                    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 ngày
                    product: product,
                    buyerName: orderData.buyer_name,
                    buyerPhone: orderData.phoneNumber,
                    buyerEmail: orderData.buyer_email,
                    deliveryAddress: orderData.shippingAddress,
                    deliveryPhone: orderData.phoneNumber,
                    deliveryNote: orderData.deliveryNote || '',
                    paymentMethod: orderData.paymentId === 2 ? 'ewallet' : 'cod',
                    totalPrice: product.price,
                    shippingFee: orderData.shippingFee || 0,
                    finalPrice: product.price + (orderData.shippingFee || 0),
                    needInvoice: shouldRequestInvoice
                };

                // CHỈ lưu vào localStorage khi order THỰC SỰ thành công
                // QUAN TRỌNG: Lưu username để filter theo user sau này
                const { storageKey } = resolveOrderStorage();
                const currentUsername = localStorage.getItem('username') || '';
                const newOrderWithUser = {
                    ...newOrder,
                    username: currentUsername, // Lưu username để filter theo user
                    userId: currentUsername, // Alias cho compatibility
                    createdBy: currentUsername // Alias cho compatibility
                };


                // Lưu đơn hàng vào localStorage riêng của từng user
                const resolvedStorageKey = currentUsername ? storageKey : 'orders_guest';
                const existingOrders = JSON.parse(localStorage.getItem(resolvedStorageKey) || '[]');
                existingOrders.push(newOrderWithUser);
                localStorage.setItem(resolvedStorageKey, JSON.stringify(existingOrders));

                setCurrentStep(3);
            } else {
                // Xử lý trường hợp response không thành công
                const errorMsg = response.message || response.data?.message || 'Có lỗi xảy ra khi đặt hàng';

                console.error('❌ Order placement failed:', {
                    success: response.success,
                    message: errorMsg,
                    orderId: orderId,
                    response: response
                });

                // Kiểm tra xem có phải lỗi soldout không (từ response)
                const isSoldOutFromResponse = errorMsg.toLowerCase().includes('soldout') ||
                    errorMsg.toLowerCase().includes('hết hàng') ||
                    errorMsg.toLowerCase().includes('không còn hàng') ||
                    response.data?.error?.message?.toLowerCase().includes('soldout');

                // Nếu là lỗi soldout, throw error đặc biệt để xử lý riêng
                if (isSoldOutFromResponse) {
                    throw new Error('Sản phẩm đã hết hàng hoặc không còn khả dụng. Vui lòng chọn sản phẩm khác.');
                }

                // Nếu backend trả về success: false nhưng vẫn có orderId
                // → Backend có thể đã tạo order và trừ tiền nhưng trả về lỗi
                // → Cần kiểm tra và rollback nếu cần
                if (orderId && response.success === false) {
                    console.warn('⚠️ WARNING: Backend returned success: false but has orderId. Possible partial transaction:', orderId);
                    console.warn('⚠️ Backend may have created order and deducted wallet balance but returned error.');
                    console.warn('⚠️ User may need to contact support to verify/refund.');
                }

                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('❌ Place order error:', error);

            // Hiển thị lỗi chi tiết cho người dùng
            let errorMessage = error.response?.data?.message ||
                error.response?.data?.error?.message ||
                error.message ||
                'Không thể đặt hàng. Vui lòng thử lại sau.';

            // Kiểm tra xem có phải lỗi soldout không
            const isSoldOut = errorMessage.toLowerCase().includes('soldout') ||
                errorMessage.toLowerCase().includes('hết hàng') ||
                errorMessage.toLowerCase().includes('không còn hàng') ||
                error.response?.data?.error?.message?.toLowerCase().includes('soldout');

            // Kiểm tra xem có phải lỗi đã đặt hàng không
            const isAlreadyOrdered = errorMessage.includes('đã đặt hàng') ||
                errorMessage.includes('already exists') ||
                errorMessage.includes('order already');

            // Log chi tiết để debug lỗi 500
            console.error('🔍 Error details:', {
                message: errorMessage,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                error: error.response?.data?.error,
                url: error.config?.url,
                method: error.config?.method,
                payload: error.config?.data ? (typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data) : null,
                headers: error.config?.headers
            });

            // Nếu là lỗi 500, log thêm thông tin payload để debug
            if (error.response?.status === 500 && apiOrderData) {
                console.error('🚨 500 Internal Server Error - Payload sent:', JSON.stringify(apiOrderData, null, 2));
                console.error('🚨 500 Internal Server Error - Backend error details:', error.response?.data);

                // Hiển thị thông tin debug cho developer
                console.error('🚨 Debug info for 500 error:', {
                    requestPayload: apiOrderData,
                    backendResponse: error.response?.data,
                    validationChecks: {
                        postProductId: !!apiOrderData.postProductId,
                        username: !!apiOrderData.username,
                        fullName: !!apiOrderData.fullName,
                        provinceId: apiOrderData.provinceId,
                        districtId: apiOrderData.districtId,
                        wardId: apiOrderData.wardId,
                        phoneNumber: apiOrderData.phoneNumber,
                        shippingPartnerId: apiOrderData.shippingPartnerId,
                        paymentId: apiOrderData.paymentId,
                        shippingFee: apiOrderData.shippingFee,
                        productPrice: apiOrderData.productPrice,
                        totalPrice: apiOrderData.totalPrice
                    }
                });
            }

            // QUAN TRỌNG: Refresh wallet để cập nhật số dư sau khi lỗi
            // Nếu backend đã trừ tiền nhưng đặt hàng thất bại, số dư sẽ phản ánh đúng
            // Nếu backend không trừ tiền, số dư sẽ giữ nguyên
            refreshWalletBalance();

            // Xử lý các trường hợp lỗi đặc biệt
            if (isAlreadyOrdered) {
                // Đã đặt hàng rồi - redirect về trang đơn hàng
                // Lấy orderId từ localStorage để điều hướng đến trang order tracking cụ thể
                const { storageKey, username: storageUsername } = resolveOrderStorage();
                const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const currentProductId = product?.id;
                const currentUsername = storageUsername || localStorage.getItem('username') || '';
                const existingOrder = existingOrders.find(order =>
                    (order.product?.id === currentProductId || order.postProductId === currentProductId) &&
                    order.username === currentUsername &&
                    (order.order_status === 'PAID' || order.order_status === 'PENDING_PAYMENT' || order.status === 'confirmed' || order.status === 'pending')
                );

                const orderId = existingOrder ? (existingOrder.id || existingOrder.order_code || existingOrder.orderId) : null;

                setModalConfig({
                    type: 'warning',
                    title: 'Đơn hàng đã tồn tại',
                    message: errorMessage,
                    actions: [
                        {
                            label: 'Xem đơn hàng',
                            type: 'primary',
                            onClick: () => {
                                setShowModal(false);
                                // Điều hướng đến trang order tracking của đơn hàng cụ thể
                                if (orderId) {
                                    navigate(`/order-tracking/${orderId}`);
                                } else {
                                    navigate('/orders');
                                }
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
                return;
            }

            if (isSoldOut) {
                // Sản phẩm đã hết hàng - redirect về trang sản phẩm hoặc trang chủ
                setModalConfig({
                    type: 'error',
                    title: 'Sản phẩm đã hết hàng',
                    message: 'Sản phẩm này đã được bán hoặc không còn hàng. Vui lòng chọn sản phẩm khác.',
                    actions: [
                        {
                            label: 'Xem sản phẩm khác',
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
                return;
            }

            // Hiển thị thông báo lỗi cho người dùng
            setModalConfig({
                type: 'error',
                title: 'Đặt hàng thất bại',
                message: errorMessage + '\n\nNếu tiền đã bị trừ nhưng đơn hàng không được tạo, vui lòng liên hệ hỗ trợ để được hoàn tiền.',
                actions: [
                    {
                        label: 'Thử lại',
                        type: 'primary',
                        onClick: () => {
                            setShowModal(false);
                            // Không làm gì, để người dùng thử lại
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
        } finally {
            setIsSubmitting(false);
        }
    };

    // Navigation handlers
    const handleGoHome = () => {
        navigate('/');
    };

    const handleViewOrder = () => {
        // Điều hướng đến trang order history (OrderList) để xem tất cả đơn hàng
        navigate('/orders');
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
    if (showModal) {
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
                    {/* Main Heading */}
                    <div className="place-order-header-content">
                        <h1 className="page-title-main">Thông tin Giao hàng & Thanh toán</h1>
                        <p className="page-subtitle">Vui lòng cung cấp chi tiết giao hàng và thanh toán của bạn để tiếp tục.</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="progress-steps">
                        <div className={`step ${currentStep === 1 ? 'active' : ''}`}>
                            <div className="step-circle">
                                <span className="step-number">1</span>
                            </div>
                            <div className="step-label">Thông tin</div>
                        </div>
                        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
                            <div className="step-circle">
                                <span className="step-number">2</span>
                            </div>
                            <div className="step-label">Xác nhận</div>
                        </div>
                        <div className={`step ${currentStep === 3 ? 'active' : ''}`}>
                            <div className="step-circle">
                                <span className="step-number">3</span>
                            </div>
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
                                    <div className="section-header">
                                        <h3 className="section-title">
                                            <User className="section-icon" />
                                            Thông tin người mua
                                        </h3>
                                        <button
                                            className="btn btn-update-info"
                                            onClick={handleFillProfile}
                                        >
                                            <User size={16} />
                                            Cập nhật thông tin
                                        </button>
                                    </div>

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


                                {/* Thông tin giao hàng */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <MapPin className="section-icon" />
                                        Thông tin giao hàng
                                    </h3>
                                    {/* Địa chỉ theo từng cấp giống Profile */}
                                    <div className="form-group">
                                        <label className="form-label">Tỉnh/Thành phố*</label>
                                        <select
                                            className="form-input"
                                            value={selectedProvince}
                                            onChange={(e) => handleProvinceChange(e.target.value)}
                                        >
                                            <option value="">-- Chọn Tỉnh/Thành --</option>
                                            {provinces.map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Quận/Huyện*</label>
                                        <select
                                            className="form-input"
                                            value={selectedDistrict}
                                            onChange={(e) => handleDistrictChange(e.target.value)}
                                            disabled={!selectedProvince || isLoadingDistricts}
                                        >
                                            <option value="">{isLoadingDistricts ? 'Đang tải huyện...' : '-- Chọn Quận/Huyện --'}</option>
                                            {districts.map(d => (
                                                <option key={d.value} value={d.value}>{d.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phường/Xã*</label>
                                        <select
                                            className="form-input"
                                            value={selectedWard}
                                            onChange={(e) => handleWardChange(e.target.value)}
                                            disabled={!selectedDistrict || isLoadingWards}
                                        >
                                            <option value="">{isLoadingWards ? 'Đang tải xã...' : '-- Chọn Phường/Xã --'}</option>
                                            {wards.map(w => (
                                                <option key={w.value} value={w.value}>{w.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Địa chỉ chi tiết (Số nhà, đường)*</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={orderData.street || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                recomputeShippingAddress({ street: value });
                                            }}
                                            placeholder="Ví dụ: 7 Đ. D1, Long Thạnh Mỹ, Thủ Đức"
                                        />
                                    </div>
                                    {/* Bỏ phần nhập địa chỉ tự do vì đã có 4 trường trên */}
                                    <div className="form-group">
                                        <label className="form-label">Số điện thoại nhận hàng *</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={orderData.delivery_phone}
                                            onChange={(e) => handleInputChange('delivery_phone', e.target.value)}
                                            placeholder="Nhập số điện thoại nhận hàng"
                                        />
                                        <small className="form-help">Tự động điền từ profile, có thể chỉnh sửa</small>
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
                                        <div className="shipping-partners-container" ref={shippingPartnersRef}>
                                            <div
                                                className={`shipping-partner-selected ${shippingPartners.length <= 1 ? 'no-dropdown' : ''}`}
                                                onClick={() => {
                                                    if (shippingPartners.length > 1) {
                                                        setShowShippingOptions(!showShippingOptions);
                                                    }
                                                }}
                                                style={{ cursor: shippingPartners.length <= 1 ? 'default' : 'pointer' }}
                                            >
                                                <div className="shipping-partner-info">
                                                    <div className="shipping-partner-name">
                                                        {(() => {
                                                            const selectedPartner = shippingPartners.find(p => p.id === orderData.shippingPartnerId);
                                                            const partnerName = selectedPartner?.name || 'Giao hàng nhanh';
                                                            const logoPath = getShippingPartnerLogo(partnerName);
                                                            return (
                                                                <>
                                                                    {logoPath && (
                                                                        <img
                                                                            src={logoPath}
                                                                            alt={partnerName}
                                                                            className="shipping-partner-logo"
                                                                        />
                                                                    )}
                                                                    {partnerName}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="shipping-partner-desc">
                                                        {shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.description || 'Giao hàng nhanh trong 24h'}
                                                    </div>
                                                </div>
                                                {shippingPartners.length > 1 && (
                                                    showShippingOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                                                )}
                                            </div>

                                            {showShippingOptions && (
                                                <div className="shipping-partners-list">
                                                    {shippingPartners
                                                        .filter((partner) => partner.id !== orderData.shippingPartnerId)
                                                        .map((partner) => {
                                                            const isSelected = orderData.shippingPartnerId === partner.id;

                                                            return (
                                                                <div
                                                                    key={partner.id}
                                                                    className={`shipping-partner-option ${isSelected ? 'selected' : ''}`}
                                                                    onClick={() => {
                                                                        handleShippingPartnerChange(partner.id);
                                                                        setShowShippingOptions(false);
                                                                    }}
                                                                >
                                                                    <div className="shipping-partner-info">
                                                                        <div className="shipping-partner-name">
                                                                            {(() => {
                                                                                const logoPath = getShippingPartnerLogo(partner.name);
                                                                                return (
                                                                                    <>
                                                                                        {logoPath && (
                                                                                            <img
                                                                                                src={logoPath}
                                                                                                alt={partner.name}
                                                                                                className="shipping-partner-logo"
                                                                                            />
                                                                                        )}
                                                                                        {partner.name}
                                                                                    </>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                        <div className="shipping-partner-desc">{partner.description}</div>
                                                                    </div>
                                                                    {isSelected && <div className="selected-indicator">✓</div>}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                        <small className="form-help">
                                            Hiện tại chỉ hỗ trợ Giao Hàng Nhanh (GHN) để đảm bảo chất lượng dịch vụ tốt nhất
                                        </small>
                                    </div>
                                </div>

                                {/* Phương thức thanh toán */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <CreditCard className="section-icon" />
                                        Phương thức thanh toán
                                    </h3>
                                    <div className="payment-methods">
                                        {/* COD */}
                                        <div
                                            className={`payment-option ${orderData.paymentId === 1 ? 'selected' : ''}`}
                                            onClick={() => handlePaymentMethodChange(1)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="payment-info">
                                                <div className="payment-name">
                                                    <Package size={20} />
                                                    Thanh toán khi nhận hàng (COD)
                                                </div>
                                                <div className="payment-desc">Thanh toán cho shipper khi nhận hàng</div>
                                            </div>
                                        </div>

                                        {/* Ví điện tử */}
                                        <div
                                            className={`payment-option ${orderData.paymentId === 2 ? 'selected' : ''}`}
                                            onClick={() => handlePaymentMethodChange(2)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="payment-info">
                                                <div className="payment-info-left">
                                                    <div className="payment-name">
                                                        <Wallet size={20} />
                                                        Ví điện tử
                                                    </div>
                                                    <div className="payment-desc">Thanh toán trực tuyến qua ví điện tử</div>
                                                </div>
                                                {orderData.paymentId === 2 && (
                                                    <div className="wallet-balance-container" ref={walletBalanceRef}>
                                                        <div
                                                            className="wallet-balance-selected"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsWalletBalanceExpanded(!isWalletBalanceExpanded);
                                                            }}
                                                        >
                                                            <div className="wallet-balance-info">
                                                                <div className="wallet-balance-name">
                                                                    <Wallet size={18} />
                                                                    Số dư ví điện tử
                                                                </div>
                                                            </div>
                                                            {isWalletBalanceExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                        </div>

                                                        {isWalletBalanceExpanded && (
                                                            <div className="wallet-balance-dropdown">
                                                                {walletLoading ? (
                                                                    <div className="place-order-wallet-loading">
                                                                        <div className="place-order-loading-spinner-small"></div>
                                                                        <span>Đang tải số dư ví...</span>
                                                                    </div>
                                                                ) : walletError ? (
                                                                    <div className="place-order-wallet-error">
                                                                        <AlertCircle size={16} />
                                                                        <span>{walletError}</span>
                                                                        <button
                                                                            className="place-order-retry-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                refreshWalletBalance();
                                                                            }}
                                                                            title="Thử lại"
                                                                            type="button"
                                                                        >
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="wallet-balance-content">
                                                                        <div className="wallet-balance-header">
                                                                            <span className="wallet-balance-label">Số dư hiện tại:</span>
                                                                            <button
                                                                                className="wallet-eye-toggle-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setShowWalletBalance(!showWalletBalance);
                                                                                }}
                                                                                title={showWalletBalance ? "Ẩn số dư" : "Hiển thị số dư"}
                                                                                type="button"
                                                                            >
                                                                                {showWalletBalance ? (
                                                                                    <Eye size={18} />
                                                                                ) : (
                                                                                    <EyeOff size={18} />
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                        <div className="wallet-balance-amount-row">
                                                                            <div className="wallet-balance-amount-wrapper">
                                                                                {showWalletBalance ? (
                                                                                    <span className="wallet-balance-amount">{formatWalletCurrency(walletBalance)}</span>
                                                                                ) : (
                                                                                    <span className="wallet-balance-amount-masked">•••••••• ₫</span>
                                                                                )}
                                                                                <button
                                                                                    className="wallet-refresh-btn"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        refreshWalletBalance();
                                                                                    }}
                                                                                    title="Cập nhật số dư"
                                                                                    type="button"
                                                                                >
                                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        </div>
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
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="order-confirmation">
                                <h3 className="section-title">Xác nhận đơn hàng</h3>

                                {/* Thông tin đơn hàng */}
                                <div className="confirmation-section">
                                    <h4>Thông tin đơn hàng</h4>
                                    <div className="info-item">
                                        <span className="info-label">Mã đơn hàng:</span>
                                        <span className="info-value order-code">{orderData.order_code || 'Sẽ được tạo sau khi đặt hàng'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Trạng thái:</span>
                                        <span className="info-value order-status" data-status={orderData.order_status}>{getOrderStatusText(orderData.order_status)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Thời gian tạo:</span>
                                        <span className="info-value">{formatDateTime(orderData.created_at)}</span>
                                    </div>
                                </div>

                                <div className="confirmation-section">
                                    <h4>Thông tin người mua</h4>
                                    <div className="info-item">
                                        <span className="info-label">Họ tên:</span>
                                        <span className="info-value">{orderData.buyer_name}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Số điện thoại:</span>
                                        <span className="info-value">{orderData.phoneNumber}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Email:</span>
                                        <span className="info-value">{orderData.buyer_email}</span>
                                    </div>
                                </div>

                                <div className="confirmation-section">
                                    <h4>Thông tin giao hàng</h4>
                                    <div className="info-item">
                                        <span className="info-label">Địa chỉ giao hàng:</span>
                                        <span className="info-value">{orderData.shippingAddress}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Số điện thoại nhận hàng:</span>
                                        <span className="info-value">{orderData.delivery_phone}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Đối tác vận chuyển:</span>
                                        <span className="info-value">
                                            {orderData.shipping_partner || shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.name || 'Giao hàng nhanh'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Mã vận đơn:</span>
                                        <span className="info-value tracking-number">{orderData.tracking_number || 'Sẽ được cập nhật khi giao hàng'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Phí vận chuyển:</span>
                                        <span className="info-value">
                                            {shippingFeeLoading ? (
                                                <span className="text-muted-foreground">Đang tính...</span>
                                            ) : shippingFeeFromAPI && orderData.shippingFee > 0 ? (
                                                formatCurrency(orderData.shippingFee)
                                            ) : (
                                                <span className="text-muted-foreground">Chưa có</span>
                                            )}
                                        </span>
                                    </div>
                                    {orderData.shipped_at && (
                                        <div className="info-item">
                                            <span className="info-label">Thời gian giao cho vận chuyển:</span>
                                            <span className="info-value">{formatDateTime(orderData.shipped_at)}</span>
                                        </div>
                                    )}
                                    {orderData.delivered_at && (
                                        <div className="info-item">
                                            <span className="info-label">Thời gian giao thành công:</span>
                                            <span className="info-value">{formatDateTime(orderData.delivered_at)}</span>
                                        </div>
                                    )}
                                    {orderData.delivery_note && (
                                        <div className="info-item">
                                            <span className="info-label">Ghi chú giao hàng:</span>
                                            <span className="info-value">{orderData.delivery_note}</span>
                                        </div>
                                    )}
                                </div>


                                <div className="confirmation-section">
                                    <h4>Thông tin thanh toán</h4>
                                    <div className="info-item">
                                        <span className="info-label">Phương thức thanh toán:</span>
                                        <span className="info-value">{getPaymentMethodText(orderData.payment_method)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Mã giao dịch:</span>
                                        <span className="info-value transaction-id">{orderData.transaction_id || 'Sẽ được tạo sau khi thanh toán'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Số dư hiện tại:</span>
                                        <span className="info-value">{formatCurrency(walletBalance)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Số tiền thanh toán:</span>
                                        <span className="info-value payment-amount">{formatCurrency(orderData.final_price)}</span>
                                    </div>
                                    {orderData.paid_at && (
                                        <div className="info-item">
                                            <span className="info-label">Thời gian thanh toán:</span>
                                            <span className="info-value">{formatDateTime(orderData.paid_at)}</span>
                                        </div>
                                    )}
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

                                {orderData.need_order_invoice && (
                                    <div className="invoice-result">
                                        <div className="invoice-result-header">
                                            <FileText size={20} />
                                            <span>Hóa đơn điện tử</span>
                                        </div>
                                        {invoiceLoading ? (
                                            <div className="invoice-loading">
                                                <div className="place-order-loading-spinner-small" />
                                                <span>Đang chuẩn bị hóa đơn...</span>
                                            </div>
                                        ) : invoiceData?.pdfUrl ? (
                                            <div className="invoice-ready">
                                                <div className="invoice-status-info">
                                                    <span>Mã hóa đơn:</span>
                                                    <strong>{invoiceData.invoiceNumber || invoiceData.invoiceId || '--'}</strong>
                                                </div>
                                                <div className="invoice-actions">
                                                    <a
                                                        href={invoiceData.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-primary invoice-download-btn"
                                                        title="Tải hóa đơn PDF"
                                                    >
                                                        <Download size={18} />
                                                        <span>Tải hóa đơn</span>
                                                    </a>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => loadInvoice(orderId)}
                                                        title="Tải lại hóa đơn"
                                                    >
                                                        <RefreshCw size={16} />
                                                        <span>Tải lại</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="invoice-pending">
                                                <div className={`invoice-message ${invoiceError ? 'invoice-message-error' : 'invoice-message-info'}`}>
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
                                                <div className="invoice-actions">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => loadInvoice(orderId)}
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

                                    <div className="separator"></div>

                                    <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                                        <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-card-foreground">{product.title}</h3>
                                            <p className="text-sm text-muted-foreground">{product.brand} • {product.model}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="badge badge-outline">{product.conditionLevel}</span>
                                        </div>
                                    </div>

                                    <div className="separator"></div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Giá sản phẩm</span>
                                            <span className="font-medium text-foreground">
                                                {currentStep === 3 && orderDetailsFromAPI ? (
                                                    // Sau khi đặt hàng thành công, ưu tiên dùng price từ API
                                                    formatCurrency(orderDetailsFromAPI.price || orderData.total_price)
                                                ) : (
                                                    formatCurrency(orderData.total_price)
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Phí vận chuyển</span>
                                            <div className="text-right">
                                                {currentStep === 3 && orderDetailsFromAPI ? (
                                                    // Sau khi đặt hàng thành công, ưu tiên dùng shipping fee từ API
                                                    (orderDetailsFromAPI.shippingFee > 0
                                                        ? <span className="font-medium text-foreground">{formatCurrency(orderDetailsFromAPI.shippingFee)}</span>
                                                        : (orderData.shippingFee > 0
                                                            ? <span className="font-medium text-foreground">{formatCurrency(orderData.shippingFee)}</span>
                                                            : <span className="text-muted-foreground">Miễn phí</span>
                                                        ))
                                                ) : shippingFeeLoading ? (
                                                    <span className="text-muted-foreground">Đang tính...</span>
                                                ) : shippingFeeFromAPI && orderData.shippingFee > 0 ? (
                                                    <span className="font-medium text-foreground">{formatCurrency(orderData.shippingFee)}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Chưa có</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shipping-fee-note">Phí vận chuyển có thể phát sinh hoặc thay đổi tùy theo đơn vị vận chuyển GHN.</div>

                                        <div className="separator"></div>

                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground">Tổng cộng</span>
                                            <span className="text-2xl font-bold text-foreground">
                                                {currentStep === 3 && orderDetailsFromAPI ? (
                                                    // Sau khi đặt hàng thành công, ưu tiên dùng finalPrice từ API; nếu thiếu, fallback từ FE
                                                    (() => {
                                                        const p = Number(orderDetailsFromAPI.price || orderData.total_price || 0);
                                                        const s = Number((orderDetailsFromAPI.shippingFee && orderDetailsFromAPI.shippingFee > 0) ? orderDetailsFromAPI.shippingFee : (orderData.shippingFee || 0));
                                                        const total = Number(orderDetailsFromAPI.finalPrice || (p + s) || orderData.final_price || 0);
                                                        return formatCurrency(total);
                                                    })()
                                                ) : (
                                                    formatCurrency(orderData.final_price)
                                                )}
                                            </span>
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

                {/* Navigation Actions - Outside form component */}
                {currentStep === 1 && (
                    <div className="form-actions">
                        <button
                            className="back-to-product-btn"
                            onClick={() => navigate(`/product/${id}`)}
                        >
                            <ArrowLeft size={16} />
                            <span>Quay về sản phẩm</span>
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => setCurrentStep(2)}
                            disabled={!isFormValid()}
                        >
                            <span>Tiếp tục</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}
export default PlaceOrder;

//Hello

