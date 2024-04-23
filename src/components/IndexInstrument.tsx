import React from "react";

interface RadioButtonsProps {
  selectedOption: string;
  handleOptionChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const IndexInstruments: React.FC<RadioButtonsProps> = ({
  selectedOption,
  handleOptionChange,
}) => {
  return (
    <div className="flex items-center space-x-4 mt-16 bg-gray-300 p-4 rounded-lg">
      <label className="inline-flex items-center">
        <input
          type="radio"
          className="form-radio h-5 w-5 text-blue-600"
          value="NSE_INDEX|Nifty 50"
          checked={selectedOption === "NSE_INDEX|Nifty 50"}
          onChange={handleOptionChange}
        />
        <span className="ml-2 text-sm">Nifty</span>
      </label>
      <label className="inline-flex items-center">
        <input
          type="radio"
          className="form-radio h-5 w-5 text-blue-600"
          value="NSE_INDEX|Nifty 50"
          checked={selectedOption === "NSE_INDEX|Nifty 50"}
          onChange={handleOptionChange}
        />
        <span className="ml-2 text-sm">Bank Nifty</span>
      </label>
    </div>
  );
};

export default IndexInstruments;
