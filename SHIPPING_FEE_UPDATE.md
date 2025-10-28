# Cập Nhật Hệ Thống Phí Vận Chuyển

## 🎯 Thay Đổi Chính

### ❌ **Đã Loại Bỏ:**
1. **Phí kiểm định** - Không còn phí kiểm định trong hệ thống
2. **Badge "Đã kiểm định"** - Bỏ hiển thị trạng thái kiểm định
3. **Phí cố định** - Không còn sử dụng phí vận chuyển cố định

### ✅ **Đã Thêm:**
1. **Tính phí dựa trên khoảng cách** - Phí vận chuyển được tính theo công thức
2. **Thông tin chi tiết** - Hiển thị khoảng cách và cách tính phí
3. **Logic linh hoạt** - Có thể dễ dàng thay đổi công thức tính phí

## 🧮 Công Thức Tính Phí Vận Chuyển

```javascript
Phí vận chuyển = Phí cơ bản + (Khoảng cách × Phí mỗi km)

Ví dụ:
- Phí cơ bản: 30,000₫
- Phí mỗi km: 5,000₫
- Khoảng cách: 25km
- Tổng phí: 30,000 + (25 × 5,000) = 155,000₫
```

## 🔧 Cấu Hình Hiện Tại

### Trong `calculateShippingFee()`:
```javascript
const baseFee = 30000;        // Phí cơ bản: 30,000₫
const perKmFee = 5000;        // Phí mỗi km: 5,000₫
```

### Thông tin được lưu trong `orderData`:
```javascript
{
    shippingFee: 155000,           // Tổng phí vận chuyển
    shipping_distance: 25,         // Khoảng cách (km)
    shipping_base_fee: 30000,      // Phí cơ bản
    shipping_per_km_fee: 5000      // Phí mỗi km
}
```

## 📱 Hiển Thị Trên UI

### Order Summary:
```
Phí vận chuyển: 155,000₫
Khoảng cách: 25km
Phí cơ bản: 30,000₫ + 5,000₫/km
```

### Order Confirmation:
```
Phí vận chuyển: 155,000₫
(Dựa trên khoảng cách)
```

## 🚀 Tích Hợp API Thực

### 1. API Tính Khoảng Cách
```javascript
// Thay thế mock data bằng API thực
const calculateRealDistance = async (sellerLocation, buyerLocation) => {
    const response = await fetch('/api/calculate-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: sellerLocation,
            to: buyerLocation
        })
    });
    return response.json();
};
```

### 2. API Lấy Thông Tin Seller
```javascript
// Lấy vị trí seller từ API
const getSellerLocation = async (sellerId) => {
    const response = await fetch(`/api/sellers/${sellerId}/location`);
    return response.json();
};
```

### 3. API Lấy Địa Chỉ Buyer
```javascript
// Lấy địa chỉ buyer từ profile
const getBuyerLocation = async () => {
    const response = await profileApi.getProfile();
    return response.data.shippingAddress;
};
```

## 🔄 Cập Nhật Logic

### Khi Thay Đổi Địa Chỉ:
1. Recalculate shipping fee
2. Update order total
3. Refresh UI

```javascript
const handleAddressChange = async (newAddress) => {
    const shippingCalculation = calculateShippingFee(
        sellerLocation,
        newAddress
    );
    
    setOrderData(prev => ({
        ...prev,
        shippingAddress: newAddress,
        shippingFee: shippingCalculation.fee,
        shipping_distance: shippingCalculation.distance,
        final_price: prev.total_price + shippingCalculation.fee
    }));
};
```

## 📊 Các Trường Hợp Đặc Biệt

### 1. Khoảng Cách Gần (< 5km)
- Phí tối thiểu: 30,000₫
- Không tính phí theo km

### 2. Khoảng Cách Xa (> 100km)
- Có thể áp dụng giảm giá
- Hoặc chuyển sang phương thức vận chuyển khác

### 3. Lỗi Tính Khoảng Cách
- Fallback về phí cố định: 50,000₫
- Hiển thị thông báo cho user

## 🎨 UI/UX Improvements

### 1. Loading State
```javascript
{isCalculatingShipping && (
    <div className="shipping-loading">
        <Spinner />
        <span>Đang tính phí vận chuyển...</span>
    </div>
)}
```

### 2. Error State
```javascript
{shippingError && (
    <div className="shipping-error">
        <AlertCircle />
        <span>Không thể tính phí vận chuyển. Sử dụng phí mặc định.</span>
    </div>
)}
```

### 3. Success State
```javascript
{shippingCalculation && (
    <div className="shipping-success">
        <CheckCircle />
        <span>Phí vận chuyển: {formatCurrency(shippingCalculation.fee)}</span>
    </div>
)}
```

## 🧪 Testing

### Test Cases:
1. **Khoảng cách gần** (< 5km)
2. **Khoảng cách trung bình** (5-50km)
3. **Khoảng cách xa** (> 50km)
4. **Lỗi API** (fallback)
5. **Địa chỉ không hợp lệ**

### Mock Data:
```javascript
const testCases = [
    { from: 'Hà Nội', to: 'Hà Nội', expected: 30000 },
    { from: 'Hà Nội', to: 'Hải Phòng', expected: 80000 },
    { from: 'Hà Nội', to: 'TP.HCM', expected: 280000 }
];
```

## 📈 Performance

### Optimization:
1. **Cache kết quả** tính toán khoảng cách
2. **Debounce** khi user nhập địa chỉ
3. **Lazy load** API tính khoảng cách
4. **Background calculation** cho các địa chỉ phổ biến

## 🔒 Security

### Validation:
1. **Sanitize** địa chỉ input
2. **Rate limit** API calls
3. **Validate** khoảng cách hợp lệ
4. **Log** các request bất thường

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Verify địa chỉ input
3. Check API response
4. Test với mock data
