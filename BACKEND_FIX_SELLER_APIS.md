# 🔧 Backend Fix: Seller APIs Returning 500 Error

## 🚨 **Vấn đề**

2 APIs của Seller đang **crash và trả về 500 Internal Server Error**:

1. ❌ `GET /api/v1/seller/profile` → 500
2. ❌ `POST /api/v1/seller/{username}/check-service-package-validity` → 500

**Impact:**
- Frontend không thể kiểm tra seller status
- Frontend không thể kiểm tra gói dịch vụ còn hạn
- Seller không thể vào trang "Đăng tin"

---

## ✅ **GIẢI PHÁP CHI TIẾT**

### **File cần sửa:** `src/main/java/com/electric_titans/electricvehicleapp/controller/SellerController.java`

---

### **FIX 1: API `GET /api/v1/seller/profile`**

#### **❌ CODE HIỆN TẠI (Lỗi):**

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
    } catch (Exception e) {
        // ❌ LỖI: Luôn trả về 500, không phân biệt loại lỗi
        return ResponseEntity.internalServerError().body(
            ApiResponse.builder()
                .success(false)
                .message("Lỗi lấy thông tin seller: " + e.getMessage())
                .build()
        );
    }
}
```

**Vấn đề:**
- Nếu user chưa đăng ký seller (chưa có record trong DB) → nên trả **404 Not Found**
- Nếu user chưa đăng nhập → nên trả **401 Unauthorized**
- Chỉ lỗi server thật sự mới trả **500**

---

#### **✅ CODE ĐÃ SỬA (Đúng):**

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
        // ✅ User chưa đăng ký seller
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiResponse.builder()
                .success(false)
                .message(e.getMessage())
                .error("SELLER_NOT_FOUND")
                .build()
        );
    } catch (UnauthorizedException e) {
        // ✅ User chưa đăng nhập
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            ApiResponse.builder()
                .success(false)
                .message(e.getMessage())
                .error("UNAUTHORIZED")
                .build()
        );
    } catch (Exception e) {
        // ✅ Lỗi server thật sự
        return ResponseEntity.internalServerError().body(
            ApiResponse.builder()
                .success(false)
                .message("Lỗi server: " + e.getMessage())
                .error("INTERNAL_SERVER_ERROR")
                .build()
        );
    }
}
```

---

### **FIX 2: API `POST /api/v1/seller/{username}/check-service-package-validity`**

#### **❌ CODE HIỆN TẠI (Lỗi):**

```java
@PostMapping("/{username}/check-service-package-validity")
public ResponseEntity<ApiResponse<SubscriptionResponse>> checkServicePackageValidity(
    @PathVariable String username
) throws Exception {
    // ❌ LỖI: Không có try-catch, crash khi có lỗi
    SubscriptionResponse result = sellerService.checkServicePackageValidity(username);
    
    ApiResponse<SubscriptionResponse> response = ApiResponse.<SubscriptionResponse>builder()
        .success(true)
        .message("Kiểm tra gói dịch vụ thành công")
        .data(result)
        .build();

    return ResponseEntity.status(HttpStatus.OK.value()).body(response);
}
```

**Vấn đề:**
- Nếu seller không tồn tại → crash → 500
- Nếu seller chưa mua gói → crash → 500
- Nếu gói hết hạn → crash → 500

---

#### **✅ CODE ĐÃ SỬA (Đúng):**

```java
@PostMapping("/{username}/check-service-package-validity")
public ResponseEntity<ApiResponse<SubscriptionResponse>> checkServicePackageValidity(
    @PathVariable String username
) {
    try {
        SubscriptionResponse result = sellerService.checkServicePackageValidity(username);
        
        ApiResponse<SubscriptionResponse> response = ApiResponse.<SubscriptionResponse>builder()
            .success(true)
            .message("Kiểm tra gói dịch vụ thành công")
            .data(result)
            .build();

        return ResponseEntity.ok(response);
        
    } catch (NotFoundException e) {
        // ✅ Seller hoặc gói không tồn tại
        ApiResponse<SubscriptionResponse> response = ApiResponse.<SubscriptionResponse>builder()
            .success(false)
            .message(e.getMessage())
            .error("NOT_FOUND")
            .data(SubscriptionResponse.builder()
                .valid(false)
                .packageName(null)
                .expiryDate(null)
                .sellerId(null)
                .build())
            .build();
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        
    } catch (ForbiddenException e) {
        // ✅ Gói hết hạn hoặc không hợp lệ
        ApiResponse<SubscriptionResponse> response = ApiResponse.<SubscriptionResponse>builder()
            .success(false)
            .message(e.getMessage())
            .error("PACKAGE_EXPIRED")
            .data(SubscriptionResponse.builder()
                .valid(false)
                .packageName(null)
                .expiryDate(null)
                .sellerId(null)
                .build())
            .build();
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        
    } catch (Exception e) {
        // ✅ Lỗi server thật sự
        ApiResponse<SubscriptionResponse> response = ApiResponse.<SubscriptionResponse>builder()
            .success(false)
            .message("Lỗi server: " + e.getMessage())
            .error("INTERNAL_SERVER_ERROR")
            .data(SubscriptionResponse.builder()
                .valid(false)
                .packageName(null)
                .expiryDate(null)
                .sellerId(null)
                .build())
            .build();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
```

---

### **FIX 3: Service Layer - `SellerService.java`**

Đảm bảo service throw đúng exception:

```java
public Seller getCurrentUser() {
    // Lấy username từ SecurityContext
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    
    if (authentication == null || !authentication.isAuthenticated()) {
        throw new UnauthorizedException("Bạn chưa đăng nhập");
    }
    
    String username = authentication.getName();
    
    // Tìm seller trong DB
    Seller seller = sellerRepository.findByUsername(username)
        .orElseThrow(() -> new NotFoundException(
            "Không tìm thấy thông tin seller. Vui lòng đăng ký làm seller trước."
        ));
    
    return seller;
}

public SubscriptionResponse checkServicePackageValidity(String username) {
    // Tìm seller
    Seller seller = sellerRepository.findByUsername(username)
        .orElseThrow(() -> new NotFoundException("Không tìm thấy seller với username: " + username));
    
    // Kiểm tra có gói không
    if (seller.getActiveServicePackage() == null) {
        return SubscriptionResponse.builder()
            .valid(false)
            .packageName(null)
            .expiryDate(null)
            .sellerId(seller.getSellerId())
            .message("Seller chưa mua gói dịch vụ")
            .build();
    }
    
    // Kiểm tra gói còn hạn không
    ServicePackage pkg = seller.getActiveServicePackage();
    LocalDate expiryDate = pkg.getExpiryDate();
    boolean isValid = expiryDate != null && expiryDate.isAfter(LocalDate.now());
    
    return SubscriptionResponse.builder()
        .valid(isValid)
        .packageName(pkg.getPackageName())
        .expiryDate(expiryDate)
        .sellerId(seller.getSellerId())
        .message(isValid ? "Gói dịch vụ còn hạn" : "Gói dịch vụ đã hết hạn")
        .build();
}
```

---

### **FIX 4: Exception Classes**

Tạo các exception classes nếu chưa có:

#### **`NotFoundException.java`**

```java
package com.electric_titans.electricvehicleapp.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
```

#### **`UnauthorizedException.java`**

```java
package com.electric_titans.electricvehicleapp.exception;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
```

#### **`ForbiddenException.java`**

```java
package com.electric_titans.electricvehicleapp.exception;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
```

---

## 📊 **Bảng HTTP Status Codes Đúng**

| Trường hợp | HTTP Status | Message | Error Code |
|------------|-------------|---------|------------|
| ✅ Success | **200 OK** | "Kiểm tra gói dịch vụ thành công" | - |
| ⚠️ User chưa đăng nhập | **401 Unauthorized** | "Bạn chưa đăng nhập" | `UNAUTHORIZED` |
| ⚠️ Gói hết hạn | **403 Forbidden** | "Gói dịch vụ đã hết hạn" | `PACKAGE_EXPIRED` |
| ⚠️ Seller không tồn tại | **404 Not Found** | "Không tìm thấy seller" | `NOT_FOUND` |
| ❌ Lỗi server | **500 Internal Server Error** | "Lỗi server: ..." | `INTERNAL_SERVER_ERROR` |

---

## 🧪 **Test Cases**

### **Test 1: Seller có gói còn hạn**

**Request:**
```http
POST /api/v1/seller/doanvien/check-service-package-validity
Authorization: Bearer <valid_token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Kiểm tra gói dịch vụ thành công",
  "data": {
    "valid": true,
    "packageName": "Premium",
    "expiryDate": "2025-12-31",
    "sellerId": 123
  }
}
```
**Status:** `200 OK`

---

### **Test 2: Seller chưa đăng ký**

**Request:**
```http
GET /api/v1/seller/profile
Authorization: Bearer <buyer_token>
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Không tìm thấy thông tin seller. Vui lòng đăng ký làm seller trước.",
  "error": "SELLER_NOT_FOUND"
}
```
**Status:** `404 Not Found` ❌ **KHÔNG PHẢI 500!**

---

### **Test 3: Seller hết gói**

**Request:**
```http
POST /api/v1/seller/doanvien/check-service-package-validity
```

**Expected Response:**
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
**Status:** `403 Forbidden` ❌ **KHÔNG PHẢI 500!**

---

## 📝 **Checklist Fix Backend**

- [ ] **SellerController.java**
  - [ ] Fix `getProfile()` - Add try-catch for NotFoundException, UnauthorizedException
  - [ ] Fix `checkServicePackageValidity()` - Add comprehensive try-catch
  
- [ ] **SellerService.java**
  - [ ] Update `getCurrentUser()` - Throw NotFoundException nếu seller không tồn tại
  - [ ] Update `checkServicePackageValidity()` - Return proper SubscriptionResponse
  
- [ ] **Exception Classes**
  - [ ] Create `NotFoundException.java`
  - [ ] Create `UnauthorizedException.java`
  - [ ] Create `ForbiddenException.java`

- [ ] **Testing**
  - [ ] Test GET /seller/profile với buyer token → 404
  - [ ] Test GET /seller/profile với seller token → 200
  - [ ] Test check-service-package-validity với seller hết gói → 403
  - [ ] Test check-service-package-validity với seller còn gói → 200

---

## 🚀 **Sau khi fix xong**

1. ✅ Backend restart server
2. ✅ Frontend **UNCOMMENT** lại ServicePackageGuard trong:
   - `src/pages/Seller/CreatePost/CreatePost.jsx`
   - `src/pages/Seller/ManagePosts/ManagePosts.jsx`
3. ✅ Test lại toàn bộ flow:
   - Buyer login → Không thấy seller features
   - Seller login (có gói) → Vào được "Đăng tin"
   - Seller login (hết gói) → Thấy "Mua gói ngay"

---

**File này được tạo bởi AI Assistant để hướng dẫn backend team fix lỗi 500.**

**Date:** 2025-10-28

