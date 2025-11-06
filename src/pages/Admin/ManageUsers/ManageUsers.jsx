import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
} from "@coreui/react";
import {
  Power,
  PowerOff,
} from "lucide-react";
import { getBuyerList, getSellerList, toggleUserActive } from "../../../api/adminApi";
import "./ManageUsers.css";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState(""); // "BUYER" | "SELLER"
  const [refresh, setRefresh] = useState(false);
  const [page, setPage] = useState(0);
  const [size] = useState(10); // Kích thước trang mặc định

  // Normalize dữ liệu buyer thành format chung
  const normalizeBuyer = (buyer) => ({
    id: buyer.buyerId,
    userId: buyer.buyerId,
    fullName: buyer.fullName || buyer.username,
    username: buyer.username,
    email: buyer.email,
    role: "BUYER",
    active: true, // Mặc định buyer là active nếu không có field
    createdAt: buyer.createdAt,
    // Giữ nguyên các field khác
    ...buyer,
  });

  // Normalize dữ liệu seller thành format chung
  const normalizeSeller = (seller) => ({
    id: seller.sellerId,
    userId: seller.sellerId,
    fullName: seller.sellerName || seller.storeName,
    storeName: seller.storeName,
    sellerName: seller.sellerName,
    email: seller.email || "N/A", // Seller có thể không có email trong response
    role: "SELLER",
    active: seller.status === "ACCEPTED", // Dựa vào status để xác định active
    status: seller.status,
    createdAt: seller.createAt || seller.createdAt,
    // Giữ nguyên các field khác
    ...seller,
  });

  // Gộp buyer và seller của cùng một người
  const mergeBuyerAndSeller = (buyers, sellers) => {
    const mergedUsers = [];
    const sellerMap = new Map();
    
    // Tạo map để tìm seller nhanh (dựa vào sellerId hoặc username/email)
    sellers.forEach((seller) => {
      // Lưu seller với key là sellerId
      sellerMap.set(seller.sellerId, seller);
    });

    // Xử lý buyers: kiểm tra xem có seller tương ứng không
    buyers.forEach((buyer) => {
      // Kiểm tra xem buyer này có seller account không (dựa vào buyerId trùng sellerId)
      const correspondingSeller = sellerMap.get(buyer.buyerId);
      
      if (correspondingSeller) {
        // Buyer đã nâng cấp lên Seller - gộp thông tin
        mergedUsers.push({
          ...buyer,
          hasUpgradedToSeller: true,
          sellerInfo: correspondingSeller,
          sellerId: correspondingSeller.sellerId,
          storeName: correspondingSeller.storeName,
          sellerStatus: correspondingSeller.status,
        });
        // Xóa seller khỏi map để không thêm lại
        sellerMap.delete(buyer.buyerId);
      } else {
        // Buyer chưa nâng cấp
        mergedUsers.push({
          ...buyer,
          hasUpgradedToSeller: false,
        });
      }
    });

    // Thêm các seller không có buyer account (nếu có)
    sellerMap.forEach((seller) => {
      mergedUsers.push({
        ...seller,
        hasUpgradedToSeller: false,
      });
    });

    return mergedUsers;
  };

  // Load danh sách Buyer & Seller
  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      let normalizedItems = [];
      
      if (filterRole === "BUYER") {
        // Gọi API lấy danh sách buyers
        const data = await getBuyerList(page, size);
        const buyers = data?.data?.content || [];
        normalizedItems = buyers.map(normalizeBuyer);
      } else if (filterRole === "SELLER") {
        // Gọi API lấy danh sách sellers
        const data = await getSellerList(page, size);
        const sellers = data?.data?.content || [];
        normalizedItems = sellers.map(normalizeSeller);
      } else {
        // Nếu không có filter, lấy cả 2 danh sách và gộp lại
        const [buyersData, sellersData] = await Promise.all([
          getBuyerList(page, size),
          getSellerList(page, size),
        ]);
        
        const buyers = (buyersData?.data?.content || []).map(normalizeBuyer);
        const sellers = (sellersData?.data?.content || []).map(normalizeSeller);
        
        // Gộp buyer và seller của cùng một người
        normalizedItems = mergeBuyerAndSeller(buyers, sellers);
      }
      
      setUsers(normalizedItems);
    } catch (e) {
      console.error("Lỗi khi tải danh sách người dùng:", e);
      setError(e?.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  // Reset page về 0 khi filterRole thay đổi
  useEffect(() => {
    setPage(0);
  }, [filterRole]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, refresh, page, size]);

  // ✅ Bật / tắt trạng thái người dùng (cho cả Buyer và Seller)
  const handleToggleActive = async (user) => {
    const confirmText = user.active
      ? "Bạn có chắc muốn vô hiệu hóa tài khoản này?"
      : "Bạn có chắc muốn kích hoạt lại tài khoản này?";
    if (!window.confirm(confirmText)) return;

    try {
      // Vô hiệu hóa account (cả buyer và seller)
      await toggleUserActive(user.id || user.userId, !user.active);
      setRefresh((prev) => !prev);
    } catch (error) {
      alert("Cập nhật trạng thái thất bại!");
      console.error(error);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-semibold m-0">Quản lý người dùng</h2>
        <select
          className="form-select w-auto"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
        </select>
      </div>

      <CCard className="shadow-sm mb-4">
        <CCardBody>
          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <CTable hover responsive>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Tên người dùng</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Vai trò</CTableHeaderCell>
                <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                <CTableHeaderCell>Ngày tham gia</CTableHeaderCell>
                <CTableHeaderCell>Thao tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={7}>Đang tải...</CTableDataCell>
                </CTableRow>
              ) : users.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7}>
                    Không có người dùng nào.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                users.map((user) => (
                  <CTableRow key={user.id || user.userId}>
                    <CTableDataCell>{user.id || user.userId}</CTableDataCell>
                    <CTableDataCell>
                      {user.fullName || user.username || user.storeName || "N/A"}
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.email || "N/A"}
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex flex-column gap-1">
                        <CBadge
                          color={user.role === "SELLER" ? "success" : "secondary"}
                        >
                          {user.role || "BUYER"}
                        </CBadge>
                        {user.hasUpgradedToSeller && (
                          <CBadge color="info" className="mt-1">
                            Đã nâng cấp lên Seller
                          </CBadge>
                        )}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.hasUpgradedToSeller && user.sellerStatus ? (
                        <CBadge 
                          color={user.sellerStatus === "ACCEPTED" ? "success" : "warning"}
                        >
                          {user.sellerStatus}
                        </CBadge>
                      ) : user.role === "SELLER" && user.status ? (
                        <CBadge 
                          color={user.status === "ACCEPTED" ? "success" : "warning"}
                        >
                          {user.status}
                        </CBadge>
                      ) : (
                        <CBadge color={user.active ? "success" : "danger"}>
                          {user.active ? "Active" : "Inactive"}
                        </CBadge>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                        : "--"}
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2 align-items-center">
                        {user.hasUpgradedToSeller ? (
                          <CButton
                            size="sm"
                            color={user.active ? "danger" : "success"}
                            variant="outline"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.active ? (
                              <>
                                <PowerOff size={14} className="me-1" />
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <Power size={14} className="me-1" />
                                Kích hoạt lại
                              </>
                            )}
                          </CButton>
                        ) : (
                          <CButton
                            size="sm"
                            color={user.active ? "danger" : "success"}
                            variant="outline"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.active ? (
                              <>
                                <PowerOff size={14} className="me-1" />
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <Power size={14} className="me-1" />
                                Kích hoạt lại
                              </>
                            )}
                          </CButton>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </div>
  );
}
