import React, { useState, useEffect } from 'react';
import profileApi from '../../api/profileApi'; // Đảm bảo đường dẫn đúng
import './SellerBuyPackage.css'; // File CSS đi kèm

// --- CÁC HÀM HELPER (Giữ nguyên) ---

// Hàm helper để chuyển đổi durationByDay sang text
const formatDuration = (days) => {
 if (!days) return "";
if (days >= 30) {
 const months = Math.round(days / 30);
 return `${months} tháng`;
 }
 return `${days} ngày`;
};

// Hàm format ngày hiển thị (DD-MM-YYYY)
const formatDateDisplay = (dateString) => {
 if (!dateString) return "N/A";
try {
 const date = new Date(dateString);
if (isNaN(date.getTime())) return "N/A";
const day = String(date.getDate()).padStart(2, '0');
const month = String(date.getMonth() + 1).padStart(2, '0');
const year = date.getFullYear();
return `${day}-${month}-${year}`;
} catch {
 console.error("Lỗi format ngày:", dateString);
 return "N/A";
}
};

// Hàm tính số ngày còn lại
const calculateDaysRemaining = (endDateString) => {
if (!endDateString) return 0;
try {
const expirationDate = new Date(endDateString);
const today = new Date();
expirationDate.setHours(0, 0, 0, 0);
today.setHours(0, 0, 0, 0);
const remainingTime = expirationDate.getTime() - today.getTime();
// Luôn làm tròn LÊN
return Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
} catch {
console.error("Lỗi tính ngày còn lại:", endDateString);
return 0;
}
};


export default function SellerBuyPackage() {
 // === State (Giữ nguyên) ===
 const [availablePackages, setAvailablePackages] = useState([]);
 const [activePackage, setActivePackage] = useState(null);
 const [daysRemaining, setDaysRemaining] = useState(0);
 const [selectedPriceInfo, setSelectedPriceInfo] = useState({
 packageId: null, priceId: null, price: null, durationByDay: null,
 });
 const [isLoading, setIsLoading] = useState(true);
 const [isPurchasing, setIsPurchasing] = useState(false);
 const [error, setError] = useState(null);
 const [sellerName, setSellerName] = useState("");

 // === useEffect ĐÃ SỬA (Logic đọc/ghi localStorage) ===
 useEffect(() => {
const loadInitialData = async () => {
 setIsLoading(true);
 setError(null);
 setActivePackage(null);
 setAvailablePackages([]);
 setSelectedPriceInfo({ packageId: null, priceId: null, price: null, durationByDay: null });

 // --- BƯỚC 1: KIỂM TRA LOCAL STORAGE TRƯỚC ---
 try {
 const savedPackageString = localStorage.getItem('activeSellerPackage');
 if (savedPackageString) {
 const savedPackage = JSON.parse(savedPackageString);
 const remaining = calculateDaysRemaining(savedPackage.endDate);

 if (remaining >= 0) {
 console.log("DEBUG: Tìm thấy gói active từ localStorage:", savedPackage);
 setActivePackage(savedPackage);
 setDaysRemaining(remaining);
 // Lấy tên seller để phòng trường hợp tên bị thiếu
try {
 const profileResponse = await profileApi.getProfile();
 if (profileResponse.data?.success && profileResponse.data.data?.fullName) {
 setSellerName(profileResponse.data.data.fullName);
 }
 } catch (profileError) {
 console.warn("Không thể tải tên seller:", profileError.message);
 }
 setIsLoading(false);
 return;
 } else {
 console.log("DEBUG: Gói trong localStorage đã hết hạn, xóa.");
 localStorage.removeItem('activeSellerPackage');
 }
 }
 } catch (e) {
 console.error("Lỗi đọc package từ localStorage:", e);
localStorage.removeItem('activeSellerPackage');
 }


            // --- BƯỚC 2: NẾU KHÔNG CÓ GÓI -> TẢI DANH SÁCH MỚI ---
            console.log("DEBUG: Không có gói active, tải danh sách gói để mua...");
            try {
                const [availablePkgsResponse, profileResponse] = await Promise.all([
                    profileApi.getActiveSellerPackages(),
                    profileApi.getProfile()
                ]);


                if (profileResponse.data?.success && profileResponse.data.data?.fullName) {
                    setSellerName(profileResponse.data.data.fullName);
                }


                if (availablePkgsResponse.data?.success && Array.isArray(availablePkgsResponse.data.data?.content)) {
                    const activeOnlyPackages = availablePkgsResponse.data.data.content.filter(pkg => pkg.active !== false);
                    setAvailablePackages(activeOnlyPackages);
                } else {
                    throw new Error(availablePkgsResponse.data?.message || 'Không thể tải danh sách gói.');
                }
            } catch (err) {
                console.error("Lỗi tải dữ liệu gói seller:", err);
                setError(err.message || 'Lỗi không xác định khi tải dữ liệu.');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);


    // === Handlers (Giữ nguyên handleSelectPricing) ===
    const handleSelectPricing = (pkgId, priceOpt) => {
        if (isPurchasing) return;
        setSelectedPriceInfo({
            packageId: pkgId,
            priceId: priceOpt.id,
            price: priceOpt.price,
            durationByDay: priceOpt.durationByDay,
        });
        setError(null);
        console.log(`Đã chọn - Package ID: ${pkgId}, Price ID: ${priceOpt.id}, Price: ${priceOpt.price}, Duration: ${priceOpt.durationByDay}`);
    };


    // === handlePurchase ĐÃ SỬA (Logic lưu localStorage) ===
    const handlePurchase = async () => {
        if (!selectedPriceInfo.priceId || isPurchasing || isLoading) {
             if (!selectedPriceInfo.priceId) alert("Vui lòng chọn một gói và thời hạn mong muốn.");
             return;
        }


        const purchasePayload = {
            packageId: selectedPriceInfo.packageId,
            priceId: selectedPriceInfo.priceId,
            price: selectedPriceInfo.price,
            durationByDay: selectedPriceInfo.durationByDay,
        };


        setIsPurchasing(true);
        setError(null);
        console.log(`Bắt đầu đăng ký gói với payload:`, purchasePayload);


        try {
            const response = await profileApi.signPackage(purchasePayload);


            if (response.data?.success && response.data.data?.success && response.data.data.subscription) {
                const subscriptionData = response.data.data.subscription;
                console.log("Đăng ký thành công, dữ liệu gói mới:", subscriptionData);
                const remaining = calculateDaysRemaining(subscriptionData.endDate);


                const packageToSave = {
                    packageName: subscriptionData.packageName,
                    customerName: subscriptionData.fullName,
                    startDate: subscriptionData.startDate,
                    endDate: subscriptionData.endDate,
                };


                localStorage.setItem('activeSellerPackage', JSON.stringify(packageToSave));


                setActivePackage(packageToSave);
                setDaysRemaining(remaining);
                setSellerName(packageToSave.customerName);


                alert(response.data.message || "Đăng kí gói người bán thành công.");
            } else {
                const errMsg = response.data?.message || 'Đăng ký gói thất bại (phản hồi không hợp lệ).';
                console.error("Lỗi logic đăng ký gói:", response.data);
                throw new Error(errMsg);
            }
        } catch (err) {
            console.error("Lỗi khi đăng ký gói:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Không thể hoàn tất đăng ký.';
            setError(errorMsg);
            alert(`Lỗi: ${errorMsg}`);
        } finally {
            setIsPurchasing(false);
        }
    };


    // --- Render ---


    // 1. Loading ban đầu
    if (isLoading) {
        return <div className="seller-package-container loading">Đang tải thông tin gói...</div>;
    }


    // === RENDER MÀN HÌNH ACTIVE ĐÃ SỬA (Dùng đúng key) ===
    if (activePackage && daysRemaining >= 0) {
        const customerNameToDisplay = activePackage.customerName || sellerName || "N/A";


        return (
            <div className="seller-package-container">
                <h1 className="package-title">Gói Dịch Vụ Hiện Tại</h1>
                <div className="active-package-box">


                    {daysRemaining === 0 && (
                         <p className="active-package-message warning">Gói của bạn hết hạn hôm nay!</p>
                    )}


                    <p className="active-package-name">{activePackage.packageName || "Gói Seller"}</p>
                    <p className="days-remaining">
                        {daysRemaining > 0 ? `Còn lại: ${daysRemaining} ngày` : `Hết hạn hôm nay`}
                    </p>


                    <div className="active-package-info">
                        <div className="info-row">
                            <span className="info-label">Khách hàng:</span>
                            <span className="info-value">{customerNameToDisplay}</span>
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
                </div>
            </div>
        );
    }


    // 3. Hiển thị danh sách các gói để mua (Giữ nguyên)
    return (
        <div className="seller-package-container">
            <h1 className="package-title">Chọn Gói Dịch Vụ Seller</h1>


            {error && availablePackages.length === 0 && <p className="error-message">Lỗi tải danh sách gói: {error}</p>}


            {availablePackages.length === 0 && !isLoading && !error ? (
                <p style={{ textAlign: 'center' }}>Hiện không có gói dịch vụ nào.</p>
            ) : (
                <div className="packages-grid">
                    {availablePackages.map((pkg) => {
                        const pkgId = pkg.id;
                        const colorClass = pkgId === 1 ? 'standard' : (pkgId === 2 ? 'pro' : (pkgId === 3 ? 'vip' : ''));


                        return (
                            <div key={pkgId} className={`package-card ${colorClass} ${selectedPriceInfo.packageId === pkgId ? 'card-selected-outline' : ''}`}>
                                <div className="package-header">
                                    <h2 className="package-name">{pkg.name}</h2>
                                </div>
                                <div className="package-description">
                                    {pkg.description}
                                </div>
                                <div className="package-pricing">
                                    {pkg.prices?.map((priceOpt) => {
                                         const isSelected = selectedPriceInfo.priceId === priceOpt.id;
                                         const finalPrice = priceOpt.price * (1 - (priceOpt.discountPercent || 0) / 100);
                                         return (
                                            <button
                                                key={priceOpt.id}
                                                className={`price-button ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleSelectPricing(pkgId, priceOpt)}
                                                disabled={isPurchasing}
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


            {availablePackages.length > 0 && (
                <div className="purchase-button-container">
                    {error && <p className="error-message purchase-error">{error}</p>}
                    <button
                        className="btn btn-purchase"
                        onClick={handlePurchase}
                        disabled={!selectedPriceInfo.priceId || isPurchasing || isLoading}
                    >
                        {isPurchasing ? 'Đang xử lý...' : 'Mua Gói Đã Chọn'}
                    </button>
                </div>
            )}
        </div>
    );
}





