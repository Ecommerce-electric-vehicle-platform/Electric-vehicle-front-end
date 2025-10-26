"use client";

import { useState, useEffect } from "react";
import "./UpgradeToSeller.css"; // CSS Chính
import PolicyModal from "./PolicyModal"; // Component modal chính sách
import profileApi from "../../api/profileApi"; // File API của bạn

// 1. Import component con (đã rút gọn, nhận data qua props)
import SellerApplicationPending from "./SellerApplicationPending";
import SellerApplicationAccepted from "./SellerApplicationAccepted";

export default function UpgradeToSeller({ onGoToProfile }) { // Prop để quay lại trang profile
    // === Form State ===
    const [formData, setFormData] = useState({
        storeName: "",
        taxNumber: "",
        // identityNumber sẽ lấy từ OCR state khi submit
        frontOfIdentity: null, // File object
        backOfIdentity: null,
        businessLicense: null,
        selfie: null,
        storePolicy: null,
    });
    const [errors, setErrors] = useState({});
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState({ // Chỉ để hiển thị tên file
        frontOfIdentity: null, backOfIdentity: null, businessLicense: null,
        selfie: null, storePolicy: null,
    });
    const [isLoading, setIsLoading] = useState(false); // Loading submit cuối
    const [showLoadingMessage, setShowLoadingMessage] = useState(false); // Thông báo khi submit

    // === Flow Control State ===
    const [checkingStatus, setCheckingStatus] = useState(true); // Loading kiểm tra ban đầu
    const [isProfileComplete, setIsProfileComplete] = useState(null); // Kết quả kiểm tra profile buyer
    const [kycStatus, setKycStatus] = useState(null); // Trạng thái KYC: null, "NOT_SUBMITTED", "PENDING", "ACCEPTED"
    const [sellerData, setSellerData] = useState(null); // Dữ liệu gộp (buyer+seller) cho màn hình Pending/Accepted

    // === OCR State ===
    const [ocrData, setOcrData] = useState({
        name: "",           // Điền vào "Full name" (read-only)
        id: "",             // Điền vào "Identity number" (read-only) và gửi đi
        nationality: "",    // Điền vào "Nationality" (read-only) và gửi đi
        home: "",           // Điền vào "Địa chỉ cá nhân" (read-only) và gửi đi
    });
    const [isOcrLoading, setIsOcrLoading] = useState(false); // Loading khi gọi API OCR
    const [ocrError, setOcrError] = useState(null);         // Lỗi từ API OCR

    // === State Preview Ảnh ===
    const [imagePreviews, setImagePreviews] = useState({
        frontOfIdentity: null, backOfIdentity: null, businessLicense: null,
        selfie: null, storePolicy: null,
    });

    // Regex validation
    const regex = {
        storeName: /^[A-Za-z0-9\s\u00C0-\u1EF9]{2,50}$/,
        taxNumber: /^[0-9]{10,13}$/,
        // Bỏ identityNumber regex vì dùng OCR, nhưng giữ validation check rỗng
    };

    // === useEffect: Kiểm tra trạng thái ban đầu ===
   // === useEffect: Kiểm tra trạng thái ban đầu (VỚI LOG DEBUG) ===
    useEffect(() => {
        const checkStatus = async () => {
            console.log("--- UpgradeToSeller: Bắt đầu kiểm tra trạng thái ---");
            setCheckingStatus(true);
            setIsProfileComplete(null); // Reset trạng thái kiểm tra
            setKycStatus(null); // Reset trạng thái KYC
            let buyerProfileData = null;

            try {
                // --- B1: Kiểm tra Profile Buyer ---
                console.log("DEBUG: Đang gọi API getProfile...");
                const buyerResponse = await profileApi.getProfile();
                console.log("DEBUG: Response từ getProfile:", buyerResponse);

                if (!buyerResponse.data?.success) {
                    console.error("Lỗi API getProfile:", buyerResponse.data?.message || "Không rõ lỗi");
                    throw new Error(buyerResponse.data?.message || "Lỗi tải profile buyer.");
                }

                buyerProfileData = buyerResponse.data.data;
                console.log("DEBUG: Dữ liệu buyerProfileData:", buyerProfileData);
                setSellerData(buyerProfileData); // Lưu data buyer (quan trọng)

                // --- KIỂM TRA isComplete ---
                let isComplete = false;
                if (buyerProfileData) {
                    const fn = buyerProfileData.fullName;
                    const ph = buyerProfileData.phoneNumber;
                    const em = buyerProfileData.email;
                    const db = buyerProfileData.dob;
                    const ad = buyerProfileData.street;
                    const av = buyerProfileData.avatarUrl;

                    console.log("DEBUG: Các trường profile TRƯỚC KHI kiểm tra:", { fullName: fn, phoneNumber: ph, email: em, dob: db, street: ad, avatarUrl: av });

                    // Kiểm tra từng trường xem có giá trị hợp lệ không (không null/undefined/rỗng)
                    const fnValid = fn && fn.trim() !== "";
                    const phValid = ph && ph.trim() !== "";
                    const emValid = em && em.trim() !== "";
                    const dbValid = db && db.trim() !== ""; // Chỉ cần không rỗng
                    const adValid = ad && ad.trim() !== "";
                    const avValid = av && av.trim() !== "";

                    console.log("DEBUG: Kết quả kiểm tra từng trường:", { fnValid, phValid, emValid, dbValid, adValid, avValid });

                    // isComplete là true CHỈ KHI TẤT CẢ đều true
                    isComplete = fnValid && phValid && emValid && dbValid && adValid && avValid;

                } else {
                    console.log("DEBUG: buyerProfileData rỗng hoặc null.");
                }

                console.log("DEBUG: >>> Kết quả cuối cùng của isComplete:", isComplete, "<<<");

                if (!isComplete) {
                    console.log("DEBUG: Buyer Profile check THẤT BẠI. -> Hiển thị thông báo.");
                    setIsProfileComplete(false); // <<< LỖI CÓ THỂ Ở ĐÂY
                    setCheckingStatus(false);
                    return; // Dừng lại
                }

                // --- Profile Buyer OK -> Kiểm tra Status Seller ---
                console.log("DEBUG: Buyer Profile check THÀNH CÔNG. -> Kiểm tra Seller Status.");
                setIsProfileComplete(true);

                try {
                    console.log("DEBUG: Đang gọi API getSellerstatus...");
                    const sellerResponse = await profileApi.getSellerstatus();
                    console.log("DEBUG: Response từ getSellerstatus:", sellerResponse);
                    const sellerResponseBody = sellerResponse.data;

                    if (sellerResponseBody.success && sellerResponseBody.data) {
                        console.log("DEBUG: Tìm thấy seller profile:", sellerResponseBody.data);
                        setSellerData(prev => ({ ...prev, ...sellerResponseBody.data }));
                        const statusFromApi = sellerResponseBody.data.status || "NOT_SUBMITTED";
                         console.log("DEBUG: Trạng thái KYC từ API:", statusFromApi);
                        setKycStatus(statusFromApi);
                    } else {
                         console.log("DEBUG: API getSellerstatus không trả về data hoặc báo lỗi nhẹ. -> Coi như NOT_SUBMITTED.");
                        setKycStatus("NOT_SUBMITTED");
                    }
                } catch (sellerError) {
                    const statusCode = sellerError.response?.status;
                    const errMsg = sellerError.response?.data?.error;
                    console.warn("DEBUG: Lỗi khi gọi getSellerstatus:", statusCode, errMsg, sellerError.message);

                    if (statusCode === 404 || (statusCode === 500 && errMsg === "User not existsed.")) {
                         console.log("DEBUG: Lỗi 404 hoặc User not existsed -> Bị từ chối/Chưa nộp -> NOT_SUBMITTED.");
                        setKycStatus("NOT_SUBMITTED");
                    } else {
                        // Lỗi lạ, có thể hiển thị thông báo lỗi chung thay vì form
                        console.error("Lỗi không xác định khi kiểm tra trạng thái seller:", sellerError);
                        // throw sellerError; // Hoặc ném lỗi ra để hiển thị trang lỗi chung
                         setKycStatus("NOT_SUBMITTED"); // Tạm thời vẫn hiện form
                    }
                }
            } catch (error) {
                console.error("Lỗi nghiêm trọng trong useEffect:", error);
                setIsProfileComplete(false); // Nếu có bất kỳ lỗi nào, coi như profile chưa xong
            } finally {
                setCheckingStatus(false); // Luôn tắt loading cuối cùng
                console.log("--- UpgradeToSeller: Kết thúc kiểm tra trạng thái ---");
            }
        };
        checkStatus();
    }, []); // Chỉ chạy 1 lần


    // --- Form Handlers ---

    // Handler cho input text (Store Name, Tax Number)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Validation tức thì
        if (!value.trim()) {
            setErrors((prev) => ({ ...prev, [name]: "Trường này là bắt buộc." }));
        } else if (regex[name] && !regex[name].test(value)) {
            setErrors((prev) => ({ ...prev, [name]: name === "storeName" ? "Tên cửa hàng: 2-50 ký tự, chữ/số." : "Mã số thuế: 10-13 chữ số." }));
        } else {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    // Handler cho CCCD Mặt Trước (có OCR)
    const handleFrontIdUpload = async (e) => {
        const file = e.target.files[0];
        const fieldName = "frontOfIdentity";
        // Clear preview và OCR cũ khi chọn file mới hoặc cancel
        if (imagePreviews[fieldName]) URL.revokeObjectURL(imagePreviews[fieldName]);
        setImagePreviews(prev => ({ ...prev, [fieldName]: null }));
        setOcrData({ name: "", id: "", nationality: "", home: "" });
        setOcrError(null);
        setUploadedFiles(prev => ({ ...prev, [fieldName]: null }));
        setFormData((prev) => ({ ...prev, [fieldName]: null })); // Xóa file cũ khỏi state submit

        if (!file) return; // Dừng nếu người dùng bấm cancel

        setFormData((prev) => ({ ...prev, [fieldName]: file })); // Lưu file mới vào state submit
        setUploadedFiles((prev) => ({ ...prev, [fieldName]: file.name }));
        const previewUrl = URL.createObjectURL(file);
        setImagePreviews(prev => ({ ...prev, [fieldName]: previewUrl }));
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
        setIsOcrLoading(true);

        try {
            const response = await profileApi.getIdentityInfoFromOCR(file);
            if (response.data?.success && response.data?.data) {
                const { name, id, nationality, home } = response.data.data;
                setOcrData({ name: name || "", id: id || "", nationality: nationality || "", home: home || "" });
                setErrors((prev) => ({ ...prev, identityNumber: null })); // Xóa lỗi ID number nếu OCR thành công
            } else {
                throw new Error(response.data?.message || "Không thể đọc thông tin CCCD.");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || "Lỗi đọc CCCD.";
            setOcrError(`Lỗi OCR: ${errorMsg}`);
            // Giữ lại ảnh preview nhưng báo lỗi OCR
        } finally {
            setIsOcrLoading(false);
        }
    };

    // Handler cho các file khác (có preview)
    const handleFileUpload = (e, fieldName) => {
        const file = e.target.files[0];
        // Clear preview cũ
        if (imagePreviews[fieldName]) URL.revokeObjectURL(imagePreviews[fieldName]);
        setImagePreviews(prev => ({ ...prev, [fieldName]: null }));
        setUploadedFiles(prev => ({ ...prev, [fieldName]: null }));
        setFormData((prev) => ({ ...prev, [fieldName]: null })); // Xóa file cũ

        if (!file) return; // Dừng nếu cancel

        setFormData((prev) => ({ ...prev, [fieldName]: file })); // Lưu file mới
        setUploadedFiles((prev) => ({ ...prev, [fieldName]: file.name }));
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));

        // Tạo preview nếu là ảnh
        if (file.type.startsWith("image/")) {
            const previewUrl = URL.createObjectURL(file);
            setImagePreviews(prev => ({ ...prev, [fieldName]: previewUrl }));
        }
    };

    // Validate Form (kiểm tra OCR ID)
    const validateForm = () => {
        const newErrors = {};
        if (!formData.storeName.trim() || !regex.storeName.test(formData.storeName)) newErrors.storeName = "Tên cửa hàng: 2-50 ký tự, chữ/số.";
        if (!formData.taxNumber.trim() || !regex.taxNumber.test(formData.taxNumber)) newErrors.taxNumber = "Mã số thuế: 10-13 chữ số.";
        if (!ocrData.id) newErrors.identityNumber = "Vui lòng tải CCCD mặt trước hợp lệ để lấy số."; // Lỗi nếu OCR chưa có ID
        const requiredFiles = ["frontOfIdentity", "backOfIdentity", "businessLicense", "selfie", "storePolicy"];
        requiredFiles.forEach((f) => { if (!formData[f]) newErrors[f] = "Vui lòng tải file này."; });
        if (!agreePolicy) newErrors.policy = "Bạn cần đồng ý với điều khoản.";
        setErrors(newErrors);
        return newErrors;
    };

    // Reset Form (reset cả OCR và previews)
    const handleReset = () => {
        setFormData({ storeName: "", taxNumber: "", /* identityNumber ko cần reset */ frontOfIdentity: null, backOfIdentity: null, businessLicense: null, selfie: null, storePolicy: null });
        setUploadedFiles({ frontOfIdentity: null, backOfIdentity: null, businessLicense: null, selfie: null, storePolicy: null });
        setAgreePolicy(false);
        setErrors({});
        setIsLoading(false);
        setShowLoadingMessage(false);
        // Reset OCR
        setOcrData({ name: "", id: "", nationality: "", home: "" });
        setOcrError(null);
        setIsOcrLoading(false);
        // Reset Previews và giải phóng URLs
        Object.values(imagePreviews).forEach(url => url && URL.revokeObjectURL(url));
        setImagePreviews({ frontOfIdentity: null, backOfIdentity: null, businessLicense: null, selfie: null, storePolicy: null });
    };

    // --- Submit KYC ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading || isOcrLoading) return; // Chặn submit khi đang loading
        setShowLoadingMessage(false);

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
             const firstErrorField = Object.keys(formErrors)[0];
             // Tìm input tương ứng (kể cả input read-only của OCR)
             const firstErrorElement = document.getElementById(firstErrorField)
                                    || document.getElementById('identityNumberOcr') // ID của input CCCD read-only
                                    || document.getElementById('ocrFullName') // ID của input tên read-only
                                    || document.getElementById('ocrNationality') // ID của input quốc tịch read-only
                                    || document.getElementById('ocrHome'); // ID của input địa chỉ read-only
             if (firstErrorElement?.focus) {
                  try { firstErrorElement.focus(); } catch { console.warn("Could not focus error field:", firstErrorField); }
             }
            alert("Vui lòng kiểm tra lại các thông tin lỗi.");
            return;
        }

        setIsLoading(true); // Bật loading submit
        setShowLoadingMessage(true);
        try {
            const formBody = new FormData();
            // Dữ liệu nhập tay
            formBody.append("storeName", formData.storeName);
            formBody.append("taxNumber", formData.taxNumber);
            // Dữ liệu từ OCR (theo DTO backend)
            formBody.append("identityNumber", ocrData.id);
            formBody.append("nationality", ocrData.nationality);
            formBody.append("home", ocrData.home);
            formBody.append("sellerName", ocrData.name); // Tạm dùng name OCR cho sellerName

            // Các file
            formBody.append("front of identity", formData.frontOfIdentity);
            formBody.append("back of identity", formData.backOfIdentity);
            formBody.append("business license", formData.businessLicense);
            formBody.append("store policy", formData.storePolicy);
            formBody.append("selfie", formData.selfie);

            const response = await profileApi.verifyKyc(formBody);
            if (!response.data?.success) throw new Error(response.data?.message || "Lỗi gửi đơn KYC.");

            // --- THÀNH CÔNG -> Chuyển sang PENDING ---
            setShowLoadingMessage(false);
            // Cập nhật sellerData để truyền cho màn Pending
            setSellerData(prev => ({
                ...prev,
                storeName: formData.storeName,
                // Lấy createAt từ response nếu có, nếu không thì giữ cái cũ hoặc tạo mới
                createAt: response.data?.data?.createAt || prev?.createAt || new Date().toISOString()
            }));
            setKycStatus("PENDING"); // Chuyển giao diện

        } catch (error) {
            console.error("KYC Submission Error:", error);
            setShowLoadingMessage(false);
            alert(error.response?.data?.message || error.message || "Không thể gửi đơn KYC.");
            if (error.response?.data?.errors) setErrors(error.response.data.errors);
        } finally {
            setIsLoading(false); // Tắt loading submit
        }
    };

    // --- Cleanup Image Preview URLs on Unmount ---
    useEffect(() => {
        // Hàm cleanup chạy khi component unmount
        return () => {
            Object.values(imagePreviews).forEach(url => {
                if (url && url.startsWith('blob:')) { // Chỉ revoke blob URLs
                    URL.revokeObjectURL(url);
                    console.log("Revoked preview URL on unmount:", url)
                }
            });
        };
    }, []); // Dependency rỗng để chỉ chạy khi unmount


    // ------------------------------------
    // === RENDER CHÍNH (THEO TRẠNG THÁI) ===
    // ------------------------------------

    // 1. Loading ban đầu
    if (checkingStatus) {
        return <div className="upgrade-container"><p className="form-message loading">Đang kiểm tra thông tin...</p></div>;
    }

    // 2. Profile Buyer chưa hoàn tất
    if (!isProfileComplete) {
        return (
            <div className="upgrade-container">
                <div className="upgrade-wrapper profile-incomplete-notice">
                    <p className="form-message error">Bạn chưa hoàn thành thông tin cá nhân.</p>
                    <p className="form-message">Vui lòng quay về trang thông tin cá nhân để tiếp tục.</p>
                    <div className="form-buttons">
                        <button type="button" className="btn btn-submit" onClick={onGoToProfile}>Hoàn tất hồ sơ</button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Hiển thị theo Status KYC
    if (kycStatus === "ACCEPTED") return <SellerApplicationAccepted data={sellerData} />;
    if (kycStatus === "PENDING") return <SellerApplicationPending data={sellerData} />;

    // 4. Hiện Form Đăng Ký KYC (NOT_SUBMITTED / REJECTED)
    return (
        <div className="upgrade-container">
            <div className="upgrade-wrapper">
                <h1 className="upgrade-title">Trở thành người bán</h1>
                {showLoadingMessage && ( <p className="form-message loading">Hệ thống đang xác thực...</p> )}

                <form onSubmit={handleSubmit} className="upgrade-form" noValidate>

                    {/* === 1. CCCD Mặt Trước (Upload + OCR + Preview) === */}
                    <div className="file-upload-item">
                        <label htmlFor="frontOfIdentity" className="file-label">Ảnh CCCD mặt trước *</label>
                        {imagePreviews.frontOfIdentity && (
                            <div className="image-preview-container">
                                <img src={imagePreviews.frontOfIdentity} alt="Xem trước CCCD mặt trước" className="image-preview"/>
                            </div>
                        )}
                        <div className={`file-upload-box ${errors.frontOfIdentity ? 'input-error' : ''}`}>
                            <input
                                type="file" id="frontOfIdentity" name="frontOfIdentity"
                                onChange={handleFrontIdUpload}
                                className="file-input" accept="image/jpeg, image/png, image/jpg"
                                disabled={isLoading || isOcrLoading}
                                aria-invalid={!!errors.frontOfIdentity || !!ocrError}
                                aria-describedby={errors.frontOfIdentity ? "frontOfIdentity-error" : (ocrError ? "frontOfIdentity-ocr-error" : undefined) }
                            />
                            <label htmlFor="frontOfIdentity" className={`file-button ${isLoading || isOcrLoading ? 'disabled' : ''}`}>
                                {isOcrLoading ? "Đang đọc..." : (uploadedFiles.frontOfIdentity ? "Chọn ảnh khác" : "⬇ Tải ảnh")}
                            </label>
                            {isOcrLoading && <span className="ocr-status">Đang xử lý...</span>}
                            {!isOcrLoading && !ocrError && uploadedFiles.frontOfIdentity && <p className="file-name">{uploadedFiles.frontOfIdentity}</p>}
                        </div>
                        {ocrError && <p id="frontOfIdentity-ocr-error" className="error-text ocr-error">{ocrError}</p>}
                        {errors.frontOfIdentity && !ocrError && <p id="frontOfIdentity-error" className="error-text">{errors.frontOfIdentity}</p>}
                    </div>

                    {/* === 2. Thông tin từ OCR (Read Only) === */}
                     <div className="form-group">
                         <label htmlFor="ocrFullName" className="form-label">Full name</label>
                         <input id="ocrFullName" name="ocrFullName" type="text" value={ocrData.name} readOnly className="form-input read-only-input" />
                     </div>
                    <div className="form-group">
                         <label htmlFor="identityNumberOcr" className="form-label">Identity number *</label>
                         <input id="identityNumberOcr" name="identityNumberOcr" type="text" value={ocrData.id} readOnly className={`form-input read-only-input ${errors.identityNumber ? "input-error" : ""}`} aria-describedby={errors.identityNumber ? "identityNumber-error" : undefined} />
                         {errors.identityNumber && (<p id="identityNumber-error" className="error-text">{errors.identityNumber}</p>)}
                     </div>
                     <div className="form-group">
                         <label htmlFor="ocrNationality" className="form-label">Nationality</label>
                         <input id="ocrNationality" name="ocrNationality" type="text" value={ocrData.nationality} readOnly className="form-input read-only-input" />
                     </div>
                     <div className="form-group">
                         <label htmlFor="ocrHome" className="form-label">Địa chỉ cá nhân</label>
                         <input id="ocrHome" name="ocrHome" type="text" value={ocrData.home} readOnly className="form-input read-only-input" />
                     </div>

                    {/* === 3. Thông tin cần nhập tay === */}
                    <div className="form-group">
                        <label htmlFor="storeName" className="form-label">Store name *</label>
                        <input id="storeName" name="storeName" value={formData.storeName} onChange={handleInputChange} className={`form-input ${errors.storeName ? "input-error" : ""}`} aria-invalid={!!errors.storeName} aria-describedby={errors.storeName ? "storeName-error" : undefined}/>
                        {errors.storeName && <p id="storeName-error" className="error-text">{errors.storeName}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="taxNumber" className="form-label">Tax number *</label>
                        <input id="taxNumber" name="taxNumber" value={formData.taxNumber} onChange={handleInputChange} className={`form-input ${errors.taxNumber ? "input-error" : ""}`} aria-invalid={!!errors.taxNumber} aria-describedby={errors.taxNumber ? "taxNumber-error" : undefined}/>
                        {errors.taxNumber && <p id="taxNumber-error" className="error-text">{errors.taxNumber}</p>}
                    </div>


                    {/* === 4. Các file upload khác (Có Preview) === */}
                     <p className="upload-note">Upload các giấy tờ còn lại (PDF or image).</p>
                     {[
                         ["backOfIdentity", "Ảnh CCCD mặt sau *"],
                         ["businessLicense", "Giấy phép kinh doanh *"],
                         ["selfie", "Ảnh chân dung (Selfie) *"],
                         ["storePolicy", "Chính sách cửa hàng *"],
                     ].map(([key, label]) => (
                         <div className="file-upload-item" key={key}>
                             <label htmlFor={key} className="file-label">{label}</label>
                             {imagePreviews[key] && (
                                 <div className="image-preview-container">
                                     <img src={imagePreviews[key]} alt={`Xem trước ${label}`} className="image-preview"/>
                                 </div>
                             )}
                             <div className={`file-upload-box ${errors[key] ? 'input-error' : ''}`}>
                                 <input type="file" id={key} name={key} onChange={(e) => handleFileUpload(e, key)} className="file-input" accept=".pdf,.jpg,.jpeg,.png" disabled={isLoading} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined}/>
                                 <label htmlFor={key} className={`file-button ${isLoading ? 'disabled' : ''}`}>⬇ Tải file</label>
                             </div>
                             {uploadedFiles[key] && <p className="file-name">{uploadedFiles[key]}</p>}
                             {errors[key] && <p id={`${key}-error`} className="error-text">{errors[key]}</p>}
                         </div>
                     ))}

                    {/* === 5. Policy và Buttons === */}
                     <div className={`policy-agreement ${errors.policy ? 'input-error' : ''}`}>
                         <input type="checkbox" id="agreePolicy" checked={agreePolicy} onChange={(e) => { setAgreePolicy(e.target.checked); if (e.target.checked) setErrors(prev => ({ ...prev, policy: null })); }} className="checkbox-input" disabled={isLoading} aria-invalid={!!errors.policy} aria-describedby={errors.policy ? "policy-error" : undefined}/>
                         <label htmlFor="agreePolicy" className="agreement-text">
                             Tôi đồng ý với các điều khoản và chính sách. *
                             <button type="button" className="policy-link" onClick={() => !isLoading && setShowPolicyModal(true)} disabled={isLoading}>Chính sách</button>
                         </label>
                     </div>
                     {errors.policy && <p id="policy-error" className="error-text" style={{ marginTop: '8px' }}>{errors.policy}</p>}

                     <div className="form-buttons">
                         <button type="submit" className="btn btn-submit" disabled={isLoading || isOcrLoading}>
                             {isLoading ? "Đang gửi..." : "Gửi đơn đăng ký"}
                         </button>
                         <button type="button" className="btn btn-reset" onClick={handleReset} disabled={isLoading}>
                             Hủy
                         </button>
                     </div>
                </form>
            </div>
            {showPolicyModal && <PolicyModal onClose={() => setShowPolicyModal(false)} />}
        </div>
    );
}