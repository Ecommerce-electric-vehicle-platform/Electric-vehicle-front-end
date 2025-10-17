// Script để thiết lập môi trường test cho PlaceOrder
// Chạy script này trong Console của browser để thiết lập nhanh

console.log('🔧 Thiết lập môi trường test PlaceOrder...');

// Thiết lập mặc định cho test flow hoàn chỉnh
localStorage.setItem('walletLinked', 'true');           // Đã liên kết ví
localStorage.setItem('testProductScenario', 'available'); // Sản phẩm còn hàng
localStorage.setItem('testMultipleSellers', 'false');   // 1 người bán

console.log('✅ Đã thiết lập:');
console.log('   💳 Ví điện tử: Đã liên kết');
console.log('   📦 Sản phẩm: Còn hàng');
console.log('   🛒 Giỏ hàng: 1 người bán');
console.log('');
console.log('🚀 Bây giờ bạn có thể:');
console.log('   1. Vào trang chi tiết sản phẩm (/product/1)');
console.log('   2. Click "Mua ngay"');
console.log('   3. Xem flow đặt hàng hoàn chỉnh');
console.log('');
console.log('📋 Các flow sẽ diễn ra:');
console.log('   ✅ Validation Screen (1-2 giây)');
console.log('   ✅ Form đặt hàng');
console.log('   ✅ Xác nhận đơn hàng');
console.log('   ✅ Đặt hàng thành công');
console.log('');
console.log('🔄 Để test các trường hợp khác:');
console.log('   - Sản phẩm hết hàng: localStorage.setItem("testProductScenario", "sold")');
console.log('   - Chưa liên kết ví: localStorage.setItem("walletLinked", "false")');
console.log('   - Nhiều người bán: localStorage.setItem("testMultipleSellers", "true")');
console.log('   - Reset về mặc định: localStorage.clear()');

// Tạo helper functions để dễ test
window.testPlaceOrder = {
    // Thiết lập sản phẩm còn hàng
    setProductAvailable: () => {
        localStorage.setItem('testProductScenario', 'available');
        console.log('✅ Đã thiết lập: Sản phẩm còn hàng');
    },

    // Thiết lập sản phẩm hết hàng
    setProductSold: () => {
        localStorage.setItem('testProductScenario', 'sold');
        console.log('❌ Đã thiết lập: Sản phẩm đã bán');
    },

    // Thiết lập ví đã liên kết
    setWalletLinked: () => {
        localStorage.setItem('walletLinked', 'true');
        console.log('✅ Đã thiết lập: Ví đã liên kết');
    },

    // Thiết lập ví chưa liên kết
    setWalletUnlinked: () => {
        localStorage.setItem('walletLinked', 'false');
        console.log('❌ Đã thiết lập: Ví chưa liên kết');
    },

    // Thiết lập nhiều người bán
    setMultipleSellers: () => {
        localStorage.setItem('testMultipleSellers', 'true');
        console.log('⚠️ Đã thiết lập: Nhiều người bán');
    },

    // Reset về mặc định
    reset: () => {
        localStorage.setItem('walletLinked', 'true');
        localStorage.setItem('testProductScenario', 'available');
        localStorage.setItem('testMultipleSellers', 'false');
        console.log('🔄 Đã reset về mặc định');
    },

    // Hiển thị trạng thái hiện tại
    status: () => {
        console.log('📊 Trạng thái hiện tại:');
        console.log('   💳 Ví:', localStorage.getItem('walletLinked') === 'true' ? 'Đã liên kết' : 'Chưa liên kết');
        console.log('   📦 Sản phẩm:', localStorage.getItem('testProductScenario') === 'available' ? 'Còn hàng' : 'Hết hàng');
        console.log('   🛒 Người bán:', localStorage.getItem('testMultipleSellers') === 'true' ? 'Nhiều người bán' : '1 người bán');
    }
};

console.log('');
console.log('🛠️ Helper functions đã sẵn sàng:');
console.log('   testPlaceOrder.setProductAvailable() - Sản phẩm còn hàng');
console.log('   testPlaceOrder.setProductSold() - Sản phẩm hết hàng');
console.log('   testPlaceOrder.setWalletLinked() - Ví đã liên kết');
console.log('   testPlaceOrder.setWalletUnlinked() - Ví chưa liên kết');
console.log('   testPlaceOrder.setMultipleSellers() - Nhiều người bán');
console.log('   testPlaceOrder.reset() - Reset về mặc định');
console.log('   testPlaceOrder.status() - Xem trạng thái hiện tại');
