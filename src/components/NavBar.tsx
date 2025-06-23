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
import { AccountStatus, RiskSetting } from "@/types/strapiTypes";

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

  const selectedRiskProfileData = riskProfiles?.data?.find(
    (p) => p.documentId === selectedRiskProfile
  );

  const navigate = useNavigate();

  useEffect(() => {
    console.log("NavBar: Trading accounts effect", { 
      isTradingLoadingAcccount, 
      tradingAccountsData: tradingAccounts?.data,
      dataLength: tradingAccounts?.data?.length 
    });
    
    if (isTradingLoadingAcccount) return;

    if (tradingAccounts?.data && Array.isArray(tradingAccounts.data) && tradingAccounts.data.length > 0) {
      const savedSelectedAccount = localStorage.getItem("default-selected-account");
      console.log("NavBar: Saved selected account from localStorage:", savedSelectedAccount);

      let activeAcc = tradingAccounts.data.find(
        (ta) => ta.documentId === savedSelectedAccount
      );

      // If no saved account or saved account not found, select the first available account
      if (!activeAcc && tradingAccounts.data.length > 0) {
        activeAcc = tradingAccounts.data[0];
        console.log("NavBar: No saved account found, selecting first available:", activeAcc);
      }

      if (activeAcc && activeAcc.documentId) {
        console.log("NavBar: Setting selected account:", activeAcc.documentId);
        setSelectedAccount(activeAcc.documentId);
        const isLiveActive =
          activeAcc.account_status === "active" ? true : false;

        setAccountType(isLiveActive);
        
        // Save the selected account to localStorage
        localStorage.setItem("default-selected-account", activeAcc.documentId);
      }
    }
  }, [tradingAccounts, isTradingLoadingAcccount]);

  useEffect(() => {
    if (isLoadingRiskProfiles) return;

    if (riskProfiles && riskProfiles?.data?.length > 0) {
      const activeRP = riskProfiles?.data?.find((rp) => rp.active);
      if (activeRP && activeRP.documentId) {
        setSelectedRiskProfile(activeRP.documentId);
      }
    }
  }, [riskProfiles, isLoadingRiskProfiles]);

  const handleChangeRiskProfile = (value: string) => {
    console.log("auoaudsasd ", value);
    updateRiskSetting({
      documentId: value,
    }).then(() => {
      setSelectedRiskProfile(value);
    }).catch(err=>{
      console.log("api aerer ", err );
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
      liveAccount?.account_status === "active" ? true : false;
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
                            setSelectedRiskProfile(value);
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
