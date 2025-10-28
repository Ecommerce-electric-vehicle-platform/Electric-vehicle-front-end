# 🔐 Google Login Update - Đồng nhất với Username/Password Login

## ✅ Đã cập nhật

Google login giờ có **cùng flow** với đăng nhập username/password:

### **Trước đây:**
```javascript
// Google login (cũ)
localStorage.setItem("accessToken", token);
localStorage.setItem("username", username);
localStorage.setItem("authType", "user");
navigate("/");
```

❌ **Thiếu:**
- Clear admin data
- Save refreshToken
- Save buyerId
- Call getProfile API
- Dispatch authStatusChanged event
- Console logs

---

### **Bây giờ:**
```javascript
// Google login (mới) - GIỐNG username/password login
localStorage.removeItem("adminProfile");  // ⚠️ Clear admin
localStorage.setItem("accessToken", token);
localStorage.setItem("refreshToken", refreshToken);
localStorage.setItem("token", token);
localStorage.setItem("username", username);
localStorage.setItem("userEmail", email);
localStorage.setItem("authType", "user");
localStorage.setItem("buyerId", buyerId);

// Call getProfile API để lấy avatar
const profile = await profileApi.getProfile();
localStorage.setItem("buyerAvatar", profile.avatarUrl);

// Dispatch event
window.dispatchEvent(new CustomEvent("authStatusChanged"));

// Navigate
navigate("/");
```

✅ **Đầy đủ tất cả bước như username/password login!**

---

## 🎯 Flow hoàn chỉnh

### **Username/Password Login:**
```
1. Clear admin data
2. Save tokens (accessToken, refreshToken, token)
3. Save user info (username, email, buyerId)
4. Set authType = "user"
5. Call getProfile() → Save avatar
6. Dispatch authStatusChanged event
7. Navigate to "/"
```

### **Google Login:** (GIỜ GIỐNG HỆT)
```
1. Clear admin data ✅
2. Save tokens (accessToken, refreshToken, token) ✅
3. Save user info (username, email, buyerId) ✅
4. Set authType = "user" ✅
5. Call getProfile() → Save avatar ✅
6. Dispatch authStatusChanged event ✅
7. Navigate to "/" ✅
```

---

## 📊 Console Logs

### Google Login Success:
```
⚠️  [Google Login] Cleared admin-specific data
✅ [Google Login] Login successful (authType: user)
Avatar saved: https://...
```

### Google Login Error:
```
Google login error: ...
```

---

## 🧪 Test

### Test 1: Google Login sau Admin Login

**Bước thực hiện:**
1. Login as Admin
   ```
   authType: "admin"
   adminProfile: {...}
   ```

2. Google Login (không logout admin trước)

**Expected:**
```
⚠️  [Google Login] Cleared admin-specific data
✅ [Google Login] Login successful (authType: user)

localStorage:
  authType: "user" ✅
  adminProfile: ❌ (deleted)
  buyerId: "123" ✅
  buyerAvatar: "https://..." ✅
```

**Result:** Admin tự động logout, User login thành công

---

### Test 2: Google Login từ đầu

**Bước thực hiện:**
1. Chưa đăng nhập gì
2. Click "Login with Google"
3. Chọn Google account

**Expected:**
```
⚠️  [Google Login] Cleared admin-specific data
✅ [Google Login] Login successful (authType: user)
Avatar saved: https://...

localStorage:
  authType: "user" ✅
  accessToken: "..." ✅
  refreshToken: "..." ✅
  token: "..." ✅
  username: "..." ✅
  userEmail: "..." ✅
  buyerId: "..." ✅
  buyerAvatar: "..." ✅
```

**Result:** Login thành công, redirect to `/`

---

### Test 3: Google Login Error

**Bước thực hiện:**
1. Click "Login with Google"
2. Giả lập lỗi (backend down hoặc invalid token)

**Expected:**
```
Google login error: ...
authType: ❌ (deleted)

UI: Hiện error message "Đăng nhập Google thất bại."
```

**Result:** authType bị clear, user không login

---

## 🔄 So sánh Code

### Username/Password Login:
```javascript
// SignIn.jsx - handleSubmit()
if (loginData?.accessToken && loginData?.refreshToken) {
  localStorage.removeItem("adminProfile");
  console.log("⚠️  [User Login] Cleared admin-specific data");
  
  localStorage.setItem("accessToken", loginData.accessToken);
  localStorage.setItem("refreshToken", loginData.refreshToken);
  localStorage.setItem("token", loginData.accessToken);
  localStorage.setItem("username", loginData.username);
  localStorage.setItem("userEmail", loginData.email);
  localStorage.setItem("authType", "user");
  
  if (loginData.buyerId) {
    localStorage.setItem("buyerId", loginData.buyerId);
  }
  
  console.log("✅ [User] Login successful (authType: user)");
  
  // Get profile
  const profileResponse = await profileApi.getProfile();
  if (profileData?.avatarUrl) {
    localStorage.setItem("buyerAvatar", profileData.avatarUrl);
  }
  
  window.dispatchEvent(new CustomEvent("authStatusChanged"));
  navigate("/");
}
```

### Google Login: (GIỐNG HỆT)
```javascript
// SignIn.jsx - handleGoogleSuccess()
if (loginData?.accessToken && loginData?.refreshToken) {
  localStorage.removeItem("adminProfile");
  console.log("⚠️  [Google Login] Cleared admin-specific data");
  
  localStorage.setItem("accessToken", loginData.accessToken);
  localStorage.setItem("refreshToken", loginData.refreshToken);
  localStorage.setItem("token", loginData.accessToken);
  localStorage.setItem("username", loginData.username);
  localStorage.setItem("userEmail", loginData.email);
  localStorage.setItem("authType", "user");
  
  if (loginData.buyerId) {
    localStorage.setItem("buyerId", loginData.buyerId);
  }
  
  console.log("✅ [Google Login] Login successful (authType: user)");
  
  // Get profile
  const profileResponse = await profileApi.getProfile();
  if (profileData?.avatarUrl) {
    localStorage.setItem("buyerAvatar", profileData.avatarUrl);
  }
  
  window.dispatchEvent(new CustomEvent("authStatusChanged"));
  navigate("/");
}
```

✅ **100% giống nhau!**

---

## ✅ Benefits

✅ **Consistency:** Google login và username/password login có cùng behavior  
✅ **Complete:** Lưu đầy đủ thông tin, không thiếu sót  
✅ **Safe:** Auto clear admin data khi user login  
✅ **Debug-friendly:** Console logs rõ ràng  
✅ **Error handling:** Clear authType khi login fail  

---

## 📝 Checklist

Test thành công nếu:

- [ ] Google login → Console: `✅ [Google Login] Login successful (authType: user)`
- [ ] Google login sau admin → Admin data bị clear
- [ ] Google login → localStorage có đầy đủ: token, refreshToken, buyerId, avatar
- [ ] Google login → authStatusChanged event được dispatch
- [ ] Google login → Navigate to `/` như username/password
- [ ] Google login error → authType bị clear
- [ ] Header nhận được event và update UI

---

**Last Updated:** October 24, 2025  
**Status:** ✅ Updated - Google Login = Username/Password Login  
**File Changed:** `src/pages/Auth/login/SignIn.jsx`




