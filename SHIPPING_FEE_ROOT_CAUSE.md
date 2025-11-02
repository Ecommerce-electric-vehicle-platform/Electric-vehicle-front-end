# Phân Tích Nguyên Nhân: Phí Ship Khác Nhau

## 📊 Dữ Liệu Thực Tế

**API Response getShippingFee:**
```json
{
  "success": true,
  "data": {
    "total": "561000",              // ← Tổng phí ship
    "service_fee": "550000",
    "insurance_fee": "0",
    "pick_station_fee": "0",
    "coupon_value": "0",
    "r2s_fee": "0",
    "cod_fee": "0",
    "pick_remote_areas_fee": "11000",
    "deliver_remote_areas_fee": "0",
    "cod_failed_fee": "0"
  }
}
```

**Tính toán:**
- `service_fee`: 550000
- `pick_remote_areas_fee`: 11000
- `total = 561000` ✅ (550000 + 11000)

**Frontend extract:**
- `fee = Number(data.total)` = `561000` ✅

**Database lưu:**
- `shipping_fee = 616000` ❌

**Chênh lệch:** `616000 - 561000 = 55000`

## 🔍 Phân Tích

### Scenario 1: Backend Không Nhận Field `shippingFee`

**Request từ Frontend:**
```json
{
  "shippingFee": 561000,  // ← Frontend gửi
  ...
}
```

**Backend code (giả định):**
```java
// ❌ DTO không có field shippingFee
public class PlaceOrderRequest {
    // ❌ KHÔNG CÓ: private Double shippingFee;
    
    // Backend tự tính lại
    double shippingFee = calculateShippingFee(...); // → 616000
}
```

**Kết quả:** Database lưu `616000` (backend tự tính)

### Scenario 2: Backend Tự Thêm Phí Khi Place Order

**Backend code (giả định):**
```java
public Order createOrder(PlaceOrderRequest request) {
    // Backend có thể thêm phí xử lý đơn hàng
    double baseShippingFee = request.getShippingFee() ?? calculateShippingFee(...);
    double processingFee = 55000;  // ← Phí xử lý
    double finalShippingFee = baseShippingFee + processingFee; // 561000 + 55000 = 616000
    
    order.setShippingFee(finalShippingFee); // 616000
}
```

**Kết quả:** Database lưu `616000` (base + processing fee)

### Scenario 3: Backend Tính Lại Từ API Shipping (Khác Lần Gọi Trước)

**Có thể backend khi place order:**
- Gọi lại API shipping với tham số khác
- Hoặc tính lại với logic khác
- → Trả về giá khác (616000)

## ✅ Giải Pháp Đã Áp Dụng (Frontend)

### 1. Gọi Lại API getShippingFee Ngay Trước Khi Place Order

**File: `PlaceOrder.jsx` (Lines 732-803)**

```javascript
// Gọi lại API để lấy phí ship mới nhất
const shippingFeeResponse = await getShippingFee({...});
const latestFee = Number(data?.total ?? ...); // 561000

// So sánh với giá cũ
if (latestFee !== finalShippingFee) {
    console.warn('⚠️ Shipping fee changed!', {
        old: finalShippingFee,
        new: latestFee
    });
}

finalShippingFee = latestFee; // Sử dụng giá mới nhất
```

**Chức năng:**
- ✅ Đảm bảo dùng phí ship mới nhất
- ✅ Phát hiện nếu phí ship thay đổi

### 2. Gửi `shippingFee` Trong Request

```javascript
const apiOrderData = {
    // ...
    shippingFee: shippingFeeValue,  // 561000
    productPrice: productPrice,
    totalPrice: totalPriceValue
};
```

### 3. Logging Chi Tiết

**Console sẽ hiển thị:**
```
🚚 Shipping fee API response structure: {
  data_total: "561000",
  ...
}

💰 Extracted shipping fee: {
  fee: 561000,
  source: 'data.total',
  breakdown: {
    service_fee: 550000,
    cod_fee: 0,
    pick_remote_areas_fee: 11000,
    calculatedTotal: 561000,
    matchesTotal: '✅'
  }
}

[API] Place Order Request Body: {
  shippingFee: 561000,  // ← Giá gửi đi
  ...
}
```

## 🎯 Xác Định Lỗi Ở Đâu

### Kiểm Tra Console Logs:

**Nếu request body có `shippingFee: 561000`:**
- ✅ Frontend gửi đúng
- ❌ Backend không sử dụng → **LỖI Ở BACKEND**

**Nếu request body có `shippingFee: 616000`:**
- ❌ Frontend gửi sai → **LỖI Ở FRONTEND**
- Cần kiểm tra tại sao frontend extract sai

**Nếu request body không có field `shippingFee`:**
- ❌ Frontend không gửi → **LỖI Ở FRONTEND**

### Kiểm Tra Database:

**Nếu database `shipping_fee = 616000`:**
- Backend tự tính lại hoặc thêm phí
- **LỖI Ở BACKEND** (không sử dụng giá từ request)

## 📝 Kết Luận

**Dựa trên response structure bạn cung cấp:**
- API trả về: `total: "561000"` ✅
- Frontend extract: `561000` ✅
- Database lưu: `616000` ❌

**Kết luận:** 
- ✅ Frontend đang extract và gửi đúng `561000`
- ❌ Backend không sử dụng giá từ request hoặc tự thêm phí → **LỖI Ở BACKEND**

**Nguyên nhân có thể:**
1. Backend không nhận field `shippingFee` từ request (DTO thiếu)
2. Backend nhận nhưng không sử dụng, tự tính lại
3. Backend tự thêm phí xử lý (55000) khi place order

**Giải pháp cho Backend:**
1. Nhận field `shippingFee` trong DTO
2. Sử dụng `shippingFee` từ request (không tự tính lại)
3. Nếu cần thêm phí, nên cộng vào `totalPrice` thay vì `shippingFee`

