# 🔧 WebSocket Troubleshooting

## Lỗi: "global is not defined"

### Vấn đề
```
Uncaught ReferenceError: global is not defined
    at node_modules/sockjs-client/lib/utils/browser-crypto.js
```

### Nguyên nhân
SockJS cần biến `global` nhưng browser không có. Đây là lỗi phổ biến với Vite + SockJS.

### Đã fix (2 cách)

#### Fix 1: index.html (Đã apply)
```html
<!-- Fix SockJS "global is not defined" error -->
<script>
  window.global = window;
</script>
```

#### Fix 2: vite.config.js (Đã apply)
```javascript
export default defineConfig({
  // ...
  define: {
    global: 'window',
  },
});
```

### 🔄 Restart Dev Server

**QUAN TRỌNG:** Sau khi fix, bạn PHẢI restart dev server:

```bash
# Stop server (Ctrl + C)
# Then restart:
npm run dev
```

## Test lại

1. **Clear browser cache:**
   - Ctrl + Shift + R (Windows/Linux)
   - Cmd + Shift + R (Mac)

2. **Check Console:**
   ```
   Không còn lỗi "global is not defined"
   [WebSocket] Connecting to backend...
   ```

3. **Nếu vẫn lỗi:**
   - Clear browser cache hoàn toàn
   - Xóa folder `node_modules/.vite`
   - Restart dev server

## Alternative: Tắt WebSocket tạm thời

Nếu vẫn không được, tắt WebSocket và dùng Polling:

File: `src/services/notificationService.js`

```javascript
const USE_WEBSOCKET = false; //Tắt WebSocket, dùng Polling
```

Hệ thống vẫn hoạt động bình thường, chỉ có delay 10s thay vì realtime.

## Các lỗi khác

### Lỗi: "Cannot read property 'addEventListener' of undefined"

**Fix:** Đảm bảo `window` đã được define trước khi import SockJS.

### Lỗi: "WebSocket connection failed"

**Nguyên nhân:** Backend chưa chạy hoặc endpoint sai

**Check:**
1. Backend đang chạy? (http://localhost:8080)
2. WebSocket endpoint `/ws` có hoạt động không?
3. CORS đã được enable?

**Frontend sẽ tự động fallback to polling nếu WebSocket fail.**

### Lỗi: Build production fail

Nếu lỗi khi build:

```bash
npm run build
```

**Fix thêm trong vite.config.js:**

```javascript
export default defineConfig({
  // ...
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['sockjs-client', '@stomp/stompjs'],
  },
});
```

## Checklist

- [x] Thêm `window.global = window` vào index.html
- [x] Thêm `define: { global: 'window' }` vào vite.config.js
- [ ] Restart dev server
- [ ] Clear browser cache (Ctrl + Shift + R)
- [ ] Test lại

## Nếu vẫn lỗi

1. **Check Console logs:** Xem có lỗi gì khác không
2. **Tắt WebSocket tạm thời:** `USE_WEBSOCKET = false`
3. **Check Browser:** Thử browser khác (Chrome, Firefox)
4. **Node version:** Đảm bảo Node >= 16

---

**Status:** Fixed  
**Next:** Restart dev server và test lại

