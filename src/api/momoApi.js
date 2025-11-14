// src/api/momoApi.js
import axiosInstance from "./axiosInstance";

const momoApi = {
    // Tạo URL thanh toán MoMo cho số tiền nạp (đơn vị: VND)
    // POST /api/v1/momo/create-payment?amount={amount}
    // Theo API documentation, amount nằm trong query params
    // Nhưng có thể backend cần returnUrl trong body hoặc cả hai
    createPayment: (amount) => {
        const returnUrl = `${window.location.origin}/momo/return`;
        
        // Gửi amount trong query params (theo API documentation)
        const qs = new URLSearchParams({ 
            amount: String(amount)
        }).toString();
        
        // Gửi POST với amount trong query và returnUrl trong body (nếu backend cần)
        // Hoặc chỉ query params nếu backend chỉ cần amount
        return axiosInstance.post(`/api/v1/momo/create-payment?${qs}`, {
            returnUrl: returnUrl
        });
    },

    // Xử lý callback return từ MoMo
    // GET /api/v1/momo/return?{queryString}
    handleReturn: (queryString) =>
        axiosInstance.get(`/api/v1/momo/return${queryString ? `?${queryString}` : ""}`),
};

export default momoApi;

