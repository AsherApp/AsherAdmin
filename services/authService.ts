import api from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: any;
    token: string;
    refreshToken?: string;
  };
  message?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: 'LANDLORD' | 'TENANT' | 'VENDOR' | 'WEBUSER';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isVerified?: boolean;
}

/**
 * Login to admin dashboard
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Backend ApiResponse.success() wraps data as: 
    // { success: true, message: "...", data: { data: { token, refreshToken, userDetails }, meta: {...} } }
    // So we need to access response.data.data for the actual data
    if (response.success && response.data) {
      // ApiResponse wraps the actual data in response.data.data
      const responseData = response.data.data || response.data;
      const token = responseData.token || responseData.accessToken;
      const user = responseData.userDetails || responseData.user;
      
      if (token) {
        localStorage.setItem('admin_token', token);
        // Store refresh token for automatic token refresh
        if (responseData.refreshToken) {
          localStorage.setItem('admin_refresh_token', responseData.refreshToken);
        }
        if (user) {
          localStorage.setItem('admin_user', JSON.stringify(user));
        }
        
        return {
          success: true,
          data: {
            token,
            refreshToken: responseData.refreshToken,
            user: user || {},
          },
          message: response.message || 'Login successful',
        };
      } else {
        console.error('No token in response. Response structure:', {
          response,
          data: response.data,
          nestedData: response.data?.data,
        });
      }
    }
    
    // If we get here, something is wrong with the response
    console.error('Login failed - invalid response structure:', response);
    return {
      success: false,
      data: { user: null, token: '' },
      message: response.message || 'Login failed. Invalid response from server.',
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      data: { user: null, token: '' },
      message: error.message || 'An error occurred during login.',
    };
  }
};

/**
 * Logout from admin dashboard
 */
export const logout = (): void => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin_user');
};

/**
 * Get current admin user
 */
export const getCurrentUser = (): any => {
  const userStr = localStorage.getItem('admin_user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if admin is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('admin_token');
};

export const isAdminUser = (): boolean => {
  const user = getCurrentUser();
  const roles = Array.isArray(user?.role) ? user.role : Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);
  return roles.includes('ADMIN');
};

/**
 * Invite landlord for AsherLandlordFE
 * This creates a user without password and sends invitation email
 * User will set password when they click the invitation link
 */
export const inviteLandlord = async (userData: {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}): Promise<any> => {
  const response = await api.post('/admin/invite-landlord', userData);
  return response;
};

/**
 * Create user for AsherLandlordFE (DEPRECATED - Use inviteLandlord instead)
 * @deprecated Use inviteLandlord() instead - it follows the proper invitation flow
 */
export const createUser = async (userData: CreateUserData): Promise<any> => {
  const response = await api.post('/auth/register', userData);
  return response;
};

