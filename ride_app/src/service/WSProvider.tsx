import { tokenStorage } from "@/store/storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { refresh_tokens } from "./apiInterceptors";

interface WSService {
  intializeSocket: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, cb: (data: any) => void) => void;
  off: (event: string, cb?: (data: any) => void) => void;
  removeListener: (listener: string) => void;
  updateAccessToken: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

const WSContext = createContext<WSService | undefined>(undefined);

export const WSProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socketAccessToken, setSocketAccessToken] = useState<string | null>(
    null
  );
  const socket = useRef<Socket | null>(null);
  const listeners = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const pendingEmits = useRef<Array<{ event: string; data?: any }>>([]);

  useEffect(() => {
    const token = tokenStorage.getString("access_token");
    setSocketAccessToken(token ?? null);
  }, []);

  // Re-bind listeners after reconnect
  const attachStoredListeners = useCallback((s: Socket) => {
    listeners.current.forEach((cbs, event) => {
      cbs.forEach((cb) => {
        s.on(event, cb);
      });
    });
  }, []);

  useEffect(() => {
    if (!socketAccessToken) {
      socket.current?.disconnect();
      socket.current = null;
      return;
    }

    if (socket.current) {
      socket.current.disconnect();
    }

    /**
     * React Native often drops custom headers on websocket upgrades.
     * Prefer Socket.IO `auth` + `query` (server reads all three).
     */
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        access_token: socketAccessToken,
      },
      query: {
        access_token: socketAccessToken,
      },
      extraHeaders: {
        access_token: socketAccessToken,
      },
    });

    socket.current = s;

    s.on("connect", () => {
      console.log("[WS] connected", s.id);
      attachStoredListeners(s);
      if (pendingEmits.current.length) {
        const queue = [...pendingEmits.current];
        pendingEmits.current = [];
        queue.forEach(({ event, data }) => {
          console.log("[WS] flushing pending emit:", event);
          s.emit(event, data);
        });
      }
    });

    s.on("disconnect", (reason) => {
      console.log("[WS] disconnected", reason);
    });

    s.on("connect_error", async (error) => {
      console.log("[WS] connect_error", error.message);
      if (error.message?.toLowerCase().includes("authentication")) {
        const newToken = await refresh_tokens();
        if (newToken) {
          setSocketAccessToken(newToken);
        }
      }
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
      if (socket.current === s) socket.current = null;
    };
  }, [socketAccessToken, attachStoredListeners]);

  // Refresh socket when app comes back to foreground
  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state === "active") {
        const token = tokenStorage.getString("access_token");
        if (token && !socket.current?.connected) {
          setSocketAccessToken(token);
          socket.current?.connect();
        }
      }
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => sub.remove();
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    const s = socket.current;
    if (!s) {
      console.log("[WS] emit pending (no socket yet):", event);
      pendingEmits.current.push({ event, data });
      return;
    }
    if (!s.connected) {
      console.log("[WS] emit queued until connect:", event);
      pendingEmits.current.push({ event, data });
      return;
    }
    s.emit(event, data);
  }, []);

  const on = useCallback((event: string, cb: (data: any) => void) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, new Set());
    }
    listeners.current.get(event)!.add(cb);
    socket.current?.on(event, cb);
  }, []);

  const off = useCallback((event: string, cb?: (data: any) => void) => {
    if (cb) {
      listeners.current.get(event)?.delete(cb);
      socket.current?.off(event, cb);
      return;
    }
    listeners.current.delete(event);
    socket.current?.removeAllListeners(event);
  }, []);

  const removeListener = useCallback((listenerName: string) => {
    listeners.current.delete(listenerName);
    socket.current?.removeListener(listenerName);
  }, []);

  const disconnect = useCallback(() => {
    socket.current?.disconnect();
    socket.current = null;
    setSocketAccessToken(null);
  }, []);

  const updateAccessToken = useCallback(() => {
    const token = tokenStorage.getString("access_token");
    setSocketAccessToken(token ?? null);
  }, []);

  const isConnected = useCallback(() => Boolean(socket.current?.connected), []);

  const socketService: WSService = useMemo(
    () => ({
      intializeSocket: () => {},
      disconnect,
      emit,
      off,
      on,
      removeListener,
      updateAccessToken,
      isConnected,
    }),
    [disconnect, emit, off, on, removeListener, updateAccessToken, isConnected]
  );

  return (
    <WSContext.Provider value={socketService}>{children}</WSContext.Provider>
  );
};

export const useWS = (): WSService => {
  const socketService = useContext(WSContext);
  if (!socketService) {
    throw new Error("useWS must be used within a WSProvider");
  }
  return socketService;
};
