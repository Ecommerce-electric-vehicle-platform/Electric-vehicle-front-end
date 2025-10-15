# PageTransition Component

Hệ thống hiệu ứng chuyển trang chuyên nghiệp cho ứng dụng React.

## Tính năng

- ✅ Hiệu ứng fade, slide, scale chuyên nghiệp
- ✅ Loading overlay với spinner đẹp mắt
- ✅ Staggered animation cho các phần tử con
- ✅ Responsive design
- ✅ Performance optimization
- ✅ Customizable transition types

## Cách sử dụng

### 1. Sử dụng cơ bản

```jsx
import PageTransition from './components/PageTransition/PageTransition';

<PageTransition className="fade-up">
  <YourComponent />
</PageTransition>
```

### 2. Các loại hiệu ứng có sẵn

- `fade-up`: Fade in từ dưới lên
- `fade-left`: Fade in từ trái sang
- `fade-right`: Fade in từ phải sang
- `slide-right`: Slide từ phải sang
- `slide-left`: Slide từ trái sang
- `slide-bottom`: Slide từ dưới lên
- `scale`: Scale in effect

### 3. Tùy chỉnh loading

```jsx
<PageTransition 
  className="slide-right" 
  showLoading={false}  // Tắt loading overlay
>
  <YourComponent />
</PageTransition>
```

### 4. Sử dụng với React Router

```jsx
<Route path="/product/:id" element={
  <PageTransition className="slide-right" showLoading={false}>
    <ProductDetail />
  </PageTransition>
} />
```

### 5. Sử dụng hook usePageTransition

```jsx
import { usePageTransition } from '../hooks/usePageTransition';

const { navigateToProduct, isTransitioning } = usePageTransition();

// Navigate với hiệu ứng
const handleViewDetails = (product) => {
  navigateToProduct(product.id);
};
```

## CSS Classes

### Page Transition Container
- `.page-transition`: Container chính
- `.page-transition-content`: Nội dung trang
- `.page-transition-overlay`: Loading overlay

### Animation Classes
- `.visible`: Trạng thái hiển thị
- `.exiting`: Trạng thái thoát
- `.fade-up`, `.fade-left`, `.fade-right`: Fade animations
- `.slide-right`, `.slide-left`, `.slide-bottom`: Slide animations
- `.scale`: Scale animation

### Global Classes
- `body.page-transitioning`: Khi đang chuyển trang
- `.product-card:hover`: Hiệu ứng hover cho sản phẩm
- `.product-btn:active`: Hiệu ứng click cho button

## Tùy chỉnh

### Thêm hiệu ứng mới

1. Thêm keyframes trong `PageTransition.css`:

```css
@keyframes yourCustomAnimation {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

2. Thêm class tương ứng:

```css
.page-transition.your-custom .page-transition-content {
  animation: yourCustomAnimation 0.8s ease-out;
}
```

### Tùy chỉnh timing

```css
.page-transition-content {
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

## Performance Tips

1. Sử dụng `will-change` property cho các element được animate
2. Tắt loading overlay cho các trang load nhanh
3. Sử dụng `transform` và `opacity` thay vì thay đổi layout properties
4. Thêm `backface-visibility: hidden` để tối ưu GPU

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Lưu ý

- Hiệu ứng chỉ hoạt động tốt trên các trình duyệt hiện đại
- Test trên mobile để đảm bảo performance
- Sử dụng `showLoading={false}` cho các trang có nội dung nhẹ
