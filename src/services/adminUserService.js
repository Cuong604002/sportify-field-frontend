import apiClient from "@/api/axiosClient";

export const adminUserService = {
  /**
   * GET /api/v1/auth/admin/users
   * @param {string} keyword - tìm kiếm theo username hoặc email
   * @param {number} page - trang (bắt đầu từ 0)
   * @param {number} size - số phần tử mỗi trang
   */
  getUsers: (keyword = "", page = 0, size = 20) =>
    apiClient.get("/api/v1/auth/admin/users", {
      params: { keyword: keyword || undefined, page, size },
    }),

  /**
   * PATCH /api/v1/auth/admin/users/{id}/status
   * @param {number} id - ID người dùng
   * @param {string} status - "ACTIVE" | "INACTIVE"
   */
  updateUserStatus: (id, status) =>
    apiClient.patch(`/api/v1/auth/admin/users/${id}/status`, { status }),
};
