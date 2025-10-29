# 🐛 BÁO LỖI BACKEND - SELLER APIs

**Ngày báo:** 28/10/2025  
**Mức độ:** 🔴 **CRITICAL** - Chặn tính năng Seller đăng tin  
**Người báo:** Frontend Team

---

## 📋 TÓM TẮT LỖI

**2 APIs của Seller đang bị lỗi 500 Internal Server Error**, dẫn đến:
- ❌ Seller không thể vào trang "Đăng tin"
- ❌ Frontend không thể kiểm tra seller status
- ❌ Frontend không thể kiểm tra gói dịch vụ còn hạn hay không

---

## 🔴 API 1: `GET /api/v1/seller/profile`

### **Vấn đề:**
API luôn trả về **500 Internal Server Error** khi:
- User đã đăng nhập nhưng **chưa đăng ký làm Seller** (chưa có record trong bảng `seller`)

### **Request:**
```http
GET /api/v1/seller/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### **Response hiện tại (❌ SAI):**
```json
{
  "success": false,
  "message": "Lỗi lấy thông tin seller: ...",
  "timestamp": "2025-10-28T10:30:00"
}
```
**Status Code:** `500 Internal Server Error` ❌

### **Console Log Frontend:**
```
❌ API Error [500] /api/v1/seller/profile: Object
❌ [SellerAPI] Error fetching seller profile: ► Object
❌ Error loading seller profile: AxiosError
```

### **Response mong muốn (✅ ĐÚNG):**

**Trường hợp 1: User chưa đăng ký seller**
```json
{
  "success": false,
  "message": "Không tìm thấy thông tin seller. Vui lòng đăng ký làm seller trước.",
  "error": "SELLER_NOT_FOUND"
}
```
**Status Code:** `404 Not Found` ✅

**Trường hợp 2: User đã là seller**
```json
{
  "success": true,
  "message": "Lấy thông tin seller thành công",
  "data": {
    "sellerId": 123,
    "username": "doanvien",
    "status": "ACCEPTED",
    "activeServicePackage": { ... }
  }
}
```
**Status Code:** `200 OK` ✅

---

## 🔴 API 2: `POST /api/v1/seller/{username}/check-service-package-validity`

### **Vấn đề:**
API luôn trả về **500 Internal Server Error** khi:
- Seller tồn tại
- Seller đã mua gói dịch vụ
- Gói còn hạn (DB đã check: `expiry_date` = 2025-12-31)

### **Request:**
```http
POST /api/v1/seller/doanvien/check-service-package-validity
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### **Response hiện tại (❌ SAI):**
```json
{
  "success": false,
  "message": "undefined",
  "error": "Internal Server Error"
}
```
**Status Code:** `500 Internal Server Error` ❌

### **Console Log Frontend:**
```
[ServicePackageGuard] Checking package for username: doanvien

❌ API Error [500] /api/v1/seller/doanvien/check-service-package-validity → 500

❌ [API] POST /api/v1/seller/doanvien/check-service-package-validity → 500
❌ Error object: ► Object
❌ Error message: Request failed with status code 500
❌ Error response: ► Object
❌ Error response status: 500
❌ Error response data: ► Object
❌ Error response data.message: undefined
❌ Error response data.error: Internal Server Error
```

### **Response mong muốn (✅ ĐÚNG):**

**Trường hợp 1: Gói còn hạn (Success)**
```json
{
  "success": true,
  "message": "Kiểm tra gói dịch vụ thành công",
  "data": {
    "valid": true,
    "packageName": "Premium",
    "expiryDate": "2025-12-31",
    "sellerId": 123,
    "message": "Gói dịch vụ còn hạn"
  }
}
```
**Status Code:** `200 OK` ✅

**Trường hợp 2: Gói hết hạn**
```json
{
  "success": false,
  "message": "Gói dịch vụ đã hết hạn",
  "error": "PACKAGE_EXPIRED",
  "data": {
    "valid": false,
    "packageName": "Premium",
    "expiryDate": "2024-01-01",
    "sellerId": 123
  }
}
```
**Status Code:** `403 Forbidden` ✅

**Trường hợp 3: Seller chưa mua gói**
```json
{
  "success": false,
  "message": "Seller chưa mua gói dịch vụ",
  "error": "NO_PACKAGE",
  "data": {
    "valid": false,
    "packageName": null,
    "expiryDate": null,
    "sellerId": 123
  }
}
```
**Status Code:** `200 OK` (hoặc `404 Not Found`) ✅

**Trường hợp 4: Seller không tồn tại**
```json
{
  "success": false,
  "message": "Không tìm thấy seller với username: abc123",
  "error": "SELLER_NOT_FOUND",
  "data": {
    "valid": false,
    "packageName": null,
    "expiryDate": null,
    "sellerId": null
  }
}
```
**Status Code:** `404 Not Found` ✅

---

## 📊 IMPACT

### **Các tính năng bị ảnh hưởng:**
1. ❌ Seller không thể vào trang `/seller/create-post` (Đăng tin)
2. ❌ Seller không thể vào trang `/seller/manage-posts` (Quản lý tin đăng)
3. ❌ Frontend không thể phân biệt:
   - Seller hết gói (cần mua thêm)
   - Seller có lỗi server (cần báo admin)
4. ❌ User experience kém: Luôn thấy "Lỗi kiểm tra gói dịch vụ"

### **User Flow bị block:**
```
1. User đăng nhập với tài khoản Seller ✅
2. Click nút "ĐĂNG TIN" ✅
3. Frontend gọi API check-service-package-validity
   → Backend crash → 500 ❌
4. Frontend hiển thị: "Lỗi kiểm tra gói dịch vụ" ❌
5. User không thể tiếp tục ❌
```

---

## 🔧 YÊU CẦU FIX

### **File cần sửa:**
`src/main/java/com/electric_titans/electricvehicleapp/controller/SellerController.java`

### **Cần làm:**

#### **1. Fix method `getProfile()`**
- ✅ Thêm try-catch để handle `NotFoundException`
- ✅ Trả về **404** khi seller không tồn tại (thay vì 500)
- ✅ Trả về **401** nếu user chưa đăng nhập

#### **2. Fix method `checkServicePackageValidity()`**
- ✅ Thêm try-catch toàn bộ method
- ✅ Trả về **200** với `valid: true/false` thay vì crash
- ✅ Trả về **404** nếu seller không tồn tại
- ✅ Trả về **403** nếu gói hết hạn (optional)

### **Code mẫu:**

```java
@GetMapping("/profile")
public ResponseEntity<?> getProfile() {
    try {
        Seller seller = sellerService.getCurrentUser();
        return ResponseEntity.ok(
            ApiResponse.builder()
                .success(true)
                .message("Lấy thông tin seller thành công")
                .data(seller)
                .build()
        );
    } catch (NotFoundException e) {
        // User chưa đăng ký seller
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiResponse.builder()
                .success(false)
                .message(e.getMessage())
                .error("SELLER_NOT_FOUND")
                .build()
        );
    } catch (Exception e) {
        // Lỗi server thật sự
        return ResponseEntity.internalServerError().body(
            ApiResponse.builder()
                .success(false)
                .message("Lỗi server: " + e.getMessage())
                .error("INTERNAL_SERVER_ERROR")
                .build()
        );
    }
}

@PostMapping("/{username}/check-service-package-validity")
public ResponseEntity<ApiResponse<SubscriptionResponse>> checkServicePackageValidity(
    @PathVariable String username
) {
    try {
        SubscriptionResponse result = sellerService.checkServicePackageValidity(username);
        
        return ResponseEntity.ok(
            ApiResponse.<SubscriptionResponse>builder()
                .success(true)
                .message("Kiểm tra gói dịch vụ thành công")
                .data(result)
                .build()
        );
        
    } catch (NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiResponse.<SubscriptionResponse>builder()
                .success(false)
                .message(e.getMessage())
                .error("NOT_FOUND")
                .data(SubscriptionResponse.builder()
                    .valid(false)
                    .packageName(null)
                    .expiryDate(null)
                    .sellerId(null)
                    .build())
                .build()
        );
        
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body(
            ApiResponse.<SubscriptionResponse>builder()
                .success(false)
                .message("Lỗi server: " + e.getMessage())
                .error("INTERNAL_SERVER_ERROR")
                .data(SubscriptionResponse.builder()
                    .valid(false)
                    .build())
                .build()
        );
    }
}
```

---

## 🧪 TEST CASES

### **Test Case 1: Seller có gói còn hạn**
```sql
-- Kiểm tra DB
SELECT s.seller_id, s.username, s.status, 
       sp.package_name, sp.expiry_date
FROM seller s
LEFT JOIN service_package sp ON s.active_package_id = sp.package_id
WHERE s.username = 'doanvien';

-- Expected: expiry_date > NOW()
```

**API Test:**
```bash
curl -X POST http://localhost:8080/api/v1/seller/doanvien/check-service-package-validity \
  -H "Authorization: Bearer <token>"
```

**Expected Response:**
- Status: `200 OK`
- Body: `{ "success": true, "data": { "valid": true, ... } }`

---

### **Test Case 2: User chưa đăng ký seller**
```bash
curl -X GET http://localhost:8080/api/v1/seller/profile \
  -H "Authorization: Bearer <buyer_token>"
```

**Expected Response:**
- Status: `404 Not Found` ✅ (KHÔNG PHẢI 500!)
- Body: `{ "success": false, "error": "SELLER_NOT_FOUND", ... }`

---

### **Test Case 3: Seller hết gói**
```sql
-- Tạo seller với gói hết hạn
UPDATE service_package 
SET expiry_date = '2024-01-01' 
WHERE seller_id = 123;
```

**API Test:**
```bash
curl -X POST http://localhost:8080/api/v1/seller/testuser/check-service-package-validity
```

**Expected Response:**
- Status: `200 OK` hoặc `403 Forbidden`
- Body: `{ "success": false, "data": { "valid": false, ... } }`

---

## 📸 SCREENSHOT CONSOLE LOGS

```
Console (Browser DevTools):

=== [ServicePackageGuard] ERROR Debug ===
❌ API Error [500] /api/v1/seller/doanvien/check-service-package-validity → 500
❌ Error message: Request failed with status code 500
❌ Error response data.error: Internal Server Error
==============================================

=== User Impact ===
🔴 Hiển thị: "Lỗi kiểm tra gói dịch vụ"
🔴 Button "Thử lại" → Click → Vẫn lỗi 500
🔴 User không thể đăng tin
```

---

## 🚨 PRIORITY

**Mức độ:** 🔴 **HIGH - BLOCKER**

**Lý do:**
- Chặn hoàn toàn tính năng Seller (core feature)
- Ảnh hưởng tất cả sellers
- Không có workaround khả thi
- Cần fix ngay để demo/release

**Thời gian mong muốn:** ⏰ **Trong 24h**

---

## 📝 CHECKLIST

Backend team cần hoàn thành:
- [ ] Fix `SellerController.getProfile()` - Thêm try-catch xử lý 404
- [ ] Fix `SellerController.checkServicePackageValidity()` - Thêm try-catch xử lý exception
- [ ] Test API với Postman/curl
- [ ] Test với seller có gói còn hạn → Phải trả về 200 + valid: true
- [ ] Test với seller chưa đăng ký → Phải trả về 404 (không phải 500)
- [ ] Test với seller hết gói → Phải trả về 200/403 + valid: false
- [ ] Thông báo Frontend team khi fix xong để retest

---

## 📞 LIÊN HỆ

**Frontend Team:**
- Đã tạm thời disable `ServicePackageGuard` để có thể test các tính năng khác
- Sẽ enable lại sau khi backend fix xong
- Sẵn sàng hỗ trợ test integration

**Tài liệu tham khảo:**
- Chi tiết kỹ thuật: `BACKEND_FIX_SELLER_APIS.md`
- Frontend code: `src/components/ServicePackageGuard/ServicePackageGuard.jsx`

---

**Cảm ơn Backend team! 🙏**

