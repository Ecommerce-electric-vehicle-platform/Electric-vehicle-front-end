# 🔄 Luồng Nâng Cấp Từ Buyer Lên Seller

## 📋 Tổng quan

Tài liệu này mô tả **luồng đầy đủ** khi một buyer nâng cấp thành seller, bao gồm cách xử lý role trong localStorage và đảm bảo đồng bộ giữa frontend-backend.

---

## 🔄 Luồng hoàn chỉnh

### **1. User đăng nhập lần đầu**

```javascript
// API: POST /api/v1/auth/signin
Response: {
  accessToken: "...",
  refreshToken: "...",
  username: "john",
  email: "john@example.com",
  role: "ROLE_BUYER"  // ← Backend trả về role
}

// Frontend xử lý (SignIn.jsx):
const userRole = mapRole(loginData.role); // "ROLE_BUYER" → "buyer"
localStorage.setItem("userRole", "buyer");
```

**Kết quả:**
- ✅ `localStorage.userRole = "buyer"`
- ✅ User là buyer, chưa có quyền seller

---

### **2. User nộp đơn KYC (Yêu cầu nâng cấp)**

```javascript
// User vào: Profile → "Nâng cấp thành người bán"
// Điền form KYC và submit

// API: POST /api/v1/profile/verify-kyc
// Backend tạo seller record với status = "PENDING"
```

**Kết quả:**
- ✅ Backend: `seller.status = "PENDING"`
- ✅ Frontend: Hiển thị màn hình chờ duyệt
- ⚠️ `localStorage.userRole` vẫn là `"buyer"` (chưa thay đổi)

---

### **3. Admin phê duyệt KYC**

```javascript
// Admin Dashboard → Approve Seller

// API: POST /api/v1/admin/approve-seller
Body: {
  sellerId: 123,
  decision: "APPROVED",
  message: "Đơn của bạn đã được phê duyệt"
}

// Backend xử lý:
// 1. Cập nhật: seller.status = "ACCEPTED"
// 2. Cập nhật: user.role = "ROLE_SELLER" ← QUAN TRỌNG!
// 3. Tạo notification cho user
```

**Kết quả Backend:**
- ✅ Database: `seller.status = "ACCEPTED"`
- ✅ Database: `user.role = "ROLE_SELLER"`
- ✅ Notification được gửi cho user

**Kết quả Frontend (Lúc này):**
- ⚠️ `localStorage.userRole` vẫn là `"buyer"` (chưa sync)
- User cần refresh/vào lại profile để cập nhật

---

### **4. User vào lại trang Profile**

```javascript
// User click vào Profile → "Nâng cấp thành người bán"

// Component UpgradeToSeller.jsx gọi API:
const response = await profileApi.getSellerstatus();
// Response: { status: "ACCEPTED", ... }

// ✅ AUTO-UPDATE ROLE (Mới thêm):
if (sellerStatus === "ACCEPTED") {
  const currentRole = localStorage.getItem("userRole");
  if (currentRole !== "seller") {
    console.log("🔄 Auto-updating role: buyer → seller");
    localStorage.setItem("userRole", "seller");
    window.dispatchEvent(new CustomEvent("roleChanged"));
  }
}

// Hiển thị màn hình SellerApplicationAccepted
```

**Kết quả:**
- ✅ `localStorage.userRole = "seller"` (tự động cập nhật)
- ✅ Header cập nhật UI (via event "roleChanged")

---

### **5. User click "Hoàn tất thao tác"**

```javascript
// Component: SellerApplicationAccepted.jsx
const handleComplete = () => {
  // ✅ BACKUP: Đảm bảo role được update (nếu chưa)
  localStorage.setItem("userRole", "seller");
  
  // Trigger events để UI cập nhật
  window.dispatchEvent(new CustomEvent("roleChanged"));
  window.dispatchEvent(new CustomEvent("authStatusChanged"));
  
  // Chuyển sang tab "Mua gói dịch vụ"
  onComplete();
};
```

**Kết quả:**
- ✅ `localStorage.userRole = "seller"` (confirmed)
- ✅ User chuyển sang tab "Mua gói dịch vụ"
- ✅ Header hiển thị menu seller

---

### **6. User đăng xuất và đăng nhập lại**

```javascript
// API: POST /api/v1/auth/signin
Response: {
  accessToken: "...",
  role: "ROLE_SELLER"  // ← Backend trả về role mới
}

// Frontend xử lý:
const userRole = mapRole(loginData.role); // "ROLE_SELLER" → "seller"
localStorage.setItem("userRole", "seller");
```

**Kết quả:**
- ✅ `localStorage.userRole = "seller"` (từ backend)
- ✅ User có đầy đủ quyền seller ngay sau khi login

---

## 🔒 Xử lý Google Login

### **Trường hợp đặc biệt:**

Khi user đăng ký bằng Google lần đầu, backend có thể không trả về `role` (null/undefined):

```javascript
// SignIn.jsx - Google Login Handler
const backendRole = loginData.role || "ROLE_BUYER"; // ← Default
const userRole = mapRole(backendRole); // "buyer"
localStorage.setItem("userRole", userRole);
```

Sau khi được approve seller, khi login lại:

```javascript
// Backend trả về role mới
Response: {
  role: "ROLE_SELLER"
}
// → Frontend update thành "seller"
```

---

## ✅ Các điểm cập nhật role

Có **3 điểm** frontend cập nhật role:

| # | Thời điểm | File | Cách thức |
|---|-----------|------|-----------|
| 1 | **Login/Signup** | `SignIn.jsx` | Từ API response |
| 2 | **Vào trang Profile** (KYC Accepted) | `UpgradeToSeller.jsx` | Auto-detect status |
| 3 | **Click "Hoàn tất"** | `SellerApplicationAccepted.jsx` | Manual update |

---

## 🧪 Test Cases

### **Test 1: Login lần đầu**
```
✅ User login → role = "buyer"
✅ localStorage.userRole = "buyer"
```

### **Test 2: Submit KYC**
```
✅ Submit form → status = "PENDING"
✅ localStorage.userRole vẫn = "buyer"
```

### **Test 3: Admin approve**
```
✅ Admin approve → backend cập nhật DB
✅ Frontend chưa biết (vì chưa refresh)
```

### **Test 4: User vào lại Profile**
```
✅ Gọi getSellerstatus() → status = "ACCEPTED"
✅ Auto-update: localStorage.userRole = "seller"
✅ Header cập nhật menu
```

### **Test 5: Click "Hoàn tất"**
```
✅ Confirm: localStorage.userRole = "seller"
✅ Chuyển tab "Mua gói dịch vụ"
✅ Có thể truy cập seller features
```

### **Test 6: Logout & Login lại**
```
✅ Login → backend trả role = "ROLE_SELLER"
✅ Frontend: localStorage.userRole = "seller"
✅ Vào thẳng được seller dashboard
```

---

## 🚨 Lưu ý quan trọng

### **Backend PHẢI:**

1. ✅ Khi approve seller, cập nhật cả 2:
   - `seller.status = "ACCEPTED"`
   - `user.role = "ROLE_SELLER"`

2. ✅ API login PHẢI trả về `role` mới nhất:
   ```json
   {
     "accessToken": "...",
     "role": "ROLE_SELLER"  // ← Bắt buộc
   }
   ```

3. ✅ API `getSellerstatus()` trả về đúng status

### **Frontend:**

1. ✅ Luôn đọc `userRole` từ localStorage
2. ✅ Sync role khi detect status = "ACCEPTED"
3. ✅ Dispatch events để UI update real-time
4. ✅ Handle trường hợp Google login (role null)

---

## 🔍 Debug

### **Kiểm tra role hiện tại:**

```javascript
// Console browser
localStorage.getItem("userRole") // "buyer" hoặc "seller"
```

### **Force update role (nếu cần):**

```javascript
localStorage.setItem("userRole", "seller");
window.dispatchEvent(new CustomEvent("roleChanged"));
location.reload(); // Refresh page
```

### **Log events:**

```javascript
// Header.jsx
console.log(`[Header] Current role: ${userRole}`);

// UpgradeToSeller.jsx  
console.log("🔄 Auto-updating role: buyer → seller");

// SellerApplicationAccepted.jsx
console.log("✅ Role updated in localStorage");
```

---

## 📌 Tóm tắt

| Trạng thái | Role trong DB | localStorage.userRole | Quyền truy cập |
|-----------|---------------|----------------------|----------------|
| Buyer mới | `ROLE_BUYER` | `"buyer"` | Chỉ mua hàng |
| Đã nộp KYC | `ROLE_BUYER` | `"buyer"` | Chỉ mua hàng |
| Admin approve | `ROLE_SELLER` | `"buyer"` → `"seller"` (tự động) | Cả mua & bán |
| Sau khi click "Hoàn tất" | `ROLE_SELLER` | `"seller"` (confirmed) | Cả mua & bán |
| Login lại | `ROLE_SELLER` | `"seller"` (từ API) | Cả mua & bán |

---

## 🎯 Kết luận

Với cơ chế **auto-update** và **backup confirmation**, role sẽ luôn đồng bộ giữa:
- ✅ Database (backend)
- ✅ localStorage (frontend)
- ✅ UI Components (React state)

User không cần đăng xuất/đăng nhập lại để cập nhật role! 🎉

