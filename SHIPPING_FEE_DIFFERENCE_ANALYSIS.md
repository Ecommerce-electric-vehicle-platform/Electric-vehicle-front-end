# Phân Tích Sự Khác Biệt Shipping Fee

## 🔴 Vấn Đề

**Shipping fee từ API `/api/v1/shipping/shipping-fee` khác với phí shipping trong `place-order`**

### Hiện Tượng:

1. **Frontend gọi `/api/v1/shipping/shipping-fee`:**
   - Request: `{ postId, provinceName, districtName, wardName, paymentId }`
   - Response: `{ data: { total: "561000" } }`
   - ✅ Frontend extract: `561000`

2. **Backend trong `place-order`:**
   - Tự tính lại: `ghnService.getShippingFeeDto(..., codValue)`
   - Response: `{ total: "616000" }`
   - ❌ Khác: `616000` vs `561000`

## 🔍 Nguyên Nhân

### So Sánh 2 Lần Gọi GHN API:

#### 1. API `/api/v1/shipping/shipping-fee`:

```java
// Backend endpoint này
@PostMapping("/shipping/shipping-fee")
public ResponseEntity<?> getShippingFee(@RequestBody ShippingFeeRequest request) {
    // Parse paymentId từ request
    int codValue = (request.getPaymentId() == 1) ? productPrice : 0;
    
    // Gọi GHN API
    Map<String, String> result = ghnService.getShippingFeeDto(
        buyer, seller, postProduct, codValue
    );
    
    return result.get("total");  // → "561000"
}
```

**Tham số:**
- `codValue = 0` (nếu paymentId = 2)
- `buyer` từ request/profileName
- `postProduct` từ `postId`

#### 2. Backend `place-order`:

```java
@PostMapping("/place-order")
public ResponseEntity<?> placeOrder(@RequestBody PlaceOrderRequest request) {
    // Tự tính lại shipping fee
    if (payment.getGatewayName().equals("COD")) {
        shippingFee = ghnService.getShippingFeeDto(
            buyer,                    // ← Lấy từ database
            postProduct.getSeller(),  // ← Lấy từ database
            postProduct,              // ← Lấy từ database
            postProduct.getPrice().intValue()  // ← codValue = productPrice
        ).get("total");
    } else {
        shippingFee = ghnService.getShippingFeeDto(
            buyer,
            postProduct.getSeller(),
            postProduct,
            0  // ← codValue = 0
        ).get("total");
    }
    
    // → Có thể ra "616000" (khác!)
}
```

**Tham số có thể khác:**
- `buyer` từ database (có thể khác với request)
- `seller` từ `postProduct.getSeller()` (từ database)
- `postProduct` từ database
- Timing khác → GHN API có thể trả về giá khác
- Các tham số khác (weight, dimensions, address parsing)

## 📊 So Sánh Chi Tiết

| Aspect | `/api/v1/shipping/shipping-fee` | `place-order` |
|--------|-------------------------------|---------------|
| **codValue** | Từ `paymentId` (2 → 0) | Từ `payment.getGatewayName()` ("WALLET" → 0) |
| **buyer** | Từ request/profile | Từ database (`buyerService.findBuyerByUsername()`) |
| **seller** | Từ `postProduct.getSeller()` | Từ `postProduct.getSeller()` (database) |
| **postProduct** | Từ `postId` (request) | Từ `request.getPostProductId()` (database) |
| **Timing** | Trước khi place order | Trong lúc place order |
| **Result** | `561000` | `616000` (khác!) |

## ⚠️ Nguyên Nhân Có Thể

### 1. Tham Số Khác Nhau:

**Address parsing:**
- API `/shipping-fee`: Parse từ request (`provinceName`, `districtName`, `wardName`)
- `place-order`: Parse từ `buyer` object trong database
- → Có thể parse khác → Ra districtId/wardId khác → Phí khác

**Weight/Dimensions:**
- Cả 2 đều lấy từ `postProduct`
- Nhưng nếu `postProduct` bị update giữa 2 lần gọi → Khác

**COD Value:**
- Cả 2 đều dùng `codValue = 0` (với paymentId = 2)
- Nhưng nếu paymentId khác → Khác

### 2. Timing:

- GHN API có thể trả về giá khác ở thời điểm khác
- Hoặc có cache/rate limit

### 3. Backend Logic:

- Backend trong `place-order` có thể thêm logic khác
- Hoặc có validation/calculation khác

## ✅ Giải Pháp

### Frontend Đã Làm Đúng:

1. ✅ Gọi `/api/v1/shipping/shipping-fee` trước
2. ✅ Extract `total: "561000"`
3. ✅ Hiển thị cho user: `561,000 VND`
4. ✅ Gửi trong request: `{ shippingFee: 561000 }`

### Backend Cần Sửa:

**KHÔNG tự tính lại trong `place-order`:**

```java
// ❌ SAI: Tự tính lại
String shippingFee = ghnService.getShippingFeeDto(...).get("total");

// ✅ ĐÚNG: Sử dụng từ request
String shippingFee = String.valueOf(request.getShippingFee().intValue());
```

## 🎯 Tóm Tắt

**Vấn đề:**
- API `/shipping-fee` → `561000`
- Backend `place-order` tự tính → `616000`
- → Khác nhau: `55000` (616000 - 561000)

**Nguyên nhân:**
- Backend tự tính lại với tham số/timing có thể khác
- Không sử dụng `shippingFee` từ request

**Giải pháp:**
- Backend PHẢI sử dụng `request.getShippingFee()`
- KHÔNG tự tính lại trong `place-order`

**Frontend đã làm đúng!** ✅

