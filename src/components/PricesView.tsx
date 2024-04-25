import React, { useEffect } from "react";
import { MemoizedPricesViewProps } from "../interfaces/memoized-prices-view.interface";
var _isEqual = require("lodash.isequal");

const MemoizedPricesView: React.FC<MemoizedPricesViewProps> = React.memo(
  ({ color, type = "", data = [], handleBuyOption }) => {
    const getTypeClass = (type: string, index: number): string => {
      if (type === "CE") return "justify-start";
      if (type === "PE") return "justify-end";
      return index === 0 && type === "ATM"
        ? "justify-start"
        : "justify-between";
    };

    

    useEffect(() => {
      console.log("MemoizedPricesView mounted"); // Log a message when the component mounts
    }, []);

    return (
      <div className={`flex flex-wrap ${getTypeClass(type, 0)}`}>
        {data.map((option, index) => {
          const mType =
            index === 0 && type === "ATM" ? "CE" : type !== "ATM" ? type : "PE";
          return (
            <span className="flex" key={option?.instrument_key}>
              <button
                className={`${color} text-white px-4 py-2 rounded mr-2 my-2 w-[180px]`}
                onClick={() => handleBuyOption(option)}
              >
                {option.strike_price} {mType} |
              </button>
              <span>
                {/* {liveData?.feeds[option.instrument_key]?.ltpc?.ltp} */}
              </span>
            </span>
          );
        })}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.color === nextProps.color &&
      prevProps.type === nextProps.type &&
      prevProps.handleBuyOption === nextProps.handleBuyOption &&
      _isEqual(prevProps.data, nextProps.data)
    );
  }
);

export default MemoizedPricesView;
