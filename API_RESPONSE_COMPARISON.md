# 📊 SO SÁNH RESPONSE - HIỆN TẠI vs MONG MUỐN

## API 1: `GET /api/v1/seller/profile`

### Scenario: User chưa đăng ký seller

#### ❌ **HIỆN TẠI (SAI):**
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "success": false,
  "message": "Lỗi lấy thông tin seller: NullPointerException...",
  "timestamp": "2025-10-28T10:30:00"
}
```

#### ✅ **MONG MUỐN (ĐÚNG):**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "success": false,
  "message": "Không tìm thấy thông tin seller. Vui lòng đăng ký làm seller trước.",
  "error": "SELLER_NOT_FOUND"
}
```

---

## API 2: `POST /api/v1/seller/doanvien/check-service-package-validity`

### Scenario 1: Seller có gói còn hạn (DB: expiry_date = 2025-12-31)

#### ❌ **HIỆN TẠI (SAI):**
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "success": false,
  "message": "undefined",
  "error": "Internal Server Error"
}
```

#### ✅ **MONG MUỐN (ĐÚNG):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

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

---

### Scenario 2: Seller hết gói (DB: expiry_date = 2024-01-01)

#### ❌ **HIỆN TẠI (SAI):**
```http
HTTP/1.1 500 Internal Server Error

{ "error": "Internal Server Error" }
```

#### ✅ **MONG MUỐN (ĐÚNG):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

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

---

### Scenario 3: Seller chưa mua gói

#### ✅ **MONG MUỐN:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

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

---

### Scenario 4: Seller không tồn tại

#### ✅ **MONG MUỐN:**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

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

---

## 📋 BẢNG HTTP STATUS CODES

| Tình huống | Status Code Hiện tại | Status Code Đúng |
|------------|---------------------|------------------|
| ✅ Seller có gói còn hạn | ❌ 500 | ✅ 200 OK |
| ⚠️ Seller hết gói | ❌ 500 | ✅ 200 OK hoặc 403 Forbidden |
| ⚠️ Seller chưa mua gói | ❌ 500 | ✅ 200 OK |
| ⚠️ Seller không tồn tại | ❌ 500 | ✅ 404 Not Found |
| ⚠️ User chưa đăng ký seller | ❌ 500 | ✅ 404 Not Found |
| ⚠️ Token không hợp lệ | - | ✅ 401 Unauthorized |

---

## 🎯 NGUYÊN TẮC RESPONSE

### ✅ **Status 200 OK:**
- Có hoặc không có data đều được
- `success: true` → Có data
- `success: false` + có data → Business logic error (VD: hết gói)

### ✅ **Status 404 Not Found:**
- Resource không tồn tại (seller, package)
- `success: false` + error code

### ✅ **Status 403 Forbidden:**
- Resource tồn tại nhưng không được phép access
- VD: Gói hết hạn, không được phép đăng tin

### ❌ **Status 500 Internal Server Error:**
- **CHỈ dùng** khi có lỗi server thật sự
- Database down, NullPointerException không được handle, etc.
- **KHÔNG dùng** cho business logic (seller không tồn tại, gói hết hạn)

---

## 🔑 KEY TAKEAWAY

**Hiện tại:** Backend throw exception → Không catch → Crash → 500 ❌

**Cần làm:** Backend throw exception → Catch đúng loại → Return đúng status code ✅

```java
// ❌ SAI
public ResponseEntity<?> getProfile() {
    Seller seller = sellerRepository.findByUsername(username).get(); // Crash nếu không tồn tại!
    return ResponseEntity.ok(seller);
}

// ✅ ĐÚNG
public ResponseEntity<?> getProfile() {
    try {
        Seller seller = sellerRepository.findByUsername(username)
            .orElseThrow(() -> new NotFoundException("Seller not found"));
        return ResponseEntity.ok(seller);
    } catch (NotFoundException e) {
        return ResponseEntity.status(404).body(error(e.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.status(500).body(error("Server error"));
    }
}
```

---

**Frontend đang chờ backend fix để enable lại tính năng Seller! 🚀**

