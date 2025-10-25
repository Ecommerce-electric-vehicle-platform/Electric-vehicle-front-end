# 🔐 Google Auth Complete Update - Đồng nhất toàn bộ flow

## ✅ Đã cập nhật

Cả **Google Login** và **Google Signup** giờ đều có flow đầy đủ như đăng nhập/đăng ký thường:

---

## 📝 Files đã cập nhật

### 1. **Google Login** (`src/pages/Auth/login/SignIn.jsx`)

**Trước:**
```javascript
// Thiếu nhiều bước
localStorage.setItem("accessToken", token);
navigate("/");
```

**Sau:**
```javascript
// ✅ Đầy đủ như username/password login
localStorage.removeItem("adminProfile");  // Clear admin data
localStorage.setItem("accessToken", loginData.accessToken);
localStorage.setItem("refreshToken", loginData.refreshToken);
localStorage.setItem("token", loginData.accessToken);
localStorage.setItem("username", loginData.username);
localStorage.setItem("userEmail", loginData.email);
localStorage.setItem("authType", "user");
localStorage.setItem("buyerId", loginData.buyerId);

// Get avatar
const profile = await profileApi.getProfile();
localStorage.setItem("buyerAvatar", profile.avatarUrl);

// Dispatch event & navigate
window.dispatchEvent(new CustomEvent("authStatusChanged"));
navigate("/");
```

---

### 2. **Google Signup** (`src/pages/Auth/login/SignUp.jsx`)

**Trước:**
```javascript
// Chỉ navigate về signin
const response = await authApi.googleSignin(idToken);
navigate("/signin");
```

**Sau:**
```javascript
// ✅ Check nếu BE trả token → Auto login luôn
const response = await authApi.googleSignin(idToken);
const loginData = response?.data?.data;

if (loginData?.accessToken && loginData?.refreshToken) {
  // Auto login sau khi signup thành công
  localStorage.removeItem("adminProfile");  // Clear admin data
  localStorage.setItem("accessToken", loginData.accessToken);
  localStorage.setItem("refreshToken", loginData.refreshToken);
  localStorage.setItem("token", loginData.accessToken);
  localStorage.setItem("username", loginData.username);
  localStorage.setItem("userEmail", loginData.email);
  localStorage.setItem("authType", "user");
  localStorage.setItem("buyerId", loginData.buyerId);

  // Get avatar
  const profile = await profileApi.getProfile();
  localStorage.setItem("buyerAvatar", profile.avatarUrl);

  // Dispatch event & navigate to home
  window.dispatchEvent(new CustomEvent("authStatusChanged"));
  navigate("/");  // ✅ Đi thẳng vào home, không cần signin lại
} else {
  // Fallback: nếu chỉ signup chưa login
  navigate("/signin");
}
```

---

## 🎯 Flow Comparison

### **Username/Password Signup:**
```
1. Nhập form → Submit
2. Verify OTP
3. Navigate to /signin
4. User phải login lại
```

### **Google Signup:** (TỐT HƠN)
```
1. Click Google button
2. Backend tạo account + auto login
3. ✅ Lưu tokens và user info
4. ✅ Call getProfile() → avatar
5. ✅ Navigate to "/" (home) 
   → Không cần login lại! 🎉
```

---

## 📊 Console Logs

### Google Signup Success:
```
Google signin/signup response: {...}
[Google Signup] Cleared admin-specific data
[Google Signup] Signup/Login successful (authType: user)
Avatar saved: https://...
```

### Google Login Success:
```
Google user: {...}
[Google Login] Cleared admin-specific data
[Google Login] Login successful (authType: user)
Avatar saved: https://...
```

### Google Auth Error:
```
Google signup error: ...
// hoặc
Google login error: ...
```

---

## 🧪 Test Cases

### Test 1: Google Signup (User mới)

**Bước thực hiện:**
1. Chưa có account
2. Click "Sign up with Google" ở trang `/signup`
3. Chọn Google account

**Expected:**
```
[Google Signup] Cleared admin-specific data
[Google Signup] Signup/Login successful (authType: user)
Avatar saved: https://...

localStorage:
  authType: "user" ✅
  accessToken: "..." ✅
  buyerId: "..." ✅
  buyerAvatar: "..." ✅

Navigate: "/" ✅ (Không cần signin lại!)
```

---

### Test 2: Google Signup sau Admin Login

**Bước thực hiện:**
1. Login as Admin
   ```
   authType: "admin"
   adminProfile: {...}
   ```

2. Mở tab mới, go to `/signup`
3. Click "Sign up with Google"

**Expected:**
```
[Google Signup] Cleared admin-specific data

localStorage:
  authType: "user" ✅ (overwritten)
  adminProfile: ❌ (deleted)
  buyerId: "..." ✅

Navigate: "/" ✅
```

**Result:** Admin auto logout, User mới login thành công

---

### Test 3: Google Login (User đã có account)

**Bước thực hiện:**
1. Đã có account từ trước
2. Go to `/signin`
3. Click "Login with Google"

**Expected:**
```
[Google Login] Cleared admin-specific data
[Google Login] Login successful (authType: user)

localStorage:
  authType: "user" ✅
  accessToken: "..." ✅
  buyerId: "..." ✅

Navigate: "/" ✅
```

---

### Test 4: Google Signup/Login Error

**Bước thực hiện:**
1. Click Google button
2. Backend error hoặc token invalid

**Expected:**
```
Google signup error: ...
authType: ❌ (deleted)

UI: "Đăng nhập/Đăng ký Google thất bại. Vui lòng thử lại."
```

---

## 🔄 Backend Expectation

Backend API `POST /api/v1/auth/signin-google` phải trả về:

```json
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "username": "user123",
    "email": "user@gmail.com",
    "buyerId": 123,
    "avatarUrl": "https://..." // optional, sẽ được lấy từ getProfile nếu không có
  }
}
```

**Lưu ý:**
- Nếu là **signup mới** → Backend tạo account + auto login + trả tokens
- Nếu là **login lại** → Backend verify token + trả tokens

---

## ✅ Benefits

✅ **Google Signup auto login:** Không cần signin lại sau khi signup  
✅ **Consistent flow:** Cả login và signup đều có flow đầy đủ  
✅ **Auto clear admin data:** Không conflict với admin login  
✅ **Full user info:** Lưu đầy đủ tokens, buyerId, avatar  
✅ **Event dispatch:** Header nhận được và update UI  
✅ **Error handling:** Clear authType khi fail  

---

## 📝 Checklist

Triển khai thành công nếu:

- [ ] Google signup → Console: `[Google Signup] Signup/Login successful`
- [ ] Google login → Console: `[Google Login] Login successful`
- [ ] Google signup → Navigate to `/` (không phải `/signin`)
- [ ] Google login → Navigate to `/`
- [ ] Google auth → localStorage có đầy đủ: tokens, buyerId, avatar
- [ ] Google auth sau admin → Admin data bị clear
- [ ] Google auth error → authType bị clear
- [ ] Header update sau Google auth (nhận event)

---

## 🎉 Kết quả

### Trước đây:
- ❌ Google signup → phải signin lại
- ❌ Google login → thiếu data
- ❌ Không clear admin data
- ❌ Không dispatch event

### Bây giờ:
- ✅ Google signup → auto login luôn
- ✅ Google login → đầy đủ data
- ✅ Auto clear admin data
- ✅ Dispatch event → Header update
- ✅ Console logs rõ ràng
- ✅ Error handling đầy đủ

---

## 📄 Related Docs

- **Auth Solution:** `AUTH_SIMPLE_SOLUTION.md`
- **Google Login Update:** `GOOGLE_LOGIN_UPDATE.md`
- **Test Guide:** `TEST_SIMPLE_AUTH.md`

---

**Last Updated:** October 24, 2025  
**Status:** ✅ Complete - Both Google Login & Signup  
**Files Updated:** 
- `src/pages/Auth/login/SignIn.jsx` (Google Login)
- `src/pages/Auth/login/SignUp.jsx` (Google Signup)

**UX Improvement:** Google signup giờ auto login → Không cần signin lại! 🚀


