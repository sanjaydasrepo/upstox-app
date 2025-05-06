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
  max_position_size: number;
  max_loss_per_trade: number;
  daily_loss_limit: number;
  margin_call_threshold: number;
  name: string;
  daily_profit_target: number;
  enforce_stop_loss: boolean;
  max_trades_per_hour: number;
  documentId?:string;
  trading_account?: TradingAccount;
  severity:string;
  users?:any;
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
  name: string;
  documentId?: string;
  account_type: AccountType;
  account_status: AccountStatus;
  initial_balance?: number;
  current_balance?: number;
  
  broker: BrokerType;
  user?: any;
  trading_credential?: TradingCredential;
  trades?: Trade[];
  portfolio?: Portfolio;
  risk_setting?: RiskSetting;
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
