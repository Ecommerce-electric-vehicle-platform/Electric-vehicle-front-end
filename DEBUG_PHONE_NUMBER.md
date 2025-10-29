# Debug Số Điện Thoại Không Hiển Thị

## Vấn đề
Số điện thoại không hiển thị trong phần xác nhận đơn hàng mặc dù đã điền trong profile.

## Nguyên nhân đã sửa
1. **Sai tên trường trong confirmation**: Đang sử dụng `orderData.phone_number` thay vì `orderData.phoneNumber`
2. **Có thể thiếu dữ liệu**: `profileData.phoneNumber` có thể không có giá trị

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
🔍 Profile loaded (validation disabled): {
  fullName: "Phan Vy",
  phoneNumber: "0848904939", // ← Kiểm tra trường này
  email: "vibe.e2nd180505@gmail.com",
  street: "123 Đường ABC",
  // ... các trường khác
}

🔍 Setting order data: {
  fullName: "Phan Vy",
  phoneNumber: "0848904939", // ← Kiểm tra trường này
  email: "vibe.e2nd180505@gmail.com",
  fullAddress: "123 Đường ABC, Phường X, Quận Y, TP.HCM"
}
```

## Các trường hợp có thể xảy ra

### Trường hợp 1: phoneNumber có giá trị
```javascript
phoneNumber: "0848904939"
```
→ Số điện thoại sẽ hiển thị bình thường

### Trường hợp 2: phoneNumber là null/undefined
```javascript
phoneNumber: null
// hoặc
phoneNumber: undefined
```
→ Số điện thoại sẽ không hiển thị

### Trường hợp 3: phoneNumber là chuỗi rỗng
```javascript
phoneNumber: ""
```
→ Số điện thoại sẽ không hiển thị

## Giải pháp

### Nếu phoneNumber không có giá trị:
1. Click button "Cập nhật thông tin"
2. Đi đến trang profile
3. Điền số điện thoại trong trường "Phone number"
4. Lưu profile
5. Quay lại trang Place Order

### Nếu vẫn không hiển thị:
1. Kiểm tra console log để xem `orderData.phoneNumber` có giá trị không
2. Kiểm tra xem có lỗi JavaScript nào không
3. Thử refresh trang

## Các trường đã sửa

### 1. Thông tin người mua (confirmation)
```javascript
// Trước
<span className="info-value">{orderData.phone_number}</span>

// Sau  
<span className="info-value">{orderData.phoneNumber}</span>
```

### 2. Thông tin giao hàng (confirmation)
```javascript
// Vẫn sử dụng delivery_phone (đúng)
<span className="info-value">{orderData.delivery_phone}</span>
```

## Lưu ý
- `phoneNumber`: Số điện thoại từ profile (hiển thị trong "Thông tin người mua")
- `delivery_phone`: Số điện thoại nhận hàng (hiển thị trong "Thông tin giao hàng")
- Cả hai đều được set từ `profileData.phoneNumber` khi load profile
