import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TradingAccount } from "@/types/strapiTypes";

interface BrokerOption {
  value: string | undefined;
  originalBroker: string;
  displayName: string;
}

interface TradingAccountSelectProps {
  tradingAccounts: TradingAccount[];
  selectedBroker: string;
  handleSetSelectedAccount: (value: string) => void;
  accountType: boolean;
  handleAccountChange: (checked: boolean) => void;
  handleAddNewAccount: () => void;
}

const TradingAccountSelect: React.FC<TradingAccountSelectProps> = ({
  tradingAccounts,
  selectedBroker,
  handleSetSelectedAccount,
  accountType,
  handleAccountChange,
  handleAddNewAccount,
}) => {
  const selectedAccount = tradingAccounts.find(
    (acc) => acc.documentId === selectedBroker
  );

  const getCurrentBalance = (): number => {
    const accountBal = accountType
      ? selectedAccount?.current_balance
      : selectedAccount?.demo_account?.current_balance;
    return accountBal || 0;
  };
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  console.log("asdadasdasd asdasd", selectedAccount);

  if (!selectedAccount) {
    return null;
  }
  return (
    <div className="flex gap-2 bg-[#0A1623] py-1 px-4 rounded-lg items-center min-h-[70px]">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-transparent text-white"
        onClick={handleAddNewAccount}
      >
        <Plus />
      </Button>
      <div className="flex gap-2 flex-grow items-center">
        <div className="flex flex-col items-center flex-1">
          <div className="flex text-white items-center justify-center gap-2">
            <span className="text-sm">Demo</span>
            <Switch
              onCheckedChange={handleAccountChange}
              checked={accountType}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
            />
            <span className="text-sm">Real</span>
          </div>

          {selectedBroker && (
            <div className="px-2 text-center">
              <span className="font-semibold text-lg text-white">
                {formatCurrency(getCurrentBalance())}
              </span>
            </div>
          )}
        </div>
        {tradingAccounts?.length > 0 && (
          <Select
            value={selectedBroker}
            onValueChange={(value: string) => {
              console.log("isisis ", value);
              handleSetSelectedAccount(value);
              localStorage.setItem("default-selected-account", value);
            }}
          >
            <SelectTrigger className="text-gray-300 text-sm h-8 w-full border-0 bg-[#0A1623] ring-0 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Select Trading Account" />
            </SelectTrigger>
            <SelectContent className="border-0 bg-[#0A1623] text-white">
              {tradingAccounts.map((broker) => (
                <SelectItem
                  key={broker.documentId}
                  value={broker.documentId || ""}
                  className="hover:bg-[#1E293B] hover:text-white focus:bg-[#1E293B] focus:text-white"
                >
                  {broker.displayBrokerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default TradingAccountSelect;
