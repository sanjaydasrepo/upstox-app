export interface MarketData {
    feeds: {
      [key: string]: {
        ltpc: {
          ltp: number;
          ltt: string;
          cp: number;
        };
      };
    };
  }