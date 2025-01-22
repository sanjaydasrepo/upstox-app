import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Orders from "./components/Orders";
import Reports from "./components/Reports";
import Dashboard from "./components/dashboard";
import NotFound from "./components/NotFound";
import StrategyView from "./components/StrategyView";
import { Provider } from "./providers";
import Account from "./components/account";
import Navbar from "./components/NavBar";
import RiskProfile from "./components/risk-profile";

type AuthToken = string | null;

const useAuth = () => {
  const token: AuthToken = localStorage.getItem("token");
  return token ? true : false;
};

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.setItem("token", "");
    navigate('/login', { replace: true });
  };
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar handleLogout={handleLogout} />
      {children}
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/:action"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          <Route
            path="/risk-profile/:action"
            element={
              <ProtectedRoute>
                <RiskProfile />
              </ProtectedRoute>
            }
          />

          {/* <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          /> */}

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          >
            {/* <Route
              path="pnl"
              element={
                <ProtectedRoute>
                  <PnL /> 
                </ProtectedRoute>
              }
            /> */}
          </Route>

          <Route
            path="/strategies/:name"
            element={
              <ProtectedRoute>
                <StrategyView />
              </ProtectedRoute>
            }
          />

          {/* Catch-All Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
