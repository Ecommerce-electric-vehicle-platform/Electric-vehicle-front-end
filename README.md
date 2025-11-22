# 🚗 GreenTrade Plaform 

**Nền tảng giao dịch Pin & Xe điện đã qua sử dụng**

---

## 📋 Mục lục

- [🎯 Giới thiệu](#-giới-thiệu)
- [✨ Tính năng chính](#-tính-năng-chính)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống)
- [👥 Phân quyền người dùng](#-phân-quyền-người-dùng)
- [⚡ Quick Start](#-quick-start)
- [📁 Cấu trúc dự án](#-cấu-trúc-dự án)
- [🔐 Bảo mật](#-bảo-mật)
- [📊 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-đóng-góp)

---

## 🎯 Giới thiệu

Electric Vehicle Marketplace là nền tảng thương mại điện tử chuyên về mua bán pin và xe điện đã qua sử dụng. Ứng dụng cung cấp môi trường giao dịch an toàn, minh bạch với hệ thống kiểm định chất lượng, thanh toán đa dạng và hỗ trợ trực tuyến 24/7.

## ✨ Tính năng chính

### 👥 Người dùng (Buyer)
- 🛒 Duyệt và tìm kiếm sản phẩm với bộ lọc thông minh
- ❤️ Quản lý danh sách yêu thích
- 📦 Đặt hàng và theo dõi đơn hàng
- ⭐ Đánh giá và nhận xét sản phẩm
- 💬 Chat trực tuyến với người bán
- 💳 Thanh toán qua VNPay, MoMo
- 💰 Ví điện tử tích hợp
- ✅ Yêu cầu nâng cấp thành người bán

### 🏪 Người bán (Seller)
- 📝 Tạo và quản lý bài đăng sản phẩm
- 📊 Dashboard thống kê doanh số
- 📋 Quản lý đơn hàng chờ xử lý
- 💬 Chat với người mua
- 💰 Quản lý ví và rút tiền

### 👨‍💼 Quản trị viên (Admin)
- 👥 Quản lý người dùng và người bán
- ✅ Duyệt đăng ký người bán
- 📝 Kiểm duyệt bài đăng
- ⚖️ Xử lý tranh chấp
- 📦 Quản lý gói đăng ký
- 📊 Thống kê và báo cáo hệ thống
- ⚙️ Cấu hình hệ thống

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.1.9
- **Routing**: React Router DOM 7.9.4
- **State Management**: Redux 5.0.1 + React-Redux
- **UI Components**: CoreUI 5.9.1, Radix UI, Lucide React
- **Styling**: Vanilla CSS3 với CSS Variables, Flexbox, Grid
- **Charts**: Chart.js, Recharts
- **Icons**: React Icons, Font Awesome, CoreUI Icons

### Backend Integration
- **HTTP Client**: Axios 1.12.2
- **Real-time**: WebSocket với STOMP/SockJS 7.2.1
- **Authentication**: JWT + Google OAuth 2.0
- **Payment**: VNPay, MoMo integration
- **Image Upload**: Cloudinary (thông qua backend)

### Development Tools
- **Linting**: ESLint 9.37.0
- **Package Manager**: npm
- **Version Control**: Git

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│                 │    │                 │    │   Services      │
│ React + Vite    │◄──►│ REST API        │◄──►│ - VNPay/MoMo    │
│ Redux           │    │ JWT Auth        │    │ - Google OAuth  │
│ React Router    │    │ WebSocket       │    │ - Cloudinary    │
│ CoreUI          │    │ File Storage    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 👥 Phân quyền người dùng

| Vai trò | Mô tả | Quyền hạn chính |
|---------|-------|-----------------|
| 👤 **BUYER** | Người mua hàng | Duyệt sản phẩm, đặt hàng, chat, thanh toán, quản lý ví |
| 🏪 **SELLER** | Người bán hàng | Tạo/quản lý bài đăng, dashboard, quản lý đơn hàng, rút tiền |
| 👨‍💼 **ADMIN** | Quản trị viên | Quản lý users/sellers, duyệt đăng ký, kiểm duyệt bài đăng, xử lý tranh chấp, thống kê |

> 💡 **Lưu ý**: Mọi seller đều được nâng cấp từ buyer account, nên `buyerId` = `sellerId`

## ⚡ Quick Start

### Prerequisites
- Node.js >= 18.x
- npm >= 8.x
- Git >= 2.x

### 1. Clone repository
```bash
git clone <repository-url>
cd Electric-vehicle-front-end
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Tạo file `.env` trong thư mục gốc:

```env
# API Endpoints
VITE_API_BASE_URL=http://localhost:8080
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

# Google OAuth
VITE_GG_CLIENT_ID=your-google-client-id
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080

### 5. Chạy ứng dụng
```bash
# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

## 📁 Cấu trúc dự án

```
Electric-vehicle-front-end/
├── 📁 src/
│   ├── 📁 api/              # API services (auth, product, order, etc.)
│   ├── 📁 components/        # React Components
│   │   ├── 📁 Admin/        # Admin components
│   │   ├── 📁 Header/       # Header component
│   │   ├── 📁 Footer/       # Footer component
│   │   └── 📁 ui/           # UI components
│   ├── 📁 pages/            # Page components
│   │   ├── 📁 Admin/        # Admin pages
│   │   ├── 📁 Auth/         # Authentication pages
│   │   ├── 📁 Seller/       # Seller pages
│   │   └── 📁 ...           # Other pages
│   ├── 📁 hooks/            # Custom React Hooks
│   ├── 📁 store/            # Redux store
│   ├── 📁 utils/            # Utility functions
│   ├── 📁 services/         # Services (WebSocket, notifications)
│   ├── 📁 environments/     # Environment config
│   └── 📁 routes/           # Route configurations
├── 📁 public/               # Static assets
├── 📄 package.json          # Dependencies
├── 📄 vite.config.js        # Vite configuration
└── 📄 README.md             # Tài liệu này
```

## 🔧 Scripts có sẵn

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview production build
npm run lint     # Kiểm tra linting
```

## 🔐 Bảo mật

### Authentication & Authorization
- 🔑 **JWT Authentication** với access token
- 🔐 **Password Hashing** sử dụng bcrypt (backend)
- 🌐 **Google OAuth 2.0** integration
- 📱 **OTP Verification** cho đăng ký
- 🚪 **Role-based Access Control (RBAC)**

### Data Protection
- 🛡️ **Input Validation** và sanitization
- 🔒 **HTTPS Enforcement** cho production
- 🚫 **CORS Policy** restricted origins
- ⚡ **Rate Limiting** chống spam
- 🔐 **Token-based** authentication cho WebSocket

### Protected Routes
- Routes `/admin/*` yêu cầu quyền ADMIN
- Routes `/seller/*` yêu cầu quyền SELLER  
- Một số tính năng yêu cầu đăng nhập

## 📊 API Documentation

### Main Endpoints

#### Authentication
```
POST   /api/v1/auth/signup       # Đăng ký
POST   /api/v1/auth/signin       # Đăng nhập
POST   /api/v1/auth/admin/signin # Admin login
POST   /api/v1/auth/verify-otp   # Xác thực OTP
```

#### Products
```
GET    /api/v1/products          # Danh sách sản phẩm
GET    /api/v1/products/:id      # Chi tiết sản phẩm
POST   /api/v1/products          # Tạo sản phẩm (seller)
PUT    /api/v1/products/:id      # Cập nhật (seller)
DELETE /api/v1/products/:id      # Xóa (seller)
```

#### Orders
```
GET    /api/v1/orders            # Danh sách đơn hàng
POST   /api/v1/orders            # Tạo đơn hàng
GET    /api/v1/orders/:id        # Chi tiết đơn hàng
PUT    /api/v1/orders/:id        # Cập nhật trạng thái
```

#### Payment
```
POST   /api/v1/vnpay/create      # Tạo thanh toán VNPay
POST   /api/v1/momo/create       # Tạo thanh toán MoMo
GET    /api/v1/vnpay/return      # Callback VNPay
GET    /api/v1/momo/return       # Callback MoMo
```

#### Wallet
```
GET    /api/v1/wallet            # Thông tin ví
POST   /api/v1/wallet/deposit    # Nạp tiền
POST   /api/v1/wallet/withdraw   # Rút tiền
```

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

## 💳 Thanh toán

Hệ thống hỗ trợ 2 phương thức thanh toán:
- **VNPay**: Thanh toán qua cổng VNPay
- **MoMo**: Thanh toán qua ví MoMo

## 📱 Tính năng nổi bật

- ✅ Kiểm định chất lượng sản phẩm
- ✅ Kiểm tra pin chi tiết
- ✅ Bảo hành đầy đủ
- ✅ Hỗ trợ 24/7
- ✅ Chat real-time với WebSocket
- ✅ Thông báo real-time
- ✅ Ví điện tử tích hợp
- ✅ Giao diện responsive trên mọi thiết bị

## 🧪 Testing

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint -- --fix
```

### Test Coverage
- Manual testing cho các user flows chính
- Integration testing với backend API
- UI/UX testing trên các thiết bị khác nhau

## 🚀 Deployment

### Production Build
```bash
npm run build
```

Build output sẽ nằm trong thư mục `dist/`, có thể deploy lên:
- **Vercel**: Tự động deploy từ Git
- **Netlify**: Drag & drop hoặc Git integration
- **Traditional Hosting**: Upload folder `dist/`

### Environment Variables (Production)
Cập nhật các biến môi trường trong hosting platform:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws
VITE_GG_CLIENT_ID=your-production-google-client-id
```

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

### Commit Convention
- `feat(scope):` - Tính năng mới
- `fix(scope):` - Sửa lỗi
- `docs(scope):` - Cập nhật tài liệu
- `style(scope):` - Formatting
- `refactor(scope):` - Refactoring
- `test(scope):` - Thêm tests

## 📝 License

Distributed under the MIT License.

## 📞 Support & Contact

**Team**: Electric Vehicle Development Team  
**Email**: contact@evmarketplace.com  
**Project**: SWP391 - Electric Vehicle Marketplace

---

Made with ❤️ by Electric Vehicle Team

**Last updated**: 2024
