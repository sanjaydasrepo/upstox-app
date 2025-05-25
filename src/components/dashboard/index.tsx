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
  
  const { data: user } = useUser();
  
  const { data: tradingAccounts, isLoading } = useTradingAccountsByUser();
  const { data: riskProfiles, isLoading: isLoadingRiskProfiles } =
  useRiskSettingsByUser(user?.documentId ?? "");
  
  useEffect(() => {
    if (
      !isLoading && tradingAccounts && tradingAccounts?.data?.length === 0 ){
      navigate("/account/new", { replace: true });
    }
  }, [tradingAccounts, isLoading, navigate]);

  useEffect(() => {
    if (
      !isLoadingRiskProfiles &&
      !isLoading &&
      tradingAccounts &&
      tradingAccounts?.data?.length > 0 &&
      riskProfiles && riskProfiles?.data?.length ===0 
    ) {
      navigate("/risk-profile/new", { replace: true });
    }
  }, [riskProfiles, tradingAccounts, isLoadingRiskProfiles, navigate]);

  return <TradingLayout/>
};
export default Dashboard;
