import React from "react";
import { Link } from "react-router-dom";

const StrategyList: React.FC = () => {
  // Reports component logic
  return (
    <div className="min-w-[300px] shadow-lg ml-8 p-4">
      <h3>Strategies</h3>
      <ul className="mt-8">
        <li className="py-4"> <Link to={`/strategies/iron-condor`}>Iron condor </Link> </li>
        <li>
          <Link to={`/strategies/calender-spread`}>Calender spread </Link>
        </li>
      </ul>
    </div>
  );
};
export default StrategyList;
