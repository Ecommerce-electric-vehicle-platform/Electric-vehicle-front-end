# Hệ thống Homepage Động

## Tổng quan
Hệ thống homepage đã được cập nhật để hiển thị nội dung khác nhau dựa trên trạng thái đăng nhập của người dùng:

- **Guest (Chưa đăng nhập)**: Hiển thị `HomeGuest` với đầy đủ các section marketing
- **User (Đã đăng nhập)**: Hiển thị `HomeUser` với UserDashboard và các tính năng cá nhân hóa

## Cấu trúc Components

### 1. Home.jsx (Component chính)
- Kiểm tra trạng thái đăng nhập từ localStorage
- Lắng nghe sự kiện `authStatusChanged` để cập nhật real-time
- Render `HomeUser` hoặc `HomeGuest` tương ứng

### 2. HomeGuest.jsx
- Trang chủ cho khách chưa đăng nhập
- Bao gồm: HeroSection, FeaturedSlider, ProductsSection, VehicleShowcase, FeaturesSection, CTASection, UpgradeSection
- Giữ nguyên giao diện marketing ban đầu

### 3. HomeUser.jsx  
- Trang chủ cho người dùng đã đăng nhập
- Bao gồm: UserDashboard + các section cơ bản (FeaturedSlider, ProductsSection, VehicleShowcase, FeaturesSection, CTASection)
- Loại bỏ UpgradeSection vì user đã có tài khoản

### 4. UserDashboard.jsx
- Bảng điều khiển cá nhân cho user
- Hiển thị thống kê: tổng đơn hàng, tổng chi tiêu, sản phẩm yêu thích, danh sách mong muốn
- Danh sách đơn hàng gần đây
- Sản phẩm đã xem gần đây
- Giao diện responsive và hiện đại

### 5. Header.jsx (Cập nhật)
- Hiển thị thông tin user khi đã đăng nhập
- Nút đăng xuất với icon
- Lắng nghe sự kiện `authStatusChanged` để cập nhật UI
- Responsive design cho mobile

## Luồng hoạt động

### Đăng nhập
1. User nhập thông tin và submit form
2. SignIn.jsx gọi API đăng nhập
3. Lưu token và thông tin user vào localStorage
4. Dispatch event `authStatusChanged`
5. Home.jsx nhận event và chuyển sang `HomeUser`
6. Header.jsx cập nhật hiển thị thông tin user

### Đăng xuất
1. User click nút "Đăng xuất" trong Header
2. Xóa tất cả thông tin user khỏi localStorage
3. Dispatch event `authStatusChanged`
4. Home.jsx chuyển về `HomeGuest`
5. Header.jsx hiển thị lại nút đăng nhập/đăng ký

## Tính năng mới

### UserDashboard
- **Thống kê tổng quan**: 4 card hiển thị số liệu quan trọng
- **Đơn hàng gần đây**: Danh sách 3 đơn hàng mới nhất với trạng thái
- **Sản phẩm đã xem**: Grid hiển thị sản phẩm đã xem gần đây
- **Responsive**: Tối ưu cho cả desktop và mobile

### Header thông minh
- **Trạng thái động**: Tự động chuyển đổi giữa auth buttons và user info
- **Thông tin user**: Hiển thị username và email
- **Đăng xuất an toàn**: Xóa sạch dữ liệu và chuyển hướng

## CSS Styling
- Sử dụng Tailwind CSS cho layout cơ bản
- Custom CSS cho các component đặc biệt
- Gradient và shadow effects hiện đại
- Responsive design với breakpoints
- Animation và transition mượt mà

## Lưu ý kỹ thuật
- Sử dụng `localStorage` để lưu trữ trạng thái đăng nhập
- Event-driven architecture với `CustomEvent`
- Component composition để tái sử dụng code
- Separation of concerns giữa guest và user experience
