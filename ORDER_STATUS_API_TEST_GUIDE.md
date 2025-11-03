# Hướng dẫn Test API Order Status

## 📋 Tổng quan

API Order Status đã được tích hợp vào các trang sau:
1. **OrderList** (`/orders`) - Danh sách đơn hàng
2. **OrderTracking** (`/order-tracking/:orderId`) - Theo dõi đơn hàng chi tiết
3. **OrderDetail** - Chi tiết đơn hàng (nếu có route)

API được gọi tự động khi:
- Trang load lần đầu
- Auto-refresh mỗi 30 giây
- Khi user quay lại tab (window focus)

## 🔍 Các trang có thể test

### 1. **Trang Danh sách đơn hàng** (`/orders`)

**URL:** `http://localhost:5173/orders` (hoặc domain của bạn)

**Cách test:**
1. Đăng nhập vào hệ thống
2. Truy cập `/orders`
3. Mở Developer Console (F12)
4. Kiểm tra logs:
   - `[OrderList] Loading order history...`
   - `[OrderList] Updating order statuses from API...`
   - `[OrderList] Status updates: [...]`
   - `[OrderList] Auto-refreshing order statuses...` (mỗi 30 giây)

**Cách kiểm tra API hoạt động:**
- **Network Tab:**
  1. Mở Developer Tools (F12)
  2. Chuyển sang tab "Network"
  3. Filter: `status` hoặc tìm `shipping/order`
  4. Kiểm tra request: `GET /api/v1/shipping/order/{orderId}/status`
  5. Xem Response status code và data

- **Console Logs:**
  - Tìm các log có prefix `[OrderList]`
  - Nếu thấy `Status updates:` với mảng các updates → API hoạt động
  - Nếu thấy `Failed to get status` → Kiểm tra backend hoặc orderId

**Những gì cần kiểm tra:**
- ✅ Trạng thái đơn hàng được hiển thị đúng
- ✅ Trạng thái tự động cập nhật mỗi 30 giây
- ✅ Console có logs về API calls
- ✅ Network tab có request đến API status

---

### 2. **Trang Theo dõi đơn hàng** (`/order-tracking/:orderId`)

**URL:** `http://localhost:5173/order-tracking/{orderId}`

**Ví dụ:** `http://localhost:5173/order-tracking/123`

**Cách test:**
1. Đăng nhập vào hệ thống
2. Vào trang `/orders` và click vào một đơn hàng (hoặc truy cập trực tiếp URL với orderId)
3. Mở Developer Console (F12)
4. Kiểm tra logs:
   - `[OrderTracking] Auto-refreshing order status...`
   - `[OrderTracking] Status updated: {oldStatus} -> {newStatus}`

**Cách kiểm tra API hoạt động:**
- **Network Tab:**
  1. Mở Developer Tools (F12)
  2. Tab "Network"
  3. Tìm request: `GET /api/v1/shipping/order/{orderId}/status`
  4. Kiểm tra Response:
     ```json
     {
       "success": true,
       "message": "...",
       "data": {
         "status": "DELIVERED",
         ...
       },
       "error": null
     }
     ```

- **Console Logs:**
  - `[OrderTracking] Auto-refreshing order status...` (mỗi 30 giây)
  - `[OrderTracking] Status updated: pending -> confirmed` (khi có thay đổi)

**Những gì cần kiểm tra:**
- ✅ Trạng thái hiển thị đúng trên trang tracking
- ✅ Trạng thái tự động refresh mỗi 30 giây
- ✅ Khi trạng thái thay đổi trên backend, UI cập nhật tự động
- ✅ Console có logs về status updates

---

### 3. **Trang Chi tiết đơn hàng** (nếu có)

**Cách test tương tự OrderTracking**

---

## 🧪 Các bước test chi tiết

### **Bước 1: Chuẩn bị**

1. **Đảm bảo backend đang chạy:**
   - Backend URL: Check trong `.env` file (`VITE_API_BASE_URL`)
   - Default: `http://localhost:8080`

2. **Đảm bảo có đơn hàng để test:**
   - Tạo một đơn hàng mới hoặc sử dụng đơn hàng có sẵn
   - Lưu orderId để test

3. **Mở Developer Tools:**
   - Nhấn `F12` hoặc `Right-click > Inspect`
   - Chuyển sang tab **Console** và **Network**

---

### **Bước 2: Test trên OrderList (`/orders`)**

#### 2.1. Kiểm tra API được gọi khi load

1. Truy cập `/orders`
2. Mở **Console** tab
3. Tìm các logs:
   ```
   [OrderList] Loading order history...
   [OrderList] Updating order statuses from API...
   [OrderList] Status updates: [{orderId: "...", newStatus: "...", ...}]
   ```

4. Mở **Network** tab:
   - Filter: `status` hoặc tìm `shipping`
   - Tìm request: `GET /api/v1/shipping/order/{orderId}/status`
   - Kiểm tra:
     - Status code: `200` (OK)
     - Response có data trả về

#### 2.2. Kiểm tra Auto-refresh

1. Đợi 30 giây sau khi trang load
2. Trong **Console**, sẽ thấy:
   ```
   [OrderList] Auto-refreshing order statuses...
   ```
3. Trong **Network**, sẽ có request mới đến API status

#### 2.3. Kiểm tra cập nhật trạng thái

1. Thay đổi trạng thái đơn hàng trên backend (hoặc đợi backend tự động cập nhật)
2. Đợi tối đa 30 giây (hoặc refresh trang)
3. Kiểm tra UI có cập nhật trạng thái mới không
4. Console sẽ có log:
   ```
   [OrderList] Updating order {orderId} status: {oldStatus} -> {newStatus}
   ```

---

### **Bước 3: Test trên OrderTracking (`/order-tracking/:orderId`)**

#### 3.1. Kiểm tra API được gọi khi load

1. Truy cập `/order-tracking/{orderId}` (thay `{orderId}` bằng ID thực)
2. Mở **Console** tab
3. Tìm logs:
   ```
   [OrderTracking] Auto-refreshing order status...
   ```

4. Mở **Network** tab:
   - Tìm request: `GET /api/v1/shipping/order/{orderId}/status`
   - Kiểm tra Response

#### 3.2. Kiểm tra Auto-refresh

1. Đợi 30 giây
2. Console sẽ có log mới: `[OrderTracking] Auto-refreshing order status...`
3. Network sẽ có request mới

#### 3.3. Kiểm tra cập nhật trạng thái

1. Thay đổi trạng thái trên backend
2. Đợi tối đa 30 giây
3. UI sẽ tự động cập nhật
4. Console log:
   ```
   [OrderTracking] Status updated: {oldStatus} -> {newStatus}
   ```

---

## 🐛 Debug và Troubleshooting

### **Vấn đề: Không thấy API calls trong Network**

**Nguyên nhân có thể:**
- Backend chưa chạy hoặc URL sai
- OrderId không tồn tại trong shipping service
- CORS issues

**Cách fix:**
1. Kiểm tra backend URL trong `.env`
2. Kiểm tra backend có endpoint: `/api/v1/shipping/order/{orderId}/status`
3. Kiểm tra CORS settings trên backend

---

### **Vấn đề: API trả về 404**

**Nguyên nhân:**
- Order chưa có trong shipping service
- OrderId sai

**Cách xử lý:**
- Code đã xử lý 404 và giữ nguyên trạng thái hiện tại
- Console sẽ có warning: `Failed to get order status`

**Cách test:**
- Dùng orderId có trong shipping service
- Hoặc tạo order mới và đợi nó được thêm vào shipping service

---

### **Vấn đề: Trạng thái không cập nhật**

**Kiểm tra:**
1. Console có logs không? Nếu không → API không được gọi
2. Network có request không? Nếu không → Check network filter
3. Response có data không? Nếu không → Check backend response format
4. Status có thay đổi trong response không? Nếu không → Backend chưa cập nhật

**Cách debug:**
```javascript
// Mở Console và chạy:
// Xem tất cả logs có prefix [OrderList] hoặc [OrderTracking]
// Kiểm tra response từ API
```

---

### **Vấn đề: Auto-refresh không hoạt động**

**Kiểm tra:**
1. Console có log `Auto-refreshing` sau 30 giây không?
2. Network có request mới sau 30 giây không?

**Nếu không:**
- Kiểm tra có lỗi JavaScript không (đỏ trong Console)
- Kiểm tra useEffect có chạy không
- Refresh trang và thử lại

---

## 📊 Test Cases Checklist

### ✅ Test Case 1: Load trang OrderList
- [ ] Trang load thành công
- [ ] Console có log `[OrderList] Loading order history...`
- [ ] Console có log `[OrderList] Updating order statuses from API...`
- [ ] Network có request đến `/api/v1/shipping/order/{orderId}/status`
- [ ] Trạng thái đơn hàng hiển thị đúng

### ✅ Test Case 2: Auto-refresh OrderList
- [ ] Đợi 30 giây sau khi trang load
- [ ] Console có log `[OrderList] Auto-refreshing order statuses...`
- [ ] Network có request mới đến API status
- [ ] Trạng thái cập nhật nếu có thay đổi

### ✅ Test Case 3: Load trang OrderTracking
- [ ] Trang load thành công với orderId hợp lệ
- [ ] Console có log `[OrderTracking] Auto-refreshing order status...`
- [ ] Network có request đến API status
- [ ] Trạng thái hiển thị đúng trên UI

### ✅ Test Case 4: Auto-refresh OrderTracking
- [ ] Đợi 30 giây
- [ ] Console có log refresh mới
- [ ] Network có request mới
- [ ] Trạng thái tự động cập nhật khi backend thay đổi

### ✅ Test Case 5: Thay đổi trạng thái trên backend
- [ ] Thay đổi trạng thái đơn hàng trên backend
- [ ] Đợi tối đa 30 giây
- [ ] UI tự động cập nhật trạng thái mới
- [ ] Console có log về status update

### ✅ Test Case 6: Xử lý lỗi (404, Network Error)
- [ ] Dùng orderId không tồn tại → API trả 404
- [ ] Code xử lý 404 và không crash
- [ ] Console có warning nhưng UI vẫn hiển thị
- [ ] Thử tắt backend → Code xử lý network error

---

## 📝 Console Logs Mẫu

### **Khi API hoạt động tốt:**

```
[OrderList] Loading order history...
[OrderList] Order history meta: {...}
[OrderList] Total items from backend: 5
[OrderList] Updating order statuses from API...
[OrderList] Status updates: [
  {
    orderId: "123",
    realOrderId: 123,
    newStatus: "delivered",
    rawStatus: "DELIVERED",
    message: "..."
  }
]
[OrderList] Updating order 123 status: pending -> delivered
[OrderList] Auto-refreshing order statuses... (sau 30 giây)
```

### **Khi API có lỗi:**

```
[OrderList] Updating order statuses from API...
[OrderList] Failed to get status for order 123: Error: Request failed with status code 404
```

---

## 🎯 Kết luận

Sau khi test, bạn sẽ biết API có hoạt động hay không dựa trên:
1. ✅ **Console logs:** Có logs về API calls và status updates
2. ✅ **Network requests:** Có requests đến API status endpoint
3. ✅ **UI updates:** Trạng thái tự động cập nhật mỗi 30 giây
4. ✅ **Response data:** API trả về đúng format và data

**Nếu tất cả đều OK → API hoạt động tốt! 🎉**

**Nếu có vấn đề:** Xem phần Troubleshooting ở trên để debug.

