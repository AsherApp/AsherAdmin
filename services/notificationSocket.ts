import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectedUserId: string | null = null;

type LiveHandler = (payload: Record<string, unknown>) => void;
const handlers = new Set<LiveHandler>();

function getApiOrigin(): string {
  // @ts-ignore vite env
  const env = import.meta.env as Record<string, string | undefined>;
  const raw = (env.VITE_API_BASE_URL || '').trim();
  if (!raw) return '';
  let normalized = raw.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  return normalized.replace(/\/api\/?$/, '');
}

function notify(payload: Record<string, unknown>) {
  handlers.forEach((handler) => handler(payload));
}

export function connectAdminNotifications(userId: string, token: string): Socket | null {
  const origin = getApiOrigin();
  if (!origin || !userId || !token) return null;

  if (socket && connectedUserId === userId && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    autoConnect: true,
  });
  connectedUserId = userId;

  const join = () => {
    socket?.emit('join_user_room', userId);
    socket?.emit('join', { senderId: userId });
  };

  socket.on('connect', join);
  socket.on('reconnect', join);
  socket.on('notification', (payload: Record<string, unknown>) => notify(payload));
  socket.on('payment_notification', (payload: Record<string, unknown>) => notify(payload));

  return socket;
}

export function disconnectAdminNotifications() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  connectedUserId = null;
}

export function subscribeAdminLiveNotifications(handler: LiveHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}
