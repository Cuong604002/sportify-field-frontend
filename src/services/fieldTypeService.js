import apiClient from "@/api/axiosClient";

export const fieldTypeService = {
  getFieldTypes: (params) => apiClient.get("/api/v1/field-types", { params }),
  getFieldTypeById: (id) => apiClient.get(`/api/v1/field-types/${id}`),
  createFieldType: (data) => apiClient.post("/api/v1/field-types", data),
  updateFieldType: (id, data) => apiClient.put(`/api/v1/field-types/${id}`, data),
  deleteFieldType: (id) => apiClient.delete(`/api/v1/field-types/${id}`),
};
