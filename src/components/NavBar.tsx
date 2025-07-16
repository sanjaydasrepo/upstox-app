import React, { useEffect, useState } from "react";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Plus, Menu, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import TradingAccountSelect from "./widgets/TradingAccountSelect";
import { AccountDropDown } from "./widgets/AccountDropDown";
import {
  useRiskSettingsByUser,
  useTradingAccountsByUser,
  useUpdateRiskSettings,
  useUpdateTradingAccount,
  useUser,
} from "@/hooks/strapiHooks";
import { AccountStatus, RiskSetting, TradingAccount } from "@/types/strapiTypes";
import axiosInstance from "@/utils/axiosConfig";

interface NavbarProps {
  handleLogout: () => void;
}

const Navbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRiskProfile, setSelectedRiskProfile] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountType, setAccountType] = useState(false);

  const { data: user } = useUser();
  const { mutateAsync: updateAccount } = useUpdateTradingAccount();
  const { mutateAsync: updateRiskSetting } = useUpdateRiskSettings();

  const { data: riskProfiles, isLoading: isLoadingRiskProfiles } =
    useRiskSettingsByUser(user?.documentId ?? "");

  const { data: tradingAccounts, isLoading: isTradingLoadingAcccount , refetch: refetchTdAccounts} =
    useTradingAccountsByUser();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleAccountChange = (value: boolean) => {
    console.log('🔍 NavBar: Starting account change to:', value, 'for account:', selectedAccount);
    
    updateAccount({
      documentId: selectedAccount
    }).then((resp) => {
      console.log('✅ NavBar: Account change response:', resp);
      if (resp) {
        setAccountType(value);
        console.log('✅ NavBar: Account type updated to:', value);
        
        // Force refresh trading accounts data to get updated balances
        refetchTdAccounts().then(() => {
          console.log('✅ NavBar: Trading accounts data refreshed after account switch');
        }).catch((error) => {
          console.error('❌ NavBar: Failed to refresh trading accounts:', error);
        });
        
        // If switching to live account, trigger additional data refreshes
        if (value === true) {
          console.log('🔄 NavBar: Switching to live account - triggering data refresh');
          
          // Request fresh margin/balance data for live account
          refreshLiveAccountData();
          
          // Emit custom event to notify other components about account change
          const accountChangeEvent = new CustomEvent('accountChange', {
            detail: {
              accountType: 'live',
              accountId: selectedAccount,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(accountChangeEvent);
        } else {
          // Emit event for demo account switch too
          const accountChangeEvent = new CustomEvent('accountChange', {
            detail: {
              accountType: 'demo',
              accountId: selectedAccount,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(accountChangeEvent);
        }
      } else {
        console.log('⚠️ NavBar: Account change returned null/undefined');
      }
    }).catch((error) => {
      console.error('❌ NavBar: Account switch failed:', error);
      console.error('❌ NavBar: Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      
      // Check for token expiry here as well
      const errorData = error.response?.data;
      if (errorData && (
        errorData.includes?.('Access token has expired') ||
        errorData.includes?.('RECONNECT_REQUIRED') ||
        JSON.stringify(errorData).includes('Access token has expired')
      )) {
        console.log('🚨 NavBar: Token expiry detected, should redirect');
        alert('Token expired detected in NavBar! Check console for details.');
      }
    });
  };

  // Function to refresh live account data when switching to live mode
  const refreshLiveAccountData = async () => {
    try {
      console.log('🔄 NavBar: Refreshing live account data...');
      
      // Make API call to refresh margin and balance data from Upstox
      const response = await axiosInstance.post('/trading-accounts/refresh-live-data');
      
      console.log('✅ NavBar: Live account data refreshed:', response.data);
      
      // Force refresh trading accounts to update UI with new data
      refetchTdAccounts();
      
    } catch (error: any) {
      console.error('❌ NavBar: Failed to refresh live account data:', error);
      
      // Check if this is a token expiry error
      const errorData = error.response?.data;
      if (errorData && (
        errorData.includes?.('Access token has expired') ||
        errorData.includes?.('RECONNECT_REQUIRED') ||
        JSON.stringify(errorData).includes('Access token has expired')
      )) {
        console.log('🚨 NavBar: Token expiry detected during live data refresh');
        alert('Token expired while refreshing live data. Please reconnect your account.');
      }
    }
  };

  const selectedRiskProfileData = riskProfiles?.data?.find(
    (p) => p.documentId === selectedRiskProfile
  );

  const navigate = useNavigate();

  useEffect(() => {
    console.log("NavBar: Trading accounts effect", { 
      isTradingLoadingAcccount, 
      tradingAccountsData: tradingAccounts?.data,
      dataLength: tradingAccounts?.data?.length,
      fullTradingAccounts: tradingAccounts,
      accounts: tradingAccounts?.data?.map(acc => ({
        id: acc.id,
        documentId: acc.documentId,
        name: acc.name,
        broker: acc.broker,
        accountType: acc.accountType,
        isLinked: acc.isLinked
      }))
    });
    
    if (isTradingLoadingAcccount) return;

    if (tradingAccounts?.data && Array.isArray(tradingAccounts.data) && tradingAccounts.data.length > 0) {
      const savedSelectedAccount = localStorage.getItem("default-selected-account");
      console.log("NavBar: Saved selected account from localStorage:", savedSelectedAccount);

      let activeAcc = tradingAccounts.data.find(
        (ta) => ta.documentId === savedSelectedAccount
      );

      // If no saved account or saved account not found, find the best account to select
      if (!activeAcc && tradingAccounts.data.length > 0) {
        // Group accounts by broker to find the best broker
        const brokerGroups: Record<string, TradingAccount[]> = {};
        tradingAccounts.data.forEach(account => {
          const broker = account.broker || 'upstox';
          if (!brokerGroups[broker]) {
            brokerGroups[broker] = [];
          }
          brokerGroups[broker].push(account);
        });

        // Find the best broker to select (prioritize linked and active accounts)
        let bestBroker = '';
        let bestScore = -1;

        Object.entries(brokerGroups).forEach(([broker, accounts]: [string, TradingAccount[]]) => {
          let score = 0;
          const liveAccount = accounts.find((acc: TradingAccount) => 
            acc.accountType === 'live' || acc.account_type === 'live'
          );
          
          if (liveAccount) {
            // Prioritize linked accounts
            if (liveAccount.isLinked || liveAccount.isLinkedWithBrokerAccount) score += 10;
            // Prioritize active accounts
            if ((liveAccount as any).account_status === 'active' || (liveAccount as any).accountStatus === 'active') score += 5;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestBroker = broker;
            activeAcc = liveAccount || accounts[0];
          }
        });
        
        console.log("NavBar: No saved account found, selecting best broker:", {
          selectedBroker: bestBroker,
          selectedAccount: activeAcc,
          accountStatus: (activeAcc as any)?.account_status || (activeAcc as any)?.accountStatus,
          isLinked: (activeAcc as any)?.isLinked || (activeAcc as any)?.isLinkedWithBrokerAccount,
          brokerGroups: Object.keys(brokerGroups)
        });
      }

      if (activeAcc && activeAcc.documentId) {
        console.log("NavBar: Setting selected account:", activeAcc.documentId);
        setSelectedAccount(activeAcc.documentId);
        const isLiveActive =
          ((activeAcc as any).account_status === "active" || (activeAcc as any).accountStatus === "active") ? true : false;

        setAccountType(isLiveActive);
        
        // Save the selected account to localStorage
        localStorage.setItem("default-selected-account", activeAcc.documentId);
      }
    }
  }, [tradingAccounts, isTradingLoadingAcccount]);

  useEffect(() => {
    console.log("NavBar: Risk profiles effect", { 
      isLoadingRiskProfiles, 
      riskProfilesData: riskProfiles?.data,
      dataLength: riskProfiles?.data?.length,
      fullRiskProfiles: riskProfiles,
      profiles: riskProfiles?.data?.map(rp => ({
        id: rp.id,
        documentId: rp.documentId,
        name: rp.name,
        active: rp.active,
        createdAt: rp.createdAt
      }))
    });
    
    if (isLoadingRiskProfiles) return;

    if (riskProfiles && riskProfiles?.data?.length > 0) {
      // First try to find an active risk profile
      let selectedRP = riskProfiles?.data?.find((rp) => rp.active);
      
      // If no active profile found, select the most recently created one
      if (!selectedRP) {
        selectedRP = riskProfiles.data.reduce((latest, current) => {
          const currentDate = new Date(current.createdAt || 0);
          const latestDate = new Date(latest.createdAt || 0);
          return currentDate > latestDate ? current : latest;
        });
        
        console.log('🔍 NavBar: No active risk profile found, selecting most recent:', selectedRP);
      }
      
      if (selectedRP && selectedRP.documentId) {
        console.log('🔍 NavBar: Setting selected risk profile:', selectedRP.documentId);
        setSelectedRiskProfile(selectedRP.documentId);
      }
    }
  }, [riskProfiles, isLoadingRiskProfiles]);

  const handleChangeRiskProfile = (value: string) => {
    console.log('🔄 [RISK-PROFILE] Changing risk profile to:', value);
    
    // Update in database with active flag
    updateRiskSetting({
      documentId: value,
      active: true  // 🔑 This was missing - tells backend to set as active
    }).then(() => {
      console.log('✅ [RISK-PROFILE] Successfully updated active risk profile in database');
      setSelectedRiskProfile(value);
    }).catch(err => {
      console.error('❌ [RISK-PROFILE] Failed to update risk profile:', err);
      // TODO: Show toast notification to user
    });
  };
  const handleAddRiskProfile = () => {
    navigate(`/risk-profile/new`);
  };

  const handleAddNewAccount = () => {
    navigate(`/account/new`);
  };

  const handleSetSelectedAccount = (value: string) => {
    setSelectedAccount(value);
    const liveAccount = tradingAccounts?.data?.find(
      (td) => td.documentId === value
    );
    const activeAccount =
      ((liveAccount as any)?.account_status === "active" || (liveAccount as any)?.accountStatus === "active") ? true : false;
    setAccountType(activeAccount);
    
    // Refetch accounts and handle potential token expiry
    refetchTdAccounts().catch((error) => {
      console.error('Failed to refetch trading accounts:', error);
      // Error will be handled by global error handler
    });
  };

  return (
    <nav className="bg-gray-800 py-2">
      <div className="container px-4">
        <div className="flex justify-between items-center">
          <div className="flex text-white font-bold gap-4">
            <span>Maal</span>
            <Link to="/" className="block sm:hidden">
              Home
            </Link>
          </div>

          <div className="hidden sm:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="text-white"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          <div className="flex sm:hidden items-center gap-2">
            {(() => {
              const conditions = {
                tradingAccountsLoading: !isTradingLoadingAcccount,
                riskProfilesLoading: !isLoadingRiskProfiles,
                tradingAccountsExist: !!tradingAccounts,
                riskProfilesExist: !!riskProfiles,
                tradingAccountsHasData: !!(tradingAccounts?.data && Array.isArray(tradingAccounts.data) && tradingAccounts.data.length > 0),
                riskProfilesHasData: !!(riskProfiles?.data && Array.isArray(riskProfiles.data) && riskProfiles.data.length > 0)
              };
              
              console.log("NavBar: Render conditions check", conditions);
              
              const shouldRender = Object.values(conditions).every(Boolean);
              console.log("NavBar: Should render trading accounts section:", shouldRender);
              
              return shouldRender;
            })() && (
                <div className="flex gap-2 items-center">
                  <div className="flex bg-[#0A1623] px-4 rounded-lg items-center min-w-[150px] min-h-[70px]">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full bg-transparent text-white"
                      onClick={handleAddRiskProfile}
                    >
                      <Plus />
                    </Button>
                    <div className="flex flex-col px-4">
                      <Select
                        value={selectedRiskProfile}
                        onValueChange={(value: string) =>
                          handleChangeRiskProfile(value)
                        }
                      >
                        <SelectTrigger className="text-gray-300 text-sm h-8 w-full border-0 bg-[#0A1623] ring-0 focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Select Risk Profile">
                            {selectedRiskProfileData && (
                              <div className="flex flex-col justify-between items-center w-full px-2">
                                <span>{selectedRiskProfileData.name}</span>
                                <span className="text-red-500">
                                  Risk - {selectedRiskProfileData.severity}
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="border-0 bg-[#0A1623] text-white">
                          {!isLoadingRiskProfiles &&
                            riskProfiles?.data?.map((profile, index) => (
                              <SelectItem
                                key={profile.documentId + "" + index}
                                value={profile.documentId ?? ""}
                                className="hover:bg-[#1E293B] hover:text-white focus:bg-[#1E293B] focus:text-white"
                              >
                                <div className="flex justify-between items-center w-full gap-2">
                                  <span>{profile.name}</span>
                                  <span className="text-red-500">
                                    {profile.severity}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                              
                  <TradingAccountSelect
                    tradingAccounts={tradingAccounts?.data || []}
                    selectedBroker={selectedAccount}
                    handleSetSelectedAccount={handleSetSelectedAccount}
                    accountType={accountType}
                    handleAccountChange={handleAccountChange}
                    handleAddNewAccount={handleAddNewAccount}
                  />
                </div>
              )}
            <AccountDropDown />
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="hidden sm:block mt-4 pb-4">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-white">
                Home
              </Link>

              {!isTradingLoadingAcccount &&
                !isLoadingRiskProfiles &&
                tradingAccounts &&
                riskProfiles &&
                tradingAccounts?.data && Array.isArray(tradingAccounts.data) && tradingAccounts.data.length > 0 &&
                riskProfiles?.data && Array.isArray(riskProfiles.data) && riskProfiles.data.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#0A1623] p-4 rounded-lg flex items-center px-8">
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full bg-transparent text-white"
                          onClick={handleAddRiskProfile}
                        >
                          <Plus />
                        </Button>
                      </div>
                      <div className="border flex-1 px-16">
                        {/* <span className="text-white">Risk Profile</span> */}
                        <Select
                          value={selectedRiskProfile}
                          onValueChange={(value: string) => {
                            // 🔄 Use same handler as desktop for consistency
                            handleChangeRiskProfile(value);
                            localStorage.setItem("default-profile", value);
                          }}
                        >
                          <SelectTrigger className="text-gray-300 text-sm h-8 w-full border-0 bg-[#0A1623] ring-0 focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Select Risk Profile">
                              {selectedRiskProfileData && (
                                <div className="flex flex-col justify-between items-center w-full px-2">
                                  <span>{selectedRiskProfileData.name}</span>
                                  <span className="text-red-500">
                                    Risk - {selectedRiskProfileData.severity}
                                  </span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="border-0 bg-[#0A1623] text-white">
                            {!isLoadingRiskProfiles &&
                              riskProfiles?.data?.map((profile, index) => (
                                <SelectItem
                                  key={profile.documentId + "" + index}
                                  value={profile.documentId ?? ""}
                                  className="hover:bg-[#1E293B] hover:text-white focus:bg-[#1E293B] focus:text-white"
                                >
                                  <div className="flex justify-between items-center w-full gap-2">
                                    <span>{profile.name}</span>
                                    <span className="text-red-500">
                                      {profile.severity}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="bg-[#0A1623] p-4 rounded-lg">
                      <TradingAccountSelect
                        tradingAccounts={tradingAccounts?.data || []}
                        selectedBroker={selectedAccount}
                        handleSetSelectedAccount={handleSetSelectedAccount}
                        accountType={accountType}
                        handleAccountChange={handleAccountChange}
                        handleAddNewAccount={handleAddNewAccount}
                      />
                    </div>
                  </div>
                )}
              <div className="mt-2">
                <AccountDropDown />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
