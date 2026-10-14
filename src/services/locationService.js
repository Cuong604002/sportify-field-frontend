import apiClient from "@/api/axiosClient";

export const locationService = {
  getLocations: (params) => apiClient.get("/api/v1/locations", { params }),
  getLocationById: (id) => apiClient.get(`/api/v1/locations/${id}`),
  
  // Admin endpoints
  createLocation: (data) => apiClient.post("/api/v1/locations", data),
  updateLocation: (id, data) => apiClient.put(`/api/v1/locations/${id}`, data),
  deleteLocation: (id) => apiClient.delete(`/api/v1/locations/${id}`),
};
