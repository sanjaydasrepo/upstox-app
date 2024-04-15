import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";

type AuthToken = string | null;

function Login() {
  const [token, setToken] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // Extract the token from URL parameters
    const urlParams = new URLSearchParams(location.search);
    const token: AuthToken = urlParams.get("token");

    if (token) {
      // Save the token for further API calls
      localStorage.setItem("token", token);
      console.log("token set ", token);

      // Redirect to the dashboard or the previous page they were trying to visit
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleLogin = () => {
    axiosInstance
      .get("/auth/upstox")
      .then((response) => {
        window.location.href = response.data.url;
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="border">Upstox API Token</h1>
        {token ? (
          <div>
            <h2>Token:</h2>
            <p>{token}</p>
          </div>
        ) : (
          <button onClick={handleLogin}>Login</button>
        )}
      </header>
    </div>
  );
}

export default Login;
