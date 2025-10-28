import React, { useState, useEffect } from 'react';
import profileApi from '../../api/profileApi'; // Đảm bảo đường dẫn đúng
import ConfirmationModal from './ConfirmationModal'; // Import modal từ cùng thư mục
import './SellerBuyPackage.css'; // File CSS đi kèm


// --- CÁC HÀM HELPER (ĐÃ BỔ SUNG ĐẦY ĐỦ) ---
const formatDuration = (days) => {
 if (!days) return "";
 if (days >= 30) {
  const months = Math.round(days / 30);
  return `${months} tháng`;
 }
 return `${days} ngày`;
};


const formatDateDisplay = (dateString) => {
 if (!dateString) return "N/A";
 try {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
 } catch {
  console.error("Lỗi format ngày:", dateString);
  return "N/A";
 }
};


const calculateDaysRemaining = (endDateString) => {
 if (!endDateString) return 0;
 try {
  const expirationDate = new Date(endDateString);
  const today = new Date();
  expirationDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const remainingTime = expirationDate.getTime() - today.getTime();
  // Round UP to the nearest whole day, minimum 0
  return Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
 } catch {
  console.error("Lỗi tính ngày còn lại:", endDateString);
  return 0;
 }
};


// Helper function để chuẩn hóa việc trích xuất message lỗi từ response (kể cả 500)
const getErrorMessage = (error) => {
    // Ưu tiên message từ khối error chi tiết của backend (thường là lỗi 500)
    const errorData = error.response?.data?.error;
    if (errorData?.message) return errorData.message;
    // Tiếp theo là message chung từ khối data của response (lỗi 400/401)
    if (error.response?.data?.message) return error.response.data.message;
    // Cuối cùng là message từ Axios/JS
    return error.message || 'Không thể hoàn tất đăng ký.';
};




export default function SellerBuyPackage({ userRole }) { // Nhận userRole qua props
 // === State ===
 const [availablePackages, setAvailablePackages] = useState([]);
 const [activePackage, setActivePackage] = useState(null);
 const [daysRemaining, setDaysRemaining] = useState(0);
 const [selectedPriceInfo, setSelectedPriceInfo] = useState({
  packageId: null, priceId: null, price: null, durationByDay: null,
 });
 const [isLoading, setIsLoading] = useState(true); // Loading tổng thể
 const [isCheckingSubscription, setIsCheckingSubscription] = useState(false); // Chỉ bật khi thực sự gọi API check
 const [isLoadingAvailable, setIsLoadingAvailable] = useState(false); // Chỉ bật khi thực sự gọi API load gói
 const [isPurchasing, setIsPurchasing] = useState(false);
 const [isOverwriting, setIsOverwriting] = useState(false); // Loading cho quá trình hủy + mua lại
 const [error, setError] = useState(null);
 const [showConfirmModal, setShowConfirmModal] = useState(false);
 const [pendingPurchasePayload, setPendingPurchasePayload] = useState(null);


 // === ĐỊNH NGHĨA loadInitialData BÊN NGOÀI useEffect ===
 const loadInitialData = async () => {
   // Reset states
   setIsLoading(true); // Bật loading tổng
   setIsCheckingSubscription(false);
   setIsLoadingAvailable(false);
   setError(null);
   setActivePackage(null);
   setAvailablePackages([]);
   setSelectedPriceInfo({ packageId: null, priceId: null, price: null, durationByDay: null });


   // --- STEP 0: CHECK ROLE using userRole prop ---
   if (userRole !== 'seller') {
    console.log("DEBUG: User is not a seller (prop userRole:", userRole, "). Stopping package load.");
    // setError("Chức năng này chỉ dành cho người bán.");
    setError("Nếu đã đăng ký người bán, vui lòng đăng xuất và đăng nhập lại để cập nhật vai trò.");
    setIsLoading(false); // Tắt loading vì đã xác định không phải seller
    return; // Dừng lại nếu không phải seller
   }
   console.log("DEBUG: User is a seller (prop). Proceeding...");


   // Bật loading cho các bước gọi API
   setIsCheckingSubscription(true);
   setIsLoadingAvailable(true);


   // --- STEP 1: CALL GET API TO CHECK CURRENT SUBSCRIPTION ---
   try {
    console.log("DEBUG: Calling getCurrentSubscription API...");
    const response = await profileApi.getCurrentSubscription();
    console.log("DEBUG: getCurrentSubscription Response Data:", response.data);
    if (response.data?.success && response.data.data) {
     const currentSubData = response.data.data;
     const remaining = calculateDaysRemaining(currentSubData.end);
     if (remaining >= 0) {
      const packageToShow = {
       packageName: currentSubData.packageName || "Gói Đang Dùng",
       customerName: currentSubData.sellerName,
       startDate: currentSubData.start,
       endDate: currentSubData.end,
       packageId: currentSubData.packageId
      };
      setActivePackage(packageToShow);
      setDaysRemaining(remaining);
     } else {
      console.log("DEBUG: Current subscription found but expired.");
     }
    } else {
     console.log("DEBUG: getCurrentSubscription API success but no data.");
    }
   } catch (err) {
    if (err.response?.status === 404) {
     console.log("DEBUG: getCurrentSubscription returned 404.");
     setError(null);
    } else {
     console.error("Lỗi khi gọi getCurrentSubscription:", err);
     setError("Không thể kiểm tra gói hiện tại. Vui lòng thử lại.");
    }
   } finally {
    setIsCheckingSubscription(false); // Tắt loading check gói
   }


   // --- STEP 2: ALWAYS CALL GET API TO FETCH AVAILABLE PACKAGES ---
   try {
    console.log("DEBUG: Calling getAvailableSellerPackages API...");
    const response = await profileApi.getAvailableSellerPackages();
     if (response.data?.success && Array.isArray(response.data.data?.content)) {
       const activeOnlyPackages = response.data.data.content.filter(pkg => pkg.active !== false);
       setAvailablePackages(activeOnlyPackages);
     } else {
        throw new Error(response.data?.message || 'Không thể tải danh sách gói.');
     }
   } catch (err) {
    console.error("Lỗi tải danh sách gói để mua:", err);
    if (!error) setError(getErrorMessage(err));
   } finally {
    setIsLoadingAvailable(false); // Tắt loading danh sách
   }


   // Tắt isLoading tổng thể sau khi cả 2 API con hoàn tất
   setIsLoading(false);
 };




 // === useEffect (Gọi loadInitialData khi role thay đổi) ===
 useEffect(() => {
    loadInitialData();
 }, [userRole]); // Dependency array includes userRole


 // === Handlers ===
 const handleSelectPricing = (pkgId, priceOpt) => {
  if (isPurchasing || isOverwriting) return;
  setSelectedPriceInfo({
   packageId: pkgId,
   priceId: priceOpt.id,
   price: priceOpt.price,
   durationByDay: priceOpt.durationByDay,
  });
  setError(null); // Clear previous purchase errors when selecting
  console.log(`Đã chọn - Package ID: ${pkgId}, Price ID: ${priceOpt.id}`);
 };


 // === handlePurchase (LOGIC MỚI: KIỂM TRA FRONTEND VÀ HIỆN MODAL HỦY) ===
 const handlePurchase = async () => {
  // Basic checks
  if (!selectedPriceInfo.priceId || isPurchasing || isLoading || isOverwriting) {
   if (!selectedPriceInfo.priceId) alert("Vui lòng chọn một gói và thời hạn mong muốn.");
   return;
  }


  const purchasePayload = {
   packageId: selectedPriceInfo.packageId,
   priceId: selectedPriceInfo.priceId,
   price: selectedPriceInfo.price,
   durationByDay: selectedPriceInfo.durationByDay,
  };


  // 🧭 1️⃣ KIỂM TRA TRẠNG THÁI GÓI CŨ TỪ STATE (FRONTEND CHECK)
  if (activePackage && daysRemaining > 0) {
    console.log("DEBUG: Active package found. Showing confirmation modal to cancel old package.");
    setPendingPurchasePayload(purchasePayload); // LƯU TẠM THÔNG TIN GÓI MỚI ĐANG ĐỊNH MUA
    setShowConfirmModal(true); // <<< HIỆN MODAL HỦY NGAY >>>
    return; // DỪNG LẠI, KHÔNG GỌI API SIGN-PACKAGE
  }
 
  // 🧾 2️⃣ GỌI API MUA TRỰC TIẾP (Chỉ khi gói cũ hết hạn hoặc chưa có)
  setIsPurchasing(true);
  setError(null);


  try {
   const response = await profileApi.signPackage(purchasePayload);


   // --- HANDLE SUCCESS (HAPPY PATH) ---
   if (response.data?.success && response.data.data?.subscription) {
    alert(response.data.message || "Đăng kí gói thành công.");
    loadInitialData(); // Tải lại dữ liệu từ server
   }
   // --- HANDLE LỖI LOGIC KHÁC TỪ BACKEND (ví dụ: số dư không đủ) ---
   else {
        const errorMsg = response.data?.error?.message || response.data?.message || 'Lỗi không xác định.';
        if (errorMsg.includes("Số dư ví không đủ")) {
            alert("Số dư ví không đủ, vui lòng nạp thêm.");
        }
        else {
            throw new Error(errorMsg);
        }
   }
  } catch (err) { // Bắt lỗi mạng hoặc lỗi throw
   const errorMsg = getErrorMessage(err);
   if (errorMsg.includes("Số dư ví không đủ")) {
        alert("Số dư ví không đủ, vui lòng nạp thêm.");
   }
   else {
        setError(errorMsg);
        alert(`Lỗi: ${errorMsg}`);
   }
  } finally {
   setIsPurchasing(false);
  }
 };


 // === handleCancelActivePackage (Xử lý nút Hủy gói độc lập) ===
 const handleCancelActivePackage = () => {
    if (activePackage && daysRemaining > 0) {
        // LƯU Ý: Khác với handlePurchase, ta không lưu purchasePayload, chỉ lưu flag hủy
        setPendingPurchasePayload({ isCancellation: true }); // Dùng flag để biết đây là yêu cầu hủy độc lập
        setShowConfirmModal(true);
    } else {
        alert("Hiện không có gói nào đang hoạt động để hủy.");
    }
 };




 // === Handle Confirmation Modal OK (HỦY GÓI CŨ) ===
 const handleConfirmOverwrite = async () => {
  if (isOverwriting) return; // Prevent double clicks


  setShowConfirmModal(false);
  setIsOverwriting(true); // Bật loading cho quá trình hủy
  setError(null);
  console.log("DEBUG: User confirmed overwrite. Canceling old package...");


  try {
   // --- BƯỚC 1: HỦY GÓI CŨ ---
   const cancelResponse = await profileApi.cancelSubscription();
   if (!cancelResponse.data?.success) {
    const cancelErrorMsg = cancelResponse.data?.message || "Không thể hủy gói hiện tại.";
    console.error("Lỗi khi hủy gói:", cancelResponse.data);
    throw new Error(cancelErrorMsg);
   }
   
   console.log("DEBUG: Old package canceled successfully. Proceeding to final purchase...");
   
   alert("Gói cũ đã được hủy thành công! Vui lòng chọn gói mới để kích hoạt dịch vụ.");
   
   // LƯU Ý QUAN TRỌNG: BUỘC VIEW MẤT ĐI NGAY LẬP TỨC TRƯỚC KHI GỌI LOADINITIALDATA
   setActivePackage(null); // <<< XÓA GÓI ACTIVE KHỎI VIEW NGAY LẬP TỨC
   setDaysRemaining(0);


   // GỌI LẠI LOADINITIALDATA để component load lại gói active (giờ sẽ là null)
   // và cho phép mua gói mới.
   loadInitialData();


   // Sau khi hủy, chúng ta KHÔNG gọi API mua ngay mà thoát khỏi hàm này.


  } catch (err) {
   console.error("Lỗi trong quá trình hủy gói:", err);
   const errorMsg = err.message || "Đã xảy ra lỗi trong quá trình hủy gói.";
   setError(errorMsg); // Show error in UI
   alert(`Lỗi: ${errorMsg}`);
  } finally {
   setIsOverwriting(false); // Tắt loading hủy
   setPendingPurchasePayload(null); // Clear pending payload
  }
 };


 // === Handle Confirmation Modal Cancel (Không làm gì) ===
 const handleCancelOverwrite = () => {
  setShowConfirmModal(false); // Just hide modal
  setPendingPurchasePayload(null); // Clear pending payload
  console.log("DEBUG: User canceled overwrite.");
 };




 // --- Render ---
 // 1. Initial loading
 if (isLoading) {
    let loadingText = "Đang tải dữ liệu...";
    if (isCheckingSubscription) loadingText = "Đang kiểm tra gói hiện tại...";
    else if (isLoadingAvailable) loadingText = "Đang tải danh sách gói...";
    return <div className="seller-package-container loading">{loadingText}</div>;
 }


 // 2. Render if not a seller (using prop userRole)
 if (userRole !== 'seller') {
  return (
   <div className="seller-package-container">
    <h1 className="package-title">Mua Gói Dịch Vụ</h1>
    <p className="error-message" style={{ textAlign: 'center' }}>
     {error || "Chức năng này chỉ dành cho người bán."}
    </p>
   </div>
  );
 }


 // --- MAIN RENDER ---
 return (
  <div className={`seller-package-container ${isOverwriting ? 'processing-overlay' : ''}`}>
   {isOverwriting && <div className="processing-indicator">Đang xử lý...</div>}


   {/* === PART 1: DISPLAY ACTIVE PACKAGE (IF EXISTS AND VALID) === */}
   {activePackage && daysRemaining >= 0 && (
    <>
     <h1 className="package-title">Gói Dịch Vụ Hiện Tại</h1>
     <div className="active-package-box">
      {daysRemaining === 0 && (
       <p className="active-package-message warning">Gói của bạn hết hạn hôm nay!</p>
      )}
      <p className="active-package-name">{activePackage.packageName || "Gói Đang Dùng"}</p>
      <p className="days-remaining">
       {daysRemaining > 0 ? `Còn lại: ${daysRemaining} ngày` : `Hết hạn hôm nay`}
      </p>
      <div className="active-package-info">
       <div className="info-row">
        <span className="info-label">Khách hàng:</span>
        <span className="info-value">{activePackage.customerName || "N/A"}</span>
       </div>
       <div className="info-row">
        <span className="info-label">Ngày mua gói:</span>
        <span className="info-value">{formatDateDisplay(activePackage.startDate)}</span>
       </div>
       <div className="info-row">
        <span className="info-label">Ngày hết hạn:</span>
        <span className="info-value">{formatDateDisplay(activePackage.endDate)}</span>
       </div>
      </div>
      <button
          className="btn btn-cancel-sub"
          onClick={handleCancelActivePackage}
          disabled={isOverwriting || isPurchasing}
          style={{ marginTop: '20px', backgroundColor: '#ef4444', color: 'white' }}
      >
          Hủy gói
      </button>
     </div>
     <hr className="section-divider" />
    </>
   )}


   {/* === PART 2: DISPLAY AVAILABLE PACKAGES FOR PURCHASE === */}
   <h1 className="package-title">
     Các Gói Kinh Doanh
   </h1>


   {/* Display error fetching list */}
   {error && availablePackages.length === 0 && !isCheckingSubscription && (
    <p className="error-message">Lỗi tải danh sách gói: {error}</p>
   )}


   {/* Display message if no packages are available */}
   {availablePackages.length === 0 && !isLoadingAvailable && !error ? (
    <p style={{ textAlign: 'center' }}>Hiện không có gói dịch vụ nào để mua.</p>
   ) : (
    <div className="packages-grid">
     {availablePackages.map((pkg) => {
      const pkgId = pkg.id;
      const colorClass = pkgId === 1 ? 'standard' : (pkgId === 2 ? 'pro' : (pkgId === 3 ? 'vip' : ''));
      const isCardSelected = selectedPriceInfo.packageId === pkgId;


      return (
       <div key={pkgId} className={`package-card ${colorClass} ${isCardSelected ? 'card-selected-outline' : ''}`}>
        <div className="package-header">
         <h2 className="package-name">{pkg.name}</h2>
        </div>
        <div className="package-description">
         {pkg.description}
        </div>
        <div className="package-pricing">
         {pkg.prices?.map((priceOpt) => {
          const isButtonSelected = selectedPriceInfo.priceId === priceOpt.id;
          const finalPrice = priceOpt.price * (1 - (priceOpt.discountPercent || 0) / 100);
          // Only disable buttons during active processing
          const isPriceDisabled = isPurchasing || isOverwriting;


          return (
           <button
            key={priceOpt.id}
            className={`price-button ${isButtonSelected ? 'selected' : ''}`}
            onClick={() => handleSelectPricing(pkgId, priceOpt)}
            disabled={isPriceDisabled}
           >
            {finalPrice.toLocaleString('vi-VN')} {priceOpt.currency} / {formatDuration(priceOpt.durationByDay)}
            {priceOpt.discountPercent > 0 && (
             <span className="discount-badge">-{priceOpt.discountPercent}%</span>
            )}
           </button>
          )
         })}
        </div>
       </div>
      )
     })}
    </div>
   )}


   {/* === PART 3: MAIN PURCHASE BUTTON === */}
   {availablePackages.length > 0 && (
    <div className="purchase-button-container">
     {/* Display purchase error if exists and not waiting for confirmation */}
     {error && !showConfirmModal && <p className="error-message purchase-error">{error}</p>}


     {/* Note shown if trying to buy while active */}
     {activePackage && daysRemaining > 0 && !isPurchasing && !isOverwriting && (
      <p className="purchase-note">
       Chọn gói mới sẽ yêu cầu xác nhận hủy gói hiện tại.
      </p>
     )}


     <button
      className="btn btn-purchase"
      onClick={handlePurchase}
      // Disable if: no price selected, initial loading, purchasing, or overwriting
      disabled={!selectedPriceInfo.priceId || isLoading || isPurchasing || isOverwriting}
     >
      {/* Update loading text based on state */}
      {isPurchasing ? 'Đang gửi...' : (isOverwriting ? 'Đang xử lý...' : 'Mua Gói Đã Chọn')}
     </button>
    </div>
   )}


   {/* === CONFIRMATION MODAL === */}
   <ConfirmationModal
    isVisible={showConfirmModal}
    message="Gói kinh doanh hiện tại đang trong thời hạn sử dụng, bạn vẫn tiếp tục mua gói mới? (Gói cũ sẽ bị hủy)"
    onConfirm={handleConfirmOverwrite}
    onCancel={handleCancelOverwrite}
   />
  </div>
 );
}



