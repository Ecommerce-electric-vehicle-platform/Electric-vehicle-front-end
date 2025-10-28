# 🔥 BACKEND CRITICAL BUGS - TỔNG HỢP

## ⚠️ **TÌNH HÌNH HIỆN TẠI**

Backend có **MẪU LỖI NGHIÊM TRỌNG** lặp lại ở nhiều APIs:
- ❌ APIs crash thay vì trả về error message đúng
- ❌ Trả về 500 Internal Server Error cho mọi lỗi
- ❌ Không handle NotFoundException, UnauthorizedException properly
- ❌ User không biết lỗi do đâu (thiếu seller profile? chưa approve? không có package?)

---

## 🔴 **DANH SÁCH APIs BỊ LỖI 500**

### **1. GET `/api/v1/seller/profile`**

**Hiện tượng:**
```json
{
  "timestamp": "2025-10-28T16:09:10.218+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/api/v1/seller/profile"
}
```

**Nguyên nhân:**
```java
// ❌ CODE HIỆN TẠI
@GetMapping("/profile")
public ResponseEntity<?> getSellerProfile() {
    Long buyerId = getCurrentUserId();
    
    // Nếu không tìm thấy seller → crash
    Seller seller = sellerRepository.findByBuyerId(buyerId)
        .orElseThrow(() -> new RuntimeException("Not found")); // ← CRASH!
    
    return ResponseEntity.ok(seller);
}
```

**Cần sửa thành:**
```java
@GetMapping("/profile")
public ResponseEntity<?> getSellerProfile() {
    try {
        Long buyerId = getCurrentUserId();
        
        Seller seller = sellerRepository.findByBuyerId(buyerId)
            .orElseThrow(() -> new NotFoundException("Seller profile not found"));
        
        return ResponseEntity.ok(ApiResponse.success(seller));
        
    } catch (NotFoundException e) {
        return ResponseEntity.status(404).body(
            ApiResponse.error(e.getMessage())
        );
    } catch (Exception e) {
        log.error("Error getting seller profile", e);
        return ResponseEntity.status(500).body(
            ApiResponse.error("Internal error: " + e.getMessage())
        );
    }
}
```

---

### **2. POST `/api/v1/seller/{username}/check-service-package-validity`**

**Hiện tượng:**
```json
{
  "timestamp": "2025-10-28T16:09:10.218+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/api/v1/seller/doanvien/check-service-package-validity"
}
```

**Nguyên nhân:**
```java
// ❌ CODE HIỆN TẠI
@PostMapping("/{username}/check-service-package-validity")
public ResponseEntity<?> checkPackageValidity(@PathVariable String username) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("Not found")); // ← CRASH!
    
    Seller seller = sellerRepository.findByBuyerId(user.getId())
        .orElseThrow(() -> new RuntimeException("Not found")); // ← CRASH!
    
    // Logic check package...
}
```

**Cần sửa thành:**
```java
@PostMapping("/{username}/check-service-package-validity")
public ResponseEntity<?> checkPackageValidity(@PathVariable String username) {
    try {
        // 1. Find user
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new NotFoundException("User not found: " + username));
        
        // 2. Find seller
        Seller seller = sellerRepository.findByBuyerId(user.getId())
            .orElseThrow(() -> new NotFoundException("Seller not found for user: " + username));
        
        // 3. Check seller status
        if (!"ACCEPTED".equals(seller.getStatus())) {
            return ResponseEntity.status(403).body(
                ApiResponse.error("Seller not approved. Status: " + seller.getStatus())
            );
        }
        
        // 4. Check active package
        Optional<PackageSubscription> activePackage = 
            packageSubscriptionRepository.findActiveBySellerId(seller.getId());
        
        Map<String, Object> result = new HashMap<>();
        result.put("valid", activePackage.isPresent());
        result.put("hasValidPackage", activePackage.isPresent());
        result.put("sellerId", seller.getId());
        
        if (activePackage.isPresent()) {
            PackageSubscription pkg = activePackage.get();
            result.put("packageId", pkg.getPackageId());
            result.put("packageName", pkg.getPackageName());
            result.put("expiryDate", pkg.getEndDate());
        }
        
        return ResponseEntity.ok(ApiResponse.success(result));
        
    } catch (NotFoundException e) {
        return ResponseEntity.status(404).body(
            ApiResponse.error(e.getMessage())
        );
    } catch (Exception e) {
        log.error("Error checking package validity", e);
        return ResponseEntity.status(500).body(
            ApiResponse.error("Internal error: " + e.getMessage())
        );
    }
}
```

---

### **3. POST `/api/v1/auth/signin-google`**

**Vấn đề:** Không cập nhật role khi user đã được approve seller

**Hiện tượng:**
- User được approve seller → `seller.status = "ACCEPTED"`
- Login lại bằng Google → `user.role` vẫn là `"ROLE_BUYER"`
- JWT token chứa role cũ → Frontend không có quyền seller

**Cần sửa:**
```java
@PostMapping("/signin-google")
public ResponseEntity<?> googleSignin(@RequestBody GoogleSigninRequest request) {
    User user = findOrCreateUserFromGoogle(request.getIdToken());
    
    // ✅ THÊM: Check seller status và update role
    Optional<Seller> seller = sellerRepository.findByBuyerId(user.getId());
    if (seller.isPresent() && 
        "ACCEPTED".equals(seller.get().getStatus()) && 
        !"ROLE_SELLER".equals(user.getRole())) {
        
        user.setRole("ROLE_SELLER");
        userRepository.save(user);
        log.info("✅ Role updated to SELLER for user: {}", user.getId());
    }
    
    // Generate JWT với role mới
    String token = jwtService.generateToken(user);
    
    return ResponseEntity.ok(LoginResponse.builder()
        .accessToken(token)
        .role(user.getRole()) // ← ROLE ĐÚNG
        .buyerId(user.getId())
        .sellerId(seller.isPresent() ? seller.get().getId() : null)
        .build());
}
```

---

## 🎯 **PATTERN CHUNG CẦN SỬA**

### **Vấn đề:**
```java
// ❌ SAI: Throw RuntimeException → crash → 500 error
Entity entity = repository.findById(id)
    .orElseThrow(() -> new RuntimeException("Not found"));
```

### **Giải pháp:**
```java
// ✅ ĐÚNG: Try-catch với từng loại exception
try {
    Entity entity = repository.findById(id)
        .orElseThrow(() -> new NotFoundException("Entity not found"));
    
    // Business logic...
    
    return ResponseEntity.ok(ApiResponse.success(result));
    
} catch (NotFoundException e) {
    // 404 - Resource not found
    return ResponseEntity.status(404).body(
        ApiResponse.error(e.getMessage())
    );
    
} catch (UnauthorizedException e) {
    // 401 - Not authenticated
    return ResponseEntity.status(401).body(
        ApiResponse.error(e.getMessage())
    );
    
} catch (ForbiddenException e) {
    // 403 - Not authorized
    return ResponseEntity.status(403).body(
        ApiResponse.error(e.getMessage())
    );
    
} catch (Exception e) {
    // 500 - Internal error (log chi tiết)
    log.error("Unexpected error in API", e);
    return ResponseEntity.status(500).body(
        ApiResponse.error("Internal error: " + e.getMessage())
    );
}
```

---

## 📋 **CHECKLIST SỬA NGAY**

### **File: SellerController.java**
- [ ] Sửa `getSellerProfile()` → trả về 404 nếu không tìm thấy
- [ ] Sửa `checkServicePackageValidity()` → trả về 404/403 với message rõ ràng
- [ ] Thêm try-catch cho TẤT CẢ methods

### **File: AuthController.java**
- [ ] Sửa `googleSignin()` → check seller status & update role
- [ ] Sửa `signin()` → check seller status & update role
- [ ] Thêm `buyerId`, `sellerId` vào LoginResponse

### **File: AdminService.java hoặc SellerService.java**
- [ ] Sửa `approveSeller()` → update `user.role = "ROLE_SELLER"`

### **File: LoginResponse.java**
- [ ] Thêm field `buyerId`
- [ ] Thêm field `sellerId`

---

## 🧪 **TEST CASES SAU KHI SỬA**

### **Test 1: GET /api/v1/seller/profile**

**Case 1.1: User chưa submit KYC**
```bash
GET /api/v1/seller/profile
Authorization: Bearer <buyer_token>

# Expected:
Status: 404
{
  "success": false,
  "error": "Seller profile not found"
}
```

**Case 1.2: User đã submit KYC & approved**
```bash
GET /api/v1/seller/profile
Authorization: Bearer <seller_token>

# Expected:
Status: 200
{
  "success": true,
  "data": {
    "id": 456,
    "buyerId": 123,
    "storeName": "My Store",
    "status": "ACCEPTED",
    ...
  }
}
```

---

### **Test 2: POST /api/v1/seller/{username}/check-service-package-validity**

**Case 2.1: User không tồn tại**
```bash
POST /api/v1/seller/nonexistent/check-service-package-validity

# Expected:
Status: 404
{
  "success": false,
  "error": "User not found: nonexistent"
}
```

**Case 2.2: User chưa submit KYC**
```bash
POST /api/v1/seller/buyer1/check-service-package-validity

# Expected:
Status: 404
{
  "success": false,
  "error": "Seller not found for user: buyer1"
}
```

**Case 2.3: Seller chưa được approve**
```bash
POST /api/v1/seller/pending_seller/check-service-package-validity

# Expected:
Status: 403
{
  "success": false,
  "error": "Seller not approved. Status: PENDING"
}
```

**Case 2.4: Seller approved nhưng chưa mua gói**
```bash
POST /api/v1/seller/approved_seller/check-service-package-validity

# Expected:
Status: 200
{
  "success": true,
  "data": {
    "valid": false,
    "hasValidPackage": false,
    "sellerId": 456
  }
}
```

**Case 2.5: Seller có gói hợp lệ**
```bash
POST /api/v1/seller/active_seller/check-service-package-validity

# Expected:
Status: 200
{
  "success": true,
  "data": {
    "valid": true,
    "hasValidPackage": true,
    "sellerId": 456,
    "packageId": 1,
    "packageName": "Premium Package",
    "expiryDate": "2025-12-31T23:59:59"
  }
}
```

---

### **Test 3: POST /api/v1/auth/signin-google**

**Case 3.1: Google login - seller đã approved**
```bash
# Setup:
# 1. User đã submit KYC
# 2. Admin approved → seller.status = "ACCEPTED"
# 3. User login lại

POST /api/v1/auth/signin-google
{
  "idToken": "google_token"
}

# Expected:
Status: 200
{
  "success": true,
  "data": {
    "accessToken": "...",
    "role": "ROLE_SELLER", // ✅ PHẢI LÀ SELLER
    "buyerId": 123,
    "sellerId": 456
  }
}

# Verify trong database:
SELECT role FROM users WHERE id = 123;
# Expected: ROLE_SELLER
```

---

## 🔍 **CÁC VẤN ĐỀ PHỤ KHÁC**

### **Vấn đề 1: Không có Custom Exception Classes**

Backend nên tạo các exception classes:

```java
// NotFoundException.java
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}

// UnauthorizedException.java
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}

// ForbiddenException.java
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}

// BadRequestException.java
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
```

### **Vấn đề 2: Không có Global Exception Handler**

Backend nên có `@ControllerAdvice`:

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFoundException(NotFoundException e) {
        return ResponseEntity.status(404).body(
            ApiResponse.error(e.getMessage())
        );
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<?> handleUnauthorizedException(UnauthorizedException e) {
        return ResponseEntity.status(401).body(
            ApiResponse.error(e.getMessage())
        );
    }
    
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<?> handleForbiddenException(ForbiddenException e) {
        return ResponseEntity.status(403).body(
            ApiResponse.error(e.getMessage())
        );
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception e) {
        log.error("Unhandled exception", e);
        return ResponseEntity.status(500).body(
            ApiResponse.error("Internal server error: " + e.getMessage())
        );
    }
}
```

---

## 📊 **TỔNG HỢP ƯU TIÊN**

| # | Vấn đề | Ảnh hưởng | Ưu tiên | Thời gian ước tính |
|---|--------|-----------|---------|---------------------|
| 1 | `GET /seller/profile` crash | User không vào được seller features | 🔴 Critical | 30 phút |
| 2 | `POST /seller/{username}/check-service-package-validity` crash | User bị block khi vào seller pages | 🔴 Critical | 1 giờ |
| 3 | Google login không update role | Seller không có quyền sau khi approve | 🔴 Critical | 1 giờ |
| 4 | Thiếu buyerId, sellerId trong LoginResponse | Frontend thiếu info để call API | ⚠️ Important | 30 phút |
| 5 | Không có Global Exception Handler | Tất cả lỗi đều trả về 500 | ⚠️ Important | 2 giờ |
| 6 | Không có Custom Exception Classes | Khó phân biệt loại lỗi | 🟡 Nice to have | 1 giờ |

**Tổng thời gian:** ~6 giờ

---

## 🎯 **KẾ HOẠCH HÀNH ĐỘNG**

### **Phase 1: FIX CRITICAL (Làm ngay - 2.5 giờ)**
1. ✅ Sửa `getSellerProfile()` 
2. ✅ Sửa `checkServicePackageValidity()`
3. ✅ Sửa Google login update role
4. ✅ Sửa admin approve seller update role

### **Phase 2: IMPROVE (Trong tuần - 2.5 giờ)**
5. ✅ Thêm buyerId, sellerId vào LoginResponse
6. ✅ Tạo Custom Exception Classes
7. ✅ Tạo Global Exception Handler

### **Phase 3: TEST (Cuối tuần - 1 giờ)**
8. ✅ Test tất cả cases
9. ✅ Verify database consistency
10. ✅ Check logs

---

## 💡 **LỜI KHUYÊN**

1. **Không được throw RuntimeException** trong controller methods
2. **Luôn dùng try-catch** cho mọi API endpoints
3. **Log chi tiết** mọi exceptions (với stack trace)
4. **Trả về error message có ý nghĩa** (không chỉ "Internal error")
5. **Dùng đúng HTTP status codes:**
   - 200: Success
   - 400: Bad request (client lỗi)
   - 401: Unauthorized (chưa login)
   - 403: Forbidden (không có quyền)
   - 404: Not found
   - 500: Internal server error (backend lỗi)

---

## 📧 **LIÊN HỆ**

Nếu cần giải thích thêm về bất kỳ vấn đề nào, vui lòng liên hệ Frontend Team.

**Tài liệu chi tiết:** 
- `BACKEND_LOGIN_FIX_DETAILED.md` - Chi tiết sửa login system
- `BACKEND_CRITICAL_BUGS_SUMMARY.md` - Tổng hợp bugs (file này)

