import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const setAuthHeader = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const setupInterceptors = (setToken, logout) => {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (
        error.response?.status === 401 && 
        error.response?.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          const res = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
          const { accessToken } = res.data;
          
          setToken(accessToken);
          setAuthHeader(accessToken);
          
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          logout();
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
};

export default api;
