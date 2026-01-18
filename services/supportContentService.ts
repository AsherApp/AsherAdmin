import api from '../config/api';

// ============ Types ============
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    email: string;
    profile?: {
      fullname?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  updater?: {
    id: string;
    email: string;
    profile?: {
      fullname?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  readTime: string;
  views: number;
  thumbnail?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    email: string;
    profile?: {
      fullname?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  updater?: {
    id: string;
    email: string;
    profile?: {
      fullname?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  category: string;
  views: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    email: string;
    profile?: {
      fullname?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  updater?: {
    id: string;
    email: string;
    profile?: {
      fullname?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface SupportAgent {
  id: string;
  userId: string;
  name: string;
  role: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  isActive: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    profile?: {
      fullname?: string;
      firstName?: string;
      lastName?: string;
      profileUrl?: string;
    };
    onlineStatus?: string;
  };
}

// ============ FAQ Service ============
export const getAllFAQs = async (category?: string, isPublished?: boolean, search?: string): Promise<FAQ[]> => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (isPublished !== undefined) params.append('isPublished', String(isPublished));
  if (search) params.append('search', search);
  
  const response = await api.get(`/support-content/faqs?${params.toString()}`);
  return response.data || [];
};

export const getFAQById = async (id: string): Promise<FAQ> => {
  const response = await api.get(`/support-content/faqs/${id}`);
  return response.data;
};

export const createFAQ = async (data: {
  question: string;
  answer: string;
  category: string;
  order?: number;
  isPublished?: boolean;
}): Promise<FAQ> => {
  const response = await api.post('/support-content/faqs', data);
  return response.data;
};

export const updateFAQ = async (id: string, data: {
  question?: string;
  answer?: string;
  category?: string;
  order?: number;
  isPublished?: boolean;
}): Promise<FAQ> => {
  const response = await api.patch(`/support-content/faqs/${id}`, data);
  return response.data;
};

export const deleteFAQ = async (id: string): Promise<void> => {
  await api.delete(`/support-content/faqs/${id}`);
};

// ============ Help Article Service ============
export const getAllHelpArticles = async (category?: string, isPublished?: boolean, search?: string): Promise<HelpArticle[]> => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (isPublished !== undefined) params.append('isPublished', String(isPublished));
  if (search) params.append('search', search);
  
  const response = await api.get(`/support-content/help-articles?${params.toString()}`);
  return response.data || [];
};

export const getHelpArticleById = async (id: string): Promise<HelpArticle> => {
  const response = await api.get(`/support-content/help-articles/${id}`);
  return response.data;
};

export const createHelpArticle = async (data: {
  title: string;
  description: string;
  content: string;
  category: string;
  readTime: string;
  thumbnail?: string;
  isPublished?: boolean;
}): Promise<HelpArticle> => {
  const response = await api.post('/support-content/help-articles', data);
  return response.data;
};

export const updateHelpArticle = async (id: string, data: {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  readTime?: string;
  thumbnail?: string;
  isPublished?: boolean;
}): Promise<HelpArticle> => {
  const response = await api.patch(`/support-content/help-articles/${id}`, data);
  return response.data;
};

export const deleteHelpArticle = async (id: string): Promise<void> => {
  await api.delete(`/support-content/help-articles/${id}`);
};

// ============ Video Tutorial Service ============
export const getAllVideoTutorials = async (category?: string, isPublished?: boolean, search?: string): Promise<VideoTutorial[]> => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (isPublished !== undefined) params.append('isPublished', String(isPublished));
  if (search) params.append('search', search);
  
  const response = await api.get(`/support-content/video-tutorials?${params.toString()}`);
  return response.data || [];
};

export const getVideoTutorialById = async (id: string): Promise<VideoTutorial> => {
  const response = await api.get(`/support-content/video-tutorials/${id}`);
  return response.data;
};

export const createVideoTutorial = async (data: {
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  category: string;
  isPublished?: boolean;
}): Promise<VideoTutorial> => {
  const response = await api.post('/support-content/video-tutorials', data);
  return response.data;
};

export const updateVideoTutorial = async (id: string, data: {
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: string;
  duration?: string;
  category?: string;
  isPublished?: boolean;
}): Promise<VideoTutorial> => {
  const response = await api.patch(`/support-content/video-tutorials/${id}`, data);
  return response.data;
};

export const deleteVideoTutorial = async (id: string): Promise<void> => {
  await api.delete(`/support-content/video-tutorials/${id}`);
};

// ============ Support Agent Service ============
export const getAllSupportAgents = async (isActive?: boolean, status?: string): Promise<SupportAgent[]> => {
  const params = new URLSearchParams();
  if (isActive !== undefined) params.append('isActive', String(isActive));
  if (status) params.append('status', status);
  
  const response = await api.get(`/support-content/support-agents?${params.toString()}`);
  return response.data || [];
};

export const getSupportAgentById = async (id: string): Promise<SupportAgent> => {
  const response = await api.get(`/support-content/support-agents/${id}`);
  return response.data;
};

export const createSupportAgent = async (data: {
  userId: string;
  name: string;
  role: string;
  status?: string;
  isActive?: boolean;
}): Promise<SupportAgent> => {
  const response = await api.post('/support-content/support-agents', data);
  return response.data;
};

export const updateSupportAgent = async (id: string, data: {
  name?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
}): Promise<SupportAgent> => {
  const response = await api.patch(`/support-content/support-agents/${id}`, data);
  return response.data;
};

export const deleteSupportAgent = async (id: string): Promise<void> => {
  await api.delete(`/support-content/support-agents/${id}`);
};

