# 📝 Seller Post Management System

## 🎯 Tổng quan

Hệ thống quản lý tin đăng cho Seller với validation service package.

**Flow:**
1. ✅ Buyer nâng cấp lên Seller (approved)
2. ✅ Seller mua gói dịch vụ (service package)
3. ✅ **Kiểm tra gói còn hạn** → Cho phép đăng tin
4. ✅ **Đăng tin bán xe** → Lưu vào DB
5. ✅ **Gửi yêu cầu xác minh** → Admin approve
6. ✅ **Quản lý tin đăng** → Xem, sửa, xóa

---

## 📂 Cấu trúc Files

### 1. API Integration
```
src/api/sellerApi.js
```
- `checkServicePackageValidity(username)` - Kiểm tra gói còn hạn
- `getSellerProfile()` - Lấy seller profile
- `createPostProduct(productData)` - Đăng tin
- `requestPostVerification(postId)` - Xác minh bài đăng
- `getMyPosts(page, size)` - Lấy danh sách tin đăng
- `updatePost(postId, data)` - Cập nhật tin
- `deletePost(postId)` - Xóa tin

### 2. Components
```
src/components/ServicePackageGuard/
├── ServicePackageGuard.jsx
└── ServicePackageGuard.css
```
**Chức năng:** Wrapper component kiểm tra gói service package trước khi cho phép sử dụng tính năng

**States:**
- ⏳ Loading - Đang kiểm tra
- ✅ Valid - Gói còn hạn → Render children
- ❌ Expired - Gói hết hạn → Hiện UI mua gói
- ⚠️ Error - Lỗi kiểm tra → Retry

### 3. Pages

#### A. Create Post
```
src/pages/Seller/CreatePost/
├── CreatePost.jsx
└── CreatePost.css
```

**Features:**
- ✅ Form đăng tin với validation
- ✅ Upload multiple images (max 10)
- ✅ Preview images
- ✅ Auto get sellerId từ profile
- ✅ Tự động gửi yêu cầu xác minh (optional)

**Form Fields:**
```javascript
{
  sellerId: number,           // Auto from profile
  title: string,              // Required
  brand: string,              // Required
  model: string,              // Required
  manufacturerYear: number,   // Default: current year
  usedDuration: string,
  color: string,
  price: number,              // Required
  length: string,
  width: string,
  height: string,
  weight: string,
  description: string,        // Required
  locationTrading: string,    // Required
  pictures: string[]          // Required, min 1
}
```

#### B. Manage Posts
```
src/pages/Seller/ManagePosts/
├── ManagePosts.jsx
└── ManagePosts.css
```

**Features:**
- ✅ Danh sách tin đăng của seller
- ✅ Filter theo trạng thái (All, Approved, Pending, Rejected)
- ✅ Status badges (Đã duyệt, Chờ duyệt, Từ chối)
- ✅ Actions: Xem, Xác minh, Sửa, Xóa
- ✅ Empty state UI
- ✅ Responsive grid layout

---

## 🚀 Usage

### 1. Đăng Tin Mới

```javascript
// Navigate to create post
navigate("/seller/create-post");

// ServicePackageGuard sẽ tự động check:
// - Có gói service package không?
// - Gói còn hạn không?

// Nếu valid → Hiện form
// Nếu expired → Hiện UI mua gói
```

### 2. Quản Lý Tin Đăng

```javascript
// Navigate to manage posts
navigate("/seller/manage-posts");

// Load danh sách tin đăng
const posts = await sellerApi.getMyPosts(page, size);

// Filter theo status
filteredPosts = posts.filter(post => 
  post.verifiedDecisionStatus === "APPROVED"
);
```

### 3. Xác Minh Bài Đăng

```javascript
// Gửi yêu cầu xác minh
await sellerApi.requestPostVerification(postId);

// Backend sẽ:
// 1. Tạo notification cho admin
// 2. Update post status → PENDING
// 3. Admin xem và approve/reject
```

---

## 🔌 Backend API Integration

### 1. Check Service Package

**Request:**
```http
POST /api/v1/seller/{username}/check-service-package-validity
```

**Response:**
```json
{
  "success": true,
  "message": "string",
  "data": {
    "valid": true,
    "expiryDate": "2025-10-23T17:47:42.885Z",
    "packageName": "Premium Package"
  },
  "error": {}
}
```

### 2. Create Post

**Request:**
```http
POST /api/v1/seller/post-products
Content-Type: application/json

{
  "sellerId": 8,
  "title": "Xe máy điện VinFast Klara S 2023",
  "brand": "VinFast",
  "model": "Klara S",
  "manufacturerYear": 2100,
  "usedDuration": "1 năm",
  "color": "Đỏ",
  "price": 25000000,
  "length": "1750mm",
  "width": "700mm",
  "height": "1100mm",
  "weight": "110kg",
  "description": "Xe còn mới, sử dụng ít...",
  "locationTrading": "Quận 1, TP.HCM",
  "pictures": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "string",
  "data": {
    "postId": 0,
    "sellerId": 0,
    "sellerStoreName": "string",
    "title": "string",
    "brand": "string",
    "model": "string",
    // ... other fields
    "verifiedDecisionStatus": "APPROVED",
    "verified": true
  }
}
```

### 3. Request Verification

**Request:**
```http
POST /api/v1/seller/verified-post-product-request
Content-Type: application/json

{
  "postId": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Yêu cầu xác minh đã được gửi"
}
```

---

## 🎨 UI/UX Features

### ServicePackageGuard States

#### 1. Loading
```
┌─────────────────────────┐
│         [Spinner]       │
│ Đang kiểm tra gói...   │
└─────────────────────────┘
```

#### 2. Valid Package
```
┌─────────────────────────────────────┐
│ ✅ Premium Package                  │
│ Hết hạn: 23/10/2025                │
└─────────────────────────────────────┘
│                                     │
│     [Form Đăng Tin / Nội dung]     │
│                                     │
```

#### 3. Expired Package
```
┌─────────────────────────┐
│         📦             │
│ Gói dịch vụ không      │
│   khả dụng            │
│                        │
│ [Mua gói ngay]         │
│ [Kiểm tra lại]        │
└─────────────────────────┘
```

### Post Card

```
┌─────────────────────────┐
│     [Thumbnail]         │
│   [Status Badge]        │
├─────────────────────────┤
│ Title                   │
│ Brand Model             │
│ 💰 25,000,000 VNĐ      │
│ 📍 Quận 1, TP.HCM      │
├─────────────────────────┤
│ [Xem][Xác minh]        │
│ [Sửa][Xóa]             │
└─────────────────────────┘
```

---

## 📊 Status Flow

```
[Tạo bài đăng]
      ↓
[Chưa xác minh] (verifiedDecisionStatus: null)
      ↓
[Gửi yêu cầu xác minh]
      ↓
[PENDING] (Chờ admin duyệt)
      ↓
   ┌────┴────┐
   ↓         ↓
[APPROVED] [REJECTED]
(Đã duyệt)  (Từ chối)
```

---

## ⚠️ Validation Rules

### Client-side
- ✅ Title, brand, model: Required
- ✅ Price: Required, > 0
- ✅ Description: Required
- ✅ LocationTrading: Required
- ✅ Pictures: Min 1, Max 10
- ✅ ManufacturerYear: 2000-2100

### Server-side
- ✅ Service package valid
- ✅ Seller exists
- ✅ All required fields present
- ✅ Valid data types

---

## 🧪 Testing

### Test Case 1: Seller có gói còn hạn
```
1. Login as Seller
2. Navigate to /seller/create-post
3. ✅ Expected: Show form, không show "Mua gói"
4. Fill form và submit
5. ✅ Expected: Create success, redirect to manage-posts
```

### Test Case 2: Seller hết gói
```
1. Login as Seller (package expired)
2. Navigate to /seller/create-post
3. ✅ Expected: Show "Gói dịch vụ không khả dụng"
4. Click "Mua gói ngay"
5. ✅ Expected: Navigate to /compare-plans
```

### Test Case 3: Quản lý tin đăng
```
1. Navigate to /seller/manage-posts
2. ✅ Expected: Show list of posts
3. Filter by "Đã duyệt"
4. ✅ Expected: Only show approved posts
5. Click "Xác minh" on pending post
6. ✅ Expected: Send verification request, reload list
```

---

## 🔗 Routes

| Path | Component | Protection |
|------|-----------|------------|
| `/seller/create-post` | CreatePost | ServicePackageGuard |
| `/seller/manage-posts` | ManagePosts | ServicePackageGuard |
| `/seller/edit-post/:id` | EditPost (TODO) | ServicePackageGuard |

---

## 📝 TODO / Enhancements

- [ ] **Edit Post:** Trang sửa tin đăng (hiện chưa có)
- [ ] **Image Upload:** Integrate thật với backend upload API
- [ ] **My Posts API:** Backend cần có API `/api/v1/seller/my-posts`
- [ ] **Update/Delete APIs:** Backend cần có PUT/DELETE endpoints
- [ ] **Draft Save:** Lưu nháp tự động khi đang viết
- [ ] **Image Compression:** Nén ảnh trước khi upload
- [ ] **SEO:** Meta tags cho bài đăng
- [ ] **Analytics:** Thống kê lượt xem, lượt like

---

## 🐛 Known Issues

1. **Image Upload:** Hiện tại chỉ có mock upload, cần integrate real API
2. **My Posts API:** Backend chưa có, đang assume có
3. **Edit Post:** Chưa implement trang edit
4. **Pagination:** ManagePosts chưa có pagination UI

---

## 📞 Support

- **Backend API Docs:** Xem Swagger tại `/swagger-ui.html`
- **Design:** Xem Figma tại `[link]`
- **Issues:** Report tại GitHub Issues

---

**Last Updated:** October 23, 2025  
**Status:** ✅ Implemented (Create & Manage)  
**Next:** Edit Post, Real Image Upload

