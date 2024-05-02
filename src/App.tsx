import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Orders from "./components/Orders";
import Reports from "./components/Reports";
import Dashboard from "./components/Dashboard";
import NotFound from "./components/NotFound";
import StrategyView from "./components/StrategyView";

type AuthToken = string | null;

const useAuth = () => {
  const token: AuthToken = localStorage.getItem("token");
  return token ? true : false;
};

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const auth = useAuth();
  if (!auth) {
    return <Navigate to="/login" replace />; 
  }
  return children;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
           <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/strategies/:name"
          element={
            <ProtectedRoute>
              <StrategyView />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
