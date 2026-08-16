
export enum SystemStatus {
  OPERATIONAL = 'Operational',
  DEGRADED = 'Degraded',
  MAINTENANCE = 'Maintenance',
  DOWN = 'Down',
  NOT_MONITORED = 'Not monitored'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  PENDING = 'PENDING'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export interface MonitoredSystem {
  id: string;
  name: string;
  type: 'Mobile App' | 'Web App' | 'Website';
  status: SystemStatus;
  uptime: number | null; // percentage; null when not yet integrated with live monitoring
  activeUsers: number | null;
  lastCheck: string;
  version: string;
}

export interface TicketHistory {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

export interface Ticket {
  id: string;
  ticketCode?: string; // Human-readable ticket code (e.g., LJA-2311251200)
  sourceSystemId: string; // Which app raised it
  subject: string;
  description: string;
  user: string;
  userId?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  aiSummary?: string;
  messages: TicketMessage[];
  history?: TicketHistory[];
}

export interface TicketMessage {
  id: string;
  sender: 'User' | 'Support' | 'System';
  text: string;
  timestamp: string;
}

export interface FileAsset {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  // New fields for Asher Admin
  category: 'Legal' | 'Invoice' | 'Image' | 'Other' | 'Template' | 'FAQ' | 'Guide';
  systemId: string; // '1', '2', '3', '4', '5' or 'all'
  content?: string; // For created docs
  status?: 'Draft' | 'Published';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  systemId: string; // The primary system they belong to
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending Invite';
  lastActive: string;
  avatarUrl?: string;
  phone?: string;
  ticketsRaised?: number;
}

export interface ChatThread {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  systemId: string; // Context of the chat
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'me' or userId
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface Email {
  id: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  from: { name: string; email: string; avatar?: string };
  to: { name: string; email: string }[];
  subject: string;
  body: string; // Supports HTML or plain text
  timestamp: string;
  isRead: boolean;
  hasAttachment?: boolean;
  isStarred?: boolean;
}

export interface AppNotification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'message';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLink?: string;
}
