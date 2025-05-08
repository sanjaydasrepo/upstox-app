import { AccountFormData } from "@/components/account";
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
import axios from "@/utils/axiosConfig";

import {
  UseQueryResult,
  UseQueryOptions,
  useMutation,
  useQuery,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";

const API_URL = process.env.REACT_APP_ST_BASE_URL || "http://localhost:1337";

export const useUser = () => {
  return useQuery<User, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const resp = await axios.get<User>(`/users/me`);
      return resp.data;
    },
  });
};

export const useTradingAccountsByUser = () => {
  return useQuery<StrapiArrayResponse<TradingAccount>>({
    queryKey: ["trading-accounts"],
    queryFn: () =>
      axios
        .get(`/trading-accounts`)
        .then((res) => res.data),
  });
};

export const useTradingAccount = (
  id: number,
  options?: UseQueryOptions<StrapiResponse<TradingAccount>>
) => {
  return useQuery<StrapiResponse<TradingAccount>>({
    queryKey: ["trading-account", id],
    queryFn: () => axios.get(`/trading-accounts/${id}`).then((res) => res.data),
    enabled: !!id,
    ...options,
  });
};

export const useCreateTradingAccount = () => {
  return useMutation({
    mutationFn: (data: AccountFormData) =>
      axios.post(`/trading-accounts`, { data }).then((res) => res.data),
  });
};

export const useUpdateTradingAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TradingAccount>) =>{
      const res = await axios.post(`/trading-accounts/toggle-active-status`,  data );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['risk-settings-by-filter',"trading-account"],
      });
      console.log('Queries invalidated');
    },
  });
};

// Portfolio Hooks
export const usePortfolio = (
  accountId: number,
  options?: UseQueryOptions<StrapiResponse<Portfolio>>
) => {
  return useQuery<StrapiResponse<Portfolio>>({
    queryKey: ["portfolio", accountId],
    queryFn: () =>
      axios.get(`/portfolios/${accountId}`).then((res) => res.data),
    enabled: !!accountId,
    ...options,
  });
};

export const useRisk = (
  accountId: number,
  options?: UseQueryOptions<StrapiResponse<Portfolio>>
) => {
  return useQuery<StrapiResponse<Portfolio>>({
    queryKey: ["portfolio", accountId],
    queryFn: () =>
      axios.get(`/portfolios/${accountId}`).then((res) => res.data),
    enabled: !!accountId,
    ...options,
  });
};

// Risk Settings Hooks
export const useRiskSettings = (trading_account_ids: string[]) => {
  const query = new URLSearchParams({
    populate: 'trading_accounts',
  });

  trading_account_ids.forEach((id) =>
    query.append('filters[trading_accounts][documentId]', id)
  );

  return useQuery<StrapiArrayResponse<RiskSetting>>({
    queryKey: ["risk-settings", trading_account_ids],
    queryFn: () =>
      axios
        .get(`/risk-settings?${query.toString()}`)
        .then((res) => res.data),
    enabled: trading_account_ids.length > 0,
  });
};

export const useRiskSettingsByUser = (
  userId: string,
) => {
  return useQuery<StrapiArrayResponse<RiskSetting>>({
    queryKey: ["risk-settings-by-filter", userId],
    enabled: !!userId ,
    queryFn: () =>
      axios
        .get(`/risk-settings?sort=active:desc`)
        .then((res) => res.data),
  })
}

export const useCreateRiskSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RiskSetting) => axios.post(`/risk-settings`, { data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['risk-settings-by-filter'],
      });
      console.log('Queries invalidated');
    },
  });
};

export const useUpdateRiskSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RiskSetting>) =>{
      const res = await axios.post(`/risk-settings/update-active-status`,  data );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['risk-settings-by-filter'],
      });
      console.log('Queries invalidated');
    },
  });
};

// Trade Hooks
export const useTrades = (
  accountId: number,
  options?: UseQueryOptions<StrapiArrayResponse<Trade>>
) => {
  return useQuery<StrapiArrayResponse<Trade>>({
    queryKey: ["trades", accountId],
    queryFn: () =>
      axios
        .get(`/trades?filters[trading_account]=${accountId}`)
        .then((res) => res.data),
    enabled: !!accountId,
    ...options,
  });
};

export const useCreateTrade = () => {
  return useMutation({
    mutationFn: (data: Partial<Trade>) =>
      axios.post(`/trades`, { data }).then((res) => res.data),
  });
};

// Trading Credentials Hooks
export const useTradingCredentials = (
  accountId: number,
  options?: UseQueryOptions<StrapiResponse<TradingCredential>>
) => {
  return useQuery<StrapiResponse<TradingCredential>>({
    queryKey: ["trading-credentials", accountId],
    queryFn: () =>
      axios.get(`/trading-credentials/${accountId}`).then((res) => res.data),
    enabled: !!accountId,
    ...options,
  });
};

export const useCreateTradingCredentials = () => {
  return useMutation({
    mutationFn: (data: TradingCredential) =>
      axios.post(`/trading-credentials`, { data }).then((res) => res.data),
  });
};
