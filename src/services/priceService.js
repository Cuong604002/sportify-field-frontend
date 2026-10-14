import apiClient from "@/api/axiosClient";

export const priceService = {
  // Admin endpoints
  getPrices: (params) => apiClient.get("/api/v1/prices", { params }),
  getPriceById: (id) => apiClient.get(`/api/v1/prices/${id}`),
  createPrice: (data) => apiClient.post("/api/v1/prices", data),
  updatePrice: (id, data) => apiClient.put(`/api/v1/prices/${id}`, data),
  deletePrice: (id) => apiClient.delete(`/api/v1/prices/${id}`),
  getPriceTable: (locationId, fieldTypeId) => apiClient.get("/api/v1/prices/table", { params: { locationId, fieldTypeId } }),
};
