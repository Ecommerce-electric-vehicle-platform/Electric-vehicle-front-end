import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,       // cố định port 5173
    strictPort: true, // nếu port 5173 bị chiếm thì sẽ báo lỗi chứ không tự đổi port
  },
})
