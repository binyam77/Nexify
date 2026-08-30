import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Socket } from "socket.io-client";
import {
  connectSocket,
  disconnectSocket,
  updateSocketAuth,
} from "../lib/socket-client";
import { useAuth } from "./AuthContext";
import type { MessageMediaType } from "../api/community.api";

// Mirrors RealtimeScope on the backend (src/realtime/dto/join-room.dto.ts)
// exactly — lowercase string values, since these are sent as literal
// event payload fields, not just local type labels.
export type RealtimeScope = "community" | "conversation";

interface SendMessagePayload {
  scope: RealtimeScope;
  targetId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: MessageMediaType;
  clientMessageId?: string;
}

interface RealtimeContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (
    scope: RealtimeScope,
    targetId: string,
  ) => Promise<{ joined: true }>;
  leaveRoom: (
    scope: RealtimeScope,
    targetId: string,
  ) => Promise<{ left: true }>;
  sendMessage: (payload: SendMessagePayload) => Promise<unknown>;
  markRead: (
    scope: RealtimeScope,
    targetId: string,
  ) => Promise<{ acknowledged: true }>;
  startTyping: (scope: RealtimeScope, targetId: string) => void;
  stopTyping: (scope: RealtimeScope, targetId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

/**
 * Wraps a Socket.IO emit that expects an acknowledgement callback in a
 * Promise, AND races it against the Gateway's `exception` event — Nest's
 * WsException (thrown by e.g. "not a member of this community") is
 * delivered via a socket-level `exception` event, not through the ack
 * callback itself, so a plain ack-only wrapper would hang forever on an
 * error instead of rejecting.
 */
function emitWithAck<T>(
  socket: Socket,
  event: string,
  payload: unknown,
  timeoutMs = 10_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.off("exception", onException);
      reject(new Error(`Timed out waiting for a response to "${event}".`));
    }, timeoutMs);

    function onException(err: { message?: string } | string) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.off("exception", onException);
      reject(
        new Error(
          typeof err === "string" ? err : (err?.message ?? "Request failed."),
        ),
      );
    }

    socket.once("exception", onException);

    socket.emit(event, payload, (response: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.off("exception", onException);
      resolve(response);
    });
  });
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { accessToken, isLoggedIn } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect once we have a token; fully disconnect on logout. Does NOT
  // reconnect on every accessToken change — see the effect below, which
  // keeps an ALREADY-open socket's auth payload in sync instead (avoids
  // tearing down active room subscriptions every 15 minutes just because
  // the token silently refreshed).
  //
  // setState calls here sync React state with an EXTERNAL system (the
  // socket connection) — same justified pattern already used in
  // community.tsx for the location.state redirect effect.
  /* eslint-disable react-hooks/set-state-in-effect -- syncing to an external Socket.IO connection is the correct pattern here */
  useEffect(() => {
    if (!isLoggedIn || !accessToken) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const nextSocket = connectSocket(accessToken);
    setSocket(nextSocket);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    nextSocket.on("connect", handleConnect);
    nextSocket.on("disconnect", handleDisconnect);
    if (nextSocket.connected) setIsConnected(true);

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("disconnect", handleDisconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally NOT re-running on every accessToken change, see comment above
  }, [isLoggedIn]);
  /* eslint-enable react-hooks/set-state-in-effect */
  // Keeps an already-connected socket's auth payload current so the NEXT
  // reconnect attempt (e.g. after a network blip) uses the latest token
  // instead of the one from initial connect — see socket-client.ts's
  // updateSocketAuth for why this doesn't force an immediate reconnect.
  useEffect(() => {
    if (accessToken) updateSocketAuth(accessToken);
  }, [accessToken]);

  const requireSocket = (): Socket => {
    if (!socket) {
      throw new Error("Realtime connection is not available yet.");
    }
    return socket;
  };

  const joinRoom: RealtimeContextType["joinRoom"] = (scope, targetId) =>
    emitWithAck(requireSocket(), "room:join", { scope, targetId });

  const leaveRoom: RealtimeContextType["leaveRoom"] = (scope, targetId) =>
    emitWithAck(requireSocket(), "room:leave", { scope, targetId });

  const sendMessage: RealtimeContextType["sendMessage"] = (payload) =>
    emitWithAck(requireSocket(), "message:send", payload);

  const markRead: RealtimeContextType["markRead"] = (scope, targetId) =>
    emitWithAck(requireSocket(), "message:read", { scope, targetId });

  // Typing events are fire-and-forget (no ack expected — see the
  // backend's typing:start/stop handlers, which return void).
  const startTyping: RealtimeContextType["startTyping"] = (scope, targetId) => {
    socket?.emit("typing:start", { scope, targetId });
  };
  const stopTyping: RealtimeContextType["stopTyping"] = (scope, targetId) => {
    socket?.emit("typing:stop", { scope, targetId });
  };

  return (
    <RealtimeContext.Provider
      value={{
        socket: socket,
        isConnected,
        joinRoom,
        leaveRoom,
        sendMessage,
        markRead,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime ከ RealtimeProvider ውጪ ጥቅም ላይ ዋለ");
  return context;
}
