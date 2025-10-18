import { Routes, Route } from "react-router-dom";
import CoreAdminLayout from "../layouts/CoreAdminLayout";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="*" element={<CoreAdminLayout />} />
    </Routes>
  );
}
