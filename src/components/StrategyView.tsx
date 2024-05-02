import React from "react";
import { useParams } from "react-router-dom";

const StrategyView: React.FC = () => {
  // Reports component logic
  const { name } = useParams();
  return <div className="min-w-[300px] shadow-lg ml-8 p-4">
    <h3> { name } </h3>
    
  </div>;
};
export default StrategyView;