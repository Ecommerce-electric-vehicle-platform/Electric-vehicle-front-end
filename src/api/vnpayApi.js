// src/api/vnpayApi.js
import axiosInstance from "./axiosInstance";

const vnpayApi = {
    // Tạo URL thanh toán VNPay cho số tiền nạp (đơn vị: VND)
    createPayment: (amount) => {
        const returnUrl = `${window.location.origin}/vnpay/return`;
        const qs = new URLSearchParams({ amount: String(amount), returnUrl }).toString();
        // Theo Swagger, BE nhận amount ở query; body để trống
        return axiosInstance.post(`/api/v1/vnpay/create-payment?${qs}`);
    },

    // Gọi BE xác minh giao dịch từ các query params trả về
    handleReturn: (queryString) =>
        axiosInstance.get(`/api/v1/vnpay/return${queryString ? `?${queryString}` : ""}`),
};

export default vnpayApi;


