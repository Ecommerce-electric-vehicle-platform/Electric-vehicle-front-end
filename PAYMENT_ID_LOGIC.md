# Logic Của PaymentId Trong PlaceOrder

## 📊 Giá Trị PaymentId

### Định Nghĩa:

```javascript
paymentId === 1  // COD (Cash on Delivery - Thanh toán khi nhận hàng)
paymentId === 2  // WALLET (Ví điện tử)
```

**Default:** `paymentId = 2` (Ví điện tử)

## 🔄 Logic Sử Dụng PaymentId

### 1. Khởi Tạo State

**File: `PlaceOrder.jsx` (Lines 68, 83)**

```javascript
const [orderData, setOrderData] = useState({
    paymentId: 2,                    // Default: Ví điện tử
    payment_method: 'WALLET',        // Default: WALLET
    // ... các field khác
});
```

### 2. Xử Lý Thay Đổi Phương Thức Thanh Toán

**File: `PlaceOrder.jsx` (Lines 714-718)**

```javascript
const handlePaymentMethodChange = (paymentId) => {
    setOrderData(prev => ({
        ...prev,
        paymentId,
        payment_method: paymentId === 2 ? 'WALLET' : 'COD'
    }));
};
```

**Logic:**
- `paymentId === 2` → `payment_method = 'WALLET'`
- `paymentId === 1` → `payment_method = 'COD'`

### 3. Tính Phí Ship (Có Thể Khác Nhau Theo PaymentId)

**File: `PlaceOrder.jsx` (Lines 611, 616)**

```javascript
const paymentId = orderData.paymentId || 2;

// Gọi API getShippingFee với paymentId
const res = await getShippingFee({ 
    postId, 
    provinceName, 
    districtName, 
    wardName, 
    provinceId, 
    districtId, 
    wardId, 
    paymentId  // ← Gửi paymentId để Backend tính phí (COD có thể có phí COD)
});
```

**Logic:**
- Backend nhận `paymentId` và có thể tính phí COD khác nhau:
  - `paymentId === 1` (COD) → Có thể có `cod_fee`
  - `paymentId === 2` (WALLET) → Không có `cod_fee` (hoặc = 0)

**Response từ Backend:**
```json
{
  "data": {
    "total": "561000",
    "service_fee": "550000",
    "cod_fee": "0",              // ← Phí COD (có thể > 0 nếu paymentId = 1)
    "pick_remote_areas_fee": "11000"
  }
}
```

### 4. Kiểm Tra Số Dư Ví (Chỉ Với Ví Điện Tử)

**File: `PlaceOrder.jsx` (Lines 763-767)**

```javascript
// Kiểm tra số dư ví trước khi đặt hàng (chỉ với ví điện tử)
if (orderData.paymentId === 2) {
    const amountToPay = orderData.final_price || 0;
    if (walletBalance < amountToPay) {
        showInsufficientBalanceModal(amountToPay);
        return;
    }
}
```

**Logic:**
- `paymentId === 2` (WALLET) → Kiểm tra số dư ví
- `paymentId === 1` (COD) → Không kiểm tra số dư

### 5. Set Order Status Khi Place Order

**File: `PlaceOrder.jsx` (Lines 981, 983, 993, 994, 996, 1005)**

```javascript
// Khi tạo order trong localStorage
order_status: orderData.paymentId === 2 ? 'PAID' : 'PENDING_PAYMENT',
paid_at: orderData.paymentId === 2 ? currentTime : '',
status: orderData.paymentId === 2 ? 'confirmed' : 'pending',
order_status: orderData.paymentId === 2 ? 'PAID' : 'PENDING_PAYMENT',
paidAt: orderData.paymentId === 2 ? currentTime : '',
paymentMethod: orderData.paymentId === 2 ? 'ewallet' : 'cod',
```

**Logic:**
- `paymentId === 2` (WALLET):
  - `order_status = 'PAID'`
  - `paid_at = currentTime`
  - `status = 'confirmed'`
  - `paymentMethod = 'ewallet'`

- `paymentId === 1` (COD):
  - `order_status = 'PENDING_PAYMENT'`
  - `paid_at = ''`
  - `status = 'pending'`
  - `paymentMethod = 'cod'`

### 6. Hiển Thị UI Theo PaymentId

**File: `PlaceOrder.jsx` (Lines 1426, 1442, 1453)**

```javascript
{/* COD Option */}
<button
    className={`payment-option ${orderData.paymentId === 1 ? 'selected' : ''}`}
    onClick={() => handlePaymentMethodChange(1)}
>
    Thanh toán khi nhận hàng (COD)
</button>

{/* Wallet Option */}
<button
    className={`payment-option ${orderData.paymentId === 2 ? 'selected' : ''}`}
    onClick={() => handlePaymentMethodChange(2)}
>
    <Wallet size={20} />
    Ví điện tử
    
    {/* Hiển thị số dư ví chỉ khi chọn ví điện tử */}
    {orderData.paymentId === 2 && (
        <div className="place-order-wallet-balance">
            <span>{formatWalletCurrency(walletBalance)}</span>
        </div>
    )}
</button>
```

**Logic:**
- Hiển thị số dư ví chỉ khi `paymentId === 2`
- Highlight option được chọn dựa trên `paymentId`

### 7. Gửi PaymentId Trong Request Place Order

**File: `PlaceOrder.jsx` (Lines 916)**

```javascript
const apiOrderData = {
    // ... các field khác
    paymentId: Number(orderData.paymentId || 0),  // 1 hoặc 2
};
```

## 📋 Tóm Tắt Logic

| paymentId | Payment Method | Order Status | Paid At | Check Wallet | COD Fee |
|-----------|----------------|--------------|---------|--------------|---------|
| **1** | COD | PENDING_PAYMENT | '' | ❌ Không | Có thể có |
| **2** | WALLET | PAID | currentTime | ✅ Có | 0 |

## 🔄 Luồng Xử Lý

```
1. User chọn phương thức thanh toán
   ↓
2. handlePaymentMethodChange(paymentId)
   → Set paymentId và payment_method
   ↓
3. Nếu paymentId thay đổi
   → Gọi lại API getShippingFee (phí COD có thể khác)
   ↓
4. Khi place order:
   a. Nếu paymentId === 2:
      → Kiểm tra số dư ví
      → Nếu đủ → Place order
      → Set order_status = 'PAID'
   b. Nếu paymentId === 1:
      → Không kiểm tra số dư
      → Place order
      → Set order_status = 'PENDING_PAYMENT'
   ↓
5. Gửi paymentId trong request
   ↓
6. Backend nhận và xử lý theo paymentId
```

## 🎯 Ảnh Hưởng Của PaymentId

### 1. Phí Ship
- **COD (paymentId = 1):** Có thể có `cod_fee` (phí thu hộ)
- **WALLET (paymentId = 2):** Không có `cod_fee`

### 2. Số Dư Ví
- **COD (paymentId = 1):** Không kiểm tra số dư
- **WALLET (paymentId = 2):** Phải kiểm tra số dư trước khi đặt hàng

### 3. Trạng Thái Đơn Hàng
- **COD (paymentId = 1):** `PENDING_PAYMENT` (chưa thanh toán)
- **WALLET (paymentId = 2):** `PAID` (đã thanh toán)

### 4. UI Hiển Thị
- **COD (paymentId = 1):** Hiển thị "Thanh toán khi nhận hàng"
- **WALLET (paymentId = 2):** Hiển thị số dư ví

## 📝 Code References

**File:** `src/pages/PlaceOrder/PlaceOrder.jsx`

- **Lines 68, 83:** Khởi tạo state với `paymentId: 2`
- **Lines 714-718:** `handlePaymentMethodChange()`
- **Lines 611, 616:** Gửi `paymentId` vào API getShippingFee
- **Lines 763-767:** Kiểm tra số dư ví nếu `paymentId === 2`
- **Lines 981, 983, 993, 994, 996, 1005:** Set order status và payment method
- **Lines 1426, 1442, 1453:** UI hiển thị payment options

