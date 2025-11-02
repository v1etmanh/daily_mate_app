import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getKeycloakInstance, logOutkeycloak } from "../api/KeycloakService";
import { getAccount } from "../api/ApiConnect";
import { apiclient } from "../api/BaseApi";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [isAuthentication, setAuthentication] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Cleanup và logout
  const handleLogout = useCallback(() => {
    // Clear refresh interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    // Clear auth state
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_refreshToken');
    setAuthentication(false);
    setUser(null);
    delete apiclient.defaults.headers.common['Authorization'];
    
    // Keycloak logout
    logOutkeycloak();
  }, [refreshInterval]);

  // Update tokens vào tất cả nơi cần thiết
  const updateTokens = useCallback(async (token, refreshToken) => {
    const keycloak = await getKeycloakInstance();
    keycloak.token = token;
    keycloak.refreshToken = refreshToken;
    keycloak.tokenParsed = JSON.parse(atob(token.split('.')[1]));
    
    apiclient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('kc_token', token);
    localStorage.setItem('kc_refreshToken', refreshToken);
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const keycloak = await getKeycloakInstance();
      const refreshed = await keycloak.updateToken(30);
      
      if (refreshed) {
        console.log('Token refreshed successfully');
        await updateTokens(keycloak.token, keycloak.refreshToken);
        return true;
      } else {
        console.log('Token still valid');
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      handleLogout();
      return false;
    }
  }, [updateTokens, handleLogout]);

  // Setup auto refresh timer
  const setupAutoRefresh = useCallback(() => {
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Set new interval (4 phút = 240000ms)
    const interval = setInterval(async () => {
      console.log('Auto refreshing token...');
      await refreshToken();
    }, 240000);
    
    setRefreshInterval(interval);
  }, [refreshToken, refreshInterval]);

  // Setup token expired handler
  const setUpTokenRefresh = useCallback(async () => {
    const keycloak = await getKeycloakInstance();
    keycloak.onTokenExpired = async () => {
      console.log("Token expired, refreshing...");
      await refreshToken();
    };
  }, [refreshToken]);

  // Authenticate user và setup refresh
  const authenticateUser = useCallback(async () => {
    try {
      const keycloak = await getKeycloakInstance();
      setAuthentication(true);
      apiclient.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
      
      const response = await getAccount();
      setUser(response.data);
      
      await setUpTokenRefresh();
      setupAutoRefresh();
      
      console.log("Authentication successful");
    } catch (error) {
      console.error("Failed to get account info:", error);
      handleLogout();
    }
  }, [setUpTokenRefresh, setupAutoRefresh, handleLogout]);

  // Kiểm tra token có hợp lệ không
  const isTokenValid = useCallback((token) => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > (currentTime + 60);
    } catch (error) {
      console.error("Invalid token format:", error);
      return false;
    }
  }, []);

  // Login function cho LoginComponent
  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      const keycloak = await getKeycloakInstance();
      
      if (keycloak.token && keycloak.refreshToken) {
        await updateTokens(keycloak.token, keycloak.refreshToken);
        await authenticateUser();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      handleLogout();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateTokens, authenticateUser, handleLogout]);

  // Initialize authentication on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('kc_token');
        const savedRefreshToken = localStorage.getItem('kc_refreshToken');

        if (savedToken && savedRefreshToken && isTokenValid(savedToken)) {
          console.log("Found valid saved token, restoring session");
          
          await updateTokens(savedToken, savedRefreshToken);
          await authenticateUser();
        } else {
          console.log("No valid saved token found");
          if (savedToken || savedRefreshToken) {
            localStorage.removeItem('kc_token');
            localStorage.removeItem('kc_refreshToken');
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const contextValue = {
    isAuthentication,
    setAuthentication,
    user,
    setUser,
    isLoading,
    handleLogout,
    refreshToken,
    login
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}