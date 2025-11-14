# Order Tracking API - Các trường cần thiết

## Tổng quan
Trang Order Tracking cần các trường thời gian chi tiết để hiển thị đầy đủ thông tin cho người dùng về quá trình đặt hàng và giao hàng.

## API: GET /api/v1/order/{orderId}

### Các trường hiện tại đã có:
- `createdAt` - Thời điểm đặt hàng
- `updatedAt` - Thời điểm cập nhật cuối cùng
- `deliveredAt` - Thời điểm giao hàng (nếu có)
- `shippedAt` - Thời điểm đơn vị vận chuyển lấy hàng (nếu có)

### Các trường CẦN THÊM vào response:

#### 1. `completedAt` (Sử dụng `updatedAt`)
- **Type**: `string` (ISO 8601 format)
- **Description**: Thời điểm người dùng bấm nút "Xác nhận đơn hàng" và đơn hàng chuyển sang trạng thái `COMPLETED`
- **QUAN TRỌNG**: `completedAt` chính là `updatedAt` trong response khi đơn hàng ở trạng thái `COMPLETED`
- **Logic Frontend**: 
  - Khi `status === 'COMPLETED'` hoặc `rawStatus === 'COMPLETED'`, frontend sẽ lấy `updatedAt` làm `completedAt`
  - Frontend sẽ ưu tiên: `completedAt` (nếu có) → `_raw.completedAt` (nếu có) → `updatedAt` (khi status là COMPLETED)

#### 2. `shippedAt` (Nên có)
- **Type**: `string` (ISO 8601 format)
- **Description**: Thời điểm đơn vị vận chuyển lấy hàng
- **Vị trí**: `data._raw.shippedAt` hoặc `data.shippedAt`

#### 3. `deliveredAt` (Nên có)
- **Type**: `string` (ISO 8601 format)
- **Description**: Thời điểm giao hàng thành công
- **Vị trí**: `data._raw.deliveredAt` hoặc `data.deliveredAt`

## Ví dụ Response mong muốn:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "orderCode": "L4MAEE",
    "status": "completed",
    "rawStatus": "COMPLETED",
    "createdAt": "2025-11-14T10:30:00.000Z",
    "updatedAt": "2025-11-14T15:45:00.000Z",
    "completedAt": "2025-11-14T15:45:00.000Z",  // ← CẦN THÊM
    "deliveredAt": "2025-11-14T14:20:00.000Z",
    "shippedAt": "2025-11-14T12:00:00.000Z",
    "price": 4378000,
    "shippingFee": 0,
    "finalPrice": 4378000,
    "_raw": {
      "completedAt": "2025-11-14T15:45:00.000Z",  // ← Có thể ở đây
      "deliveredAt": "2025-11-14T14:20:00.000Z",
      "shippedAt": "2025-11-14T12:00:00.000Z"
    }
  }
}
```

## Frontend đã xử lý:

1. ✅ Tạo hàm `formatDateTime()` để hiển thị cả ngày và giờ
2. ✅ Thêm trường `completedAt` vào order object khi load từ API
3. ✅ Hiển thị ngày giờ đặt hàng với `formatDateTime(order.createdAt)`
4. ✅ Hiển thị ngày giờ hoàn thành với `formatDateTime(order.completedAt)` khi có
5. ✅ Thêm bước "Đã xác nhận hoàn thành" vào progress timeline
6. ✅ Cập nhật thông tin giao hàng với các mốc thời gian chi tiết

## Lưu ý cho Backend:

- Khi API `POST /api/v1/order/{orderId}/confirm` được gọi thành công, backend nên:
  1. Cập nhật `status` thành `COMPLETED`
  2. Cập nhật `updatedAt` = thời điểm hiện tại (timestamp khi xác nhận)
  3. Frontend sẽ tự động lấy `updatedAt` làm `completedAt` khi status là `COMPLETED`

- **QUAN TRỌNG**: `completedAt` chính là `updatedAt` khi đơn hàng ở trạng thái `COMPLETED`
- Format timestamp: ISO 8601 (ví dụ: `2025-11-14T15:45:00.000Z`)

