import axios, { AxiosInstance, AxiosError } from 'axios';

export const BASE_URL = process.env.REACT_APP_BASE_URL;
export const ST_BASE_URL = process.env.REACT_APP_ST_BASE_URL;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: ST_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Check if the error is related to Upstox token expiration
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorData = error.response.data as any;
      
      // Check if this is specifically an Upstox token error
      if (errorData?.error === 'TOKEN_EXPIRED' || 
          errorData?.action === 'REAUTH_REQUIRED' ||
          (typeof errorData === 'string' && errorData.includes('UPSTOX_TOKEN_EXPIRED'))) {
        
        console.warn('Upstox token expired, initiating reauthorization...');
        
        try {
          // Dynamically import to avoid circular dependency
          const { upstoxAuthService } = await import('@/services/upstoxAuthService');
          
          // Request new authorization URL
          const reauthResponse = await upstoxAuthService.requestReauth();
          
          // Show user notification about token expiry
          if (window.confirm('Your Upstox session has expired. Do you want to re-authenticate now?')) {
            upstoxAuthService.redirectToUpstoxAuth(reauthResponse.url);
          }
        } catch (reauthError) {
          console.error('Failed to initiate reauth:', reauthError);
          alert('Failed to initiate re-authentication. Please try refreshing the page.');
        }
        
        // Don't retry the original request
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
