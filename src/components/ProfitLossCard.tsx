import React, { useEffect } from "react";
export interface PositionCurrentData {
  average_price: number;
  buy_price: number;
  buy_value: number;
  close_price: number;
  day_buy_price: number;
  day_buy_quantity: number;
  day_buy_value: number;
  day_sell_price: number;
  day_sell_quantity: number;
  day_sell_value: number;
  exchange: string;
  instrument_token: string;
  last_price: number;
  multiplier: number;
  overnight_buy_amount: number;
  overnight_buy_quantity: number;
  overnight_quantity: number;
  overnight_sell_amount: number;
  overnight_sell_quantity: number;
  pnl: number;
  product: string;
  quantity: number;
  realised: number;
  sell_price: number;
  sell_value: number;
  trading_symbol: string;
  tradingsymbol: string;
  unrealised: number;
  value: number;
}

export interface ProfitLossCardProps {
  totalProfitLoss?: number;
  totalProfitLossPercentage?: number;
  totalInvested?:number;
  openPositions?: PositionCurrentData[];
}

const ProfitLossCard: React.FC<ProfitLossCardProps> = ({
  totalProfitLoss,
  totalProfitLossPercentage,
  totalInvested,
  openPositions,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        {/* <h2 className="text-2xl font-bold text-gray-800">Total Profit/Loss</h2> */}
        <p className="text-4xl font-bold text-green-500 mt-2">
          Invested : {totalInvested?.toFixed(2)}
        </p>
        <p className="text-4xl font-bold text-green-500 mt-2">
          Pnl: {totalProfitLossPercentage?.toFixed(2)}%
        </p>
        <p className="text-xl font-bold text-green-500 mt-2">
          {totalProfitLoss?.toFixed(2)}
        </p>
      </div>

      {openPositions && openPositions?.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Open Positions
          </h3>
          <ul className="divide-y divide-gray-200">
            {openPositions?.map((position, index) => (
              <li
                key={index}
                className="py-4 flex justify-between items-center px-4 bg-gray-100 rounded"
              >
                <div>
                  <p className="text-gray-700 font-semibold">
                    {position.trading_symbol}
                  </p>
                  <p className="text-gray-500">Quantity: {position.quantity}</p>
                </div>
                <div>
                  <p
                    className={`text-lg font-bold ${
                      position.pnl >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {position.pnl.toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfitLossCard;
