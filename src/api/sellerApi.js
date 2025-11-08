import axiosInstance from "./axiosInstance";

const sellerApi = {
  // Kiểm tra gói dịch vụ còn hạn hay không, hay chưa mua gói dịch vụ
  checkServicePackageValidity: async (username) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.post(
        `/api/v1/seller/${username}/check-service-package-validity`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error checking service package:", error);
      throw error;
    }
  },

  // Lấy thông tin seller profile (của seller đang authenticated)
  // API: GET /api/v1/seller/profile (không cần sellerId, lấy từ JWT token)
  getSellerProfile: async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get(`/api/v1/seller/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!response?.data?.success || !response.data?.data) return null;
      return response.data.data;
    } catch (error) {
      if ([401, 403, 404].includes(error?.response?.status)) return null;
      console.error('[sellerApi] Error in getSellerProfile', error);
      return null;
    }
  },

  // Lấy thông tin seller theo sellerId (chưa sử dụng - chỉ thêm nếu cần)
  // API: GET /api/v1/seller/{sellerId}
  getSellerById: async (sellerId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/seller/${sellerId}`);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching seller by ID:", error);
      throw error;
    }
  },

  // Đăng tin bán sản phẩm (multipart/form-data)
  createPostProduct: async (formData, onUploadProgress) => {
    try {
      if (!(formData instanceof FormData)) {
        throw new Error("createPostProduct expects a FormData object");
      }

      // KHÔNG set Content-Type và Authorization thủ công
      // Interceptor sẽ tự động:
      // - Xóa Content-Type để axios set với boundary
      // - Thêm Authorization header từ tokenManager
      const response = await axiosInstance.post(
        "/api/v1/seller/post-products",
        formData,
        {
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

   //============= PHẨN QUẢN LÝ TIN ĐĂNG ============================
  // Gửi yêu cầu xác minh bài đăng
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

  // Lấy danh sách bài đăng của seller (đã filter theo seller)
  getMyPosts: async (page = 0, size = 10, sortBy = 'postId', sortDirection = 'desc') => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get('/api/v1/seller/seller-post', {
        params: {
          page,
          size,
          sort: `${sortBy},${sortDirection}` // Spring Boot format: "postId,desc"
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching my posts:", error);
      throw error;
    }
  },

  // Cập nhật bài đăng sản phẩm bằng postId (dùng cho Seller)
// API yêu cầu: PUT /api/v1/post-product/{postId} với multipart/form-data
// Request body: FormData với các field: title, brand, model, manufactureYear, usedDuration, 
//               conditionLevel, price, width, height, length, weight, description, 
//               locationTrading, categoryId, pictures (URLs hoặc Files)
updatePostById: async (postId, productData, existingImageUrls = []) => {
  try {
    // Tạo FormData từ productData
    // LƯU Ý: Authorization header sẽ được axios interceptor tự động thêm
    const formData = new FormData();
    
    // Nếu productData đã là FormData, sử dụng trực tiếp
    if (productData instanceof FormData) {
      // Copy tất cả entries từ FormData cũ
      for (let [key, value] of productData.entries()) {
        if (key === "pictures" && value instanceof File) {
          // Giữ nguyên File objects
          formData.append("pictures", value);
        } else if (key !== "pictures") {
          // Copy các field khác
          formData.append(key, value);
        }
      }
    } else {
      // Nếu là object, chuyển đổi sang FormData
      Object.entries(productData).forEach(([key, value]) => {
        if (key === "pictures" && Array.isArray(value)) {
          // Xử lý pictures array
          value.forEach((pic) => {
            if (pic instanceof File) {
              formData.append("pictures", pic);
            } else if (pic && typeof pic === 'string') {
              // Nếu là URL string, append như string
              formData.append("pictures", pic);
            }
          });
        } else if (value !== undefined && value !== null && value !== '') {
          // Append các field khác
          formData.append(key, value);
        }
      });
    }
    
    // Kết hợp URLs ảnh cũ (nếu có)
    if (existingImageUrls && existingImageUrls.length > 0) {
      existingImageUrls.forEach((url) => {
        if (url && typeof url === 'string') {
          formData.append("pictures", url);
        }
      });
    }
    
    // Debug: Log FormData contents
    const formDataEntries = [];
    for (let [key, value] of formData.entries()) {
      formDataEntries.push({
        key,
        value: value instanceof File ? `[File: ${value.name}]` : value
      });
    }
    console.log("[SellerAPI] FormData entries:", formDataEntries);
    
    // Gọi API PUT với multipart/form-data
    // Endpoint theo Swagger: PUT /api/v1/post-product/{postId}
    // Backend expect:
    // - @ModelAttribute UpdatePostProductRequest (form fields riêng lẻ: title, brand, model, etc.)
    // - @RequestPart("pictures") List<MultipartFile> files (files với name "pictures")
    // 
    // QUAN TRỌNG: 
    // - KHÔNG set Content-Type thủ công! Axios sẽ tự động set với boundary cho multipart/form-data
    // - Authorization header sẽ được interceptor tự động thêm (từ tokenManager.getValidToken())
    // - Interceptor sẽ tự động lấy token từ tokenManager.getValidToken() và thêm vào header
    console.log("[SellerAPI] Calling PUT /api/v1/post-product/" + postId);
    console.log("[SellerAPI] Using multipart/form-data");
    console.log("[SellerAPI] Authorization will be handled by axios interceptor");
    
    const response = await axiosInstance.put(
      `/api/v1/seller/${postId}`,
      formData
      // KHÔNG set headers ở đây - để interceptor xử lý Authorization và axios xử lý Content-Type
    );
    
    console.log("[SellerAPI] Update response:", response.data);
    return response;
  } catch (error) {
    console.error("[SellerAPI] Error updating product post:", error);
    console.error("[SellerAPI] Error response:", error?.response?.data);
    console.error("[SellerAPI] Error status:", error?.response?.status);
    console.error("[SellerAPI] Error config:", {
      url: error?.config?.url,
      method: error?.config?.method,
      headers: error?.config?.headers
    });
    throw error;
  }
},

  // Ẩn bài đăng
  hidePost: async (postId) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.post(
        `/api/v1/post-product/hide/${postId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error hiding post:", error);
      throw error;
    }
  },

  // Lấy thông tin seller theo postId
  getSellerByPostId: async (postId) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get(
        `/api/v1/post-product/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching seller by post ID:", error);
      throw error;
    }
  },

  //============= HIỂN THỊ TRÊN TRANG HOME============================
  // Lấy danh sách tất cả sản phẩm (có phân trang và sắp xếp)
  getAllPosts: async (page = 0, size = 10, sortBy = 'id', isAsc = true) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get('/api/v1/post-product', {
        params: { page, size, sort_by: sortBy, is_asc: isAsc },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching all posts:", error);
      throw error;
    }
  },

  // Lấy danh sách đơn hàng của seller
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

  // Lấy thông tin đơn hàng chi tiết
  getOrderDetails: async (orderId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/seller/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching order details:", error);
      throw error;
    }
  },

  // Cập nhật trạng thái đơn hàng
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

  // Lấy danh sách đơn hàng đang chờ xử lý (pending orders)
  getPendingOrders: async (page = 0, size = 10) => {
    try {
      const response = await axiosInstance.get('/api/v1/seller/pending-orders', {
        params: { page, size }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching pending orders:", error);
      throw error;
    }
  },

  // Xác nhận (verify) một đơn hàng đang chờ
  verifyOrder: async (orderId) => {
    try {
      const response = await axiosInstance.post(`/api/v1/seller/verify-order/${orderId}`);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error verifying order:", error);
      throw error;
    }
  },

  // Lấy thống kê seller
  getSellerStatistics: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/seller/statistics');
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching seller statistics:", error);
      throw error;
    }
  },


  //===============MOCK API===============
  // Lấy doanh thu theo tháng (7 ngày gần nhất)
  getMonthlyRevenue: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/seller/revenue/monthly');
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching monthly revenue:", error);
      throw error;
    }
  },

  // Lấy top sản phẩm bán chạy
  getTopProducts: async (limit = 5) => {
    try {
      const response = await axiosInstance.get('/api/v1/seller/products/top', {
        params: { limit }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching top products:", error);
      throw error;
    }
  },

  // Lấy doanh thu analytics theo thời gian (day/week/month)
  getRevenueAnalytics: async (timeFilter = 'month') => {
    try {
      const response = await axiosInstance.get('/api/v1/seller/revenue/analytics', {
        params: { period: timeFilter }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching revenue analytics:", error);
      throw error;
    }
  },

  // Lấy báo cáo theo danh mục
  getReportsByCategory: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/seller/reports/category');
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching reports by category:", error);
      throw error;
    }
  },

  // Lấy báo cáo theo khu vực
  getReportsByRegion: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/seller/reports/region');
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching reports by region:", error);
      throw error;
    }
  },
  //=============== KẾT THÚC MOCK API===============



  //==============POST PRODUCT API==============
  // Lấy seller theo postId
  getSellerByProductId: async (postId) => {
    if (!postId) {
      console.warn('[sellerApi] getSellerByProductId called with null/undefined postId');
      return null;
    }

    // Validate postId - phải là số nguyên dương hoặc string hợp lệ
    const pidStr = String(postId).trim();
    const pidNum = Number(pidStr);

    if (isNaN(pidNum) || pidNum <= 0 || !Number.isInteger(pidNum)) {
      console.error('[sellerApi] Invalid postId format:', postId, 'Type:', typeof postId);
      return null;
    }

    try {
      const response = await axiosInstance.get(`/api/v1/post-product/${pidNum}/seller`);
      if (!response?.data?.success || !response.data?.data) return null;
      const raw = response.data.data;
      return {
        sellerId: raw.sellerId,
        storeName: raw.storeName,
        sellerName: raw.sellerName,
        status: raw.status,
        home: raw.home,
        nationality: raw.nationality
      };
    } catch (error) {
      if ([401, 403, 404].includes(error?.response?.status)) {
        console.warn('[sellerApi] seller not found or permission:', error?.response?.status);
        return null;
      }
      console.error('[sellerApi] Error in getSellerByProductId', error);
      return null;
    }
  },
  // (Tuỳ chọn) Lấy sản phẩm theo sellerId
  getProductsBySeller: async (sellerId, params = {}) => {
    if (!sellerId) return [];
    try {
      const response = await axiosInstance.get(`/api/v1/post-product`, { params: { sellerId, ...params } });
      // Tìm array phù hợp
      const data = response?.data?.data || response?.data || {};
      const products = data.postList || data.content || data.items || data.list || (Array.isArray(data) ? data : []);
      return Array.isArray(products) ? products : [];
    } catch (error) {
      if ([401, 403, 404].includes(error?.response?.status)) return [];
      console.error('[sellerApi] Error in getProductsBySeller', error);
      return [];
    }
  },

  // Lấy một post cụ thể theo postId (dùng cho EditPost)
  // Sử dụng API list posts và filter theo postId (vì API GET by ID bị lỗi 500)
  // LƯU Ý: KHÔNG gọi trực tiếp GET /api/v1/seller/{postId} vì endpoint này không tồn tại
  // Endpoint /api/v1/seller/{id} chỉ dùng để lấy seller info (getSellerById), không phải post info
  getPostById: async (postId, sellerId = null) => {
    if (!postId) {
      throw new Error("Thiếu postId");
    }
    try {
      console.log(`[sellerApi.getPostById] Loading post ${postId}...`);
      
      let finalSellerId = sellerId;
      
      // Nếu không có sellerId, lấy từ profile
      if (!finalSellerId) {
        console.log(`[sellerApi.getPostById] Getting seller profile...`);
        const sellerProfile = await sellerApi.getSellerProfile();
        if (!sellerProfile || !sellerProfile.sellerId) {
          throw new Error("Không thể lấy thông tin seller. Vui lòng đăng nhập lại!");
        }
        finalSellerId = sellerProfile.sellerId;
        console.log(`[sellerApi.getPostById] Seller ID: ${finalSellerId}`);
      }
      
      // Lấy danh sách posts của seller (KHÔNG gọi GET /api/v1/seller/{postId})
      console.log(`[sellerApi.getPostById] Fetching products for seller ${finalSellerId}...`);
      const products = await sellerApi.getProductsBySeller(finalSellerId, { page: 0, size: 100 });
      console.log(`[sellerApi.getPostById] Found ${products.length} products`);
      
      // Tìm post theo postId
      const post = products.find(
        (p) => String(p?.postId || p?.id || p?.post_id) === String(postId)
      );
      
      if (!post) {
        console.error(`[sellerApi.getPostById] Post ${postId} not found in seller's products`);
        throw new Error(`Không tìm thấy bài đăng với ID: ${postId}. Có thể bài đăng không thuộc về seller này.`);
      }
      
      console.log(`[sellerApi.getPostById] Found post:`, post);
      return post;
    } catch (error) {
      console.error('[sellerApi.getPostById] Error:', error);
      throw error;
    }
  },

  // Ẩn sản phẩm theo postId (dùng cho Seller/Admin)
hidePostById: async (postId) => {
  try {
    const accessToken = localStorage.getItem("accessToken");
    const response = await axiosInstance.post(
      `/api/v1/post-product/hide/${postId}?is_hide=true`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    return response;
  } catch (error) {
    console.error("[SellerAPI] Error hiding post by id:", error);
    throw error;
  }
},

// Hiện lại sản phẩm theo postId (dùng cho Seller/Admin)
unhidePostById: async (postId) => {
  try {
    const accessToken = localStorage.getItem("accessToken");
    const response = await axiosInstance.post(
      `/api/v1/post-product/hide/${postId}?is_hide=false`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    return response;
  } catch (error) {
    console.error("[SellerAPI] Error unhiding post by id:", error);
    throw error;
  }
},


};

export default sellerApi;
