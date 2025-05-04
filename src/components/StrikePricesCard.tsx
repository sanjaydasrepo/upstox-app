import React, { useEffect } from "react";
import { StrikePrices } from "../interfaces/strike-prices.interface";
import MemoizedPricesView from "./PricesView";
import { OptionData } from "../interfaces/optiondata.interface";
var _isEqual = require("lodash.isequal");

interface StrikePricesProps {
  strikePrices: StrikePrices | null;
  handleBuyOption: (option: OptionData) => void;
}
const StrikePricesCard: React.FC<StrikePricesProps> = React.memo(
  ({ strikePrices, handleBuyOption }) => {
    console.log("handle mounted", handleBuyOption);
    useEffect(() => {
      console.log("Strike Paice Card Mounted");
    }, []);
    return (
      <div className="ml-2">
        <div className="flex justify-center items-center bg-white p-4 rounded-lg shadow-md">
          <div className="flex flex-col justify-between max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <MemoizedPricesView
                color="bg-green-500"
                data={strikePrices?.otmCallStrikes}
                type="CE"
                handleBuyOption={handleBuyOption}
              />
              <MemoizedPricesView
                color="bg-red-500"
                data={strikePrices?.itmPutStrikes}
                type="PE"
                handleBuyOption={handleBuyOption}
              />
            </div>
            <div className="bg-gray-200 text-gray-800 font-bold py-2 rounded-lg flex justify-center">
              <MemoizedPricesView
                color="bg-gray-500"
                data={strikePrices?.atmStrikes}
                type="ATM"
                handleBuyOption={handleBuyOption}
              />
            </div>
            <div className="flex justify-between items-center">
              <MemoizedPricesView
                color="bg-green-500"
                data={strikePrices?.itmCallStrikes}
                type="CE"
                handleBuyOption={handleBuyOption}
              />
              <MemoizedPricesView
                color="bg-red-500"
                data={strikePrices?.otmPutStrikes}
                type="PE"
                handleBuyOption={handleBuyOption}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return _isEqual(prevProps.strikePrices, nextProps.strikePrices);
  }
);

export default StrikePricesCard;
