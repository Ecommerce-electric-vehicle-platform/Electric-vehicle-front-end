# 🧪 Hướng Dẫn Test Seller Post Management

## 📋 Mục lục
1. [Cấu hình Mock Mode](#cấu-hình-mock-mode)
2. [Chạy Dev Server](#chạy-dev-server)
3. [Test Cases](#test-cases)
4. [Mock Data](#mock-data)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Cấu hình Mock Mode

### Bật Mock Mode (Đang BẬT mặc định)

File: `src/api/sellerApi.js`

```javascript
// Line 5
const USE_MOCK_DATA = true; // ✅ Bật để test

// Tắt khi integrate backend thật:
const USE_MOCK_DATA = false; // ❌ Tắt để dùng API thật
```

### Mock Data Có Sẵn

Mock data bao gồm:

1. **Seller Profile:**
   - SellerId: 8
   - Username: test_seller
   - StoreName: Cửa hàng xe điện ABC

2. **Service Package:**
   - Valid: ✅ true (còn hạn đến 31/12/2025)
   - Package: Premium Package

3. **Posts (3 posts):**
   - Post #1: VinFast Klara S 2023 - **APPROVED** ✅
   - Post #2: Yadea BF7 2024 - **PENDING** ⏳
   - Post #3: Pega Cap A Plus 2022 - **REJECTED** ❌

---

## 🚀 Chạy Dev Server

### 1. Kill các process Node cũ (nếu port bị chiếm)

```bash
# Windows PowerShell
taskkill /F /IM node.exe

# Hoặc CMD
taskkill /F /IM node.exe
```

### 2. Start dev server

```bash
npm run dev
```

### 3. Mở browser

```
http://localhost:5173
```

---

## ✅ Test Cases

### Test Case 1: Xem Danh Sách Tin Đăng

**Mục tiêu:** Kiểm tra trang Manage Posts có load đúng mock data không

**Bước thực hiện:**
1. Navigate đến: `/seller/manage-posts`
2. ✅ **Expected:**
   - Loading spinner hiện trong ~600ms
   - Hiển thị 3 tin đăng
   - Filter buttons: Tất cả (3), Đã duyệt, Chờ duyệt, Từ chối

**Console logs:**
```
🧪 [MOCK] getMyPosts: [Array(3)]
```

---

### Test Case 2: Filter Theo Status

**Mục tiêu:** Kiểm tra filter hoạt động đúng

**Bước thực hiện:**
1. Tại `/seller/manage-posts`
2. Click button **"Đã duyệt"**
3. ✅ **Expected:** Chỉ hiện 1 post (VinFast Klara S)

4. Click button **"Chờ duyệt"**
5. ✅ **Expected:** Chỉ hiện 1 post (Yadea BF7)

6. Click button **"Từ chối"**
7. ✅ **Expected:** Chỉ hiện 1 post (Pega Cap A Plus)

8. Click button **"Tất cả"**
9. ✅ **Expected:** Hiện tất cả 3 posts

---

### Test Case 3: Đăng Tin Mới

**Mục tiêu:** Kiểm tra form create post hoạt động

**Bước thực hiện:**

1. Navigate đến: `/seller/create-post`
2. ✅ **Expected:** 
   - ServicePackageGuard check → Valid ✅
   - Hiển thị form đăng tin

**Console logs:**
```
🧪 [MOCK] checkServicePackageValidity: {...}
🧪 [MOCK] getSellerProfile: {...}
```

3. Điền form:
   ```
   Tiêu đề: Xe điện Honda Benly e: 2024
   Thương hiệu: Honda
   Model: Benly e:
   Năm sản xuất: 2024
   Giá: 32000000
   Mô tả: Xe mới 100%, chưa qua sử dụng
   Địa điểm: Quận 3, TP.HCM
   ```

4. Upload ảnh (click vào khung upload)
   - Select 1-10 ảnh
   - ✅ **Expected:** Hiện preview ảnh

5. Click **"Đăng tin"**
   - ✅ **Expected:**
     - Loading state ~800ms
     - Alert: "Đăng tin thành công!"
     - Confirm: "Bạn có muốn gửi yêu cầu xác minh..."
   
6. Click **"OK"** (confirm xác minh)
   - ✅ **Expected:**
     - Alert: "Yêu cầu xác minh đã được gửi!"
     - Redirect to `/seller/manage-posts`
     - Tin mới xuất hiện trong list (status: PENDING)

**Console logs:**
```
Uploading images...
Creating post with data: {...}
🧪 [MOCK] createPostProduct: {...}
🧪 [MOCK] requestPostVerification: 4
🧪 [MOCK] getMyPosts: [Array(4)]
```

---

### Test Case 4: Gửi Yêu Cầu Xác Minh

**Mục tiêu:** Test button "Xác minh" cho post chưa verify

**Bước thực hiện:**

1. Tại `/seller/manage-posts`
2. Tìm post **chưa verified** (Yadea BF7 hoặc post mới tạo)
3. Click button **"Xác minh"**
4. Confirm dialog xuất hiện
5. Click **"OK"**

✅ **Expected:**
- Alert: "Yêu cầu xác minh đã được gửi!"
- List reload
- Post status thay đổi thành **PENDING** (Chờ duyệt)

**Console logs:**
```
🧪 [MOCK] requestPostVerification: 2
🧪 [MOCK] getMyPosts: [Array(4)]
```

---

### Test Case 5: Xóa Tin Đăng

**Mục tiêu:** Test delete post

**Bước thực hiện:**

1. Tại `/seller/manage-posts`
2. Chọn 1 post bất kỳ
3. Click button **"Xóa"**
4. Confirm dialog: "Bạn có chắc muốn xóa..."
5. Click **"OK"**

✅ **Expected:**
- Alert: "Xóa tin đăng thành công!"
- List reload
- Post đã bị xóa khỏi danh sách
- Số lượng trong filter giảm đi

**Console logs:**
```
🧪 [MOCK] deletePost: 1
🧪 [MOCK] getMyPosts: [Array(3)]
```

---

### Test Case 6: Validation Form

**Mục tiêu:** Kiểm tra validation hoạt động

**Bước thực hiện:**

1. Navigate đến `/seller/create-post`
2. Để trống tất cả field
3. Click **"Đăng tin"**

✅ **Expected:**
- Alert: "Vui lòng kiểm tra lại thông tin!"
- Error messages hiện đỏ dưới các field:
  - "Tiêu đề là bắt buộc"
  - "Thương hiệu là bắt buộc"
  - "Model là bắt buộc"
  - "Giá phải lớn hơn 0"
  - "Mô tả là bắt buộc"
  - "Địa điểm giao dịch là bắt buộc"
  - "Vui lòng thêm ít nhất 1 ảnh"

4. Điền từng field
5. ✅ **Expected:** Error message tương ứng biến mất khi điền

---

### Test Case 7: Service Package Guard (Package Hết Hạn)

**Mục tiêu:** Test khi package không valid

**Bước thực hiện:**

1. Sửa `src/api/sellerApi.js`:
   ```javascript
   const MOCK_SERVICE_PACKAGE = {
     data: {
       success: true,
       message: "Gói dịch vụ hết hạn",
       data: {
         valid: false,  // ❌ Set false
         expiryDate: "2024-01-01T00:00:00",
         packageName: "Basic Package",
       },
     },
   };
   ```

2. Save file → Browser auto reload
3. Navigate đến `/seller/create-post`

✅ **Expected:**
- ServicePackageGuard detect package không valid
- Hiển thị UI:
  ```
  📦
  Gói dịch vụ không khả dụng
  
  [Mua gói ngay] [Kiểm tra lại]
  ```
- Form đăng tin **KHÔNG hiển thị**

4. Click **"Mua gói ngay"**
5. ✅ **Expected:** Navigate to `/compare-plans` (nếu có route này)

6. **Khôi phục:**
   ```javascript
   valid: true,  // ✅ Set lại true
   ```

---

### Test Case 8: Empty State

**Mục tiêu:** Test UI khi chưa có post nào

**Bước thực hiện:**

1. Sửa `src/api/sellerApi.js`:
   ```javascript
   let MOCK_POSTS = []; // Xóa hết posts
   ```

2. Save → Navigate to `/seller/manage-posts`

✅ **Expected:**
- Empty state UI xuất hiện:
  ```
  📝
  Chưa có tin đăng nào
  Bắt đầu đăng tin để bán xe của bạn!
  
  [Đăng tin đầu tiên]
  ```

3. Click **"Đăng tin đầu tiên"**
4. ✅ **Expected:** Navigate to `/seller/create-post`

5. **Khôi phục:** Paste lại MOCK_POSTS ban đầu

---

## 📊 Mock Data Reference

### Full MOCK_POSTS

```javascript
let MOCK_POSTS = [
  {
    postId: 1,
    sellerId: 8,
    title: "Xe máy điện VinFast Klara S 2023 - Như mới",
    brand: "VinFast",
    model: "Klara S",
    manufacturerYear: 2023,
    usedDuration: "6 tháng",
    color: "Đỏ",
    price: 25000000,
    length: "1750mm",
    width: "700mm",
    height: "1100mm",
    weight: "110kg",
    description: "Xe còn mới 95%, sử dụng ít, bảo dưỡng định kỳ",
    locationTrading: "Quận 1, TP.HCM",
    pictures: [
      "https://via.placeholder.com/300x200/ff0000/ffffff?text=VinFast+Klara+S",
      "https://via.placeholder.com/300x200/cc0000/ffffff?text=Side+View",
    ],
    verifiedDecisionStatus: "APPROVED",
    verified: true,
  },
  {
    postId: 2,
    sellerId: 8,
    title: "Xe đạp điện Yadea BF7 2024",
    brand: "Yadea",
    model: "BF7",
    manufacturerYear: 2024,
    usedDuration: "2 tháng",
    color: "Xanh",
    price: 15000000,
    description: "Xe mới mua 2 tháng, còn bảo hành",
    locationTrading: "Quận 7, TP.HCM",
    pictures: ["https://via.placeholder.com/300x200/0000ff/ffffff?text=Yadea+BF7"],
    verifiedDecisionStatus: "PENDING",
    verified: false,
  },
  {
    postId: 3,
    sellerId: 8,
    title: "Xe điện Pega Cap A Plus 2022",
    brand: "Pega",
    model: "Cap A Plus",
    manufacturerYear: 2022,
    usedDuration: "2 năm",
    color: "Trắng",
    price: 18000000,
    description: "Xe đi làm, giữ kỹ, pin zin",
    locationTrading: "Quận Bình Thạnh, TP.HCM",
    pictures: ["https://via.placeholder.com/300x200/ffffff/000000?text=Pega+Cap+A"],
    verifiedDecisionStatus: "REJECTED",
    verified: false,
  },
];
```

---

## 🐛 Troubleshooting

### Lỗi: Port 5173 is already in use

**Solution:**
```bash
taskkill /F /IM node.exe
npm run dev
```

---

### Lỗi: Cannot read properties of undefined

**Nguyên nhân:** Mock data structure không khớp với code

**Solution:**
1. Check console logs: `🧪 [MOCK] ...`
2. Verify mock data structure trong `sellerApi.js`
3. So sánh với code trong components

---

### Lỗi: ServicePackageGuard không hiện form

**Nguyên nhân:** `valid: false` trong `MOCK_SERVICE_PACKAGE`

**Solution:**
```javascript
// src/api/sellerApi.js
const MOCK_SERVICE_PACKAGE = {
  data: {
    data: {
      valid: true,  // ✅ Đảm bảo là true
      // ...
    },
  },
};
```

---

### Không thấy console logs `🧪 [MOCK]`

**Nguyên nhân:** `USE_MOCK_DATA = false`

**Solution:**
```javascript
// src/api/sellerApi.js line 5
const USE_MOCK_DATA = true; // ✅ Set true
```

---

### Ảnh upload không hiện

**Nguyên nhân:** Browser không cho phép preview local files

**Solution:**
- Ảnh sẽ hiện preview khi select từ file picker
- Trong mock mode, ảnh upload được convert thành mock URLs
- Check DevTools → Network tab để xem ảnh có load không

---

## 📝 Checklist Trước Khi Test

- [ ] `USE_MOCK_DATA = true` trong `sellerApi.js`
- [ ] Dev server đang chạy (`npm run dev`)
- [ ] Browser console mở (F12) để xem logs
- [ ] Network tab mở để monitor requests (optional)
- [ ] Đã kill hết process Node cũ

---

## 🎯 Test Coverage Summary

| Feature | Test Case | Status |
|---------|-----------|--------|
| **View Posts** | Xem danh sách tin đăng | ✅ |
| **Filter Posts** | Filter theo status | ✅ |
| **Create Post** | Đăng tin mới | ✅ |
| **Request Verification** | Gửi yêu cầu xác minh | ✅ |
| **Delete Post** | Xóa tin đăng | ✅ |
| **Validation** | Form validation | ✅ |
| **Service Package Guard** | Check package validity | ✅ |
| **Empty State** | UI khi chưa có post | ✅ |

---

## 🔄 Switch Sang Backend Thật

Khi backend đã sẵn sàng:

1. **Tắt Mock Mode:**
   ```javascript
   // src/api/sellerApi.js
   const USE_MOCK_DATA = false; // ❌
   ```

2. **Verify Backend URLs:**
   - Đảm bảo backend đang chạy tại `http://localhost:8080`
   - Test API endpoints bằng Postman/Thunder Client trước

3. **Update ENV:**
   ```env
   # .env
   VITE_API_BASE_URL=http://localhost:8080
   ```

4. **Test Integration:**
   - Create post → Check DB
   - Get posts → Verify data từ DB
   - Delete post → Verify bị xóa trong DB

---

## 📸 Expected Screenshots

### 1. Manage Posts - All Posts
```
┌─────────────────────────────────────────────┐
│ Quản Lý Tin Đăng                    [+ Đăng tin mới] │
├─────────────────────────────────────────────┤
│ [Tất cả (3)] [Đã duyệt] [Chờ duyệt] [Từ chối] │
├─────────────────────────────────────────────┤
│ ┌─────────┐ VinFast Klara S 2023           │
│ │  [IMG]  │ VinFast Klara S                │
│ │ ✅ Đã   │ 25,000,000 VNĐ                │
│ │  duyệt  │ 📍 Quận 1, TP.HCM             │
│ └─────────┘ [Xem][Sửa][Xóa]               │
│                                             │
│ ┌─────────┐ Yadea BF7 2024                │
│ │  [IMG]  │ Yadea BF7                      │
│ │ ⏳ Chờ  │ 15,000,000 VNĐ                │
│ │  duyệt  │ 📍 Quận 7, TP.HCM             │
│ └─────────┘ [Xem][Xác minh][Sửa][Xóa]    │
│                                             │
│ ┌─────────┐ Pega Cap A Plus 2022          │
│ │  [IMG]  │ Pega Cap A Plus                │
│ │ ❌ Từ   │ 18,000,000 VNĐ                │
│ │  chối   │ 📍 Quận Bình Thạnh, TP.HCM    │
│ └─────────┘ [Xem][Xác minh][Sửa][Xóa]    │
└─────────────────────────────────────────────┘
```

### 2. Create Post Form
```
┌─────────────────────────────────────────────┐
│ Đăng Tin Bán Xe                            │
│ Điền đầy đủ thông tin để đăng tin bán xe   │
├─────────────────────────────────────────────┤
│ Thông tin cơ bản                           │
│                                             │
│ Tiêu đề *                                  │
│ [VD: Xe máy điện VinFast Klara S 2023]    │
│                                             │
│ Thương hiệu *     Model *                  │
│ [VD: VinFast]     [VD: Klara S]           │
│                                             │
│ Giá bán (VNĐ) *                            │
│ [VD: 25000000]                             │
│                                             │
│ ... more fields ...                         │
│                                             │
│ Hình ảnh                                   │
│ ┌──────────────────────────┐              │
│ │      📷                   │              │
│ │  Click để chọn ảnh       │              │
│ │  Hoặc kéo thả ảnh vào đây│              │
│ └──────────────────────────┘              │
│                                             │
│ [Hủy]                      [Đăng tin]      │
└─────────────────────────────────────────────┘
```

---

**Last Updated:** October 23, 2025  
**Version:** 1.0 - Mock Mode  
**Next:** Integration Testing with Real Backend

