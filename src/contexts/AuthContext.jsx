import { createContext, useContext, useState } from "react";
import {
  clearAdminAuth,
  clearUserAuth,
  getAdmin,
  getAdminToken,
  getPreferredAuthHeader,
  getUser,
  getUserToken,
  setAdmin,
  setAdminToken,
  setUser,
  setUserToken,
} from "../services/authStorage";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // ------------------ USER AUTH ------------------
  const [user, setUser] = useState(() => {
    return getUser();
  });
  const [token, setToken] = useState(getUserToken());

  const isUserAuthenticated = !!token;

  const userLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);

    setUser(userData);
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

    setAdmin(adminData);
    setAdminToken(adminToken);
  };

  const adminLogout = () => {
    setAdmin(null);
    setAToken(null);

    clearAdminAuth();
  };

  // --------------- GET AUTH HEADER BASED ON USER/ADMIN ---------------
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

        // legacy aliases for backwards compatibility
        // (so existing components using login/logout/isAuthenticated keep working)
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
