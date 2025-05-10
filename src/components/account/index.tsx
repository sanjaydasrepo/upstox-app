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
  useCreateTradingCredentials,
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
  TradingCredential,
} from "@/types/strapiTypes";

export interface AccountFormData {
  name: string;
  accountType: "zerodha" | "upstox";
  apiKey: string;
  secret: string;
  access_token?: string;
}
export interface Payload {
  account_type: "zerodha" | "upstox";
  broker: string;
  credentials: {
    api_key: string;
    api_secret: string;
    access_token?: string;
  };
}

const Account: React.FC = () => {
  const { action } = useParams();
  const location = useLocation();
  const form = useForm<AccountFormData>();
  const [loading, setLoading] = useState(false);
  const [reeconnectAccount, setReconnectAccount] = useState();

  const { mutateAsync: createTradingAccount } = useCreateTradingAccount();
  const { data: tradingAccounts, isLoading: isTradingLoadingAcccount } =
    useTradingAccountsByUser();

  const { data: user } = useUser();
  const navigate = useNavigate();

  const saveAccountDetails = async (formData: AccountFormData) => {
    try {
      const payload: Payload = {
        account_type: formData.accountType,
        broker: formData.accountType,
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
        const resp = await axiosInstance.get<
          StrapiArrayResponse<TradingCredential>
        >(`/trading-credentials?filters[api_key]=${value}`);
        if (
          resp.data.data.length > 0 &&
          tradingAccounts?.data &&
          tradingAccounts?.data?.length > 0
        ) {
          const linkedAccs = tradingAccounts.data.filter(
            (td) => td.account_type === "live" && td.isLinkedWithBrokerAccount
          );
          if (linkedAccs.length > 0) {
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
      const accResp = await saveAccountDetails(data);

      console.log(`console `, accResp);
      if (accResp) {
        const resp = await axiosInstanceBk.post("/auth/upstox");
        console.log("resp is ", resp);

        if (resp.status === 200) {
          window.location.href = resp.data.url;
        } else {
          console.error("Error connecting account", resp);
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
