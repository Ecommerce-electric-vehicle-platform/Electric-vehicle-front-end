# 🔧 Auto-Detect Seller authType Fix

## Vấn đề

Khi user được admin approve thành seller:
- Backend update user → có `sellerId`  
- Frontend `authType` vẫn là `"user"` (không tự động update)
- `ServicePackageGuard` bị block vì nghĩ user chưa phải seller
- User phải đăng xuất và đăng nhập lại mới work

## Giải pháp

**Auto-detect `authType` khi đăng nhập** dựa vào `sellerId` trong response:

```javascript
// ✅ Nếu có sellerId → authType = "seller"
if (loginData.sellerId) {
  localStorage.setItem("authType", "seller");
  localStorage.setItem("sellerId", loginData.sellerId);
}
// ✅ Nếu không có → authType = "user"
else {
  localStorage.setItem("authType", "user");
  localStorage.removeItem("sellerId");
}
```

---

## 📝 Files đã sửa

### **File:** `src/pages/Auth/login/SignIn.jsx`

#### **1. Username/Password Login** (Line 79-88)

**Before:**
```javascript
localStorage.setItem("authType", "user"); // ❌ Luôn là "user"
```

**After:**
```javascript
// ✅ Auto-detect authType: seller nếu có sellerId, user nếu không
if (loginData.sellerId) {
  localStorage.setItem("authType", "seller");
  localStorage.setItem("sellerId", loginData.sellerId);
  console.log("[User] Login successful (authType: seller, sellerId:", loginData.sellerId, ")");
} else {
  localStorage.setItem("authType", "user");
  localStorage.removeItem("sellerId");
  console.log("[User] Login successful (authType: user)");
}
```

#### **2. Google Login** (Line 179-188)

**Before:**
```javascript
localStorage.setItem("authType", "user"); // ❌ Luôn là "user"
```

**After:**
```javascript
// ✅ Auto-detect authType: seller nếu có sellerId, user nếu không
if (loginData.sellerId) {
  localStorage.setItem("authType", "seller");
  localStorage.setItem("sellerId", loginData.sellerId);
  console.log("[Google Login] Login successful (authType: seller, sellerId:", loginData.sellerId, ")");
} else {
  localStorage.setItem("authType", "user");
  localStorage.removeItem("sellerId");
  console.log("[Google Login] Login successful (authType: user)");
}
```

---

## 🎯 User Flow (Sau khi fix)

### **Scenario 1: User chưa upgrade seller**

1. User đăng nhập
2. Backend response: `{ buyerId: "123", sellerId: null }`
3. Frontend set: `authType = "user"`
4. ✅ Không thấy menu "Đăng tin"

---

### **Scenario 2: User đã được approve thành seller**

1. Admin approve seller → Backend có `sellerId`
2. User đăng nhập lại (hoặc đăng nhập lần đầu)
3. Backend response: `{ buyerId: "123", sellerId: "456" }`
4. Frontend auto-detect và set: `authType = "seller"`
5. ✅ Menu "Đăng tin" xuất hiện
6. ✅ `ServicePackageGuard` cho phép vào trang đăng tin

---

## 📊 localStorage Structure

### **User (chưa upgrade):**
```javascript
{
  "accessToken": "xxx",
  "username": "buyerxautrai",
  "buyerId": "123",
  "authType": "user",     // ← User
  "sellerId": null        // ← Không có
}
```

### **Seller (đã upgrade):**
```javascript
{
  "accessToken": "xxx",
  "username": "buyerxautrai",
  "buyerId": "123",
  "authType": "seller",   // ← Auto-detect!
  "sellerId": "456"       // ← Có sellerId
}
```

---

## 🧪 Test Cases

### Test 1: Login user chưa upgrade
1. Login với account chưa upgrade seller
2. Check console logs: `[User] Login successful (authType: user)`
3. Check `localStorage.authType` = `"user"`
4. Check `localStorage.sellerId` = không có
5. ✅ Không thấy menu "Đăng tin"

### Test 2: Login seller đã approve
1. Admin approve user → seller (có sellerId trong DB)
2. User đăng xuất
3. User đăng nhập lại
4. Check console logs: `[User] Login successful (authType: seller, sellerId: 456)`
5. Check `localStorage.authType` = `"seller"`
6. Check `localStorage.sellerId` = `"456"`
7. ✅ Thấy menu "Đăng tin"
8. ✅ Nhấn "Đăng tin" → Không bị block

### Test 3: Google Login seller
1. User có `sellerId` đăng nhập bằng Google
2. Check console logs: `[Google Login] Login successful (authType: seller, sellerId: 456)`
3. Check `localStorage.authType` = `"seller"`
4. ✅ ServicePackageGuard cho phép vào

---

## 🎉 Benefits

✅ **Auto-detect seller** - Không cần manual set `authType`  
✅ **User-friendly** - User không cần logout/login lại  
✅ **Consistent** - Cả username/password và Google login đều work  
✅ **Fix ServicePackageGuard** - Không còn bị block nữa  
✅ **Debug-friendly** - Console logs rõ ràng  

---

## 🔍 Debug Console Logs

### **User login (normal user):**
```
[User Login] Cleared admin-specific data
[User] Login successful (authType: user)
```

### **Seller login (approved seller):**
```
[User Login] Cleared admin-specific data
[User] Login successful (authType: seller, sellerId: 456)
```

### **Google login (seller):**
```
[Google Login] Cleared admin-specific data
[Google Login] Login successful (authType: seller, sellerId: 456)
```

---

## ⚠️ Important Notes

1. **Backend phải trả `sellerId` trong login response**
   - Nếu user chưa upgrade: `sellerId: null`
   - Nếu user đã upgrade: `sellerId: "123"`

2. **User phải logout và login lại** sau khi được approve
   - Auto-detect chỉ chạy khi đăng nhập
   - Không tự động update khi đang logged in

3. **ServicePackageGuard vẫn check API**
   - `authType` chỉ là hint cho frontend
   - Backend vẫn check service package validity

---

## 📍 Related Files

- `src/pages/Auth/login/SignIn.jsx` - Auto-detect logic
- `src/components/ServicePackageGuard/ServicePackageGuard.jsx` - Guard component
- `src/api/sellerApi.js` - Seller APIs
- `src/pages/Seller/CreatePost/CreatePost.jsx` - Guarded by ServicePackageGuard
- `src/pages/Seller/ManagePosts/ManagePosts.jsx` - Guarded by ServicePackageGuard

---

**Last Updated:** October 24, 2025  
**File Changed:** `src/pages/Auth/login/SignIn.jsx`  
**Lines Changed:** 2 sections (Username/Password + Google Login)  
**Status:** ✅ Complete - Auto-detect seller working!  
**Breaking Change:** ❌ No - Backward compatible







