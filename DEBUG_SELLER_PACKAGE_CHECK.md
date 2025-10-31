# 🔍 Debug Seller Package Check - Chi tiết

## 🎯 Mục đích

Khi click "Đăng tin", `ServicePackageGuard` sẽ:
1. Lấy `username` từ `localStorage`
2. Gửi `username` → Backend API: `POST /api/v1/seller/{username}/check-service-package-validity`
3. Backend check:
   - User có phải seller không?
   - Gói service package còn valid không?
4. Trả về kết quả → Frontend hiển thị

---

## 📝 API Call Details

### **Request:**
```
POST http://localhost:8080/api/v1/seller/{username}/check-service-package-validity

Headers:
  Authorization: Bearer {accessToken}
  
Body: (empty)
```

### **Expected Response (Success):**
```json
{
  "success": true,
  "message": "Package is valid",
  "data": {
    "valid": true,
    "sellerId": "seller123",
    "packageName": "Premium",
    "expiryDate": "2025-12-31"
  }
}
```

### **Expected Response (Invalid/Expired):**
```json
{
  "success": true,
  "message": "Package is invalid or expired",
  "data": {
    "valid": false,
    "sellerId": null,
    "packageName": null,
    "expiryDate": null
  }
}
```

### **Expected Response (Error - Not Seller):**
```json
{
  "success": false,
  "message": "User is not a seller",
  "data": null
}
```

---

## 🔍 Debug Steps (Chi tiết)

### **Bước 1: Clear Console**
```
1. Mở DevTools (F12)
2. Tab Console
3. Nhấn 🗑️ (Clear console) hoặc Ctrl + L
```

### **Bước 2: Đăng nhập**
```
1. Đăng nhập với tài khoản seller
2. Kiểm tra console logs:
   - "[User] Login successful..."
   - Username, buyerId, authType
```

### **Bước 3: Click "Đăng tin"**
```
1. Click vào button "Đăng tin" trong menu
2. Ngay lập tức check console logs
```

---

## 📊 Console Logs sẽ hiển thị

### **Scenario 1: SUCCESS (Package Valid)**

```
[ServicePackageGuard] Checking package for username: buyerxautrai
=== [ServicePackageGuard] API Response Debug ===
Full response object: {status: 200, data: {...}}
response.status: 200
response.data: {success: true, message: "...", data: {...}}
response.data.success: true
response.data.message: "Package is valid"
response.data.data: {valid: true, sellerId: "123", packageName: "Premium", expiryDate: "2025-12-31"}
Extracted data object: {valid: true, sellerId: "123", ...}
data.valid: true
data.packageName: "Premium"
data.expiryDate: "2025-12-31"
data.sellerId: "123"
================================================
✅ [ServicePackageGuard] Package is VALID!
```

**Kết quả:** Hiển thị form đăng tin ✅

---

### **Scenario 2: INVALID (Package Expired hoặc chưa mua)**

```
[ServicePackageGuard] Checking package for username: buyerxautrai
=== [ServicePackageGuard] API Response Debug ===
Full response object: {status: 200, data: {...}}
response.status: 200
response.data: {success: true, message: "...", data: {...}}
response.data.success: true
response.data.message: "Package is invalid or expired"
response.data.data: {valid: false, sellerId: null, packageName: null, expiryDate: null}
Extracted data object: {valid: false, ...}
data.valid: false
data.packageName: null
data.expiryDate: null
data.sellerId: null
================================================
⚠️ [ServicePackageGuard] Package is INVALID or expired
Reason - data.valid: false
```

**Kết quả:** Hiển thị modal "Gói dịch vụ không khả dụng" ⚠️

---

### **Scenario 3: ERROR (User chưa phải seller)**

```
[ServicePackageGuard] Checking package for username: buyerxautrai
=== [ServicePackageGuard] ERROR Debug ===
Error object: Error: Request failed with status code 403
Error message: Request failed with status code 403
Error response: {status: 403, data: {...}}
Error response status: 403
Error response data: {success: false, message: "User is not a seller", data: null}
Error response data.message: "User is not a seller"
Error response data.error: null
=========================================
```

**Kết quả:** Hiển thị error "User is not a seller" ❌

---

### **Scenario 4: ERROR (Backend lỗi hoặc không response)**

```
[ServicePackageGuard] Checking package for username: buyerxautrai
=== [ServicePackageGuard] ERROR Debug ===
Error object: Error: Network Error
Error message: Network Error
Error response: undefined
Error response status: undefined
Error response data: undefined
Error response data.message: undefined
Error response data.error: undefined
=========================================
```

**Kết quả:** Hiển thị error "Không thể kiểm tra gói dịch vụ" ❌

---

## 🧪 Test Cases

### **Test 1: Seller có gói còn hạn**

**Setup:**
- Tài khoản: `buyerxautrai`
- Đã upgrade seller ✅
- Đã mua gói Premium ✅
- Gói còn hạn đến 31/12/2025 ✅

**Expected Logs:**
```
data.valid: true
data.packageName: "Premium"
data.expiryDate: "2025-12-31"
✅ [ServicePackageGuard] Package is VALID!
```

**Expected UI:**
✅ Hiển thị form đăng tin

---

### **Test 2: Seller gói đã hết hạn**

**Setup:**
- Tài khoản: `seller2`
- Đã upgrade seller ✅
- Đã mua gói nhưng hết hạn ❌

**Expected Logs:**
```
data.valid: false
⚠️ [ServicePackageGuard] Package is INVALID or expired
```

**Expected UI:**
⚠️ Modal "Gói dịch vụ không khả dụng" → "Mua gói ngay"

---

### **Test 3: User chưa upgrade seller**

**Setup:**
- Tài khoản: `normaluser`
- Chưa upgrade seller ❌

**Expected Logs:**
```
Error response status: 403
Error response data.message: "User is not a seller"
```

**Expected UI:**
❌ Modal "Nâng cấp tài khoản Người bán"

---

### **Test 4: Backend API lỗi**

**Setup:**
- Backend server bị down
- Hoặc API endpoint sai

**Expected Logs:**
```
Error message: Network Error
Error response: undefined
```

**Expected UI:**
❌ Error "Không thể kiểm tra gói dịch vụ" + button "Thử lại"

---

## 🔧 Troubleshooting

### **Problem 1: Vẫn hiển thị modal "Nâng cấp" dù đã là seller**

**Possible Causes:**
1. ❌ Backend API trả về `data.valid: false`
2. ❌ Backend API trả về error 403/404
3. ❌ Gói đã hết hạn

**Debug:**
```
1. Check console logs phần "=== API Response Debug ==="
2. Xem data.valid là true hay false
3. Xem data.expiryDate
4. Nếu có error, check error response status
```

---

### **Problem 2: Console không có logs**

**Possible Causes:**
1. ❌ Chưa refresh sau khi update code
2. ❌ Console bị filter

**Fix:**
```
1. Refresh trang (Ctrl + F5)
2. Clear console filter (ensure "All levels" selected)
3. Đăng nhập lại
4. Click "Đăng tin" lại
```

---

### **Problem 3: API trả về 401 Unauthorized**

**Possible Causes:**
1. ❌ Token hết hạn
2. ❌ Token không hợp lệ

**Fix:**
```
1. Đăng xuất
2. Đăng nhập lại
3. Check localStorage.accessToken có giá trị
4. Click "Đăng tin" lại
```

---

## 📸 Screenshots Cần Gửi (Để Debug)

### **Screenshot 1: Console Logs**
Chụp toàn bộ phần:
```
=== [ServicePackageGuard] API Response Debug ===
...
================================================
```

### **Screenshot 2: Network Tab**
1. Mở DevTools → Tab Network
2. Filter: `check-service-package-validity`
3. Click "Đăng tin"
4. Chụp:
   - Request URL
   - Request Headers (Authorization)
   - Response Status
   - Response Preview

### **Screenshot 3: Application Tab**
1. DevTools → Tab Application
2. Storage → Local Storage → `http://localhost:5173`
3. Chụp:
   - username
   - authType
   - sellerId
   - accessToken (nếu có)

---

## 🎯 Expected Behavior Summary

| User Type | Package Status | `data.valid` | UI Result |
|-----------|----------------|--------------|-----------|
| Not Seller | N/A | Error 403 | ❌ Modal "Nâng cấp" |
| Seller | No Package | `false` | ⚠️ Modal "Mua gói" |
| Seller | Expired | `false` | ⚠️ Modal "Mua gói" |
| Seller | Valid | `true` | ✅ Form đăng tin |

---

## 📍 Related Files

- `src/components/ServicePackageGuard/ServicePackageGuard.jsx` - Component check package
- `src/api/sellerApi.js` - API call `checkServicePackageValidity`
- `src/pages/Seller/CreatePost/CreatePost.jsx` - Guarded by ServicePackageGuard
- Backend: `POST /api/v1/seller/{username}/check-service-package-validity`

---

## ✅ Next Steps

1. **Refresh browser** (Ctrl + F5)
2. **Clear console** (Ctrl + L)
3. **Đăng nhập** với tài khoản seller
4. **Click "Đăng tin"**
5. **Chụp console logs** và gửi cho tôi
6. **Chụp Network tab** (Request/Response của API)

---

**Last Updated:** October 24, 2025  
**Status:** ✅ Ready for debug  
**File Updated:** `src/components/ServicePackageGuard/ServicePackageGuard.jsx`  
**Debug Logs:** Added detailed console.log for API response and errors













