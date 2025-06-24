import React, { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Switch } from '@/components/ui/switch';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import StrikePricesDisplay from './StrikePrices';
import RiskProfileDisplay from './RiskProfileDisplay';

interface Trade {
  price: number;
  time: string;
  type: 'buy' | 'sell';
}

export default function TradingLayout() {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);

  return (
    <div className="h-screen w-full bg-background">
      {/* Risk Profile Display */}
      <RiskProfileDisplay />
      
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <span>Mood</span>
          <Switch />
          <span>Playful</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Advance</span>
          <Switch checked={isAdvanced} onCheckedChange={setIsAdvanced} />
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-128px)]">
        <ResizablePanel defaultSize={50} className="p-4">
          <h2 className="text-xl font-bold mb-4">Trade here</h2>
          <div className="space-y-4">
            <StrikePricesDisplay/>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} className="p-4">
          {isAdvanced ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Settings</h3>
              <Input placeholder="Additional parameters..." />
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold italic">What are you thinking?</h3>
              <Textarea placeholder="I took this trade because..." className="h-40" />
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <Drawer>
        <DrawerTrigger className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Show Trades
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Executed Trades</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Price</th>
                  <th className="text-left">Time</th>
                  <th className="text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, index) => (
                  <tr key={index}>
                    <td>{trade.price}</td>
                    <td>{trade.time}</td>
                    <td>{trade.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}