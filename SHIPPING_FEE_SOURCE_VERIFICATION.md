# Xác Nhận: Nguồn Shipping Fee Trong Place Order

## ✅ Xác Nhận Flow Hiện Tại

### 1. API Call

**File:** `src/api/orderApi.js`

```javascript
export const getShippingFee = async ({ postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId }) => {
    const payload = { postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId };
    const res = await axiosInstance.post('/api/v1/shipping/shipping-fee', payload);
    return res.data;  // → { success, message, data: { total: "561000", ... }, error }
};
```

**Kết luận:** ✅ Gọi API `/api/v1/shipping/shipping-fee`

### 2. Trigger Khi Nào?

**File:** `src/pages/PlaceOrder/PlaceOrder.jsx`

**useEffect tự động:**
```javascript
useEffect(() => {
    refreshShippingFee();
}, [refreshShippingFee]);
```

**Dependencies của `refreshShippingFee`:**
```javascript
[orderData.postProductId, orderData.paymentId, orderData.provinceId, orderData.districtId, orderData.wardId, 
 selectedProvince, selectedDistrict, selectedWard, product?.id, provinces, districts, wards]
```

**Kết luận:** ✅ Tự động gọi khi:
- Địa chỉ thay đổi (provinceId, districtId, wardId)
- Phương thức thanh toán thay đổi (paymentId)
- Product thay đổi (postProductId, product?.id)

### 3. Extraction Logic

**File:** `src/pages/PlaceOrder/PlaceOrder.jsx`

```javascript
const refreshShippingFee = useCallback(async () => {
    // ... validation ...
    
    setShippingFeeLoading(true);
    const res = await getShippingFee({ postId, provinceName, districtName, wardName, ... });
    
    // Extract từ res.data.total (primary path)
    if (res?.data?.total) {
        fee = Number(res.data.total);  // → "561000" → 561000
        extractedFrom = 'res.data.total';
    } else if (res?.data?.shippingFee) {
        fee = Number(res.data.shippingFee);
        extractedFrom = 'res.data.shippingFee';
    }
    // ... other fallbacks ...
    
    setOrderData(prev => ({
        ...prev,
        shippingFee: fee,  // ✅ Lưu giá từ API
        final_price: (prev.total_price || 0) + fee
    }));
    
    setShippingFeeFromAPI(true);  // ✅ Đánh dấu đã fetch từ API
}, [dependencies]);
```

**Kết luận:** ✅ Extract từ `res.data.total` → Lưu vào `orderData.shippingFee`

### 4. Display Logic

**File:** `src/pages/PlaceOrder/PlaceOrder.jsx`

```javascript
{shippingFeeLoading ? (
    <span className="text-muted-foreground">Đang tính...</span>
) : shippingFeeFromAPI && orderData.shippingFee > 0 ? (
    formatCurrency(orderData.shippingFee)  // ✅ Hiển thị giá từ API
) : (
    <span className="text-muted-foreground">Chưa có</span>
)}
```

**Kết luận:** ✅ Chỉ hiển thị khi:
- `shippingFeeFromAPI = true` (đã fetch thành công)
- `orderData.shippingFee > 0` (có giá trị hợp lệ)

## 📊 Flow Hoàn Chỉnh

```
1. User chọn địa chỉ hoặc payment method
   ↓
2. useEffect trigger refreshShippingFee()
   ↓
3. setShippingFeeLoading(true)
   → UI hiển thị: "Đang tính..."
   ↓
4. Gọi API: POST /api/v1/shipping/shipping-fee
   Payload: { postId, provinceName, districtName, wardName, paymentId, ... }
   ↓
5. API trả về: { success: true, data: { total: "561000", ... } }
   ↓
6. Extract: fee = Number(res.data.total) → 561000
   ↓
7. setOrderData({ shippingFee: 561000 })
   setShippingFeeFromAPI(true)
   ↓
8. UI hiển thị: formatCurrency(561000) → "561.000 đ" ✅
```

## ✅ Kết Luận

**Phí vận chuyển trong Place Order:**

1. ✅ **Được GỌI từ API:** `/api/v1/shipping/shipping-fee`
2. ✅ **KHÔNG tự tính:** Frontend không có logic tự tính
3. ✅ **Extract từ:** `res.data.total` (primary path)
4. ✅ **Hiển thị khi:** `shippingFeeFromAPI = true && orderData.shippingFee > 0`
5. ✅ **Giá trị:** `561000` (từ API response)

## 🔍 Verification

**Để xác nhận, kiểm tra console logs:**

1. **Khi gọi API:**
   ```
   📦 Shipping fee payload: { postId: 22, provinceName: "Bình Dương", ... }
   🚀 Shipping fee response: { success: true, data: { total: "561000", ... } }
   ```

2. **Khi extract:**
   ```
   💰 Extracted shipping fee: {
     fee: 561000,
     extractedFrom: 'res.data.total',
     ...
   }
   ```

3. **Khi set vào state:**
   ```
   📝 Setting shippingFee in orderData: {
     new: 561000,
     source: 'refreshShippingFee',
     ...
   }
   ```

4. **Khi hiển thị:**
   - UI check: `shippingFeeFromAPI = true && orderData.shippingFee = 561000`
   - Display: `formatCurrency(561000)` → "561.000 đ"

## 📝 Tóm Tắt

**Phí vận chuyển "561.000 đ" được:**
- ✅ **Gọi từ:** API `/api/v1/shipping/shipping-fee`
- ✅ **Extract từ:** `res.data.total` → `561000`
- ✅ **Hiển thị:** `formatCurrency(561000)` → "561.000 đ"
- ✅ **KHÔNG tự tính:** Frontend không có logic tính toán riêng

**Nguồn duy nhất:** Backend API `/api/v1/shipping/shipping-fee` ✅

