import { useEffect, useRef } from "react";

/**
 * Custom React Hook to establish a persistent real-time WebSocket connection
 * with automatic reconnection and cleanup.
 *
 * WebSocket protocol (ws/wss) is derived from the backend API URL,
 * allowing a local frontend (http://localhost:5173) to connect to a
 * production backend (https://api-samling.naufalrafa.my.id) correctly.
 *
 * @param {Function} onMessage Callback invoked when a JSON message is received.
 */
export function useSensorWebSocket(onMessage) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let active = true;
    let reconnectTimeout = null;

    function connect() {
      if (!active) return;

      const baseApiUrl =
        import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000/api/v1";

      // Convert HTTP(S) API URL into WS(S)
      const wsUrl = baseApiUrl
        .replace(/^https:\/\//, "wss://")
        .replace(/^http:\/\//, "ws://")
        .replace(/\/api\/v1\/?$/, "/api/v1/ws/sensor");

      console.log("[WebSocket] Connecting to:", wsUrl);

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected.");
      };

      ws.onmessage = (event) => {
        if (!active) return;

        try {
          const payload = JSON.parse(event.data);
          onMessageRef.current?.(payload);
        } catch (err) {
          console.error("[WebSocket] Failed to parse message:", err);
        }
      };

      ws.onerror = (err) => {
        if (!active) return;

        console.error("[WebSocket] Error:", err);

        // Let onclose handle the reconnection
        ws.close();
      };

      ws.onclose = (event) => {
        if (!active) return;

        console.warn(
          `[WebSocket] Disconnected. Code=${event.code}, Reason="${event.reason}"`,
        );

        reconnectTimeout = setTimeout(() => {
          console.log("[WebSocket] Reconnecting...");
          connect();
        }, 3000);
      };
    }

    connect();

    return () => {
      active = false;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      if (socketRef.current) {
        console.log("[WebSocket] Closing connection...");
        socketRef.current.close();
      }
    };
  }, []);

  return socketRef;
}
