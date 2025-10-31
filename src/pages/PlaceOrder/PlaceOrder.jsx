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
    placeOrder,
    getShippingFee
} from '../../api/orderApi';
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

    // Sử dụng custom hook để quản lý số dư ví
    const { balance: walletBalance, loading: walletLoading, error: walletError, refreshBalance: refreshWalletBalance, formatCurrency: formatWalletCurrency } = useWalletBalance();
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

    // Địa chỉ dạng từng cấp giống Profile
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const { districts, wards, isLoadingDistricts, isLoadingWards } = useAddressLoading(selectedProvince, selectedDistrict);

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState(null);

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
    const loadUserProfile = useCallback(async () => {
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

                // Tự động fill thông tin nếu có
                if (profileData.fullName) {
                    // Tạo địa chỉ đầy đủ từ các trường địa chỉ
                    const fullAddress = [
                        profileData.street,
                        profileData.wardName,
                        profileData.districtName,
                        profileData.provinceName
                    ].filter(Boolean).join(', ');

                    console.log('🔍 Setting order data:', {
                        fullName: profileData.fullName,
                        phoneNumber: profileData.phoneNumber,
                        email: profileData.email,
                        fullAddress
                    });

                    setOrderData(prev => ({
                        ...prev,
                        username: localStorage.getItem('username') || 'user123',
                        buyer_name: profileData.fullName,
                        fullName: profileData.fullName,
                        buyer_email: profileData.email || '',
                        phoneNumber: profileData.phoneNumber || '',
                        shippingAddress: fullAddress || '',
                        street: profileData.street || '',
                        provinceId: profileData.provinceId || '',
                        districtId: profileData.districtId || '',
                        wardId: profileData.wardId || '',
                        delivery_phone: profileData.phoneNumber || ''
                    }));

                    // Sync dropdowns
                    setSelectedProvince(profileData.provinceId || '');
                    setSelectedDistrict(profileData.districtId || '');
                    setSelectedWard(profileData.wardId || '');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            // Show all shipping partners from API
            if (shippingData && shippingData.length > 0) {
                setShippingPartners(shippingData);

                // Auto-select first fast delivery option
                const fastDeliveryPartner = shippingData.find(partner =>
                    partner.name?.toLowerCase().includes('nhanh') ||
                    partner.name?.toLowerCase().includes('fast') ||
                    partner.description?.toLowerCase().includes('nhanh') ||
                    partner.description?.toLowerCase().includes('fast')
                );

                if (fastDeliveryPartner) {
                    setOrderData(prev => ({
                        ...prev,
                        shippingPartnerId: fastDeliveryPartner.id
                    }));
                }
            } else {
                // Fallback data if API fails
                setShippingPartners([
                    { id: 1, name: 'Giao hàng nhanh', description: 'Giao hàng nhanh trong 24h', fee: 50000 },
                    { id: 2, name: 'Giao hàng tiêu chuẩn', description: 'Giao hàng tiêu chuẩn 2-3 ngày', fee: 30000 },
                    { id: 3, name: 'Giao hàng tiết kiệm', description: 'Giao hàng tiết kiệm 3-5 ngày', fee: 20000 }
                ]);

                setOrderData(prev => ({
                    ...prev,
                    shippingPartnerId: 1
                }));
            }
        } catch (error) {
            console.error('Error loading shipping partners:', error);
            // Set default shipping partners if API fails
            setShippingPartners([
                { id: 1, name: 'Giao hàng nhanh', description: 'Giao hàng nhanh trong 24h', fee: 50000 },
                { id: 2, name: 'Giao hàng tiêu chuẩn', description: 'Giao hàng tiêu chuẩn 2-3 ngày', fee: 30000 },
                { id: 3, name: 'Giao hàng tiết kiệm', description: 'Giao hàng tiết kiệm 3-5 ngày', fee: 20000 }
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

        // Load user profile và API data
        loadUserProfile();
        loadApiData();
    }, [navigate, loadUserProfile, loadApiData]);

    // Reload profile khi user quay lại từ trang profile
    useEffect(() => {
        const handleFocus = () => {
            if (document.visibilityState === 'visible') {
                loadUserProfile();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [loadUserProfile]);

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
        try {
            const postId = orderData.postProductId || product?.id;
            const provinceId = (orderData.provinceId || selectedProvince) || '';
            const districtId = (orderData.districtId || selectedDistrict) || '';
            const wardId = (orderData.wardId || selectedWard) || '';
            const provinceName = provinces.find(p => p.value === provinceId)?.label || '';
            const districtName = districts.find(d => d.value === districtId)?.label || '';
            const wardName = wards.find(w => w.value === wardId)?.label || '';
            const paymentId = orderData.paymentId || 2;

            if (!postId || !provinceName || !districtName || !wardName) return; // Chưa đủ thông tin

            const res = await getShippingFee({ postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId });
            // Chuẩn hóa nhiều định dạng đáp ứng từ BE
            const raw = res?.data ?? res ?? {};
            const data = raw?.data ?? raw;
            const fee = Number(
                data?.shippingFee ??
                data?.fee ??
                data?.total ??
                raw?.total ??
                raw?.shippingFee ??
                0
            );

            setOrderData(prev => ({
                ...prev,
                shippingFee: fee,
                // Map thêm thông tin chi tiết nếu có (phục vụ UI hiển thị)
                shipping_base_fee: Number(data?.service_fee ?? prev.shipping_base_fee ?? 0),
                shipping_per_km_fee: Number(prev.shipping_per_km_fee ?? 0),
                final_price: (prev.total_price || 0) + fee,
            }));
        } catch (e) {
            console.warn('Failed to fetch shipping fee, fallback to 50000:', e);
            setOrderData(prev => ({
                ...prev,
                shippingFee: prev.shippingFee || 50000,
                final_price: (prev.total_price || 0) + (prev.shippingFee || 50000)
            }));
        }
    }, [orderData.postProductId, orderData.paymentId, orderData.provinceId, orderData.districtId, orderData.wardId, selectedProvince, selectedDistrict, selectedWard, product?.id, provinces, districts, wards]);

    // Tự động tính lại phí vận chuyển khi địa chỉ hoặc phương thức thanh toán thay đổi
    useEffect(() => {
        refreshShippingFee();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData.postProductId, orderData.paymentId, orderData.provinceId, orderData.districtId, orderData.wardId, selectedProvince, selectedDistrict, selectedWard]);

    const handleProvinceChange = (provId) => {
        setSelectedProvince(provId);
        setSelectedDistrict('');
        setSelectedWard('');
        recomputeShippingAddress({ provinceId: provId, districtId: '', wardId: '' });
    };

    const handleDistrictChange = (distId) => {
        setSelectedDistrict(distId);
        setSelectedWard('');
        recomputeShippingAddress({ districtId: distId, wardId: '' });
    };

    const handleWardChange = (wardId) => {
        setSelectedWard(wardId);
        recomputeShippingAddress({ wardId });
    };

    // Xử lý thay đổi phương thức thanh toán (1: COD, 2: Ví điện tử)
    const handlePaymentMethodChange = (paymentId) => {
        setOrderData(prev => ({
            ...prev,
            paymentId,
            payment_method: paymentId === 2 ? 'WALLET' : 'COD'
        }));
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

        return shippingValidation && profileValidation;
    };

    // Xử lý đặt hàng
    const handlePlaceOrder = async () => {
        if (!isFormValid()) {
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

        setIsSubmitting(true);

        try {
            // Chuẩn bị dữ liệu theo format API - chỉ 6 field cần thiết theo yêu cầu
            // Các field khác sẽ được backend tự động tạo hoặc sử dụng fake data
            const apiOrderData = {
                postProductId: orderData.postProductId,        // ID sản phẩm
                username: orderData.username,
                fullName: orderData.fullName || orderData.buyer_name, // Tên người nhận
                street: orderData.street,
                provinceName: provinces.find(p => p.value === (orderData.provinceId || selectedProvince))?.label || '',
                districtName: districts.find(d => d.value === (orderData.districtId || selectedDistrict))?.label || '',
                wardName: wards.find(w => w.value === (orderData.wardId || selectedWard))?.label || '',
                phoneNumber: orderData.phoneNumber,            // Số điện thoại
                shippingPartnerId: orderData.shippingPartnerId, // ID đối tác vận chuyển
                paymentId: orderData.paymentId                 // ID phương thức thanh toán
            };

            console.log('🚀 Sending order data to API:', apiOrderData);

            // Gọi API đặt hàng
            const response = await placeOrder(apiOrderData);

            console.log('📦 API Response:', response);

            // Backend response có thể là:
            // - response.data.orderId (nếu cấu trúc: { data: { orderId: ... } })
            // - response.orderId (nếu cấu trúc: { orderId: ... })
            // - response.success (nếu cấu trúc: { success: true, data: {...} })

            const orderId = response.data?.orderId || response.orderId || null;

            if (orderId || response.success !== false) {
                console.log('✅ Order placed successfully:', orderId);

                // Refresh số dư ví sau khi đặt hàng thành công
                refreshWalletBalance();

                const newOrderId = orderId || `ORD${Date.now()}`;
                const orderCode = response.data?.orderCode || generateOrderCode();
                const currentTime = new Date().toISOString();

                setOrderId(newOrderId);

                // Cập nhật orderData với thông tin đơn hàng mới
                setOrderData(prev => ({
                    ...prev,
                    order_code: orderCode,
                    order_status: orderData.paymentId === 2 ? 'PAID' : 'PENDING_PAYMENT',
                    created_at: currentTime,
                    paid_at: orderData.paymentId === 2 ? currentTime : '',
                    transaction_id: response.data?.transactionId || `TXN${Date.now()}`,
                    shipping_partner: shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.name || 'Giao hàng nhanh'
                }));

                // Lưu đơn hàng vào localStorage để có thể theo dõi
                const newOrder = {
                    id: newOrderId,
                    order_code: orderCode,
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
                    finalPrice: product.price + (orderData.shippingFee || 0)
                };

                // Lưu vào localStorage
                const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                existingOrders.push(newOrder);
                localStorage.setItem('orders', JSON.stringify(existingOrders));

                setCurrentStep(3);
            } else {
                throw new Error(response.message || response.data?.message || 'Có lỗi xảy ra khi đặt hàng');
            }
        } catch (error) {
            console.error('❌ Place order error:', error);

            // Hiển thị lỗi chi tiết cho người dùng
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Không thể đặt hàng. Vui lòng thử lại sau.';

            console.error('🔍 Error details:', {
                message: errorMessage,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });

            // Hiển thị thông báo lỗi cho người dùng
            setModalConfig({
                type: 'error',
                title: 'Đặt hàng thất bại',
                message: errorMessage,
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
                                    <div className="section-header">
                                        <h3 className="section-title">
                                            <User className="section-icon" />
                                            Thông tin người mua
                                        </h3>
                                        <button
                                            className="btn btn-outline-primary"
                                            onClick={handleFillProfile}
                                            style={{ fontSize: '14px', padding: '8px 16px' }}
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
                                        <div className="shipping-partners-container">
                                            <div
                                                className="shipping-partner-selected"
                                                onClick={() => setShowShippingOptions(!showShippingOptions)}
                                            >
                                                <div className="shipping-partner-info">
                                                    <div className="shipping-partner-name">
                                                        {shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.name || 'Giao hàng nhanh'}
                                                    </div>
                                                    <div className="shipping-partner-desc">
                                                        {shippingPartners.find(p => p.id === orderData.shippingPartnerId)?.description || 'Giao hàng nhanh trong 24h'}
                                                    </div>
                                                </div>
                                                {showShippingOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>

                                            {showShippingOptions && (
                                                <div className="shipping-partners-list">
                                                    {shippingPartners.map((partner) => {
                                                        const isFastDelivery = partner.name?.toLowerCase().includes('nhanh') ||
                                                            partner.name?.toLowerCase().includes('fast') ||
                                                            partner.description?.toLowerCase().includes('nhanh') ||
                                                            partner.description?.toLowerCase().includes('fast');
                                                        const isSelected = orderData.shippingPartnerId === partner.id;
                                                        const isDisabled = !isFastDelivery;

                                                        return (
                                                            <div
                                                                key={partner.id}
                                                                className={`shipping-partner-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                                onClick={() => {
                                                                    if (!isDisabled) {
                                                                        handleShippingPartnerChange(partner.id);
                                                                        setShowShippingOptions(false);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="shipping-partner-info">
                                                                    <div className="shipping-partner-name">
                                                                        {partner.name}
                                                                        {isDisabled && <span className="disabled-badge">(Không khả dụng)</span>}
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
                                            Hiện tại chỉ hỗ trợ giao hàng nhanh để đảm bảo chất lượng dịch vụ tốt nhất
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
                                                <div className="payment-name">
                                                    <Wallet size={20} />
                                                    Ví điện tử
                                                </div>
                                                <div className="payment-desc">Thanh toán trực tuyến qua ví điện tử</div>
                                                {orderData.paymentId === 2 && (
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
                                            {formatCurrency(orderData.shippingFee || 50000)}
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
                                            <span className="font-medium text-foreground">{formatCurrency(orderData.total_price)}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Phí vận chuyển</span>
                                            <div className="text-right">
                                                <span className="font-medium text-foreground">{formatCurrency(orderData.shippingFee)}</span>
                                            </div>
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

