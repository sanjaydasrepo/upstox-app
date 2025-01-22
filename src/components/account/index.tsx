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

interface AccountFormData {
  accountType: "zerodha" | "upstocks";
  apiKey: string;
  secret: string;
}

const Account: React.FC = () => {
  const { action } = useParams();
  const location = useLocation();
  const form = useForm<AccountFormData>();
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createTradingAccount } = useCreateTradingAccount();
  const { mutateAsync: createTradingCredential } =
    useCreateTradingCredentials();
  const { data: user } = useUser();
  const navigate = useNavigate();

  const saveAccountDetails = async (token: string, broker: string) => {
    let formDataRaw = localStorage.getItem("formdata");
    let formData = {} as AccountFormData;

    if (formDataRaw) {
      formData = JSON.parse(formDataRaw);
    }

    try {
      const realAccount = await axiosInstance.get<
        StrapiArrayResponse<TradingAccount>
      >(
        `/trading-accounts?filters[user][documentId]=${user?.documentId}&filters[broker]=${broker}&filters[account_type]=live`
      );

      const demoAccount = await axiosInstance.get<
        StrapiArrayResponse<TradingAccount>
      >(
        `/trading-accounts?filters[user][documentId]=${user?.documentId}&filters[broker]=${broker}&filters[account_type]=demo`
      );

      let createdRealAccount;
      let createdDemoAccount;

      if (!realAccount.data?.data.length) {
        // TODO: Fetch actual values from Upstox API
        const dummyRealAccountData = {
          name: `Real-Account-${broker}`,
          account_type: AccountType.LIVE,
          account_status: AccountStatus.ACTIVE,
          initial_balance: 50000,
          current_balance: 50000,
          broker: broker as BrokerType,
          user: user?.id,
        };

        createdRealAccount = await createTradingAccount(dummyRealAccountData);
      }

      if (!demoAccount.data?.data.length) {
        const demoAccountData = {
          name: `Demo-Account-${broker}`,
          account_type: AccountType.DEMO,
          account_status: AccountStatus.ACTIVE,
          initial_balance: 100000,
          current_balance: 100000,
          broker: broker as BrokerType,
          user: user?.id,
        };

        createdDemoAccount = await createTradingAccount(demoAccountData);
      }

      const allAccounts = [
        ...(realAccount.data?.data || []),
        ...(demoAccount.data?.data || []),
        createdRealAccount?.data,
        createdDemoAccount?.data,
      ].filter(Boolean);

      const firstAccountId = allAccounts[0]?.documentId;

      if (!firstAccountId) {
        console.error("No trading accounts found or created");
        return false;
      }

      if (firstAccountId) {
        const existingCreds = await axiosInstance.get<
          StrapiArrayResponse<TradingCredential>
        >(
          `/trading-credentials?filters[trading_accounts][documentId]=${firstAccountId}`
        );

        if (!existingCreds.data?.data.length) {
          const accountIds = allAccounts.map((account) => account.documentId);

          await createTradingCredential({
            api_key: formData?.apiKey,
            api_secret: formData?.secret,
            access_token: token,
            is_active: true,
            trading_accounts: {
              connect: accountIds,
            },
          });
        }
      }
      return true;
    } catch (error) {
      console.error("Error saving account details:", error);
      return false;
    }
  };

  useEffect(() => {
    if( action && action === 'add') {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get("token");
      const state = searchParams.get("state") || "upstox";
      if (token && user) {
        setLoading(true);
        saveAccountDetails(token, state).then( resp =>{
          console.log("Received token:", token, state , resp );
          navigate(`/`,{ replace: true });
        });
      }
    }
  }, [location.search, user , action ]);

  const onSubmit = async (data: AccountFormData) => {
    setLoading(true);
    localStorage.setItem("formdata", JSON.stringify(data));
    try {
      const resp = await axiosInstanceBk.post(
        "/auth/upstox",
        JSON.stringify(data)
      );
      if (resp.status === 200) {
        window.location.href = resp.data.url;
      } else {
        console.error("Error connecting account", resp);
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
