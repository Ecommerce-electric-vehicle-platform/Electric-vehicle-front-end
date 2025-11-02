# Debug Product API Issue

## Vấn đề
- Các sản phẩm ID 1-14: Hiển thị đầy đủ ✅
- Các sản phẩm ID 15+: Không hiển thị gì cả ❌

## Đã thêm logging

### 1. `fetchPostProductById` - Logging chi tiết
- Log raw API response
- Log extracted item
- Check error trong response
- Check data null

### 2. `normalizeProduct` - Logging
- Log khi item null/không phải object
- Log khi unwrap response wrapper
- Log productData sau khi xử lý

### 3. `ProductDetail` - Logging
- Log full product data sau khi fetch
- Log error details với response data

## Cách debug

1. Mở browser console
2. Navigate đến `/product/15` (hoặc ID >= 15)
3. Xem các log:
   - `[fetchPostProductById] API Response for ID 15:`
   - `[fetchPostProductById] Raw response for ID 15:`
   - `[fetchPostProductById] Extracted item for ID 15:`
   - `[normalizeProduct] Processing productData:`
   - `[ProductDetail] Product full data:`

## Các trường hợp cần kiểm tra

1. **Response structure khác nhau:**
   - ID 1-14: `{success: true, data: {...}, error: null}`
   - ID 15+: `{success: true, data: null, error: "..."}` hoặc structure khác?

2. **Data extraction:**
   - Kiểm tra xem `rawResponse.data` có null không
   - Kiểm tra xem `item` có đúng structure không

3. **Normalize product:**
   - Kiểm tra xem `normalizeProduct` có return null không
   - Kiểm tra xem `postId` có được validate đúng không

## Next steps
1. Chạy app và check console logs
2. So sánh response structure giữa ID 1-14 và 15+
3. Fix logic dựa trên actual response structure

