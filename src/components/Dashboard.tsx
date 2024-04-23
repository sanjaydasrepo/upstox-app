import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance, { BASE_URL } from "../utils/axiosConfig";
import io from "socket.io-client";
import ProfitLossCard, { ProfitLossCardProps } from "./ProfitLossCard";
import Navbar from "./NavBar";
import IndexInstruments from "./IndexInstrument";

const socket = io(BASE_URL);

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
  atmStrike: any;
  itmCallStrikes: OptionData[];
  itmPutStrikes: OptionData[];
  otmCallStrikes: OptionData[];
  otmPutStrikes: OptionData[];
  atmStrikes: OptionData[];
}
interface ChargesPayload {
  instrument_token: string;
  quantity: number;
  product: string;
  transaction_type: string;
  price: number;
}
const INSTRUMENT_KEY = "instruments";
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [strikePrices, setStrikePrices] = useState<StrikePrices | null>(null);
  const [positions, setPositions] = useState<ProfitLossCardProps | null>(null);
  const [selectedOption, setSelectedOption] = useState("");

  // Dashboard component logic
  const handleLogout = () => {
    localStorage.setItem("token", "");
    navigate("/login", { replace: true });
  };
  const handleStart = async () => {
    const payload = localStorage.getItem(INSTRUMENT_KEY);
    const instruments = payload ? JSON.parse(payload) : [];

    if (instruments.length > 0) {
      try {
        const resp = await axiosInstance.post(
          `/upstox/subscribe`,
          {
            instrumentKeys: instruments,
          },
          {
            headers: {
              Authorization: `Bearer ` + localStorage.getItem("token"),
            },
          }
        );

        // body: instruments,
        console.log("res p", resp);
        return resp;
      } catch (error) {
        return error;
        console.error("Error", error);
      }
    } else {
      alert("No inst found");
    }
  };
  const getPositions = async () => {
    try {
      const resp = await axiosInstance.get(`/upstox/positions`, {
        headers: {
          Authorization: `Bearer ` + localStorage.getItem("token"),
        },
      });
      if (resp) {
        setPositions(resp.data);
      }
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
  useEffect(() => {
    socket.on("portfolio", (data: any) => {
      // setPortfolio(data);
      getPositions().then(() => {
        console.log("data port ", JSON.parse(data));
      });
    });

    return () => {
      socket.off("portfolio");
    };
  }, []);
  useEffect(() => {
    async function getData() {
      handleStart();
      setTimeout(() => {
        getPositions();
      }, 1000);
    }
    getData();
  }, []);
  const handleBuyOption = async (option: OptionData) => {
    // Logic to buy the selected option
    console.log(`Buying option:`, option);

    // const params : ChargesPayload = {
    //   instrument_token:option.trading_symbol ,
    //   price:option.strike_price ,
    // }
    // try {
    //   const resp = await axiosInstance.get(`/upstox/charges`, {
    //     headers: {
    //       Authorization: `Bearer ` + localStorage.getItem("token"),
    //     },
    //   });
    //   if (resp) {
    //     setPositions(resp.data);
    //   }
    // } catch (error) {
    //   console.error("Error", error);
    // }
  };

  const getPricesView = (color: string, data?: OptionData[], type?: string) => {
    return (
      <div
        className={`flex flex-wrap max-w-[180px] ${
          type === "CE" ? "justify-start" : "justify-end"
        }`}
      >
        {strikePrices &&
          data?.map((option) => (
            <button
              key={option?.instrument_key}
              className={`${color} text-white px-4 py-2 rounded mr-2 mb-2`}
              onClick={() => handleBuyOption(option)}
            >
              {option.strike_price} {type}
            </button>
          ))}
      </div>
    );
  };

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem(INSTRUMENT_KEY, JSON.stringify([event.target.value]));
    setSelectedOption(event.target.value);
    handleStart();
  };
  return (
    <>
      <Navbar handleLogout={handleLogout} />
      <div className="flex flex-col items-center">
        <div>
          <IndexInstruments
            handleOptionChange={handleOptionChange}
            selectedOption={selectedOption}
          />
        </div>
        <div className="flex justify-center mb-4">
          <ProfitLossCard
            openPositions={positions?.openPositions}
            totalProfitLossPercentage={positions?.totalProfitLossPercentage}
            totalProfitLoss={positions?.totalProfitLoss}
            totalInvested={positions?.totalInvested}
          />
        </div>
        <div>
          <div className="flex justify-center items-center bg-white p-4 rounded-lg shadow-md">
            <div className="flex flex-col justify-between max-w-md space-y-4">
              <div className="flex justify-between items-center">
                {getPricesView(
                  "bg-green-500",
                  strikePrices?.otmCallStrikes,
                  "CE"
                )}
                {getPricesView("bg-red-500", strikePrices?.itmPutStrikes, "PE")}
              </div>
              <div className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg flex justify-between">
                <button
                  key={strikePrices?.atmStrikes[0].instrument_key}
                  className={`text-white px-4 py-2 rounded mr-2 bg-blue-300`}
                  onClick={() => {}}
                >
                  {strikePrices?.atmStrikes[0].strike_price}{" "}
                  {strikePrices?.atmStrikes[0].instrument_type}
                </button>
                <button
                  key={strikePrices?.atmStrikes[1].instrument_key}
                  className={`text-white px-4 py-2 rounded mr-2 bg-blue-300`}
                  onClick={() => {}}
                >
                  {strikePrices?.atmStrikes[1].strike_price}{" "}
                  {strikePrices?.atmStrikes[1].instrument_type}
                </button>
              </div>
              <div className="flex justify-between items-center">
                {getPricesView(
                  "bg-green-500",
                  strikePrices?.itmCallStrikes,
                  "CE"
                )}
                {getPricesView("bg-red-500", strikePrices?.otmPutStrikes, "PE")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;
