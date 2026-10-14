import apiClient from "@/api/axiosClient";

export const authService = {
  login: (data) => apiClient.post("/api/v1/auth/login", data),
  register: (data) => apiClient.post("/api/v1/auth/register", data),
  refreshToken: (refreshToken) =>
    apiClient.post("/api/v1/auth/refresh", { refreshToken }),
  getMe: () => apiClient.get("/api/v1/auth/me"),
  updateMe: (data) => apiClient.put("/api/v1/auth/me", data),
};
