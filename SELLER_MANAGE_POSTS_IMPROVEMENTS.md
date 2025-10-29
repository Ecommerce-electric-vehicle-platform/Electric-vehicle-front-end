# Trang Quản lý tin đăng - Các chức năng đề xuất

## Các chức năng hiện có ✅
- Xem danh sách tất cả tin đăng
- Lọc theo trạng thái (Tất cả, Đã duyệt, Chờ duyệt, Từ chối)
- Đăng tin mới
- Xem chi tiết
- Sửa tin
- Xóa tin
- Yêu cầu xác minh

## Các chức năng nên bổ sung

### 1. Thống kê & Phân tích 📊
```javascript
- Lượt xem (Views)
- Lượt click vào tin
- Số đơn hàng được đặt
- Doanh thu từ tin
- Tỉ lệ chuyển đổi
- Xếp hạng hiệu quả
```

### 2. Tìm kiếm & Lọc nâng cao 🔍
```javascript
- Tìm kiếm theo tiêu đề, brand, model
- Lọc theo khoảng giá
- Lọc theo ngày đăng
- Lọc theo danh mục
- Sắp xếp: Mới nhất, Giá (tăng/giảm), Xem nhiều nhất, Doanh thu cao
```

### 3. Hành động hàng loạt 🎯
```javascript
- Chọn nhiều tin
- Xóa hàng loạt
- Xuất bản hàng loạt
- Gửi yêu cầu xác minh hàng loạt
- Export danh sách ra Excel
```

### 4. Quản lý Trạng thái 📝
```javascript
- Tạm ẩn tin (Hide)
- Kích hoạt lại tin
- Đánh dấu tin nổi bật
- Lên lịch xuất bản
```

### 5. Quản lý Hình ảnh 🖼️
```javascript
- Thêm/sửa/xóa ảnh
- Đổi ảnh đại diện
- Sắp xếp thứ tự ảnh
- Upload nhiều ảnh cùng lúc
```

### 6. Chức năng nâng cao 🚀
```javascript
- Sao chép tin đăng (Clone/Duplicate)
- Sửa nhanh thông tin (Quick Edit)
- Lịch sử chỉnh sửa
- Comment/Note ghi chú cá nhân
- Nhận thông báo khi có người xem
- Đề xuất cải thiện tin đăng
```

### 7. Quản lý Giá 📈
```javascript
- Tự động điều chỉnh giá
- Giá trị đề xuất theo thị trường
- Theo dõi giá cạnh tranh
- Khuyến mãi/Flash Sale
```

### 8. Báo cáo & Export 📄
```javascript
- Xuất PDF báo cáo
- Xuất Excel danh sách
- Báo cáo tuần/tháng
- So sánh hiệu suất
```

## UI/UX Improvements

### Layout cải tiến:
```javascript
// Tabs layout
- Tất cả tin
- Tin đang hoạt động
- Tin đã hết hạn
- Tin bị từ chối
- Tin tạm ẩn

// Quick stats bar
- Tổng tin: XX
- Tin đang bán: XX
- Đang chờ duyệt: XX
- Tổng doanh thu: XXX VNĐ
```

### Card cải tiến:
```javascript
// Mỗi card hiển thị:
- Ảnh sản phẩm
- Tiêu đề
- Giá
- Trạng thái
- Lượt xem
- Số đơn hàng
- Actions menu (dropdown)
  - Xem
  - Sửa
  - Sao chép
  - Tạm ẩn
  - Xóa
  - Sửa hình ảnh
```

## Implementation Priority

### Priority 1 (Cần thiết nhất):
1. ✅ Tìm kiếm tin đăng
2. ✅ Sắp xếp theo tiêu chí
3. ✅ Sửa nhanh giá/tiêu đề
4. ✅ Clone/Sao chép tin

### Priority 2 (Quan trọng):
5. Thống kê cơ bản (Lượt xem, Đơn hàng)
6. Quản lý hình ảnh nâng cao
7. Tạm ẩn/Kích hoạt tin

### Priority 3 (Nâng cao):
8. Hành động hàng loạt
9. Phân tích chi tiết
10. Export/Report

## Backend API Requirements

```javascript
// Seller API cần bổ sung:
GET    /api/v1/seller/my-posts?search=&status=&sort=
PATCH  /api/v1/seller/posts/{id}/status (hide/unhide)
POST   /api/v1/seller/posts/{id}/clone
PATCH  /api/v1/seller/posts/{id}/quick-edit
POST   /api/v1/seller/posts/bulk-action
GET    /api/v1/seller/posts/{id}/analytics
GET    /api/v1/seller/posts/export
```
