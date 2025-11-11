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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CAlert,
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
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [toggleReason, setToggleReason] = useState("");
  const [toggleAction, setToggleAction] = useState(null); // { accountType, accountId, action, actionText, isActive }
  const [isToggling, setIsToggling] = useState(false);

  // Normalize dữ liệu buyer thành format chung
  const normalizeBuyer = (buyer) => {
    // Backend đã trả về field active, dùng trực tiếp
    // Nếu không có active, fallback về blocked hoặc status
    const isActive = buyer.active !== undefined 
      ? Boolean(buyer.active)  // Dùng trực tiếp từ API
      : buyer.blocked === true 
        ? false 
        : buyer.status === "BLOCKED" 
          ? false 
          : true; // Mặc định là active
    
    return {
      // Giữ nguyên các field khác trước
      ...buyer,
      // Sau đó override các field cần thiết
      id: buyer.buyerId,
      userId: buyer.buyerId,
      fullName: buyer.fullName || buyer.username,
      username: buyer.username,
      email: buyer.email,
      role: "BUYER",
      active: isActive, // Đảm bảo active được set đúng từ API
      status: buyer.status,
      blocked: buyer.blocked,
      createdAt: buyer.createdAt,
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
        // Ưu tiên dùng active từ buyer (đã được normalize từ API)
        // Nếu seller bị blocked thì cũng inactive
        const isSellerBlocked = correspondingSeller.status === "BLOCKED" || 
                                correspondingSeller.blocked === true;
        // Active = buyer.active && !sellerBlocked
        const finalActive = buyer.active === false ? false : !isSellerBlocked;
        
        mergedUsers.push({
          ...buyer,
          hasUpgradedToSeller: true,
          sellerInfo: correspondingSeller,
          sellerId: correspondingSeller.sellerId,
          storeName: correspondingSeller.storeName,
          sellerStatus: correspondingSeller.status,
          // Dùng active từ buyer (từ API), nhưng nếu seller bị block thì cũng inactive
          active: finalActive,
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

  // Mở modal xác nhận vô hiệu hóa/kích hoạt lại
  const handleToggleActiveClick = (user) => {
    console.log("handleToggleActiveClick - User hiện tại:", user);
    
    // Xác định accountType và accountId
    let accountType = "buyer"; // Mặc định là buyer
    let accountId = user.id || user.userId;
    
    // Dùng trực tiếp user.active từ API (đã được normalize)
    // Backend đã trả về active, không cần logic phức tạp
    let isActive = user.active === true;
    
    if (user.hasUpgradedToSeller) {
      // QUAN TRỌNG: User đã nâng cấp lên seller
      // is_active nằm trong bảng buyer, nên cần block/unblock buyer account
      // Không block seller vì seller chỉ có status (ACCEPTED/BLOCKED), không có is_active
      accountType = "buyer";
      accountId = user.buyerId || user.id || user.userId;
      // Dùng active từ user (đã được merge từ buyer và seller)
      isActive = user.active === true;
      console.log("⚠️ User đã nâng cấp lên seller - sẽ block/unblock buyer account:", {
        buyerId: accountId,
        sellerId: user.sellerId,
        reason: "is_active nằm trong bảng buyer"
      });
    } else if (user.role === "SELLER") {
      // Seller thuần
      accountType = "seller";
      accountId = user.sellerId || user.id || user.userId;
      // Dùng active từ user (đã được normalize từ API)
      isActive = user.active === true;
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
    
    // Lưu thông tin vào state
    setUserToToggle(user);
    setToggleAction({
      accountType,
      accountId,
      action,
      actionText,
      isActive
    });
    setToggleReason(isActive ? "Vi phạm chính sách" : "Đã giải quyết vấn đề");
    setShowToggleModal(true);
  };

  // Block/Unblock account (cho cả Buyer và Seller)
  const handleToggleActive = async () => {
    if (!userToToggle || !toggleAction) return;
    
    const { accountId, accountType, action, actionText } = toggleAction;
    const message = toggleReason || "";

    try {
      setIsToggling(true);
      setError("");
      console.log(`Bắt đầu ${actionText} account:`, { accountId, accountType, action });
      
      console.log(`🔵 Gọi API ${actionText}:`, {
        accountId,
        accountType,
        action,
        message: message || "",
        fullUser: userToToggle
      });
      
      const response = await blockAccount(
        accountId,
        accountType,
        message || "",
        action
      );
      
      console.log(`✅ API ${actionText} response:`, response);
      console.log("📋 Request details:", {
        accountId,
        accountType,
        action,
        url: `/api/v1/admin/block-account/${accountId}/${accountType}/${encodeURIComponent(message || "")}/${action}`
      });
      
      // Kiểm tra xem API có thành công không (có thể success: false do lỗi mail nhưng account vẫn bị block)
      const isSuccess = response?.success === true || response?.message?.includes("SUCCESS");
      
      if (!isSuccess) {
        console.warn("⚠️ API response không thành công:", response);
      }
      
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
            // Kiểm tra seller (chỉ seller thuần, không phải buyer đã nâng cấp)
            if (u.role === "SELLER" && !u.hasUpgradedToSeller) {
              isTargetUser = uSellerId === targetAccountId || uId === targetAccountId;
            }
          } else if (accountType === "buyer") {
            // Kiểm tra buyer - bao gồm cả buyer thuần và buyer đã nâng cấp
            // So sánh với id, userId, hoặc buyerId
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
            
            if (accountType === "seller" && !u.hasUpgradedToSeller) {
              // Seller thuần (không phải buyer đã nâng cấp)
              // Cập nhật seller status
              const newStatus = action === "block" ? "BLOCKED" : "ACCEPTED";
              const updatedUser = {
                ...u,
                status: newStatus,
                active: newStatus === "ACCEPTED",
              };
              console.log("User sau khi cập nhật (seller thuần):", updatedUser);
              return updatedUser;
            } else {
              // Buyer hoặc Buyer đã nâng cấp lên Seller
              // Cập nhật buyer active (vì is_active nằm trong bảng buyer)
              // action = "block" → active = false (Inactive)
              // action = "unblock" → active = true (Active)
              const newActive = action === "unblock";
              const updatedUser = {
                ...u,
                active: newActive,
                blocked: action === "block",
                status: action === "block" ? "BLOCKED" : (action === "unblock" ? "ACTIVE" : u.status),
                // Nếu là buyer đã nâng cấp, cũng cập nhật sellerStatus
                ...(u.hasUpgradedToSeller && {
                  sellerStatus: action === "block" ? "BLOCKED" : "ACCEPTED"
                })
              };
              console.log("User sau khi cập nhật (buyer hoặc buyer đã nâng cấp):", {
                ...updatedUser,
                action,
                oldActive: u.active,
                newActive,
                statusChange: `${u.status} → ${updatedUser.status}`,
                hasUpgradedToSeller: u.hasUpgradedToSeller
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
      
      // Đóng modal và reset state
      setShowToggleModal(false);
      setUserToToggle(null);
      setToggleAction(null);
      setToggleReason("");
      
      // Hiển thị thông báo
      if (isSuccess) {
        alert(`Đã ${actionText} tài khoản thành công!`);
      } else {
        // Nếu có lỗi mail server nhưng account vẫn bị block
        alert(`Đã ${actionText} tài khoản nhưng có lỗi gửi email. Vui lòng kiểm tra lại.`);
      }
      
      // Reload lại dữ liệu từ server sau khi block/unblock
      // Tăng thời gian delay để đảm bảo backend đã cập nhật database xong
      // Đặc biệt quan trọng với unblock vì có thể backend cần thời gian xử lý
      setTimeout(() => {
        console.log("🔄 Reloading users after block/unblock to sync with database...");
        loadUsers();
        
        // Kiểm tra xem database đã được cập nhật chưa sau khi reload
        setTimeout(() => {
          console.log("🔄 Second reload to ensure database sync...");
          loadUsers();
          
          // Kiểm tra lại sau khi state đã được cập nhật
          setTimeout(() => {
            setUsers((currentUsers) => {
              // Kiểm tra lại user sau khi reload
              const reloadedUser = currentUsers.find(u => {
                const uId = String(u.id || u.userId || "");
                const uBuyerId = String(u.buyerId || "");
                const uSellerId = String(u.sellerId || "");
                const targetId = String(accountId || "");
                
                if (accountType === "seller") {
                  // Chỉ seller thuần (không phải buyer đã nâng cấp)
                  return (u.role === "SELLER" && !u.hasUpgradedToSeller && (uSellerId === targetId || uId === targetId));
                } else {
                  // Buyer hoặc buyer đã nâng cấp
                  return uId === targetId || uBuyerId === targetId;
                }
              });
              
              if (reloadedUser) {
                const expectedActive = action === "unblock";
                const actualActive = reloadedUser.active === true;
                
                console.log("🔍 Kiểm tra database sync:", {
                  accountId,
                  accountType,
                  action,
                  expectedActive,
                  actualActive,
                  userActive: reloadedUser.active,
                  synced: expectedActive === actualActive,
                  reloadedUser
                });
                
                if (expectedActive !== actualActive) {
                  console.error("❌ Database chưa được cập nhật! Backend có thể có vấn đề.", {
                    expected: expectedActive,
                    actual: actualActive,
                    user: reloadedUser,
                    requestUrl: `/api/v1/admin/block-account/${accountId}/${accountType}/${encodeURIComponent(message || "")}/${action}`
                  });
                  alert(`⚠️ Cảnh báo: Database có thể chưa được cập nhật sau khi ${actionText}.\n\nVui lòng:\n1. Kiểm tra lại database\n2. Kiểm tra backend logs\n3. Thử lại sau vài giây`);
                } else {
                  console.log("✅ Database đã được cập nhật thành công!");
                }
              } else {
                console.warn("⚠️ Không tìm thấy user sau khi reload:", { accountId, accountType });
              }
              
              return currentUsers; // Không thay đổi state, chỉ kiểm tra
            });
          }, 500);
        }, 1500);
      }, 1000); // Tăng từ 500ms lên 1000ms để đảm bảo backend xử lý xong
      
    } catch (error) {
      console.error(`Lỗi khi ${actionText} account:`, error);
      setError(error?.response?.data?.message || error?.message || "Cập nhật trạng thái thất bại!");
    } finally {
      setIsToggling(false);
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
                        className={user.role === "SELLER" ? "role-seller-badge" : "role-buyer-badge"}
                      >
                        {user.role || "BUYER"}
                      </CBadge>
                        {user.hasUpgradedToSeller && (
                          <CBadge className="role-upgraded-badge mt-1">
                            Đã nâng cấp lên Seller
                          </CBadge>
                        )}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      {(() => {
                        // Dùng trực tiếp user.active từ API (đã được normalize)
                        const displayActive = user.active === true;
                        
                        return (
                          <CBadge className={displayActive ? "status-active-badge" : "status-inactive-badge"}>
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
                          // Dùng trực tiếp user.active từ API (đã được normalize)
                          // Backend đã trả về active, không cần logic phức tạp
                          const isUserActive = user.active === true;

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
                                onClick={() => handleToggleActiveClick(user)}
                                disabled={loading || isToggling}
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

      {/* Modal xác nhận vô hiệu hóa/kích hoạt lại */}
      <CModal visible={showToggleModal} onClose={() => !isToggling && setShowToggleModal(false)}>
        <CModalHeader>
          <CModalTitle>
            {toggleAction && toggleAction.actionText === "vô hiệu hóa" 
              ? "Vô hiệu hóa tài khoản" 
              : "Kích hoạt lại tài khoản"}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}
          {userToToggle && toggleAction && (
            <>
              <div className="mb-3">
                <strong>Thông tin tài khoản:</strong>
                <ul className="mt-2 mb-0">
                  <li><strong>Họ tên:</strong> {userToToggle.fullName || "N/A"}</li>
                  <li><strong>Email:</strong> {userToToggle.email || "N/A"}</li>
                  <li><strong>Vai trò:</strong> 
                    {userToToggle.hasUpgradedToSeller ? (
                      <span className="ms-2">
                        <CBadge className="role-buyer-badge me-1">BUYER</CBadge>
                        <CBadge className="role-upgraded-badge">Đã nâng cấp lên Seller</CBadge>
                      </span>
                    ) : (
                      <CBadge className={`ms-2 ${userToToggle.role === "SELLER" ? "role-seller-badge" : "role-buyer-badge"}`}>
                        {userToToggle.role || "BUYER"}
                      </CBadge>
                    )}
                  </li>
                  <li><strong>Trạng thái hiện tại:</strong>
                    <CBadge className={`ms-2 ${userToToggle.active ? "status-active-badge" : "status-inactive-badge"}`}>
                      {userToToggle.active ? "Active" : "Inactive"}
                    </CBadge>
                  </li>
                </ul>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <strong>Lý do {toggleAction.actionText}:</strong>
                  <span className="text-muted ms-1">(Tùy chọn)</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={toggleReason}
                  onChange={(e) => setToggleReason(e.target.value)}
                  placeholder={toggleAction.actionText === "vô hiệu hóa"
                    ? "Nhập lý do vô hiệu hóa (ví dụ: Vi phạm chính sách, ...)"
                    : "Nhập lý do kích hoạt lại (ví dụ: Đã giải quyết vấn đề, ...)"}
                  disabled={isToggling}
                />
              </div>
              {toggleAction.actionText === "vô hiệu hóa" && (
                <CAlert color="warning" className="mb-0">
                  <strong>Lưu ý:</strong> Khi vô hiệu hóa, tài khoản này sẽ không thể đăng nhập vào hệ thống cho đến khi được kích hoạt lại.
                </CAlert>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowToggleModal(false);
              setUserToToggle(null);
              setToggleAction(null);
              setToggleReason("");
              setError("");
            }}
            disabled={isToggling}
          >
            Hủy
          </CButton>
          <CButton
            color={toggleAction && toggleAction.actionText === "vô hiệu hóa" ? "danger" : "success"}
            onClick={handleToggleActive}
            disabled={isToggling}
          >
            {isToggling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang xử lý...
              </>
            ) : (
              <>
                {toggleAction && toggleAction.actionText === "vô hiệu hóa" ? (
                  <>
                    <PowerOff size={14} className="me-1" />
                    Xác nhận vô hiệu hóa
                  </>
                ) : (
                  <>
                    <Power size={14} className="me-1" />
                    Xác nhận kích hoạt lại
                  </>
                )}
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
