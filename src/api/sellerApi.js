// src/api/sellerApi.js
import axiosInstance from "./axiosInstance";

const sellerApi = {
  /**
   * Kiểm tra gói service package còn hạn không
   * POST /api/v1/seller/{username}/check-service-package-validity
   */
  checkServicePackageValidity: async (username) => {
    try {
      const response = await axiosInstance.post(
        `/api/v1/seller/${username}/check-service-package-validity`
      );
      return response;
    } catch (error) {
      console.error("Error checking service package validity:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin seller profile
   * GET /api/v1/seller/profile
   */
  getSellerProfile: async () => {
    try {
      const response = await axiosInstance.get("/api/v1/seller/profile");
      return response;
    } catch (error) {
      console.error("Error fetching seller profile:", error);
      throw error;
    }
  },

  /**
   * Đăng tin bán sản phẩm
   * POST /api/v1/seller/post-products
   * @param {Object} productData - Thông tin sản phẩm
   * @param {string} productData.sellerId
   * @param {string} productData.title
   * @param {string} productData.brand
   * @param {string} productData.model
   * @param {number} productData.manufacturerYear
   * @param {string} productData.usedDuration
   * @param {string} productData.color
   * @param {number} productData.price
   * @param {string} productData.length
   * @param {string} productData.width
   * @param {string} productData.height
   * @param {string} productData.weight
   * @param {string} productData.description
   * @param {string} productData.locationTrading
   * @param {Array<string>} productData.pictures - Array of image URLs
   */
  createPostProduct: async (productData) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/seller/post-products",
        productData
      );
      return response;
    } catch (error) {
      console.error("Error creating post product:", error);
      throw error;
    }
  },

  /**
   * Gửi yêu cầu xác minh bài đăng
   * POST /api/v1/seller/verified-post-product-request
   * @param {number} postId - ID của bài đăng
   */
  requestPostVerification: async (postId) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/seller/verified-post-product-request",
        { postId }
      );
      return response;
    } catch (error) {
      console.error("Error requesting post verification:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách bài đăng của seller
   * (Giả định có API này, nếu không thì cần BE bổ sung)
   */
  getMyPosts: async (page = 0, size = 10) => {
    try {
      const response = await axiosInstance.get("/api/v1/seller/my-posts", {
        params: { page, size },
      });
      return response;
    } catch (error) {
      console.error("Error fetching my posts:", error);
      throw error;
    }
  },

  /**
   * Cập nhật bài đăng
   * (Giả định có API này)
   */
  updatePost: async (postId, productData) => {
    try {
      const response = await axiosInstance.put(
        `/api/v1/seller/posts/${postId}`,
        productData
      );
      return response;
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  },

  /**
   * Xóa bài đăng
   * (Giả định có API này)
   */
  deletePost: async (postId) => {
    try {
      const response = await axiosInstance.delete(
        `/api/v1/seller/posts/${postId}`
      );
      return response;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },
};

export default sellerApi;

