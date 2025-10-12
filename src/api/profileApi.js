// src/api/profileApi.js
import axiosInstance from "./axiosInstance";

const profileApi = {
  uploadProfile: (userId, formData) => {
    const token = localStorage.getItem("token");

    return axiosInstance.post(`/api/v1/buyer/${userId}/upload-profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`,
      },
    });
  },

  updateProfile: (userId, profileData) => {
    const token = localStorage.getItem("token");

    return axiosInstance.put(`/api/v1/buyer/${userId}/update-profile`, profileData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
  },
};

export default profileApi;
