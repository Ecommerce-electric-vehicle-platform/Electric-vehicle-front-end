# Các Phần Trong Frontend Xử Lý Giá Tiền

## 📍 Tổng Quan

Frontend xử lý giá tiền ở **2 phần chính**:

1. **PlaceOrder.jsx** - Tính toán và gửi giá khi đặt hàng
2. **orderApi.js** - Xử lý và normalize giá từ backend response (order history)

---

## 1. PlaceOrder.jsx - Tính Toán Và Gửi Giá

### 📂 File: `src/pages/PlaceOrder/PlaceOrder.jsx`

### A. State Quản Lý Giá

**Lines 70-73:**
```javascript
const [orderData, setOrderData] = useState({
    // ... các field khác
    shippingFee: 0,
    total_price: 0,      // ← Giá sản phẩm
    final_price: 0       // ← Tổng giá (productPrice + shippingFee)
});
```

### B. Load Giá Sản Phẩm

**Lines 348-350, 368-370:**
```javascript
// Khi load sản phẩm từ mock data hoặc API
setOrderData(prev => ({
    ...prev,
    total_price: foundProduct.price,           // ← Lấy giá sản phẩm
    shippingFee: defaultShippingFee,            // ← Phí ship mặc định
    final_price: foundProduct.price + defaultShippingFee  // ← Tính tổng
}));
```

### C. Tính Phí Ship (refreshShippingFee)

**Lines 600-645:**
```javascript
const refreshShippingFee = useCallback(async () => {
    // Gọi API để lấy phí ship từ backend
    const response = await getShippingFee({...});
    
    const fee = Number(
        data?.shippingFee ?? 
        data?.fee ?? 
        // ... fallback values
        0
    );

    setOrderData(prev => ({
        ...prev,
        shippingFee: fee,                              // ← Cập nhật phí ship
        final_price: (prev.total_price || 0) + fee,   // ← Tính lại tổng giá
    }));
}, [...]);
```

**Chức năng:**
- ✅ Gọi API `/api/v1/buyer/shipping-fee` để lấy phí ship
- ✅ Cập nhật `orderData.shippingFee`
- ✅ Tự động tính lại `final_price = total_price + shippingFee`

### D. Tính Giá Trước Khi Place Order

**Lines 731-735:**
```javascript
// Tính toán giá trước khi gửi để đảm bảo tính nhất quán
const productPrice = Number(orderData.total_price || product?.price || 0);
const shippingFeeValue = Number(orderData.shippingFee || 0);
const totalPriceValue = productPrice + shippingFeeValue;
```

**Chức năng:**
- ✅ Tính lại giá sản phẩm từ `orderData.total_price` hoặc `product.price`
- ✅ Lấy phí ship từ `orderData.shippingFee`
- ✅ Tính tổng giá: `totalPriceValue = productPrice + shippingFeeValue`

### E. Gửi Giá Trong Request

**Lines 739-755:**
```javascript
const apiOrderData = {
    postProductId: ...,
    username: ...,
    // ... các field khác
    
    // ✅ Gửi kèm giá để backend lưu chính xác
    productPrice: productPrice,        // ← Giá sản phẩm tại thời điểm đặt hàng
    shippingFee: shippingFeeValue,      // ← Phí ship đã tính và hiển thị cho user
    totalPrice: totalPriceValue         // ← Tổng giá (để backend verify)
};

// Gửi đến backend
POST /api/v1/buyer/place-order
```

**Chức năng:**
- ✅ Gửi `productPrice`, `shippingFee`, `totalPrice` trong request
- ✅ Logging chi tiết để debug

### F. Hiển Thị Giá Trên UI

**Lines 1433, 1473, 1583, 1589, 1597:**
```javascript
// Hiển thị phí ship
{formatCurrency(orderData.shippingFee || 50000)}

// Hiển thị tổng giá
{formatCurrency(orderData.final_price)}

// Hiển thị giá sản phẩm
{formatCurrency(orderData.total_price)}

// Hiển thị tổng cộng
{formatCurrency(orderData.final_price)}
```

---

## 2. orderApi.js - Xử Lý Giá Từ Backend

### 📂 File: `src/api/orderApi.js`

### A. Normalize Giá Từ Order History Response

**Lines 189-346:**
```javascript
function normalizeOrderHistoryItem(item) {
    // Lấy phí ship từ backend
    const shippingFee = Number(
        item.shippingFee ?? 
        item.shipping_fee ?? 
        // ... fallback values
        0
    );
    
    // Lấy giá từ backend (có thể là productPrice hoặc totalPrice)
    const rawPrice = Number(
        item.price ?? 
        item.productPrice ?? 
        // ... fallback values
        0
    );
    
    // Xác định rawPrice là productPrice hay totalPrice
    // Logic phức tạp để xử lý trường hợp backend trả về price là totalPrice
    
    let productPrice = 0;
    let finalPrice = 0;
    
    // Xử lý logic dựa trên backendTotalPrice và rawPrice
    if (backendTotalPrice > 0) {
        // Có totalPrice từ backend
        finalPrice = backendTotalPrice;
        productPrice = ...; // Tính từ totalPrice
    } else {
        // Không có totalPrice, giả định rawPrice là totalPrice
        if (rawPrice >= shippingFee) {
            productPrice = rawPrice - shippingFee;
            finalPrice = rawPrice; // KHÔNG cộng thêm shippingFee
        }
    }
    
    return {
        price: productPrice,
        productPrice: productPrice,
        shippingFee: shippingFee,
        finalPrice: finalPrice
    };
}
```

**Chức năng:**
- ✅ Xử lý và normalize giá từ backend response
- ✅ Xác định `price` từ backend là `productPrice` hay `totalPrice`
- ✅ Tính toán `productPrice` và `finalPrice` chính xác
- ✅ Xử lý edge cases (price = 0, mismatch, etc.)

### B. Logging Để Debug

**Lines 288-316:**
```javascript
console.log('[orderApi] normalizeOrderHistoryItem - Price normalization:', {
    raw: {
        price: item.price,
        productPrice: item.productPrice,
        shippingFee: item.shippingFee,
        finalPrice: item.finalPrice,
        totalPrice: item.totalPrice
    },
    normalized: {
        productPrice: productPrice,
        shippingFee: shippingFee,
        finalPrice: finalPrice
    },
    calculation: {...},
    verification: {...}
});
```

---

## 3. OrderList.jsx - Hiển Thị Giá

### 📂 File: `src/pages/OrderList/OrderList.jsx`

**Lines 439, 704, 708:**
```javascript
// Hiển thị tổng giá
{formatCurrency(order.finalPrice)}

// Hiển thị giá sản phẩm (tạm tính)
{formatCurrency(order.price || order.finalPrice - order.shippingFee)}
```

**Chức năng:**
- ✅ Hiển thị giá từ normalized order object
- ✅ Sử dụng `formatCurrency` để format số tiền

---

## 📊 Tóm Tắt Các Phần Xử Lý Giá

| Phần | File | Chức Năng | Lines |
|------|------|-----------|-------|
| **1. State giá** | PlaceOrder.jsx | Quản lý state `total_price`, `shippingFee`, `final_price` | 70-73 |
| **2. Load giá sản phẩm** | PlaceOrder.jsx | Load giá từ product object | 348-350, 368-370 |
| **3. Tính phí ship** | PlaceOrder.jsx | Gọi API getShippingFee và cập nhật | 600-645 |
| **4. Tính tổng giá** | PlaceOrder.jsx | Tính `final_price = total_price + shippingFee` | 635, 642 |
| **5. Tính giá trước khi gửi** | PlaceOrder.jsx | Tính lại giá để gửi request | 731-735 |
| **6. Gửi giá trong request** | PlaceOrder.jsx | Gửi `productPrice`, `shippingFee`, `totalPrice` | 752-754 |
| **7. Normalize giá từ backend** | orderApi.js | Xử lý giá từ order history API | 189-346 |
| **8. Hiển thị giá** | PlaceOrder.jsx, OrderList.jsx | Format và hiển thị giá trên UI | 1433, 1473, 1583, 1589, 1597, 439, 704 |

---

## 🔄 Luồng Xử Lý Giá

```
1. Load Product
   └─> Set total_price = product.price
   
2. Calculate Shipping Fee
   └─> Call API getShippingFee()
   └─> Set shippingFee = response.fee
   └─> Calculate final_price = total_price + shippingFee
   
3. User Changes Address/Payment
   └─> Recalculate shippingFee
   └─> Recalculate final_price
   
4. Place Order
   └─> Calculate: productPrice, shippingFeeValue, totalPriceValue
   └─> Send to backend: { productPrice, shippingFee, totalPrice }
   
5. Order History
   └─> Receive from backend: { price, shippingFee, ... }
   └─> Normalize: Determine if price is productPrice or totalPrice
   └─> Calculate: productPrice, finalPrice
   └─> Display: Show normalized values
```

---

## 🎯 Kết Luận

**Frontend xử lý giá tiền ở:**

1. ✅ **PlaceOrder.jsx** (Lines 70-835):
   - Tính toán giá sản phẩm
   - Tính phí ship (từ API)
   - Tính tổng giá
   - Gửi giá trong request
   - Hiển thị giá trên UI

2. ✅ **orderApi.js** (Lines 189-346):
   - Normalize giá từ backend response
   - Xử lý logic phức tạp để xác định giá đúng
   - Logging để debug

3. ✅ **OrderList.jsx** (Lines 439, 704, 708):
   - Hiển thị giá từ normalized order object

**Tất cả logic tính toán và xử lý giá đều nằm trong Frontend!**

