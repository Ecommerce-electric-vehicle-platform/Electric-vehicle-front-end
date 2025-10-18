import React, { Suspense } from "react";
import { CContainer, CSpinner } from "@coreui/react";
import { Navigate, Route, Routes } from "react-router-dom";
import routes from "../../../routes/adminViewRoutes";

const AppContent = () => {
  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {routes.map((route, idx) =>
            route.element ? (
              <Route key={idx} path={route.path} element={<route.element />} />
            ) : null
          )}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  );
};

export default AppContent;
