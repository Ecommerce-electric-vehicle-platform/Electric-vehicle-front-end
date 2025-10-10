import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./pages/Auth/login/AuthLayout";
import PersonalProfilePage from "./components/PersonalProfilePage";
import HomePage from "./homepage/HomePage";
import { GoogleOAuthProvider } from "@react-oauth/google";


export default function App() {
  return (
    <Router>
      <Routes>
{/* Mặc định vào HomePage */}
        <Route path="/" element={<Navigate to="/home" />} />

        {/* Trang HomePage */}
        <Route path="/home" element={<HomePage />} />

        {/* Trang Auth */}
        <Route path="/signin" element={<AuthLayout page="signin" />} />
        <Route path="/signup" element={<AuthLayout page="signup" />} />

        {/* Trang Profile */}
        <Route path="/profile" element={<PersonalProfilePage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </Router>
  );
}
