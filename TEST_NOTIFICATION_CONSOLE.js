// ==================================================
// 🧪 TEST NOTIFICATION - Copy & Paste vào Console
// ==================================================

console.log("🧪 Starting Notification Test...");
console.log("=".repeat(50));

// 1. Kiểm tra Auth Status
console.log("\n📋 Step 1: Check Auth Status");
console.log("-".repeat(50));
const token = localStorage.getItem("token");
const buyerId = localStorage.getItem("buyerId");
const authType = localStorage.getItem("authType");
const username = localStorage.getItem("username");

console.log("✓ Token:", token ? `${token.substring(0, 20)}...` : "❌ KHÔNG CÓ");
console.log("✓ buyerId:", buyerId || "❌ KHÔNG CÓ");
console.log("✓ authType:", authType || "guest");
console.log("✓ username:", username || "N/A");

if (!token) {
  console.error("❌ KHÔNG CÓ TOKEN! Vui lòng đăng nhập trước.");
  throw new Error("No token");
}

if (authType === "admin") {
  console.warn("⚠️ Đang login bằng ADMIN account. Notification chỉ hoạt động cho USER (buyer).");
}

// 2. Kiểm tra API Endpoint
console.log("\n📋 Step 2: Test API Endpoint");
console.log("-".repeat(50));

fetch('http://localhost:5173/api/v1/notifications', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log("✓ Status:", response.status);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
})
.then(data => {
  console.log("✓ Response Data:", data);
  console.log("✓ Notifications Count:", data.length);
  
  if (data.length === 0) {
    console.warn("⚠️ KHÔNG CÓ NOTIFICATION NÀO!");
    console.log("\n💡 Có thể do:");
    console.log("  1. Backend chưa tạo notification cho user này");
    console.log("  2. receiverId trong DB không khớp với buyerId:", buyerId);
    console.log("\n🔍 Kiểm tra trong DB:");
    console.log(`  SELECT * FROM notifications WHERE receiverId = ${buyerId};`);
  } else {
    console.log("\n📬 Notifications:");
    data.forEach((notif, index) => {
      console.log(`\n--- Notification ${index + 1} ---`);
      console.log("  ID:", notif.notificationId);
      console.log("  receiverId:", notif.receiverId);
      console.log("  Title:", notif.title);
      console.log("  Content:", notif.content);
      console.log("  readAt:", notif.readAt || "null (chưa đọc)");
      console.log("  createdAt:", notif.createdAt);
      
      // Kiểm tra receiverId
      if (notif.receiverId.toString() !== buyerId) {
        console.error("  ❌ receiverId KHÔNG KHỚP với buyerId!");
        console.error(`     receiverId: ${notif.receiverId}`);
        console.error(`     buyerId: ${buyerId}`);
      } else {
        console.log("  ✅ receiverId khớp với buyerId");
      }
      
      // Kiểm tra đã đọc chưa
      if (notif.readAt) {
        console.warn("  ⚠️ Notification này ĐÃ ĐỌC → Sẽ không hiện popup");
      } else {
        console.log("  ✅ Chưa đọc → Sẽ hiện popup nếu là mới");
      }
    });
  }
})
.catch(error => {
  console.error("❌ API ERROR:", error);
  console.log("\n💡 Có thể do:");
  console.log("  1. Backend chưa chạy");
  console.log("  2. Token hết hạn (login lại)");
  console.log("  3. CORS issue");
  console.log("  4. Endpoint sai");
});

// 3. Test Transform Function
console.log("\n📋 Step 3: Test Transform Logic");
console.log("-".repeat(50));

const testNotif = {
  notificationId: 999,
  receiverId: parseInt(buyerId),
  type: "BUYER",
  title: "Test - Phê duyệt thành công",
  content: "Đây là test notification",
  readAt: null,
  createdAt: new Date().toISOString()
};

console.log("Mock notification:", testNotif);

// Detect type
const text = (testNotif.title + " " + testNotif.content).toLowerCase();
let detectedType = "info";
if (text.includes("phê duyệt") || text.includes("thành công")) {
  detectedType = "success";
}
console.log("✓ Detected type:", detectedType);

// Transform
const transformed = {
  notificationId: testNotif.notificationId,
  title: testNotif.title,
  message: testNotif.content,
  type: detectedType,
  isRead: !!testNotif.readAt,
  createdAt: testNotif.createdAt,
  receiverId: testNotif.receiverId
};

console.log("✓ Transformed:", transformed);

// 4. Summary
console.log("\n📋 Summary");
console.log("=".repeat(50));
console.log("✓ Auth:", token ? "OK" : "FAIL");
console.log("✓ buyerId:", buyerId || "N/A");
console.log("✓ authType:", authType);
console.log("\n💡 Next Steps:");
console.log("  1. Xem console có log 📡 [Notification] Polling... mỗi 10s không?");
console.log("  2. Xem Network tab có request GET /api/v1/notifications không?");
console.log("  3. Nếu không có notification, check DB có record với receiverId =", buyerId);
console.log("  4. Nếu có notification nhưng không hiện, check readAt = null?");
console.log("\n🔧 Để test thủ công:");
console.log("  - Mở Network tab");
console.log("  - Đợi 10 giây");
console.log("  - Tìm request GET /api/v1/notifications");
console.log("  - Check Response");

console.log("\n" + "=".repeat(50));
console.log("✅ Test completed!");

