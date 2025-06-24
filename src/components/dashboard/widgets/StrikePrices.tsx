import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import axiosInstance from '@/utils/axiosConfig';

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
      className={`w-full border-b border-gray-200 cursor-pointer transition-all duration-200 ${
        isATM 
          ? 'bg-yellow-100 border-yellow-400' 
          : showOptions 
            ? 'bg-blue-100 border-blue-400' 
            : 'hover:bg-gray-50'
      }`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className="w-full grid grid-cols-3 py-3 px-4">
        {/* PUT (PE) Section - Left Side */}
        <div className="flex items-center justify-center min-w-0">
          {showOptions && peOption ? (
            <div className="flex gap-1">
              <button
                onClick={() => onOptionSelect(peOption, 'BUY')}
                className="w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                B
              </button>
              <button
                onClick={() => onOptionSelect(peOption, 'SELL')}
                className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                S
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-xs text-center">
              {peOption ? 'PE' : '-'}
            </div>
          )}
        </div>
        
        {/* Strike Price (Center) */}
        <div className={`flex items-center justify-center min-w-0 ${
          isATM ? 'text-yellow-800 font-bold text-base' : 'text-gray-900 font-semibold'
        }`}>
          <div className="text-center">
            {strike}
            {isATM && <div className="text-xs text-yellow-600">ATM</div>}
          </div>
        </div>
        
        {/* CALL (CE) Section - Right Side */}
        <div className="flex items-center justify-center min-w-0">
          {showOptions && ceOption ? (
            <div className="flex gap-1">
              <button
                onClick={() => onOptionSelect(ceOption, 'BUY')}
                className="w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                B
              </button>
              <button
                onClick={() => onOptionSelect(ceOption, 'SELL')}
                className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                S
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-xs text-center">
              {ceOption ? 'CE' : '-'}
            </div>
          )}
        </div>
      </div>
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
    const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:3005';
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
    newSocket.on('strikePrices', (data: StrikePrices) => {
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
      const response = await axiosInstance.post('/upstox/subscribe', {
        method: 'sub',
        instrumentKeys: [
          'NSE_INDEX|Nifty 50'
        ],
        mode: 'ltpc'
      });

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

  // Create ordered strike list for display - ATM in center, OTM above, ITM below
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

    const atmStrike = strikePrices.atmStrike;
    const sortedStrikes = Array.from(allStrikes).sort((a, b) => a - b);
    
    // Separate strikes: ATM in center, higher strikes (OTM calls) above, lower strikes (ITM calls) below
    const otmStrikes = sortedStrikes.filter(s => s > atmStrike).sort((a, b) => b - a); // Descending for OTM
    const itmStrikes = sortedStrikes.filter(s => s < atmStrike).sort((a, b) => b - a); // Descending for ITM
    const atmStrikeArray = sortedStrikes.filter(s => s === atmStrike);
    
    // Order: OTM (high to low), ATM, ITM (high to low)
    const orderedStrikes = [...otmStrikes, ...atmStrikeArray, ...itmStrikes];

    return orderedStrikes.map(strike => ({
      strike,
      isATM: strike === atmStrike,
      ceOption: strikeMap.get(strike)?.ce,
      peOption: strikeMap.get(strike)?.pe,
    }));
  }, [strikePrices]);

  const orderedStrikes = getOrderedStrikes();

  return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">NIFTY Strike Prices</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-600">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
        
        {!strikePrices && (
          <button
            onClick={subscribeToStrikePrices}
            disabled={isLoading || !isConnected}
            className="mt-2 w-full py-1.5 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe to Live Prices'}
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
        <div className="max-h-80 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-red-100 via-gray-100 to-green-100 border-b-2 border-gray-300">
            <div className="w-full grid grid-cols-3 py-3 px-4 text-xs font-bold text-gray-800">
              <div className="text-center text-red-700">PUT (PE)</div>
              <div className="text-center text-gray-900">STRIKE PRICE</div>
              <div className="text-center text-green-700">CALL (CE)</div>
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