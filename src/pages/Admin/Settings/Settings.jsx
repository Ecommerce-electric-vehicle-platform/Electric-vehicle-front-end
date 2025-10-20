import React from "react";
import { CCard, CCardBody, CFormSwitch } from "@coreui/react";
import { useDispatch, useSelector } from "react-redux";

export default function Settings() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.theme);
  const onToggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    dispatch({ type: "set", theme: next });
    document.documentElement.setAttribute("data-coreui-theme", next);
  };
  return (
    <CCard className="shadow-sm">
      <CCardBody>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-semibold">Dark Mode</div>
            <small className="text-body-secondary">Bật/tắt giao diện tối</small>
          </div>
          <CFormSwitch checked={theme === "dark"} onChange={onToggleTheme} />
        </div>
      </CCardBody>
    </CCard>
  );
}
