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
    const strapiError = handleApiError(error);

    // Handle authentication errors
    if (strapiError.error.status === 401) {
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      // Clear the token that's used in your axios interceptor
      localStorage.removeItem("token");
      // Redirect to login
      navigate("/login");
      return;
    }

    // Handle forbidden errors
    if (strapiError.error.status === 403) {
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
        const response = await axiosInstance.get(
          `/trading-accounts?filters[account_type]=live&filters[isLinkedWithBrokerAccount]=true&populate=demo_account`
        );
        return response.data;
      } catch (error) {
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
        throw error;
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
        const res = await axiosInstance.post(
          `/trading-accounts/toggle-active-status`,
          data
        );
        return res.data;
      } catch (error) {
       
        errorHandler(error);
        throw error;
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
        throw error;
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
        return res.data;
      } catch (error) {
        errorHandler(error);
        throw error;
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
        throw error;
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
        throw error;
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
