import React, { useEffect } from 'react';

// Component để tự động thiết lập môi trường test
function TestEnvironmentSetup() {
    useEffect(() => {
        // Clear tất cả settings cũ
        localStorage.removeItem('testProductScenario');
        localStorage.removeItem('testMultipleSellers');
        localStorage.removeItem('testProductSold');
        localStorage.removeItem('testProductUnavailable');

        // Thiết lập mặc định cho test flow hoàn chỉnh
        localStorage.setItem('walletLinked', 'true');           // Đã liên kết ví
        localStorage.setItem('testMultipleSellers', 'false');   // 1 người bán

        console.log('🔧 Đã tự động thiết lập môi trường test:');
        console.log('   💳 Ví điện tử: Đã liên kết');
        console.log('   📦 Sản phẩm: Sử dụng trạng thái thực từ dữ liệu');
        console.log('   🛒 Giỏ hàng: 1 người bán');
        console.log('   🧹 Đã xóa tất cả settings test cũ');
        console.log('');
        console.log('🚀 Bây giờ bạn có thể test flow đặt hàng hoàn chỉnh!');
        console.log('📋 Sản phẩm có sẵn để test:');
        console.log('   - VinFast Feliz S (ID: 1)');
        console.log('   - Giant M133S (ID: 3)');
        console.log('   - VinFast Evo200 (ID: 9)');
        console.log('   - DK Bike Roma (ID: 10)');
        console.log('   - Yadea BuyE (ID: 11)');
        console.log('   - Gogo Elite (ID: 12)');
        console.log('   - VinFast Klara A2 (ID: 13)');
        console.log('   - Dibao Gogo SS (ID: 14)');
        console.log('');
        console.log('🔍 Debug info:');
        console.log('   testProductScenario:', localStorage.getItem('testProductScenario'));
        console.log('   walletLinked:', localStorage.getItem('walletLinked'));
        console.log('   testMultipleSellers:', localStorage.getItem('testMultipleSellers'));
    }, []);

    return null; // Component không render gì
}

export default TestEnvironmentSetup;
