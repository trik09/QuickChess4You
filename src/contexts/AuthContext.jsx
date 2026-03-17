import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAdminAuth,
  clearUserAuth,
  getAdmin,
  getAdminToken,
  getPreferredAuthHeader,
  getUser,
  getUserToken,
  setAdmin as saveAdmin,
  setAdminToken,
  setUser as saveUser,
  setUserToken,
} from "../services/authStorage";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Decode JWT payload without verifying signature (client-side check only)
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  if (!token) return true;
  const expiry = getTokenExpiry(token);
  if (!expiry) return false; // can't determine, assume valid
  return Date.now() >= expiry;
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // ------------------ USER AUTH ------------------
  const [user, setUser] = useState(() => {
    const storedToken = getUserToken();
    // Clear stale token on app load before initializing state
    if (storedToken && isTokenExpired(storedToken)) {
      clearUserAuth();
      return null;
    }
    return getUser();
  });
  const [token, setToken] = useState(() => {
    const storedToken = getUserToken();
    if (storedToken && isTokenExpired(storedToken)) return null;
    return storedToken;
  });

  const isUserAuthenticated = !!token;

  // Listen for global auth:expired events fired by http.js
  useEffect(() => {
    const handleAuthExpired = (e) => {
      setUser(null);
      setToken(null);
      clearUserAuth();
      navigate("/login?reason=session_expired");
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [navigate]);

  // Proactively check token expiry every minute while the app is open
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = getUserToken();
      if (currentToken && isTokenExpired(currentToken)) {
        setUser(null);
        setToken(null);
        clearUserAuth();
        navigate("/login?reason=session_expired");
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [navigate]);

  const userLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    saveUser(userData);
    setUserToken(authToken);
  };

  const userLogout = () => {
    setUser(null);
    setToken(null);
    clearUserAuth();
  };

  // ------------------ ADMIN AUTH ------------------
  const [admin, setAdmin] = useState(() => {
    return getAdmin();
  });
  const [atoken, setAToken] = useState(getAdminToken());

  const isAdminAuthenticated = !!atoken;

  const adminLogin = (adminData, adminToken) => {
    setAdmin(adminData);
    setAToken(adminToken);
    saveAdmin(adminData);
    setAdminToken(adminToken);
  };

  const adminLogout = () => {
    setAdmin(null);
    setAToken(null);
    clearAdminAuth();
  };

  const getAuthHeader = () => {
    return getPreferredAuthHeader();
  };

  return (
    <AuthContext.Provider
      value={{
        // user auth
        user,
        token,
        isUserAuthenticated,
        userLogin,
        userLogout,

        // legacy aliases
        isAuthenticated: isUserAuthenticated,
        login: userLogin,
        logout: userLogout,

        // admin auth
        admin,
        atoken,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,

        // shared
        getAuthHeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};