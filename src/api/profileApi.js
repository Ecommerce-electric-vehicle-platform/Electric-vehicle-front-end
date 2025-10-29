// src/api/profileApi.js
import axiosInstance from "./axiosInstance";

const profileApi = {

  // get 3 address levels: provinces, districts, wards
  getAddressProvinces: () => {
    return axiosInstance.get(`/api/v1/shipping/provinces`);
  },
  getAddressDistricts: (provinceId) => {
    return axiosInstance.get(
      `/api/v1/shipping/districts?provinceId=${provinceId}`
    );
  },
  getAddressWards: (districtId) => {
    return axiosInstance.get(
      `/api/v1/shipping/wards?districtId=${districtId}`
    );
  },

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

  getIdentityInfoFromOCR: (imageFile) => {
    const formData = new FormData();
    // Key name MUST match backend @RequestPart("front_of_identity")
    formData.append("front_of_identity", imageFile);
    return axiosInstance.post( // Changed to POST based on your description, GET with multipart is unusual
      "/api/v1/kyc/identity-information",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  // Lấy trạng thái seller
  getSellerstatus: () => {
    return axiosInstance.get("/api/v1/seller/profile");
  },

  // Lấy thông tin ví của user
  getWallet: () => {
    return axiosInstance.get('/api/v1/buyer/wallet');
  },

  getAvailableSellerPackages: () => { // Đổi tên hàm
    return axiosInstance.get('/api/v1/packages/active'); // <<< Đổi endpoint
  },

  getCurrentSubscription: () => {
    return axiosInstance.get('/api/v1/packages/current-subscription');
  },


  signPackage: (purchaseData) => {
    // purchaseData = { packageId, priceId, price, durationByDay }
    console.log("API Call: Signing package with data:", purchaseData);
    return axiosInstance.post('/api/v1/packages/sign-package', purchaseData); // <<< Endpoint mới
    // return new Promise((resolve) => setTimeout(() => resolve({ data: { success: true, message: "Signed package (mock)" } }), 1000));
  },

  cancelSubscription: () => {
    console.log("API Call: Canceling current subscription...");
    // Endpoint POST mới để hủy gói hiện tại
    return axiosInstance.post('/api/v1/packages/cancel');
  },

  // === DISPUTE APIS ===
  // GET: Lấy danh sách các loại khiếu nại
  getDisputeCategories: () => {
    return axiosInstance.get('/api/v1/dispute-category/dispute-categories');
  },

  // POST: Gửi đơn khiếu nại (Multipart Form Data)
  raiseDispute: (formData) => {
    return axiosInstance.post('/api/v1/dispute/raise-dispute', formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

};


export default profileApi;
