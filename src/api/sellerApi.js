import axiosInstance from "./axiosInstance";

const sellerApi = {
  // ✅ Kiểm tra gói dịch vụ
  checkServicePackageValidity: async (username) => {
    try {
      const response = await axiosInstance.post(
        `/api/v1/seller/${username}/check-service-package-validity`
      );
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error checking service package:", error);
      throw error;
    }
  },

  // ✅ Lấy thông tin seller profile
  getSellerProfile: async () => {
    try {
      const response = await axiosInstance.get("/api/v1/seller/profile");
      const data = response?.data?.data || {};
      const sellerId = data.sellerId || data.id || data.seller?.id;
      return { ...response, data: { data: { ...data, sellerId } } };
    } catch (error) {
      console.error("[SellerAPI] Error fetching seller profile:", error);
      throw error;
    }
  },

  // ✅ Lấy thông tin seller theo sellerId (public)
  getSellerById: async (sellerId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/seller/${sellerId}`);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching seller by ID:", error);
      throw error;
    }
  },

  // ✅ Đăng tin bán sản phẩm (multipart/form-data)
  createPostProduct: async (formData, onUploadProgress) => {
    try {
      if (!(formData instanceof FormData)) {
        throw new Error("createPostProduct expects a FormData object");
      }

      const response = await axiosInstance.post(
        "/api/v1/seller/post-products",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (onUploadProgress && event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              onUploadProgress(percent);
            }
          },
        }
      );

      console.log("[SellerAPI] Created post successfully:", response.data);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error creating post product:", error);
      throw error;
    }
  },

  // ✅ Gửi yêu cầu xác minh bài đăng
  requestPostVerification: async (postId) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/seller/verified-post-product-request",
        { postId }
      );
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error requesting verification:", error);
      throw error;
    }
  },

  // ✅ Lấy danh sách bài đăng của seller
  getMyPosts: async (page = 0, size = 10) => {
    try {
      const response = await axiosInstance.get("/api/v1/seller/my-posts", {
        params: { page, size },
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching my posts:", error);
      throw error;
    }
  },

  // ✅ Cập nhật bài đăng
  updatePost: async (postId, productData) => {
    try {
      const response = await axiosInstance.put(
        `/api/v1/seller/posts/${postId}`,
        productData
      );
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error updating post:", error);
      throw error;
    }
  },

  // ✅ Xóa bài đăng
  deletePost: async (postId) => {
    try {
      const response = await axiosInstance.delete(
        `/api/v1/seller/posts/${postId}`
      );
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error deleting post:", error);
      throw error;
    }
  },

  // ✅ Lấy danh sách đơn hàng của seller
  getSellerOrders: async (page = 0, size = 10, status = '') => {
    try {
      const params = { page, size };
      if (status) params.status = status;
      const response = await axiosInstance.get('/api/v1/seller/orders', { params });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching seller orders:", error);
      throw error;
    }
  },

  // ✅ Lấy thông tin đơn hàng chi tiết
  getOrderDetails: async (orderId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/seller/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching order details:", error);
      throw error;
    }
  },

  // ✅ Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const response = await axiosInstance.patch(
        `/api/v1/seller/orders/${orderId}/status`,
        { status: newStatus }
      );
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error updating order status:", error);
      throw error;
    }
  },

  // ✅ Lấy thống kê seller
  getSellerStatistics: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/seller/statistics');
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching seller statistics:", error);
      throw error;
    }
  },
};

export default sellerApi;
