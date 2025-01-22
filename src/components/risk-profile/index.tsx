import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const RiskProfile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const form = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    console.log(data);
    // Handle submission
  };

  return (
    <div className="container mx-auto p-6">
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
                <h3 className="text-lg font-semibold">Essential Risk Parameters</h3>
                
                {/* Position Level Risk */}
                <div className="space-y-4">
                  <h4 className="font-medium">Position Level Risk</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="max_position_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Position Size (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="max_loss_per_trade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Loss Per Trade (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Account Level Risk */}
                <div className="space-y-4">
                  <h4 className="font-medium">Account Level Risk</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="daily_loss_limit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Loss Limit (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="daily_profit_target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Profit Target (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
                <span>Show Advanced Settings</span>
              </div>

              {/* Advanced Settings */}
              {showAdvanced && (
                <Accordion type="single" collapsible className="w-full">
                  {/* Trade Execution Risk */}
                  <AccordionItem value="trade-execution">
                    <AccordionTrigger>Trade Execution Risk</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="max_trades_per_hour"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Trades Per Hour</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="stop_loss_buffer_points"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stop Loss Buffer Points</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="max_allowed_volatility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Allowed Volatility (%)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                                />
                              </FormControl>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="min_risk_to_reward_ratio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min Risk to Reward Ratio</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="min_win_rate_percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min Win Rate (%)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
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