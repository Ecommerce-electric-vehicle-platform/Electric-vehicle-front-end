# 🔴 CRITICAL: Shipping Fee Khác Nhau - Backend PHẢI Sửa

## ⚠️ Vấn Đề Nghiêm Trọng

**Shipping fee từ API `/api/v1/shipping/shipping-fee` KHÁC với phí shipping mà Backend tự tính trong `place-order`**

### Hiện Tượng:

| Source | Giá | Trạng Thái |
|--------|-----|-----------|
| **API `/api/v1/shipping/shipping-fee`** | `561000` | ✅ Đúng |
| **Backend `place-order` tự tính** | `616000` | ❌ SAI (khác `55000`) |
| **Database lưu** | `616000` | ❌ SAI |

### Ảnh Hưởng:

1. ❌ User thấy `561,000 VND` trên Frontend
2. ❌ Database lưu `616,000 VND`
3. ❌ Order history hiển thị sai giá
4. ❌ User bị tính tiền sai

## 🔍 Nguyên Nhân

### Frontend Flow (ĐÚNG):

```
1. User chọn địa chỉ
   ↓
2. Frontend gọi: POST /api/v1/shipping/shipping-fee
   Request: { postId: 22, provinceName: "Bình Dương", ... }
   ↓
3. Backend endpoint này gọi: ghnService.getShippingFeeDto(..., 0)
   ↓
4. GHN API trả về: { total: "561000" }
   ↓
5. Frontend extract: shippingFee = 561000
   ↓
6. Frontend hiển thị: 561,000 VND cho user
   ↓
7. Frontend gọi lại API ngay trước place-order để đảm bảo giá mới nhất
   ↓
8. Frontend gửi place-order request:
   { shippingFee: 561000, ... }
```

### Backend Flow (SAI):

```
1. Nhận request: { shippingFee: 561000, ... }
   ↓
2. ❌ BỎ QUA request.getShippingFee()
   ↓
3. Tự gọi lại: ghnService.getShippingFeeDto(..., 0)
   ↓
4. GHN API trả về: { total: "616000" }  // ← KHÁC!
   ↓
5. Lưu vào database: shipping_fee = 616000 ❌
```

## ❓ Tại Sao Khác Nhau?

### Có Thể Do:

1. **Timing khác:**
   - Frontend gọi lúc `T1` → `561000`
   - Backend gọi lúc `T2` → `616000`
   - GHN API có thể trả về giá khác ở thời điểm khác

2. **Tham số khác:**
   - Address parsing khác (từ request vs từ database)
   - Buyer/seller object khác (từ request vs từ database)
   - PostProduct có thể bị update giữa 2 lần gọi

3. **Logic khác:**
   - Backend có thể thêm validation/calculation
   - Hoặc có cache/rate limit

## ✅ Giải Pháp (Backend PHẢI Sửa)

### Code Hiện Tại (SAI):

```java
@PostMapping("/place-order")
public ResponseEntity<?> placeOrder(@RequestBody PlaceOrderRequest request) {
    // ...
    
    // ❌ SAI: Tự tính lại
    log.info(">>> Calculate shipping fee");
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
    // → Ra giá khác: 616000 (thay vì 561000)
    
    newOrder = buyerService.placeOrder(request, shippingFee);
}
```

### Code Cần Sửa (ĐÚNG):

```java
@PostMapping("/place-order")
public ResponseEntity<?> placeOrder(@RequestBody PlaceOrderRequest request) {
    // ...
    
    // ✅ ĐÚNG: Sử dụng shippingFee từ request
    log.info(">>> Get shipping fee from request");
    
    String shippingFee;
    
    if (request.getShippingFee() != null && request.getShippingFee() > 0) {
        // Frontend đã gọi API /api/v1/shipping/shipping-fee và tính phí ship
        // Backend PHẢI sử dụng giá này (không tự tính lại)
        shippingFee = String.valueOf(request.getShippingFee().intValue());
        log.info(">>> Using shippingFee from request: {}", shippingFee);
        
        // Optional: Verify (chỉ để log, không dùng để override)
        String calculatedFee;
        if (payment.getGatewayName().equals("COD")) {
            calculatedFee = ghnService.getShippingFeeDto(
                buyer, postProduct.getSeller(), postProduct, 
                postProduct.getPrice().intValue()
            ).get("total");
        } else {
            calculatedFee = ghnService.getShippingFeeDto(
                buyer, postProduct.getSeller(), postProduct, 0
            ).get("total");
        }
        
        double diff = Math.abs(request.getShippingFee() - Double.parseDouble(calculatedFee));
        if (diff > 1000) {
            log.warn(">>> WARNING: Shipping fee mismatch! request={}, calculated={}, difference={}", 
                    request.getShippingFee(), calculatedFee, diff);
            log.warn(">>> Using request value (as user has already seen this price)");
        } else {
            log.info(">>> Shipping fee verified: matches calculated fee");
        }
        
    } else {
        // Fallback: Chỉ tính lại nếu request không có shippingFee
        // (Trường hợp này không nên xảy ra nếu Frontend làm đúng)
        log.error(">>> ERROR: Request does not have shippingFee! Calculating as fallback...");
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
        log.warn(">>> Calculated shippingFee from GHN API (fallback): {}", shippingFee);
    }
    
    log.info(">>> Place new order with shippingFee: {}", shippingFee);
    newOrder = buyerService.placeOrder(request, shippingFee);
}
```

## 📋 Checklist Sửa Backend

- [ ] **1. PlaceOrderRequest.java:**
  ```java
  private Double shippingFee;  // ✅ THÊM field này
  ```

- [ ] **2. BuyerController.placeOrder():**
  - [ ] Kiểm tra `request.getShippingFee()`
  - [ ] Sử dụng giá từ request (không tự tính)
  - [ ] Chỉ tính lại khi request không có (fallback với log ERROR)

- [ ] **3. Test:**
  - [ ] Test với request có `shippingFee: 561000`
  - [ ] Verify database: `shipping_fee = 561000` (không phải `616000`)
  - [ ] Verify không tự tính lại

## 📊 So Sánh

| Aspect | Hiện Tại (SAI) | Cần Sửa (ĐÚNG) |
|--------|---------------|----------------|
| **Source** | Backend tự tính từ GHN | Sử dụng `request.getShippingFee()` |
| **Value** | `616000` | `561000` (từ request) |
| **Consistency** | ❌ Khác với Frontend | ✅ Khớp với Frontend |
| **User Experience** | ❌ User thấy giá khác DB | ✅ User thấy đúng giá trong DB |

## 🎯 Lý Do PHẢI Sửa

1. **Consistency:**
   - Frontend đã tính và hiển thị `561,000 VND` cho user
   - Backend PHẢI lưu cùng giá này vào database
   - Không được tự tính lại (ra giá khác)

2. **User Trust:**
   - User thấy giá `561,000 VND` → Phải lưu đúng giá này
   - Không được lưu giá khác `616,000 VND`

3. **Single Source of Truth:**
   - API `/api/v1/shipping/shipping-fee` là nơi duy nhất tính shipping fee
   - Frontend gọi API này và gửi kết quả cho Backend
   - Backend chỉ cần lưu giá từ request

## ⚠️ CRITICAL WARNING

**Backend KHÔNG được tự tính lại shipping fee trong `place-order`!**

- ❌ Nếu tự tính → Sẽ ra giá khác (`616000` vs `561000`)
- ❌ Database sẽ lưu sai giá
- ❌ User sẽ bị tính tiền sai
- ❌ Order history sẽ hiển thị sai

**PHẢI sử dụng `request.getShippingFee()`!**

## 📝 Tóm Tắt

**Vấn đề:**
- API `/shipping-fee` → `561000` ✅
- Backend `place-order` tự tính → `616000` ❌
- Database lưu → `616000` ❌

**Giải pháp:**
1. ✅ Thêm field `shippingFee` vào `PlaceOrderRequest`
2. ✅ Sử dụng `request.getShippingFee()` trong `placeOrder()`
3. ✅ **KHÔNG tự tính lại** từ GHN API

**Frontend đã làm đúng!** ✅
**Backend CẦN sửa ngay!** 🔴

