# Test Mock Data & Components

Thư mục này chứa tất cả các file được tạo ra để test khi chưa có API thực tế.

## 📁 Cấu trúc thư mục

```
src/test-mock-data/
├── components/           # Components chỉ dùng để test
├── data/               # Dữ liệu mock
├── utils/              # Utility functions cho test
└── README.md          # File này
```

## 🗂️ Chi tiết các file

### Components
- **`TestEnvironmentSetup/`** - Component tự động thiết lập môi trường test
  - Tự động set localStorage cho test
  - Clear các settings cũ
  - Hiển thị thông tin debug

### Data
- **`productsData.js`** - Dữ liệu sản phẩm mock
  - Danh sách xe điện
  - Danh sách pin xe điện
  - Thông tin seller cho từng sản phẩm
  - Các hàm utility (formatCurrency, formatDate)

### Utils
- **`orderValidation.js`** - Các hàm validation cho test
  - checkWalletStatus() - Kiểm tra ví điện tử
  - checkProductAvailability() - Kiểm tra sản phẩm còn hàng
  - validateOrderData() - Validate thông tin đặt hàng
  - calculateShippingFee() - Tính phí vận chuyển
  - generateOrderId() - Tạo mã đơn hàng

## 🚀 Cách sử dụng

### Khi có API thực tế:
1. **XÓA** toàn bộ thư mục `src/test-mock-data/`
2. **THAY THẾ** các import trong các file chính:
   ```javascript
   // Thay vì:
   import { vehicleProducts, batteryProducts } from '../../data/productsData';
   
   // Sử dụng:
   import { fetchProducts } from '../../api/productApi';
   ```

### Các file cần cập nhật khi có API:
- `src/pages/PlaceOrder/PlaceOrder.jsx`
- `src/pages/SellerDashboard/SellerDashboard.jsx`
- `src/pages/Products/Products.jsx`
- `src/pages/ProductDetail/ProductDetail.jsx`
- `src/components/ProductDetailModal/ProductDetailModal.jsx`

## ⚠️ Lưu ý

- Tất cả file trong thư mục này **CHỈ DÙNG ĐỂ TEST**
- Khi deploy production, **XÓA** toàn bộ thư mục này
- Các file này **KHÔNG** được commit vào production

## 🔄 Migration Checklist

Khi có API thực tế, cần làm:

### 1. Xóa các file test:
- [ ] Xóa `src/test-mock-data/` toàn bộ
- [ ] Xóa import `TestEnvironmentSetup` trong PlaceOrder
- [ ] Xóa import `productsData` trong các component
- [ ] Xóa import `orderValidation` trong PlaceOrder

### 2. Thay thế bằng API calls:
- [ ] Tạo `src/api/productApi.js`
- [ ] Tạo `src/api/orderApi.js`
- [ ] Tạo `src/api/sellerApi.js`
- [ ] Cập nhật các component sử dụng API thực

### 3. Cập nhật các file chính:
- [ ] `PlaceOrder.jsx` - Thay mock data bằng API calls
- [ ] `SellerDashboard.jsx` - Thay mock data bằng API calls
- [ ] `Products.jsx` - Thay mock data bằng API calls
- [ ] `ProductDetail.jsx` - Thay mock data bằng API calls

## 📝 Ghi chú

- File `test-setup.js` ở root cũng có thể xóa khi có API
- Các console.log debug cũng nên xóa khi production
- localStorage mock data cũng nên thay bằng API calls

