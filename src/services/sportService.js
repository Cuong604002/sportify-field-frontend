import apiClient from "@/api/axiosClient";

export const sportService = {
  getSports: (params) => apiClient.get("/api/v1/sports", { params }),
  getSportById: (id) => apiClient.get(`/api/v1/sports/${id}`),
  getSportBySlug: (slug) => apiClient.get(`/api/v1/sports/slug/${slug}`),
  
  // Admin endpoints
  createSport: (data) => apiClient.post("/api/v1/sports", data),
  updateSport: (id, data) => apiClient.put(`/api/v1/sports/${id}`, data),
  deleteSport: (id) => apiClient.delete(`/api/v1/sports/${id}`),
};
