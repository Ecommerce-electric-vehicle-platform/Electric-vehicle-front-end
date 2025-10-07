// src/api/authApi.js
import axiosInstance from "./axiosInstance";

const authApi = {
    //Hello cac ban, toi la hacker, cac ban da bi hack
    signup: (data) => axiosInstance.post("/api/v1/auth/signup", data),
    signin: (data) => axiosInstance.post("/api/v1/auth/signin", data), // thêm dòng này
    verifyOtp: (data) => axiosInstance.post("/api/v1/auth/verify-otp", data),
};

export default authApi;
