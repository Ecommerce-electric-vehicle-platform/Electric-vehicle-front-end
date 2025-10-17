# Migration Guide - Từ Test Mock Data sang API thực tế

## 🎯 Mục đích

Hướng dẫn chi tiết cách chuyển đổi từ hệ thống test mock data sang API thực tế.

## 📁 Cấu trúc hiện tại

```
src/
├── test-mock-data/           # 🗑️ XÓA KHI CÓ API
│   ├── components/
│   │   └── TestEnvironmentSetup/
│   ├── data/
│   │   └── productsData.js
│   ├── utils/
│   │   └── orderValidation.js
│   └── README.md
├── pages/
│   ├── PlaceOrder/
│   ├── SellerDashboard/
│   ├── Products/
│   └── ProductDetail/
└── components/
    ├── FeaturedSlider/
    ├── VehicleShowcase/
    └── ProductCarousel/
```

## 🚀 Bước 1: Tạo API Layer

### Tạo thư mục API:
```bash
mkdir -p src/api
```

### Tạo các file API:

#### `src/api/productApi.js`
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const productApi = {
    // Lấy tất cả sản phẩm
    getAllProducts: async () => {
        const response = await fetch(`${API_BASE_URL}/products`);
        return response.json();
    },
    
    // Lấy sản phẩm theo ID
    getProductById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        return response.json();
    },
    
    // Lấy sản phẩm theo danh mục
    getProductsByCategory: async (category) => {
        const response = await fetch(`${API_BASE_URL}/products?category=${category}`);
        return response.json();
    },
    
    // Tìm kiếm sản phẩm
    searchProducts: async (query) => {
        const response = await fetch(`${API_BASE_URL}/products/search?q=${query}`);
        return response.json();
    }
};
```

#### `src/api/orderApi.js`
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const orderApi = {
    // Tạo đơn hàng mới
    createOrder: async (orderData) => {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(orderData)
        });
        return response.json();
    },
    
    // Lấy danh sách đơn hàng
    getOrders: async () => {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    },
    
    // Lấy đơn hàng theo ID
    getOrderById: async (orderId) => {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    },
    
    // Cập nhật trạng thái đơn hàng
    updateOrderStatus: async (orderId, status) => {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });
        return response.json();
    }
};
```

#### `src/api/sellerApi.js`
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const sellerApi = {
    // Lấy thông tin seller
    getSellerInfo: async () => {
        const response = await fetch(`${API_BASE_URL}/seller/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    },
    
    // Lấy đơn hàng của seller
    getSellerOrders: async () => {
        const response = await fetch(`${API_BASE_URL}/seller/orders`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    },
    
    // Lấy thông báo của seller
    getSellerNotifications: async () => {
        const response = await fetch(`${API_BASE_URL}/seller/notifications`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    },
    
    // Đánh dấu thông báo đã đọc
    markNotificationAsRead: async (notificationId) => {
        const response = await fetch(`${API_BASE_URL}/seller/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    }
};
```

## 🔄 Bước 2: Cập nhật các file chính

### 1. Cập nhật `src/pages/Products/Products.jsx`

**Thay thế:**
```javascript
import { vehicleProducts, batteryProducts, formatCurrency } from "../../test-mock-data/data/productsData";
```

**Bằng:**
```javascript
import { productApi } from '../../api/productApi';
import { formatCurrency } from '../../utils/formatUtils';
```

**Cập nhật logic:**
```javascript
// Thay vì sử dụng mock data
const [products, setProducts] = useState([]);

useEffect(() => {
    const loadProducts = async () => {
        try {
            const data = await productApi.getAllProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };
    loadProducts();
}, []);
```

### 2. Cập nhật `src/pages/PlaceOrder/PlaceOrder.jsx`

**Xóa:**
```javascript
import { vehicleProducts, batteryProducts, formatCurrency } from '../../test-mock-data/data/productsData';
import TestEnvironmentSetup from '../../test-mock-data/components/TestEnvironmentSetup/TestEnvironmentSetup';
```

**Thêm:**
```javascript
import { productApi } from '../../api/productApi';
import { orderApi } from '../../api/orderApi';
import { formatCurrency } from '../../utils/formatUtils';
```

**Cập nhật logic:**
```javascript
// Thay vì sử dụng mock data
useEffect(() => {
    const loadProduct = async () => {
        try {
            const product = await productApi.getProductById(id);
            setProduct(product);
        } catch (error) {
            console.error('Error loading product:', error);
        }
    };
    loadProduct();
}, [id]);

// Thay vì tạo thông báo mock
const handlePlaceOrder = async () => {
    try {
        const order = await orderApi.createOrder(orderData);
        setOrderId(order.id);
        setCurrentStep(3);
    } catch (error) {
        console.error('Error creating order:', error);
    }
};
```

### 3. Cập nhật `src/pages/SellerDashboard/SellerDashboard.jsx`

**Xóa:**
```javascript
// Không cần import mock data nữa
```

**Thêm:**
```javascript
import { sellerApi } from '../../api/sellerApi';
import { orderApi } from '../../api/orderApi';
```

**Cập nhật logic:**
```javascript
useEffect(() => {
    const loadSellerData = async () => {
        try {
            const [sellerInfo, orders, notifications] = await Promise.all([
                sellerApi.getSellerInfo(),
                sellerApi.getSellerOrders(),
                sellerApi.getSellerNotifications()
            ]);
            
            setSellerInfo(sellerInfo);
            setOrders(orders);
            setNotifications(notifications);
        } catch (error) {
            console.error('Error loading seller data:', error);
        }
    };
    loadSellerData();
}, []);
```

## 🗑️ Bước 3: Xóa các file test

### Xóa toàn bộ thư mục test:
```bash
rm -rf src/test-mock-data/
```

### Xóa file test-setup.js:
```bash
rm test-setup.js
```

### Xóa các import không cần thiết:
- Xóa tất cả import từ `test-mock-data`
- Xóa import `TestEnvironmentSetup`
- Xóa các console.log debug

## 🛠️ Bước 4: Tạo utility functions

### `src/utils/formatUtils.js`
```javascript
export const formatCurrency = (value) => {
    if (value === undefined || value === null) {
        return "0 ₫";
    }
    return value.toLocaleString("vi-VN") + " ₫";
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
};
```

## 🔧 Bước 5: Cập nhật environment variables

### `.env`
```bash
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENVIRONMENT=production
```

## ✅ Checklist Migration

### Trước khi deploy:
- [ ] Tạo tất cả API files
- [ ] Cập nhật tất cả components
- [ ] Xóa thư mục `test-mock-data/`  
- [ ] Xóa file `test-setup.js`
- [ ] Cập nhật environment variables
- [ ] Test tất cả chức năng
- [ ] Xóa tất cả console.log debug

### Sau khi deploy:
- [ ] Kiểm tra API endpoints
- [ ] Test authentication
- [ ] Test tất cả CRUD operations
- [ ] Kiểm tra error handling
- [ ] Test responsive design

## 🚨 Lưu ý quan trọng

1. **Backup code** trước khi migration
2. **Test kỹ** tất cả chức năng sau khi chuyển đổi
3. **Xóa hoàn toàn** thư mục `test-mock-data/` khi production
4. **Cập nhật documentation** sau khi migration
5. **Thông báo team** về việc thay đổi cấu trúc code

