import apiClient from "@/api/axiosClient";

export const paymentService = {
  createPayment: (data) => apiClient.post("/api/v1/payments", data),
  getMyPayments: () => apiClient.get("/api/v1/payments"),
  getPaymentById: (id) => apiClient.get(`/api/v1/payments/${id}`),
  getPaymentByBooking: (bookingId) => apiClient.get(`/api/v1/payments/booking/${bookingId}`),
  
  // Admin endpoints
  confirmCashPayment: (id) => apiClient.patch(`/api/v1/payments/${id}/confirm-cash`),
};
