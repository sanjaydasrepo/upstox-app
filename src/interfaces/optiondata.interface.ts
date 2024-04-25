export interface OptionData {
    name: string;
    segment: string;
    exchange: string;
    expiry: string;
    weekly: boolean;
    instrument_key: string;
    exchange_token: string;
    trading_symbol: string;
    tick_size: number;
    lot_size: number;
    instrument_type: string;
    freeze_quantity: number;
    underlying_key: string;
    underlying_type: string;
    underlying_symbol: string;
    strike_price: number;
    minimum_lot: number;
  }