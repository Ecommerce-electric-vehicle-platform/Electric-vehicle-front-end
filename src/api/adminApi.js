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


// ===== Users (Buyer & Seller) Management ===== //Gia định vì chưa có API
export const getAllUserAccounts = async (page = 0, size = 20, role, status) => {
  try {
    const params = { page, size };
    if (role) params.role = role;
    if (status) params.status = status;

    const res = await adminAxios.get(`/api/v1/admin/users`, { params });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    throw error;
  }
};

// Kích hoạt / vô hiệu hóa tài khoản Buyer hoặc Seller
export const toggleUserActive = async (userId, active) => {
  try {
    const res = await adminAxios.patch(`/api/v1/admin/users/${userId}/active`, {
      active,
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
    throw error;
  }
};


// ===== Disputes Management =====
export const listDisputes = async (page = 0, size = 10, status) => {
  try {
    const res = await adminAxios.get(`/api/v1/admin/disputes`, {
      params: { page, size, status },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách dispute:", error);
    throw error;
  }
};

export const resolveDispute = async (disputeId, resolution) => {
  try {
    const res = await adminAxios.post(
      `/api/v1/admin/disputes/${disputeId}/resolve`,
      { resolution }
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi xử lý dispute:", error);
    throw error;
  }
};
