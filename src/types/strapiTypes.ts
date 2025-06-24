export type StrapiResponse<T> = {
  id: number;
  data: T;
};

export type StrapiArrayResponse<T> = {
  data: Array<T>;
};

export enum TradeType {
  BUY = "buy",
  SELL = "sell",
}

export enum OrderType {
  MARKET = "market",
  LIMIT = "limit",
  STOP = "stop",
}

export enum OrderStatus {
  PENDING = "pending",
  FILLED = "filled",
  CANCELLED = "cancelled",
}

export enum AccountType {
  DEMO = "demo",
  LIVE = "live",
}

export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum BrokerType {
  zerodha = "zerodha",
  upstox = "upstox",
}

// Interfaces

export interface User {
  id: number;
  documentId: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  publishedAt: string; // ISO date string
}

export interface Portfolio {
  total_value: number;
  cash_balance: number;
  margin_used: number;
  margin_available: number;
  last_updated: Date;
  trading_account?: TradingAccount;
}

export interface RiskSetting {
  // Prisma fields
  id?: string;
  userId?: string;
  name: string;
  active?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Strapi compatibility
  documentId?: string;
  
  // Position size limits
  max_position_size?: number;
  maxPositionSize?: number;
  maxPositionSizePercentage?: number;
  maxLotsPerTrade?: number;
  maxOpenPositions?: number;

  // Loss limits
  max_loss_per_trade?: number;
  maxLossPerTrade?: number;
  daily_loss_limit?: number;
  dailyLossLimit?: number;
  weeklyLossLimit?: number;
  maxConsecutiveLosses?: number;
  maxDrawdownToProfitRatio?: number;

  // Profit targets
  daily_profit_target?: number;
  dailyProfitTarget?: number;
  minRiskToRewardRatio?: number;
  minWinRatePercentage?: number;

  // Margin controls
  margin_call_threshold?: number;
  marginCallThreshold?: number;
  marginUtilizationAlertPercentage?: number;

  // Trade execution controls
  enforce_stop_loss?: boolean;
  enforceStopLoss?: boolean;
  enforceTakeProfit?: boolean;
  stopLossBufferPoints?: number;
  takeProfitBufferPoints?: number;

  // Time constraints
  max_trades_per_hour?: number;
  maxTradesPerHour?: number;
  maxHoldTimeMinutes?: number;
  restrictedHoursFrom?: string | Date;
  restrictedHoursTo?: string | Date;
  coolingOffMinutesAfterLosses?: number;
  overtradingLimitTradesPer30Minutes?: number;

  // Market condition filters
  maxAllowedVolatility?: number;
  avoidHighIv?: boolean;
  preferredExpiryDayTrading?: boolean;
  avoidTradeOnEventDays?: boolean;

  // Alerts
  alertThresholdPercentage?: number;
  tradeLimitAlert?: boolean;
  autoSuspendThreshold?: boolean;

  // Sharing settings
  isShared?: boolean;
  severity?: string;

  // Relations
  trading_account?: TradingAccount;
  users?: any;
}

export interface Trade {
  symbol: string;
  trade_type: TradeType;
  quantity: number;
  price: number;
  order_type: OrderType;
  order_status: OrderStatus;
  timestamp: Date;
  trading_account?: TradingAccount;
}

export interface TradingAccount {
  id?: number;
  name?: string;
  displayBrokerName?: string;
  documentId?: string;
  
  // Strapi format (snake_case)
  account_type?: AccountType;
  account_status?: AccountStatus;
  initial_balance?: number;
  current_balance?: number;
  isLinkedWithBrokerAccount?: boolean;
  
  // NestJS/Prisma format (camelCase) - for compatibility during migration
  accountType?: string;
  accountStatus?: string;
  initialBalance?: number;
  currentBalance?: number;
  isLinked?: boolean;
  
  // Token validation fields (from new backend implementation)
  tokenStatus?: 'valid' | 'expired' | 'missing' | 'no_credential';
  requiresReconnection?: boolean;
  credentialId?: string;
  
  broker?: BrokerType;
  user?: any;
  trading_credential?: TradingCredential;
  trades?: Trade[];
  portfolio?: Portfolio;
  risk_setting?: RiskSetting;
  demo_account?: TradingAccount;
  
  // Paired accounts for demo/live toggle functionality
  pairedLiveAccount?: TradingAccount;
  pairedDemoAccount?: TradingAccount;
  
  // Error information for expired tokens
  error?: {
    status: number;
    name: string;
    message: string;
    details: {
      action: string;
      broker?: string;
    };
  };
}

export interface TradingCredential {
  api_key: string;
  api_secret: string;
  access_token: string;
  is_active: boolean;
  last_connected?: Date;
  trading_accounts?: any;
}

export interface User {
  username: string;
  email: string;
}
