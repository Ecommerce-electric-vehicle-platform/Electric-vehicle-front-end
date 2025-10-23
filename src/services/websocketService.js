// src/services/websocketService.js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
    this.listeners = new Map(); // Map<topic, Set<callbacks>>
  }

  // Kết nối WebSocket
  connect(onConnectedCallback, onErrorCallback) {
    const token = localStorage.getItem('token');
    const authType = localStorage.getItem('authType');

    // Chỉ connect cho user (buyer), không phải admin
    if (!token || authType === 'admin') {
      console.log('🔌 [WebSocket] ⏸️  Not connecting: No token or is admin');
      return;
    }

    console.log('🔌 [WebSocket] 🔄 Connecting to backend ws://localhost:8080/ws ...');

    // Tạo SockJS connection
    const socket = new SockJS('http://localhost:8080/ws');

    // Tạo STOMP client
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      
      connectHeaders: {
        Authorization: `Bearer ${token}`, // Gửi token để authenticate
      },

      debug: (str) => {
        console.log('[WebSocket Debug]:', str);
      },

      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('[WebSocket] 🎉 Successfully connected to Backend!');
        console.log('📡 [WebSocket] Connection details:', {
          backend: 'http://localhost:8080/ws',
          protocol: 'STOMP over SockJS',
          time: new Date().toLocaleTimeString()
        });
        this.connected = true;
        this.reconnectAttempts = 0;

        // Subscribe to personal notification topic
        this.subscribeToNotifications();

        if (onConnectedCallback) {
          onConnectedCallback();
        }
      },

      onStompError: (frame) => {
        console.error('❌ [WebSocket] STOMP Error:', frame);
        this.connected = false;

        if (onErrorCallback) {
          onErrorCallback(frame);
        }
      },

      onWebSocketClose: (event) => {
        console.log('⚠️  [WebSocket] Connection closed', event);
        this.connected = false;

        // Auto reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 [WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        } else {
          console.error('❌ [WebSocket] Max reconnect attempts reached. Please refresh the page.');
        }
      },

      onWebSocketError: (error) => {
        console.error('❌ [WebSocket] WebSocket Error:', error);
      },
    });

    // Activate connection
    this.stompClient.activate();
  }

  // Subscribe to notification topic
  subscribeToNotifications() {
    if (!this.stompClient || !this.connected) {
      console.warn('⚠️  [WebSocket] Cannot subscribe: Not connected');
      return;
    }

    const buyerId = localStorage.getItem('buyerId');
    if (!buyerId) {
      console.warn('⚠️  [WebSocket] Cannot subscribe: No buyerId in localStorage');
      return;
    }

    // Subscribe to personal queue: /queue/notifications/{buyerId}
    const destination = `/queue/notifications/${buyerId}`;
    
    console.log(`📡 [WebSocket] Subscribing to queue: ${destination}`);

    this.stompClient.subscribe(destination, (message) => {
      console.log('🔔 [WebSocket] 📩 New notification received from Backend!');
      
      try {
        const notification = JSON.parse(message.body);
        console.log('📋 [WebSocket] Notification data:', notification);
        
        // Notify all listeners
        this.notifyListeners(destination, notification);
      } catch (error) {
        console.error('❌ [WebSocket] Error parsing notification:', error);
      }
    });

    console.log('✅ [WebSocket] 🎧 Successfully subscribed to notifications!');
  }

  // Subscribe to a topic with callback
  subscribe(topic, callback) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    
    this.listeners.get(topic).add(callback);
    
    console.log(`[WebSocket] Added listener for ${topic}`);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(topic, callback);
    };
  }

  // Unsubscribe from a topic
  unsubscribe(topic, callback) {
    if (this.listeners.has(topic)) {
      this.listeners.get(topic).delete(callback);
      
      if (this.listeners.get(topic).size === 0) {
        this.listeners.delete(topic);
      }
      
      console.log(`[WebSocket] Removed listener for ${topic}`);
    }
  }

  // Notify all listeners for a topic
  notifyListeners(topic, data) {
    if (this.listeners.has(topic)) {
      this.listeners.get(topic).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WebSocket] Error in listener callback:', error);
        }
      });
    }
  }

  // Send message to server
  send(destination, body, headers = {}) {
    if (!this.stompClient || !this.connected) {
      console.warn('[WebSocket] Cannot send: Not connected');
      return;
    }

    this.stompClient.publish({
      destination,
      body: JSON.stringify(body),
      headers,
    });

    console.log(`[WebSocket] Sent message to ${destination}:`, body);
  }

  // Disconnect
  disconnect() {
    if (this.stompClient) {
      console.log('[WebSocket] Disconnecting...');
      this.stompClient.deactivate();
      this.connected = false;
      this.listeners.clear();
    }
  }

  // Check if connected
  isConnected() {
    return this.connected;
  }
}

// Singleton instance
const websocketService = new WebSocketService();
export default websocketService;

