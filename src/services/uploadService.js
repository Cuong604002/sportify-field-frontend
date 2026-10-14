import apiClient from "@/api/axiosClient";

export const uploadService = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/api/v1/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
