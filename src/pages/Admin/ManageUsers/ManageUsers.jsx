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
  Eye,
  X,
} from "lucide-react";
import { getBuyerList, getSellerList, blockAccount } from "../../../api/adminApi";
import "./ManageUsers.css";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState(""); // "BUYER" | "SELLER"
  const [page, setPage] = useState(0);
  const [size] = useState(10); // Kích thước trang mặc định
  const [updateTrigger, setUpdateTrigger] = useState(0); // Trigger để force re-render
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Normalize dữ liệu buyer thành format chung
  const normalizeBuyer = (buyer) => {
    // Xác định active: kiểm tra active, blocked, hoặc status
    // Nếu có field active thì dùng, nếu không thì mặc định true
    // Nếu có field blocked = true thì active = false
    const isActive = buyer.active !== undefined 
      ? buyer.active 
      : buyer.blocked === true 
        ? false 
        : buyer.status === "BLOCKED" 
          ? false 
          : true; // Mặc định là active
    
    return {
      id: buyer.buyerId,
      userId: buyer.buyerId,
      fullName: buyer.fullName || buyer.username,
      username: buyer.username,
      email: buyer.email,
      role: "BUYER",
      active: isActive,
      status: buyer.status,
      blocked: buyer.blocked,
      createdAt: buyer.createdAt,
      // Giữ nguyên các field khác
      ...buyer,
    };
  };

  // Normalize dữ liệu seller thành format chung
  const normalizeSeller = (seller) => {
    // Xác định active dựa vào block/unblock, KHÔNG phải ACCEPTED
    // Nếu status = BLOCKED hoặc blocked = true thì inactive
    const isBlocked = seller.status === "BLOCKED" || seller.blocked === true;
    const isActive = !isBlocked;
    
    return {
      id: seller.sellerId,
      userId: seller.sellerId,
      buyerId: seller.buyerId, // Lưu buyerId để so sánh khi merge
      fullName: seller.sellerName || seller.storeName,
      storeName: seller.storeName,
      sellerName: seller.sellerName,
      email: seller.email || "N/A", // Seller có thể không có email trong response
      role: "SELLER",
      active: isActive,
      status: seller.status,
      blocked: seller.blocked,
      createdAt: seller.createAt || seller.createdAt,
      // Giữ nguyên các field khác
      ...seller,
    };
  };

  // Gộp buyer và seller của cùng một người
  const mergeBuyerAndSeller = (buyers, sellers) => {
    const mergedUsers = [];
    const sellerMap = new Map();
    
    // Tạo map để tìm seller nhanh - key là buyerId của seller
    // Vì seller có field buyerId để link với buyer
    sellers.forEach((seller) => {
      // Lưu seller với key là buyerId (không phải sellerId)
      // Seller có field buyerId để link với buyer
      const sellerBuyerId = seller.buyerId || seller.userId;
      if (sellerBuyerId) {
        sellerMap.set(sellerBuyerId, seller);
      }
    });

    // Xử lý buyers: kiểm tra xem có seller tương ứng không
    buyers.forEach((buyer) => {
      // So sánh buyerId của buyer với buyerId của seller
      // Nếu buyer.buyerId === seller.buyerId thì là cùng 1 người đã nâng cấp
      const buyerId = buyer.buyerId || buyer.id || buyer.userId;
      const correspondingSeller = sellerMap.get(buyerId);
      
      if (correspondingSeller) {
        // Buyer đã nâng cấp lên Seller - gộp thông tin
        // Trạng thái active phụ thuộc vào block/unblock, không phải ACCEPTED
        const isBlocked = correspondingSeller.status === "BLOCKED" || 
                         correspondingSeller.blocked === true ||
                         buyer.active === false;
        
        mergedUsers.push({
          ...buyer,
          hasUpgradedToSeller: true,
          sellerInfo: correspondingSeller,
          sellerId: correspondingSeller.sellerId,
          storeName: correspondingSeller.storeName,
          sellerStatus: correspondingSeller.status,
          // Active phụ thuộc vào block/unblock, không phải ACCEPTED
          active: !isBlocked && buyer.active !== false,
        });
        // Xóa seller khỏi map để không thêm lại
        sellerMap.delete(buyerId);
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
      // Xác định active dựa vào block/unblock, không phải ACCEPTED
      const isBlocked = seller.status === "BLOCKED" || seller.blocked === true;
      mergedUsers.push({
        ...seller,
        hasUpgradedToSeller: false,
        active: !isBlocked,
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
        console.log("Buyer data từ API:", buyers);
        normalizedItems = buyers.map(normalizeBuyer);
      } else if (filterRole === "SELLER") {
        // Gọi API lấy danh sách sellers
        const data = await getSellerList(page, size);
        const sellers = data?.data?.content || [];
        console.log("Seller data từ API:", sellers);
        normalizedItems = sellers.map(normalizeSeller);
      } else {
        // Nếu không có filter, lấy cả 2 danh sách và gộp lại
        const [buyersData, sellersData] = await Promise.all([
          getBuyerList(page, size),
          getSellerList(page, size),
        ]);
        
        const buyers = (buyersData?.data?.content || []).map(normalizeBuyer);
        const sellers = (sellersData?.data?.content || []).map(normalizeSeller);
        
        console.log("Buyers sau normalize:", buyers);
        console.log("Sellers sau normalize:", sellers);
        
        // Gộp buyer và seller của cùng một người
        normalizedItems = mergeBuyerAndSeller(buyers, sellers);
      }
      
      console.log("Users sau khi normalize và merge:", normalizedItems);
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
  }, [filterRole, page, size]);

  // Xử lý phím ESC để đóng modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && showDetailModal) {
        setShowDetailModal(false);
      }
    };

    if (showDetailModal) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showDetailModal]);

  // Block/Unblock account (cho cả Buyer và Seller)
  const handleToggleActive = async (user) => {
    console.log("handleToggleActive - User hiện tại:", user);
    
    // Xác định accountType và accountId
    let accountType = "buyer"; // Mặc định là buyer
    let accountId = user.id || user.userId;
    
    // Xác định trạng thái active hiện tại
    // Active/Inactive phụ thuộc vào block/unblock, KHÔNG phải ACCEPTED
    let isActive = user.active !== undefined ? user.active : true;
    
    if (user.hasUpgradedToSeller) {
      // Nếu đã nâng cấp lên seller, block/unblock seller account
      accountType = "seller";
      accountId = user.sellerId || user.sellerInfo?.sellerId || user.id;
      // Active phụ thuộc vào block/unblock, không phải ACCEPTED
      // Nếu status = BLOCKED hoặc blocked = true thì inactive
      const isBlocked = user.sellerStatus === "BLOCKED" || 
                       user.sellerInfo?.status === "BLOCKED" ||
                       user.sellerInfo?.blocked === true ||
                       user.active === false;
      isActive = !isBlocked;
    } else if (user.role === "SELLER") {
      // Seller thuần
      accountType = "seller";
      accountId = user.sellerId || user.id || user.userId;
      // Active phụ thuộc vào block/unblock, không phải ACCEPTED
      const isBlocked = user.status === "BLOCKED" || user.blocked === true;
      isActive = !isBlocked;
    }
    
    // Xác định action dựa vào trạng thái hiện tại
    // Nếu đang active → action = "block" (vô hiệu hóa)
    // Nếu đang inactive → action = "unblock" (kích hoạt lại)
    const action = isActive ? "block" : "unblock";
    const actionText = isActive ? "vô hiệu hóa" : "kích hoạt lại";
    
    console.log("Xác định action:", { 
      isActive, 
      action, 
      actionText, 
      accountType, 
      accountId,
      userActive: user.active,
      sellerStatus: user.sellerStatus,
      status: user.status
    });
    
    const confirmText = `Bạn có chắc muốn ${actionText} tài khoản ${accountType === "seller" ? "Seller" : "Buyer"} này?`;
    if (!window.confirm(confirmText)) return;

    // Prompt để nhập message (tùy chọn)
    const message = prompt(
      `Nhập lý do ${actionText} tài khoản (có thể để trống):`,
      isActive ? "Vi phạm chính sách" : "Đã giải quyết vấn đề"
    );

    // Nếu user cancel prompt, hủy action
    if (message === null) return;

    try {
      setLoading(true);
      console.log(`Bắt đầu ${actionText} account:`, { accountId, accountType, action });
      
      const response = await blockAccount(
        accountId,
        accountType,
        message || "",
        action
      );
      
      console.log(`API ${actionText} response:`, response);
      console.log("Danh sách users hiện tại:", users);
      console.log("User được chọn:", user);
      console.log("accountId để tìm:", accountId, "accountType:", accountType);
      
      // Kiểm tra xem API có thành công không (có thể success: false do lỗi mail nhưng account vẫn bị block)
      const isSuccess = response?.success === true || response?.message?.includes("SUCCESS");
      
      // Cập nhật state ngay lập tức để UI phản hồi nhanh (ngay cả khi có lỗi mail server)
      setUsers((prevUsers) => {
        console.log("Tìm user để cập nhật:", { accountId, accountType, action, prevUsersCount: prevUsers.length });
        
        const updatedUsers = prevUsers.map((u) => {
          // Kiểm tra xem có phải user đang được block/unblock không
          // Chuyển đổi sang string để so sánh (tránh lỗi type mismatch)
          const uId = String(u.id || u.userId || "");
          const uBuyerId = String(u.buyerId || "");
          const uSellerId = String(u.sellerId || "");
          const targetAccountId = String(accountId || "");
          
          let isTargetUser = false;
          
          if (accountType === "seller") {
            // Kiểm tra seller
            if (u.hasUpgradedToSeller) {
              isTargetUser = uSellerId === targetAccountId || uId === targetAccountId;
            } else if (u.role === "SELLER") {
              isTargetUser = uSellerId === targetAccountId || uId === targetAccountId;
            }
          } else if (accountType === "buyer") {
            // Kiểm tra buyer - so sánh với id, userId, hoặc buyerId
            isTargetUser = uId === targetAccountId || uBuyerId === targetAccountId;
          }
          
          if (isTargetUser) {
            console.log(`Tìm thấy user để cập nhật:`, {
              user: u,
              accountId: targetAccountId,
              accountType,
              action,
              userIds: { id: uId, buyerId: uBuyerId, sellerId: uSellerId }
            });
            
            if (accountType === "seller") {
              // Cập nhật seller status
              const newStatus = action === "block" ? "BLOCKED" : "ACCEPTED";
              const updatedUser = {
                ...u,
                status: u.hasUpgradedToSeller ? newStatus : (u.role === "SELLER" ? newStatus : u.status),
                sellerStatus: u.hasUpgradedToSeller ? newStatus : u.sellerStatus,
                active: newStatus === "ACCEPTED",
              };
              console.log("User sau khi cập nhật (seller):", updatedUser);
              return updatedUser;
            } else {
              // Cập nhật buyer active
              // action = "block" → active = false (Inactive)
              // action = "unblock" → active = true (Active)
              const newActive = action === "unblock";
              const updatedUser = {
                ...u,
                active: newActive,
                blocked: action === "block",
                status: action === "block" ? "BLOCKED" : (action === "unblock" ? "ACTIVE" : u.status),
              };
              console.log("User sau khi cập nhật (buyer):", {
                ...updatedUser,
                action,
                oldActive: u.active,
                newActive,
                statusChange: `${u.status} → ${updatedUser.status}`
              });
              // Tạo object mới hoàn toàn để đảm bảo React re-render
              return { ...updatedUser };
            }
          }
          return u;
        });
        
        // Kiểm tra xem có user nào được cập nhật không
        const hasUpdate = updatedUsers.some((u, index) => {
          const prevUser = prevUsers[index];
          return u !== prevUser || u.active !== prevUser?.active || u.status !== prevUser?.status;
        });
        console.log("Kết quả cập nhật:", { 
          hasUpdate, 
          updatedCount: updatedUsers.length,
          usersComparison: updatedUsers.map((u, i) => ({
            id: u.id,
            oldActive: prevUsers[i]?.active,
            newActive: u.active,
            changed: u.active !== prevUsers[i]?.active
          }))
        });
        
        // Tạo array mới để đảm bảo React detect thay đổi
        return [...updatedUsers];
      });
      
      // Force re-render bằng cách update trigger
      setUpdateTrigger((prev) => prev + 1);
      console.log("Update trigger:", updateTrigger + 1);
      
      // KHÔNG reload ngay vì API có thể không trả về field active/blocked
      // State đã được cập nhật ở trên, UI sẽ tự động cập nhật
      // KHÔNG reload tự động vì sẽ ghi đè lại state đã cập nhật
      // Chỉ reload khi user thực sự cần (refresh page, thay đổi filter, etc.)
      
      setLoading(false);
      
      // Hiển thị thông báo
      if (isSuccess) {
        alert(`Đã ${actionText} tài khoản thành công!`);
      } else {
        // Nếu có lỗi mail server nhưng account vẫn bị block
        alert(`Đã ${actionText} tài khoản nhưng có lỗi gửi email. Vui lòng kiểm tra lại.`);
      }
      
      // KHÔNG reload tự động vì:
      // 1. API /api/v1/buyer/list có thể không trả về field active/blocked sau khi block
      // 2. normalizeBuyer sẽ set lại active: true mặc định
      // 3. State đã cập nhật sẽ bị ghi đè
      // User có thể refresh page hoặc thay đổi filter nếu muốn reload từ server
      
    } catch (error) {
      setLoading(false);
      console.error(`Lỗi khi ${actionText} account:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || "Cập nhật trạng thái thất bại!";
      alert(errorMessage);
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
                      {filterRole === "SELLER" && (user.role === "SELLER" || user.hasUpgradedToSeller)
                        ? (user.storeName || user.sellerInfo?.storeName || "N/A")
                        : (user.email || "N/A")}
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
                      {(() => {
                        // Xác định trạng thái hiển thị
                        // Active/Inactive phụ thuộc vào block/unblock, KHÔNG phải ACCEPTED
                        let displayActive = user.active !== undefined ? user.active : true;
                        
                        if (user.hasUpgradedToSeller) {
                          // Buyer đã nâng cấp: active phụ thuộc vào block/unblock
                          const isBlocked = user.sellerStatus === "BLOCKED" || 
                                          user.sellerInfo?.status === "BLOCKED" ||
                                          user.active === false;
                          displayActive = !isBlocked;
                        } else if (user.role === "SELLER") {
                          // Seller thuần: active phụ thuộc vào block/unblock
                          const isBlocked = user.status === "BLOCKED" || user.blocked === true;
                          displayActive = !isBlocked;
                        }
                        
                        // Hiển thị Active/Inactive dựa vào block/unblock
                        return (
                          <CBadge color={displayActive ? "success" : "danger"}>
                            {displayActive ? "Active" : "Inactive"}
                          </CBadge>
                        );
                      })()}
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                        : "--"}
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2 align-items-center">
                        {(() => {
                          // Xác định active status đúng
                          // Active/Inactive phụ thuộc vào block/unblock, KHÔNG phải ACCEPTED
                          let isUserActive = user.active !== undefined ? user.active : true;
                          
                          if (user.hasUpgradedToSeller) {
                            // Buyer đã nâng cấp: active phụ thuộc vào block/unblock
                            // Nếu sellerStatus = BLOCKED hoặc active = false thì inactive
                            const isBlocked = user.sellerStatus === "BLOCKED" || 
                                            user.sellerInfo?.status === "BLOCKED" ||
                                            user.active === false;
                            isUserActive = !isBlocked;
                          } else if (user.role === "SELLER") {
                            // Seller thuần: active phụ thuộc vào block/unblock
                            const isBlocked = user.status === "BLOCKED" || user.blocked === true;
                            isUserActive = !isBlocked;
                          }
                          // Buyer thuần: dùng user.active từ normalizeBuyer

                          return (
                            <>
                              <CButton
                                size="sm"
                                color="info"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDetailModal(true);
                                }}
                              >
                                <Eye size={14} className="me-1" />
                                Chi tiết
                              </CButton>
                              <CButton
                                size="sm"
                                color={isUserActive ? "danger" : "success"}
                                variant="outline"
                                onClick={() => handleToggleActive(user)}
                              >
                                {isUserActive ? (
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
                            </>
                          );
                        })()}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Modal hiển thị chi tiết thông tin user */}
      {showDetailModal && selectedUser && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết thông tin người dùng</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-12">
                    <h6 className="text-primary mb-3">Thông tin cơ bản</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <th style={{ width: "30%" }}>ID:</th>
                            <td>{selectedUser.id || selectedUser.userId || "N/A"}</td>
                          </tr>
                          <tr>
                            <th>Tên người dùng:</th>
                            <td>{selectedUser.fullName || selectedUser.username || selectedUser.storeName || "N/A"}</td>
                          </tr>
                          <tr>
                            <th>Email:</th>
                            <td>{selectedUser.email || "N/A"}</td>
                          </tr>
                          <tr>
                            <th>Vai trò:</th>
                            <td>
                              <CBadge color={selectedUser.role === "SELLER" ? "success" : "secondary"}>
                                {selectedUser.role || "BUYER"}
                              </CBadge>
                              {selectedUser.hasUpgradedToSeller && (
                                <CBadge color="info" className="ms-2">
                                  Đã nâng cấp lên Seller
                                </CBadge>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Trạng thái:</th>
                            <td>
                              <CBadge color={selectedUser.active ? "success" : "danger"}>
                                {selectedUser.active ? "Active" : "Inactive"}
                              </CBadge>
                            </td>
                          </tr>
                          <tr>
                            <th>Ngày tham gia:</th>
                            <td>
                              {selectedUser.createdAt
                                ? new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Thông tin Buyer */}
                {selectedUser.role === "BUYER" && (
                  <div className="row mb-3">
                    <div className="col-12">
                      <h6 className="text-primary mb-3">Thông tin Buyer</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <th style={{ width: "30%" }}>Buyer ID:</th>
                              <td>{selectedUser.buyerId || selectedUser.id || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Username:</th>
                              <td>{selectedUser.username || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Full Name:</th>
                              <td>{selectedUser.fullName || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Phone Number:</th>
                              <td>{selectedUser.phoneNumber || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Gender:</th>
                              <td>{selectedUser.gender || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Date of Birth:</th>
                              <td>
                                {selectedUser.dob
                                  ? new Date(selectedUser.dob).toLocaleDateString("vi-VN")
                                  : "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <th>Address:</th>
                              <td>
                                {selectedUser.street || ""} {selectedUser.wardName || ""}{" "}
                                {selectedUser.districtName || ""} {selectedUser.provinceName || ""}
                                {!selectedUser.street && !selectedUser.wardName && !selectedUser.districtName && !selectedUser.provinceName && "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <th>Avatar URL:</th>
                              <td>
                                {selectedUser.avatarUrl ? (
                                  <a href={selectedUser.avatarUrl} target="_blank" rel="noopener noreferrer">
                                    Xem ảnh
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Thông tin Seller */}
                {(selectedUser.hasUpgradedToSeller || selectedUser.role === "SELLER") && (
                  <div className="row mb-3">
                    <div className="col-12">
                      <h6 className="text-primary mb-3">Thông tin Seller</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <th style={{ width: "30%" }}>Seller ID:</th>
                              <td>{selectedUser.sellerId || selectedUser.sellerInfo?.sellerId || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Store Name:</th>
                              <td>{selectedUser.storeName || selectedUser.sellerInfo?.storeName || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Seller Name:</th>
                              <td>{selectedUser.sellerName || selectedUser.sellerInfo?.sellerName || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Status:</th>
                              <td>
                                <CBadge
                                  color={
                                    selectedUser.sellerStatus === "ACCEPTED" ||
                                    selectedUser.sellerInfo?.status === "ACCEPTED"
                                      ? "success"
                                      : "warning"
                                  }
                                >
                                  {selectedUser.sellerStatus || selectedUser.sellerInfo?.status || selectedUser.status || "N/A"}
                                </CBadge>
                              </td>
                            </tr>
                            <tr>
                              <th>Tax Number:</th>
                              <td>{selectedUser.taxNumber || selectedUser.sellerInfo?.taxNumber || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Nationality:</th>
                              <td>{selectedUser.nationality || selectedUser.sellerInfo?.nationality || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Home Address:</th>
                              <td>{selectedUser.home || selectedUser.sellerInfo?.home || "N/A"}</td>
                            </tr>
                            <tr>
                              <th>Identity Front Image:</th>
                              <td>
                                {selectedUser.identityFrontImageUrl || selectedUser.sellerInfo?.identityFrontImageUrl ? (
                                  <a
                                    href={selectedUser.identityFrontImageUrl || selectedUser.sellerInfo?.identityFrontImageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Xem ảnh
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Identity Back Image:</th>
                              <td>
                                {selectedUser.identityBackImageUrl || selectedUser.sellerInfo?.identityBackImageUrl ? (
                                  <a
                                    href={selectedUser.identityBackImageUrl || selectedUser.sellerInfo?.identityBackImageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Xem ảnh
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Business License:</th>
                              <td>
                                {selectedUser.businessLicenseUrl || selectedUser.sellerInfo?.businessLicenseUrl ? (
                                  <a
                                    href={selectedUser.businessLicenseUrl || selectedUser.sellerInfo?.businessLicenseUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Xem ảnh
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Selfie Image:</th>
                              <td>
                                {selectedUser.selfieUrl || selectedUser.sellerInfo?.selfieUrl ? (
                                  <a
                                    href={selectedUser.selfieUrl || selectedUser.sellerInfo?.selfieUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Xem ảnh
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Store Policy URL:</th>
                              <td>
                                {selectedUser.storePolicyUrl || selectedUser.sellerInfo?.storePolicyUrl ? (
                                  <a
                                    href={selectedUser.storePolicyUrl || selectedUser.sellerInfo?.storePolicyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Xem chính sách
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <CButton color="secondary" onClick={() => setShowDetailModal(false)}>
                  Đóng
                </CButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
