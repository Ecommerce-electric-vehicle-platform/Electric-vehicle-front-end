# Debug Profile Fields

## Vấn đề đã sửa
Đã sửa logic validation để sử dụng đúng tên trường từ API:
- **Trước**: Kiểm tra `defaultShippingAddress` (không tồn tại)
- **Sau**: Kiểm tra `street` (tên trường thực tế từ API)

## Cách kiểm tra

### Bước 1: Mở Developer Tools
1. Nhấn F12 hoặc chuột phải → Inspect
2. Chuyển đến tab **Console**

### Bước 2: Truy cập trang Place Order
1. Đi đến trang Place Order
2. Xem log debug trong console

### Bước 3: Kiểm tra dữ liệu profile
Bạn sẽ thấy log như:
```javascript
🔍 Profile validation: {
  profileData: {
    fullName: "Phan Vy",
    phoneNumber: "0848904939", 
    email: "Phanthithaovy05032005@gmail.com",
    street: "123 Đường ABC", // ← Trường này cần có
    provinceId: "79",        // ← Trường này cần có
    districtId: "760",       // ← Trường này cần có
    wardId: "26734"          // ← Trường này cần có
  },
  requiredFields: ["fullName", "phoneNumber", "email", "street", "provinceId", "districtId", "wardId"],
  missingFields: [] // ← Nếu rỗng thì profile đầy đủ
}
```

## Các trường cần kiểm tra

### 1. Thông tin cơ bản (đã có)
- ✅ `fullName`: "Phan Vy"
- ✅ `phoneNumber`: "0848904939"
- ✅ `email`: "Phanthithaovy05032005@gmail.com"

### 2. Thông tin địa chỉ (cần kiểm tra)
- ❓ `street`: Địa chỉ chi tiết (số nhà, đường)
- ❓ `provinceId`: ID tỉnh/thành phố
- ❓ `districtId`: ID quận/huyện  
- ❓ `wardId`: ID phường/xã

## Nếu vẫn báo thiếu thông tin

### Kiểm tra trong console:
1. Xem `missingFields` array có gì
2. Kiểm tra các trường địa chỉ có giá trị không

### Ví dụ nếu thiếu:
```javascript
missingFields: ["street", "provinceId", "districtId", "wardId"]
```

### Giải pháp:
1. Click button "Điền thông tin"
2. Đi đến trang profile
3. Điền đầy đủ các trường:
   - Địa chỉ chi tiết (số nhà, đường)
   - Tỉnh/Thành phố
   - Quận/Huyện
   - Phường/Xã
4. Lưu profile
5. Quay lại trang Place Order

## Lưu ý
- Các trường ID (provinceId, districtId, wardId) phải có giá trị
- Trường `street` phải có địa chỉ chi tiết
- Sau khi điền xong, thông tin sẽ tự động được cập nhật
