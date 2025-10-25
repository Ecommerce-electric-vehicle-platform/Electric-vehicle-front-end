# 🔐 Giải Pháp Auth Đơn Giản: Backend Dùng Chung `accessToken`

## 🎯 Vấn đề

Backend dùng **cùng field `accessToken`** cho cả Admin và User (Buyer/Seller)  
→ Không thể lưu 2 tokens riêng biệt trong localStorage

---

## ✅ Giải pháp

**Cho phép chỉ 1 loại đăng nhập tại 1 thời điểm**

- Khi **Admin login** → Clear user data (`buyerId`, `sellerId`, `buyerAvatar`) + Set `authType = "admin"`
- Khi **User login** → Clear admin data (`adminProfile`) + Set `authType = "user"`
- Dùng **`authType`** để phân biệt context và protect routes

---

## 📝 Implementation

### 1. Admin Login (`AdminLogin.jsx`)

```javascript
// Admin login thành công
localStorage.removeItem("buyerId");      // ⚠️ Clear user data
localStorage.removeItem("sellerId");
localStorage.removeItem("buyerAvatar");

localStorage.setItem("accessToken", token);
localStorage.setItem("authType", "admin");  // ✅ Mark as admin
localStorage.setItem("adminProfile", JSON.stringify(profile));
```

### 2. User Login (`SignIn.jsx`)

```javascript
// User login thành công
localStorage.removeItem("adminProfile");  // ⚠️ Clear admin data

localStorage.setItem("accessToken", token);
localStorage.setItem("authType", "user");   // ✅ Mark as user
localStorage.setItem("buyerId", buyerId);
localStorage.setItem("username", username);
```

### 3. Logout

```javascript
// Admin logout
localStorage.removeItem("accessToken");
localStorage.removeItem("authType");
localStorage.removeItem("adminProfile");

// User logout
localStorage.removeItem("accessToken");
localStorage.removeItem("authType");
localStorage.removeItem("buyerId");
localStorage.removeItem("username");
// ...
```

---

## 🔒 Route Protection

### Admin Routes (`AdminRoute.jsx`)

```javascript
const RequireAdminAuth = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  const authType = localStorage.getItem("authType");

  if (!token || authType !== "admin") {
    return <Navigate to="/admin/signin" replace />;
  }

  return children;
};
```

### User Routes (Optional - nếu cần)

```javascript
const RequireUserAuth = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  const authType = localStorage.getItem("authType");

  if (!token || authType !== "user") {
    return <Navigate to="/signin" replace />;
  }

  return children;
};
```

---

## 🧪 Test Cases

### Test 1: Admin Login → User Login

**Bước thực hiện:**
1. Login as Admin
   ```
   accessToken: "admin_token_123"
   authType: "admin"
   adminProfile: {...}
   ```

2. Login as User (không logout admin trước)

**Expected:**
```
⚠️  [User Login] Cleared admin-specific data
✅ [User] Login successful (authType: user)

localStorage:
  accessToken: "user_token_456"  // ✅ Overwritten
  authType: "user"               // ✅ Overwritten
  adminProfile: ❌ (deleted)      // ✅ Cleared
  buyerId: "123"                 // ✅ Added
```

**Result:** Admin bị logout tự động, User login thành công

---

### Test 2: User Login → Admin Login

**Bước thực hiện:**
1. Login as User
   ```
   accessToken: "user_token_456"
   authType: "user"
   buyerId: "123"
   ```

2. Login as Admin (không logout user trước)

**Expected:**
```
⚠️  [Admin Login] Cleared user-specific data
✅ [Admin] Login successful (authType: admin)

localStorage:
  accessToken: "admin_token_789"  // ✅ Overwritten
  authType: "admin"               // ✅ Overwritten
  buyerId: ❌ (deleted)            // ✅ Cleared
  adminProfile: {...}             // ✅ Added
```

**Result:** User bị logout tự động, Admin login thành công

---

### Test 3: Route Protection

**Scenario 1: User cố vào admin routes**
```
authType: "user"
Navigate to: /admin/dashboard

Expected: Redirect to /admin/signin ✅
```

**Scenario 2: Admin cố vào user-only routes** (nếu có protection)
```
authType: "admin"
Navigate to: /seller/create-post

Expected: Redirect hoặc warning ✅
```

---

## 📊 localStorage Structure

### Khi Admin đăng nhập:
```javascript
{
  accessToken: "eyJhbGc...",
  refreshToken: "eyJhbGc...",
  token: "eyJhbGc...",
  authType: "admin",           // ✅ Key indicator
  username: "admin_user",
  userEmail: "admin@test.com",
  adminProfile: "{...}",       // ✅ Admin-specific
  
  // User keys = EMPTY
  buyerId: ❌
  sellerId: ❌
  buyerAvatar: ❌
}
```

### Khi User đăng nhập:
```javascript
{
  accessToken: "eyJhbGc...",
  refreshToken: "eyJhbGc...",
  token: "eyJhbGc...",
  authType: "user",            // ✅ Key indicator
  username: "test_seller",
  userEmail: "user@test.com",
  buyerId: "123",              // ✅ User-specific
  sellerId: "456",
  buyerAvatar: "https://...",
  
  // Admin keys = EMPTY
  adminProfile: ❌
}
```

---

## 🔄 Flow Diagram

```
┌─────────────┐
│  Admin      │
│  Login      │
└──────┬──────┘
       │
       ↓
┌──────────────────────────┐
│ Clear User Data:         │
│ - buyerId                │
│ - sellerId               │
│ - buyerAvatar            │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Set Admin Data:          │
│ - accessToken            │
│ - authType = "admin"     │
│ - adminProfile           │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Navigate to              │
│ /admin/dashboard         │
└──────────────────────────┘


┌─────────────┐
│  User       │
│  Login      │
└──────┬──────┘
       │
       ↓
┌──────────────────────────┐
│ Clear Admin Data:        │
│ - adminProfile           │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Set User Data:           │
│ - accessToken            │
│ - authType = "user"      │
│ - buyerId, username, etc │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Navigate to /            │
└──────────────────────────┘
```

---

## ✅ Advantages

✅ **Đơn giản:** Không cần file `authStorage.js` phức tạp  
✅ **Tương thích:** Hoạt động với backend dùng chung `accessToken`  
✅ **An toàn:** Auto logout loại cũ khi login loại mới  
✅ **Rõ ràng:** Dùng `authType` để track context  
✅ **Dễ test:** Check console logs để verify

---

## ⚠️ Limitations

⚠️ **Không thể login cả 2 cùng lúc**  
   → Nếu cần feature này, phải đổi backend để dùng 2 fields riêng: `adminToken` & `userToken`

⚠️ **Logout 1 bên = clear tất cả**  
   → Vì chỉ có 1 `accessToken`, logout = xóa token = cả 2 logout

---

## 🐛 Troubleshooting

### Vấn đề 1: Admin login nhưng vẫn thấy buyerId

**Nguyên nhân:** `AdminLogin.jsx` không clear user data

**Solution:**
```javascript
localStorage.removeItem("buyerId");
localStorage.removeItem("sellerId");
localStorage.removeItem("buyerAvatar");
```

---

### Vấn đề 2: User login nhưng vẫn vào được admin dashboard

**Nguyên nhân:** Route protection không check `authType`

**Solution:**
```javascript
// AdminRoute.jsx
if (authType !== "admin") {
  return <Navigate to="/admin/signin" />;
}
```

---

### Vấn đề 3: Console không thấy logs

**Nguyên nhân:** Console logs chưa được thêm

**Solution:** Check code có:
```javascript
console.log("✅ [Admin] Login successful (authType: admin)");
console.log("✅ [User] Login successful (authType: user)");
```

---

## 📝 Checklist

Triển khai thành công nếu:

- [ ] Admin login → Clear `buyerId`, `sellerId`, `buyerAvatar`
- [ ] User login → Clear `adminProfile`
- [ ] Login thành công → Console log: `✅ [Admin]` hoặc `✅ [User]`
- [ ] `authType` được set đúng: `"admin"` hoặc `"user"`
- [ ] Admin routes check: `authType === "admin"`
- [ ] User login sau admin → Admin bị logout tự động
- [ ] Admin login sau user → User bị logout tự động

---

## 🎯 Kết luận

Giải pháp này phù hợp khi:
- ✅ Backend dùng chung field `accessToken`
- ✅ Không cần login cả 2 cùng lúc
- ✅ Ưu tiên đơn giản hơn phức tạp
- ✅ Testing/Development phase

Nếu cần login cả 2 cùng lúc:
- ❌ Phải thay đổi backend để dùng 2 fields riêng
- ❌ Hoặc dùng subdomain khác nhau cho admin vs user

---

**Last Updated:** October 24, 2025  
**Status:** ✅ Implemented - Simple Solution  
**Complexity:** Low  
**Backend Requirement:** None (dùng được với backend hiện tại)


