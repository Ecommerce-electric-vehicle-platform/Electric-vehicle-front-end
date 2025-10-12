import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./pages/Auth/login/AuthLayout";
import { Home } from "./pages/Home/Home";
import { ProductDetail } from "./pages/ProductDetail/ProductDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 👉 Giữ trang chủ tại / để tránh thay đổi route gốc */}
        <Route path="/" element={<Home />} />

        {/* 👉 Nếu vẫn muốn dùng /home thì chỉ dùng nó làm alias */}
        <Route path="/home" element={<Navigate to="/" />} />

        {/* ✅ Auth pages */}
        <Route path="/signin" element={<AuthLayout page="signin" />} />
        <Route path="/signup" element={<AuthLayout page="signup" />} />

        {/* ✅ Product Detail page */}
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </Router>
  );
}



// import React from "react"
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
// import { Home } from "./pages/Home/Home"
// import AuthLayout from "./pages/Auth/login/AuthLayout"
// import { VehicleShowcase } from "./components/VehicleShowcase/VehicleShowcase"
// // import { ProductsPage } from "./pages/ProductsPage/ProductsPage"  // ✅ mở comment nếu bạn tạo sau này

// export default function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* 🌿 Điều hướng mặc định từ / → /home */}
//         <Route path="/" element={<Navigate to="/home" />} />

//         {/* 🏡 Trang chủ */}
//         <Route path="/home" element={<Home />} />

//         {/* 🪪 Trang đăng nhập / đăng ký */}
//         <Route path="/signin" element={<AuthLayout page="signin" />} />
//         <Route path="/signup" element={<AuthLayout page="signup" />} />

//         {/* 🚗 Trang showcase sản phẩm xe (nếu bạn muốn truy cập riêng) */}
//         <Route path="/vehicles" element={<VehicleShowcase />} />

//         {/* 🛍 Trang tất cả sản phẩm — có thể dùng sau này */}
//         {/* <Route path="/products" element={<ProductsPage />} /> */}

//         {/* ❌ Mọi route không tồn tại → chuyển về Home */}
//         <Route path="*" element={<Navigate to="/home" />} />
//       </Routes>
//     </Router>
//   )
// }

