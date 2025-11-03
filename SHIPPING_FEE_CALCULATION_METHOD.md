# Phương Thức Tính Phí Ship: API Hay Frontend Tự Tính?

## 🎯 Trả Lời Ngắn Gọn

**Phí ship được tính bởi API (Backend), Frontend chỉ gọi API và lấy kết quả.**

## 📊 Phân Tích Chi Tiết

### 1. Frontend Gọi API Shipping Fee

**File: `orderApi.js` (Lines 18-29)**

```javascript
export const getShippingFee = async ({ 
    postId, 
    provinceName, 
    districtName, 
    wardName, 
    provinceId, 
    districtId, 
    wardId, 
    paymentId 
}) => {
    const payload = { postId, provinceName, districtName, wardName, provinceId, districtId, wardId, paymentId };
    
    // ✅ GỌI API Backend để tính phí ship
    const res = await axiosInstance.post('/api/v1/shipping/shipping-fee', payload);
    
    return res.data;
};
```

**API Endpoint:** `POST /api/v1/shipping/shipping-fee`

**Chức năng:**
- ✅ Frontend gửi thông tin: `postId`, địa chỉ, `paymentId`
- ✅ Backend tính phí ship và trả về
- ✅ Frontend nhận kết quả

### 2. Frontend Extract Giá Trị Từ Response

**File: `PlaceOrder.jsx` (Lines 616-641)**

```javascript
// ✅ GỌI API để lấy phí ship (Backend tính)
const res = await getShippingFee({ 
    postId, 
    provinceName, 
    districtName, 
    wardName, 
    provinceId, 
    districtId, 
    wardId, 
    paymentId 
});

// ✅ EXTRACT giá trị từ response (KHÔNG tự tính)
const raw = res?.data ?? res ?? {};
const data = raw?.data ?? raw;
const fee = Number(
    data?.total ??           // ← Lấy từ API response
    data?.shippingFee ??
    data?.fee ??
    0
);
```

**Chức năng:**
- ✅ Frontend chỉ extract giá trị từ API response
- ❌ Frontend KHÔNG tự tính phí ship
- ✅ Sử dụng giá trị Backend đã tính

### 3. Response Structure Từ Backend

**API Response:**
```json
{
  "success": true,
  "data": {
    "total": "561000",              // ← Backend đã tính tổng
    "service_fee": "550000",
    "insurance_fee": "0",
    "pick_station_fee": "0",
    "cod_fee": "0",
    "pick_remote_areas_fee": "11000",
    "deliver_remote_areas_fee": "0"
  }
}
```

**Backend tính:**
- `service_fee`: 550000
- `pick_remote_areas_fee`: 11000
- `total = 561000` (tổng các phí)

**Frontend chỉ lấy:**
- `fee = Number(data.total)` = `561000`

## ✅ Kết Luận

| Aspect | Backend | Frontend |
|--------|---------|----------|
| **Tính phí ship** | ✅ Có (API `/api/v1/shipping/shipping-fee`) | ❌ Không |
| **Gọi API** | - | ✅ Có |
| **Extract giá trị** | - | ✅ Có (lấy từ response) |
| **Hiển thị** | - | ✅ Có |
| **Gửi trong request** | - | ✅ Có (gửi lại giá đã nhận) |

## 📝 Luồng Xử Lý

```
1. User chọn địa chỉ giao hàng
   ↓
2. Frontend gọi API: POST /api/v1/shipping/shipping-fee
   ↓
3. Backend tính phí ship:
   - service_fee: 550000
   - pick_remote_areas_fee: 11000
   - total: 561000
   ↓
4. Backend trả về response: { data: { total: "561000", ... } }
   ↓
5. Frontend extract: fee = 561000
   ↓
6. Frontend hiển thị: 561000 cho user
   ↓
7. Khi place order, Frontend gửi lại: shippingFee: 561000
   ↓
8. Backend nhận và nên lưu: shipping_fee = 561000
```

## 🔍 Chi Tiết Kỹ Thuật

### Backend Tính Phí Ship:

**Backend có thể:**
1. Gọi API GHN để tính phí dựa trên:
   - Địa chỉ gửi (từ post-product)
   - Địa chỉ nhận (từ user input)
   - Khối lượng/kích thước sản phẩm
   - Phương thức thanh toán (COD có thể thêm phí)

2. Tính các loại phí:
   - `service_fee`: Phí dịch vụ vận chuyển
   - `cod_fee`: Phí COD (nếu paymentId = 1)
   - `pick_remote_areas_fee`: Phí vùng xa
   - `insurance_fee`: Phí bảo hiểm
   - `total`: Tổng các phí

### Frontend Chỉ Extract:

**Frontend KHÔNG tính:**
- ❌ Không có logic tính phí ship
- ❌ Không có công thức tính toán
- ❌ Không gọi API GHN trực tiếp

**Frontend CHỈ làm:**
- ✅ Gọi API `/api/v1/shipping/shipping-fee`
- ✅ Extract giá trị từ response: `data.total`
- ✅ Hiển thị cho user
- ✅ Gửi lại trong request place order

## 🎯 Tóm Tắt

**Câu trả lời:**
- ✅ **Phí ship được tính bởi API (Backend)**
- ❌ **Frontend KHÔNG tự tính phí ship**
- ✅ **Frontend chỉ gọi API, extract giá trị, và gửi lại**

**Backend chịu trách nhiệm:**
- Tính toán tất cả các loại phí ship
- Trả về tổng phí ship cho Frontend

**Frontend chịu trách nhiệm:**
- Gọi API để lấy phí ship
- Extract và hiển thị cho user
- Gửi lại giá trị trong request place order

