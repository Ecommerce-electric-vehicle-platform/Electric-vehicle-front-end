import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./pages/Auth/login/AuthLayout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" />} />
        <Route path="/signin" element={<AuthLayout />} />
        <Route path="/signup" element={<AuthLayout />} />
      </Routes>
    </Router>
  );
}
