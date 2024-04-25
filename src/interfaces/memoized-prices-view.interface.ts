import { OptionData } from "./optiondata.interface";

export interface MemoizedPricesViewProps {
  color: string;
  data?: OptionData[];
  type?: string;
  handleBuyOption: (option: OptionData) => void;
}
