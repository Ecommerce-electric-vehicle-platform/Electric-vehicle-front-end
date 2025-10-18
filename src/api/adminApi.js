import axiosInstance from "./axiosInstance";

// API dashboard admin
export const getAdminDashboardStats = async (page = 0, size = 10) => {
  try {
    const res = await axiosInstance.get(`/api/v1/admin`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu dashboard:", error);
    throw error;
  }
};

// Lấy danh sách bài đăng seller cần duyệt (chờ xét duyệt)
export const getPendingSellerPosts = async () => {
  try {
    const res = await axiosInstance.get(`/api/v1/admin/review-post-product-seller`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài đăng seller:", error);
    throw error;
  }
};

// Phê duyệt hoặc từ chối bài đăng seller
export const approveSeller = async (sellerId, decision = "OK", reason) => {
  try {
    const body = reason ? { sellerId, decision, reason } : { sellerId, decision };
    const res = await axiosInstance.post(`/api/v1/admin/approve-seller`, body);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi duyệt seller:", error);
    throw error;
  }
};

// ===== Quản trị viên (is_super admin) =====
export const listAdmins = async (page = 0, size = 10) => {
  try {
    const res = await axiosInstance.get(`/api/v1/admin/super-admins`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách admin:", error);
    throw error;
  }
};

export const createAdmin = async (payload) => {
  try {
    const res = await axiosInstance.post(`/api/v1/admin/super-admins`, payload);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi tạo admin:", error);
    throw error;
  }
};

export const toggleAdminActive = async (adminId, active) => {
  try {
    const res = await axiosInstance.patch(
      `/api/v1/admin/super-admins/${adminId}/active`,
      { active }
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái admin:", error);
    throw error;
  }
};

// ===== Buyers pending approval =====
export const getPendingBuyers = async (page = 0, size = 10) => {
  try {
    const res = await axiosInstance.get(`/api/v1/admin/buyers/pending`, {
      params: { page, size },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách buyer chờ duyệt:", error);
    throw error;
  }
};

// ===== Disputes =====
export const listDisputes = async (page = 0, size = 10, status) => {
  try {
    const res = await axiosInstance.get(`/api/v1/admin/disputes`, {
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
    const res = await axiosInstance.post(`/api/v1/admin/disputes/${disputeId}/resolve`, {
      resolution,
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi xử lý dispute:", error);
    throw error;
  }
};