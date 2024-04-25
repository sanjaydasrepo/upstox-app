import React, { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance, { BASE_URL } from "../utils/axiosConfig";
import io from "socket.io-client";
import ProfitLossCard, { ProfitLossCardProps } from "./ProfitLossCard";
import Navbar from "./NavBar";
import IndexInstruments from "./IndexInstrument";
import StrikePricesCard from "./StrikePricesCard";
import { OptionData } from "../interfaces/optiondata.interface";
import { StrikePrices } from "../interfaces/strike-prices.interface";
import { MarketData } from "../interfaces/marketdata.interface";

const socket = io(BASE_URL);

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
    const prevSelOption = localStorage.getItem("prevSelectedOption");
    const selOption = localStorage.getItem("selectedOption");
    if (selOption) {
      try {
        //first unsub prev keys
        const headers = {
          headers: {
            Authorization: `Bearer ` + localStorage.getItem("token"),
          },
        };
        const resp = await axiosInstance.post(
          `/upstox/subscribe`,
          {
            instrumentKeys: [...instruments, prevSelOption].filter(
              (fk) => fk !== null
            ),
            method: "unsub",
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
              method: "sub",
            },
            headers
          );
          localStorage.setItem("prevSelectedOption", selOption);
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
        feeds: Object.fromEntries(
          instruments.map((key) => [
            key,
            {
              ltpc: {
                ltp: 0,
                ltt: "",
                cp: 0,
              },
            },
          ])
        ),
      };
      setMarketLiveData(initialState);

      try {
        const headers = {
          headers: {
            Authorization: `Bearer ` + localStorage.getItem("token"),
          },
        };

        const resp = await axiosInstance.post(
          `/upstox/subscribe`,
          {
            instrumentKeys: instruments,
            method: "sub",
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

  //initial start
  useEffect(() => {
    async function getData() {
      handleStart();
    }
    getData();
  }, []);
  //set default option at init
  useEffect(() => {
    const selOption = localStorage.getItem("selectedOption");
    if (selOption) {
      setSelectedOption(selOption);
      console.log("selected ", selOption);
    }
  }, []);
  //strikePrices socket
  useEffect(() => {
    socket.on("strikePrices", (data: StrikePrices) => {
      console.log("strike price ", data);
      setStrikePrices(data);
      // const allStkPrices = data.atmStrikes.concat(
      //   data.itmCallStrikes,
      //   data.itmPutStrikes,
      //   data.otmCallStrikes,
      //   data.otmPutStrikes
      // );
      // const instruments = allStkPrices.map((sk) => sk.instrument_key);
      // // instruments.push(selectedOption);
      // console.log("called this shit ");
      // localStorage.setItem(INSTRUMENT_KEY, JSON.stringify(instruments));
      // handleSubscribe(instruments);
    });

    return () => {
      socket.off("strikePrices");
    };
  }, []);
  //portfolio
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
  //fetch positions
  useEffect(() => {
    let interval: any;
    async function getData() {
      interval = setInterval(() => {
        getPositions();
      }, 5000);
    }
    getData();
    return () => {
      clearInterval(interval);
    };
  }, []);
  //marketData live
  useEffect(() => {
    socket.on("marketData", (data: MarketData) => {
      console.log("live data ", data);
      const instrumentsNp = localStorage.getItem(INSTRUMENT_KEY);
      const insts = instrumentsNp ? JSON.parse(instrumentsNp) : [];
      // setMarketLiveData(data);
      if (insts?.length > 0) {
        for (const inst of insts) {
          if (
            data.feeds.hasOwnProperty(inst) &&
            data.feeds[inst] !== undefined &&
            data.feeds[inst].ltpc !== null
          ) {
            // console.log("data port maket data ", data.feeds[inst]);
            // setMarketLiveData((v) => ({
            //   ...v,
            //   feeds: {
            //     ...v?.feeds,
            //     [inst]: data.feeds[inst],
            //   },
            // }));
          }
        }
      }
    });

    return () => {
      socket.off("portfolio");
    };
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
    //     // setPositions(resp.data);
    //   }
    // } catch (error) {
    //   console.error("Error", error);
    // }
  };

  const handleOptionChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
          <StrikePricesCard strikePrices={strikePrices} handleBuyOption={handleBuyOption}/>
        </div>
    
      </div>
    </>
  );
};
export default Dashboard;
