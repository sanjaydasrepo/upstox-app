import React, { memo, useCallback, useEffect, useState } from "react";
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
const INSTRUMENT_KEY = "instruments";
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [strikePrices, setStrikePrices] = useState<StrikePrices | null>(null);
  const [positions, setPositions] = useState<ProfitLossCardProps | null>(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [liveData, setMarketLiveData] = useState<MarketData | null>(null);

  // Dashboard component logic
  const handleLogout = () => {
    localStorage.setItem("token", "");
    navigate("/login", { replace: true });
  };
  const handleStart = async () => {
    const payload = localStorage.getItem(INSTRUMENT_KEY);
    const instruments = payload ? JSON.parse(payload) : [];
    const prevSelOption = localStorage.getItem('prevSelectedOption');
    const selOption = localStorage.getItem('selectedOption');
    if (selOption) {
      try {
        //first unsub prev keys
        const headers = {
          headers: {
            Authorization: `Bearer ` + localStorage.getItem("token"),
          },
        }
        const resp = await axiosInstance.post(
          `/upstox/subscribe`,
          {
            instrumentKeys: [...instruments, prevSelOption].filter(fk => fk !== null),
            method: 'unsub'
          },
          headers
        );
        localStorage.setItem(INSTRUMENT_KEY, "");

        if (resp.status === 200) {
          //initialize state 
          const respSubs = await axiosInstance.post(
            `/upstox/subscribe`,
            {
              instrumentKeys: [selOption],
              method: 'sub'
            },
            headers
          );
          localStorage.setItem('prevSelectedOption', selOption);
        }

        // body: instruments,
        console.log("res p", resp);
        return resp;
      } catch (error) {
        return error;
        console.error("Error", error);
      }
    }

  };
  const handleSubscribe = async (instruments: string[]) => {
    if (instruments.length > 0) {
      console.log("Subscribing ins ", instruments);
      const initialState: MarketData = {
        feeds: Object.fromEntries(instruments.map(key => [key, {
          ltpc: {
            ltp: 0,
            ltt: '',
            cp: 0,
          },
        }]))
      };
      setMarketLiveData(initialState);

      try {
        const headers = {
          headers: {
            Authorization: `Bearer ` + localStorage.getItem("token"),
          },
        }

        const resp = await axiosInstance.post(
          `/upstox/subscribe`,
          {
            instrumentKeys: instruments,
            method: 'sub'
          },
          headers
        );

        // body: instruments,
        console.log("res p", resp);
        return resp;
      } catch (error) {
        return error;
        console.error("Error", error);
      }
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
      const allStkPrices = data.atmStrikes.concat(data.itmCallStrikes, data.itmPutStrikes, data.otmCallStrikes, data.otmPutStrikes);
      const instruments = allStkPrices.map(sk => sk.instrument_key);
      // instruments.push(selectedOption);
      console.log("called this shit ");
      localStorage.setItem(INSTRUMENT_KEY, JSON.stringify(instruments));
      handleSubscribe(instruments);
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

  // console.log('live margett data ', liveData);
  useEffect(() => {

    socket.on("marketData", (data: MarketData) => {
      // setPortfolio(data);
      const instrumentsNp = localStorage.getItem(INSTRUMENT_KEY);
      const insts = instrumentsNp ? JSON.parse(instrumentsNp) : [];
      // setMarketLiveData(data);
      if (insts?.length > 0) {
        for (const inst of insts) {
          if (data.feeds.hasOwnProperty(inst) && data.feeds[inst] !== undefined && data.feeds[inst].ltpc !== null) {
            // console.log("data port maket data ", data.feeds[inst]);
            setMarketLiveData(v => ({
              ...v,
              feeds: {
                ...v?.feeds,
                [inst]: data.feeds[inst]
              }
            }));
          }
          if (liveData && liveData.feeds.hasOwnProperty(inst) && data.feeds.hasOwnProperty(inst) && data.feeds[inst].ltpc.ltp > 0) {
            // setMarketLiveData(v => ({
            //   ...v,
            //   ['feeds']: {
            //     ...v?.feeds,
            //     [inst]: data.feeds[inst]
            //   }
            // }));
            // console.log("data port maket data ", data.feeds[inst].ltpc);
          } else {
            // setMarketLiveData(v => ({
            //   ...v,
            //   ['feeds']: {
            //     ...v?.feeds,
            //     [inst]: data.feeds[inst]
            //   }
            // }));
          }
        }
      }
    });

    return () => {
      socket.off("portfolio");
    };
  }, []);
  useEffect(() => {
    const selOption = localStorage.getItem('selectedOption');
    if (selOption) {
      setSelectedOption(selOption);
      console.log("selected ", selOption);
    }
  }, [])
  const handleBuyOption = async (option: OptionData) => {
    // Logic to buy the selected option
    console.log(`Buying option:`, option);

    // const params : ChargesPayload = {
    //   instrument_token:option.trading_symbol ,
    //   price:option.strike_price ,
    // }
    // try {
    //   const resp = await axiosInstance.get(`/upstox/charges`, {handleBuyOption
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

  const MemoizedPricesView = React.memo(
    ({ color, data, type }: { color: string; data?: OptionData[]; type?: string }) => {
      return (
        <div className={`flex flex-wrap  ${type === "CE" ? "justify-start" : type === 'PE' ? "justify-end" : 'justify-between'}`}>
          {data?.map((option, i) => {
            const mType = type === 'ATM' && i === 0 ? 'CE' : type !== 'ATM' ? type : 'PE'
            return (
              <button
                key={option?.instrument_key}
                className={`${color} text-white px-4 py-2 rounded mr-2 my-2 w-[180px]`}
                onClick={() => handleBuyOption(option)}
              >
                {option.strike_price} {mType} | {liveData?.feeds[option.instrument_key]?.ltpc?.ltp}
              </button>
            )
          })}
        </div>
      );
    },
    (prevProps, nextProps) => {
      // Custom shouldComponentUpdate logic
      // Perform a deep comparison of props if needed
      return (
        prevProps.color === nextProps.color &&
        JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
        prevProps.type === nextProps.type
      );
    }
  );


  const handleOptionChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // localStorage.setItem(INSTRUMENT_KEY, JSON.stringify([event.target.value]));
    setSelectedOption(event.target.value);
    localStorage.setItem("selectedOption", event.target.value);
    handleStart();
  };
  return (
    <>
      <Navbar handleLogout={handleLogout} />
      <div className="flex justify-center w-full border">
        <div className="flex flex-col">
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
        </div>

        <div className="ml-2">
          <div className="flex justify-center items-center bg-white p-4 rounded-lg shadow-md">
            <div className="flex flex-col justify-between max-w-md space-y-4">
              <div className="flex justify-between items-center">
                <MemoizedPricesView color="bg-green-500" data={strikePrices?.otmCallStrikes} type="CE" />
                <MemoizedPricesView color="bg-red-500" data={strikePrices?.itmPutStrikes} type="PE" />
              </div>
              <div className="bg-gray-200 text-gray-800 font-bold py-2 rounded-lg flex justify-center">
                <MemoizedPricesView color="bg-gray-500" data={strikePrices?.atmStrikes} type="ATM" />
              </div>
              <div className="flex justify-between items-center">
                <MemoizedPricesView color="bg-green-500" data={strikePrices?.itmCallStrikes} type="CE" />
                <MemoizedPricesView color="bg-red-500" data={strikePrices?.otmPutStrikes} type="PE" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;
