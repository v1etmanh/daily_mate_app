import { apiclient } from "./BaseApi";
import keycloak from "./KeycloakService";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor để handle token expiry
apiclient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, queue request này
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiclient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshed = await keycloak.updateToken(0); // Force refresh
        
        if (refreshed) {
          const newToken = keycloak.token;
          
          // Update localStorage
          localStorage.setItem('kc_token', newToken);
          localStorage.setItem('kc_refreshToken', keycloak.refreshToken);
          
          // Update default header
          apiclient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiclient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear tokens và redirect to login
        localStorage.removeItem('kc_token');
        localStorage.removeItem('kc_refreshToken');
        delete apiclient.defaults.headers.common['Authorization'];
        
        // Trigger logout (có thể dispatch action hoặc reload page)
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiclient;