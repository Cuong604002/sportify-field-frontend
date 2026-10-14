import apiClient from "@/api/axiosClient";

export const fieldService = {
  getFields: (params) => apiClient.get("/api/v1/fields", { params }),
  getFieldById: (id) => apiClient.get(`/api/v1/fields/${id}`),
  checkAvailability: (id, params) => 
    apiClient.get(`/api/v1/fields/${id}/availability`, { params }),
  calculatePrice: (id, params) => 
    apiClient.get(`/api/v1/fields/${id}/price`, { params }),
  
  // Admin endpoints
  createField: (data) => apiClient.post("/api/v1/fields", data),
  updateField: (id, data) => apiClient.put(`/api/v1/fields/${id}`, data),
  updateFieldStatus: (id, status) => 
    apiClient.patch(`/api/v1/fields/${id}/status`, null, { params: { status } }),
  deleteField: (id) => apiClient.delete(`/api/v1/fields/${id}`),

  // Field Types
  getFieldTypes: (params) => apiClient.get("/api/v1/field-types", { params }),
  getFieldTypeById: (id) => apiClient.get(`/api/v1/field-types/${id}`),
  createFieldType: (data) => apiClient.post("/api/v1/field-types", data),
  updateFieldType: (id, data) => apiClient.put(`/api/v1/field-types/${id}`, data),
  deleteFieldType: (id) => apiClient.delete(`/api/v1/field-types/${id}`),
};
