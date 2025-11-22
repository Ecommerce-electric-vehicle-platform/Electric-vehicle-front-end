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
      console.log('[sellerApi.getMyPosts] Calling API /api/v1/seller/seller-post with params:', { page, size, sort: `${sortBy},${sortDirection}` });
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
      const posts = response?.data?.data?.content || [];
      console.log('[sellerApi.getMyPosts] Response received:', {
        totalPosts: posts.length,
        sellerIds: posts.map(p => p.sellerId || p.seller_id || 'N/A').filter((v, i, a) => a.indexOf(v) === i), // Unique sellerIds
        firstPostSellerId: posts[0]?.sellerId || posts[0]?.seller_id || 'N/A'
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

  // Ẩn sản phẩm theo postId (dùng cho Seller)
hidePostById: async (postId) => {
  try {
    const accessToken = localStorage.getItem("accessToken");
    const response = await axiosInstance.post(
      `/api/v1/seller/hide/${postId}?is_hide=true`,
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

// Hiện lại sản phẩm theo postId (dùng cho Seller)
unhidePostById: async (postId) => {
  try {
    const accessToken = localStorage.getItem("accessToken");
    const response = await axiosInstance.post(
      `/api/v1/seller/hide/${postId}?is_hide=false`,
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


  //============= HIỂN THỊ ĐƠN HÀNG BÊN PHÍA SELLER ============================
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


  //=======================LẤY REVIEW TỪ BUYER ĐỂ SELLER XEM========================

  // Lấy tất cả reviews cho orders của seller hiện tại
  // API: GET /api/v1/seller/reviews?page=0&size=10
  getSellerReviews: async (page = 0, size = 10) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get('/api/v1/seller/reviews', {
        params: { page, size },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching seller reviews:", error);
      throw error;
    }
  },

  //=======================CÁC TRẠNG THÁI CỦA ĐƠN HÀNG========================
  // Lấy các đơn hàng đang giao (DELIVERING status)
  // API: GET /api/v1/seller/delivering-orders?page=0&size=10
  getDeliveringOrders: async (page = 0, size = 10) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get('/api/v1/seller/delivering-orders', {
        params: { page, size },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching delivering orders:", error);
      throw error;
    }
  },

  // Lấy các đơn hàng đã hoàn thành (COMPLETED status)
  // API: GET /api/v1/seller/completed-orders?page=0&size=10
  getCompletedOrders: async (page = 0, size = 10) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get('/api/v1/seller/completed-orders', {
        params: { page, size },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching completed orders:", error);
      throw error;
    }
  },
//==============SELLER DASHBOARD=====================================

  // Lấy tổng số đơn hàng của seller hiện tại (tất cả status)
  // API: GET /api/v1/seller/total-order?page=0&size=10
  // Response: { success: true, data: { orders: [...], totalOrders: 27, currentPage: 0, totalPages: 3, pageSize: 10 } }
  getTotalOrders: async (page = 0, size = 10) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get('/api/v1/seller/total-order', {
        params: { page, size },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching total orders:", error);
      throw error;
    }
  },

  // Lấy tổng doanh thu của seller hiện tại
  // API: GET /api/v1/seller/total-revenue
  getTotalRevenue: async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get('/api/v1/seller/total-revenue', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching total revenue:", error);
      throw error;
    }
  },

  // Lấy tổng số đơn hàng đang chờ của seller hiện tại
  // API: GET /api/v1/seller/total-pending-order
  getTotalPendingOrders: async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get('/api/v1/seller/total-pending-order', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching total pending orders:", error);
      throw error;
    }
  },
//=======================LẤY SỐ LƯỢNG SẢN PHẨM ĐANG BÁN - SELLER DASHBOARD LUÔN========================
  // Lấy tổng số sản phẩm đang bán (active posts) của seller hiện tại
  // API: GET /api/v1/seller/active-post
  getActivePosts: async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get('/api/v1/seller/active-post', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error fetching active posts:", error);
      throw error;
    }
  },

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
      console.log('[sellerApi.getSellerByProductId] Raw response data:', raw);
      return {
        sellerId: raw.sellerId || raw.id,
        buyerId: raw.buyerId || raw.buyer_id, // Thêm buyerId nếu có
        storeName: raw.storeName,
        sellerName: raw.sellerName,
        status: raw.status,
        home: raw.home,
        nationality: raw.nationality,
        // Giữ nguyên tất cả các field khác để tránh mất dữ liệu
        ...raw
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
    if (!sellerId) {
      console.warn('[sellerApi.getProductsBySeller] No sellerId provided');
      return [];
    }
    try {
      const requestParams = { sellerId, ...params };
      console.log('[sellerApi.getProductsBySeller] Request params:', requestParams);
      const response = await axiosInstance.get(`/api/v1/post-product`, { params: requestParams });
      // Tìm array phù hợp
      const data = response?.data?.data || response?.data || {};
      const products = data.postList || data.content || data.items || data.list || (Array.isArray(data) ? data : []);
      console.log('[sellerApi.getProductsBySeller] Response data structure:', {
        hasData: !!data,
        hasPostList: !!data.postList,
        hasContent: !!data.content,
        productsCount: Array.isArray(products) ? products.length : 0
      });
      
      // Normalize products để đảm bảo có field sold và isSold
      // API có thể trả về sold, isSold, hoặc is_sold
      const normalizedProducts = Array.isArray(products) ? products.map(product => {
        // Ưu tiên trường sold từ backend, fallback về isSold/is_sold
        const soldValue = product.sold !== undefined ? product.sold :
                         product.isSold !== undefined ? product.isSold : 
                         product.is_sold !== undefined ? product.is_sold : 
                         false;
        
        const soldBoolean = Boolean(soldValue === true || soldValue === 1 || soldValue === "true");
        
        return {
          ...product,
          sold: soldBoolean, // Trường sold chính (ưu tiên)
          isSold: soldBoolean, // Giữ lại để tương thích
          is_sold: soldBoolean // Giữ lại cả snake_case để tương thích
        };
      }) : [];
      
      if (normalizedProducts.length > 0) {
        console.log('[sellerApi.getProductsBySeller] First product sellerId:', normalizedProducts[0].sellerId || normalizedProducts[0].seller_id || 'N/A');
        console.log('[sellerApi.getProductsBySeller] First product sold fields:', {
          sold: normalizedProducts[0].sold,
          isSold: normalizedProducts[0].isSold,
          is_sold: normalizedProducts[0].is_sold,
          originalSold: products[0]?.sold,
          originalIsSold: products[0]?.isSold,
          originalIs_sold: products[0]?.is_sold
        });
      }
      
      return normalizedProducts;
    } catch (error) {
      if ([401, 403, 404].includes(error?.response?.status)) {
        console.warn('[sellerApi.getProductsBySeller] Auth error:', error?.response?.status);
        return [];
      }
      console.error('[sellerApi.getProductsBySeller] Error:', error);
      return [];
    }
  },
  //================API TÍCH HỢP AI========================
  // AI: Tạo mô tả sản phẩm tự động bằng AI
  // API: POST /api/v1/ai/content-upload-post-description
  // Request: multipart/form-data với file (ảnh) và data (JSON string chứa thông tin sản phẩm)
  generateAIDescription: async (productInfo, imageFile) => {
    try {
      // Kiểm tra file có hợp lệ không
      if (!imageFile || !(imageFile instanceof File)) {
        throw new Error("File ảnh không hợp lệ hoặc chưa được chọn");
      }

      const formData = new FormData();
      
      // Append file với tên field là "pictures" theo yêu cầu của backend
      formData.append("pictures", imageFile);
      
      // Validate categoryId (BẮT BUỘC theo BE)
      if (!productInfo.categoryId) {
        throw new Error("categoryId is required for AI description generation");
      }

      // Append từng field riêng biệt vào FormData (cùng cấp với pictures)
      // LƯU Ý: Backend expect "manufactureYear" (không có 'r'), không phải "manufacturerYear"
      // Mỗi field là một entry riêng, KHÔNG gom vào JSON string
      
      formData.append("title", productInfo.title || "");
      formData.append("brand", productInfo.brand || "");
      formData.append("model", productInfo.model || "");
      formData.append("manufactureYear", parseInt(productInfo.manufacturerYear) || new Date().getFullYear());
      formData.append("usedDuration", productInfo.usedDuration || "");
      // Đã xóa field color - không gửi lên backend
      formData.append("price", parseFloat(productInfo.price) || 0);
      formData.append("conditionLevel", productInfo.conditionLevel || "");
      formData.append("locationTrading", productInfo.locationTrading || "");
      formData.append("categoryId", parseInt(productInfo.categoryId)); // BẮT BUỘC
      
      // Thêm dimensions nếu có
      if (productInfo.length) formData.append("length", productInfo.length);
      if (productInfo.width) formData.append("width", productInfo.width);
      if (productInfo.height) formData.append("height", productInfo.height);
      if (productInfo.weight) formData.append("weight", productInfo.weight);
      
      // Log để debug
      console.log("[SellerAPI] Calling AI API...");
      console.log("[SellerAPI] Image file:", {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type
      });
      console.log("[SellerAPI] FormData entries (mỗi field riêng biệt):");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `[File: ${value.name}]` : value);
      }
      
      const response = await axiosInstance.post(
        "/api/v1/ai/content-upload-post-description",
        formData,
        {
          headers: {
            // Không set Content-Type, để browser tự set với boundary
          },
          timeout: 60000 // 60 seconds timeout cho AI processing
        }
      );
      
      console.log("[SellerAPI] AI response:", response.data);
      return response;
    } catch (error) {
      console.error("[SellerAPI] Error generating AI description:", error);
      console.error("[SellerAPI] Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      throw error;
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


  // =======================THEO DÕI SELLER TỪ BUYER========================
  // API: POST /api/v1/buyer/follow/{sellerId}
  followSeller: async (sellerId) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.post(
        `/api/v1/buyer/follow/${sellerId}`,
        {}, // Body rỗng
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      // Trả về toàn bộ data để lấy field "success" và "message"
      return response.data; 
    } catch (error) {
      console.error("[SellerAPI] Error following seller:", error);
      throw error;
    }
  },

  // 2. Hủy theo dõi Seller
  // API: DELETE /api/v1/buyer/follow/{sellerId}
  unfollowSeller: async (sellerId) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.delete(
        `/api/v1/buyer/follow/${sellerId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error("[SellerAPI] Error unfollowing seller:", error);
      throw error;
    }
  },

  // 3. Kiểm tra trạng thái (đã follow chưa)
  // API: GET /api/v1/buyer/follow/{sellerId}/status
  checkFollowStatus: async (sellerId) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axiosInstance.get(
        `/api/v1/buyer/follow/${sellerId}/status`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      return response.data; 
    } catch (error) {
      console.error("[SellerAPI] Error checking follow status:", error);
      throw error;
    }
  },

};



export default sellerApi;
