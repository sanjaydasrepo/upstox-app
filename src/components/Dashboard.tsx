import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

interface OptionData {
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

interface StrikePrices {
  atmStrike: number;
  itmCallStrikes: OptionData[];
  itmPutStrikes: OptionData[];
  otmCallStrikes: OptionData[];
  otmPutStrikes: OptionData[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [strikePrices, setStrikePrices] = useState<StrikePrices | null>(null);
  // Dashboard component logic
  const handleLogout = () => {
    localStorage.setItem("token", "");
    navigate("/login", { replace: true });
  };
  const handleStart = async () => {
    try {
      const resp = await axiosInstance.get(`/upstox/start`, {
        headers: {
          Authorization: `Bearer ` + localStorage.getItem("token"),
        },
      });
      console.log("res p", resp);
    } catch (error) {
      console.error("Error", error);
    }
  };

  useEffect(() => {
    socket.on("strikePrices", (data: StrikePrices) => {
      setStrikePrices(data);
    });

    return () => {
      socket.off("strikePrices");
    };
  }, []);

  const handleBuyOption = (option: any) => {
    // Logic to buy the selected option
    console.log(`Buying option: ${option}`);
  };

  return (
    <>
      <div>
        <button onClick={handleLogout}> Logout </button>
        <button onClick={handleStart}> Start </button>
      </div>

      <div className="p-4">
        {strikePrices ? (
          <>
            <div className="flex justify-center mb-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                onClick={() => handleBuyOption(strikePrices.atmStrike)}
              >
                ATM: {strikePrices.atmStrike}
              </button>
            </div>
            <div className="flex justify-between mb-4">
              <div>
                {strikePrices.itmCallStrikes.map((option) => (
                  <button
                    key={option.instrument_key}
                    className="bg-green-500 text-white px-4 py-2 rounded mr-2 mb-2"
                    onClick={() => handleBuyOption(option)}
                  >
                    ITM CE: {option.strike_price}
                  </button>
                ))}
              </div>
              <div>
                {strikePrices.otmCallStrikes.map((option) => (
                  <button
                    key={option.instrument_key}
                    className="bg-red-500 text-white px-4 py-2 rounded mr-2 mb-2"
                    onClick={() => handleBuyOption(option)}
                  >
                    OTM CE: {option.strike_price}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                {strikePrices.itmPutStrikes.map((option) => (
                  <button
                    key={option.instrument_key}
                    className="bg-green-500 text-white px-4 py-2 rounded mr-2 mb-2"
                    onClick={() => handleBuyOption(option)}
                  >
                    ITM PE: {option.strike_price}
                  </button>
                ))}
              </div>{" "}
              <div>
                {strikePrices.otmPutStrikes.map((option) => (
                  <button
                    key={option.instrument_key}
                    className="bg-red-500 text-white px-4 py-2 rounded mr-2 mb-2"
                    onClick={() => handleBuyOption(option)}
                  >
                    OTM PE: {option.strike_price}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p>Loading strike prices...</p>
        )}
      </div>
    </>
  );
};
export default Dashboard;
