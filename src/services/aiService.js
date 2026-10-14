import apiClient from "@/api/axiosClient";

export const aiService = {
  /**
   * Gửi tin nhắn tới AI chatbot
   * @param {string} message - Nội dung tin nhắn
   * @param {string|null} sessionId - ID phiên hội thoại (null = tạo mới)
   */
  chat: (message, sessionId = null) =>
    apiClient.post("/api/v1/ai/chat", { message, sessionId }),

  /**
   * Lấy lịch sử hội thoại
   * @param {string} sessionId
   */
  getHistory: (sessionId) =>
    apiClient.get(`/api/v1/ai/chat/${sessionId}/history`),

  /**
   * Xóa phiên hội thoại
   * @param {string} sessionId
   */
  clearSession: (sessionId) =>
    apiClient.delete(`/api/v1/ai/chat/${sessionId}`),
};
