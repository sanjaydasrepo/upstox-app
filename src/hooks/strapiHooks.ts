import { AccountFormData, Payload } from "@/components/account";
import {
  Portfolio,
  RiskSetting,
  StrapiArrayResponse,
  StrapiResponse,
  Trade,
  TradingAccount,
  TradingCredential,
  User,
} from "@/types/strapiTypes";
import axiosInstance from "@/utils/axiosConfig";
import { AxiosError } from "axios";
import {
  UseQueryResult,
  UseQueryOptions,
  useMutation,
  useQuery,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // For redirecting on auth errors
import { useToast } from "./use-toast";

export interface StrapiError {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details: Record<string, any>;
  };
}

export const handleApiError = (error: unknown): StrapiError => {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError<StrapiError>;

    if (axiosError.response?.data) {
      return axiosError.response.data as StrapiError;
    }

    return {
      data: null,
      error: {
        status: axiosError.response?.status || 500,
        name: "AxiosError",
        message: axiosError.message || "An unknown error occurred",
        details: {},
      },
    };
  }

  return {
    data: null,
    error: {
      status: 500,
      name: "UnknownError",
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
      details: {},
    },
  };
};

export const useApiErrorHandler = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  return (error: unknown) => {
    console.log('🔍 API Error Handler - Processing error:', error);
    const strapiError = handleApiError(error);
    console.log('🔍 Processed strapi error:', strapiError);

    // Handle authentication errors
    if (strapiError.error.status === 401) {
      console.log('🔍 401 Error - Checking for Upstox token error:', {
        message: strapiError.error.message,
        details: strapiError.error.details,
        hasExpiredInMessage: strapiError.error.message?.includes('Access token has expired'),
        hasReconnectRequired: strapiError.error.details?.action === 'RECONNECT_REQUIRED'
      });

      // Check if this is specifically an Upstox token error
      if (strapiError.error.message?.includes('UPSTOX_TOKEN_EXPIRED') ||
          strapiError.error.message?.includes('Access token has expired') ||
          strapiError.error.details?.error === 'TOKEN_EXPIRED' ||
          strapiError.error.details?.action === 'RECONNECT_REQUIRED') {
        
        // Show toast and automatically initiate reauth
        toast({
          title: "Upstox Token Expired",
          description: "Your Upstox session has expired. Redirecting to re-authenticate...",
          variant: "destructive",
        });
        
        // Automatically initiate reauth flow
        setTimeout(async () => {
          try {
            const { upstoxAuthService } = await import('@/services/upstoxAuthService');
            const reauthResponse = await upstoxAuthService.requestReauth();
            upstoxAuthService.redirectToUpstoxAuth(reauthResponse.url);
          } catch (error) {
            console.error('Failed to initiate automatic reauth:', error);
            toast({
              title: "Re-authentication Required",
              description: "Please refresh the page and try again.",
              variant: "destructive",
            });
          }
        }, 2000); // 2 second delay to show the toast message
        
        return;
      }
      
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      // Clear the token that's used in your axios interceptor
      //localStorage.removeItem("token");
      // Redirect to login
      //navigate("/login");
      return;
    }

    // Handle forbidden errors
    if (strapiError.error.status === 403) {
      // Check if this is specifically an Upstox token error
      if (strapiError.error.message?.includes('UPSTOX_TOKEN_EXPIRED') ||
          strapiError.error.message?.includes('Access token has expired') ||
          strapiError.error.details?.error === 'TOKEN_EXPIRED' ||
          strapiError.error.details?.action === 'RECONNECT_REQUIRED') {
        
        // Show toast and automatically initiate reauth
        toast({
          title: "Upstox Token Expired",
          description: "Your Upstox session has expired. Redirecting to re-authenticate...",
          variant: "destructive",
        });
        
        // Automatically initiate reauth flow
        setTimeout(async () => {
          try {
            const { upstoxAuthService } = await import('@/services/upstoxAuthService');
            const reauthResponse = await upstoxAuthService.requestReauth();
            upstoxAuthService.redirectToUpstoxAuth(reauthResponse.url);
          } catch (error) {
            console.error('Failed to initiate automatic reauth:', error);
            toast({
              title: "Re-authentication Required",
              description: "Please refresh the page and try again.",
              variant: "destructive",
            });
          }
        }, 2000); // 2 second delay to show the toast message
        
        return;
      }
      
      toast({
        title: "Permission Denied",
        description: "You don't have permission to perform this action.",
        variant: "destructive",
      });
      return;
    }

    // Handle other errors
    toast({
      title: `Error: ${strapiError.error.name}`,
      description: strapiError.error.message || "An unexpected error occurred",
      variant: "destructive",
    });
  };
};

// Enhanced User hook
export const useUser = () => {
  const errorHandler = useApiErrorHandler();

  return useQuery<User, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const resp = await axiosInstance.get<User>(`/users/me`);
        return resp.data;
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof AxiosError && error.response?.status === 401) {
        return false;
      }
      return failureCount < 3; // Retry other errors up to 3 times
    },
  });
};

export const useTradingAccountsByUser = () => {
  const errorHandler = useApiErrorHandler();

  return useQuery<StrapiArrayResponse<TradingAccount>>({
    queryKey: ["trading-accounts"],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching trading accounts...');
        const response = await axiosInstance.get(
          `/trading-accounts?filters[account_type]=live&filters[isLinkedWithBrokerAccount]=true&populate=demo_account`
        );
        console.log('✅ Trading accounts response:', response.data);
        
        // Check if response contains error object (200 status but error inside)
        if (response.data?.error) {
          console.log('❌ Trading accounts response contains error:', response.data.error);
          
          const errorData = response.data.error;
          const isUpstoxTokenError = (
            errorData?.name === 'TokenExpired' ||
            errorData?.details?.action === 'RECONNECT_REQUIRED' ||
            errorData?.details?.action === 'REAUTH_REQUIRED' ||
            errorData?.message?.includes('Access token has expired')
          );
          
          if (isUpstoxTokenError) {
            console.log('🚨 UPSTOX TOKEN ERROR IN TRADING ACCOUNTS FETCH!');
            // Don't auto-redirect here since this is just a data fetch
            // Let the user trigger the redirect via the account switch
          }
          
          // Throw error so the query is treated as failed
          const error = new Error(errorData.message || 'Failed to fetch trading accounts');
          (error as any).response = { status: errorData.status, data: response.data };
          throw error;
        }
        
        return response.data;
      } catch (error) {
        console.error('❌ Trading accounts fetch error:', error);
        errorHandler(error);
        throw error;
      }
    },
  });
};

export const useTradingAccount = (
  id: number,
  options?: UseQueryOptions<StrapiResponse<TradingAccount>>
) => {
  const errorHandler = useApiErrorHandler();

  return useQuery<StrapiResponse<TradingAccount>>({
    queryKey: ["trading-account", id],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(`/trading-accounts/${id}`);
        return response.data;
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    },
    enabled: !!id,
    ...options,
  });
};

export const useCreateTradingAccount = () => {
  const errorHandler = useApiErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Payload) => {
      try {
        const response = await axiosInstance.post(
          `/trading-accounts/create-trading-accounts`,
          { data }
        );
        return response.data;
      } catch (error) {
        errorHandler(error);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading-accounts"] });
    },
  });
};

export const useUpdateTradingAccount = () => {
  const errorHandler = useApiErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TradingAccount>) => {
      try {
        console.log('🔍 Trading Account Update - Request:', data);
        const res = await axiosInstance.post(
          `/trading-accounts/toggle-active-status`,
          data
        );
        console.log('✅ Trading Account Update - Response:', res.data);
        
        // Check if the response contains an error object (200 status but error inside)
        if (res.data?.error) {
          console.log('❌ Response contains error object:', res.data.error);
          
          const errorData = res.data.error;
          const isUpstoxTokenError = (
            errorData?.name === 'TokenExpired' ||
            errorData?.details?.action === 'RECONNECT_REQUIRED' ||
            errorData?.details?.action === 'REAUTH_REQUIRED' ||
            errorData?.message?.includes('Access token has expired')
          );
          
          if (isUpstoxTokenError) {
            console.log('🚨 UPSTOX TOKEN ERROR DETECTED IN RESPONSE DATA!');
            
            const shouldRedirect = window.confirm('Your Upstox session has expired. You will be redirected to re-authenticate.');
            
            if (shouldRedirect) {
              try {
                const { upstoxAuthService } = await import('@/services/upstoxAuthService');
                const reauthResponse = await upstoxAuthService.requestReauth();
                upstoxAuthService.redirectToUpstoxAuth(reauthResponse.url);
              } catch (reauthError) {
                console.error('Failed to initiate reauth from mutation:', reauthError);
                alert('Failed to initiate re-authentication. Please refresh the page.');
              }
            }
            
            // Throw an error so the mutation is treated as failed
            const error = new Error(errorData.message || 'Token expired');
            (error as any).response = { status: errorData.status, data: res.data };
            throw error;
          } else {
            // Other error in response, throw it
            const error = new Error(errorData.message || 'Unknown error');
            (error as any).response = { status: errorData.status, data: res.data };
            throw error;
          }
        }
        
        return res.data;
      } catch (error: any) {
        console.log('❌ Trading Account Update - Error CAUGHT:', error);
        console.log('❌ Error response:', error.response);
        console.log('❌ Error data:', error.response?.data);
        console.log('❌ Error status:', error.response?.status);
        
        // Check for Upstox token errors specifically
        const errorData = error.response?.data;
        const errorMessage = error.message || errorData?.message || '';
        
        const isUpstoxTokenError = (
          errorData?.action === 'RECONNECT_REQUIRED' ||
          errorData?.action === 'REAUTH_REQUIRED' ||
          errorData?.error === 'TOKEN_EXPIRED' ||
          errorMessage.includes('Access token has expired') ||
          errorMessage.includes('RECONNECT_REQUIRED') ||
          JSON.stringify(errorData).includes('Access token has expired') ||
          JSON.stringify(errorData).includes('RECONNECT_REQUIRED')
        );
        
        console.log('🔍 Is this an Upstox token error?', isUpstoxTokenError);
        
        if (isUpstoxTokenError) {
          console.log('🚨 UPSTOX TOKEN ERROR DETECTED IN MUTATION!');
          
          const shouldRedirect = window.confirm('Your Upstox session has expired. Do you want to re-authenticate now?');
          
          if (shouldRedirect) {
            try {
              const { upstoxAuthService } = await import('@/services/upstoxAuthService');
              // Try manual URL construction first since backend has validation issues
              const reauthResponse = await upstoxAuthService.requestReauth(true);
              console.log('🔍 Mutation: Got reauth response:', reauthResponse);
              
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
              
              console.log('🔍 Mutation: Extracted URL:', authUrl);
              upstoxAuthService.redirectToUpstoxAuth(authUrl);
            } catch (reauthError) {
              console.error('Failed to initiate reauth from mutation:', reauthError);
              
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
          
          // Still call the error handler for other processing
          errorHandler(error);
          throw error; // Re-throw to let the caller know it failed
        }
        
        // For non-token errors, handle normally
        errorHandler(error);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["risk-settings-by-filter", "trading-account"],
      });
    },
  });
};

// Portfolio Hooks
export const usePortfolio = (
  accountId: number,
  options?: UseQueryOptions<StrapiResponse<Portfolio>>
) => {
  const errorHandler = useApiErrorHandler();

  return useQuery<StrapiResponse<Portfolio>>({
    queryKey: ["portfolio", accountId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(`/portfolios/${accountId}`);
        return response.data;
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    },
    enabled: !!accountId,
    ...options,
  });
};

// Risk hook
export const useRisk = (
  accountId: number,
  options?: UseQueryOptions<StrapiResponse<Portfolio>>
) => {
  const errorHandler = useApiErrorHandler();

  return useQuery<StrapiResponse<Portfolio>>({
    queryKey: ["risk", accountId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          `/portfolios/${accountId}/risk`
        );
        return response.data;
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    },
    enabled: !!accountId,
    ...options,
  });
};

// Risk Settings Hooks
export const useRiskSettings = (trading_account_ids: string[]) => {
  const errorHandler = useApiErrorHandler();
  const query = new URLSearchParams({
    populate: "trading_accounts",
  });

  trading_account_ids.forEach((id) =>
    query.append("filters[trading_accounts][documentId]", id)
  );

  return useQuery<StrapiArrayResponse<RiskSetting>>({
    queryKey: ["risk-settings", trading_account_ids],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          `/risk-settings?${query.toString()}`
        );
        return response.data;
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    },
    enabled: trading_account_ids.length > 0,
  });
};

export const useRiskSettingsByUser = (userId: string) => {
  const errorHandler = useApiErrorHandler();

  return useQuery<StrapiArrayResponse<RiskSetting>>({
    queryKey: ["risk-settings-by-filter", userId],
    enabled: !!userId,
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          `/risk-settings?sort=active:desc`
        );
        return response.data;
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    },
  });
};

export const useCreateRiskSettings = () => {
  const errorHandler = useApiErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RiskSetting) => {
      try {
        const response = await axiosInstance.post(`/risk-settings`, { data });
        return response.data;
      } catch (error) {
        errorHandler(error);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["risk-settings-by-filter"],
      });
    },
  });
};

export const useUpdateRiskSettings = () => {
  const errorHandler = useApiErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<RiskSetting>) => {
      try {
        const res = await axiosInstance.post(
          `/risk-settings/update-active-status`,
          data
        );
        console.log("resp is sisisi ", res );
        return res.data;
      } catch (error) {
        errorHandler(error);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["risk-settings-by-filter"],
      });
    },
  });
};

// Trade Hooks with error handling
export const useTrades = (
  accountId: number,
  options?: UseQueryOptions<StrapiArrayResponse<Trade>>
) => {
  const errorHandler = useApiErrorHandler();

  return useQuery<StrapiArrayResponse<Trade>>({
    queryKey: ["trades", accountId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          `/trades?filters[trading_account]=${accountId}`
        );
        return response.data;
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    },
    enabled: !!accountId,
    ...options,
  });
};

export const useCreateTrade = () => {
  const errorHandler = useApiErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Trade>) => {
      try {
        const response = await axiosInstance.post(`/trades`, { data });
        return response.data;
      } catch (error) {
        errorHandler(error);
        return null;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate trades query if we have the accountId
      if ("trading_account" in variables && variables.trading_account) {
        queryClient.invalidateQueries({
          queryKey: ["trades", variables.trading_account],
        });
      }
    },
  });
};

// Trading Credentials Hooks
export const useTradingCredentials = (
  accountId: number,
  options?: UseQueryOptions<StrapiResponse<TradingCredential>>
) => {
  const errorHandler = useApiErrorHandler();

  return useQuery<StrapiResponse<TradingCredential>>({
    queryKey: ["trading-credentials", accountId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          `/trading-credentials/${accountId}`
        );
        return response.data;
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    },
    enabled: !!accountId,
    ...options,
  });
};

export const useCreateTradingCredentials = () => {
  const errorHandler = useApiErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TradingCredential) => {
      try {
        const response = await axiosInstance.post(`/trading-credentials`, {
          data,
        });
        return response.data;
      } catch (error) {
        errorHandler(error);
        return null;
      }
    },
    onSuccess: (_, variables) => {
      // If we have an accountId in the credentials, invalidate the related query
      if ("trading_account" in variables && variables.trading_account) {
        queryClient.invalidateQueries({
          queryKey: ["trading-credentials", variables.trading_account],
        });
      }
    },
  });
};
