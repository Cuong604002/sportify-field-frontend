import apiClient from "@/api/axiosClient";

export const notificationService = {
  getNotifications: async (page = 0, size = 10, search = "") => {
    const params = { page, size };
    if (search) params.search = search;
    const response = await apiClient.get("/api/v1/notifications", {
      params,
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get("/api/v1/notifications/unread-count");
    return response.data;
  },

  markAsRead: async (id) => {
    await apiClient.put(`/api/v1/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await apiClient.put("/api/v1/notifications/read-all");
  },
};

export default notificationService;
