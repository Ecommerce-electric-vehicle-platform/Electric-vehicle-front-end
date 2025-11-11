import React from "react";
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from "@coreui/react";
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";

import avatar8 from "../../../assets/imgs/placeholder-logo.svg";

const AppHeaderDropdown = () => {
  const handleLogout = (e) => {
    e.preventDefault();
    console.log("Admin logging out...");
    
    // CHỈ xóa admin-specific keys, KHÔNG xóa user data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("authType");
    localStorage.removeItem("adminProfile");
    
    // KHÔNG xóa các key user như: username, userEmail, buyerId, sellerId, buyerAvatar, userRole
    // Để giữ lại user session nếu có
    
    console.log("[AppHeaderDropdown] Admin logout - Chỉ xóa admin data");
    // Thông báo thay đổi auth cho app (nếu nơi khác lắng nghe)
    window.dispatchEvent(new CustomEvent("authStatusChanged"));
    window.location.href = "/admin/signin";
  };
  
  // Hàm hiển thị status badge
  const getStatusBadge = (status) => {
    if (status === "ACTIVE" || status === "active") {
      return <CBadge color="success">ACTIVE</CBadge>;
    } else if (status === "INACTIVE" || status === "inactive") {
      return <CBadge color="danger">INACTIVE</CBadge>;
    } else if (status === "BLOCKED" || status === "blocked") {
      return <CBadge color="danger">BLOCKED</CBadge>;
    }
    return <CBadge color="secondary">{status || "N/A"}</CBadge>;
  };
  
  // Lấy thông tin admin để hiển thị tối thiểu
  let displayName = "Admin";
  let username = ""; // Thêm username
  let avatarUrl = null;
  let email = "";
  let employeeNumber = "";
  let isSuperAdmin = false;
  let status = null;
  {
    const raw = localStorage.getItem("adminProfile");
    if (raw) {
      try {
        const profile = JSON.parse(raw);
        username = profile?.username || ""; // Lấy username từ adminProfile
        displayName =
          profile?.fullName || profile?.employeeNumber || displayName;
        avatarUrl = profile?.avatarUrl || null;
        email = profile?.email || "";
        employeeNumber = profile?.employeeNumber || "";
        isSuperAdmin = !!profile?.isSuperAdmin;
        status = profile?.status || null;
      } catch {
        // ignore parse error
      }
    }
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle
        placement="bottom-end"
        className="py-0 pe-0"
        caret={false}
      >
        <div className="d-flex align-items-center gap-2">
          <CAvatar src={avatarUrl || avatar8} size="md" />
          <div className="d-none d-md-flex flex-column text-start">
            {/* Hiển thị username hoặc displayName */}
            <span
              className="fw-semibold"
              style={{
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {username || displayName}
            </span>
            {employeeNumber && (
              <small className="text-body-secondary">
                #{employeeNumber}
                {isSuperAdmin ? " • Super" : ""}
              </small>
            )}
            {status && (
              <div className="mt-1">
                {getStatusBadge(status)}
              </div>
            )}
          </div>
        </div>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        {/* Hiển thị username hoặc displayName */}
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">
          {username || displayName}
        </CDropdownHeader>
        {/* Hiển thị email */}
        {email && (
          <CDropdownItem href="#" disabled>
            <span className="text-body-secondary">{email}</span>
          </CDropdownItem>
        )}
        {status && (
          <CDropdownItem href="#" disabled>
            <span className="text-body-secondary d-flex align-items-center gap-2">
              Trạng thái: {getStatusBadge(status)}
            </span>
          </CDropdownItem>
        )}
        <CDropdownDivider />
        <CDropdownItem href="#">
          <CIcon icon={cilBell} className="me-2" />
          Updates
          <CBadge color="info" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilEnvelopeOpen} className="me-2" />
          Messages
          <CBadge color="success" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilTask} className="me-2" />
          Tasks
          <CBadge color="danger" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilCommentSquare} className="me-2" />
          Comments
          <CBadge color="warning" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">
          Settings
        </CDropdownHeader>
        <CDropdownItem href="/admin/profile">
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilSettings} className="me-2" />
          Settings
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilCreditCard} className="me-2" />
          Payments
          <CBadge color="secondary" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilFile} className="me-2" />
          Projects
          <CBadge color="primary" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem href="#" onClick={handleLogout}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );
};

export default AppHeaderDropdown;
