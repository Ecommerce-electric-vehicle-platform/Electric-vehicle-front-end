# 🔧 Fix: Place Order - Wallet không trừ tiền và đơn hàng không lưu database

## ❌ Vấn đề ban đầu

Khi đặt hàng thành công, bạn gặp 2 vấn đề:
1. **Ví không trừ tiền** - Số dư ví không bị trừ sau khi đặt hàng
2. **Đơn hàng không lưu database** - Đơn hàng không xuống database backend

## 🔍 Nguyên nhân

Trong file `src/pages/PlaceOrder/PlaceOrder.jsx` (dòng 747-782 cũ), code có **fallback behavior** khi API lỗi:

```javascript
catch (error) {
    // Nếu API lỗi, vẫn cho phép đặt hàng với fake data
    console.log('🔄 API failed, proceeding with fake order...');
    
    // Tạo fake order và hiển thị thành công
    // → Người dùng nghĩ đặt hàng thành công
    // → Nhưng thực tế không có gì được lưu vào backend
}
```

**Vấn đề:** Code tạo đơn hàng fake trong localStorage và hiển thị "thành công" cho người dùng, nhưng:
- ❌ Đơn hàng không được gửi lên backend
- ❌ Ví không bị trừ tiền trên backend  
- ❌ Database không lưu đơn hàng
- ✅ Chỉ có fake data trong localStorage

## ✅ Giải pháp đã áp dụng

### 1. Xóa fallback behavior (fake order)
- **Trước:** Khi API lỗi → tạo fake order trong localStorage và hiển thị thành công
- **Sau:** Khi API lỗi → **hiển thị lỗi** và yêu cầu người dùng thử lại hoặc quay lại

### 2. Cải thiện error handling

```javascript
catch (error) {
    console.error('❌ Place order error:', error);
    
    // Hiển thị lỗi chi tiết
    const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Không thể đặt hàng. Vui lòng thử lại sau.';
    
    // Hiển thị modal lỗi với 2 options:
    // - Thử lại
    // - Quay lại
    setModalConfig({
        type: 'error',
        title: 'Đặt hàng thất bại',
        message: errorMessage,
        actions: [...]
    });
    setShowModal(true);
}
```

### 3. Cải thiện response handling

Code hiện tại có thể xử lý nhiều cấu trúc response từ backend:

```javascript
// Backend response có thể là:
// - response.data.orderId (nếu cấu trúc: { data: { orderId: ... } })
// - response.orderId (nếu cấu trúc: { orderId: ... })
// - response.success (nếu cấu trúc: { success: true, data: {...} })

const orderId = response.data?.orderId || response.orderId || null;

if (orderId || response.success !== false) {
    // Order thành công
    console.log('✅ Order placed successfully:', orderId);
    refreshWalletBalance();
    // ...
}
```

## 🧪 Cách kiểm tra vấn đề

### Bước 1: Kiểm tra Console

Khi đặt hàng, mở **Developer Tools > Console** và tìm các log:

```
🚀 Sending order data to API: {...}
📦 API Response: {...}
```

**✅ Nếu thấy `✅ Order placed successfully`** → Order đã thành công
**❌ Nếu thấy `❌ Place order error`** → Có lỗi từ API

### Bước 2: Kiểm tra Network

Mở **Developer Tools > Network** và filter `place-order`:

1. Tìm request `POST /api/v1/buyer/place-order`
2. Xem **Status Code**:
   - ✅ `200 OK` → Request thành công
   - ❌ `400, 401, 403, 500` → Có lỗi

3. Xem **Request Payload** (tab Payload):
```json
{
  "postProductId": 123,
  "username": "user123",
  "shippingAddress": "...",
  "phoneNumber": "...",
  "shippingPartnerId": 1,
  "paymentId": 1
}
```

4. Xem **Response** (tab Preview):
```json
{
  "success": true,
  "data": {
    "orderId": 456,
    "orderCode": "GT-20241022-1234",
    "transactionId": "TXN123456"
  }
}
```

### Bước 3: Kiểm tra Backend

**Truy cập database hoặc API để verify:**

1. **Đơn hàng có trong database không?**
```sql
SELECT * FROM orders WHERE buyer_username = 'user123' ORDER BY created_at DESC LIMIT 1;
```

2. **Ví có bị trừ tiền không?**
```sql
SELECT * FROM wallet_transactions WHERE user_id = ... ORDER BY created_at DESC LIMIT 1;
```

3. **Backend logs có ghi nhận request không?**
```bash
# Check backend console for:
POST /api/v1/buyer/place-order
Request: {...}
Response: {...}
```

## 🛠️ Cách sửa nếu vẫn gặp lỗi

### Lỗi 1: API trả về 401 Unauthorized

**Nguyên nhân:** Token hết hạn hoặc không hợp lệ

**Giải pháp:**
1. Đăng xuất và đăng nhập lại
2. Check localStorage có `accessToken` không:
```javascript
localStorage.getItem('accessToken');
```

### Lỗi 2: API trả về 400 Bad Request

**Nguyên nhân:** Request data không đúng format backend expect

**Giải pháp:**
1. Kiểm tra `postProductId` có tồn tại không
2. Kiểm tra `username` có đúng không
3. Kiểm tra backend có đang chạy không
4. Xem backend logs để biết field nào sai

### Lỗi 3: API trả về 500 Internal Server Error

**Nguyên nhân:** Lỗi phía backend (database, logic, etc.)

**Giải pháp:**
1. Check backend logs
2. Check database connection
3. Check backend có đang chạy không
4. Liên hệ backend developer

### Lỗi 4: Network Error (No response from Backend)

**Nguyên nhân:** Backend không chạy hoặc URL sai

**Giải pháp:**
1. Check backend có chạy tại `http://localhost:8080` không
2. Check file `.env` có config đúng `VITE_API_BASE_URL` không:
```env
VITE_API_BASE_URL=http://localhost:8080
```
3. Thử truy cập trực tiếp: `http://localhost:8080/api/v1/buyer/place-order` (sẽ trả về 401 nhưng confirm backend đang chạy)

## 📝 Testing Guide

### Test case 1: Đặt hàng thành công
1. Login với tài khoản có tiền trong ví
2. Chọn sản phẩm
3. Click "Đặt hàng"
4. Điền thông tin
5. Click "Xác nhận đặt hàng"
6. **Expected:** Thấy màn hình "Đặt hàng thành công"
7. **Verify:**
   - Console có log `✅ Order placed successfully`
   - Network có request `POST /api/v1/buyer/place-order` status 200
   - Database có đơn hàng mới
   - Ví bị trừ đúng số tiền
   - Đơn hàng xuất hiện trong `/orders`

### Test case 2: Ví không đủ tiền
1. Login với tài khoản có ít tiền (ví dụ: 10,000₫)
2. Đặt hàng có giá cao hơn (ví dụ: 500,000₫)
3. Click "Đặt hàng"
4. **Expected:** Modal hiển thị "Số dư ví không đủ"
5. **Not expected:** Đặt hàng thành công

### Test case 3: API lỗi
1. Tắt backend server
2. Đặt hàng
3. **Expected:** Modal hiển thị "Đặt hàng thất bại" với message lỗi
4. **Not expected:** Fake order được tạo trong localStorage

## 🔄 Next Steps

1. **Backend cần đảm bảo:**
   - Endpoint `/api/v1/buyer/place-order` hoạt động đúng
   - Trừ tiền từ ví khi đặt hàng thành công
   - Lưu đơn hàng vào database
   - Trả về response format hợp lệ

2. **Frontend đã sửa:**
   - ✅ Xóa fake order fallback
   - ✅ Cải thiện error handling
   - ✅ Hiển thị error modal khi lỗi
   - ✅ Log chi tiết để debug
   - ✅ Handle nhiều response structures

3. **Testing:**
   - Test với backend thực
   - Test với các edge cases
   - Verify ví trừ tiền đúng
   - Verify đơn hàng lưu database

## 📞 Support

Nếu vẫn gặp vấn đề sau khi thử các bước trên:

1. **Check Console logs** - Copy toàn bộ logs khi đặt hàng
2. **Check Network tab** - Screenshot request/response
3. **Check Backend logs** - Backend có nhận được request không?
4. **Contact Backend team** - Cung cấp logs để backend team debug

