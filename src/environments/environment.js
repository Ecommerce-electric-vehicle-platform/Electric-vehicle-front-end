export const Environment = {
  production: false,
  GG_CLIENT_ID: import.meta.env.VITE_GG_CLIENT_ID,
  // WebSocket Configuration
  WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080'
};
