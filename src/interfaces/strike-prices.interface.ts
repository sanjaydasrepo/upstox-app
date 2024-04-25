import { OptionData } from "./optiondata.interface";

export interface StrikePrices {
    atmStrike: any;
    itmCallStrikes: OptionData[];
    itmPutStrikes: OptionData[];
    otmCallStrikes: OptionData[];
    otmPutStrikes: OptionData[];
    atmStrikes: OptionData[];
  }