import axios, { AxiosInstance, AxiosError } from 'axios';

export const BASE_URL = process.env.REACT_APP_BASE_URL;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global handler for Firebase token errors
let authContextHandler: (() => Promise<void>) | null = null;

export const setAuthContextHandler = (handler: () => Promise<void>) => {
  authContextHandler = handler;
};

const isFirebaseTokenError = (error: any): boolean => {
  const errorMessage = error?.message || '';
  const responseData = error?.response?.data || {};
  const responseText = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
  
  return (
    errorMessage.includes('Firebase ID token has expired') ||
    errorMessage.includes('Invalid or expired Firebase token') ||
    errorMessage.includes('auth/id-token-expired') ||
    errorMessage.includes('auth/argument-error') ||
    responseText.includes('Firebase ID token has expired') ||
    responseText.includes('Invalid or expired Firebase token') ||
    (error?.response?.status === 401 && responseText.includes('Firebase'))
  );
};

axiosInstance.interceptors.request.use((config) => {
  // Try Firebase token first, fallback to legacy token
  const firebaseToken = localStorage.getItem('firebaseToken');
  const legacyToken = localStorage.getItem('token');
  const token = firebaseToken || legacyToken;
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  console.log('📤 Making request to:', config.url, 'with method:', config.method);
  return config;
});

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  async (response) => {
    // Check for error objects in successful responses (status 200 but contains error)
    if (response.status === 200 && response.data?.error) {
      const errorData = response.data.error;
      console.log('🔍 200 Response with error object detected:', errorData);
      
      // Check if this is a Firebase token error first
      const mockError = { response: { data: response.data, status: 200 } };
      if (isFirebaseTokenError(mockError)) {
        console.warn('🚨 Firebase token error detected in 200 response, handling logout...');
        if (authContextHandler) {
          try {
            await authContextHandler();
          } catch (handlerError) {
            console.error('❌ Error in auth handler:', handlerError);
          }
        }
        
        // Create proper error for Firebase token error
        const error = new Error('Firebase token expired');
        (error as any).response = { status: 401, data: response.data };
        return Promise.reject(error);
      }
      
      // Check if this is an Upstox token error
      const isUpstoxTokenError = (
        errorData?.name === 'TokenExpired' ||
        errorData?.details?.action === 'RECONNECT_REQUIRED' ||
        errorData?.details?.action === 'REAUTH_REQUIRED' ||
        errorData?.message?.includes('Access token has expired') ||
        errorData?.message?.includes('RECONNECT_REQUIRED')
      );
      
      console.log('🔍 Is this an Upstox token error in 200 response?', isUpstoxTokenError);
      
      if (isUpstoxTokenError) {
        console.warn('🚨 Upstox token expired detected in 200 response!');
        
        // Create a proper error object to handle this
        const error = new Error('Upstox token expired');
        (error as any).response = {
          status: errorData.status || 440,
          data: response.data
        };
        
        // Handle the token error
        setTimeout(async () => {
          const shouldRedirect = window.confirm('Your Upstox session has expired. You will be redirected to re-authenticate.');
          
          if (shouldRedirect) {
            try {
              const { upstoxAuthService } = await import('@/services/upstoxAuthService');
              // Try manual URL construction first since backend has validation issues
              const reauthResponse = await upstoxAuthService.requestReauth(true);
              console.log('🔍 Interceptor: Got reauth response:', reauthResponse);
              
              // Extract URL safely
              let authUrl: string;
              if (typeof reauthResponse === 'string') {
                authUrl = reauthResponse;
              } else if (reauthResponse && typeof reauthResponse === 'object') {
                authUrl = reauthResponse.url || '';
                if (!authUrl && 'authUrl' in reauthResponse) {
                  authUrl = (reauthResponse as any).authUrl;
                }
                if (!authUrl) {
                  console.error('No valid URL found in response:', reauthResponse);
                  authUrl = JSON.stringify(reauthResponse);
                }
              } else {
                authUrl = String(reauthResponse);
              }
              
              console.log('🔍 Interceptor: Extracted URL:', authUrl);
              upstoxAuthService.redirectToUpstoxAuth(authUrl);
            } catch (reauthError) {
              console.error('Failed to initiate reauth:', reauthError);
              
              // Provide manual fallback option
              const manualRedirect = window.confirm(
                'Automatic re-authentication failed. Would you like to go to the account setup page to manually re-authenticate?'
              );
              
              if (manualRedirect) {
                window.location.href = '/account/new';
              } else {
                alert('Please refresh the page and try again, or go to Account settings to re-authenticate manually.');
              }
            }
          }
        }, 100);
        
        // Reject the promise so the caller knows this is an error
        return Promise.reject(error);
      }
    }
    
    return response;
  },
  async (error: AxiosError) => {
    console.log('🔍 Axios interceptor - Error caught:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });

    // Check for Firebase token errors first
    if (isFirebaseTokenError(error)) {
      console.warn('🚨 Firebase token error detected, handling logout...');
      if (authContextHandler) {
        try {
          await authContextHandler();
        } catch (handlerError) {
          console.error('❌ Error in auth handler:', handlerError);
        }
      } else {
        console.warn('⚠️ No auth handler available, manual logout required');
        // Fallback: clear storage and redirect
        localStorage.clear();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Check if the error is related to Upstox token expiration
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorData = error.response.data as any;
      
      console.log('🔍 Checking for Upstox token error:', {
        errorData,
        errorDataType: typeof errorData,
        errorDataString: JSON.stringify(errorData),
        hasTokenExpired: errorData?.error === 'TOKEN_EXPIRED',
        hasReauthRequired: errorData?.action === 'REAUTH_REQUIRED',
        hasReconnectRequired: errorData?.action === 'RECONNECT_REQUIRED',
        includesExpired: typeof errorData === 'string' && errorData.includes('Access token has expired')
      });
      
      // Check if this is specifically an Upstox token error
      const isUpstoxTokenError = (
        errorData?.error === 'TOKEN_EXPIRED' || 
        errorData?.action === 'REAUTH_REQUIRED' ||
        errorData?.action === 'RECONNECT_REQUIRED' ||
        (typeof errorData === 'string' && errorData.includes('UPSTOX_TOKEN_EXPIRED')) ||
        (typeof errorData === 'string' && errorData.includes('Access token has expired')) ||
        (typeof errorData === 'string' && errorData.includes('RECONNECT_REQUIRED')) ||
        // Check nested error messages
        errorData?.message?.includes('Access token has expired') ||
        errorData?.message?.includes('RECONNECT_REQUIRED') ||
        // Check if error data contains the specific error pattern
        JSON.stringify(errorData).includes('Access token has expired') ||
        JSON.stringify(errorData).includes('RECONNECT_REQUIRED')
      );
      
      console.log('🔍 Is Upstox token error?', isUpstoxTokenError);
      
      if (isUpstoxTokenError) {
        
        console.warn('🚨 Upstox token expired detected, initiating reauthorization...');
        
        // Simple immediate redirect with user confirmation
        const shouldRedirect = window.confirm('Your Upstox session has expired. Do you want to re-authenticate now?');
        console.log('👤 User confirmation:', shouldRedirect);
        
        if (shouldRedirect) {
          try {
            // Dynamically import to avoid circular dependency
            const { upstoxAuthService } = await import('@/services/upstoxAuthService');
            
            console.log('📞 Requesting reauth URL...');
            const reauthResponse = await upstoxAuthService.requestReauth();
            console.log('✅ Reauth response received:', reauthResponse);
            
            console.log('🔄 Redirecting to Upstox auth:', reauthResponse.url);
            upstoxAuthService.redirectToUpstoxAuth(reauthResponse.url);
          } catch (reauthError) {
            console.error('❌ Failed to initiate reauth:', reauthError);
            
            // Fallback: direct redirect to a manual reauth page
            const fallbackConfirm = window.confirm('Failed to get auth URL automatically. Go to account settings to re-authenticate?');
            if (fallbackConfirm) {
              window.location.href = '/account/new';
            }
          }
        }
        
        // Don't retry the original request
        return Promise.reject(error);
      } else {
        console.log('ℹ️ Not a recognized Upstox token error, passing through');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
