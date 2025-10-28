# Cải tiến trang Place Order

## Tổng quan
Đã cải tiến trang Place Order theo yêu cầu để yêu cầu người dùng hoàn thiện thông tin profile trước khi đặt hàng và tự động điền thông tin từ profile.

## Các thay đổi chính

### 1. Validation Profile đầy đủ
- **File mới**: `src/utils/profileValidation.js`
- **Chức năng**: Kiểm tra xem user profile có đầy đủ thông tin cần thiết để đặt hàng không
- **Các trường bắt buộc**: fullName, phoneNumber, email, defaultShippingAddress, provinceId, districtId, wardId

### 2. Component ProfileIncompleteModal
- **File mới**: `src/components/ProfileIncompleteModal/ProfileIncompleteModal.jsx`
- **File CSS**: `src/components/ProfileIncompleteModal/ProfileIncompleteModal.css`
- **Chức năng**: Hiển thị modal thông báo khi profile chưa đầy đủ với danh sách các trường còn thiếu

### 3. Cập nhật PlaceOrder.jsx

#### Thay đổi validation flow:
- Thêm bước kiểm tra profile đầy đủ trước khi kiểm tra sản phẩm
- Nếu profile không đầy đủ, hiển thị modal yêu cầu cập nhật profile
- Tự động chuyển hướng đến trang profile khi user click "Cập nhật profile"

#### Tự động điền thông tin:
- **Thông tin người mua**: Tự động điền từ profile (readonly)
- **Thông tin giao hàng**: Tự động điền từ profile nhưng cho phép chỉnh sửa
- **Bỏ phần thông tin đơn hàng**: Không hiển thị trong form đặt hàng

#### Cải tiến UI:
- Cập nhật validation steps để hiển thị "Kiểm tra profile"
- Cải thiện thông báo và hướng dẫn cho user
- Tối ưu trải nghiệm người dùng

## Luồng hoạt động mới

1. **User truy cập trang Place Order**
2. **Kiểm tra đăng nhập** - Nếu chưa đăng nhập, chuyển về trang signin
3. **Kiểm tra profile đầy đủ** - Nếu thiếu thông tin, hiển thị modal yêu cầu cập nhật
4. **Kiểm tra sản phẩm** - Kiểm tra sản phẩm còn hàng
5. **Kiểm tra đơn hàng** - Kiểm tra người bán (nếu có nhiều sản phẩm)
6. **Hiển thị form đặt hàng** - Với thông tin đã được điền sẵn từ profile

## Các file đã thay đổi

### Files mới:
- `src/utils/profileValidation.js` - Utility functions cho validation profile
- `src/components/ProfileIncompleteModal/ProfileIncompleteModal.jsx` - Component modal
- `src/components/ProfileIncompleteModal/ProfileIncompleteModal.css` - Styles cho modal

### Files đã cập nhật:
- `src/pages/PlaceOrder/PlaceOrder.jsx` - Logic chính của trang place order

## Lợi ích

1. **Đảm bảo thông tin đầy đủ**: User phải hoàn thiện profile trước khi đặt hàng
2. **Trải nghiệm tốt hơn**: Tự động điền thông tin, giảm thao tác cho user
3. **Tính nhất quán**: Thông tin đặt hàng luôn đồng bộ với profile
4. **Hướng dẫn rõ ràng**: Modal hiển thị chính xác các trường còn thiếu
5. **Tự động chuyển hướng**: User được đưa trực tiếp đến trang cập nhật profile

## Cách sử dụng

1. User truy cập trang Place Order
2. Nếu profile chưa đầy đủ, sẽ thấy modal yêu cầu cập nhật
3. Click "Cập nhật profile" để chuyển đến trang profile
4. Sau khi cập nhật xong, quay lại trang Place Order
5. Thông tin sẽ được tự động điền và có thể chỉnh sửa nếu cần
6. Tiến hành đặt hàng bình thường
