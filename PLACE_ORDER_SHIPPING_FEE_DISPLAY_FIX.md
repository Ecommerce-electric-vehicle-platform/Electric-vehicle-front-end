# ✅ Đã Sửa: Place Order Chỉ Hiển Thị Shipping Fee Từ API

## 📋 Thay Đổi

### 1. Thêm State Tracking

**File:** `src/pages/PlaceOrder/PlaceOrder.jsx`

```javascript
// State để track shipping fee đã được fetch từ API hay chưa
const [shippingFeeFromAPI, setShippingFeeFromAPI] = useState(false);
const [shippingFeeLoading, setShippingFeeLoading] = useState(false);
```

**Mục đích:**
- `shippingFeeFromAPI`: Đánh dấu shippingFee đã được fetch từ API thành công
- `shippingFeeLoading`: Đánh dấu đang fetch API

### 2. Cập Nhật Logic `refreshShippingFee`

**Thay đổi:**
1. Set `shippingFeeLoading = true` khi bắt đầu fetch
2. Set `shippingFeeFromAPI = true` khi fetch thành công
3. Set `shippingFeeFromAPI = false` khi fetch fail
4. **KHÔNG dùng fallback `50000`** - chỉ giữ giá trị hiện tại hoặc set về 0

**Code:**
```javascript
setShippingFeeLoading(true);
try {
    const res = await getShippingFee({ ... });
    // ... extract fee ...
    
    setOrderData(prev => ({
        ...prev,
        shippingFee: fee,  // Giá từ API
        ...
    }));
    
    // Đánh dấu đã fetch thành công
    setShippingFeeFromAPI(true);
} catch (e) {
    console.error('❌ Failed to fetch shipping fee from API:', e);
    // KHÔNG dùng fallback 50000
    setOrderData(prev => ({
        ...prev,
        shippingFee: prev.shippingFee || 0,  // Chỉ giữ giá cũ hoặc 0
        ...
    }));
    setShippingFeeFromAPI(false);
} finally {
    setShippingFeeLoading(false);
}
```

### 3. Cập Nhật UI Display

**Trước (SAI - có fallback 50000):**
```javascript
{formatCurrency(orderData.shippingFee || 50000)}
```

**Sau (ĐÚNG - chỉ hiển thị từ API):**
```javascript
{shippingFeeLoading ? (
    <span className="text-muted-foreground">Đang tính...</span>
) : shippingFeeFromAPI && orderData.shippingFee > 0 ? (
    formatCurrency(orderData.shippingFee)  // ✅ Chỉ hiển thị từ API
) : (
    <span className="text-muted-foreground">Chưa có</span>
)}
```

## ✅ Kết Quả

### Trước:
- ❌ Hiển thị `50000` nếu chưa fetch API (fallback)
- ❌ User có thể thấy giá sai (50000 thay vì giá thực từ API)

### Sau:
- ✅ Hiển thị "Đang tính..." khi đang fetch API
- ✅ Chỉ hiển thị giá khi đã fetch thành công từ API
- ✅ Hiển thị "Chưa có" nếu chưa fetch hoặc fetch fail
- ✅ **KHÔNG có fallback giá sai**

## 🎯 Logic Hiển Thị

| Trạng Thái | Hiển Thị |
|-----------|----------|
| **Đang fetch API** | "Đang tính..." |
| **Đã fetch thành công** | `formatCurrency(orderData.shippingFee)` ✅ |
| **Chưa fetch hoặc fail** | "Chưa có" |
| **Giá = 0** | "Chưa có" |

## 📊 Flow

```
1. User chọn địa chỉ
   ↓
2. refreshShippingFee() được gọi
   ↓
3. setShippingFeeLoading(true)
   → UI hiển thị: "Đang tính..."
   ↓
4. Gọi API /api/v1/shipping/shipping-fee
   ↓
5. Success:
   → setShippingFeeFromAPI(true)
   → setOrderData({ shippingFee: 561000 })
   → UI hiển thị: "561,000 VND" ✅
   ↓
   Fail:
   → setShippingFeeFromAPI(false)
   → setOrderData({ shippingFee: 0 })
   → UI hiển thị: "Chưa có"
```

## ✅ Đảm Bảo

1. ✅ **Chỉ hiển thị giá từ API**: `shippingFeeFromAPI && orderData.shippingFee > 0`
2. ✅ **Không có fallback sai**: Không dùng `|| 50000`
3. ✅ **Loading state**: Hiển thị "Đang tính..." khi đang fetch
4. ✅ **Error handling**: Hiển thị "Chưa có" nếu fetch fail

## 📝 Tóm Tắt

**Đã sửa:**
- ✅ Thêm state tracking `shippingFeeFromAPI` và `shippingFeeLoading`
- ✅ Cập nhật logic `refreshShippingFee` để set flag đúng
- ✅ Cập nhật UI để chỉ hiển thị giá từ API
- ✅ Loại bỏ fallback `50000`

**Kết quả:**
- ✅ Place Order chỉ hiển thị shipping fee từ API `/api/v1/shipping/shipping-fee`
- ✅ Không hiển thị giá fallback sai
- ✅ User chỉ thấy giá chính xác từ API

