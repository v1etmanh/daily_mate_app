import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../security/Authentication";
import { initKeycloak } from "../api/KeycloakService";

function LoginComponent() {
  const { isAuthentication, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Lấy redirect URL từ state (nếu user được redirect từ protected route)
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    // Nếu đã authenticated, redirect về trang đích
    if (isAuthentication) {
      navigate(from, { replace: true });
      return;
    }

    // Nếu đang loading (checking existing token), đợi
    if (isLoading) {
      return;
    }

    // Trigger Keycloak login
    const handleLogin = async () => {
      if (!isLoggingIn) {
        setIsLoggingIn(true);
        try {
          const authenticated = await initKeycloak();
          if (authenticated) {
            // AuthProvider sẽ tự động handle việc này thông qua login function
            await login();
            // Navigation sẽ được handle bởi useEffect ở trên
          } else {
            console.warn("Login cancelled or failed");
            setIsLoggingIn(false);
          }
        } catch (error) {
          console.error("Keycloak login failed", error);
          setIsLoggingIn(false);
        }
      }
    };

    handleLogin();
  }, [isAuthentication, isLoading, navigate, from, login, isLoggingIn]);

  // Loading state
  if (isLoading) {
    return (
      <div className="login-container">
        <div className="loading-spinner">Checking authentication...</div>
      </div>
    );
  }

  if (isLoggingIn) {
    return (
      <div className="login-container">
        <div className="loading-spinner">Logging in...</div>
      </div>
    );
  }

  // Fallback UI (shouldn't normally be seen)
  return (
    <div className="login-container">
      <div className="login-content">
        <h2>Login Required</h2>
        <p>Redirecting to login...</p>
      </div>
    </div>
  );
}

export default LoginComponent;