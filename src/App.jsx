import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./pages/Auth/login/AuthLayout";
import { Home } from "./pages/Home/Home";
import { ProductDetail } from "./pages/ProductDetail/ProductDetail";

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
        {/*  Giữ trang chủ tại / để tránh thay đổi route gốc */}
        <Route path="/" element={<Home />} />

        {/*  Nếu vẫn muốn dùng /home thì chỉ dùng nó làm alias */}
        <Route path="/home" element={<Navigate to="/" />} />

        {/* Auth pages */}
        <Route path="/signin" element={<AuthLayout page="signin" />} />
        <Route path="/signup" element={<AuthLayout page="signup" />} />

        {/* Product Detail page */}
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </Router>
  );
}

