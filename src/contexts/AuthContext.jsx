import { createContext, useContext, useState, useEffect, useCallback } from "react";
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // ------------------ USER AUTH ------------------
  const [user, setUser] = useState(() => getUser());
  const [token, setToken] = useState(() => getUserToken());

  const isUserAuthenticated = !!token;

  /**
   * Silently refresh the access token using the httpOnly refresh token cookie.
   * Called on app load and whenever the interceptor in http.js triggers it.
   * Returns true if successful, false if the session is gone.
   */
  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        // Refresh token expired or invalid — clear local state silently
        setUser(null);
        setToken(null);
        clearUserAuth();
        return false;
      }

      const data = await response.json();
      const newToken = data.token;
      const freshUser = data.user;

      setToken(newToken);
      setUserToken(newToken);

      if (freshUser) {
        setUser(freshUser);
        saveUser(freshUser);
      }

      return true;
    } catch {
      // Network error — don't log out, just leave state as-is
      return false;
    }
  }, []);

  // On app load: attempt a silent refresh so the user is never logged out
  // as long as their refresh token cookie is still valid.
  // Only runs if there's existing user data — avoids unnecessary calls on the login page.
  useEffect(() => {
    if (getUser()) {
      refreshSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proactive refresh: re-run every 13 minutes so the 15-min access token
  // never actually expires while the user is actively using the app.
  // This is the "Flipkart-style never logout" — as long as the tab is open,
  // the token stays fresh silently.
  useEffect(() => {
    if (!getUser()) return;

    const REFRESH_INTERVAL_MS = 28 * 60 * 1000; // TEST: 1min (change back to 13 * 60 * 1000)
    const interval = setInterval(() => {
      if (getUser()) {
        refreshSession();
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for global auth:expired events fired by http.js when refresh fails
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      clearUserAuth();
      navigate("/login?reason=session_expired");
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [navigate]);

  const userLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    saveUser(userData);
    setUserToken(authToken);
  };

  const userLogout = async () => {
    // Clear local state immediately — this ensures refreshSession on remount
    // won't fire (getUser() will return null)
    setUser(null);
    setToken(null);
    clearUserAuth();

    try {
      // Tell the server to invalidate the refresh token and clear the cookie
      await fetch(`${API_BASE_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Best-effort — local state is already cleared
    }
  };

  // ------------------ ADMIN AUTH ------------------
  const [admin, setAdmin] = useState(() => getAdmin());
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
        refreshSession,

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
