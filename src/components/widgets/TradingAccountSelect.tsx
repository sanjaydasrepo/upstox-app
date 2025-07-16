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


  console.log("TradingAccountSelect: Props received", {
    selectedBroker,
    tradingAccountsLength: tradingAccounts.length,
    selectedAccount,
    accountType,
    firstAccount: tradingAccounts[0],
    accountFields: tradingAccounts[0] ? Object.keys(tradingAccounts[0]) : [],
    currentBalance: selectedAccount?.current_balance,
    displayName: selectedAccount?.name,
    allAccounts: tradingAccounts.map(acc => ({
      id: acc.documentId,
      name: acc.name,
      accountType: acc.accountType,
      liveBalance: acc.currentBalance || acc.current_balance,
      demoBalance: (acc as any).pairedDemoAccount?.currentBalance,
      pairedDemo: (acc as any).pairedDemoAccount ? {
        id: (acc as any).pairedDemoAccount.id,
        balance: (acc as any).pairedDemoAccount.currentBalance
      } : 'No paired demo account found'
    }))
  });
  
  const generateNumberedBrokerOptions = (
    tradingAccounts: TradingAccount[]
  ): BrokerOption[] => {
    console.log('🔍 TradingAccountSelect: All trading accounts:', tradingAccounts);
    
    // Group accounts by broker
    const brokerGroups: Record<string, TradingAccount[]> = {};
    
    tradingAccounts.forEach((account) => {
      const brokerName = account.broker || 'upstox';
      if (!brokerGroups[brokerName]) {
        brokerGroups[brokerName] = [];
      }
      brokerGroups[brokerName].push(account);
    });

    console.log('🔍 TradingAccountSelect: Broker groups:', brokerGroups);

    // Create broker options - one per broker, using the live account ID as value
    const brokerOptions: BrokerOption[] = Object.entries(brokerGroups).map(([brokerName, accounts]) => {
      // Find the live account for this broker (use as the primary reference)
      const liveAccount = accounts.find(acc => acc.accountType === 'live' || acc.account_type === 'live');
      const accountToUse = liveAccount || accounts[0]; // Fallback to first account if no live account

      console.log(`🔍 Creating broker option for ${brokerName}:`, {
        brokerName,
        accountsCount: accounts.length,
        liveAccount: !!liveAccount,
        selectedAccountId: accountToUse?.documentId,
        accounts: accounts.map(acc => ({
          id: acc.documentId,
          type: acc.accountType || acc.account_type,
          name: acc.name
        }))
      });

      return {
        value: accountToUse?.documentId || '',
        originalBroker: brokerName,
        displayName: brokerName.charAt(0).toUpperCase() + brokerName.slice(1), // Capitalize broker name
      };
    });

    console.log('🔍 TradingAccountSelect: Final broker options:', brokerOptions);
    return brokerOptions;
  };

  const brokerOptions: BrokerOption[] =
    generateNumberedBrokerOptions(tradingAccounts);

    console.log("Trading accounts ", brokerOptions  );
  

  const getCurrentBalance = (): number => {
    if (!selectedAccount) return 0;

    const accountBal = accountType
      ? (selectedAccount.currentBalance || selectedAccount.current_balance) // Live account balance
      : ((selectedAccount as any).pairedDemoAccount?.currentBalance); // Demo account balance from paired account
    
    console.log('💰 TradingAccountSelect: getCurrentBalance', {
      accountType: accountType ? 'live' : 'demo',
      selectedAccountId: selectedAccount.documentId,
      liveBalance: selectedAccount.currentBalance || selectedAccount.current_balance,
      demoBalance: (selectedAccount as any).pairedDemoAccount?.currentBalance,
      calculatedBalance: accountBal || 0
    });
    
    return accountBal || 0;
  };
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  console.log("TradingAccountSelect: selectedAccount check", selectedAccount);

  if (!selectedAccount) {
    console.log("TradingAccountSelect: No selectedAccount found, returning null");
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
              {brokerOptions.map((brokerOption) => (
                <SelectItem
                  key={brokerOption.value}
                  value={brokerOption.value || ""}
                  className="hover:bg-[#1E293B] hover:text-white focus:bg-[#1E293B] focus:text-white"
                >
                  {brokerOption.displayName}
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
