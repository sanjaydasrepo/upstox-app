import {
  useRiskSettingsByUser,
  useTradingAccounts,
  useUser,
} from "@/hooks/strapiHooks";
import React, { useEffect, useState } from "react";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface NavbarProps {
  handleLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ handleLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRiskProfile, setSelectedRiskProfile] = useState("");
  const [accountType, setAccountType] = useState(false);
  const { data: user } = useUser();
  const { data: riskProfiles, isLoading: isLoadingRiskProfiles } =
    useRiskSettingsByUser(user?.documentId ?? "");

  const { data: tradingAccounts, isLoading } = useTradingAccounts({
    account_status: "active",
  });

  console.log("daadadad ", accountType);
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleAccountChange = (value: any) => {
    localStorage.setItem("account-active", value ? "real" : "demo");
    setAccountType(value);
  };

  const getAccountBalance = () => {
    const aType = accountType ? "live" : "demo";
    const account = tradingAccounts?.data?.find(
      (ac) => ac.account_type === aType
    );
    return <span> {account?.current_balance} </span>;
  };

  useEffect(() => {
    const activeAccount = localStorage.getItem("account-active");
    if (activeAccount && activeAccount === "real") {
      setAccountType(true);
    } else {
      setAccountType(false);
    }
  }, []);

  return (
    <nav className="bg-gray-800 py-4">
      <div className="container flex justify-between items-center">
        <div className="text-white font-bold">Maal</div>
        <div className="relative flex items-center gap-2">
          <div className="">
            <Select
              value={selectedRiskProfile}
              onValueChange={(value: string) => setSelectedRiskProfile(value)}
            >
              <SelectTrigger className="text-gray-300 h-12 w-full border-0 bg-[#0A1623] ring-0 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select Risk Profile" />
              </SelectTrigger>
              <SelectContent className="border-0 bg-[#0A1623] text-white">
                {!isLoadingRiskProfiles &&
                  riskProfiles &&
                  riskProfiles?.data?.map((pp, index) => (
                    <SelectItem
                      key={pp.documentId + "" + index}
                      value={pp.documentId ?? ""}
                      className="hover:bg-[#1E293B] hover:text-white focus:bg-[#1E293B] focus:text-white"
                    >
                      {pp.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="bg-white rounded px-2">
            <span className="font-semibold text-sm text-black">
              {" "}
              &#8377;{getAccountBalance()}{" "}
            </span>
          </div>
          <div className="pr-8 flex text-white flex items-center gap-2">
            <span className=""> Demo </span>
            <Switch
              onCheckedChange={handleAccountChange}
              checked={accountType}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
            />
            <span className=""> Real </span>
          </div>
          <button
            className="text-white hover:text-gray-300 focus:outline-none"
            onClick={toggleDropdown}
          >
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </button>
          <span className="text-white"> {user?.email}</span>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div className="py-2">
                <button
                  className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
