import apiClient from "@/api/axiosClient";

export const bookingService = {
  createBooking: (data) => apiClient.post("/api/v1/bookings", data),
  getMyBookings: (params) => apiClient.get("/api/v1/bookings", { params }),
  getBookingById: (id) => apiClient.get(`/api/v1/bookings/${id}`),
  cancelBooking: (id) => apiClient.patch(`/api/v1/bookings/${id}/cancel`),
  
  // Lấy bookings theo field ID và ngày (dùng cho lịch tuần)
  getBookingsByField: (fieldId, date) =>
    apiClient.get(`/api/v1/bookings/field/${fieldId}`, { params: { date } }),

  // Admin endpoints
  confirmBooking: (id) => apiClient.patch(`/api/v1/bookings/${id}/confirm`),
  completeBooking: (id) => apiClient.patch(`/api/v1/bookings/${id}/complete`),
  getAllBookings: (params) => apiClient.get("/api/v1/bookings/admin/all", { params }),

  // Check sân trống
  checkAvailability: (fieldId, date, startTime, endTime) => 
    apiClient.get(`/api/v1/bookings/check-availability`, { 
      params: { fieldId, date, startTime, endTime } 
    }),
};

