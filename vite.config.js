import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, 
    strictPort: true, 
  },
  define: {
    // Fix SockJS "global is not defined" error
    global: 'window',
  },
});
