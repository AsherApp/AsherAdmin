import api from '../config/api';
import {
  inviteLandlord,
  resendLandlordInvite,
  cancelLandlordInvite,
  setLandlordTempPassword,
} from './adminService';
import { CreateUserData } from './authService';
import { UserProfile } from '../types';

export interface User {
  id: string;
  email: string;
  role: string | string[];
  isVerified?: boolean;
  status?: UserProfile['status'];
  name?: string;
  systemId?: string;
  lastActive?: string;
  phone?: string;
  ticketsRaised?: number;
  profile?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
  landlords?: {
    id: string;
  };
  tenant?: {
    id: string;
    tenantWebUserEmail?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const mapLandlordToUserProfile = (user: User): UserProfile => ({
  id: user.id,
  name: user.name || user.email.split('@')[0],
  email: user.email,
  role: typeof user.role === 'string' ? user.role : 'Landlord',
  systemId: user.systemId || '4',
  status: user.status || (user.isVerified ? 'Active' : 'Pending Invite'),
  lastActive: user.lastActive || 'Invitation sent',
  phone: user.phone || user.profile?.phoneNumber || '',
  ticketsRaised: user.ticketsRaised || 0,
});

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User> => {
  const response = await api.get(`/users/${userId}`);
  return response.data || response;
};

/**
 * Invite landlord for AsherLandlordFE
 * This creates a user without password and sends invitation email
 * User will receive email with link to set password, then can login
 */
export const inviteLandlordForFE = async (userData: {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}): Promise<{ userId: string; email: string; invitationLink?: string; emailSent?: boolean; emailError?: string }> => {
  const response = await inviteLandlord(userData);
  return response.data || response;
};

/**
 * Create user for AsherLandlordFE (DEPRECATED)
 * @deprecated Use inviteLandlordForFE() instead - it follows the proper invitation flow
 */
export const createUserForFE = async (userData: CreateUserData): Promise<User> => {
  // This is deprecated - use inviteLandlordForFE instead
  const response = await inviteLandlord({
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phoneNumber: userData.phoneNumber,
  });
  return response.data || response;
};

/**
 * Get all landlords (users) for Rent Management System
 */
export const getAllLandlords = async (page: number = 1, limit: number = 50, search: string = ''): Promise<{ data: User[]; total: number; page: number; limit: number }> => {
  try {
    console.log('🔄 Fetching landlords:', { page, limit, search });
    const response = await api.get(`/admin/landlords?page=${page}&limit=${limit}&search=${search}`);
    console.log('✅ Landlords response:', response);
    
    // Backend returns: { success: true, data: [...], total: number, page: number, limit: number }
    if (response.success && response.data) {
      return {
        data: (Array.isArray(response.data) ? response.data : []).map(mapLandlordToUserProfile),
        total: response.total || response.data?.length || 0,
        page: response.page || page,
        limit: response.limit || limit,
      };
    }
    
    // Fallback if structure is different
    const fallbackData = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
    return {
      data: fallbackData.map(mapLandlordToUserProfile),
      total: response.total || 0,
      page: response.page || page,
      limit: response.limit || limit,
    };
  } catch (error: any) {
    console.error('❌ Error fetching landlords:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
    });
    return { data: [], total: 0, page, limit };
  }
};

/**
 * Get all users (if endpoint exists) - DEPRECATED, use getAllLandlords
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data } = await getAllLandlords(1, 1000);
    return data as unknown as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export { resendLandlordInvite, cancelLandlordInvite, setLandlordTempPassword };

