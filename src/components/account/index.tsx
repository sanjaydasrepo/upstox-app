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
  priority: "low" | "medium" | "high";
  access_token?:string;
}

const Account: React.FC = () => {
  const { action } = useParams();
  const location = useLocation();
  const form = useForm<AccountFormData>();
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createTradingAccount } = useCreateTradingAccount();
  const { data: user } = useUser();
  const navigate = useNavigate();

  const saveAccountDetails = async (token: string, broker: string) => {
    let formDataRaw = localStorage.getItem("formdata");
    let formData = {} as AccountFormData;

    if (formDataRaw) {
      formData = JSON.parse(formDataRaw);
    }

    console.log("form data ", formData);

    try {
      formData.name = `${formData.accountType}`;
      formData.access_token = token;
      await createTradingAccount(
        formData
      );
      return true;
    } catch (error) {
      console.error("Error saving account details:", error);
      return false;
    }
  };

  useEffect(() => {
    console.log("avvvv ", action);
    if (action && action === "new") {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get("token");
      const state = searchParams.get("state") || "upstox";

      console.log("Received token:", state, token);

      if (token && user) {
        setLoading(true);
        saveAccountDetails(token, state).then((resp) => {
          console.log("Received token:", token, state, resp);
          navigate(`/`, { replace: true });
        });
      }
    }
  }, [location.search, user, action]);

  useEffect(() => {
    const apiKeyValidation = async (value: any) => {
      if (!value) return true;

      try {
        const resp = await axiosInstance.get<
          StrapiArrayResponse<TradingCredential>
        >(`/trading-credentials?filters[api_key]=${value}`);
        return resp.data.data.length === 0 || "Key already exists.";
      } catch (err) {
        console.log("API validation error:", err);
        return true;
      }
    };

    form.register("apiKey", {
      validate: apiKeyValidation,
    });
  }, [form.register]);

  const onSubmit = async (data: AccountFormData) => {
    setLoading(true);

    localStorage.setItem("formdata", JSON.stringify(data));
    try {
      console.log("resp is ", data);
      const resp = await axiosInstanceBk.post(
        "/auth/upstox",
        JSON.stringify(data)
      );
      console.log("resp is ", resp);

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
