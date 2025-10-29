// TEST_REALTIME_NOTIFICATION.js
// File này để test WebSocket notification trong Browser Console

/**
 * 🧪 TEST SUITE: WebSocket Real-Time Notification
 * 
 * Cách sử dụng:
 * 1. Mở Browser Console (F12)
 * 2. Copy toàn bộ file này
 * 3. Paste vào Console và Enter
 * 4. Chạy các test commands bên dưới
 */

console.log(`
╔═══════════════════════════════════════════════════════════╗
║   🧪 WebSocket Real-Time Notification Test Suite         ║
╚═══════════════════════════════════════════════════════════╝
`);

// ============================================
// TEST 1: Check WebSocket Service
// ============================================
console.log('📋 TEST 1: Check WebSocket Service Import');

window.testWebSocket = {
  // Test 1: Check if websocketService exists
  checkService: () => {
    console.log('\n🔍 Checking WebSocket Service...');
    
    try {
      // Import path trong production build có thể khác
      console.log('✅ WebSocket Service module should be imported via notificationService');
      console.log('   Run: testWebSocket.checkConnection()');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  },

  // Test 2: Check connection status
  checkConnection: () => {
    console.log('\n🔍 Checking WebSocket Connection Status...');
    
    // Check localStorage
    const token = localStorage.getItem('token');
    const buyerId = localStorage.getItem('buyerId');
    const userRole = localStorage.getItem('userRole');
    
    console.log('📊 Auth Status:');
    console.log('  - Token:', token ? '✅ Exists' : '❌ Missing');
    console.log('  - Buyer ID:', buyerId || '❌ Missing');
    console.log('  - User Role:', userRole || 'guest');
    
    if (!token) {
      console.warn('⚠️  No token found. Please login first!');
      return;
    }
    
    if (userRole === 'admin') {
      console.warn('⚠️  Admin users do not use WebSocket notifications');
      return;
    }
    
    console.log('\n✅ Auth OK! WebSocket should be connecting...');
    console.log('   Check for these logs:');
    console.log('   - 🔌 [WebSocket] 🔄 Connecting to backend...');
    console.log('   - ✅ [WebSocket] 🎉 Successfully connected to Backend!');
    console.log('   - 📡 [WebSocket] Subscribing to queue: /queue/notifications/' + buyerId);
  },

  // Test 3: Check notification service
  checkNotificationService: () => {
    console.log('\n🔍 Checking Notification Service...');
    
    // Check if notification service is initialized
    console.log('📊 Expected Logs (after login):');
    console.log('  - [NotificationService] Initializing... Mode: WebSocket');
    console.log('  - 🔌 [NotificationService] Starting WebSocket connection...');
    console.log('  - [NotificationService] WebSocket connected!');
    
    console.log('\n✅ If you see these logs, notification service is working!');
  },

  // Test 4: Simulate notification (local only, not from backend)
  simulateNotification: () => {
    console.log('\n🧪 Simulating Local Notification...');
    console.warn('⚠️  This only tests the UI, not the WebSocket connection!');
    
    const mockNotification = {
      notificationId: Date.now(),
      title: "TEST - Thông báo test",
      message: "Đây là notification test từ console",
      type: "success",
      isRead: false,
      createdAt: new Date().toISOString(),
      receiverId: parseInt(localStorage.getItem('buyerId') || '0')
    };
    
    console.log('📤 Dispatching test notification:', mockNotification);
    
    // Dispatch event để test popup
    window.dispatchEvent(new CustomEvent('test-notification', {
      detail: mockNotification
    }));
    
    console.log('✅ Test notification dispatched!');
    console.log('   Check if popup appears on the right side of screen');
  },

  // Test 5: Check notification API
  checkNotificationAPI: async () => {
    console.log('\n🔍 Testing Notification API...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found. Please login first!');
        return;
      }
      
      console.log('📡 Fetching notifications from API...');
      
      const response = await fetch('http://localhost:8080/api/v1/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      console.log('📊 Notification count:', Array.isArray(data) ? data.length : 0);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('📋 Latest notification:', data[0]);
      }
      
    } catch (error) {
      console.error('❌ API Error:', error);
      console.log('   - Check if backend is running on http://localhost:8080');
      console.log('   - Check if token is valid');
      console.log('   - Check CORS settings');
    }
  },

  // Test 6: Check WebSocket in Network Tab
  checkNetworkTab: () => {
    console.log('\n🔍 Manual Check: Network Tab');
    console.log('');
    console.log('Steps:');
    console.log('1. Open DevTools (F12)');
    console.log('2. Go to Network tab');
    console.log('3. Filter by "WS" (WebSocket)');
    console.log('4. Look for connection to: ws://localhost:8080/ws');
    console.log('5. Status should be: "101 Switching Protocols"');
    console.log('6. Click on the connection to see frames');
    console.log('');
    console.log('✅ If you see the WebSocket connection = SUCCESS!');
  },

  // Test 7: Full diagnostic
  fullDiagnostic: async () => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║           🔍 FULL DIAGNOSTIC TEST                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // Test 1: Auth
    console.log('1️⃣ AUTH CHECK:');
    const token = localStorage.getItem('token');
    const buyerId = localStorage.getItem('buyerId');
    const userRole = localStorage.getItem('userRole');
    
    console.log(`   Token: ${token ? '✅' : '❌'}`);
    console.log(`   Buyer ID: ${buyerId ? '✅ ' + buyerId : '❌'}`);
    console.log(`   User Role: ${userRole || 'guest'}`);
    
    if (!token) {
      console.error('\n❌ FAILED: Please login first!');
      return;
    }
    
    // Test 2: API Connection
    console.log('\n2️⃣ API CONNECTION:');
    try {
      const response = await fetch('http://localhost:8080/api/v1/notifications?page=0&size=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.ok ? '✅' : '❌'} ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Data: ✅ Received ${Array.isArray(data) ? data.length : 0} notifications`);
      }
    } catch (error) {
      console.error('   Status: ❌ Connection failed');
      console.error('   Error:', error.message);
    }
    
    // Test 3: WebSocket logs check
    console.log('\n3️⃣ WEBSOCKET LOGS CHECK:');
    console.log('   Look for these logs in console:');
    console.log('   - 🔌 [WebSocket] Connecting...');
    console.log('   - ✅ [WebSocket] Successfully connected!');
    console.log('   - 📡 [WebSocket] Subscribing to queue...');
    
    // Test 4: Summary
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║           📊 DIAGNOSTIC SUMMARY                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n✅ If all checks pass, your WebSocket is ready!');
    console.log('\n🧪 Next Steps:');
    console.log('   1. Ask admin to approve a seller request');
    console.log('   2. Watch for notification popup (< 1 second)');
    console.log('   3. Check badge count on bell icon');
    console.log('   4. Click bell to see notification list');
  },

  // Help command
  help: () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         📚 TEST COMMANDS AVAILABLE                       ║
╚═══════════════════════════════════════════════════════════╝

1. testWebSocket.checkService()
   → Check if WebSocket service is available

2. testWebSocket.checkConnection()
   → Check WebSocket connection status

3. testWebSocket.checkNotificationService()
   → Check notification service initialization

4. testWebSocket.simulateNotification()
   → Simulate a test notification (UI only)

5. testWebSocket.checkNotificationAPI()
   → Test REST API connection

6. testWebSocket.checkNetworkTab()
   → Instructions for checking Network tab

7. testWebSocket.fullDiagnostic()
   → Run full diagnostic test (RECOMMENDED)

8. testWebSocket.help()
   → Show this help message

╔═══════════════════════════════════════════════════════════╗
║  💡 TIP: Start with fullDiagnostic()                     ║
╚═══════════════════════════════════════════════════════════╝
`);
  }
};

// Auto show help
console.log('\n✅ Test Suite Loaded!');
console.log('\n💡 Quick Start:');
console.log('   testWebSocket.fullDiagnostic()  ← Run this first!');
console.log('\n📚 For all commands:');
console.log('   testWebSocket.help()');
console.log('\n');

// ============================================
// BONUS: Monitor WebSocket Messages
// ============================================

// Helper to monitor console logs for WebSocket messages
console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🎧 MONITORING WEBSOCKET MESSAGES                        ║
╚═══════════════════════════════════════════════════════════╝

WebSocket messages will appear in console with these prefixes:
  - 🔌 [WebSocket] = Connection events
  - 📡 [WebSocket] = Subscription events
  - 🔔 [WebSocket] = Incoming notifications
  - [NotificationService] = Service events

Keep this console open and watch for real-time messages!
`);

// Expose testWebSocket globally
console.log('✅ testWebSocket is now available globally');
console.log('');


