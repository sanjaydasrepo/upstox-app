import React from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Dashboard component logic
  const handleLogout = () => {
    localStorage.setItem("token", "");
    navigate("/login", { replace: true });
  };
  const handleStart = async () => {
    try {
      const resp = await axiosInstance.get(`/upstox/start`)
      console.log("res p", resp)  ;
    } catch (error) {
      
      console.error("Error", error)  ;
    }
  };
  return (
    <div>
      <button onClick={handleLogout}> Logout </button>
      <button onClick={handleStart}> Start </button>
    </div>
  );
};
export default Dashboard;
