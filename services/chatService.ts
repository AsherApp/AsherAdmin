import api from '../config/api';

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  chatRoomId: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  audios?: string[];
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      fullname?: string;
    };
  };
  receiver?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      fullname?: string;
    };
  };
}

export interface ChatRoom {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  user1?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      fullname?: string;
    };
  };
  user2?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      fullname?: string;
    };
  };
  messages?: ChatMessage[];
}

/**
 * Get ALL chat rooms in the system (admin view - see everything)
 */
export const getAllChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await api.get('/admin/chat-rooms');
  return response.data || response.data || [];
};

/**
 * Get all chat rooms for the current user (admin)
 * Uses admin endpoint to see ALL chat rooms
 */
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  return getAllChatRooms();
};

/**
 * Get messages for a specific chat room (by chatRoomId) - Admin view
 */
export const getChatRoomMessages = async (chatRoomId: string): Promise<ChatMessage[]> => {
  const response = await api.get(`/admin/chat-rooms/${chatRoomId}/messages`);
  return response.data || [];
};

/**
 * Get messages between current user and a specific receiver
 */
export const getChatMessages = async (receiverId: string): Promise<ChatMessage[]> => {
  const response = await api.get(`/chats/room/${receiverId}`);
  return response.data?.messages || response.messages || [];
};

/**
 * Send a message to a user
 */
export const sendMessage = async (
  receiverId: string,
  content: string,
  files?: File[]
): Promise<{ chatRoomId: string; message: ChatMessage }> => {
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append('receiverId', receiverId);
    formData.append('content', content);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.postFormData('/chats/room/message', formData);
    return response.data || response;
  } else {
    const response = await api.post('/chats/room/message', {
      receiverId,
      content,
    });
    return response.data || response;
  }
};

