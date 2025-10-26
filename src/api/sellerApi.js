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
      console.log("[SellerAPI] Package validity:", response.data);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error checking service package:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin seller profile
   * GET /api/v1/seller/profile
   * Dùng trong SignIn để xác định role
   */
  getSellerProfile: async () => {
    try {
      const response = await axiosInstance.get("/api/v1/seller/profile");

      // Chuẩn hóa dữ liệu trả về để luôn có sellerId
      const data = response?.data?.data || {};
      const sellerId = data.sellerId || data.id || data.seller?.id;

      if (sellerId) {
        console.log("[SellerAPI] Seller profile found:", sellerId);
        return { ...response, data: { data: { ...data, sellerId } } };
      } else {
        console.log("[SellerAPI] Not a seller account");
        return { data: { data: null } };
      }
    } catch (error) {
      console.error("[SellerAPI] Error fetching seller profile:", error);
      throw error;
    }
  },

  /**
   * Đăng tin bán sản phẩm
   * POST /api/v1/seller/post-products
   */
  createPostProduct: async (productData) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/seller/post-products",
        productData
      );
      console.log("[SellerAPI] Created post:", response.data);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error creating post product:", error);
      throw error;
    }
  },

  /**
   * Gửi yêu cầu xác minh bài đăng
   * POST /api/v1/seller/verified-post-product-request
   */
  requestPostVerification: async (postId) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/seller/verified-post-product-request",
        { postId }
      );
      console.log("[SellerAPI] Verification requested for post:", postId);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error requesting verification:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách bài đăng của seller
   * GET /api/v1/seller/my-posts?page={page}&size={size}
   */
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

  /**
   * Cập nhật bài đăng
   * PUT /api/v1/seller/posts/{postId}
   */
  updatePost: async (postId, productData) => {
    try {
      const response = await axiosInstance.put(
        `/api/v1/seller/posts/${postId}`,
        productData
      );
      console.log("[SellerAPI] Updated post:", postId);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error updating post:", error);
      throw error;
    }
  },

  /**
   * Xóa bài đăng
   * DELETE /api/v1/seller/posts/{postId}
   */
  deletePost: async (postId) => {
    try {
      const response = await axiosInstance.delete(
        `/api/v1/seller/posts/${postId}`
      );
      console.log("[SellerAPI] Deleted post:", postId);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error deleting post:", error);
      throw error;
    }
  },
};

export default sellerApi;
