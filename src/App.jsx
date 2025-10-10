import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./pages/Auth/login/AuthLayout";
import PersonalProfilePage from "./components/PersonalProfilePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" />} />
        <Route path="/signin" element={<AuthLayout />} />
        <Route path="/signup" element={<AuthLayout />} />
        <Route path="/profile" element={<PersonalProfilePage />} />
      </Routes>
    </Router>
  );
}
