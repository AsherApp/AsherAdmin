import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectedUserId: string | null = null;
let subscriberCount = 0;
let teardownTimer: ReturnType<typeof setTimeout> | null = null;

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

function joinRooms(userId: string) {
  socket?.emit('join_user_room', userId);
  socket?.emit('join', { senderId: userId });
}

export function isAdminRealtimeConnected() {
  return Boolean(socket?.connected);
}

export function connectAdminNotifications(userId: string, token: string): Socket | null {
  const origin = getApiOrigin();
  subscriberCount += 1;
  if (teardownTimer) {
    clearTimeout(teardownTimer);
    teardownTimer = null;
  }

  if (!origin || !userId || !token) {
    return socket;
  }

  if (socket && connectedUserId === userId) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(origin, {
    auth: { token },
    transports: ['polling', 'websocket'],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 20000,
    autoConnect: true,
    withCredentials: false,
    path: '/socket.io',
  });
  connectedUserId = userId;

  socket.on('connect', () => joinRooms(userId));
  socket.on('reconnect', () => joinRooms(userId));
  socket.on('notification', (payload: Record<string, unknown>) => notify(payload));
  socket.on('payment_notification', (payload: Record<string, unknown>) => notify(payload));
  socket.on('privateMessage', (payload: Record<string, unknown>) => notify({ ...payload, type: 'privateMessage' }));
  socket.on('newEmail', (payload: Record<string, unknown>) => notify({ ...payload, type: 'newEmail' }));
  socket.on('ticket_created', (payload: Record<string, unknown>) => notify({ ...payload, type: 'ticket_created' }));
  socket.on('ticket_message_added', (payload: Record<string, unknown>) => notify({ ...payload, type: 'ticket_message_added' }));
  socket.on('ticket_status_updated', (payload: Record<string, unknown>) => notify({ ...payload, type: 'ticket_status_updated' }));

  return socket;
}

export function disconnectAdminNotifications() {
  subscriberCount = Math.max(0, subscriberCount - 1);
  if (subscriberCount > 0) return;
  if (teardownTimer) clearTimeout(teardownTimer);
  teardownTimer = setTimeout(() => {
    teardownTimer = null;
    if (subscriberCount > 0) return;
    if (!socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    connectedUserId = null;
  }, 800);
}

export function subscribeAdminLiveNotifications(handler: LiveHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/** HTTP fallback only while the socket is down. Engine.IO already polls the socket itself. */
export function pollWhileDisconnected(load: () => void, everyMs = 12000): () => void {
  const id = setInterval(() => {
    if (!isAdminRealtimeConnected()) load();
  }, everyMs);
  return () => clearInterval(id);
}
