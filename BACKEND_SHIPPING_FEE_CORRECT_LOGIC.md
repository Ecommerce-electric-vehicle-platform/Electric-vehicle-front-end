# 🔴 Backend Phải Sử Dụng shippingFee Từ Request (Không Tự Tính)

## ⚠️ Vấn Đề Hiện Tại

**Backend đang tự tính lại shipping fee từ GHN API:**
```java
// ❌ SAI: Backend tự tính lại
shippingFee = ghnService.getShippingFeeDto(..., 0).get("total");
// → Có thể ra giá khác với Frontend đã tính
```

**Frontend đã gọi API `/api/v1/shipping/shipping-fee`:**
```javascript
// Frontend gọi API shipping fee
const res = await getShippingFee({ 
    postId, 
    provinceName, districtName, wardName, 
    provinceId, districtId, wardId, 
    paymentId 
});
// → Nhận được: { data: { total: "561000" } }
```

## ✅ Logic Đúng

### 1. Frontend Flow:

```
1. User chọn địa chỉ
   ↓
2. Frontend gọi: POST /api/v1/shipping/shipping-fee
   → Backend endpoint này gọi ghnService.getShippingFeeDto()
   → GHN API trả về: { total: "561000" }
   ↓
3. Frontend extract: shippingFee = 561000
   ↓
4. Frontend hiển thị: 561,000 VND cho user
   ↓
5. Frontend gửi place-order request:
   {
     "shippingFee": 561000,  // ← Giá đã được tính từ API
     "postProductId": 22,
     ...
   }
```

### 2. Backend Flow (Cần Sửa):

```
1. Nhận request: { shippingFee: 561000, ... }
   ↓
2. ✅ SỬ DỤNG request.getShippingFee() → 561000
   ↓
3. ✅ Lưu vào database: shipping_fee = 561000
   ↓
4. ❌ KHÔNG tự tính lại từ GHN API
```

## 🔧 Cần Sửa Backend

### 1. PlaceOrderRequest DTO

```java
public class PlaceOrderRequest {
    private Long postProductId;
    private String username;
    // ... các field hiện có
    
    // ✅ THÊM field này (BẮT BUỘC)
    private Double shippingFee;  // Phí ship đã tính từ API /api/v1/shipping/shipping-fee
    
    // Getters và Setters
    public Double getShippingFee() {
        return shippingFee;
    }
    
    public void setShippingFee(Double shippingFee) {
        this.shippingFee = shippingFee;
    }
}
```

### 2. BuyerController.placeOrder() - Sửa Logic

**Code hiện tại (SAI):**
```java
log.info(">>> Calculate shipping fee");
if (payment.getGatewayName().equals("COD")) {
    shippingFee = ghnService.getShippingFeeDto(..., postProduct.getPrice().intValue()).get("total");
} else {
    shippingFee = ghnService.getShippingFeeDto(..., 0).get("total");
}
```

**Code cần sửa (ĐÚNG):**
```java
log.info(">>> Get shipping fee from request");
String shippingFee = null;

// ✅ Ưu tiên sử dụng shippingFee từ request
if (request.getShippingFee() != null && request.getShippingFee() > 0) {
    // Frontend đã gọi API /api/v1/shipping/shipping-fee và tính phí ship
    // Backend phải sử dụng giá này (không tự tính lại)
    shippingFee = String.valueOf(request.getShippingFee().intValue());
    log.info(">>> Using shippingFee from request: {}", shippingFee);
    
} else {
    // ⚠️ Fallback: Chỉ tính lại nếu request không có shippingFee
    // (Trường hợp này không nên xảy ra nếu Frontend làm đúng)
    log.warn(">>> WARNING: Request does not have shippingFee, calculating from GHN API as fallback");
    if (payment.getGatewayName().equals("COD")) {
        shippingFee = ghnService.getShippingFeeDto(
            buyer, postProduct.getSeller(), postProduct, 
            postProduct.getPrice().intValue()
        ).get("total");
    } else {
        shippingFee = ghnService.getShippingFeeDto(
            buyer, postProduct.getSeller(), postProduct, 0
        ).get("total");
    }
    log.info(">>> Calculated shippingFee from GHN API (fallback): {}", shippingFee);
}

log.info(">>> Place new order with shippingFee: {}", shippingFee);
newOrder = buyerService.placeOrder(request, shippingFee);
```

## 📊 So Sánh

| Aspect | Hiện Tại (SAI) | Cần Sửa (ĐÚNG) |
|--------|---------------|----------------|
| **Source** | Backend tự tính từ GHN API | Sử dụng `request.getShippingFee()` |
| **Value** | `616000` (có thể khác) | `561000` (từ Frontend) |
| **Consistency** | ❌ Khác với Frontend | ✅ Khớp với Frontend |
| **Database** | Lưu giá sai (`616000`) | Lưu giá đúng (`561000`) |

## 🎯 Lý Do Phải Sử Dụng shippingFee Từ Request

1. **Consistency:**
   - Frontend đã tính và hiển thị `561000` cho user
   - Backend phải lưu cùng giá này vào database
   - Không được tự tính lại (có thể ra giá khác)

2. **Single Source of Truth:**
   - API `/api/v1/shipping/shipping-fee` là nơi duy nhất tính shipping fee
   - Frontend gọi API này và gửi kết quả cho Backend
   - Backend chỉ cần lưu giá từ request

3. **User Experience:**
   - User thấy `561,000 VND` trên Frontend
   - Database phải lưu `561000` (không phải `616000`)
   - Tránh confusion và sai lệch giá

## ✅ Checklist Sửa Backend

- [ ] **1. PlaceOrderRequest.java:**
  - [ ] Thêm field `private Double shippingFee;`
  - [ ] Thêm getter/setter

- [ ] **2. BuyerController.placeOrder():**
  - [ ] Kiểm tra `request.getShippingFee()`
  - [ ] Sử dụng giá từ request (không tự tính)
  - [ ] Chỉ tính lại khi request không có (fallback)

- [ ] **3. BuyerService.placeOrder():**
  - [ ] Lưu `shippingFee` vào database
  - [ ] Verify giá hợp lý (> 0)

- [ ] **4. Test:**
  - [ ] Test với request có `shippingFee: 561000`
  - [ ] Verify database: `shipping_fee = 561000`
  - [ ] Verify không tự tính lại

## 📝 Code Example (Đầy Đủ)

### PlaceOrderRequest.java:
```java
@Getter
@Setter
public class PlaceOrderRequest {
    private Long postProductId;
    private String username;
    private String fullName;
    // ... các field hiện có
    
    // ✅ THÊM (BẮT BUỘC)
    private Double shippingFee;  // Đã tính từ API /api/v1/shipping/shipping-fee
}
```

### BuyerController.placeOrder():
```java
log.info(">>> Get shipping fee from request");

// ✅ BẮT BUỘC sử dụng shippingFee từ request
if (request.getShippingFee() == null || request.getShippingFee() <= 0) {
    throw new IllegalArgumentException(
        "Shipping fee is required. Frontend must call /api/v1/shipping/shipping-fee first."
    );
}

String shippingFee = String.valueOf(request.getShippingFee().intValue());
log.info(">>> Using shippingFee from request: {}", shippingFee);

log.info(">>> Place new order with shippingFee: {}", shippingFee);
newOrder = buyerService.placeOrder(request, shippingFee);
```

## 🔍 Verify Frontend Đã Gửi Đúng

**Frontend đang gửi:**
```javascript
const apiOrderData = {
    postProductId: 22,
    shippingFee: 561000,  // ✅ Đã tính từ API
    productPrice: 5200000,
    totalPrice: 5761000,
    // ... các field khác
};
```

**Backend nhận:**
```java
PlaceOrderRequest request = ...;  // Parsed from JSON
Double shippingFee = request.getShippingFee();  // → 561000.0
// ✅ Phải sử dụng giá này
```

## 📌 Tóm Tắt

**Vấn đề:**
- ❌ Backend tự tính lại shipping fee → Ra giá khác (`616000` vs `561000`)
- ❌ Không sử dụng `shippingFee` từ request

**Giải pháp:**
1. ✅ Thêm field `shippingFee` vào `PlaceOrderRequest`
2. ✅ Sử dụng `request.getShippingFee()` trong `placeOrder()`
3. ✅ **KHÔNG tự tính lại** từ GHN API

**Frontend đã làm đúng:** ✅ Gọi API `/api/v1/shipping/shipping-fee` và gửi kết quả

