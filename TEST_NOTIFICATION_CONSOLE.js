/**
 * 🧪 NOTIFICATION SYSTEM - QUICK TEST SCRIPT
 * 
 * Copy toàn bộ file này và paste vào Console (F12) để test notification system
 * 
 * Date: 28/10/2025
 */

console.log('🔔 === NOTIFICATION SYSTEM TEST === 🔔\n');

// ========================================
// TEST 1: Kiểm tra Auth Token
// ========================================
console.log('📋 TEST 1: Check Auth Token');
const token = localStorage.getItem('token');
const accessToken = localStorage.getItem('accessToken');
const userRole = localStorage.getItem('userRole');
const buyerId = localStorage.getItem('buyerId');
const sellerId = localStorage.getItem('sellerId');

console.log('✅ Token:', token ? '✓ OK' : '❌ MISSING');
console.log('✅ AccessToken:', accessToken ? '✓ OK' : '❌ MISSING');
console.log('✅ UserRole:', userRole || '❌ MISSING');
console.log('✅ BuyerId:', buyerId || 'N/A');
console.log('✅ SellerId:', sellerId || 'N/A');

if (!token && !accessToken) {
  console.error('❌ CRITICAL: No token found! Please login first.');
  console.log('\n🔄 Redirect to login page in 3 seconds...');
  setTimeout(() => window.location.href = '/signin', 3000);
}

console.log('\n');

// ========================================
// TEST 2: Kiểm tra Backend API
// ========================================
console.log('📋 TEST 2: Check Backend API');
console.log('⏳ Fetching notifications from backend...\n');

fetch('http://localhost:8080/api/v1/notifications', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken || token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📡 Response Status:', response.status);
  
  if (response.status === 401) {
    console.error('❌ ERROR: 401 Unauthorized - Token không hợp lệ hoặc hết hạn');
    console.log('💡 Tip: Thử đăng nhập lại');
    throw new Error('Unauthorized');
  }
  
  if (response.status === 404) {
    console.error('❌ ERROR: 404 Not Found - Backend chưa có endpoint /api/v1/notifications');
    console.log('💡 Tip: Kiểm tra backend có implement API này chưa');
    throw new Error('Not Found');
  }
  
  if (response.status === 500) {
    console.error('❌ ERROR: 500 Internal Server Error - Backend có lỗi');
    console.log('💡 Tip: Check backend logs');
    throw new Error('Server Error');
  }
  
  return response.json();
})
.then(data => {
  console.log('✅ API Response:', data);
  console.log('\n📊 Notifications Count:', Array.isArray(data) ? data.length : 0);
  
  if (Array.isArray(data) && data.length > 0) {
    console.log('✅ SUCCESS: Found', data.length, 'notification(s)\n');
    console.table(data);
    
    // Check format
    console.log('\n📋 Checking Backend Response Format...');
    const firstNotif = data[0];
    
    console.log('Has notificationId:', firstNotif.notificationId ? '✅' : '❌');
    console.log('Has title:', firstNotif.title ? '✅' : '❌');
    console.log('Has content:', firstNotif.content ? '✅' : '❌');
    console.log('Has type:', firstNotif.type ? '✅' : '❌');
    console.log('Has createdAt:', firstNotif.createdAt ? '✅' : '❌');
    console.log('Has readAt:', typeof firstNotif.readAt !== 'undefined' ? '✅' : '❌');
    
    // Test transform
    console.log('\n🔄 Testing Frontend Transform...');
    const transformedNotif = {
      notificationId: firstNotif.notificationId,
      title: firstNotif.title || "Thông báo",
      message: firstNotif.content || "", // Backend dùng 'content'
      type: detectNotificationType(firstNotif.title, firstNotif.content),
      isRead: !!firstNotif.readAt,
      createdAt: firstNotif.createdAt || firstNotif.sendAt,
      receiverId: firstNotif.receiverId,
    };
    
    console.log('✅ Transformed Notification:', transformedNotif);
    console.log('📌 Type detected:', transformedNotif.type);
    console.log('📌 IsRead:', transformedNotif.isRead);
    
  } else if (Array.isArray(data) && data.length === 0) {
    console.warn('⚠️ WARNING: Backend returned empty array []');
    console.log('💡 Tip: Backend chưa có notification nào. Thử:');
    console.log('   1. Admin approve seller KYC');
    console.log('   2. Tạo notification test từ backend');
  } else {
    console.warn('⚠️ WARNING: Unexpected response format');
    console.log('Expected: Array of notifications');
    console.log('Received:', typeof data);
  }
})
.catch(error => {
  console.error('❌ ERROR:', error.message);
  console.log('💡 Tip: Check network tab for more details');
});

// Helper function
function detectNotificationType(title = "", content = "") {
  const text = (title + " " + content).toLowerCase();
  
  const successKeywords = [
    "phê duyệt", "thành công", "hoàn thành", "chấp nhận", 
    "approved", "success", "completed", "accepted"
  ];
  
  const errorKeywords = [
    "từ chối", "thất bại", "lỗi", "hủy", "rejected", 
    "failed", "error", "cancelled", "denied"
  ];
  
  const warningKeywords = [
    "cảnh báo", "chú ý", "lưu ý", "warning", 
    "attention", "notice", "pending"
  ];
  
  if (successKeywords.some(keyword => text.includes(keyword))) {
    return "success";
  }
  
  if (errorKeywords.some(keyword => text.includes(keyword))) {
    return "error";
  }
  
  if (warningKeywords.some(keyword => text.includes(keyword))) {
    return "warning";
  }
  
  return "info";
}

console.log('\n');

// ========================================
// TEST 3: Kiểm tra Frontend State
// ========================================
console.log('📋 TEST 3: Check Frontend State');
console.log('💡 Tip: Click vào chuông 🔔 và check Console logs');
console.log('Expected logs:');
console.log('  [API] Calling GET /api/v1/notifications');
console.log('  [API] Raw response from backend:');
console.log('  [API] Transformed notification:');
console.log('  [API] Final result:');

console.log('\n');

// ========================================
// TEST 4: Quick Test notificationApi
// ========================================
console.log('📋 TEST 4: Test notificationApi.getNotifications()');
console.log('⏳ Running test...\n');

// Check if notificationApi is available
if (typeof notificationApi !== 'undefined') {
  notificationApi.getNotifications(0, 20)
    .then(result => {
      console.log('✅ notificationApi.getNotifications() SUCCESS');
      console.log('Result:', result);
      console.log('Notifications:', result?.data?.notifications);
      console.log('Total:', result?.data?.notifications?.length || 0);
    })
    .catch(error => {
      console.error('❌ notificationApi.getNotifications() ERROR');
      console.error(error);
    });
} else {
  console.warn('⚠️ notificationApi is not available in global scope');
  console.log('💡 This is normal. API calls are done internally by components.');
}

console.log('\n');

// ========================================
// SUMMARY
// ========================================
console.log('📊 === TEST SUMMARY ===');
console.log('✅ Auth token: Check console above');
console.log('✅ Backend API: Check console above');
console.log('⏭️ Next steps:');
console.log('   1. Click vào chuông 🔔 trên header');
console.log('   2. Check dropdown có hiển thị notifications không');
console.log('   3. Click vào 1 notification để test mark as read');
console.log('   4. Check badge số có giảm không');
console.log('\n');

console.log('💡 === DEBUGGING TIPS ===');
console.log('Nếu không thấy notifications:');
console.log('  1. Check Console logs khi click chuông');
console.log('  2. Check Network tab → Filter: notifications');
console.log('  3. Check Response có data không');
console.log('  4. Nếu Response là [], backend chưa có notification');
console.log('  5. Nếu Response là 404, backend chưa implement API');
console.log('  6. Nếu Response là 401, token hết hạn → Đăng nhập lại');
console.log('\n');

console.log('🚀 === READY TO TEST === 🚀');
console.log('Giờ hãy click vào chuông 🔔 và xem kết quả!\n');
