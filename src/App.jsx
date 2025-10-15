import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./pages/Auth/login/AuthLayout";
import PersonalProfilePage from "./components/ProfileUser/PersonalProfilePage";
import Home from "./pages/Home/Home"; 
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import ForgotPassword from "./pages/Auth/login/ForgotPassword";
import { useLocation } from "react-router-dom";

// Component bảo vệ route (chỉ cho vào khi đã đăng nhập)
function ProtectedRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("token");
  const location = useLocation();

  if (!isAuthenticated) {
    // Lưu lại trang người dùng đang ở, để sau khi login xong có thể quay lại
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Trang chủ */}
        <Route path="/" element={<Home />} />

        {/* Alias: /home → / */}
        <Route path="/home" element={<Navigate to="/" />} />

        {/* Auth pages */}
        <Route path="/signin" element={<AuthLayout page="signin" />} />
        <Route path="/signup" element={<AuthLayout page="signup" />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Product Detail */}
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* Personal Profile */}
        <Route path="/profile" element={<PersonalProfilePage />} />
      </Routes>
    </Router>
  );
}
