import React, { useEffect, useState } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  uniqueNamesGenerator,
  names,
  colors,
  NumberDictionary,
} from "unique-names-generator";
import { Badge } from "@/components/ui/badge";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axiosInstance from "@/utils/axiosConfig";
import { useNavigate } from "react-router-dom";
import {
  useCreateRiskSettings,
  useRiskSettingsByUser,
  useTradingAccountsByUser,
  useUser,
} from "@/hooks/strapiHooks";
import PrioritySelector from "../account/widgets/PrioritySelector";

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    _maxPositionSize: z.boolean().default(false),
    _maxLossIsPercentage: z.boolean().default(false),
    _dailyLossIsPercentage: z.boolean().default(false),
    _dailyProfitIsPercentage: z.boolean().default(false),
    max_position_size: z
      .string()
      .nonempty({ message: "Max position size is required" })
      .superRefine((val, ctx) => {
        const numValue = parseFloat(val);

        if (isNaN(numValue)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid number",
            path: ctx.path,
          });
          return;
        }

        if (numValue <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Value must be greater than 0",
            path: ctx.path,
          });
        }
      }),
    max_loss_per_trade: z
      .string()
      .nonempty({ message: "Max loss per trade is required" })
      .superRefine((val, ctx) => {
        const numValue = parseFloat(val);

        if (isNaN(numValue)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid number",
            path: ctx.path,
          });
          return;
        }

        if (numValue <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Value must be greater than 0",
            path: ctx.path,
          });
        }
      }),
    daily_loss_limit: z
      .string()
      .nonempty({ message: "Daily loss limit is required" })
      .superRefine((val, ctx) => {
        const numValue = parseFloat(val);

        if (isNaN(numValue)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid number",
            path: ctx.path,
          });
          return;
        }

        if (numValue <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Value must be greater than 0",
            path: ctx.path,
          });
        }
      }),
    daily_profit_target: z
      .string()
      .nonempty({ message: "Daily profit target is required" })
      .superRefine((val, ctx) => {
        const numValue = parseFloat(val);

        if (isNaN(numValue)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid number",
            path: ctx.path,
          });
          return;
        }

        if (numValue <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Value must be greater than 0",
            path: ctx.path,
          });
        }
      }),
    max_trades_per_hour: z.string().optional(),
    stop_loss_buffer_points: z.string().optional(),
    max_allowed_volatility: z.string().optional(),
    avoid_high_iv: z.boolean().optional(),
    min_risk_to_reward_ratio: z.string().optional(),
    min_win_rate_percentage: z.string().optional(),
    enforce_stop_loss: z.boolean().optional(),
    enforce_take_profit: z.boolean().optional(),
    restricted_hours_from: z.string().optional(),
    restricted_hours_to: z.string().optional(),
    max_consecutive_losses: z.string().optional(),
    cooling_off_minutes_after_losses: z.string().optional(),
    severity: z.enum(["Low", "Medium", "High"]).default("Medium"),
  })
  .refine(
    (data) => {
      const maxPosSize = parseFloat(data.max_position_size);

      if (data._maxPositionSize) {
        return maxPosSize <= 100;
      }
    },
    {
      message: "Max loss cannot exceed 100%",
      path: ["max_position_size"],
    }
  )
  .refine(
    (data) => {
      const maxLossValue = parseFloat(data.max_loss_per_trade);
      const positionSize = parseFloat(data.max_position_size);

      if (data._maxLossIsPercentage) {
        return maxLossValue <= 100;
      } else {
        return maxLossValue <= positionSize;
      }
    },
    {
      message: "Max loss cannot exceed position size or 100%",
      path: ["max_loss_per_trade"],
    }
  )
  .refine(
    (data) => {
      const dailyLossValue = parseFloat(data.daily_loss_limit);
      const maxLossValue = parseFloat(data.max_loss_per_trade);
      const positionSize = parseFloat(data.max_position_size);

      const effectiveMaxLoss = data._maxLossIsPercentage
        ? (positionSize * maxLossValue) / 100
        : maxLossValue;

      if (data._dailyLossIsPercentage) {
        return dailyLossValue <= 100;
      } else {
        return dailyLossValue >= effectiveMaxLoss;
      }
    },
    {
      message:
        "Daily loss limit should be greater than max loss per trade and not exceed 100% if percentage",
      path: ["daily_loss_limit"],
    }
  )
  .refine(
    (data) => {
      const dailyLossValue = parseFloat(data.daily_loss_limit);
      const positionSize = parseFloat(data.max_position_size);

      if (data._dailyLossIsPercentage) {
        // If percentage, ensure the calculated value doesn't exceed position size
        const effectiveDailyLoss = (positionSize * dailyLossValue) / 100;
        return effectiveDailyLoss <= positionSize;
      } else {
        // If absolute value, direct comparison
        return dailyLossValue <= positionSize;
      }
    },
    {
      message: "Daily loss limit cannot exceed position size",
      path: ["daily_loss_limit"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface ToggleableFieldProps {
  name: string;
  label: string;
  isPercentage: boolean;
  setIsPercentage: (value: boolean) => void;
  percentageFieldName: string;
  description?: string;
  form: any;
}

const ToggleableField = ({
  name,
  label,
  isPercentage,
  setIsPercentage,
  percentageFieldName,
  description = "",
  form,
}: ToggleableFieldProps) => {
  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      form.setValue(name, value);
      form.trigger(name);
    },
    [form, name]
  );

  useEffect(() => {
    form.setValue(percentageFieldName, isPercentage);
    if (form.getValues(name)) {
      form.trigger(name);
    }
  }, [isPercentage, form, name, percentageFieldName]);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex justify-between items-center">
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Amount</span>
              <Switch
                checked={isPercentage}
                onCheckedChange={setIsPercentage}
              />
              <span className="text-sm">%ge</span>
            </div>
          </div>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                onChange={handleInputChange}
                type="number"
                step={isPercentage ? "0.1" : "1"}
              />
              <Badge
                variant="secondary"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {isPercentage ? "%" : "₹"}
              </Badge>
            </div>
          </FormControl>
          {/* {description && (
            <FormDescription>{getBestPracticeMessage(name)}</FormDescription>
          )} */}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const RiskProfile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxLossIsPercentage, setMaxLossIsPercentage] = useState(false);
  const [maxPosSizeIsPercentage, setMaxPosSizeIsPercentage] = useState(false);
  const [dailyLossIsPercentage, setDailyLossIsPercentage] = useState(false);
  const [dailyProfitIsPercentage, setDailyProfitIsPercentage] = useState(false);

  const { data: user } = useUser();
  const { mutateAsync: createRiskSettings } = useCreateRiskSettings();
  const { data: riskProfiles, isLoading: isLoadingRiskProfiles } =
    useRiskSettingsByUser(user?.documentId ?? "");

  const { data: tradingAccounts, isLoading: isTradingLoadingAcccount } =
    useTradingAccountsByUser(user?.documentId ?? "");
    
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: uniqueNamesGenerator({
        dictionaries: [
          colors,
          names,
          NumberDictionary.generate({ min: 100, max: 999 }),
        ],
        length: 3,
        separator: "-",
        style: "lowerCase",
      }),
      max_position_size: "",
      max_loss_per_trade: "",
      daily_loss_limit: "",
      daily_profit_target: "",
      _maxPositionSize: false,
      _maxLossIsPercentage: false,
      _dailyLossIsPercentage: false,
      _dailyProfitIsPercentage: false,
      severity: "Medium",
    },
  });

  const getBestPracticeMessage = (fieldName: string) => {
    const bestPractices: { [key: string]: string } = {
      max_position_size: "Recommended: 2-5% of total capital",
      max_loss_per_trade: "Best Practice: 1-2% of position size",
      daily_loss_limit: "Suggested: 3-5% of total capital",
      daily_profit_target: "Typical: 2-3x daily loss limit",
    };
    return bestPractices[fieldName] || "";
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      console.log("Processed data:", data);
      const resp = await createRiskSettings({
        max_position_size: +data.max_position_size,
        max_loss_per_trade: +data.max_loss_per_trade,
        name: data.name,
        daily_loss_limit: +data.daily_loss_limit,
        daily_profit_target: +data.daily_profit_target,
        enforce_stop_loss: data.enforce_stop_loss ?? false,
        max_trades_per_hour: data?.max_trades_per_hour
          ? +data?.max_trades_per_hour
          : 0,
        margin_call_threshold: 0,
        severity: data.severity,
        users: [user?.id],
      });
      console.log("Processed data:", resp);
      if (resp.status === 201) {
        setTimeout(() => {
          setLoading(false);
          navigate(`/`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error processing form:", error);
    } finally {
      //setLoading(false);
    }
  };

  return (
    <div className="container mx-auto sm:p-2 p-6 border">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Risk Profile Settings</CardTitle>
          <CardDescription>
            Configure your trading risk parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Essential Settings */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Severity</FormLabel>
                      <FormControl>
                        <PrioritySelector
                          value={field.value}
                          onChange={field.onChange}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Select the risk level for this profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Position Level Risk */}
                <div className="space-y-4">
                  <h4 className="font-medium">Position Level Risk</h4>
                  <div className="grid sm:grid-cols-1 grid-cols-2 gap-8">
                    <div>
                      <ToggleableField
                        form={form}
                        name="max_position_size"
                        label="Max Position Size"
                        isPercentage={maxPosSizeIsPercentage}
                        setIsPercentage={setMaxPosSizeIsPercentage}
                        percentageFieldName="_maxPositionSize"
                        description="max_position_size"
                      />
                      <FormDescription>
                        {getBestPracticeMessage("max_position_size")}
                      </FormDescription>
                    </div>

                    <div className="mt-1">
                      <ToggleableField
                        form={form}
                        name="max_loss_per_trade"
                        label="Max Loss Per Trade"
                        isPercentage={maxLossIsPercentage}
                        setIsPercentage={setMaxLossIsPercentage}
                        percentageFieldName="_maxLossIsPercentage"
                        description="max_loss_per_trade"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Level Risk */}
                <div className="grid sm:grid-cols-1 grid-cols-2 gap-8">
                  <ToggleableField
                    form={form}
                    name="daily_loss_limit"
                    label="Daily Loss Limit"
                    isPercentage={dailyLossIsPercentage}
                    setIsPercentage={setDailyLossIsPercentage}
                    percentageFieldName="_dailyLossIsPercentage"
                    description="daily_loss_limit"
                  />

                  <ToggleableField
                    form={form}
                    name="daily_profit_target"
                    label="Daily Profit Target"
                    isPercentage={dailyProfitIsPercentage}
                    setIsPercentage={setDailyProfitIsPercentage}
                    percentageFieldName="_dailyProfitIsPercentage"
                    description="daily_profit_target"
                  />
                </div>
              </div>

              {/* Advanced Settings Switch */}
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
                <span>Show Advanced Settings</span>
              </div>

              {/* Advanced Settings Accordion */}
              {showAdvanced && (
                <Accordion
                  type="single"
                  collapsible
                  className="w-full space-y-4"
                >
                  {/* Trade Execution Risk */}
                  <AccordionItem value="trade-execution">
                    <AccordionTrigger>Trade Execution Risk</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid sm:grid-cols-1 grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="max_trades_per_hour"
                          render={({
                            field: { value, onChange, ...field },
                          }) => (
                            <FormItem>
                              <FormLabel>Max Trades Per Hour</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={value || ""}
                                  onChange={onChange}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Recommended: 3-5 trades per hour
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="mt-2">
                          <FormField
                            control={form.control}
                            name="enforce_stop_loss"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Enforce Stop Loss</FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="ml-2"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Always keep stop loss enabled
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Market Level Risk */}
                  <AccordionItem value="market-level">
                    <AccordionTrigger>Market Level Risk</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid sm:grid-cols-1 grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="max_allowed_volatility"
                          render={({
                            field: { value, onChange, ...field },
                          }) => (
                            <FormItem>
                              <FormLabel>Max Allowed Volatility (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={value || ""}
                                  onChange={onChange}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Recommended: 15-20% for balanced risk
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="mt-2">
                          <FormField
                            control={form.control}
                            name="avoid_high_iv"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Avoid High IV</FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="ml-2"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Avoid trading during high implied volatility
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Behavioral Risk */}
                  <AccordionItem value="behavioral">
                    <AccordionTrigger>
                      Behavioral Risk Controls
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid sm:grid-cols-1 grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="max_consecutive_losses"
                          render={({
                            field: { value, onChange, ...field },
                          }) => (
                            <FormItem>
                              <FormLabel>Max Consecutive Losses</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={value || ""}
                                  onChange={onChange}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Recommended: 3-4 consecutive losses
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cooling_off_minutes_after_losses"
                          render={({
                            field: { value, onChange, ...field },
                          }) => (
                            <FormItem>
                              <FormLabel>
                                Cooling Off Period (minutes)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={value || ""}
                                  onChange={onChange}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Recommended: 30-60 minutes
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Performance Metrics */}
                  <AccordionItem value="performance">
                    <AccordionTrigger>Performance Metrics</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid sm:grid-cols-1 grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="min_risk_to_reward_ratio"
                          render={({
                            field: { value, onChange, ...field },
                          }) => (
                            <FormItem>
                              <FormLabel>Min Risk to Reward Ratio</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={value || ""}
                                  onChange={onChange}
                                  step="0.1"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Recommended: 1:2 or higher
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="min_win_rate_percentage"
                          render={({
                            field: { value, onChange, ...field },
                          }) => (
                            <FormItem>
                              <FormLabel>Min Win Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={value || ""}
                                  onChange={onChange}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Target: 40-50% for consistent profits
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Risk Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskProfile;
