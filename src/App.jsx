import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./pages/Auth/login/AuthLayout";
import { Home } from "./pages/Home/Home";
import { ProductDetail } from "./pages/ProductDetail/ProductDetail";
import { Chat } from "./pages/Chat/Chat";
import PersonalProfilePage from "./components/PersonalProfilePage";
import PageTransition from "./components/PageTransition/PageTransition";
import { Header } from "./components/Header/Header";
import { ScrollToTop } from "./components/ScrollToTop/ScrollToTop";
import { AutoScrollToTop } from "./components/AutoScrollToTop/AutoScrollToTop";
import { Footer } from "./components/Footer/Footer";

export default function App() {
  return (
    <Router>
      {/* 🧭 Header chung cho toàn bộ ứng dụng */}
      <Header />

      {/* 🔄 Tự động scroll lên đầu trang khi chuyển route */}
      <AutoScrollToTop />

      <ScrollToTop />

      <Routes>
        {/* 🏠 Trang chủ */}
        <Route
          path="/"
          element={
            <PageTransition className="fade-up">
              <Home />
            </PageTransition>
          }
        />

        {/* 🔁 Alias /home → / */}
        <Route path="/home" element={<Navigate to="/" />} />

        {/* 🔐 Auth pages */}
        <Route
          path="/signin"
          element={
            <PageTransition className="fade-left">
              <AuthLayout page="signin" />
            </PageTransition>
          }
        />
        <Route
          path="/signup"
          element={
            <PageTransition className="fade-right">
              <AuthLayout page="signup" />
            </PageTransition>
          }
        />

        {/* 🛒 Product Detail */}
        <Route
          path="/product/:id"
          element={
            <PageTransition className="slide-right" showLoading={false}>
              <ProductDetail />
            </PageTransition>
          }
        />

        {/* 👤 Personal Profile */}
        <Route
          path="/profile"
          element={
            <PageTransition className="fade-up">
              <PersonalProfilePage />
            </PageTransition>
          }
        />

        {/* 💬 Chat */}
        <Route
          path="/chat"
          element={
            <PageTransition className="fade-up">
              <Chat />
            </PageTransition>
          }
        />
      </Routes>
      <Footer />
    </Router>
  );
}
