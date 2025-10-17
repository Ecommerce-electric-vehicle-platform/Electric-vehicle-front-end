// src/api/profileApi.js
import axiosInstance from "./axiosInstance";

const profileApi = {
  uploadProfile: (userId, formData) => {
    if (!userId) throw new Error("User ID is missing — please login again.");

    return axiosInstance.post(`/api/v1/buyer/${userId}/upload-profile`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateProfile: (userId, profileData) => {
    if (!userId) throw new Error("User ID is missing — please login again.");

    return axiosInstance.put(`/api/v1/buyer/${userId}/update-profile`, profileData);
  },
};

export default profileApi;
