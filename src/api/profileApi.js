// src/api/profileApi.js
import axiosInstance from "./axiosInstance";

const profileApi = {

  // Lấy profile 
  getProfile: () => {
    return axiosInstance.get(`/api/v1/buyer/profile`);
  },

  uploadProfile: (formData) => {
    return axiosInstance.post(`/api/v1/buyer/upload-profile`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  //  Update profile — cũng không cần userId nếu backend dùng token
  updateProfile: (profileData) => {
    return axiosInstance.put(`/api/v1/buyer/update-profile`, profileData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  changePassword: (data) => {
    // data = { oldPassword, newPassword, confirmPassword }
    return axiosInstance.post("/api/v1/auth/change-password", data);
  },

  //  Gọi API verify KYC
  verifyKyc: (formData) => {
    // formData phải có:
    // storeName, taxNumber, identityNumber, front of identity, back of identity,
    // business license, store policy, selfie
    return axiosInstance.post("/api/v1/kyc/verify-kyc", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Lấy thông tin ví của user
  getWallet: () => {
    return axiosInstance.get('/api/v1/buyer/wallet');
  },
};


export default profileApi;
