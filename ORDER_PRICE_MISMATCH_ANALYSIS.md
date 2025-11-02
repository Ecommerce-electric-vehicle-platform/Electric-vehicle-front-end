# Phân Tích: Tổng Phí Đơn Hàng Khác Nhau Giữa Place Order và Order History

## 🔴 Vấn Đề

**Place Order hiển thị**: Giá sản phẩm + Phí ship = Tổng (đúng)
**Order History hiển thị**: Giá sản phẩm (khác) + Phí ship (khác) = Tổng (sai)

## 🔍 Phân Tích Chi Tiết

### 1. Place Order - Cách Tính Giá

```javascript
// Trong PlaceOrder.jsx
const productPrice = orderData.total_price || product?.price || 0;  // Giá sản phẩm
const shippingFee = orderData.shippingFee || 0;                      // Phí ship
const finalPrice = productPrice + shippingFee;                        // Tổng

// Hiển thị:
orderData.total_price      // Giá sản phẩm
orderData.shippingFee      // Phí ship  
orderData.final_price      // Tổng = total_price + shippingFee
```

**Vấn đề**: Frontend không gửi giá trong request (hoặc backend không nhận):
```javascript
const apiOrderData = {
    postProductId: ...,
    // ❌ KHÔNG gửi productPrice
    // ❌ KHÔNG gửi shippingFee
    // ❌ KHÔNG gửi totalPrice
};
```

### 2. Backend - Tự Tính Lại Giá

Khi không nhận được giá từ request, backend sẽ:
1. **Lấy giá sản phẩm** từ `post-product` hiện tại (có thể đã thay đổi)
2. **Tính lại phí ship** từ API shipping (có thể khác với giá frontend đã tính)
3. **Lưu vào database**: Giá mới ≠ Giá frontend đã hiển thị

### 3. Order History - Lấy Giá Từ Backend

```javascript
// normalizeOrderHistoryItem trong orderApi.js
const price = Number(item.price ?? 0);              // Lấy từ backend
const shippingFee = Number(item.shippingFee ?? 0);  // Lấy từ backend
const finalPrice = price + shippingFee;             // Tính lại
```

**Kết quả**: Order history hiển thị giá từ database (sai) ≠ Giá frontend đã hiển thị (đúng)

## ✅ Giải Pháp Đã Áp Dụng

### 1. Gửi Giá Trong Request

```javascript
const apiOrderData = {
    // ... các field khác
    productPrice: productPrice,    // ✅ Giá sản phẩm tại thời điểm đặt hàng
    shippingFee: shippingFeeValue,  // ✅ Phí ship đã tính và hiển thị cho user
    totalPrice: totalPriceValue     // ✅ Tổng giá (để backend verify)
};
```

### 2. Cải Thiện normalizeOrderHistoryItem

```javascript
// Lấy giá từ nhiều field khác nhau (backend có thể trả về ở field khác)
const price = Number(
    item.price ?? 
    item.productPrice ?? 
    item.product_price ?? 
    item.itemPrice ??
    0
);

const shippingFee = Number(
    item.shippingFee ?? 
    item.shipping_fee ?? 
    item.deliveryFee ??
    0
);

const finalPrice = Number(
    item.finalPrice ?? 
    item.final_price ?? 
    item.totalPrice ??
    (price + shippingFee)  // Fallback: tính từ price + shippingFee
);
```

### 3. Thêm Logging Chi Tiết

- Log giá khi place order: `💰 Price breakdown`
- Log giá từ backend trong `getOrderHistory`
- Log giá trong `OrderList` để so sánh
- Log warning nếu giá = 0 hoặc có vấn đề

## 📊 So Sánh Giá

### Place Order:
```
orderData.total_price = product.price          (từ product object)
orderData.shippingFee = shippingFee từ API     (từ getShippingFee API)
orderData.final_price = total_price + shippingFee
```

### Order History:
```
order.price = item.price từ backend           (backend tự tính/lấy)
order.shippingFee = item.shippingFee từ backend (backend tự tính)
order.finalPrice = price + shippingFee         (hoặc từ backend nếu có)
```

### Nguyên Nhân Khác Nhau:
1. **Backend không nhận giá từ request** → Tự tính lại
2. **Backend lấy giá từ post-product hiện tại** → Có thể đã thay đổi
3. **Backend tính lại phí ship** → Có thể khác với giá frontend

## 🔧 Debug

Kiểm tra console logs:

1. **Khi place order**:
   ```
   🚀 Sending order data to API: {...}
   💰 Price breakdown: {
       productPrice: 5000000,
       shippingFee: 50000,
       totalPrice: 5050000
   }
   ```

2. **Khi load order history**:
   ```
   [orderApi] getOrderHistory - Raw response sample: {
       price: 4500000,        // ← Khác với giá đã gửi!
       shippingFee: 60000,    // ← Khác với phí ship đã gửi!
       finalPrice: 4560000    // ← Tổng khác!
   }
   ```

3. **Trong OrderList**:
   ```
   [OrderList] Orders from backend: [{
       price: 4500000,
       shippingFee: 60000,
       finalPrice: 4560000
   }]
   ```

## 🎯 Giải Pháp Cho Backend

### Backend Cần:

1. **Nhận giá từ request**:
   ```java
   public class PlaceOrderRequest {
       // ... các field khác
       private Double productPrice;    // ✅ Nhận giá từ frontend
       private Double shippingFee;      // ✅ Nhận phí ship từ frontend
       private Double totalPrice;      // ✅ Nhận tổng giá từ frontend
   }
   ```

2. **Ưu tiên giá từ request**:
   ```java
   double productPrice = request.getProductPrice();
   if (productPrice == null || productPrice == 0) {
       // Fallback: Lấy từ post-product (nhưng có thể đã thay đổi)
       productPrice = postProduct.getPrice();
   }
   
   double shippingFee = request.getShippingFee();
   if (shippingFee == null || shippingFee == 0) {
       // Fallback: Tính lại từ API shipping
       shippingFee = calculateShippingFee(...);
   }
   ```

3. **Lưu giá vào database**:
   ```java
   order.setPrice(productPrice);        // Lưu giá đã nhận từ frontend
   order.setShippingFee(shippingFee);   // Lưu phí ship đã nhận từ frontend
   order.setFinalPrice(totalPrice);     // Lưu tổng giá đã nhận từ frontend
   ```

4. **Trả về giá trong response**:
   ```json
   {
     "orderId": 123,
     "orderCode": "ORD-2024-001",
     "price": 5000000,          // Giá đã lưu
     "shippingFee": 50000,       // Phí ship đã lưu
     "finalPrice": 5050000       // Tổng giá đã lưu
   }
   ```

## 📝 Tóm Tắt

**Nguyên nhân chính**:
1. Frontend không gửi giá trong request (hoặc backend không nhận)
2. Backend tự tính lại giá từ post-product (có thể đã thay đổi)
3. Order history lấy giá từ database (giá backend đã lưu) → Khác với giá frontend

**Giải pháp**:
1. ✅ Frontend gửi giá trong request (đã làm)
2. ✅ Cải thiện normalizeOrderHistoryItem để lấy giá từ nhiều field (đã làm)
3. ✅ Thêm logging để debug (đã làm)
4. ⚠️ Backend cần nhận và sử dụng giá từ request (cần backend team fix)

**Kết quả mong đợi**:
- Place Order và Order History hiển thị cùng một giá
- Giá không thay đổi sau khi đặt hàng
- Giá khớp giữa frontend và backend

