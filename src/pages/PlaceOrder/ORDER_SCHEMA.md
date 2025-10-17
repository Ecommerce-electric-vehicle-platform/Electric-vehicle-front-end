# Order Schema Documentation

## Tổng quan
Schema đơn hàng mới được thiết kế để quản lý đầy đủ thông tin đơn hàng với các thuộc tính chuyên nghiệp.

## Cấu trúc dữ liệu

### Core Order Information
- **order_id**: ID duy nhất của đơn hàng (tự động tạo)
- **order_code**: Mã đơn hàng (format: ORD{timestamp}{random})
- **status**: Trạng thái đơn hàng
  - `pending`: Chờ xử lý
  - `confirmed`: Đã xác nhận
  - `processing`: Đang xử lý
  - `shipped`: Đã giao hàng
  - `delivered`: Đã nhận hàng
  - `cancelled`: Đã hủy

### User and Admin Information
- **admin_id**: ID của admin xử lý đơn hàng
- **buyer_id**: ID của người mua

### Product and Shipping Information
- **post_product_id**: ID của sản phẩm
- **shipping_partner_id**: ID đối tác vận chuyển
  - `ghn`: Giao Hàng Nhanh (GHN)
  - `ghtk`: Giao Hàng Tiết Kiệm (GHTK)
  - `viettel`: Viettel Post
  - `jtexpress`: JT Express
  - `ninjavan`: Ninja Van
- **shipping_address**: Địa chỉ giao hàng
- **phone_number**: Số điện thoại người mua
- **shipping_fee**: Phí vận chuyển

### Additional Order Details
- **buyer_name**: Tên người mua
- **buyer_email**: Email người mua
- **buyer_address**: Địa chỉ người mua
- **delivery_phone**: Số điện thoại nhận hàng
- **delivery_note**: Ghi chú giao hàng
- **payment_method**: Phương thức thanh toán (`wallet` | `cod`)
- **quantity**: Số lượng
- **total_price**: Tổng giá sản phẩm
- **final_price**: Tổng giá cuối cùng (bao gồm phí vận chuyển)

### Timestamps
- **created_at**: Thời gian tạo đơn hàng
- **updated_at**: Thời gian cập nhật cuối
- **cancel_at**: Thời gian hủy đơn hàng (nếu có)
- **cancel_reason**: Lý do hủy đơn hàng (nếu có)

## Tính năng mới

### 1. Quản lý trạng thái đơn hàng
- Trạng thái mặc định là "pending" khi buyer đặt hàng
- Buyer không thể thay đổi trạng thái đơn hàng
- Trạng thái sẽ được cập nhật bởi admin/system theo giai đoạn đơn hàng
- Hiển thị trạng thái hiện tại trong summary (read-only)

### 2. Quản lý đối tác vận chuyển
- Buyer không thể chọn đối tác vận chuyển
- Đối tác vận chuyển sẽ được chọn bởi admin sau khi xác nhận đơn hàng
- Hiển thị thông báo "Sẽ được chọn sau khi xác nhận" trong form
- Tích hợp với hệ thống vận chuyển

### 3. Mã đơn hàng tự động
- Tự động tạo mã đơn hàng unique
- Hiển thị mã đơn hàng (read-only)
- Format: ORD{timestamp}{random}

### 4. Quản lý hủy đơn hàng
- Buyer không thể hủy đơn hàng từ form đặt hàng
- Việc hủy đơn hàng sẽ được thực hiện bởi admin
- `cancel_at` và `cancel_reason` chỉ được set bởi admin khi hủy đơn hàng

## UI/UX Improvements

### 1. Form Layout
- Section "Thông tin đơn hàng" với các trường read-only
- Input fields với styling chuyên nghiệp cho thông tin hệ thống
- Help text giải thích rõ vai trò của từng trường

### 2. Validation
- Validation cho tất cả trường bắt buộc (thông tin buyer)
- Không validation cho các trường hệ thống (status, shipping_partner)
- Real-time validation feedback

### 3. Summary Display
- Hiển thị đầy đủ thông tin đơn hàng
- Conditional display cho các trường optional
- Professional layout với sections rõ ràng

## API Integration Ready

Schema được thiết kế để dễ dàng tích hợp với backend API:
- Tất cả trường đều có tên chuẩn (snake_case)
- Timestamps theo format ISO 8601
- Status values theo chuẩn quốc tế
- Foreign keys cho các entity khác

## Migration Notes

Khi migrate từ schema cũ:
1. Map các trường cũ sang trường mới
2. Set default values cho các trường mới
3. Generate order_code cho các đơn hàng cũ
4. Set created_at từ timestamp cũ
