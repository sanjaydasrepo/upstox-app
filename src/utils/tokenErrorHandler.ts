import { upstoxAuthService } from '@/services/upstoxAuthService';

export interface TokenError {
  message?: string;
  action?: string;
  error?: string;
}

export const isUpstoxTokenError = (error: any): boolean => {
  const errorData = error?.response?.data;
  const errorMessage = error?.message || errorData?.message || '';
  
  return (
    errorData?.action === 'RECONNECT_REQUIRED' ||
    errorData?.action === 'REAUTH_REQUIRED' ||
    errorData?.error === 'TOKEN_EXPIRED' ||
    errorMessage.includes('Access token has expired') ||
    errorMessage.includes('UPSTOX_TOKEN_EXPIRED') ||
    errorMessage.includes('token') && errorMessage.includes('expired')
  );
};

export const handleUpstoxTokenError = async (
  error: any,
  options: {
    showToast?: (message: { title: string; description: string; variant?: string }) => void;
    autoRedirect?: boolean;
    redirectDelay?: number;
  } = {}
): Promise<void> => {
  const { showToast, autoRedirect = true, redirectDelay = 2000 } = options;
  
  if (!isUpstoxTokenError(error)) {
    return;
  }

  console.warn('Upstox token error detected:', error?.response?.data || error.message);

  if (showToast) {
    showToast({
      title: "Upstox Token Expired",
      description: autoRedirect 
        ? "Your Upstox session has expired. Redirecting to re-authenticate..."
        : "Your Upstox session has expired. Please re-authenticate to continue.",
      variant: "destructive",
    });
  }

  if (autoRedirect) {
    setTimeout(async () => {
      try {
        const reauthResponse = await upstoxAuthService.requestReauth();
        upstoxAuthService.redirectToUpstoxAuth(reauthResponse.url);
      } catch (reauthError) {
        console.error('Failed to initiate automatic reauth:', reauthError);
        if (showToast) {
          showToast({
            title: "Re-authentication Failed",
            description: "Please refresh the page and try again.",
            variant: "destructive",
          });
        }
      }
    }, redirectDelay);
  }
};

export const withTokenErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: any) => void
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (isUpstoxTokenError(error)) {
        await handleUpstoxTokenError(error, { autoRedirect: true });
        throw error; // Re-throw to let the caller handle it too
      }
      
      if (errorHandler) {
        errorHandler(error);
      }
      
      throw error;
    }
  }) as T;
};