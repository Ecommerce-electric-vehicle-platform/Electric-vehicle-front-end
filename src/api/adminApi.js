import adminAxios from "./adminAxios";

/**
 * ================================
 * ADMIN - REVIEW POST SELLER
 * ================================
 */

// Lấy danh sách bài đăng cần review
// GET /api/v1/admin/review-post-seller-list?page=&size=
export const getReviewPostSellerList = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/review-post-seller-list`, {
      params: { page, size }, // gửi dạng query param
    });

    // đọc đúng key postList (L viết hoa)
    const list = res?.data?.data?.postList || [];
    const meta = res?.data?.data?.meta || {};
    return { list, meta };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài đăng cần review:", error);
    throw error;
  }
};


// Xem chi tiết bài đăng cần review
// GET /api/v1/admin/{postProductId}/post-details
export const getPostProductDetail = async (postProductId) => {
  try {
    const res = await adminAxios.get(
      `/api/v1/admin/${postProductId}/post-details`
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết bài đăng:", error);
    throw error;
  }
};

// Phê duyệt / từ chối bài đăng (review post decision)
// POST /api/v1/admin/review-post-product-decision
// Body: { employeeNumber, postProductId, passed, rejectedReason }
export const decidePostProduct = async ({
  employeeNumber,
  postProductId,
  passed,
  rejectedReason = "",
}) => {
  try {
    const res = await adminAxios.post(
      `/api/v1/admin/review-post-product-decision`,
      {
        employeeNumber,
        postProductId,
        passed,
        rejectedReason,
      }
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi phê duyệt / từ chối bài đăng:", error);
    throw error;
  }
};

/**
 * ================================
 * ADMIN MANAGEMENT (Super Admin)
 * ================================
 */

// Tạo admin mới
// POST /api/v1/admin/creating-admin
// Body: { employeeNumber, password, fullName, phoneNumber, email, gender }
export const createAdmin = async (payload) => {
  try {
    const res = await adminAxios.post(`/api/v1/admin/creating-admin`, payload);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi tạo admin:", error);
    throw error;
  }
};

// Lấy thông tin profile của admin hiện tại
// GET /api/v1/admin/profile
export const getAdminProfile = async () => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/profile`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin admin profile:", error);
    throw error;
  }
};

// Lấy danh sách admin có phân trang
// GET /api/v1/admin/list?page=&size=
export const getAdminList = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/list`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách admin:", error);
    throw error;
  }
};

// Lấy thông tin profile của admin theo accountId
// GET /api/v1/admin/profile/{accountId}
export const getAdminProfileById = async (accountId) => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/profile/${accountId}`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin admin profile:", error);
    throw error;
  }
};

/**
 * ================================
 * SELLER APPROVAL
 * ================================
 */

export const getPendingSellers = async (page = 0, size = 10) => {
  // Cho phép cấu hình endpoint qua ENV nếu BE khác path
  const pendingPath =
    import.meta.env.VITE_ADMIN_PENDING_SELLERS_PATH ||
    "/api/v1/admin/pending-seller";
  const res = await adminAxios.get(pendingPath, {
    params: { page, size },
  });
  return res.data;
};

// Phê duyệt / từ chối upgrade seller
export const approveSeller = async ({ sellerId, decision, message }) => {
  const res = await adminAxios.post(`/api/v1/admin/approve-seller`, {
    sellerId,
    decision,
    message,
  });
  return res.data;
};


// ===== Users (Buyer & Seller) Management ===== 
// GET /api/v1/buyer/list - Lấy danh sách buyers (yêu cầu ROLE_ADMIN)
export const getBuyerList = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/buyer/list`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách buyers:", error);
    throw error;
  }
};

// GET /api/v1/seller/list - Lấy danh sách sellers (yêu cầu ROLE_SELLER hoặc ROLE_ADMIN)
export const getSellerList = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/seller/list`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sellers:", error);
    throw error;
  }
};

// Block hoặc unblock account (Buyer, Seller, hoặc Admin)
// POST /api/v1/admin/block-account/{accountId}/{accountType}/{message}/{activity}
export const blockAccount = async (accountId, accountType, message, activity) => {
  try {
    // Encode message để tránh lỗi với ký tự đặc biệt trong URL
    const encodedMessage = encodeURIComponent(message || "");
    const res = await adminAxios.post(
      `/api/v1/admin/block-account/${accountId}/${accountType}/${encodedMessage}/${activity}`
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi block/unblock account:", error);
    throw error;
  }
};


// ===== Disputes Management =====
// GET /api/v1/dispute - Lấy danh sách pending disputes
export const getDisputes = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/dispute`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách dispute:", error);
    throw error;
  }
};

// GET /api/v1/dispute/resolved - Lấy danh sách resolved disputes
export const getResolvedDisputes = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/dispute/resolved`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách resolved disputes:", error);
    throw error;
  }
};

// GET /api/v1/dispute/{disputeId} - Lấy chi tiết một dispute
export const getDisputeDetail = async (disputeId) => {
  try {
    const res = await adminAxios.get(`/api/v1/dispute/${disputeId}`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết dispute:", error);
    throw error;
  }
};

// POST /api/v1/dispute/resolve - Đưa ra decision cho dispute
export const resolveDispute = async ({
  disputeId,
  decision,
  resolution,
  resolutionType,
  refundPercent,
}) => {
  try {
    const res = await adminAxios.post(`/api/v1/dispute/resolve`, {
      disputeId,
      decision, // ACCEPTED hoặc REJECTED
      resolution,
      resolutionType, // REFUND hoặc REJECTED
      refundPercent,
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi xử lý dispute:", error);
    throw error;
  }
};

// Giữ lại API cũ để tương thích (nếu cần)
export const listDisputes = getDisputes;

/**
 * ================================
 * DASHBOARD STATISTICS
 * ================================
 */

// GET /api/v1/seller/total-sellers - Lấy tổng số sellers (yêu cầu ROLE_ADMIN)
export const getTotalSellers = async () => {
  try {
    const res = await adminAxios.get(`/api/v1/seller/total-sellers`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy tổng số sellers:", error);
    throw error;
  }
};

// GET /api/v1/buyer/total-buyers - Lấy tổng số buyers (yêu cầu ROLE_ADMIN)
export const getTotalBuyers = async () => {
  try {
    const res = await adminAxios.get(`/api/v1/buyer/total-buyers`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy tổng số buyers:", error);
    throw error;
  }
};

// GET /api/v1/admin/total-new-post - Lấy tổng số bài đăng mới trong khoảng thời gian (yêu cầu ROLE_ADMIN)
// startDate và endDate phải theo định dạng yyyy-MM-dd
export const getTotalNewPosts = async (startDate, endDate) => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/total-new-post`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy tổng số bài đăng mới:", error);
    throw error;
  }
};

// GET /api/v1/packages/subscription-revenue - Lấy tổng doanh thu subscription (yêu cầu ROLE_ADMIN)
export const getSubscriptionRevenue = async () => {
  try {
    const res = await adminAxios.get(`/api/v1/packages/subscription-revenue`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy tổng doanh thu subscription:", error);
    throw error;
  }
};

/**
 * ================================
 * SYSTEM CONFIG MANAGEMENT
 * ================================
 */

// GET /api/v1/admin/system-config/{configKey} - Lấy cấu hình theo key
export const getSystemConfig = async (configKey) => {
  try {
    const res = await adminAxios.get(
      `/api/v1/admin/system-config/${configKey}`
    );
    return res.data;
  } catch (error) {
    console.error(`Lỗi khi lấy cấu hình ${configKey}:`, error);
    throw error;
  }
};

// PUT /api/v1/admin/system-config/{configKey} - Cập nhật cấu hình theo key (yêu cầu SUPER_ADMIN)
export const updateSystemConfig = async (configKey, configValue) => {
  try {
    // Đảm bảo configValue là string hoặc number
    const valueToSend = typeof configValue === 'string' ? configValue : configValue?.toString() || configValue;
    
    console.log("Updating System Config:", {
      configKey,
      configValue: valueToSend
    });

    const res = await adminAxios.put(
      `/api/v1/admin/system-config/${configKey}`,
      { configValue: valueToSend }
    );
    
    console.log("Update System Config Response:", res.data);
    return res.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật cấu hình ${configKey}:`, error);
    
    // Log chi tiết lỗi để debug
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
      console.error("Error headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    
    throw error;
  }
};

// GET /api/v1/admin/system-config/all-config?page=0&size=10 - Lấy tất cả cấu hình (có phân trang)
export const getAllSystemConfigs = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/system-config/all-config`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách cấu hình:", error);
    throw error;
  }
};

/**
 * ================================
 * SYSTEM WALLET (ESCROW) MANAGEMENT
 * ================================
 */

// GET /api/v1/admin/system-wallets?page=0&size=10 - Lấy danh sách escrow records
export const getEscrowRecords = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/system-wallets`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách escrow records:", error);
    throw error;
  }
};

// GET /api/v1/admin/system-wallets/solved?page=0&size=10 - Lấy danh sách solved system wallets
export const getSolvedSystemWallets = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/system-wallets/solved`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách solved system wallets:", error);
    throw error;
  }
};

// PUT /api/v1/admin/system-wallets/{systemWalletId}/end-at - Cập nhật endAt của escrow record (yêu cầu SUPER_ADMIN)
export const updateEscrowEndAt = async (systemWalletId, endAt) => {
  try {
    console.log("Updating Escrow EndAt:", {
      systemWalletId,
      endAt,
    });
    const res = await adminAxios.put(
      `/api/v1/admin/system-wallets/${systemWalletId}/end-at`,
      { endAt }
    );
    console.log("Update Escrow EndAt Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật endAt của escrow record:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    throw error;
  }
};

/**
 * ================================
 * SUBSCRIPTION PACKAGE MANAGEMENT
 * ================================
 */

// GET /api/v1/admin/subscription-packages - Lấy danh sách subscription packages (admin only)
export const getSubscriptionPackages = async (page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/subscription-packages`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách subscription packages:", error);
    throw error;
  }
};

// GET /api/v1/admin/subscription-packages/{packageId} - Lấy chi tiết subscription package
export const getSubscriptionPackageById = async (packageId) => {
  try {
    const res = await adminAxios.get(
      `/api/v1/admin/subscription-packages/${packageId}`
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết subscription package:", error);
    throw error;
  }
};

// POST /api/v1/admin/subscription-packages - Tạo subscription package mới (yêu cầu SUPER_ADMIN)
export const createSubscriptionPackage = async (packageData) => {
  try {
    console.log("Creating Subscription Package:", packageData);
    const res = await adminAxios.post(
      `/api/v1/admin/subscription-packages`,
      packageData
    );
    console.log("Create Subscription Package Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi tạo subscription package:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    throw error;
  }
};

// PUT /api/v1/admin/subscription-packages/{packageId} - Cập nhật subscription package (yêu cầu SUPER_ADMIN)
export const updateSubscriptionPackage = async (packageId, packageData) => {
  try {
    console.log("Updating Subscription Package:", {
      packageId,
      packageData,
    });
    const res = await adminAxios.put(
      `/api/v1/admin/subscription-packages/${packageId}`,
      packageData
    );
    console.log("Update Subscription Package Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật subscription package:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    throw error;
  }
};

//===============================CHI TIẾT DOANH THU CỦA TỪNG PACKAGE===============================
// GET /api/v1/admin/subscription-packages/statistics - Lấy thống kê tất cả packages
export const getPackageStatistics = async () => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/subscription-packages/statistics`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy thống kê packages:", error);
    throw error;
  }
};

// GET /api/v1/admin/subscription-packages/{packageId}/statistics - Lấy thống kê chi tiết một package
export const getPackageStatisticsById = async (packageId, includeSubscribers = false) => {
  try {
    const res = await adminAxios.get(
      `/api/v1/admin/subscription-packages/${packageId}/statistics`,
      {
        params: { includeSubscribers }
      }
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy thống kê package:", error);
    throw error;
  }
};

// GET /api/v1/admin/subscription-packages/{packageId}/subscribers - Lấy danh sách subscribers của một package
export const getPackageSubscribers = async (packageId, page = 0, size = 10) => {
  try {
    const res = await adminAxios.get(
      `/api/v1/admin/subscription-packages/${packageId}/subscribers`,
      {
        params: { page, size }
      }
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách subscribers:", error);
    throw error;
  }
};

/**
 * ================================
 * BAD WORDS MANAGEMENT (Super Admin)
 * ================================
 */

// GET /api/v1/admin/system-config/badwords - Lấy danh sách bad words (yêu cầu SUPER_ADMIN)
export const getBadWords = async () => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/system-config/badwords`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bad words:", error);
    throw error;
  }
};

// PUT /api/v1/admin/system-config/badwords - Cập nhật danh sách bad words (yêu cầu SUPER_ADMIN)
export const updateBadWords = async (badWords) => {
  try {
    console.log("Updating Bad Words:", badWords);
    const res = await adminAxios.put(
      `/api/v1/admin/system-config/badwords`,
      { badWords }
    );
    console.log("Update Bad Words Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật bad words:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    throw error;
  }
};

// GET /api/v1/admin/system-config/badwords/whitelist - Lấy danh sách whitelist words (yêu cầu SUPER_ADMIN)
export const getWhitelistWords = async () => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/system-config/badwords/whitelist`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách whitelist words:", error);
    throw error;
  }
};

// PUT /api/v1/admin/system-config/badwords/whitelist - Cập nhật danh sách whitelist words (yêu cầu SUPER_ADMIN)
export const updateWhitelistWords = async (badWords) => {
  try {
    console.log("Updating Whitelist Words:", badWords);
    const res = await adminAxios.put(
      `/api/v1/admin/system-config/badwords/whitelist`,
      { badWords }
    );
    console.log("Update Whitelist Words Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật whitelist words:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    throw error;
  }
};