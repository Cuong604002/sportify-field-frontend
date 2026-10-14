import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearAuth } from "@/utils/token";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const userInfoStr = localStorage.getItem("sportify_user_info");
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo && userInfo.id) {
          config.headers["X-User-Id"] = userInfo.id.toString();
        }
      } catch (e) {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 / refresh token and auto-unwrap ApiResponse
apiClient.interceptors.response.use(
  (response) => {
    // API Spec: { success: boolean, message: string, data: any }
    // We unwrap it so callers using response.data get the actual payload directly
    if (response.data && typeof response.data === "object" && "success" in response.data) {
      if (response.data.data !== undefined) {
        response.data = response.data.data;
      } else if (response.data.success && response.data.data === null) {
        response.data = null;
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");
        
        // Call refresh endpoint directly using a new axios instance to avoid interceptor loops
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080"}/api/v1/auth/refresh`,
          { refreshToken }
        );
        
        // Handle unwrapping manually since we're using raw axios here
        const tokenPayload = data.data !== undefined ? data.data : data;
        
        setTokens(tokenPayload.accessToken, tokenPayload.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${tokenPayload.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
