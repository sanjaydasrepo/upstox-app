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
  setSelectedBroker: (value: string) => void;
  accountType: boolean;
  handleAccountChange: (checked: boolean) => void;
  handleAddNewAccount: () => void;
}

const TradingAccountSelect: React.FC<TradingAccountSelectProps> = ({
  tradingAccounts,
  selectedBroker,
  setSelectedBroker,
  accountType,
  handleAccountChange,
  handleAddNewAccount,
}) => {
  const generateNumberedBrokerOptions = (
    tradingAccounts: TradingAccount[]
  ): BrokerOption[] => {
    const brokerCounts: Record<string, number> = {};

    const numberedBrokers = tradingAccounts
      .filter((td) => td.account_type === "live" && td.isLinkedWithBrokerAccount )
      .map((account) => {
        const brokerName = account.broker;

        if (!brokerCounts[brokerName]) {
          brokerCounts[brokerName] = 1;
        }

        const displayName = `${brokerName} ${brokerCounts[brokerName]}`;

        brokerCounts[brokerName]++;

        return {
          value: account.documentId,
          originalBroker: brokerName,
          displayName,
        };
      });

    return numberedBrokers;
  };

  const brokerOptions: BrokerOption[] =
    generateNumberedBrokerOptions(tradingAccounts);

  const selectedBrokerAccounts = tradingAccounts.filter(
    (acc) => acc.documentId === selectedBroker
  );

  // Get current balance based on account type
  const getCurrentBalance = (): number => {
    const account = selectedBrokerAccounts.find(
      (acc) => acc.account_type === (accountType ? "live" : "demo")
    );
    return account?.current_balance || 0;
  };
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  console.log("asdadasdasd asdasd" , brokerOptions );
  if( brokerOptions.length === 0 ){
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
        {brokerOptions?.length > 0 && (
          <Select
            value={selectedBroker}
            onValueChange={(value: string) => {
              console.log("isisis ", value );
              setSelectedBroker(value);
              localStorage.setItem('default-broker', value);
            }}
          >
            <SelectTrigger className="text-gray-300 text-sm h-8 w-full border-0 bg-[#0A1623] ring-0 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Select Trading Account" />
            </SelectTrigger>
            <SelectContent className="border-0 bg-[#0A1623] text-white">
              {brokerOptions.map((broker) => (
                <SelectItem
                  key={broker.value}
                  value={broker.value || ""}
                  className="hover:bg-[#1E293B] hover:text-white focus:bg-[#1E293B] focus:text-white"
                >
                  {broker.displayName}
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
