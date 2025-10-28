# 🔧 Google Login - Seller Role Fix

## ❌ Vấn đề

Khi user đã được phê duyệt thành seller (backend có `user.role = "ROLE_SELLER"`), nhưng khi đăng nhập lại bằng Google, `localStorage.userRole` vẫn là `"buyer"`.

### Nguyên nhân:

Backend Google login API (`POST /api/v1/auth/signin-google`) **không trả về role mới nhất** từ database, hoặc trả về giá trị cũ/null.

Frontend chỉ dựa vào response từ API login:
```javascript
// Code CŨ (có vấn đề)
const backendRole = loginData.role || "ROLE_BUYER"; // Default
const userRole = mapRole(backendRole);
localStorage.setItem("userRole", userRole); // ← Sai nếu backend không update
```

---

## ✅ Giải pháp

Sau khi Google login thành công, **chủ động kiểm tra seller status** để xác định role chính xác:

```javascript
// Code MỚI (đã sửa)
let finalRole = "buyer"; // Default

// 1. Kiểm tra role từ API login (nếu có)
if (loginData.role) {
  finalRole = mapRole(loginData.role);
}

// 2. ✅ QUAN TRỌNG: Kiểm tra seller status từ database
try {
  const sellerResponse = await profileApi.getSellerstatus();
  const sellerStatus = sellerResponse?.data?.data?.status;

  if (sellerStatus === "ACCEPTED") {
    finalRole = "seller"; // ← Cập nhật role đúng
  }
} catch (error) {
  // 404 = chưa submit KYC → giữ role buyer
}

// 3. Lưu role cuối cùng
localStorage.setItem("userRole", finalRole);
```

---

## 🔄 Luồng hoạt động

### **Trường hợp 1: User chưa submit KYC**
```
Google Login
  ↓
API response: { role: null } hoặc { role: "ROLE_BUYER" }
  ↓
Check seller status → 404 (Not Found)
  ↓
finalRole = "buyer" ✅
```

### **Trường hợp 2: User đã submit KYC nhưng PENDING**
```
Google Login
  ↓
API response: { role: "ROLE_BUYER" }
  ↓
Check seller status → { status: "PENDING" }
  ↓
finalRole = "buyer" ✅ (chưa được approve)
```

### **Trường hợp 3: User đã được APPROVED**
```
Google Login
  ↓
API response: { role: "ROLE_BUYER" } ← Backend chưa update
  ↓
Check seller status → { status: "ACCEPTED" } ✅
  ↓
finalRole = "seller" ✅ (override)
```

### **Trường hợp 4: Backend trả role đúng**
```
Google Login
  ↓
API response: { role: "ROLE_SELLER" } ← Backend đã update
  ↓
finalRole = "seller" (từ API)
  ↓
Check seller status → { status: "ACCEPTED" } ← Confirm lại
  ↓
finalRole = "seller" ✅ (confirmed)
```

---

## 🧪 Test Cases

### **Test 1: Google login lần đầu (User mới)**
```bash
# Mong đợi:
localStorage.userRole = "buyer"

# Console log:
"Google Login - No role in response, checking seller status..."
"Google Login - No seller profile found, keeping role as 'buyer'"
"✅ Google Login successful. Final userRole: buyer"
```

### **Test 2: Google login sau khi được approve seller**
```bash
# Mong đợi:
localStorage.userRole = "seller"

# Console log:
"Google Login - No role in response, checking seller status..."
"✅ Google Login - User is ACCEPTED seller, updating role to 'seller'"
"✅ Google Login successful. Final userRole: seller"
```

### **Test 3: Google login với backend trả role đúng**
```bash
# Mong đợi:
localStorage.userRole = "seller"

# Console log:
"Google Login - Role from API: ROLE_SELLER → seller"
"✅ Google Login - User is ACCEPTED seller, updating role to 'seller'"
"✅ Google Login successful. Final userRole: seller"
```

---

## 📊 So sánh Normal Login vs Google Login

| Điểm khác biệt | Normal Login | Google Login (CŨ) | Google Login (MỚI) |
|----------------|--------------|-------------------|---------------------|
| **API endpoint** | `/api/v1/auth/signin` | `/api/v1/auth/signin-google` | `/api/v1/auth/signin-google` |
| **Role validation** | Bắt buộc có `role` | Optional (có thể null) | Optional (có thể null) |
| **Kiểm tra seller status** | ❌ Không cần | ❌ Không có | ✅ **Có** |
| **Độ chính xác** | ✅ 100% | ⚠️ 50% (nếu backend không update) | ✅ 100% |

---

## 🔍 Debug

### **Kiểm tra role sau khi Google login:**

1. Mở **Developer Tools** → **Console**
2. Login bằng Google
3. Xem logs:
   ```
   Google Login - Role from API: ROLE_SELLER → seller
   ✅ Google Login - User is ACCEPTED seller, updating role to 'seller'
   ✅ Google Login successful. Final userRole: seller
   ```

4. Kiểm tra localStorage:
   ```javascript
   localStorage.getItem("userRole") // "seller"
   ```

### **Nếu vẫn bị "buyer":**

Kiểm tra seller status trong database:
```sql
-- Backend database
SELECT id, status FROM seller WHERE buyer_id = ?
-- Phải là: status = 'ACCEPTED'
```

Nếu status là "PENDING" hoặc không có record → role sẽ là "buyer" (đúng).

---

## 🎯 Kết luận

### **Ưu điểm của giải pháp:**

✅ **Không phụ thuộc vào backend**: Dù backend có trả role hay không, frontend tự kiểm tra seller status  
✅ **Luôn đúng**: Role được xác định từ database thực tế, không dựa vào cache  
✅ **Không cần logout/login lại**: Sau khi approve seller, Google login ngay lập tức cập nhật role đúng  
✅ **Backward compatible**: Vẫn hoạt động nếu backend trả role đúng  

### **Lưu ý:**

⚠️ Nếu backend **luôn trả về role chính xác**, có thể bỏ bước kiểm tra seller status để giảm API calls.  
⚠️ Hiện tại cơ chế này là **defensive programming** để đảm bảo role luôn chính xác.

---

## 🔗 Related Files

- `src/pages/Auth/login/SignIn.jsx` - Google login handler
- `src/api/profileApi.js` - `getSellerstatus()` API
- `src/components/ProfileUser/UpgradeToSeller.jsx` - Auto-update role on profile page
- `src/components/ProfileUser/SellerApplicationAccepted.jsx` - Update role on "Hoàn tất"

---

## 📝 Notes cho Backend Team

Nếu muốn giảm API calls, backend nên:

1. **Luôn trả role mới nhất** trong Google login response:
   ```json
   {
     "accessToken": "...",
     "refreshToken": "...",
     "role": "ROLE_SELLER"  // ← Đọc từ user.role trong DB
   }
   ```

2. **Cập nhật role ngay khi approve seller:**
   ```java
   // AdminService.approveSeller()
   seller.setStatus("ACCEPTED");
   user.setRole("ROLE_SELLER"); // ← Cập nhật role
   sellerRepository.save(seller);
   userRepository.save(user);
   ```

Nếu backend làm đúng 2 điều trên, frontend có thể tin tưởng role từ API login.

