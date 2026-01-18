import api from '../config/api';

export interface Notification {
  id: string;
  sourceId?: string;
  destId: string;
  title: string;
  message: string;
  category?: string;
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
 */
export const getAllNotifications = async (): Promise<NotificationResponse> => {
  try {
    console.log('🔄 Fetching notifications...');
    const response = await api.get('/notification/me');
    console.log('✅ Notifications response:', response);
    
    // Backend returns: { notifications: [...], total: number, unreadCount: number }
    if (response.notifications) {
      return {
        notifications: Array.isArray(response.notifications) ? response.notifications : [],
        total: response.total || 0,
        unreadCount: response.unreadCount || 0,
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
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get('/notification/unread');
    if (response.notifications) {
      return Array.isArray(response.notifications) ? response.notifications : [];
    }
    return [];
  } catch (error: any) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await api.patch(`/notification/${notificationId}/read`);
  return response;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.patch('/notification/read-all');
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notification/${notificationId}`);
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  await api.delete('/notification/clear-all');
};

