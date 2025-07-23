import React, { useEffect, useState, useRef, memo } from "react";
import WebSocketService from "../../services/WebSocketService";
import { useWebSocketConnectionStore } from "../../store/useWebSocketConnectionStore";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "react-toastify";

export const ConnectionStatus: React.FC = memo(() => {
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(
    WebSocketService.isConnected()
  );
  const timersRef = useRef<{
    fadeTimer?: NodeJS.Timeout;
    hideTimer?: NodeJS.Timeout;
  }>({});

  const checkAndReconnect = () => {
    try {
      // Check current connection state
      const currentState = WebSocketService.getConnectionState();

      if (currentState !== "CONNECTED") {
        // Use the WebSocket connection store to handle reconnection
        const { connectWebSocket } = useWebSocketConnectionStore.getState() as {
          connectWebSocket: () => void;
        };
        connectWebSocket();

        toast.info("Attempting to reconnect...", {
          toastId: "reconnect-attempt",
          autoClose: 2000,
        });
      } else {
        toast.success("Connection is active", {
          toastId: "connection-active",
          autoClose: 1000,
        });
      }
    } catch (error) {
      console.error("Connection check failed:", error);
      toast.error("Failed to check connection status");
    }
  };

  useEffect(() => {
    // Set initial state
    setIsConnected(WebSocketService.isConnected());

    // Listen to connection state changes
    const unsubscribe = WebSocketService.registerConnectionStateListener(
      (state) => {
        const connected = state === "CONNECTED";
        setIsConnected(connected);

        // Log state changes for debugging
        console.log(`WebSocket connection state changed: ${state}`);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Clear existing timers
    const clearTimers = () => {
      if (timersRef.current.fadeTimer) {
        clearTimeout(timersRef.current.fadeTimer);
        timersRef.current.fadeTimer = undefined;
      }
      if (timersRef.current.hideTimer) {
        clearTimeout(timersRef.current.hideTimer);
        timersRef.current.hideTimer = undefined;
      }
    };

    clearTimers();

    if (!isConnected) {
      // Show disconnected status immediately and keep it visible
      setShowStatus(true);
      setFadeOut(false);
    } else {
      // Show connected status briefly, then fade out
      setShowStatus(true);
      setFadeOut(false);

      // Start fade out after 3 seconds
      timersRef.current.fadeTimer = setTimeout(() => {
        setFadeOut(true);

        // Hide completely after fade animation (1 second)
        timersRef.current.hideTimer = setTimeout(() => {
          setShowStatus(false);
        }, 1000);
      }, 3000);
    }

    // Cleanup function
    return clearTimers;
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timersRef.current.fadeTimer) {
        clearTimeout(timersRef.current.fadeTimer);
      }
      if (timersRef.current.hideTimer) {
        clearTimeout(timersRef.current.hideTimer);
      }
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center space-x-2 rounded-full px-3 py-2 text-sm font-medium shadow-lg transition-opacity duration-1000 cursor-pointer hover:shadow-xl ${
        fadeOut ? "opacity-0" : "opacity-100"
      } ${
        isConnected
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-red-100 text-red-800 hover:bg-red-200"
      }`}
      onClick={checkAndReconnect}
      title={
        isConnected
          ? "Connection active - Click to verify"
          : "Connection lost - Click to reconnect"
      }
    >
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 animate-pulse" />
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
});
