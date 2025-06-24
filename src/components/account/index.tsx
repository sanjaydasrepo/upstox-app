import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axiosInstanceBk from "@/utils/axiosConfigBk";
import {
  useCreateTradingAccount,
  useTradingAccountsByUser,
  useUser,
} from "@/hooks/strapiHooks";
import axiosInstance from "@/utils/axiosConfig";
import {
  AccountStatus,
  AccountType,
  BrokerType,
  StrapiArrayResponse,
  StrapiResponse,
  TradingAccount,
} from "@/types/strapiTypes";

export interface AccountFormData {
  name: string;
  displayBrokerName?: string;
  broker: string;
  accountType: "zerodha" | "upstox";
  apiKey: string;
  secret: string;
  access_token?: string;
}
export interface Payload {
  account_type: "zerodha" | "upstox";
  broker: string;
  displayBrokerName: string;
  initial_balance?: number;
  credentials: {
    api_key: string;
    api_secret: string;
    access_token?: string;
  };
}

const Account: React.FC = () => {
  const { action } = useParams();
  const form = useForm<AccountFormData>();
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createTradingAccount } = useCreateTradingAccount();
  const { data: tradingAccounts, isLoading: isTradingLoadingAcccount } =
    useTradingAccountsByUser();

  // const navigate = useNavigate();

  const saveAccountDetails = async (formData: AccountFormData) => {
    try {
      // Map accountType to proper broker name and display name
      const brokerMapping: Record<string, { broker: string; displayName: string }> = {
        upstox: { broker: "upstox", displayName: "Upstox" },
        zerodha: { broker: "zerodha", displayName: "Zerodha" }
      };
      
      const brokerInfo = brokerMapping[formData.accountType];
      
      if (!brokerInfo) {
        throw new Error(`Unsupported account type: ${formData.accountType}`);
      }
      
      const payload: Payload = {
        account_type: formData.accountType as "zerodha" | "upstox",
        broker: brokerInfo.broker,
        displayBrokerName: formData.displayBrokerName || brokerInfo.displayName,
        initial_balance: 100000, // Default demo balance
        credentials: {
          api_key: formData.apiKey,
          access_token: "",
          api_secret: formData.secret,
        },
      };
      
      const resp = await createTradingAccount(payload);
      return resp;
    } catch (error) {
      console.error("Error saving account details:", error);
      return false;
    }
  };

  useEffect(() => {
    const apiKeyValidation = async (value: any) => {
      if (!value || isTradingLoadingAcccount) return true;
      try {
        const resp = await axiosInstance.get(
          `http://localhost:3005/trading-accounts/validate-api-key/${value}`
        );
        
        if (resp.data.exists) {
          if (resp.data.hasLinkedAccounts) {
            return "Key already exists.";
          } else {
            // setReconnectAccount();
            return "Reconnecting ...";
          }
        } else {
          return true;
        }
      } catch (err) {
        console.log("API validation error:", err);
        return true;
      }
    };

    form.register("apiKey", {
      validate: apiKeyValidation,
    });
  }, [form.register, isTradingLoadingAcccount, tradingAccounts]);

  const onSubmit = async (data: AccountFormData) => {
    setLoading(true);
    try {
      const displayBrokerName =
        tradingAccounts?.data && tradingAccounts?.data.length > 0
          ? `${data.broker}-${tradingAccounts?.data.length}`
          : `${data.broker}-1`;
      data.displayBrokerName = displayBrokerName;
      const accResp = await saveAccountDetails(data);

      console.log(`console `, accResp);
      if (accResp) {
        console.log('✅ Trading account created successfully, requesting Upstox auth URL...');
        
        // Use axiosInstance (not axiosInstanceBk) since the endpoint now requires Firebase auth
        const resp = await axiosInstance.post("http://localhost:3005/auth/upstox");
        console.log("Upstox auth response:", resp);

        if (resp.status === 200 && resp.data.url) {
          console.log('✅ Got Upstox auth URL, redirecting...');
          window.location.href = resp.data.url;
        } else {
          console.error("Error getting Upstox auth URL:", resp.data);
          alert(`Failed to get Upstox auth URL: ${resp.data.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (action !== "new") {
    return <div>Invalid action</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Add Trading Account</CardTitle>
          <CardDescription>
            Connect your trading account by selecting your broker and entering
            API credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                rules={{ required: true }}
                disabled={loading}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your broker" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="zerodha">Zerodha</SelectItem>
                        <SelectItem value="upstox">Upstox</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                disabled={loading}
                rules={{ required: true }}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your API key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                disabled={loading}
                rules={{ required: true }}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your secret key"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connecting..." : "Connect Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;
