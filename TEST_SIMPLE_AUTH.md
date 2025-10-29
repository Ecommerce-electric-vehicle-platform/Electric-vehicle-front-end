# 🧪 Test Nhanh: Giải Pháp Auth Đơn Giản

## 🎯 Test với Mock Data

### Bước 1: Mock User Login

Mở Console (F12) và chạy:

```javascript
// 1. Giả lập User login
localStorage.removeItem("adminProfile");  // Clear admin data
localStorage.setItem("accessToken", "user_token_123");
localStorage.setItem("token", "user_token_123");
localStorage.setItem("authType", "user");
localStorage.setItem("buyerId", "8");
localStorage.setItem("username", "test_seller");
localStorage.setItem("userEmail", "seller@test.com");

console.log("✅ [User] Mock login successful");
console.log("Auth Type:", localStorage.getItem("authType"));
console.log("Buyer ID:", localStorage.getItem("buyerId"));
```

### Bước 2: Test Seller Pages

```javascript
// Navigate to:
// http://localhost:5173/seller/create-post
// http://localhost:5173/seller/manage-posts

// Expected:
// - ✅ ServicePackageGuard check → Valid (USE_MOCK_DATA = true)
// - ✅ Hiện form / list posts
// - ✅ Console: 🧪 [MOCK] getSellerProfile
// - ✅ Console: 🧪 [MOCK] checkServicePackageValidity
```

### Bước 3: Mock Admin Login (Overwrite User)

```javascript
// 2. Giả lập Admin login
localStorage.removeItem("buyerId");     // Clear user data
localStorage.removeItem("sellerId");
localStorage.removeItem("buyerAvatar");

localStorage.setItem("accessToken", "admin_token_456");
localStorage.setItem("token", "admin_token_456");
localStorage.setItem("authType", "admin");
localStorage.setItem("adminProfile", JSON.stringify({
  username: "admin_test",
  email: "admin@test.com",
  fullName: "Admin Test"
}));

console.log("✅ [Admin] Mock login successful");
console.log("Auth Type:", localStorage.getItem("authType"));
console.log("Admin Profile:", localStorage.getItem("adminProfile"));

// Check user data đã bị xóa
console.log("Buyer ID (should be null):", localStorage.getItem("buyerId"));
```

### Bước 4: Verify Auto Logout

```javascript
// Check localStorage
console.log("=== Current Auth State ===");
console.log("authType:", localStorage.getItem("authType"));
console.log("accessToken:", localStorage.getItem("accessToken"));
console.log("buyerId:", localStorage.getItem("buyerId"));
console.log("adminProfile:", localStorage.getItem("adminProfile"));
console.log("========================");

// Expected output khi Admin login sau User:
// authType: "admin" ✅
// accessToken: "admin_token_456" ✅
// buyerId: null ✅ (user data cleared)
// adminProfile: "{...}" ✅
```

---

## 🔄 Test Flow Hoàn Chỉnh

### Test Sequence 1: User → Admin

```javascript
// 1. Mock User Login
localStorage.clear();
localStorage.setItem("authType", "user");
localStorage.setItem("buyerId", "123");
localStorage.setItem("accessToken", "user_token");
console.log("1️⃣ User logged in");

// 2. Mock Admin Login (overwrite)
localStorage.removeItem("buyerId");
localStorage.setItem("authType", "admin");
localStorage.setItem("adminProfile", JSON.stringify({name: "Admin"}));
localStorage.setItem("accessToken", "admin_token");
console.log("2️⃣ Admin logged in (user auto logged out)");

// 3. Verify
console.log("Auth:", localStorage.getItem("authType")); // "admin" ✅
console.log("Buyer ID:", localStorage.getItem("buyerId")); // null ✅
```

### Test Sequence 2: Admin → User

```javascript
// 1. Mock Admin Login
localStorage.clear();
localStorage.setItem("authType", "admin");
localStorage.setItem("adminProfile", JSON.stringify({name: "Admin"}));
localStorage.setItem("accessToken", "admin_token");
console.log("1️⃣ Admin logged in");

// 2. Mock User Login (overwrite)
localStorage.removeItem("adminProfile");
localStorage.setItem("authType", "user");
localStorage.setItem("buyerId", "123");
localStorage.setItem("accessToken", "user_token");
console.log("2️⃣ User logged in (admin auto logged out)");

// 3. Verify
console.log("Auth:", localStorage.getItem("authType")); // "user" ✅
console.log("Admin Profile:", localStorage.getItem("adminProfile")); // null ✅
```

---

## 📊 Quick Check Script

Copy/paste vào Console để check auth state hiện tại:

```javascript
function checkAuthState() {
  const authType = localStorage.getItem("authType");
  const token = localStorage.getItem("accessToken");
  const buyerId = localStorage.getItem("buyerId");
  const adminProfile = localStorage.getItem("adminProfile");
  
  console.log("=================================");
  console.log("📊 CURRENT AUTH STATE");
  console.log("=================================");
  console.log("Auth Type:", authType || "❌ Not logged in");
  console.log("Has Token:", token ? "✅ Yes" : "❌ No");
  
  if (authType === "user") {
    console.log("👤 USER MODE");
    console.log("  - Buyer ID:", buyerId || "N/A");
    console.log("  - Admin Profile:", adminProfile ? "⚠️ CONFLICT!" : "✅ Clean");
  } else if (authType === "admin") {
    console.log("👨‍💼 ADMIN MODE");
    console.log("  - Admin Profile:", adminProfile ? "✅ Set" : "❌ Missing");
    console.log("  - Buyer ID:", buyerId ? "⚠️ CONFLICT!" : "✅ Clean");
  } else {
    console.log("❌ NO AUTH TYPE SET");
  }
  console.log("=================================");
}

// Run it
checkAuthState();
```

**Expected Output (User logged in):**
```
=================================
📊 CURRENT AUTH STATE
=================================
Auth Type: user
Has Token: ✅ Yes
👤 USER MODE
  - Buyer ID: 8
  - Admin Profile: ✅ Clean
=================================
```

**Expected Output (Admin logged in):**
```
=================================
📊 CURRENT AUTH STATE
=================================
Auth Type: admin
Has Token: ✅ Yes
👨‍💼 ADMIN MODE
  - Admin Profile: ✅ Set
  - Buyer ID: ✅ Clean
=================================
```

---

## 🎯 Test Seller Features với Mock Auth

```javascript
// Setup: Mock User Login + Navigate to seller pages
localStorage.clear();
localStorage.setItem("accessToken", "seller_token_123");
localStorage.setItem("token", "seller_token_123");
localStorage.setItem("authType", "user");
localStorage.setItem("buyerId", "8");  // Match sellerId in mock data
localStorage.setItem("username", "test_seller");

console.log("✅ Ready to test seller pages!");
console.log("📍 Navigate to:");
console.log("   - /seller/create-post (Create new post)");
console.log("   - /seller/manage-posts (View posts list)");
```

Then navigate to seller pages and verify:
- ✅ ServicePackageGuard check successful
- ✅ Mock data loads (3 posts)
- ✅ Console logs: `🧪 [MOCK] ...`

---

## 🧹 Reset Everything

```javascript
// Clear all localStorage
localStorage.clear();
console.log("✅ localStorage cleared!");

// Reload page
location.reload();
```

---

## ✅ Success Checklist

Test thành công khi:

- [ ] Mock user login → `authType = "user"`, có `buyerId`
- [ ] Mock admin login → `authType = "admin"`, có `adminProfile`
- [ ] Admin login sau user → `buyerId` bị clear
- [ ] User login sau admin → `adminProfile` bị clear
- [ ] `checkAuthState()` không show conflicts
- [ ] Seller pages hoạt động với mock user login
- [ ] Console logs: `✅ [User]` hoặc `✅ [Admin]`

---

**Test Time:** 2-3 minutes  
**No Real Login Required:** Dùng mock data  
**Safe:** Chỉ test trong localStorage, không ảnh hưởng backend










