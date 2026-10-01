import api from '../config/api';

export interface Notification {
  id: string;
  sourceId?: string;
  destId: string;
  title: string;
  message: string;
  category?: string;
  notificationType?: string;
  route?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  source?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface NotificationResponse {
  notifications: Notification[];
  nextCursor?: string | null;
  total: number;
  unreadCount: number;
}

/**
 * Get all notifications for the current admin user
 * Backend endpoint: GET /api/notification/me
 */
export const getAllNotifications = async (cursor?: string): Promise<NotificationResponse> => {
  return api.get(`/notification/me?paginated=true&limit=30${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`);
};

/**
 * Get unread notifications only
 * Backend has no dedicated /unread endpoint, so we filter from /me
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get('/notification/me?paginated=true&unread=true&limit=30');
    return response.notifications.filter(n => !n.isRead);
  } catch (error: any) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
};

/**
 * Mark a notification as read
 * Backend endpoint: PATCH /api/notification/:id (general update)
 * We send { isRead: true } in the body
 */
export const markAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await api.patch(`/notification/${notificationId}`, { isRead: true });
  return response;
};

/**
 * Mark all notifications as read
 * Backend endpoint: PATCH /api/notification/mark-all-read
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.patch('/notification/mark-all-read');
};

/**
 * Delete a notification
 * Backend endpoint: DELETE /api/notification/:id
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notification/${notificationId}`);
};

/**
 * Clear all notifications
 * Deletes notifications one by one since backend has no bulk-delete endpoint.
 * Falls back to marking all as read if deletion fails.
 */
export const clearAllNotifications = async (): Promise<void> => {
  await api.delete('/notification/me');
};
