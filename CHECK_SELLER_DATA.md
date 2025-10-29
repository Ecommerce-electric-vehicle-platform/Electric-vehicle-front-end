# Kiểm tra Seller Data

## Từ Data Seed của bạn:

### ✅ SELLER TABLE đã có:
```sql
seller_id = 1
buyer_id = 1 (doanvien)
store_name = 'Electrical vehicle store'
seller_name = 'TRƯƠNG ĐOÀN VIÊN'
identity_number = '075205014623'
status = 'ACCEPTED'
```

### ✅ Tất cả POST_PRODUCT đều có:
```sql
seller_id = 1
admin_id = NULL
```

## Vấn đề có thể xảy ra:

### 1. Backend API có thể không JOIN seller data
Backend có thể chỉ trả về `seller_id` mà không JOIN bảng `seller` để lấy thông tin chi tiết.

### 2. Response structure có thể là:
```json
// Case 1: Backend KHÔNG JOIN
{
  "postId": 1,
  "title": "Xe đạp điện Pega Aura...",
  "seller_id": 1,  // ❌ Chỉ có ID
  ...
}

// Case 2: Backend CÓ JOIN
{
  "postId": 1,
  "title": "Xe đạp điện Pega Aura...",
  "sellerId": 1,
  "seller": {      // ✅ Có seller object
    "id": 1,
    "fullName": "TRƯƠNG ĐOÀN VIÊN",
    "storeName": "Electrical vehicle store",
    "phone": "...",
    "email": "vientruongdoan@gmail.com"
  },
  ...
}
```

## Giải pháp:

### Option 1: Backend thêm Seller info vào response (Đề xuất)
Backend nên JOIN và trả về:
```json
{
  "data": {
    "postId": 1,
    "title": "...",
    "sellerId": 1,
    "seller": {
      "sellerId": 1,
      "sellerName": "TRƯƠNG ĐOÀN VIÊN",
      "storeName": "Electrical vehicle store",
      "email": "vientruongdoan@gmail.com",
      "phone": "0792043114",
      "avatar": "..."
    }
  }
}
```

### Option 2: Frontend tự fetch (Đã implement)
Frontend sẽ gọi `/api/v1/seller/{sellerId}` để lấy seller info riêng.

## Kiểm tra nhanh:

1. Mở browser console
2. Xem log khi vào Product Detail
3. Kiểm tra API response có seller object không

## Debug Info:

```javascript
// Trong ProductDetail.jsx
console.log('Product:', product);
console.log('Seller ID:', product.sellerId);
console.log('Seller Info from product:', product.seller);
```

Nếu `product.seller` là undefined → Backend chưa JOIN
→ Frontend sẽ tự fetch từ `/api/v1/seller/{sellerId}`

## Cần verify:

Backend có endpoint `/api/v1/seller/1` (public) để trả về seller info không?

