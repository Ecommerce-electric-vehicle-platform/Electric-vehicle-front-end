# 🔧 BACKEND LOGIN SYSTEM - HƯỚNG DẪN SỬA CHI TIẾT

## 📋 TỔNG QUAN

Backend cần sửa **3 vấn đề chính** trong hệ thống login:
1. **Google Login** không cập nhật role khi user đã được approve seller
2. **API `/seller/profile`** trả về lỗi 500 thay vì 404
3. **Login Response** thiếu thông tin `buyerId`, `sellerId`

---

## 🔴 VẤN ĐỀ 1: GOOGLE LOGIN - ROLE KHÔNG ĐƯỢC CẬP NHẬT

### **Hiện trạng:**

```
User A đăng ký bằng Google → user.role = "ROLE_BUYER"
  ↓
Admin approve seller → seller.status = "ACCEPTED"
  ↓ (❌ THIẾU BƯỚC NÀY)
  user.role VẪN LÀ "ROLE_BUYER" trong database
  ↓
User A login lại bằng Google
  ↓
JWT token chứa role = "ROLE_BUYER" (SAI!)
  ↓
Frontend nhận role buyer → không truy cập được seller features
```

### **Nguyên nhân:**

1. **Khi approve seller**, code chỉ update `seller.status` mà không update `user.role`:
```java
// ❌ CODE HIỆN TẠI (SAI)
public void approveSeller(Long sellerId, String decision) {
    Seller seller = sellerRepository.findById(sellerId)
        .orElseThrow(() -> new NotFoundException("Seller not found"));
    
    seller.setStatus("ACCEPTED"); // ✅ Update seller
    sellerRepository.save(seller);
    
    // ❌ THIẾU: Không update user.role
    
    // Create notification...
}
```

2. **Khi Google login**, code không check seller status để update role:
```java
// ❌ CODE HIỆN TẠI (SAI)
@PostMapping("/api/v1/auth/signin-google")
public ResponseEntity<?> googleSignin(@RequestBody GoogleSigninRequest request) {
    // Verify Google token
    GoogleIdTokenPayload payload = verifyGoogleIdToken(request.getIdToken());
    
    // Find or create user
    User user = findOrCreateUserFromGoogle(payload);
    
    // ❌ THIẾU: Không check seller status
    
    // Generate JWT with OLD ROLE
    String accessToken = jwtService.generateToken(user);
    
    return ResponseEntity.ok(new LoginResponse(
        accessToken,
        refreshToken,
        user.getUsername(),
        user.getEmail(),
        user.getRole() // ← ROLE CŨ (BUYER)
    ));
}
```

---

## ✅ GIẢI PHÁP 1: SỬA GOOGLE LOGIN

### **Bước 1: Sửa Admin Approve Seller**

**File:** `AdminService.java` hoặc `SellerService.java`

```java
@Service
public class SellerService {
    
    @Autowired
    private SellerRepository sellerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Approve seller application
     * ✅ PHẢI CẬP NHẬT CẢ seller.status VÀ user.role
     */
    @Transactional
    public void approveSeller(Long sellerId, String decision, String message) {
        // 1. Lấy seller record
        Seller seller = sellerRepository.findById(sellerId)
            .orElseThrow(() -> new NotFoundException("Seller not found with id: " + sellerId));
        
        // 2. Update seller status
        seller.setStatus("ACCEPTED");
        seller.setUpdatedAt(LocalDateTime.now());
        sellerRepository.save(seller);
        
        // ✅ 3. CẬP NHẬT ROLE CỦA USER (QUAN TRỌNG!)
        User user = userRepository.findById(seller.getBuyerId())
            .orElseThrow(() -> new NotFoundException("User not found with id: " + seller.getBuyerId()));
        
        user.setRole("ROLE_SELLER"); // ← CẬP NHẬT ROLE
        userRepository.save(user);
        
        log.info("✅ Seller approved: sellerId={}, userId={}, role updated to ROLE_SELLER", 
                 sellerId, user.getId());
        
        // 4. Tạo notification cho user
        notificationService.createNotification(
            user.getId(),
            "SELLER",
            "Yêu cầu nâng cấp Seller đã được phê duyệt ✅",
            "Chúc mừng! Yêu cầu nâng cấp lên Seller của bạn đã được phê duyệt. " +
            "Vui lòng mua gói Seller để kích hoạt tính năng đăng bán sản phẩm.",
            null
        );
    }
}
```

---

### **Bước 2: Sửa Google Login API**

**File:** `AuthController.java`

```java
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private SellerRepository sellerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtService jwtService;
    
    /**
     * Google Sign-in
     * ✅ KIỂM TRA SELLER STATUS VÀ CẬP NHẬT ROLE
     */
    @PostMapping("/signin-google")
    public ResponseEntity<?> googleSignin(@RequestBody GoogleSigninRequest request) {
        try {
            // 1. Verify Google ID Token
            GoogleIdTokenPayload payload = authService.verifyGoogleIdToken(request.getIdToken());
            if (payload == null) {
                return ResponseEntity.status(400).body(
                    ApiResponse.error("Invalid Google token")
                );
            }
            
            // 2. Find or create user from Google account
            User user = authService.findOrCreateUserFromGoogle(payload);
            
            // ✅ 3. KIỂM TRA SELLER STATUS VÀ CẬP NHẬT ROLE (QUAN TRỌNG!)
            Optional<Seller> sellerOpt = sellerRepository.findByBuyerId(user.getId());
            if (sellerOpt.isPresent()) {
                Seller seller = sellerOpt.get();
                
                // Nếu seller đã được approve nhưng role chưa update
                if ("ACCEPTED".equals(seller.getStatus()) && 
                    !"ROLE_SELLER".equals(user.getRole())) {
                    
                    log.info("🔄 Updating role for user {} from {} to ROLE_SELLER", 
                             user.getId(), user.getRole());
                    
                    user.setRole("ROLE_SELLER");
                    userRepository.save(user);
                    
                    log.info("✅ Role updated successfully for user {}", user.getId());
                }
            }
            
            // 4. Generate JWT tokens with UPDATED ROLE
            String accessToken = jwtService.generateToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);
            
            // 5. Build response
            LoginResponse response = LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole()) // ← ROLE MỚI NHẤT
                .buyerId(user.getId()) // ✅ THÊM
                .sellerId(sellerOpt.isPresent() ? sellerOpt.get().getId() : null) // ✅ THÊM
                .build();
            
            log.info("✅ Google login successful: user={}, role={}", 
                     user.getUsername(), user.getRole());
            
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (Exception e) {
            log.error("❌ Google login failed", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("Google login failed: " + e.getMessage())
            );
        }
    }
}
```

---

### **Bước 3: Sửa Normal Login (Username/Password)**

**File:** `AuthController.java`

```java
/**
 * Normal Sign-in (Username/Password)
 * ✅ ĐẢM BẢO TRẢ VỀ ROLE ĐÚNG
 */
@PostMapping("/signin")
public ResponseEntity<?> signin(@RequestBody @Valid SigninRequest request) {
    try {
        // 1. Authenticate user
        User user = authService.authenticate(request.getUsername(), request.getPassword());
        
        if (user == null) {
            return ResponseEntity.status(401).body(
                ApiResponse.error("Invalid username or password")
            );
        }
        
        // 2. Check seller status (similar to Google login)
        Optional<Seller> sellerOpt = sellerRepository.findByBuyerId(user.getId());
        if (sellerOpt.isPresent()) {
            Seller seller = sellerOpt.get();
            
            if ("ACCEPTED".equals(seller.getStatus()) && 
                !"ROLE_SELLER".equals(user.getRole())) {
                
                user.setRole("ROLE_SELLER");
                userRepository.save(user);
                log.info("✅ Role updated for user {} during normal login", user.getId());
            }
        }
        
        // 3. Generate tokens
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        
        // 4. Build response
        LoginResponse response = LoginResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole()) // ✅ BẮT BUỘC
            .buyerId(user.getId()) // ✅ THÊM
            .sellerId(sellerOpt.isPresent() ? sellerOpt.get().getId() : null) // ✅ THÊM
            .build();
        
        log.info("✅ Login successful: user={}, role={}", user.getUsername(), user.getRole());
        
        return ResponseEntity.ok(ApiResponse.success(response));
        
    } catch (Exception e) {
        log.error("❌ Login failed", e);
        return ResponseEntity.status(401).body(
            ApiResponse.error("Login failed: " + e.getMessage())
        );
    }
}
```

---

## 🔴 VẤN ĐỀ 2: API `/seller/profile` TRẢ VỀ 500

### **Hiện trạng:**

Frontend gọi `GET /api/v1/seller/profile` → Backend crash → Trả về **500 Internal Server Error**

### **Nguyên nhân:**

```java
// ❌ CODE HIỆN TẠI (SAI)
@GetMapping("/api/v1/seller/profile")
public ResponseEntity<?> getSellerProfile() {
    Long userId = getCurrentUserId();
    
    // Nếu không tìm thấy seller → throw exception → 500 error
    Seller seller = sellerRepository.findByBuyerId(userId)
        .orElseThrow(() -> new RuntimeException("Seller not found")); // ❌ CRASH
    
    return ResponseEntity.ok(seller);
}
```

---

## ✅ GIẢI PHÁP 2: SỬA SELLER PROFILE API

**File:** `SellerController.java`

```java
@RestController
@RequestMapping("/api/v1/seller")
public class SellerController {
    
    @Autowired
    private SellerRepository sellerRepository;
    
    /**
     * Get seller profile
     * ✅ TRẢ VỀ 404 THAY VÌ 500 KHI KHÔNG TÌM THẤY
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getSellerProfile() {
        try {
            // 1. Lấy user ID từ JWT token
            Long buyerId = getCurrentUserId();
            
            // 2. Tìm seller record
            Optional<Seller> sellerOpt = sellerRepository.findByBuyerId(buyerId);
            
            // ✅ 3. TRẢ VỀ 404 NẾU KHÔNG TÌM THẤY (KHÔNG CRASH)
            if (!sellerOpt.isPresent()) {
                log.warn("⚠️ Seller not found for buyerId: {}", buyerId);
                return ResponseEntity.status(404).body(
                    ApiResponse.error("Seller profile not found. Please submit KYC first.")
                );
            }
            
            Seller seller = sellerOpt.get();
            
            // 4. Build response với đầy đủ thông tin
            SellerProfileResponse response = SellerProfileResponse.builder()
                .id(seller.getId())
                .buyerId(seller.getBuyerId())
                .storeName(seller.getStoreName())
                .status(seller.getStatus())
                .taxNumber(seller.getTaxNumber())
                .createdAt(seller.getCreatedAt())
                .updatedAt(seller.getUpdatedAt())
                .build();
            
            log.info("✅ Seller profile retrieved: sellerId={}, status={}", 
                     seller.getId(), seller.getStatus());
            
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (Exception e) {
            // ✅ BẮT MỌI EXCEPTION VÀ TRẢ VỀ ERROR MESSAGE RÕ RÀNG
            log.error("❌ Error getting seller profile", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("Internal server error: " + e.getMessage())
            );
        }
    }
    
    /**
     * Helper method để lấy user ID từ JWT
     */
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();
            return userPrincipal.getId();
        }
        throw new UnauthorizedException("User not authenticated");
    }
}
```

---

## 🔴 VẤN ĐỀ 3: THIẾU BUYERID & SELLERID

### **Hiện trạng:**

Login response chỉ trả về:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "username": "john",
  "email": "john@example.com",
  "role": "ROLE_SELLER"
}
```

❌ Thiếu: `buyerId`, `sellerId` → Frontend không biết để gọi API

---

## ✅ GIẢI PHÁP 3: THÊM BUYERID & SELLERID

### **Bước 1: Update LoginResponse DTO**

**File:** `LoginResponse.java`

```java
package com.example.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String username;
    private String email;
    private String role; // ✅ BẮT BUỘC
    
    // ✅ THÊM MỚI
    private Long buyerId;     // ID của user (buyer)
    private Long sellerId;    // ID của seller (nếu là seller)
}
```

### **Bước 2: Update Login APIs để trả về buyerId & sellerId**

Đã có trong code ở **Giải pháp 1** phía trên:
```java
LoginResponse response = LoginResponse.builder()
    .accessToken(accessToken)
    .refreshToken(refreshToken)
    .username(user.getUsername())
    .email(user.getEmail())
    .role(user.getRole())
    .buyerId(user.getId()) // ✅ THÊM
    .sellerId(sellerOpt.isPresent() ? sellerOpt.get().getId() : null) // ✅ THÊM
    .build();
```

---

## 📊 TÓM TẮT THAY ĐỔI

### **Files cần sửa:**

| File | Thay đổi | Ưu tiên |
|------|----------|---------|
| `AdminService.java` hoặc `SellerService.java` | Thêm `user.setRole("ROLE_SELLER")` khi approve | 🔴 Critical |
| `AuthController.java` → `googleSignin()` | Check seller status & update role | 🔴 Critical |
| `AuthController.java` → `signin()` | Check seller status & update role | 🔴 Critical |
| `SellerController.java` → `getSellerProfile()` | Trả về 404 thay vì 500 | 🔴 Critical |
| `LoginResponse.java` | Thêm `buyerId`, `sellerId` | ⚠️ Important |

---

## 🧪 TEST CASES

### **Test 1: Normal Login - Buyer**
```bash
POST /api/v1/auth/signin
{
  "username": "buyer1",
  "password": "password123"
}

# Expected Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "username": "buyer1",
    "email": "buyer1@example.com",
    "role": "ROLE_BUYER",
    "buyerId": 123,
    "sellerId": null
  }
}
```

### **Test 2: Normal Login - Seller (đã được approve)**
```bash
POST /api/v1/auth/signin
{
  "username": "seller1",
  "password": "password123"
}

# Expected Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "username": "seller1",
    "email": "seller1@example.com",
    "role": "ROLE_SELLER", // ✅ ROLE ĐÚNG
    "buyerId": 123,
    "sellerId": 456
  }
}
```

### **Test 3: Google Login - User mới**
```bash
POST /api/v1/auth/signin-google
{
  "idToken": "google_id_token_here"
}

# Expected Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "username": "newuser_google",
    "email": "newuser@gmail.com",
    "role": "ROLE_BUYER", // ✅ Default role
    "buyerId": 789,
    "sellerId": null
  }
}
```

### **Test 4: Google Login - Seller đã được approve**
```bash
# Setup:
# 1. User đã submit KYC
# 2. Admin đã approve seller (seller.status = "ACCEPTED")
# 3. User login lại bằng Google

POST /api/v1/auth/signin-google
{
  "idToken": "google_id_token_here"
}

# Expected Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "username": "seller_google",
    "email": "seller@gmail.com",
    "role": "ROLE_SELLER", // ✅ ROLE ĐÃ ĐƯỢC CẬP NHẬT
    "buyerId": 123,
    "sellerId": 456
  }
}

# Database check:
SELECT role FROM users WHERE id = 123;
# Expected: ROLE_SELLER
```

### **Test 5: Get Seller Profile - User chưa submit KYC**
```bash
GET /api/v1/seller/profile
Authorization: Bearer <buyer_token>

# Expected Response:
{
  "success": false,
  "error": "Seller profile not found. Please submit KYC first."
}
# Status Code: 404
```

### **Test 6: Get Seller Profile - User đã submit KYC**
```bash
GET /api/v1/seller/profile
Authorization: Bearer <seller_token>

# Expected Response:
{
  "success": true,
  "data": {
    "id": 456,
    "buyerId": 123,
    "storeName": "My Store",
    "status": "ACCEPTED",
    "taxNumber": "1234567890",
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-15T10:30:00"
  }
}
# Status Code: 200
```

### **Test 7: Admin Approve Seller**
```bash
POST /api/v1/admin/approve-seller
{
  "sellerId": 456,
  "decision": "APPROVED",
  "message": "Approved"
}

# Expected:
# 1. seller.status = "ACCEPTED" ✅
# 2. user.role = "ROLE_SELLER" ✅
# 3. Notification được tạo ✅

# Verify trong database:
SELECT s.status, u.role 
FROM sellers s 
JOIN users u ON s.buyer_id = u.id 
WHERE s.id = 456;

# Expected result:
# status: ACCEPTED
# role: ROLE_SELLER
```

---

## 🔍 DEBUG CHECKLIST

Khi có lỗi, kiểm tra các điểm sau:

### **1. Kiểm tra Database:**
```sql
-- Kiểm tra role của user
SELECT id, username, email, role FROM users WHERE id = ?;

-- Kiểm tra seller status
SELECT id, buyer_id, status, store_name FROM sellers WHERE buyer_id = ?;

-- Kiểm tra inconsistency (seller ACCEPTED nhưng user vẫn BUYER)
SELECT u.id, u.username, u.role, s.status
FROM users u
JOIN sellers s ON u.id = s.buyer_id
WHERE s.status = 'ACCEPTED' AND u.role = 'ROLE_BUYER';
-- Nếu có kết quả → CÓ BUG!
```

### **2. Kiểm tra JWT Token:**
```bash
# Decode JWT để xem role bên trong
# Sử dụng: https://jwt.io/

# Token nên chứa:
{
  "sub": "123",
  "username": "seller1",
  "role": "ROLE_SELLER", // ✅ PHẢI ĐÚNG
  "exp": 1234567890
}
```

### **3. Kiểm tra Logs:**
```
✅ Seller approved: sellerId=456, userId=123, role updated to ROLE_SELLER
🔄 Updating role for user 123 from ROLE_BUYER to ROLE_SELLER
✅ Role updated successfully for user 123
✅ Google login successful: user=seller1, role=ROLE_SELLER
```

---

## 📝 NOTES CHO BACKEND TEAM

### **Important:**
1. ✅ **Luôn cập nhật `user.role` khi `seller.status` thay đổi**
2. ✅ **Kiểm tra seller status trong MỌI login flow** (normal, Google, Facebook, etc.)
3. ✅ **JWT phải chứa role mới nhất** từ database
4. ✅ **API errors phải trả về status code đúng** (404, 401, 403, 500)
5. ✅ **Thêm logging đầy đủ** để debug

### **Optional Improvements:**
- Tạo background job để sync role & seller status mỗi ngày
- Cache seller status để giảm DB queries
- Thêm webhook để notify frontend khi role thay đổi

---

## 🎯 SUMMARY

### **Thay đổi tối thiểu cần thiết:**

1. **Sửa `approveSeller()`**:
   ```java
   user.setRole("ROLE_SELLER");
   userRepository.save(user);
   ```

2. **Sửa `googleSignin()`**:
   ```java
   if (seller.status == "ACCEPTED" && user.role != "ROLE_SELLER") {
       user.setRole("ROLE_SELLER");
       userRepository.save(user);
   }
   ```

3. **Sửa `getSellerProfile()`**:
   ```java
   if (!sellerOpt.isPresent()) {
       return ResponseEntity.status(404).body(...);
   }
   ```

4. **Sửa `LoginResponse`**:
   ```java
   .buyerId(user.getId())
   .sellerId(seller != null ? seller.getId() : null)
   ```

Chỉ cần **4 thay đổi nhỏ** này là đủ fix toàn bộ vấn đề! 🚀

