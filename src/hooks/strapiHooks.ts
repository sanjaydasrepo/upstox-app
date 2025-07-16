import React from "react";
import { AccountFormData, Payload } from "@/components/account/index";
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
        console.log('🔍 Fetching user data...');
        const resp = await axiosInstance.get(`http://localhost:3005/auth/me`);
        console.log('✅ User data response:', resp.data);
        // Backend returns { success: true, data: {...}, message: "..." }
        return resp.data.data;
      } catch (error) {
        console.error('❌ User fetch error:', error);
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

  const queryResult = useQuery<StrapiArrayResponse<TradingAccount>>({
    queryKey: ["trading-accounts"],
    staleTime: 5 * 60 * 1000, // 5 minutes - trading accounts don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
    queryFn: async () => {
      try {
        console.log('🔍 Fetching trading accounts from NestJS...');
        const response = await axiosInstance.get(
          `http://localhost:3005/trading-accounts`
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
        
        // Transform NestJS response to match Strapi format for compatibility
        const accounts = Array.isArray(response.data) ? response.data : [response.data];
        
        console.log('🔍 Raw accounts from API:', accounts);
        
        // Enhanced logging for each account to debug linking status
        accounts.forEach((account, index) => {
          console.log(`🔍 Account ${index + 1} analysis:`, {
            id: account.id,
            name: account.name || account.displayBrokerName,
            accountType: account.accountType,
            isLinked: account.isLinked,
            tokenStatus: account.tokenStatus,
            requiresReconnection: account.requiresReconnection,
            broker: account.broker,
            needsAuth: account.accountType === 'live' && !account.isLinked,
            hasExpiredToken: account.requiresReconnection && account.tokenStatus === 'expired'
          });
        });
        
        // Check for accounts that need broker authentication
        const accountsNeedingAuth = accounts.filter(account => {
          const isLiveAccount = account.accountType === 'live';
          const isUnlinked = !account.isLinked;
          const hasMissingToken = account.tokenStatus === 'missing';
          const hasExpiredToken = account.tokenStatus === 'expired';
          
          const needsAuth = isLiveAccount && (isUnlinked || hasMissingToken || hasExpiredToken);
          
          if (needsAuth) {
            console.log(`🎯 Found account needing auth: ${account.id} (${account.broker})`, {
              isLiveAccount,
              isUnlinked,
              isLinked: account.isLinked,
              tokenStatus: account.tokenStatus,
              hasMissingToken,
              hasExpiredToken,
              requiresReconnection: account.requiresReconnection
            });
          }
          
          return needsAuth;
        });
        
        console.log('📊 Authentication Summary:', {
          totalAccounts: accounts.length,
          accountsNeedingAuth: accountsNeedingAuth.length,
          accountsNeedingAuthIds: accountsNeedingAuth.map(acc => acc.id),
          accountsWithDetails: accounts.map(acc => ({
            id: acc.id,
            isLinked: acc.isLinked,
            tokenStatus: acc.tokenStatus,
            accountType: acc.accountType,
            needsAuth: acc.accountType === 'live' && (!acc.isLinked || acc.tokenStatus === 'missing' || acc.tokenStatus === 'expired')
          }))
        });

        // Store accounts needing auth for later processing outside the query
        console.log('🔍 Total accounts needing auth:', accountsNeedingAuth.length);
        if (accountsNeedingAuth.length > 0) {
          console.log('🚨 Found accounts needing broker authentication:', accountsNeedingAuth);
          
          // Store the first account that needs auth in sessionStorage for processing outside query
          const firstAccount = accountsNeedingAuth[0];
          const pendingAuth = {
            id: firstAccount.id,
            broker: firstAccount.broker || 'upstox'
          };
          console.log('💾 Storing pending auth in sessionStorage:', pendingAuth);
          sessionStorage.setItem('pendingAuthAccount', JSON.stringify(pendingAuth));
        } else {
          console.log('✅ No accounts need authentication, clearing any pending auth');
          // Clear any pending auth if no accounts need authentication
          sessionStorage.removeItem('pendingAuthAccount');
        }
        
        // Transform NestJS response data to match expected Strapi format for compatibility
        const transformedAccounts = accounts.map(account => ({
          ...account,
          // Map NestJS/Prisma field names to Strapi field names for compatibility
          account_type: account.accountType,
          account_status: account.accountStatus,
          isLinkedWithBrokerAccount: account.isLinked,
          current_balance: account.currentBalance,
          initial_balance: account.initialBalance,
          // Keep original fields as well for backward compatibility
          documentId: account.id,
          name: account.name || account.displayName || `${account.broker} Account`,
        }));
        
        // Include both live and demo accounts, but group them by broker
        // We need both types to support the demo/live toggle functionality
        const allAccountsWithPairing = transformedAccounts.map(account => {
          // Find the corresponding demo account for each live account (and vice versa)
          const sameCredential = transformedAccounts.filter(acc => 
            acc.credentialId === account.credentialId && acc.broker === account.broker
          );
          
          const liveAccount = sameCredential.find(acc => acc.accountType === 'live');
          const demoAccount = sameCredential.find(acc => acc.accountType === 'demo');
          
          console.log(`🔍 Account pairing for ${account.id}:`, {
            current: {
              id: account.id,
              type: account.accountType,
              balance: account.currentBalance
            },
            liveAccount: liveAccount ? {
              id: liveAccount.id,
              balance: liveAccount.currentBalance
            } : null,
            demoAccount: demoAccount ? {
              id: demoAccount.id,
              balance: demoAccount.currentBalance
            } : null
          });
          
          return {
            ...account,
            // Add references to paired accounts for balance lookup
            pairedLiveAccount: liveAccount,
            pairedDemoAccount: demoAccount,
          };
        });
        
        // Filter to only show live accounts in the dropdown (but keep demo account data for balance lookup)
        const filteredAccounts = allAccountsWithPairing.filter(account => {
          const isLive = account.accountType === 'live';
          
          console.log(`🔍 Account ${account.id} filter result:`, {
            name: account.name,
            accountType: account.accountType,
            account_type: account.account_type,
            isLinked: account.isLinked,
            isLinkedWithBrokerAccount: account.isLinkedWithBrokerAccount,
            accountStatus: account.accountStatus,
            account_status: account.account_status,
            passesFilter: isLive,
            demoBalance: account.pairedDemoAccount?.currentBalance
          });
          
          return isLive;
        });
        
        console.log(`🔍 Total accounts: ${accounts.length}, Filtered live accounts: ${filteredAccounts.length}`);
        
        return {
          data: filteredAccounts,
          meta: {
            pagination: {
              page: 1,
              pageSize: filteredAccounts.length,
              pageCount: 1,
              total: filteredAccounts.length
            }
          }
        };
      } catch (error) {
        console.error('❌ Trading accounts fetch error:', error);
        errorHandler(error);
        throw error;
      }
    },
  });

  // Handle authentication redirect outside of the query to avoid conflicts
  React.useEffect(() => {
    console.log('🔍 useEffect triggered - checking for pending auth...');
    console.log('🔍 queryResult.data exists:', !!queryResult.data);
    console.log('🔍 queryResult.isLoading:', queryResult.isLoading);
    
    // Direct check: if we have data and accounts need auth, redirect immediately
    if (queryResult.data && !queryResult.isLoading) {
      const accounts = queryResult.data.data || [];
      console.log('🔍 Checking accounts directly in useEffect:', accounts.length);
      
      // Find accounts that need authentication
      const accountsNeedingAuth = accounts.filter(account => {
        const needsAuth = account.accountType === 'live' && 
                         (!account.isLinked || account.tokenStatus === 'missing' || account.tokenStatus === 'expired');
        
        if (needsAuth) {
          console.log(`🚨 useEffect: Found account needing auth: ${account.id}`, {
            isLinked: account.isLinked,
            tokenStatus: account.tokenStatus,
            accountType: account.accountType
          });
        } else {
          console.log(`✅ useEffect: Account ${account.id} is properly linked`, {
            isLinked: account.isLinked,
            tokenStatus: account.tokenStatus,
            accountType: account.accountType
          });
        }
        
        return needsAuth;
      });
      
      if (accountsNeedingAuth.length > 0) {
        console.log('🚨 useEffect: Starting redirect process for unlinked accounts...');
        
        // Clear any existing flags to ensure fresh redirect
        sessionStorage.removeItem('brokerAuthInProgress');
        
        const performRedirect = async () => {
          try {
            console.log('🚀 useEffect: Requesting broker authentication URL...');
            const response = await axiosInstance.post(`http://localhost:3005/auth/upstox`);
            
            console.log('🔍 useEffect: Auth URL response:', response.data);
            
            if (response.data && response.data.url) {
              console.log('✅ useEffect: Got broker auth URL, redirecting...');
              console.log('🔗 useEffect: Redirect URL:', response.data.url);
              
              // Force immediate redirect
              console.log('🚀 useEffect: Executing redirect...');
              window.location.replace(response.data.url);
              
            } else {
              console.error('❌ useEffect: No auth URL in response:', response.data);
            }
          } catch (error) {
            console.error('❌ useEffect: Failed to get broker auth URL:', error);
            if (error instanceof AxiosError) {
              console.error('❌ useEffect: Error details:', error.response?.data);
            }
          }
        };
        
        // Execute redirect immediately
        performRedirect();
      } else {
        console.log('✅ useEffect: All accounts are properly linked, no redirect needed');
      }
    }
  }, [queryResult.data, queryResult.isLoading]);

  return queryResult;
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
          `http://localhost:3005/trading-accounts`,
          data
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
        const res = await axiosInstance.put(
          `http://localhost:3005/trading-accounts/${data.documentId}/toggle-active-status`
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

export const useRiskSettingsByUser = (userId?: string) => {
  const errorHandler = useApiErrorHandler();
  const { data: user } = useUser();

  return useQuery<StrapiArrayResponse<RiskSetting>>({
    queryKey: ["risk-settings-by-filter"],
    enabled: !!user, // Enable based on user existence, not userId
    staleTime: 3 * 60 * 1000, // 3 minutes - risk settings don't change very often
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    queryFn: async () => {
      try {
        console.log('🔍 Fetching risk settings via Firebase auth...');
        const response = await axiosInstance.get(
          `http://localhost:3005/risk-settings?sort=active:desc`
        );
        console.log('✅ Risk settings response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Risk settings fetch error:', error);
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
        console.log('🔍 Creating risk settings:', data);
        const response = await axiosInstance.post(`http://localhost:3005/risk-settings`, { data });
        console.log('✅ Risk settings created:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Risk settings creation error:', error);
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
        console.log('🔍 Updating risk settings:', data);
        const res = await axiosInstance.post(
          `http://localhost:3005/risk-settings/update-active-status`,
          data
        );
        console.log('✅ Risk settings updated:', res.data);
        return res.data;
      } catch (error) {
        console.error('❌ Risk settings update error:', error);
        errorHandler(error);
        return null;
      }
    },
    onSuccess: (data) => {
      console.log('✅ [RISK-PROFILE] Successfully updated, invalidating queries...');
      
      // Invalidate all risk settings related queries to ensure immediate UI updates
      queryClient.invalidateQueries({
        queryKey: ["risk-settings-by-filter"],
      });
      queryClient.invalidateQueries({
        queryKey: ["risk-settings"],
      });
      
      console.log('🔄 [RISK-PROFILE] Queries invalidated, UI should update immediately');
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

// useCreateTradingCredentials hook removed - credentials are now managed through trading accounts

export const useRequestReconnection = () => {
  const errorHandler = useApiErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (broker: string) => {
      try {
        const response = await axiosInstance.post(
          `http://localhost:3005/trading-accounts/reconnect/${broker}`
        );
        return response.data;
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success && data.redirectUrl) {
        // Redirect to account setup for reconnection
        window.location.href = data.redirectUrl;
      }
      queryClient.invalidateQueries({ queryKey: ["trading-accounts"] });
    },
  });
};

// Helper function to clear authentication flags (useful for testing)
export const clearAuthenticationFlags = () => {
  sessionStorage.removeItem('brokerAuthInProgress');
  sessionStorage.removeItem('pendingAuthAccount');
  
  // Clear all lastAuthRedirect flags
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('lastAuthRedirect_')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('🧹 Cleared all authentication flags');
};

// Hook to force check for unlinked accounts
export const useForceAccountCheck = () => {
  const queryClient = useQueryClient();
  
  const forceCheck = () => {
    clearAuthenticationFlags();
    queryClient.invalidateQueries({ queryKey: ["trading-accounts"] });
    console.log('🔄 Forced account check - cleared flags and invalidated cache');
  };
  
  return { forceCheck };
};

