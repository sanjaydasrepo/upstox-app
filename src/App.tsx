import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Orders from "./components/Orders";
import Reports from "./components/Reports";
import Dashboard from "./components/dashboard";
import NotFound from "./components/NotFound";
import StrategyView from "./components/StrategyView";
import { Provider } from "./providers";
import Account from "./components/account";
import Navbar from "./components/NavBar";
import RiskProfile from "./components/risk-profile";
import { Toaster } from "./components/ui/toaster";
import { useUpstoxAuth } from "./hooks/useUpstoxAuth";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { currentUser, userData } = useAuth();
  
  // Monitor Upstox authentication status
  useUpstoxAuth();
  
  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }
  return (
    <>
      <Navbar/>
      {children}
      <Toaster />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider>
      <AuthProvider>
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
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />

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
      </AuthProvider>
    </Provider>
  );
};

export default App;
