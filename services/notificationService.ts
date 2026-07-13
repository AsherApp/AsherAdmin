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
  total: number;
  unreadCount: number;
}

/**
 * Get all notifications for the current admin user
 * Backend endpoint: GET /api/notification/me
 */
export const getAllNotifications = async (): Promise<NotificationResponse> => {
  try {
    console.log('🔄 Fetching notifications...');
    const response = await api.get('/notification/me');
    console.log('✅ Notifications response:', response);
    
    // Backend returns notifications array directly or wrapped
    if (response.notifications) {
      return {
        notifications: Array.isArray(response.notifications) ? response.notifications : [],
        total: response.total || 0,
        unreadCount: response.unreadCount || 0,
      };
    }
    
    // If response.data contains the notifications
    if (response.data && Array.isArray(response.data)) {
      const unread = response.data.filter((n: Notification) => !n.isRead).length;
      return {
        notifications: response.data,
        total: response.data.length,
        unreadCount: unread,
      };
    }
    
    // Fallback
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
    };
  } catch (error: any) {
    console.error('❌ Error fetching notifications:', error);
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
    };
  }
};

/**
 * Get unread notifications only
 * Backend has no dedicated /unread endpoint, so we filter from /me
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await getAllNotifications();
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
  try {
    // Get all notifications first
    const { notifications } = await getAllNotifications();
    
    // Delete each notification individually
    const deletePromises = notifications.map(n => 
      api.delete(`/notification/${n.id}`).catch(() => {
        // Silently ignore individual delete failures
      })
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing notifications, falling back to mark-all-read:', error);
    // Fallback: at least mark them all as read
    await markAllAsRead();
  }
};
