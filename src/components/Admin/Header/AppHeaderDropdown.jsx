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
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("buyerId");
    localStorage.removeItem("authType");
    localStorage.removeItem("adminProfile");
    // Thông báo thay đổi auth cho app (nếu nơi khác lắng nghe)
    window.dispatchEvent(new CustomEvent("authStatusChanged"));
    window.location.href = "/admin/signin";
  };
  // Lấy thông tin admin để hiển thị tối thiểu
  let displayName = "Admin";
  let avatarUrl = null;
  let email = "";
  let employeeNumber = "";
  let isSuperAdmin = false;
  {
    const raw = localStorage.getItem("adminProfile");
    if (raw) {
      try {
        const profile = JSON.parse(raw);
        displayName =
          profile?.fullName || profile?.employeeNumber || displayName;
        avatarUrl = profile?.avatarUrl || null;
        email = profile?.email || "";
        employeeNumber = profile?.employeeNumber || "";
        isSuperAdmin = !!profile?.isSuperAdmin;
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
            <span
              className="fw-semibold"
              style={{
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </span>
            {employeeNumber && (
              <small className="text-body-secondary">
                #{employeeNumber}
                {isSuperAdmin ? " • Super" : ""}
              </small>
            )}
          </div>
        </div>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">
          {displayName}
        </CDropdownHeader>
        {email && (
          <CDropdownItem href="#" disabled>
            <span className="text-body-secondary">{email}</span>
          </CDropdownItem>
        )}
        {employeeNumber && (
          <CDropdownItem href="#" disabled>
            <span className="text-body-secondary">
              Employee #: {employeeNumber}
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
        <CDropdownItem href="#">
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
