import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

interface OptionData {
  instrument_key: string;
  instrument_token: string;
  strike_price: number;
  instrument_type: 'CE' | 'PE';
  expiry: string;
  lot_size: number;
  tick_size: number;
}

interface StrikePrices {
  atmStrike: number;
  itmCallStrikes: OptionData[];
  itmPutStrikes: OptionData[];
  otmCallStrikes: OptionData[];
  otmPutStrikes: OptionData[];
  atmStrikes: OptionData[];
}

interface StrikeRowProps {
  strike: number;
  isATM: boolean;
  ceOption?: OptionData;
  peOption?: OptionData;
  onOptionSelect: (option: OptionData, type: 'BUY' | 'SELL') => void;
}

const StrikeRow: React.FC<StrikeRowProps> = ({ 
  strike, 
  isATM, 
  ceOption, 
  peOption, 
  onOptionSelect 
}) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div 
      className={`relative flex items-center justify-center py-3 px-4 border-b border-gray-200 cursor-pointer transition-all duration-200 ${
        isATM 
          ? 'bg-yellow-50 border-yellow-300 font-bold text-lg' 
          : 'hover:bg-gray-50'
      }`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Strike Price */}
      <div className={`text-center ${isATM ? 'text-yellow-800' : 'text-gray-800'}`}>
        {strike}
        {isATM && <span className="ml-2 text-xs text-yellow-600">(ATM)</span>}
      </div>

      {/* Options overlay */}
      {showOptions && (ceOption || peOption) && (
        <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-between bg-white border border-gray-300 shadow-lg z-10">
          {/* PE Option (Left side) */}
          <div className="flex-1 flex justify-center">
            {peOption && (
              <div className="flex gap-2">
                <button
                  onClick={() => onOptionSelect(peOption, 'BUY')}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  BUY PE
                </button>
                <button
                  onClick={() => onOptionSelect(peOption, 'SELL')}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  SELL PE
                </button>
              </div>
            )}
          </div>

          {/* Strike Price in center */}
          <div className={`px-4 font-semibold ${isATM ? 'text-yellow-800' : 'text-gray-800'}`}>
            {strike}
          </div>

          {/* CE Option (Right side) */}
          <div className="flex-1 flex justify-center">
            {ceOption && (
              <div className="flex gap-2">
                <button
                  onClick={() => onOptionSelect(ceOption, 'BUY')}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                >
                  BUY CE
                </button>
                <button
                  onClick={() => onOptionSelect(ceOption, 'SELL')}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  SELL CE
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StrikePricesDisplay: React.FC = () => {
  const [socket, setSocket] = useState<any>(null);
  const [strikePrices, setStrikePrices] = useState<StrikePrices | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:3001';
    const newSocket = io(BASE_URL);
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      setError('Failed to connect to WebSocket');
      setIsConnected(false);
    });

    // Listen for strike prices updates
    newSocket.on('strikePricesUpdate', (data: StrikePrices) => {
      console.log('Received strike prices:', data);
      setStrikePrices(data);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Subscribe to strike prices data
  const subscribeToStrikePrices = useCallback(async () => {
    if (!socket || !isConnected) {
      setError('WebSocket not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3002/upstox/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: 'sub',
          instrumentKeys: [
            'NSE_INDEX|Nifty 50'
          ],
          mode: 'ltpc'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe to strike prices');
      }

      console.log('Successfully subscribed to strike prices');
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to subscribe to strike prices');
    } finally {
      setIsLoading(false);
    }
  }, [socket, isConnected]);

  // Handle option selection
  const handleOptionSelect = useCallback((option: OptionData, action: 'BUY' | 'SELL') => {
    console.log(`${action} option:`, option);
    // TODO: Implement order placement logic
    alert(`${action} ${option.instrument_type} option at strike ${option.strike_price}`);
  }, []);

  // Create ordered strike list for display
  const getOrderedStrikes = useCallback((): Array<{strike: number, isATM: boolean, ceOption?: OptionData, peOption?: OptionData}> => {
    if (!strikePrices) return [];

    const allStrikes = new Set<number>();
    const strikeMap = new Map<number, {ce?: OptionData, pe?: OptionData}>();

    // Collect all strikes and create mapping
    [...strikePrices.itmCallStrikes, ...strikePrices.itmPutStrikes, 
     ...strikePrices.otmCallStrikes, ...strikePrices.otmPutStrikes, 
     ...strikePrices.atmStrikes].forEach(option => {
      allStrikes.add(option.strike_price);
      
      if (!strikeMap.has(option.strike_price)) {
        strikeMap.set(option.strike_price, {});
      }
      
      const entry = strikeMap.get(option.strike_price)!;
      if (option.instrument_type === 'CE') {
        entry.ce = option;
      } else {
        entry.pe = option;
      }
    });

    // Sort strikes in descending order (highest to lowest)
    const sortedStrikes = Array.from(allStrikes).sort((a, b) => b - a);

    return sortedStrikes.map(strike => ({
      strike,
      isATM: strike === strikePrices.atmStrike,
      ceOption: strikeMap.get(strike)?.ce,
      peOption: strikeMap.get(strike)?.pe,
    }));
  }, [strikePrices]);

  const orderedStrikes = getOrderedStrikes();

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Strike Prices</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        {!strikePrices && (
          <button
            onClick={subscribeToStrikePrices}
            disabled={isLoading || !isConnected}
            className="mt-2 w-full py-2 px-4 bg-white text-blue-600 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe to Strike Prices'}
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading strike prices...</p>
        </div>
      )}

      {/* Strike prices list */}
      {strikePrices && orderedStrikes.length > 0 && (
        <div className="max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 border-b">
            <div className="flex justify-between items-center">
              <span>PUT</span>
              <span>STRIKE</span>
              <span>CALL</span>
            </div>
          </div>
          
          {orderedStrikes.map(({ strike, isATM, ceOption, peOption }) => (
            <StrikeRow
              key={strike}
              strike={strike}
              isATM={isATM}
              ceOption={ceOption}
              peOption={peOption}
              onOptionSelect={handleOptionSelect}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !strikePrices && !error && (
        <div className="p-8 text-center text-gray-500">
          <p>No strike prices data available</p>
          <p className="text-sm mt-1">Click subscribe to get live data</p>
        </div>
      )}

      {/* Footer with info */}
      {strikePrices && (
        <div className="bg-gray-50 px-4 py-3 rounded-b-lg border-t">
          <div className="text-xs text-gray-600 text-center">
            ATM Strike: {strikePrices.atmStrike} | 
            Total Options: {orderedStrikes.length * 2}
          </div>
        </div>
      )}
    </div>
  );
};

export default StrikePricesDisplay;