import apiClient from "@/api/axiosClient";

export const dashboardService = {
  getBookingsDashboard: (params) => apiClient.get("/api/v1/dashboard/bookings", { params }),
  getPaymentsDashboard: (params) => apiClient.get("/api/v1/dashboard/payments", { params }),
};
