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

const formSchema = z.object({
  name: z.string(),
  max_position_size: z.string(),
  max_loss_per_trade: z.string(),
  daily_loss_limit: z.string(),
  daily_profit_target: z.string(),
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
});

type FormValues = z.infer<typeof formSchema>;

const RiskProfile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // State for percentage toggles
  const [maxLossIsPercentage, setMaxLossIsPercentage] = useState(false);
  const [dailyLossIsPercentage, setDailyLossIsPercentage] = useState(false);
  const [dailyProfitIsPercentage, setDailyProfitIsPercentage] = useState(false);

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

  const onSubmit = async (data: any) => {
    setLoading(true);
    const processedData = {
      ...data,
      max_loss_per_trade: maxLossIsPercentage
        ? (data.max_position_size * data.max_loss_per_trade) / 100
        : data.max_loss_per_trade,
      daily_loss_limit: dailyLossIsPercentage
        ? (data.max_position_size * data.daily_loss_limit) / 100
        : data.daily_loss_limit,
      daily_profit_target: dailyProfitIsPercentage
        ? (data.max_position_size * data.daily_profit_target) / 100
        : data.daily_profit_target,
    };
  };

  interface ToggleableFieldProps {
    name: string;
    label: string;
    isPercentage: boolean;
    setIsPercentage: (value: boolean) => void;
    validation?: object;
    description?: string;
    form: any;
  }

  const ToggleableField = ({
    name,
    label,
    isPercentage,
    setIsPercentage,
    validation = {},
    description = "",
    form,
  }: ToggleableFieldProps) => {
    // Create a memoized onChange handler
    const handleInputChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue(name, event.target.value, { shouldValidate: false });
      },
      [form, name]
    );

    return (
      <FormField
        control={form.control}
        name={name}
        rules={validation}
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
                  value={field.value || ""}
                  onChange={handleInputChange}
                  onBlur={() => {
                    field.onBlur();
                    form.trigger(name);
                  }}
                  name={field.name}
                  ref={field.ref}
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
            {description && (
              <FormDescription>{getBestPracticeMessage(name)}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
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
                  rules={{ required: "Name is required" }}
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

                {/* Position Level Risk */}
                <div className="space-y-4">
                  <h4 className="font-medium">Position Level Risk</h4>
                  <div className="grid sm:grid-cols-1 grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="max_position_size"
                      rules={{ required: "Max position size is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Position Size (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            {getBestPracticeMessage("max_position_size")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="mt-1">
                      <ToggleableField
                        form={form}
                        name="max_loss_per_trade"
                        label="Max Loss Per Trade"
                        isPercentage={maxLossIsPercentage}
                        setIsPercentage={setMaxLossIsPercentage}
                        validation={{
                          required: "Max loss per trade is required",
                          validate: (value: string) => {
                            if (!value) return true;
                            const numValue = parseFloat(value);
                            if (isNaN(numValue))
                              return "Please enter a valid number";

                            const positionSize = parseFloat(
                              form.getValues("max_position_size")
                            );
                            const maxLoss = maxLossIsPercentage
                              ? (positionSize * numValue) / 100
                              : numValue;

                            if (maxLoss > positionSize) {
                              return "Max loss cannot exceed position size";
                            }
                            if (maxLossIsPercentage && numValue > 100) {
                              return "Percentage cannot exceed 100%";
                            }
                            return true;
                          },
                        }}
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
                    validation={{
                      required: "Daily loss limit is required",
                      validate: (value: string) => {
                        if (!value) return true;
                        const numValue = parseFloat(value);
                        if (isNaN(numValue))
                          return "Please enter a valid number";

                        const positionSize = parseFloat(
                          form.getValues("max_position_size")
                        );
                        const maxLossPerTrade = parseFloat(
                          form.getValues("max_loss_per_trade")
                        );

                        const maxLoss = maxLossIsPercentage
                          ? (positionSize * maxLossPerTrade) / 100
                          : maxLossPerTrade;
                        const dailyLoss = dailyLossIsPercentage
                          ? (positionSize * numValue) / 100
                          : numValue;

                        return (
                          dailyLoss >= maxLoss ||
                          "Daily loss limit should be greater than max loss per trade"
                        );
                      },
                    }}
                  />

                  <ToggleableField
                    form={form}
                    name="daily_profit_target"
                    label="Daily Profit Target"
                    isPercentage={dailyProfitIsPercentage}
                    setIsPercentage={setDailyProfitIsPercentage}
                    validation={{
                      required: "Daily profit target is required",
                    }}
                  />
                </div>
              </div>
              {/* Rest of the form remains the same */}
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
                <span>Show Advanced Settings</span>
              </div>

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
                                Recommended: 3-5 trades per hour to avoid
                                overtrading
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
                                  Recommended: Always keep stop loss enabled
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="enforce_take_profit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Enforce Take Profit</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="ml-2"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                        {/* <FormField
                          control={form.control}
                          name="restricted_hours_from"
                          render={({
                            field: { value, onChange, ...field },
                          }) => (
                            <FormItem>
                              <FormLabel>Restricted Hours From</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  value={value || ""}
                                  onChange={onChange}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="restricted_hours_to"
                          render={({
                            field: { value, onChange, ...field },
                          }) => (
                            <FormItem>
                              <FormLabel>Restricted Hours To</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  value={value || ""}
                                  onChange={onChange}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        /> */}
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
