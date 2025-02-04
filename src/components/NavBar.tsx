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
import { useRiskSettingsByUser, useTradingAccounts, useUser } from "@/hooks/strapiHooks";

interface NavbarProps {
  handleLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ handleLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRiskProfile, setSelectedRiskProfile] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountType, setAccountType] = useState(false);
  
  const { data: user } = useUser();
  const { data: riskProfiles, isLoading: isLoadingRiskProfiles } =
    useRiskSettingsByUser(user?.documentId ?? "");

  const { data: tradingAccounts, isLoading: isTradingLoadingAcccount } =
    useTradingAccounts({
      account_status: "active",
    });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleAccountChange = (value: any) => {
    localStorage.setItem("account-active", value ? "real" : "demo");
    setAccountType(value);
  };

  const selectedRiskProfileData = riskProfiles?.data?.find(
    (p) => p.documentId === selectedRiskProfile
  );

  const navigate = useNavigate();

  useEffect(() => {
    const activeAccount = localStorage.getItem("account-active");
    const defaultBroker = localStorage.getItem("default-broker");

    if (activeAccount && activeAccount === "real") {
      setAccountType(true);
    } else {
      setAccountType(false);
    }

    if (defaultBroker) {
      setSelectedAccount(defaultBroker);
    } else if (tradingAccounts && tradingAccounts?.data?.length > 0) {
      setSelectedAccount(tradingAccounts?.data[0]?.documentId ?? "");
    }
  }, []);

  useEffect(() => {
    const defaultRiskProfile = localStorage.getItem("default-profile");
    if (defaultRiskProfile) {
      setSelectedRiskProfile(defaultRiskProfile);
    } else if (riskProfiles && riskProfiles?.data?.length > 0) {
      if (riskProfiles?.data[0].documentId)
        setSelectedRiskProfile(riskProfiles?.data[0].documentId);
    }
  }, [riskProfiles]);

  const handleAddRiskProfile = () => {
    navigate(`/risk-profile/new`);
  };

  const handleAddNewAccount = () => {
    navigate(`/account/new`);
  };

  return (
    <nav className="bg-gray-800 py-2">
      <div className="container px-4">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex text-white font-bold gap-4">
            <span>Maal</span>
            <Link to="/" className="block sm:hidden">Home</Link>
          </div>

          {/* Mobile Menu Button */}
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

          {/* Desktop Navigation */}
          <div className="flex sm:hidden items-center gap-2">
            {!isTradingLoadingAcccount &&
              !isLoadingRiskProfiles &&
              tradingAccounts &&
              riskProfiles &&
              tradingAccounts?.data?.length > 0 &&
              riskProfiles?.data?.length > 0 && (
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

                  <TradingAccountSelect
                    tradingAccounts={tradingAccounts?.data || []}
                    selectedBroker={selectedAccount}
                    setSelectedBroker={setSelectedAccount}
                    accountType={accountType}
                    handleAccountChange={handleAccountChange}
                    handleAddNewAccount={handleAddNewAccount}
                  />
                </div>
              )}
            <AccountDropDown />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="hidden sm:block mt-4 pb-4">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-white">Home</Link>
              
              {!isTradingLoadingAcccount &&
                !isLoadingRiskProfiles &&
                tradingAccounts &&
                riskProfiles &&
                tradingAccounts?.data?.length > 0 &&
                riskProfiles?.data?.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#0A1623] p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white">Risk Profile</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full bg-transparent text-white"
                          onClick={handleAddRiskProfile}
                        >
                          <Plus />
                        </Button>
                      </div>
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

                    <div className="bg-[#0A1623] p-4 rounded-lg">
                      <TradingAccountSelect
                        tradingAccounts={tradingAccounts?.data || []}
                        selectedBroker={selectedAccount}
                        setSelectedBroker={setSelectedAccount}
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