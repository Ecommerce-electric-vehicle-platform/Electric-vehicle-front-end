# 🔴 VẤN ĐỀ: Backend Đang Lưu Sai Giá Vào Database

## 🔴 Vấn Đề

**Khi đặt hàng:**
- Frontend gửi: `productPrice: 3800000`, `shippingFee: 561000`, `totalPrice: 4361000`
- Backend lưu vào database: `price = 4361000` ❌ (TỔNG GIÁ - SAI!)
- Backend nên lưu: `price = 3800000` ✅ (GIÁ SẢN PHẨM - ĐÚNG!)

## 📊 Phân Tích

### Frontend Đang Gửi Đúng:

**Request từ Frontend:**
```json
{
  "postProductId": 26,
  "username": "kimthuydoan",
  // ... các field khác
  "productPrice": 3800000,      // ✅ Giá sản phẩm riêng
  "shippingFee": 561000,        // ✅ Phí ship riêng
  "totalPrice": 4361000          // ✅ Tổng giá (để verify)
}
```

### Backend Đang Lưu Sai:

**Database hiện tại:**
```sql
orders table:
  price: 4361000        -- ❌ SAI! Đang lưu tổng giá
  shipping_fee: 561000   -- ✅ ĐÚNG
  total_price: 4361000   -- ✅ ĐÚNG (nếu có)
```

**Database nên lưu:**
```sql
orders table:
  price: 3800000        -- ✅ ĐÚNG! Giá sản phẩm riêng
  shipping_fee: 561000   -- ✅ ĐÚNG
  total_price: 4361000   -- ✅ ĐÚNG (tổng giá)
```

## 🔍 Nguyên Nhân

### Có thể có 2 nguyên nhân:

#### 1. Backend Không Nhận Field `productPrice`

**DTO không có field:**
```java
// ❌ SAI - Thiếu field productPrice
public class PlaceOrderRequest {
    private Long postProductId;
    // ... các field khác
    // ❌ KHÔNG CÓ: private Double productPrice;
    private Double shippingFee;
    private Double totalPrice;
    
    // Backend tự tính lại từ post-product
    // → Lưu totalPrice vào price (SAI!)
}
```

#### 2. Backend Nhận Nhưng Không Sử Dụng

**Service sử dụng sai field:**
```java
// ❌ SAI - Sử dụng totalPrice thay vì productPrice
public Order createOrder(PlaceOrderRequest request) {
    Order order = new Order();
    
    // ❌ SAI: Lưu totalPrice vào price
    order.setPrice(request.getTotalPrice()); // 4361000
    
    // ✅ ĐÚNG: Nên lưu productPrice vào price
    // order.setPrice(request.getProductPrice()); // 3800000
    
    order.setShippingFee(request.getShippingFee()); // 561000
    order.setTotalPrice(request.getTotalPrice()); // 4361000
    
    return orderRepository.save(order);
}
```

## ✅ Giải Pháp Cho Backend

### 1. Cập Nhật DTO

```java
public class PlaceOrderRequest {
    private Long postProductId;
    private String username;
    // ... các field khác
    
    // ✅ THÊM các field này
    private Double productPrice;    // Giá sản phẩm riêng
    private Double shippingFee;      // Phí ship riêng
    private Double totalPrice;       // Tổng giá (để verify)
    
    // Getters và Setters
    public Double getProductPrice() {
        return productPrice;
    }
    
    public void setProductPrice(Double productPrice) {
        this.productPrice = productPrice;
    }
    
    // ... getters/setters cho shippingFee và totalPrice
}
```

### 2. Cập Nhật Service

```java
public Order createOrder(PlaceOrderRequest request) {
    // ✅ Ưu tiên sử dụng giá từ request
    Double productPrice = request.getProductPrice();
    Double shippingFee = request.getShippingFee();
    Double totalPrice = request.getTotalPrice();
    
    // ✅ Fallback chỉ khi request không có giá
    if (productPrice == null || productPrice == 0) {
        PostProduct product = postProductRepository.findById(request.getPostProductId());
        productPrice = product.getPrice();
    }
    
    if (shippingFee == null || shippingFee == 0) {
        // Tính lại từ shipping service
        shippingFee = shippingService.calculateFee(...);
    }
    
    if (totalPrice == null || totalPrice == 0) {
        totalPrice = productPrice + shippingFee;
    }
    
    // ✅ LƯU ĐÚNG: productPrice vào field price
    Order order = new Order();
    order.setPrice(productPrice);        // ✅ Lưu giá sản phẩm (3800000)
    order.setShippingFee(shippingFee);   // ✅ Lưu phí ship (561000)
    order.setTotalPrice(totalPrice);     // ✅ Lưu tổng giá (4361000)
    
    return orderRepository.save(order);
}
```

## 📝 Tóm Tắt

| Aspect | Frontend | Backend (Hiện Tại) | Backend (Cần Sửa) |
|--------|----------|-------------------|-------------------|
| **Gửi productPrice** | ✅ 3800000 | ❓ Có nhận không? | ✅ Cần nhận |
| **Gửi shippingFee** | ✅ 561000 | ✅ Có nhận | ✅ Đã nhận |
| **Gửi totalPrice** | ✅ 4361000 | ✅ Có nhận | ✅ Đã nhận |
| **Lưu price** | - | ❌ 4361000 (SAI!) | ✅ 3800000 (ĐÚNG!) |
| **Lưu shipping_fee** | - | ✅ 561000 | ✅ 561000 |
| **Lưu total_price** | - | ✅ 4361000 | ✅ 4361000 |

## 🎯 Hành Động Cần Thiết

### Backend Team Cần:

1. ✅ **Kiểm tra DTO** `PlaceOrderRequest`:
   - Có field `productPrice` không?
   - Có field `shippingFee` không?
   - Có field `totalPrice` không?

2. ✅ **Kiểm tra Service** `OrderService.createOrder()`:
   - Có sử dụng `request.getProductPrice()` không?
   - Có lưu `productPrice` vào `order.setPrice()` không?
   - Hay đang lưu `totalPrice` vào `order.setPrice()` (SAI!)?

3. ✅ **Sửa code**:
   - Nhận `productPrice` từ request
   - Lưu `productPrice` vào field `price` (KHÔNG phải `totalPrice`)
   - Verify: `totalPrice == productPrice + shippingFee`

4. ✅ **Test**:
   - Place order với giá cụ thể
   - Kiểm tra database: `price` phải = `productPrice` (KHÔNG phải `totalPrice`)

## 🔍 Cách Kiểm Tra

### Test Case:

**Frontend gửi:**
```json
{
  "productPrice": 3800000,
  "shippingFee": 561000,
  "totalPrice": 4361000
}
```

**Database sau khi lưu:**
```sql
SELECT price, shipping_fee, total_price FROM orders ORDER BY created_at DESC LIMIT 1;
```

**Kết quả mong đợi:**
```
price: 3800000        -- ✅ ĐÚNG (giá sản phẩm)
shipping_fee: 561000  -- ✅ ĐÚNG
total_price: 4361000  -- ✅ ĐÚNG (tổng giá)
```

**Kết quả hiện tại (SAI):**
```
price: 4361000        -- ❌ SAI (đang lưu tổng giá)
shipping_fee: 561000  -- ✅ ĐÚNG
total_price: 4361000  -- ✅ ĐÚNG
```

## ⚠️ Lưu Ý

**Backend KHÔNG nên:**
- ❌ Lưu `totalPrice` vào field `price`
- ❌ Tự tính lại giá từ `post-product` (có thể đã thay đổi)
- ❌ Ignore field `productPrice` từ request

**Backend NÊN:**
- ✅ Nhận `productPrice` từ request
- ✅ Lưu `productPrice` vào field `price`
- ✅ Verify: `totalPrice == productPrice + shippingFee`
- ✅ Log warning nếu có mismatch

## 📌 Kết Luận

**Vấn đề:** Backend đang lưu `totalPrice` vào field `price` thay vì lưu `productPrice`.

**Nguyên nhân:** Backend không nhận hoặc không sử dụng field `productPrice` từ request.

**Giải pháp:** Backend cần:
1. Nhận field `productPrice` trong DTO
2. Sử dụng `productPrice` để lưu vào `order.setPrice()`
3. KHÔNG sử dụng `totalPrice` để lưu vào `order.setPrice()`

**Frontend đã làm đúng:** Gửi đầy đủ `productPrice`, `shippingFee`, `totalPrice` trong request.

