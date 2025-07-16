import React, { useState, useEffect, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import axiosInstance from '@/utils/axiosConfig';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OptionData {
  instrument_key: string;
  instrument_token: string;
  strike_price: number;
  instrument_type: 'CE' | 'PE';
  expiry: string;
  lot_size: number;
  tick_size: number;
  // Market data fields
  ltp?: number; // Last Traded Price
  atp?: number; // Average Traded Price
  volume?: number; // Volume
  vtt?: string; // Volume string format
  oi?: number; // Open Interest
  iv?: number; // Implied Volatility
  bid_price?: number;
  ask_price?: number;
}

interface StrikePrices {
  atmStrike: number;
  itmCallStrikes: OptionData[];
  itmPutStrikes: OptionData[];
  otmCallStrikes: OptionData[];
  otmPutStrikes: OptionData[];
  atmStrikes: OptionData[];
  expiryDate?: string;
}

interface ExpiryOption {
  date: string;
  displayName: string;
  daysToExpiry: number;
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
      <div className="w-full grid grid-cols-7 gap-1 py-3 px-2 text-sm">
        {/* PUT (PE) Section - Left Side */}
        <div className="text-center min-w-0">
          {showOptions && peOption ? (
            <div className="flex gap-0.5 justify-center">
              <button
                onClick={() => onOptionSelect(peOption, 'BUY')}
                className="w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                B
              </button>
              <button
                onClick={() => onOptionSelect(peOption, 'SELL')}
                className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                S
              </button>
            </div>
          ) : (
            <div className="text-gray-700 text-sm font-medium">
              OI: {peOption?.oi ? (peOption.oi / 1000).toFixed(0) + 'K' : '-'}
            </div>
          )}
        </div>

        {/* PUT Price & Data */}
        <div className="text-center min-w-0">
          {peOption ? (
            <div className="space-y-1">
              <div className="font-bold text-red-700 text-base">
                {peOption.ltp ? peOption.ltp.toFixed(1) : 
                 peOption.atp ? peOption.atp.toFixed(1) : 
                 peOption.bid_price ? peOption.bid_price.toFixed(1) : '-'}
              </div>
              <div className="text-gray-600 text-sm font-medium">
                IV: {peOption.iv ? (peOption.iv * 100).toFixed(1) + '%' : '-'}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">-</div>
          )}
        </div>

        {/* PUT Volume */}
        <div className="text-center min-w-0">
          {peOption ? (
            <div className="text-gray-700 text-sm font-medium">
              Vol: {peOption.volume ? (peOption.volume / 1000).toFixed(0) + 'K' : 
                    peOption.vtt && !isNaN(Number(peOption.vtt)) ? (Number(peOption.vtt) / 1000).toFixed(0) + 'K' : '-'}
            </div>
          ) : (
            <div className="text-gray-500">-</div>
          )}
        </div>
        
        {/* Strike Price (Center) */}
        <div className={`flex items-center justify-center min-w-0 ${
          isATM ? 'text-yellow-900 font-extrabold text-lg' : 'text-gray-900 font-bold text-base'
        }`}>
          <div className="text-center">
            {strike}
            {isATM && <div className="text-sm text-yellow-700 font-bold">ATM</div>}
          </div>
        </div>

        {/* CALL Volume */}
        <div className="text-center min-w-0">
          {ceOption ? (
            <div className="text-gray-700 text-sm font-medium">
              Vol: {ceOption.volume ? (ceOption.volume / 1000).toFixed(0) + 'K' : 
                    ceOption.vtt && !isNaN(Number(ceOption.vtt)) ? (Number(ceOption.vtt) / 1000).toFixed(0) + 'K' : '-'}
            </div>
          ) : (
            <div className="text-gray-500">-</div>
          )}
        </div>

        {/* CALL Price & Data */}
        <div className="text-center min-w-0">
          {ceOption ? (
            <div className="space-y-1">
              <div className="font-bold text-green-700 text-base">
                {ceOption.ltp ? ceOption.ltp.toFixed(1) : 
                 ceOption.atp ? ceOption.atp.toFixed(1) : 
                 ceOption.ask_price ? ceOption.ask_price.toFixed(1) : '-'}
              </div>
              <div className="text-gray-600 text-sm font-medium">
                IV: {ceOption.iv ? (ceOption.iv * 100).toFixed(1) + '%' : '-'}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">-</div>
          )}
        </div>
        
        {/* CALL (CE) Section - Right Side */}
        <div className="text-center min-w-0">
          {showOptions && ceOption ? (
            <div className="flex gap-0.5 justify-center">
              <button
                onClick={() => onOptionSelect(ceOption, 'BUY')}
                className="w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                B
              </button>
              <button
                onClick={() => onOptionSelect(ceOption, 'SELL')}
                className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                S
              </button>
            </div>
          ) : (
            <div className="text-gray-700 text-sm font-medium">
              OI: {ceOption?.oi ? (ceOption.oi / 1000).toFixed(0) + 'K' : '-'}
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
  const [showReauthButton, setShowReauthButton] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false); // Prevent multiple subscriptions
  
  // Expiry date management
  const [availableExpiries, setAvailableExpiries] = useState<ExpiryOption[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  
  // Nifty price state for real-time updates
  const [niftyPrice, setNiftyPrice] = useState<{
    ltp: number;
    change: number;
    changePercent: number;
    lastUpdated: number;
  } | null>(null);

  // Market timing state
  const [marketStatus, setMarketStatus] = useState<{
    isOpen: boolean;
    timeToClose?: number;
    timeToOpen?: number;
    status: 'open' | 'closed' | 'pre_open' | 'closing_soon';
  }>({
    isOpen: false,
    status: 'closed'
  });

  // Helper function to calculate ATM strike from Nifty price
  const calculateATM = useCallback((niftyLtp: number): number => {
    const stepSize = 50; // NIFTY step size
    return Math.round(niftyLtp / stepSize) * stepSize;
  }, []);

  // Centralized authentication error handler
  const handleAuthError = useCallback((error: any, context: string = 'API call'): boolean => {
    const errorData = error.response?.data;
    const status = error.response?.status;
    
    console.log(`🔍 [AUTH_ERROR_HANDLER] Checking error from ${context}:`, {
      status,
      errorData,
      hasRequireReauth: !!errorData?.requireReauth,
      errorType: errorData?.errorType,
    });
    
    // Check for authentication errors
    if (status === 403 || status === 401 || 
        errorData?.requireReauth || 
        errorData?.errorType === 'UPSTOX_TOKEN_EXPIRED' ||
        errorData?.errorType === 'NO_UPSTOX_TOKEN' ||
        errorData?.errorType === 'INVALID_TOKEN' ||
        error.message?.includes('403') ||
        error.message?.includes('401') ||
        error.message?.includes('Unexpected server response: 403')) {
      
      console.log(`🚨 [AUTH_ERROR_HANDLER] Authentication error detected from ${context}`);
      setError('Upstox authentication expired. Please reconnect your account to continue.');
      setShowReauthButton(true);
      return true; // Handled as auth error
    }
    
    return false; // Not an auth error
  }, []);

  // Cached expiry dates using React Query (fetch once per session)
  const { 
    data: expiryDatesData, 
    isLoading: isLoadingExpiryDates, 
    error: expiryError 
  } = useQuery({
    queryKey: ['expiry-dates'],
    queryFn: async (): Promise<ExpiryOption[]> => {
      console.log('🔍 Fetching expiry dates (cached query)...');
      const response = await axiosInstance.get('/upstox/expiry-dates');
      
      const expiries = response.data.expiries || response.data || [];
      
      if (!Array.isArray(expiries) || expiries.length === 0) {
        throw new Error('No expiry dates available');
      }
      
      // Process expiry dates to calculate days to expiry and format display names
      const processedExpiries: ExpiryOption[] = expiries.map((expiry: string) => {
        const expiryDate = new Date(expiry);
        const today = new Date();
        const timeDiff = expiryDate.getTime() - today.getTime();
        const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Format display name
        const displayName = `${expiryDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })} (${daysToExpiry}d)`;
        
        return {
          date: expiry,
          displayName,
          daysToExpiry
        };
      }).sort((a: ExpiryOption, b: ExpiryOption) => a.daysToExpiry - b.daysToExpiry);
      
      console.log('✅ Expiry dates fetched and cached:', processedExpiries);
      return processedExpiries;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - expiry dates don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update availableExpiries state when query data changes
  useEffect(() => {
    if (expiryDatesData) {
      setAvailableExpiries(expiryDatesData);
      
      // Auto-select the nearest expiry if none selected
      if (expiryDatesData.length > 0 && !selectedExpiry) {
        const nearestExpiry = expiryDatesData.find(exp => exp.daysToExpiry >= 0) || expiryDatesData[0];
        console.log('🔍 Auto-selecting nearest expiry:', nearestExpiry);
        setSelectedExpiry(nearestExpiry.date);
      }
    }
    
    if (expiryError) {
      console.error('❌ Failed to fetch expiry dates:', expiryError);
      if (handleAuthError(expiryError, 'fetchExpiryDates')) {
        return; // Auth error handled
      }
      setError(`Failed to fetch expiry dates: ${(expiryError as any)?.response?.data?.message || (expiryError as any)?.message}`);
    }
  }, [expiryDatesData, expiryError, selectedExpiry, handleAuthError]);

  // Handle expiry selection change
  const handleExpiryChange = useCallback(async (newExpiry: string) => {
    console.log('🔄 Expiry changed to:', newExpiry);
    setSelectedExpiry(newExpiry);
    
    // Clear existing strike prices to force refresh
    setStrikePrices(null);
    setError(null);
    setShowReauthButton(false);
    
    // Explicitly trigger subscription for new expiry if WebSocket is connected
    if (socket && isConnected) {
      console.log('🔄 Triggering immediate subscription for new expiry:', newExpiry);
      // Small delay to allow state updates to complete
      setTimeout(() => {
        subscribeToStrikePrices(newExpiry);
      }, 200);
    }
  }, [socket, isConnected]);

  // Market timing functions
  const getMarketTiming = useCallback(() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes from midnight
    
    // Indian market hours: 9:15 AM to 3:30 PM IST (Monday to Friday)
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    const closingWarning = marketClose - 15; // 15 minutes before close (3:15 PM)
    
    // Check if it's a weekday (Monday = 1, Friday = 5)
    const dayOfWeek = now.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    if (!isWeekday) {
      // Weekend - market closed
      const minutesToMonday = (8 - dayOfWeek) * 24 * 60 + (marketOpen - currentTime);
      return {
        isOpen: false,
        timeToOpen: minutesToMonday > 0 ? minutesToMonday : undefined,
        status: 'closed' as const
      };
    }
    
    if (currentTime < marketOpen) {
      // Before market opens
      return {
        isOpen: false,
        timeToOpen: marketOpen - currentTime,
        status: 'pre_open' as const
      };
    } else if (currentTime >= marketOpen && currentTime < closingWarning) {
      // Market open, more than 15 minutes to close
      return {
        isOpen: true,
        timeToClose: marketClose - currentTime,
        status: 'open' as const
      };
    } else if (currentTime >= closingWarning && currentTime < marketClose) {
      // Market open, less than 15 minutes to close
      return {
        isOpen: true,
        timeToClose: marketClose - currentTime,
        status: 'closing_soon' as const
      };
    } else {
      // After market closes
      const nextDayOpen = 24 * 60 + marketOpen;
      return {
        isOpen: false,
        timeToOpen: nextDayOpen - currentTime,
        status: 'closed' as const
      };
    }
  }, []);

  const formatTimeRemaining = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  }, []);

  // Helper function to update ATM classification when Nifty price changes
  const updateStrikePricesWithNewATM = useCallback((newATM: number) => {
    if (!strikePrices || newATM === strikePrices.atmStrike) return;
    
    setStrikePrices(prevPrices => {
      if (!prevPrices) return prevPrices;
      
      // Get all strikes in a flat array
      const allStrikes = [
        ...prevPrices.itmCallStrikes,
        ...prevPrices.itmPutStrikes,
        ...prevPrices.otmCallStrikes,
        ...prevPrices.otmPutStrikes,
        ...prevPrices.atmStrikes
      ];
      
      // Reclassify strikes based on new ATM
      const newITMCalls: OptionData[] = [];
      const newITMPuts: OptionData[] = [];
      const newOTMCalls: OptionData[] = [];
      const newOTMPuts: OptionData[] = [];
      const newATMStrikes: OptionData[] = [];
      
      allStrikes.forEach(strike => {
        if (strike.strike_price === newATM) {
          newATMStrikes.push(strike);
        } else if (strike.strike_price < newATM) {
          if (strike.instrument_type === 'CE') {
            newITMCalls.push(strike);
          } else {
            newOTMPuts.push(strike);
          }
        } else {
          if (strike.instrument_type === 'CE') {
            newOTMCalls.push(strike);
          } else {
            newITMPuts.push(strike);
          }
        }
      });
      
      return {
        ...prevPrices,
        atmStrike: newATM,
        itmCallStrikes: newITMCalls,
        itmPutStrikes: newITMPuts,
        otmCallStrikes: newOTMCalls,
        otmPutStrikes: newOTMPuts,
        atmStrikes: newATMStrikes
      };
    });
  }, [strikePrices]);

  // Monitor market status
  useEffect(() => {
    const updateMarketStatus = () => {
      const timing = getMarketTiming();
      setMarketStatus(timing);
    };

    // Update immediately
    updateMarketStatus();

    // Update every minute
    const interval = setInterval(updateMarketStatus, 60000);

    return () => clearInterval(interval);
  }, [getMarketTiming]);

  // Initialize WebSocket connection
  useEffect(() => {
    const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:3005';
    
    // Get Firebase token for WebSocket authentication
    const firebaseToken = localStorage.getItem('firebaseToken');
    
    const newSocket = io(BASE_URL, {
      auth: {
        token: firebaseToken
      },
      extraHeaders: {
        Authorization: firebaseToken ? `Bearer ${firebaseToken}` : ''
      }
    });
    
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

    // Listen for instruction to use HTTP endpoint
    newSocket.on('useHttpEndpoint', async (data: any) => {
      console.log('📡 Server instructed to use HTTP endpoint:', data);
      
      // Make HTTP call to subscribe
      try {
        const response = await axiosInstance.post(data.endpoint, data.payload);
        console.log('✅ HTTP subscription successful:', response.data);
        // Don't set loading to false here - wait for actual strike prices
        
        // Reset subscribing flag to allow future subscriptions
        setTimeout(() => {
          setIsSubscribing(false);
        }, 1000);
      } catch (error: any) {
        console.error('❌ HTTP subscription failed:', error);
        console.log('🔍 Error response:', error?.response);
        console.log('🔍 Error data:', error?.response?.data);
        
        // Check if this is an Upstox token expiration error
        const errorData = error?.response?.data;
        const errorMessage = errorData?.error || error?.message || '';
        const status = error?.response?.status;
        const requireReauth = errorData?.requireReauth;
        const errorType = errorData?.type;
        
        console.log('🔍 Error analysis:', {
          status,
          errorMessage,
          requireReauth,
          errorType,
          hasNoInstruments: errorMessage.includes('No instruments were loaded successfully'),
          hasUDAPI: errorMessage.includes('UDAPI100050'),
          hasAuth: errorMessage.includes('Upstox authentication')
        });
        
        if (requireReauth || 
            errorType === 'UPSTOX_AUTH_ERROR' ||
            status === 401 ||
            errorMessage.includes('No instruments were loaded successfully') ||
            errorMessage.includes('Upstox authentication') ||
            errorMessage.includes('UDAPI100050') ||
            errorMessage.includes('Invalid token used to access API') ||
            errorMessage.includes('UNAUTHORIZED') ||
            errorMessage.includes('No Upstox access token') ||
            errorMessage.includes('Service initialization failed: Unauthorized')) {
          
          console.log('🚨 Upstox token expired detected, showing reauth button');
          setError('Your Upstox session has expired. Please reconnect your account to continue.');
          setShowReauthButton(true);
        } else {
          setError(`Failed to subscribe: ${errorMessage}`);
        }
        
        setIsLoading(false);
        setIsSubscribing(false);
      }
    });

    // Listen for subscription confirmation
    newSocket.on('subscriptionConfirmed', (data: any) => {
      console.log('✅ Subscription confirmed:', data);
      // Don't set loading to false here - wait for actual data
    });

    // Listen for WebSocket errors
    newSocket.on('error', (errorData: any) => {
      console.error('❌ WebSocket error:', errorData);
      setError(errorData.message || 'WebSocket error occurred');
      setIsLoading(false);
    });

    // Listen for strike prices updates
    newSocket.on('strikePrices', (data: StrikePrices) => {
      console.log('📡 Received strike prices data:', data);
      console.log('📊 Strike prices breakdown:', {
        atmStrike: data.atmStrike,
        itmCallsCount: data.itmCallStrikes?.length || 0,
        itmPutsCount: data.itmPutStrikes?.length || 0,
        otmCallsCount: data.otmCallStrikes?.length || 0,
        otmPutsCount: data.otmPutStrikes?.length || 0,
        atmStrikesCount: data.atmStrikes?.length || 0
      });
      setStrikePrices(data);
      setIsLoading(false); // Stop loading when we receive data
    });

    // Listen for real-time market data updates
    newSocket.on('marketData', (data: any) => {
      console.log('📡 Received market data:', data);
      // Market data updates will trigger strike price updates from backend
    });

    // Listen for individual symbol updates
    newSocket.on('symbolUpdate', (symbolData: any) => {
      // Handle Index data (Nifty 50) for ATM calculation
      if (symbolData.type === 'index' && symbolData.instrumentKey === 'NSE_INDEX|Nifty 50') {
        // Update Nifty price state
        setNiftyPrice({
          ltp: symbolData.ltp || 0,
          change: symbolData.change || 0,
          changePercent: symbolData.changePercent || 0,
          lastUpdated: Date.now()
        });
        
        // Calculate new ATM and update strike classification if needed
        if (symbolData.ltp && strikePrices) {
          const newATM = calculateATM(symbolData.ltp);
          updateStrikePricesWithNewATM(newATM);
        }
      }
      // Handle Option data for individual strike updates
      else if (strikePrices && symbolData.type === 'option') {
        setStrikePrices(prevPrices => {
          if (!prevPrices) return prevPrices;
          
          // Update the matching strike with new data
          const updateStrike = (strike: OptionData) => {
            if (strike.instrument_key === symbolData.instrumentKey) {
              return {
                ...strike,
                ltp: symbolData.ltp,
                oi: symbolData.oi,
                iv: symbolData.iv,
                atp: symbolData.atp,
                vtt: symbolData.vtt,
                bid_price: symbolData.bid,
                ask_price: symbolData.ask
              };
            }
            return strike;
          };
          
          return {
            ...prevPrices,
            itmCallStrikes: prevPrices.itmCallStrikes.map(updateStrike),
            itmPutStrikes: prevPrices.itmPutStrikes.map(updateStrike),
            otmCallStrikes: prevPrices.otmCallStrikes.map(updateStrike),
            otmPutStrikes: prevPrices.otmPutStrikes.map(updateStrike),
            atmStrikes: prevPrices.atmStrikes.map(updateStrike)
          };
        });
      }
    });

    return () => {
      newSocket.close();
    };
  }, []); // Keep empty deps - we don't want to recreate WebSocket connection

  // Subscribe to strike prices data (WebSocket only - no HTTP call)
  const subscribeToStrikePrices = useCallback((expiry?: string) => {
    console.log('🔍 Starting WebSocket-only strike prices subscription...');
    console.log('🔍 Socket connected:', !!socket);
    console.log('🔍 WebSocket connected:', isConnected);
    console.log('🔍 Already subscribing:', isSubscribing);
    
    if (!socket || !isConnected) {
      console.log('❌ WebSocket not connected, cannot subscribe');
      setError('WebSocket not connected');
      return;
    }

    // Prevent multiple simultaneous subscriptions
    if (isSubscribing) {
      console.log('⏳ Already subscribing, skipping duplicate request');
      return;
    }

    const expiryToUse = expiry || selectedExpiry;
    console.log('🔍 Using expiry:', expiryToUse);
    
    if (!expiryToUse) {
      console.log('❌ No expiry date selected');
      setError('No expiry date selected');
      return;
    }

    setIsSubscribing(true);
    setIsLoading(true);
    setError(null);
    setShowReauthButton(false);

    try {
      const subscriptionPayload = {
        method: 'sub',
        instrumentKeys: [
          'NSE_INDEX|Nifty 50'
        ],
        mode: 'ltpc',
        expiry: expiryToUse
      };
      
      console.log('🔍 Subscription payload:', subscriptionPayload);
      console.log('📡 Sending WebSocket subscription (no HTTP call)');
      
      // Send subscription directly via WebSocket - no HTTP call needed
      socket.emit('subscribe', subscriptionPayload);

      console.log('✅ WebSocket subscription sent successfully');
      
      // Clear any previous errors on success
      setError(null);
      setShowReauthButton(false);
      
      // Reset subscribing flag after a delay
      setTimeout(() => {
        setIsSubscribing(false);
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ WebSocket subscription error:', err);
      setError('Failed to subscribe via WebSocket');
      setIsLoading(false);
      setIsSubscribing(false);
    }
  }, [socket, isConnected, selectedExpiry, isSubscribing]);

  // Manage WebSocket based on market status - removed restriction for expiry data
  useEffect(() => {
    if (!socket) return;

    // Always keep WebSocket connected for expiry data - even when market is closed
    if (!socket.connected) {
      console.log('Ensuring WebSocket is connected for expiry data');
      socket.connect();
    }
  }, [socket]);

  // Expiry dates are now loaded automatically via React Query - no manual fetch needed

  // Auto-subscribe when connected and expiry is selected (removed market open restriction)
  useEffect(() => {
    if (isConnected && socket && !strikePrices && !isLoading && !error && selectedExpiry && !isSubscribing) {
      console.log('🔄 Auto-subscription triggered for expiry:', selectedExpiry);
      const timer = setTimeout(() => {
        subscribeToStrikePrices();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, socket, strikePrices, isLoading, error, selectedExpiry, isSubscribing]);

  // Additional effect to handle expiry changes more explicitly
  useEffect(() => {
    if (isConnected && socket && selectedExpiry && !isLoading && !isSubscribing) {
      console.log('🔄 Expiry changed, checking if subscription needed for:', selectedExpiry);
      
      // If we have strike prices but they're for a different expiry, resubscribe
      if (strikePrices && strikePrices.expiryDate !== selectedExpiry) {
        console.log('🔄 Strike prices exist but for different expiry, resubscribing...');
        setStrikePrices(null); // Clear old data
        const timer = setTimeout(() => {
          subscribeToStrikePrices();
        }, 500);
        return () => clearTimeout(timer);
      }
      
      // If no strike prices at all, subscribe
      if (!strikePrices && !error) {
        console.log('🔄 No strike prices, subscribing for expiry:', selectedExpiry , "strik ", strikePrices );
        const timer = setTimeout(() => {
          subscribeToStrikePrices();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedExpiry, isConnected, socket, strikePrices, isLoading, error, isSubscribing]);

  // Listen for account changes and reconnect WebSocket if needed
  useEffect(() => {
    const handleAccountChange = (event: CustomEvent) => {
      console.log('🔄 StrikePrices: Account change detected', event.detail);
      
      if (event.detail.accountType === 'live' && socket && isConnected) {
        console.log('🔄 StrikePrices: Switching to live account - reconnecting WebSocket');
        
        // Clear existing data to force fresh subscription
        setStrikePrices(null);
        setError(null);
        
        // Reconnect after a short delay to allow account switch to complete
        setTimeout(() => {
          subscribeToStrikePrices();
        }, 2000);
      }
    };

    // Listen for custom account change events
    window.addEventListener('accountChange', handleAccountChange as EventListener);
    
    return () => {
      window.removeEventListener('accountChange', handleAccountChange as EventListener);
    };
  }, [socket, isConnected]);

  // Handle Upstox reconnection
  const handleReconnectUpstox = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      // Make POST request to get the auth URL with forceReauth flag
      const response = await axiosInstance.post('/auth/upstox', {
        forceReauth: true
      });
      
      if (response.data.url) {
        // Open the Upstox authorization URL in a popup window
        const popup = window.open(
          response.data.url, 
          'upstox-auth', 
          'width=600,height=700,scrollbars=yes,resizable=yes,top=100,left=100'
        );

        // Listen for messages from the popup
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'UPSTOX_AUTH_RESULT') {
            console.log('Received auth result:', event.data);
            
            if (event.data.success) {
              console.log('✅ Upstox authentication successful');
              setError(null);
              setShowReauthButton(false);
              
              // First refresh the cached token on the backend
              setError('Authentication successful, refreshing connection...');
              
              axiosInstance.post('/upstox/refresh-token')
                .then(() => {
                  console.log('✅ Backend token refreshed successfully');
                  setError('Connection refreshed, loading strike prices...');
                  setIsAuthenticating(false);
                  
                  // Now retry the subscription with fresh token
                  setTimeout(() => {
                    subscribeToStrikePrices();
                  }, 1000);
                })
                .catch((refreshError) => {
                  console.error('❌ Failed to refresh backend token:', refreshError);
                  
                  // Check if refresh token call has auth error
                  if (!handleAuthError(refreshError, 'refreshToken')) {
                    setError('Authentication successful but failed to refresh connection. Please try changing expiry again.');
                  }
                  setIsAuthenticating(false);
                });
            } else {
              console.error('❌ Upstox authentication failed:', event.data.message);
              setError(`Authentication failed: ${event.data.message}`);
              setIsAuthenticating(false);
            }
            
            // Clean up event listener
            window.removeEventListener('message', handleMessage);
            
            // Close popup if still open
            if (popup && !popup.closed) {
              popup.close();
            }
          }
        };

        // Add event listener for popup messages
        window.addEventListener('message', handleMessage);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup && popup.closed) {
            console.log('Popup was closed manually');
            setIsAuthenticating(false);
            window.removeEventListener('message', handleMessage);
            clearInterval(checkClosed);
          }
        }, 1000);

        // Clean up after 5 minutes
        setTimeout(() => {
          setIsAuthenticating(false);
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
          if (popup && !popup.closed) {
            popup.close();
          }
        }, 300000);

      } else {
        console.error('No authorization URL received');
        setError('Failed to get authorization URL');
        setIsAuthenticating(false);
      }
    } catch (err: any) {
      console.error('Failed to initiate Upstox reconnection:', err);
      setIsAuthenticating(false);
      
      // Check if the error suggests using forceReauth
      if (err.response?.data?.suggestion) {
        console.log('Suggestion:', err.response.data.suggestion);
      }
      
      setError(err.response?.data?.message || 'Failed to reconnect to Upstox. Please try again.');
    }
  }, [subscribeToStrikePrices, handleAuthError]);

  // Handle option selection
  const handleOptionSelect = useCallback((option: OptionData, action: 'BUY' | 'SELL') => {
    console.log(`${action} option:`, option);
    // TODO: Implement order placement logic
    alert(`${action} ${option.instrument_type} option at strike ${option.strike_price}`);
  }, []);

  // Memoized ordered strike list for display - ATM in center, OTM above, ITM below
  const orderedStrikes = useMemo((): Array<{strike: number, isATM: boolean, ceOption?: OptionData, peOption?: OptionData}> => {
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
  }, [strikePrices]); // Only recalculate when strikePrices changes

  return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 rounded-t-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-gray-900">NIFTY Strike Prices</h2>
            
            {/* Expiry Date Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Expiry:</span>
              <Select
                value={selectedExpiry}
                onValueChange={handleExpiryChange}
                disabled={isLoadingExpiryDates}
              >
                <SelectTrigger className="w-44 h-8 text-sm">
                  <SelectValue placeholder={isLoadingExpiryDates ? "Loading..." : "Select expiry"} />
                </SelectTrigger>
                <SelectContent>
                  {availableExpiries.map((expiry) => (
                    <SelectItem 
                      key={expiry.date} 
                      value={expiry.date}
                      className={`text-sm ${
                        expiry.daysToExpiry < 0 ? 'text-gray-400' : 
                        expiry.daysToExpiry <= 7 ? 'text-red-600 font-medium' :
                        'text-gray-900'
                      }`}
                    >
                      {expiry.displayName}
                      {expiry.daysToExpiry < 0 && ' (Expired)'}
                      {expiry.daysToExpiry === 0 && ' (Today)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {niftyPrice && (
              <div className="flex items-center gap-3 text-base">
                <span className="text-gray-700 font-medium">NIFTY:</span>
                <span className="font-bold text-gray-900 text-lg">{niftyPrice.ltp.toFixed(2)}</span>
                <span className={`text-sm px-2 py-1 rounded font-semibold ${
                  niftyPrice.change >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {niftyPrice.change >= 0 ? '+' : ''}{niftyPrice.change.toFixed(2)} 
                  ({niftyPrice.changePercent >= 0 ? '+' : ''}{niftyPrice.changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Market Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                marketStatus.status === 'open' ? 'bg-green-500' : 
                marketStatus.status === 'closing_soon' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></div>
              <div className="text-sm">
                {marketStatus.status === 'open' && (
                  <span className="text-green-700 font-medium">Market Open</span>
                )}
                {marketStatus.status === 'closing_soon' && (
                  <span className="text-yellow-700 font-medium animate-pulse">
                    ⚠️ Closing in {formatTimeRemaining(marketStatus.timeToClose || 0)}
                  </span>
                )}
                {marketStatus.status === 'closed' && (
                  <span className="text-red-700 font-medium">Market Closed</span>
                )}
                {marketStatus.status === 'pre_open' && (
                  <span className="text-blue-700 font-medium">
                    Opens in {formatTimeRemaining(marketStatus.timeToOpen || 0)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        
        {!strikePrices && error && selectedExpiry && (
          <button
            onClick={() => subscribeToStrikePrices()}
            disabled={isLoading || !isConnected}
            className="mt-2 w-full py-1.5 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load Strike Prices'}
          </button>
        )}
        
        {!marketStatus.isOpen && (
          <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-center text-blue-800">
              {marketStatus.status === 'closed' && (
                <div>
                  <div className="font-medium">Market is closed</div>
                  {marketStatus.timeToOpen && (
                    <div className="text-sm mt-1">
                      Next session opens in {formatTimeRemaining(marketStatus.timeToOpen)}
                    </div>
                  )}
                </div>
              )}
              {marketStatus.status === 'pre_open' && (
                <div>
                  <div className="font-medium">Market opening soon</div>
                  <div className="text-sm mt-1">
                    Opens in {formatTimeRemaining(marketStatus.timeToOpen || 0)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="text-red-700 text-sm">{error}</div>
          {showReauthButton && (
            <button
              onClick={handleReconnectUpstox}
              disabled={isAuthenticating}
              className="mt-3 w-full py-2 px-4 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAuthenticating ? 'Authenticating...' : 'Reconnect Upstox Account'}
            </button>
          )}
        </div>
      )}

      {/* Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 border border-gray-300 p-3 m-4 rounded text-xs">
          <div className="font-bold text-gray-700 mb-2">🔧 Debug Info:</div>
          <div className="grid grid-cols-2 gap-4 text-gray-600">
            <div>
              <div>WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
              <div>Loading: {isLoading ? '⏳ Yes' : '✅ No'}</div>
              <div>Subscribing: {isSubscribing ? '⏳ Yes' : '✅ No'}</div>
              <div>Selected Expiry: {selectedExpiry || 'None'}</div>
            </div>
            <div>
              <div>Error: {error ? '❌ Yes' : '✅ No'}</div>
              <div>Show Reauth: {showReauthButton ? '🔄 Yes' : 'No'}</div>
              <div>Strike Prices: {strikePrices ? '✅ Yes' : '❌ No'}</div>
              <div>Market Status: {marketStatus.status}</div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log('🧪 Testing mock data endpoint...');
                  fetch('http://localhost:3005/upstox/debug/mock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                  })
                  .then(res => res.json())
                  .then(data => console.log('✅ Mock test response:', data))
                  .catch(err => console.error('❌ Mock test failed:', err));
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Test Mock Data
              </button>
              <button
                onClick={() => {
                  const firebaseToken = localStorage.getItem('firebaseToken');
                  console.log('🔍 Firebase Token Check:', {
                    hasToken: !!firebaseToken,
                    tokenPreview: firebaseToken ? firebaseToken.substring(0, 50) + '...' : 'None',
                    tokenLength: firebaseToken?.length || 0
                  });
                  
                  // Test auth endpoint
                  fetch('http://localhost:3005/auth/token-status', {
                    headers: {
                      'Authorization': firebaseToken ? `Bearer ${firebaseToken}` : ''
                    }
                  })
                  .then(res => res.json())
                  .then(data => console.log('🔍 Auth status:', data))
                  .catch(err => console.error('❌ Auth check failed:', err));
                }}
                className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
              >
                Check Auth
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skeleton Loading state */}
      {(isLoading || isLoadingExpiryDates) && (
        <div className="space-y-2 p-4">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="sticky top-0 bg-gradient-to-r from-red-200 via-gray-200 to-green-200 border-b">
              <div className="w-full grid grid-cols-7 gap-1 py-3 px-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
            
            {/* Strike rows skeleton */}
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div key={rowIndex} className="w-full border-b border-gray-200">
                <div className="w-full grid grid-cols-7 gap-1 py-3 px-2">
                  {Array.from({ length: 7 }).map((_, colIndex) => (
                    <div key={colIndex} className="text-center">
                      {colIndex === 3 ? (
                        // Strike price column - larger skeleton
                        <div className="h-6 bg-gray-300 rounded mx-auto w-16"></div>
                      ) : (
                        // Other columns - smaller skeletons
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-100 rounded"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">
              {isLoadingExpiryDates ? 'Loading expiry dates...' : 'Loading strike prices...'}
            </p>
          </div>
        </div>
      )}

      {/* Strike prices list */}
      {strikePrices && orderedStrikes.length > 0 && (
        <div className="max-h-80 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-red-200 via-gray-200 to-green-200 border-b-3 border-gray-400 shadow-sm">
            <div className="w-full grid grid-cols-7 gap-1 py-3 px-2 text-sm font-bold">
              <div className="text-center text-red-900 font-extrabold">PUT OI</div>
              <div className="text-center text-red-800 font-extrabold">PE Price/IV</div>
              <div className="text-center text-red-700 font-extrabold">PE Vol</div>
              <div className="text-center text-gray-900 font-black text-base">STRIKE</div>
              <div className="text-center text-green-700 font-extrabold">CE Vol</div>
              <div className="text-center text-green-800 font-extrabold">CE Price/IV</div>
              <div className="text-center text-green-900 font-extrabold">CALL OI</div>
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
          {selectedExpiry ? (
            <div>
              <p>Loading strike prices for selected expiry...</p>
              <p className="text-sm mt-1">
                Expiry: {availableExpiries.find(exp => exp.date === selectedExpiry)?.displayName || selectedExpiry}
              </p>
            </div>
          ) : (
            <div>
              <p>Please select an expiry date to view strike prices</p>
              <p className="text-sm mt-1">Available expiry dates are being loaded...</p>
            </div>
          )}
        </div>
      )}

      {/* Footer with info */}
      {strikePrices && (
        <div className="bg-gray-50 px-4 py-3 rounded-b-lg border-t">
          <div className="text-sm text-gray-800 text-center font-medium">
            ATM Strike: {strikePrices.atmStrike} | 
            Total Options: {orderedStrikes.length * 2} |
            Expiry: {availableExpiries.find(exp => exp.date === selectedExpiry)?.displayName || selectedExpiry}
          </div>
        </div>
      )}
    </div>
  );
};

export default StrikePricesDisplay;