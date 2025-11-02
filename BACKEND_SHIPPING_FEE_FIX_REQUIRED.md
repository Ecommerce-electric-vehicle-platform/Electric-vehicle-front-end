# ✅ XÁC NHẬN: Lỗi Ở Backend - Phí Ship Khác Nhau

## 🔍 Bằng Chứng

### Request Body Từ Frontend (Đã Xác Nhận):

```
[API] Place Order Request Body: {
  postProductId: 16,
  shippingFee: 561000,        // ✅ Frontend gửi đúng
  productPrice: 5200000,
  totalPrice: 5761000,
  shippingPartnerId: 1,
  paymentId: 2,
  ...
}
```

### Database Lưu:

```
shipping_fee: 616000  // ❌ Khác với giá đã gửi!
```

### Chênh Lệch:

```
616000 - 561000 = 55000
```

## ✅ Kết Luận Cuối Cùng

**Frontend:** ✅ **ĐÚNG**
- Extract đúng: `561000` từ API response
- Gửi đúng: `shippingFee: 561000` trong request

**Backend:** ❌ **LỖI**
- Không sử dụng `shippingFee: 561000` từ request
- Tự tính lại hoặc thêm phí → Lưu `616000` vào database

## 🔧 Giải Pháp Cho Backend

### 1. Kiểm Tra DTO `PlaceOrderRequest`

**Xem file:** `PlaceOrderRequest.java` hoặc tương đương

**Kiểm tra có field này không:**
```java
public class PlaceOrderRequest {
    private Long postProductId;
    // ... các field khác
    
    // ❓ CÓ field này không?
    private Double shippingFee;  // ← CẦN CÓ!
    
    // Getters và Setters
    public Double getShippingFee() {
        return shippingFee;
    }
    
    public void setShippingFee(Double shippingFee) {
        this.shippingFee = shippingFee;
    }
}
```

**Nếu KHÔNG CÓ:** ✅ **Đây là nguyên nhân!**

### 2. Kiểm Tra Service `OrderService.createOrder()`

**Xem file:** Service xử lý place order

**Code hiện tại (có thể đang làm):**
```java
// ❌ SAI - Không sử dụng shippingFee từ request
public Order createOrder(PlaceOrderRequest request) {
    // Backend tự tính lại phí ship
    double shippingFee = shippingService.calculateFee(
        request.getPostProductId(),
        request.getProvinceName(),
        request.getDistrictName(),
        request.getWardName(),
        request.getPaymentId()
    );
    
    // → Tính ra 616000 (khác với 561000 từ frontend)
    
    order.setShippingFee(shippingFee); // 616000
    return orderRepository.save(order);
}
```

**Code cần sửa (ĐÚNG):**
```java
// ✅ ĐÚNG - Sử dụng shippingFee từ request
public Order createOrder(PlaceOrderRequest request) {
    // Ưu tiên sử dụng shippingFee từ request
    Double shippingFee = request.getShippingFee();
    
    // Fallback chỉ khi request không có
    if (shippingFee == null || shippingFee == 0) {
        shippingFee = shippingService.calculateFee(...);
    }
    
    // ✅ Lưu giá từ request (không tự tính lại)
    order.setShippingFee(shippingFee); // 561000
    
    return orderRepository.save(order);
}
```

### 3. Nếu Backend Cần Thêm Phí Xử Lý

**Nếu backend cần thêm phí xử lý (55000):**
```java
// ✅ ĐÚNG - Không thêm vào shippingFee
Double shippingFee = request.getShippingFee(); // 561000 (từ frontend)
Double processingFee = 55000; // Phí xử lý riêng (nếu có)

// Lưu riêng phí ship và phí xử lý
order.setShippingFee(shippingFee);     // 561000
order.setProcessingFee(processingFee);  // 55000 (nếu có field riêng)
order.setTotalPrice(productPrice + shippingFee + processingFee);
```

**KHÔNG nên:**
```java
// ❌ SAI - Thêm phí vào shippingFee
Double shippingFee = request.getShippingFee() + 55000; // 616000 ❌
order.setShippingFee(shippingFee); // Sai!
```

## 📊 So Sánh

| Aspect | Frontend | Backend (Hiện Tại) | Backend (Cần Sửa) |
|--------|----------|-------------------|-------------------|
| **Extract từ API** | ✅ 561000 | - | - |
| **Gửi trong request** | ✅ shippingFee: 561000 | ❓ Có nhận không? | ✅ Cần nhận |
| **Sử dụng giá từ request** | - | ❌ Không | ✅ Cần sử dụng |
| **Tự tính lại** | - | ❌ 616000 | ❌ Không nên |
| **Lưu vào database** | - | ❌ 616000 | ✅ 561000 |

## 🎯 Checklist Cho Backend Team

- [ ] **Kiểm tra DTO:** `PlaceOrderRequest` có field `shippingFee` không?
- [ ] **Kiểm tra Service:** Có sử dụng `request.getShippingFee()` không?
- [ ] **Kiểm tra Logic:** Có tự tính lại phí ship không?
- [ ] **Sửa code:** Sử dụng `shippingFee` từ request
- [ ] **Test:** Place order và kiểm tra database `shipping_fee = 561000`

## 📝 Tóm Tắt

**Bằng chứng:**
- ✅ Frontend gửi: `shippingFee: 561000`
- ❌ Database lưu: `shipping_fee = 616000`

**Kết luận:** ❌ **LỖI Ở BACKEND**

**Nguyên nhân:**
1. Backend không nhận field `shippingFee` từ request (DTO thiếu)
2. Hoặc Backend nhận nhưng không sử dụng, tự tính lại

**Giải pháp:**
1. Thêm field `shippingFee` vào DTO
2. Sử dụng `request.getShippingFee()` trong Service
3. Lưu giá từ request vào database (không tự tính lại)

**Frontend đã làm đúng phần của mình!** ✅

