import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import AuthLayout from "./pages/Auth/login/AuthLayout";
import { Home } from "./pages/Home/Home";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import { Chat } from "./pages/Chat/Chat";
import { Seller } from "./pages/Seller/Seller";
import { Favorites } from "./pages/Favorites/Favorites";
import { Products } from "./pages/Products/Products";
import { ComparePlans } from "./pages/ComparePlans/ComparePlans";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import OrderTracking from "./pages/OrderTracking/OrderTracking";
import WalletDeposit from "./pages/WalletDeposit/WalletDeposit";
import VnPayReturn from "./pages/WalletDeposit/VnPayReturn";
import OrderList from "./pages/OrderList/OrderList";
import OrderReview from "./pages/OrderReview/OrderReview";
import PersonalProfilePage from "./components/ProfileUser/PersonalProfilePage";
import SellerDashboard from "./pages/SellerDashboard/SellerDashboard";
import CreatePost from "./pages/Seller/CreatePost/CreatePost";
import ManagePosts from "./pages/Seller/ManagePosts/ManagePosts";
import EditPost from "./pages/Seller/EditPost/EditPost";
import SellerPendingOrders from "./pages/Seller/SellerPendingOrders/SellerPendingOrders";
import AdminRoutes from "./routes/AdminRoute";
import AdminLogin from "./pages/Admin/Login/AdminLogin";
import PageTransition from "./components/PageTransition/PageTransition";
import { Header } from "./components/Header/Header";
import { ScrollToTop } from "./components/ScrollToTop/ScrollToTop";
import { AutoScrollToTop } from "./components/AutoScrollToTop/AutoScrollToTop";
import { Footer } from "./components/Footer/Footer";
import { NotificationModal } from "./components/NotificationModal/NotificationModal";
import ForgotPassword from "./pages/Auth/login/ForgotPassword"; //thêm route này
import { useState, useEffect } from "react";
import notificationService from "./services/notificationService";
import WalletDashboard from "./pages/Wallet/WalletDashboard";

function AppContent() {
  const location = useLocation();
  const hideChrome =
    location.pathname === "/signin" ||
    location.pathname === "/signup" ||
    location.pathname.startsWith("/admin");
  const hideFooter =
    hideChrome ||
    location.pathname === "/chat" ||
    location.pathname.startsWith("/place-order") ||
    location.pathname.startsWith("/order-tracking") ||
    location.pathname.startsWith("/wallet") ||
    location.pathname.startsWith("/admin");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Khởi tạo notification service khi app start
  useEffect(() => {
    console.log("=================================");
    console.log("[App] Starting Frontend Application");
    console.log(
      "[App] Backend URL:",
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
    );
    console.log("[App] Initializing notification service...");
    console.log("=================================");
    notificationService.init();
  }, []);

  const handleGoLogin = () => {
    setShowAuthModal(false);
    window.location.href = "/signin";
  };

  const handleGoRegister = () => {
    setShowAuthModal(false);
    window.location.href = "/signup";
  };

  return (
    <>
      {!hideChrome && <Header />}

      <AutoScrollToTop />
      <ScrollToTop />

      <Routes>
        <Route
          path="/"
          element={
            <PageTransition className="fade-up">
              <Home onRequireAuth={() => setShowAuthModal(true)} />
            </PageTransition>
          }
        />
        {/* Tách hẳn trang đăng nhập admin ra top-level để tránh dính layout */}
        <Route path="/admin/signin" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/home" element={<Navigate to="/" />} />
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

        {/* Thêm Forgot Password */}
        <Route
          path="/forgot-password"
          element={
            <PageTransition className="fade-right">
              <ForgotPassword />
            </PageTransition>
          }
        />

        <Route
          path="/product/:id"
          element={
            <PageTransition className="slide-right" showLoading={false}>
              <ProductDetail />
            </PageTransition>
          }
        />
        <Route
          path="/place-order/:id"
          element={
            <PageTransition className="slide-left">
              <PlaceOrder />
            </PageTransition>
          }
        />
        <Route
          path="/order-tracking/:orderId"
          element={
            <PageTransition className="slide-right">
              <OrderTracking />
            </PageTransition>
          }
        />
        <Route
          path="/orders"
          element={
            <PageTransition className="fade-up">
              <OrderList />
            </PageTransition>
          }
        />
        <Route
          path="/order/review/:orderId"
          element={
            <PageTransition className="fade-up">
              <OrderReview />
            </PageTransition>
          }
        />
        <Route
          path="/seller-dashboard"
          element={
            <PageTransition className="fade-up">
              <SellerDashboard />
            </PageTransition>
          }
        />
        <Route
          path="/seller/create-post"
          element={
            <PageTransition className="fade-up">
              <CreatePost />
            </PageTransition>
          }
        />
        <Route
          path="/seller/manage-posts"
          element={
            <PageTransition className="fade-up">
              <ManagePosts />
            </PageTransition>
          }
        />
        <Route
          path="/seller/edit-post/:postId"
          element={
            <PageTransition className="fade-up">
              <EditPost />
            </PageTransition>
          }
        />
        <Route
          path="/seller/pending-orders"
          element={
            <PageTransition className="fade-up">
              <SellerPendingOrders />
            </PageTransition>
          }
        />
        <Route
          path="/seller/:id"
          element={
            <PageTransition className="fade-up">
              <Seller />
            </PageTransition>
          }
        />
        <Route
          path="/favorites"
          element={
            <PageTransition className="fade-up">
              <Favorites />
            </PageTransition>
          }
        />
        <Route
          path="/products"
          element={
            <PageTransition className="fade-up">
              <Products />
            </PageTransition>
          }
        />
        <Route
          path="/compare-plans"
          element={
            <PageTransition className="fade-up">
              <ComparePlans />
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <PageTransition className="fade-up">
              <PersonalProfilePage />
            </PageTransition>
          }
        />
        <Route
          path="/chat"
          element={
            <PageTransition className="fade-up">
              <Chat />
            </PageTransition>
          }
        />
        {/* 💳 Wallet deposit & VNPay return */}
        <Route
          path="/wallet/deposit"
          element={
            <PageTransition className="fade-up">
              <WalletDeposit />
            </PageTransition>
          }
        />
        <Route
          path="/vnpay/return"
          element={
            <PageTransition className="fade-up">
              <VnPayReturn />
            </PageTransition>
          }
        />
        {/* 🧾 Wallet Dashboard */}
        <Route
          path="/wallet"
          element={
            <PageTransition className="fade-up">
              <WalletDashboard />
            </PageTransition>
          }
        />
      </Routes>

      {/*  Global Auth Modal */}
      <NotificationModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleGoLogin}
        onRegister={handleGoRegister}
        notificationType="login"
      />

      {!hideFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
