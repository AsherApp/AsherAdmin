// API Configuration for Asher Admin Dashboard
// Connects to AsherLandlordBE backend
// Configure via .env file: VITE_API_BASE_URL=http://localhost:YOUR_PORT/api

// Get environment variable with better error handling
const getEnvVar = (key: string): string => {
  // Access Vite environment variables
  // @ts-ignore - Vite adds env vars to import.meta.env at build time
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[key];
  
  if (value && typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  
  // Debug: Log all available VITE_ env vars (for development)
  if (env.DEV || env.MODE === 'development') {
    const viteEnvVars = Object.keys(env).filter(k => k.startsWith('VITE_'));
    console.warn(`[API Config] ${key} not found. Available VITE_ env vars:`, viteEnvVars);
    console.warn(`[API Config] Full import.meta.env:`, Object.keys(env));
  }
  
  throw new Error(
    `Environment variable ${key} is not set.\n\n` +
    `Please ensure:\n` +
    `1. A .env file exists in the asher-admin/ directory (same level as package.json)\n` +
    `2. It contains: ${key}=http://localhost:YOUR_PORT/api\n` +
    `3. The dev server has been restarted after adding/changing the .env file\n` +
    `4. The variable name starts with VITE_ (required by Vite)\n\n` +
    `Example .env file content:\n` +
    `VITE_API_BASE_URL=http://localhost:8000/api`
  );
};

const normalizeApiBaseUrl = (url: string): string => {
  let normalized = url.trim();

  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, '');
  if (!normalized.endsWith('/api')) {
    normalized = `${normalized}/api`;
  }

  return normalized;
};

// Get API base URL from environment variable
const API_BASE_URL = normalizeApiBaseUrl(getEnvVar('VITE_API_BASE_URL'));

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('admin_token');
};

// Get refresh token from localStorage
const getRefreshToken = (): string | null => {
  return localStorage.getItem('admin_refresh_token');
};

// Refresh access token using refresh token
const refreshAccessToken = async (): Promise<{ accessToken: string; refreshToken: string } | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      const { accessToken, refreshToken: newRefreshToken } = data.data;
      localStorage.setItem('admin_token', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('admin_refresh_token', newRefreshToken);
      }
      return { accessToken, refreshToken: newRefreshToken || refreshToken };
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

const getErrorMessage = (error: {
  message?: string;
  errors?: string[];
}): string => {
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0];
  }
  return error.message || 'Request failed';
};

const clearAuthAndRedirect = (reason: string) => {
  console.error(`❌ ${reason}; clearing auth data`);
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin_user');
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
};

const isSessionExpiredError = (status: number, message?: string): boolean => {
  if (status !== 401 && status !== 403) return false;
  const msg = (message || '').toLowerCase();
  return (
    msg.includes('invalid refresh token') ||
    msg.includes('refresh token required') ||
    msg.includes('invalid or expired refresh token') ||
    msg.includes('invalid or expired token') ||
    msg.includes('not authorized, token missing') ||
    msg.includes('session expired')
  );
};

// API Request wrapper with automatic token refresh
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<any> => {
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add refresh token header for automatic token refresh on backend
  if (refreshToken) {
    headers['x-refresh-token'] = refreshToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retryCount === 0 && refreshToken) {
      console.log('🔄 Access token expired, attempting to refresh...');
      const newTokens = await refreshAccessToken();
      
      if (newTokens) {
        console.log('✅ Token refreshed successfully, retrying request...');
        // Retry the request with new token
        const newHeaders = { ...headers };
        newHeaders['Authorization'] = `Bearer ${newTokens.accessToken}`;
        newHeaders['x-refresh-token'] = newTokens.refreshToken;
        
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: newHeaders,
        });

        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ message: 'Request failed' }));
          if (isSessionExpiredError(retryResponse.status, error.message)) {
            clearAuthAndRedirect('Session expired after token refresh');
          }
          throw new Error(getErrorMessage(error) || `HTTP error! status: ${retryResponse.status}`);
        }

        return retryResponse.json();
      } else {
        clearAuthAndRedirect('Token refresh failed');
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      // Backend returns 403 "Invalid refresh token" when access token is expired
      // and refresh fails — clear the stuck session so ProtectedRoute can send user to login.
      if (isSessionExpiredError(response.status, error.message)) {
        clearAuthAndRedirect(error.message || 'Session expired');
      }
      throw new Error(getErrorMessage(error) || `HTTP error! status: ${response.status}`);
    }

    // Update tokens from response headers if present
    const newAccessToken = response.headers.get('x-access-token');
    const newRefreshToken = response.headers.get('x-refresh-token');
    if (newAccessToken) {
      localStorage.setItem('admin_token', newAccessToken);
    }
    if (newRefreshToken) {
      localStorage.setItem('admin_refresh_token', newRefreshToken);
    }

    return response.json();
  } catch (error: any) {
    // Handle connection errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. ` +
        `Please ensure the backend server is running. ` +
        `If your backend is on a different port, set VITE_API_BASE_URL in your .env file.`
      );
    }
    throw error;
  }
};

// API Methods
export const api = {
  // GET request
  get: (endpoint: string) => apiRequest(endpoint, { method: 'GET' }),

  // POST request
  post: (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // PUT request
  put: (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // PATCH request
  patch: (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // DELETE request
  delete: (endpoint: string) =>
    apiRequest(endpoint, { method: 'DELETE' }),

  // POST with FormData (for file uploads)
  postFormData: (endpoint: string, formData: FormData) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    }),
};

export default api;
