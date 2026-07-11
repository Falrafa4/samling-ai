import { useEffect, useRef } from 'react';

/**
 * Custom React Hook to establish a persistent real-time WebSocket connection
 * with auto-reconnection and automated component unmount cleanup.
 * 
 * Uses a ref-based callback pattern to prevent reconnection loops when parent
 * components re-render or pass anonymous callback functions.
 * 
 * @param {Function} onMessage Callback function triggered upon receiving a valid JSON WebSocket message.
 */
export function useSensorWebSocket(onMessage) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback reference updated without triggering effect reconnection
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let active = true;
    let reconnectTimeout = null;

    function connect() {
      if (!active) return;

      // Dynamically resolve WebSocket connection protocol and URL host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Fallback base URL resolution
      const baseApiUrl = import.meta.env.VITE_BASE_API_URL || 'http://localhost:8000/api/v1';
      let wsHost = baseApiUrl.replace(/^https?:\/\//, '').replace('/api/v1', '');
      const wsUrl = `${protocol}//${wsHost}/api/v1/ws/sensor`;

      console.log('[WebSocket] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const payload = JSON.parse(event.data);
          if (onMessageRef.current) {
            onMessageRef.current(payload);
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing JSON payload:', err);
        }
      };

      ws.onclose = (event) => {
        if (!active) return;
        console.log('[WebSocket] Connection closed. Code:', event.code, 'Reason:', event.reason);
        console.log('[WebSocket] Reconnecting in 3 seconds...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error encountered:', err);
        ws.close(); // Triggers onclose reconnection path
      };
    }

    connect();

    // Cleanup hook on unmount
    return () => {
      active = false;
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        console.log('[WebSocket] Component unmounting, closing connection.');
        socketRef.current.close();
      }
    };
  }, []);
}
