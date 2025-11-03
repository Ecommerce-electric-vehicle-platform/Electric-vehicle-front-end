# Luồng Xử Lý Giá `price` Từ Frontend Đến Database

## 🔄 Flow Hiện Tại

### 1. Frontend (PlaceOrder.jsx) - TÍNH VÀ GỬI GIÁ

```javascript
// ✅ Frontend TÍNH giá
const productPrice = Number(orderData.total_price || product?.price || 0);
const shippingFeeValue = Number(orderData.shippingFee || 0);
const totalPriceValue = productPrice + shippingFeeValue;

// ✅ Frontend GỬI giá trong request
const apiOrderData = {
    postProductId: 26,
    // ... các field khác
    productPrice: 3800000,      // ← Frontend TÍNH và GỬI
    shippingFee: 561000,        // ← Frontend TÍNH và GỬI
    totalPrice: 4361000          // ← Frontend TÍNH và GỬI
};

// ✅ Gửi đến Backend
POST /api/v1/buyer/place-order
```

**Frontend đang:**
- ✅ Tính toán giá sản phẩm
- ✅ Tính toán phí ship (từ API getShippingFee)
- ✅ Tính tổng giá
- ✅ Gửi tất cả trong request

### 2. Backend (Place Order API) - NHẬN VÀ XỬ LÝ

**Có 2 khả năng:**

#### A. Backend TỰ TÍNH LẠI (Có thể đang làm vậy) ❌

```java
@PostMapping("/api/v1/buyer/place-order")
public ResponseEntity<OrderResponse> placeOrder(@RequestBody PlaceOrderRequest request) {
    // ❌ Backend KHÔNG sử dụng giá từ request
    // ❌ Backend TỰ TÍNH lại
    
    // 1. Lấy giá từ post-product hiện tại
    PostProduct product = postProductRepository.findById(request.getPostProductId());
    double productPrice = product.getPrice(); // ← Giá có thể đã thay đổi!
    
    // 2. Tự tính lại phí ship
    double shippingFee = shippingService.calculateFee(...); // ← Có thể khác frontend!
    
    // 3. Tính tổng
    double totalPrice = productPrice + shippingFee;
    
    // 4. Lưu vào database
    Order order = new Order();
    order.setPrice(productPrice);      // ← Lưu giá tự tính
    order.setShippingFee(shippingFee); // ← Lưu phí tự tính
    order.setTotalPrice(totalPrice);   // ← Lưu tổng tự tính
    orderRepository.save(order);
    
    return ResponseEntity.ok(orderResponse);
}
```

**Kết quả:**
- ❌ Database lưu giá do **Backend tự tính**
- ❌ Giá có thể khác với giá Frontend đã gửi
- ❌ Giá có thể sai nếu sản phẩm thay đổi giá

#### B. Backend SỬ DỤNG GIÁ TỪ REQUEST (Đúng cách) ✅

```java
@PostMapping("/api/v1/buyer/place-order")
public ResponseEntity<OrderResponse> placeOrder(@RequestBody PlaceOrderRequest request) {
    // ✅ Backend SỬ DỤNG giá từ request
    Double productPrice = request.getProductPrice();
    Double shippingFee = request.getShippingFee();
    Double totalPrice = request.getTotalPrice();
    
    // ✅ Fallback chỉ khi request không có
    if (productPrice == null || productPrice == 0) {
        PostProduct product = postProductRepository.findById(request.getPostProductId());
        productPrice = product.getPrice();
    }
    
    // ✅ Lưu giá từ request vào database
    Order order = new Order();
    order.setPrice(productPrice);      // ← Lưu giá từ Frontend
    order.setShippingFee(shippingFee); // ← Lưu phí từ Frontend
    order.setTotalPrice(totalPrice);   // ← Lưu tổng từ Frontend
    orderRepository.save(order);
    
    return ResponseEntity.ok(orderResponse);
}
```

**Kết quả:**
- ✅ Database lưu giá do **Frontend tính và gửi**
- ✅ Giá chính xác với giá user đã thấy
- ✅ Không bị ảnh hưởng bởi việc thay đổi giá sau đó

### 3. Database - LƯU GIÁ

```sql
-- Table: orders
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    order_code VARCHAR(255),
    price DECIMAL(10,2),        -- ← Giá được lưu từ đâu?
    shipping_fee DECIMAL(10,2),  -- ← Phí ship được lưu từ đâu?
    total_price DECIMAL(10,2),   -- ← Tổng giá được lưu từ đâu?
    created_at TIMESTAMP
);
```

**Giá trong database đến từ:**
- Nếu Backend tự tính → **Backend xử lý**
- Nếu Backend sử dụng từ request → **Frontend xử lý** (tính và gửi)

## 📊 So Sánh

| Luồng | Ai Tính Giá? | Ai Gửi Giá? | Ai Lưu Vào DB? | Kết Quả |
|-------|--------------|-------------|----------------|---------|
| **Frontend xử lý** | Frontend ✅ | Frontend ✅ | Backend (từ request) ✅ | Đúng giá user đã thấy |
| **Backend xử lý** | Backend ❌ | - | Backend ❌ | Có thể sai nếu giá thay đổi |

## 🎯 Trả Lời Câu Hỏi

### "Phần price hiển thị lên database là do FE xử lý hay BE xử lý?"

**Câu trả lời: Phụ thuộc vào Backend Implementation**

1. **Nếu Backend sử dụng giá từ request (đúng cách):**
   - Frontend: Tính và gửi giá
   - Backend: Nhận và lưu giá từ request
   - Database: Lưu giá do **Frontend tính** → **Frontend xử lý** ✅

2. **Nếu Backend tự tính lại (có thể đang làm vậy):**
   - Frontend: Tính và gửi giá (nhưng không được dùng)
   - Backend: Tự tính lại giá
   - Database: Lưu giá do **Backend tính** → **Backend xử lý** ❌

## 🔍 Cách Xác Định

### Test 1: Kiểm tra Database

```sql
-- Place order với giá cụ thể từ frontend
-- Sau đó check database

SELECT 
    id,
    order_code,
    price,           -- ← So sánh với giá frontend đã gửi
    shipping_fee,    -- ← So sánh với phí ship frontend đã gửi
    total_price,     -- ← So sánh với tổng frontend đã gửi
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

**Nếu giá khớp với giá frontend đã gửi:**
- ✅ Backend sử dụng giá từ request → **Frontend xử lý**

**Nếu giá khác:**
- ❌ Backend tự tính lại → **Backend xử lý**

### Test 2: Kiểm tra Backend Code

**Xem DTO:**
```java
public class PlaceOrderRequest {
    private Long postProductId;
    // ... các field khác
    
    // ❓ Có các field này không?
    private Double productPrice;
    private Double shippingFee;
    private Double totalPrice;
}
```

**Xem Service:**
```java
public Order createOrder(PlaceOrderRequest request) {
    // ❓ Code làm gì?
    // Option A: order.setPrice(request.getProductPrice()); // ← Frontend xử lý
    // Option B: order.setPrice(product.getPrice());         // ← Backend xử lý
}
```

### Test 3: Thay đổi giá sản phẩm

1. Place order với sản phẩm giá A
2. Thay đổi giá sản phẩm thành B
3. Check order history: giá là A hay B?
   - Nếu là A → Backend lưu giá từ request → **Frontend xử lý** ✅
   - Nếu là B → Backend tự tính lại → **Backend xử lý** ❌

## 📌 Kết Luận

**Theo dữ liệu hiện tại:**

| Aspect | Status |
|--------|--------|
| **Frontend tính giá** | ✅ Có |
| **Frontend gửi giá** | ✅ Có |
| **Backend nhận giá** | ❓ Chưa rõ |
| **Backend sử dụng giá từ request** | ❓ Chưa rõ (có thể không) |
| **Backend tự tính lại** | ❓ Có thể (dựa trên vấn đề đã thấy) |
| **Database lưu giá từ đâu** | ❓ Cần xác nhận từ backend code |

**Dựa trên vấn đề giá không khớp đã thấy:**
- Có vẻ như **Backend đang tự tính lại** → **Backend xử lý** ❌
- Cần kiểm tra backend code để xác nhận

**Khuyến nghị:**
- Backend nên **sử dụng giá từ request** để đảm bảo tính chính xác
- Khi đó giá trong database sẽ là do **Frontend xử lý** (tính và gửi)

