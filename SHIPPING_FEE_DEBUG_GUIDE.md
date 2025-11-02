# Hướng Dẫn Debug: Phí Ship Khác Nhau Giữa Frontend Và Database

## 🔴 Vấn Đề

**Frontend hiển thị:** `561000`  
**Database lưu:** `616000`  
**Chênh lệch:** `55000`

## 🔍 Cách Xác Định Lỗi Ở FE Hay BE

### Bước 1: Kiểm Tra Console Logs

**Khi place order, tìm các logs sau:**

#### A. Frontend Gửi Request:

```
[API] POST /api/v1/buyer/place-order (authenticated)
[API] Place Order Request Body: {
  postProductId: 26,
  shippingFee: 561000,      // ← Giá này có đúng không?
  productPrice: 3800000,
  totalPrice: 4361000,
  ...
}

💰 Price breakdown (BEFORE place order): {
  shippingFee_sent_to_backend: 561000,    // ← Giá gửi đi
  shippingFee_displayed_to_user: 561000,  // ← Giá hiển thị
  match: '✅ MATCH' hoặc '⚠️ DIFFERENT'
}
```

#### B. Frontend Gọi Lại API getShippingFee:

```
🔄 Fetching latest shipping fee before place order...
✅ Latest shipping fee: 561000  hoặc  616000
```

**Nếu latest fee = 616000:**
- ✅ Frontend đã gửi đúng `616000`
- ❌ Backend API getShippingFee trả về giá khác nhau giữa 2 lần gọi

**Nếu latest fee = 561000 nhưng database = 616000:**
- ✅ Frontend gửi đúng `561000`
- ❌ Backend không nhận hoặc không sử dụng `shippingFee` từ request
- ❌ Backend tự tính lại → **LỖI Ở BACKEND**

### Bước 2: Kiểm Tra Network Tab

**Trong Browser DevTools → Network:**
1. Tìm request `POST /api/v1/buyer/place-order`
2. Click vào request → Tab "Payload" hoặc "Request"
3. Kiểm tra `shippingFee` trong request body

**Expected:**
```json
{
  "postProductId": 26,
  "shippingFee": 561000,  // ← Giá này có đúng không?
  "productPrice": 3800000,
  "totalPrice": 4361000
}
```

**Nếu `shippingFee` = 561000:**
- ✅ Frontend gửi đúng
- ❌ Backend không nhận hoặc tự tính lại → **LỖI Ở BACKEND**

**Nếu `shippingFee` = 616000:**
- ❌ Frontend gửi sai → **LỖI Ở FRONTEND**
- Cần kiểm tra tại sao frontend tính sai

### Bước 3: Kiểm Tra Database

**Query database:**
```sql
SELECT 
    id,
    order_code,
    price,
    shipping_fee,
    total_price,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

**Compare với giá Frontend đã gửi:**
- `shipping_fee` = 616000 (database)
- `shippingFee` = 561000 (frontend gửi)
- ❌ **Khác nhau → Backend không sử dụng giá từ request**

## 📊 Phân Tích Kết Quả

### Scenario 1: Frontend Gửi Đúng, Database Lưu Sai

**Logs:**
```
[API] Place Order Request Body: { shippingFee: 561000 }
Database: shipping_fee = 616000
```

**Kết luận:** ❌ **LỖI Ở BACKEND**

**Nguyên nhân:**
- Backend không nhận field `shippingFee` từ request
- Hoặc Backend nhận nhưng không sử dụng, tự tính lại

**Giải pháp:**
- Backend cần nhận và sử dụng `shippingFee` từ request
- Không tự tính lại

### Scenario 2: Frontend Gửi Sai

**Logs:**
```
[API] Place Order Request Body: { shippingFee: 616000 }
Latest shipping fee: 616000
```

**Kết luận:** ❌ **LỖI Ở FRONTEND**

**Nguyên nhân:**
- Frontend tính sai phí ship
- Hoặc Frontend gọi lại API getShippingFee và nhận giá khác

**Giải pháp:**
- Kiểm tra logic tính phí ship
- Kiểm tra API getShippingFee trả về giá đúng không

### Scenario 3: API getShippingFee Trả Về Giá Khác Nhau

**Logs:**
```
First call (when select address): 561000
Second call (before place order): 616000
```

**Kết luận:** ❌ **LỖI Ở BACKEND API**

**Nguyên nhân:**
- API getShippingFee trả về giá khác nhau giữa 2 lần gọi
- Có thể do tham số khác nhau hoặc logic tính toán khác

**Giải pháp:**
- Backend cần đảm bảo API getShippingFee trả về giá nhất quán
- Hoặc Frontend sử dụng giá từ lần gọi cuối cùng

## 🎯 Kết Luận

**Để xác định lỗi ở đâu, kiểm tra:**

1. ✅ **Request body có `shippingFee: 561000` không?**
   - Có → Frontend đúng, lỗi ở Backend
   - Không hoặc khác → Lỗi ở Frontend

2. ✅ **Database lưu `shipping_fee = 616000`?**
   - Có → Backend tự tính lại (lỗi ở Backend)
   - Không, = 561000 → Backend đúng

3. ✅ **API getShippingFee trả về giá khác nhau?**
   - Có → Lỗi ở Backend API
   - Không → Frontend tính sai hoặc Backend không nhận giá từ request

## 📝 Checklist Debug

- [ ] Kiểm tra console log: `[API] Place Order Request Body`
- [ ] Kiểm tra console log: `💰 Price breakdown`
- [ ] Kiểm tra console log: `✅ Latest shipping fee`
- [ ] Kiểm tra Network tab: Request payload
- [ ] Kiểm tra Database: `shipping_fee` value
- [ ] So sánh: Request body vs Database

## 🔧 Sau Khi Xác Định

**Nếu lỗi ở Frontend:**
- Kiểm tra logic tính phí ship
- Kiểm tra API getShippingFee
- Sửa logic tính toán

**Nếu lỗi ở Backend:**
- Backend cần nhận field `shippingFee` từ request
- Backend cần sử dụng `shippingFee` từ request (không tự tính lại)
- Hoặc Backend cần đảm bảo API getShippingFee trả về giá nhất quán

