import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8080/',
  realm: 'jpdweb',
  clientId: 'webjpdapitest'
};

// Tạo instance nhưng chưa khởi tạo ngay
const keycloakInstance = new Keycloak(keycloakConfig);

let initPromise = null;
let isInitialized = false;

export const initKeycloak = async () => {
  if (!initPromise) {
    initPromise = keycloakInstance.init({
      onLoad: 'login-required',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    }).then(authenticated => {
      isInitialized = true;
      return authenticated;
    }).catch(error => {
      console.error('Keycloak init failed:', error);
      initPromise = null; // Reset để có thể thử lại
      throw error;
    });
  }
  return initPromise;
};

export const logOutkeycloak = () => {
  // Clear local storage
  localStorage.removeItem('kc_token');
  localStorage.removeItem('kc_refreshToken');
  localStorage.removeItem('kc_email');
  
  // Reset init state
  isInitialized = false;
  initPromise = null;
  
  // Gọi logout Keycloak
  if (keycloakInstance) {
    try {
      return keycloakInstance.logout({ 
        redirectUri: window.location.origin 
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: redirect về trang chủ
      window.location.href = window.location.origin;
      return Promise.resolve();
    }
  }
  return Promise.resolve();
};

// Helper function để kiểm tra và lấy instance
export const getKeycloakInstance = async () => {
  if (!isInitialized) {
    await initKeycloak();
  }
  return keycloakInstance;
};

export default keycloakInstance;