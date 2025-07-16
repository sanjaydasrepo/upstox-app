import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../utils/axiosConfig";
import io from "socket.io-client";
import Navbar from "../NavBar";
import {
  useRiskSettings,
  useRiskSettingsByUser,
  useTradingAccountsByUser,
  useUser,
} from "@/hooks/strapiHooks";
import TradingLayout from "./widgets/TradingLayout";

const socket = io(BASE_URL ?? "localhost:3001");

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  
  // const tAccIds = tradingAccounts?.data?.map( ta => ta.documentId || "") || [];
  
  // const { data: riskProfiles, isLoading: isLoadingRiskProfiles } = useRiskSettings(tAccIds);
  
  const { data: user, isLoading: isLoadingUser } = useUser();
  
  const { data: tradingAccounts, isLoading } = useTradingAccountsByUser();
  const { data: riskProfiles, isLoading: isLoadingRiskProfiles } =
  useRiskSettingsByUser(user?.documentId ?? "");
  
  console.log('🔍 Dashboard: Current state:', {
    user: !!user,
    tradingAccountsLoading: isLoading,
    tradingAccountsCount: tradingAccounts?.data?.length || 0,
    tradingAccountsData: tradingAccounts?.data,
    riskProfilesLoading: isLoadingRiskProfiles,
    riskProfilesCount: riskProfiles?.data?.length || 0,
    riskProfilesData: riskProfiles?.data
  });
  
  useEffect(() => {
    console.log('🔍 Dashboard: Checking trading accounts redirect...', {
      isLoading,
      hasAccounts: tradingAccounts?.data?.length || 0,
      shouldRedirect: !isLoading && tradingAccounts && tradingAccounts?.data?.length === 0
    });
    
    if (
      !isLoading && tradingAccounts && tradingAccounts?.data?.length === 0 ){
      console.log('🚀 Dashboard: Redirecting to /account/new (no trading accounts)');
      navigate("/account/new", { replace: true });
    }
  }, [tradingAccounts, isLoading, navigate]);

  useEffect(() => {
    const hasAccounts = tradingAccounts?.data && tradingAccounts.data.length > 0;
    const hasRiskProfiles = riskProfiles?.data && riskProfiles.data.length > 0;
    const riskProfilesEmpty = riskProfiles !== undefined && riskProfiles?.data && riskProfiles.data.length === 0;
    const shouldRedirect = !isLoadingRiskProfiles && !isLoading && hasAccounts && (riskProfilesEmpty || riskProfiles === undefined);
    
    console.log('🔍 Dashboard: Checking risk profile redirect...', {
      isLoadingRiskProfiles,
      isLoading,
      hasAccounts,
      hasRiskProfiles,
      riskProfilesEmpty,
      riskProfilesUndefined: riskProfiles === undefined,
      shouldRedirect
    });
    
    if (shouldRedirect) {
      console.log('🚀 Dashboard: Redirecting to /risk-profile/new (no risk profiles)');
      navigate("/risk-profile/new", { replace: true });
    }
  }, [riskProfiles, tradingAccounts, isLoadingRiskProfiles, isLoading, navigate]);

  // Show loader while loading data
  if (isLoading || isLoadingRiskProfiles || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-gray-200 border-t-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">
            {isLoadingUser && "Loading user data..."}
            {!isLoadingUser && isLoading && "Checking trading accounts..."}
            {!isLoadingUser && !isLoading && isLoadingRiskProfiles && "Loading risk profiles..."}
          </p>
        </div>
      </div>
    );
  }

  return <TradingLayout/>
};
export default Dashboard;
