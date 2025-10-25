import { useState, useEffect } from "react";
import "./UpgradeToSeller.css"; // Main CSS for the form container and incomplete notice
import PolicyModal from "./PolicyModal"; // Assume this component exists
import profileApi from "../../api/profileApi"; // Your API functions

// 1. Import child components and their specific CSS
// Ensure these files exist and contain the simplified code (receiving data via props)
import SellerApplicationPending from "./SellerApplicationPending";
import SellerApplicationAccepted from "./SellerApplicationAccepted";



export default function UpgradeToSeller({ onGoToProfile }) { // Prop to go back to profile form
    // === Form State ===
    const [formData, setFormData] = useState({
        storeName: "", taxNumber: "", identityNumber: "",
        frontOfIdentity: null, backOfIdentity: null, businessLicense: null,
        selfie: null, storePolicy: null,
    });
    const [errors, setErrors] = useState({});
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState({
        frontOfIdentity: null, backOfIdentity: null, businessLicense: null,
        selfie: null, storePolicy: null,
    });
    const [isLoading, setIsLoading] = useState(false); // Loading state for form submission
    const [showLoadingMessage, setShowLoadingMessage] = useState(false); // Message during submission

    // === Flow Control State ===
    const [checkingStatus, setCheckingStatus] = useState(true); // Initial loading state
    const [isProfileComplete, setIsProfileComplete] = useState(null); // Buyer profile check result
    const [kycStatus, setKycStatus] = useState(null); // KYC status: null, "NOT_SUBMITTED", "PENDING", "ACCEPTED"
    const [sellerData, setSellerData] = useState(null); // Stores combined data from buyer/seller profiles

    // Regex for validation
    const regex = {
        storeName: /^[A-Za-z0-9\s\u00C0-\u1EF9]{2,50}$/,
        taxNumber: /^[0-9]{10,13}$/,
        identityNumber: /^[0-9]{9,12}$/,
    };

    // === useEffect: Check Buyer Profile & Seller Status ===
    useEffect(() => {
        const checkStatus = async () => {
            setCheckingStatus(true);
            let buyerProfileData = null;

            try {
                // --- Step 1: Check Buyer Profile Completion ---
                console.log("DEBUG: Checking Buyer Profile...");
                const buyerResponse = await profileApi.getProfile();
                const buyerResponseBody = buyerResponse.data;
                if (!buyerResponseBody.success) throw new Error(buyerResponseBody.message || "Failed to fetch buyer profile.");

                buyerProfileData = buyerResponseBody.data;
                setSellerData(buyerProfileData); // Initialize with buyer data

                // Check if essential buyer profile fields are filled
                let isComplete = false;
                if (buyerProfileData) {
                    const { fullName, phoneNumber, email, dob, defaultShippingAddress, avatarUrl } = buyerProfileData;
                    isComplete = !!(fullName && phoneNumber && email && dob && defaultShippingAddress && avatarUrl);
                }

                if (!isComplete) {
                    console.log("DEBUG: Buyer Profile check FAILED.");
                    setIsProfileComplete(false); // Trigger "incomplete profile" message
                    setCheckingStatus(false);
                    return; // Stop here
                }

                // --- Step 2: Buyer Profile OK, Check Seller/KYC Status ---
                console.log("DEBUG: Buyer Profile OK. Checking Seller Status...");
                setIsProfileComplete(true);

                try {
                    const sellerResponse = await profileApi.getSellerstatus(); // Call seller profile API
                    const sellerResponseBody = sellerResponse.data;

                    if (sellerResponseBody.success && sellerResponseBody.data) {
                        console.log("DEBUG: Seller profile data found:", sellerResponseBody.data);
                        // Merge seller data (storeName, status, createAt) into existing data
                        setSellerData(prev => ({ ...prev, ...sellerResponseBody.data }));
                        // Get status from seller profile response (ensure backend sends 'status')
                        const statusFromSellerApi = sellerResponseBody.data.status || "NOT_SUBMITTED";
                        console.log("DEBUG: KYC Status from Seller API:", statusFromSellerApi);
                        setKycStatus(statusFromSellerApi);
                    } else {
                         // API succeeded but returned success: false or data: null (treat as NOT_SUBMITTED)
                         console.log("DEBUG: Seller profile API returned success:false or data:null. Assuming NOT_SUBMITTED.", sellerResponseBody);
                         setKycStatus("NOT_SUBMITTED");
                    }
                } catch (sellerError) {
                    // Handle errors from seller profile API
                    // 404 means not submitted yet
                    // "User not existsed." means rejected (record deleted)
                    if ((sellerError.response && sellerError.response.status === 404) ||
                        (sellerError.response?.data?.error === "User not existsed."))
                    {
                         console.log("DEBUG: Seller profile 404 or deleted (Rejected). Assuming NOT_SUBMITTED.");
                         setKycStatus("NOT_SUBMITTED"); // Show the form again
                    } else {
                        // Other unexpected errors fetching seller status
                        console.error("DEBUG: Error fetching seller status:", sellerError.message);
                        setKycStatus("NOT_SUBMITTED"); // Default to form on other errors
                    }
                }

            } catch (buyerError) {
                // Error fetching the initial buyer profile
                console.error("DEBUG: Error checking buyer profile:", buyerError.message);
                setIsProfileComplete(false); // If buyer profile fails, treat as incomplete
            } finally {
                setCheckingStatus(false); // Always finish loading check
            }
        };
        checkStatus();
    }, []); // Run only once on mount

    // --- Form Handlers ---

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Real-time validation
        if (!value.trim()) {
            setErrors((prev) => ({ ...prev, [name]: "This field is required." }));
        } else if (regex[name] && !regex[name].test(value)) {
            setErrors((prev) => ({
                ...prev, [name]: name === "storeName" ? "Store name: 2-50 chars, letters/numbers."
                           : name === "taxNumber" ? "Tax number: 10-13 digits."
                           : "Identity number: 9-12 digits.",
            }));
        } else {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleFileUpload = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, [fieldName]: file }));
            setUploadedFiles((prev) => ({ ...prev, [fieldName]: file.name }));
            setErrors((prev) => ({ ...prev, [fieldName]: "" })); // Clear error on file select
        }
        // Keep existing file if user cancels
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.storeName.trim() || !regex.storeName.test(formData.storeName)) newErrors.storeName = "Store name: 2-50 chars, letters/numbers.";
        if (!formData.taxNumber.trim() || !regex.taxNumber.test(formData.taxNumber)) newErrors.taxNumber = "Tax number: 10-13 digits.";
        if (!formData.identityNumber.trim() || !regex.identityNumber.test(formData.identityNumber)) newErrors.identityNumber = "Identity number: 9-12 digits.";
        const requiredFiles = ["frontOfIdentity", "backOfIdentity", "businessLicense", "selfie", "storePolicy"];
        requiredFiles.forEach((f) => { if (!formData[f]) newErrors[f] = "Please upload this file."; });
        if (!agreePolicy) newErrors.policy = "You must agree to the terms.";
        setErrors(newErrors);
        return newErrors;
    };

    const handleReset = () => {
        setFormData({ storeName: "", taxNumber: "", identityNumber: "", frontOfIdentity: null, backOfIdentity: null, businessLicense: null, selfie: null, storePolicy: null });
        setUploadedFiles({ frontOfIdentity: null, backOfIdentity: null, businessLicense: null, selfie: null, storePolicy: null });
        setAgreePolicy(false);
        setErrors({});
        setIsLoading(false);
        setShowLoadingMessage(false);
    };

    // --- Submit KYC Application ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setShowLoadingMessage(false);

        const formErrors = validateForm(); // Re-validate before submit
        if (Object.keys(formErrors).length > 0) {
            const firstErrorField = Object.keys(formErrors)[0];
            const firstErrorElement = document.getElementById(firstErrorField);
            if (firstErrorElement?.focus) firstErrorElement.focus();
            alert("Please correct the errors marked in red.");
            return;
        }

        setIsLoading(true);
        setShowLoadingMessage(true);
        try {
            const formBody = new FormData();
            formBody.append("storeName", formData.storeName);
            formBody.append("taxNumber", formData.taxNumber);
            formBody.append("identityNumber", formData.identityNumber);
            // Ensure backend expects these exact key names for files
            formBody.append("front of identity", formData.frontOfIdentity);
            formBody.append("back of identity", formData.backOfIdentity);
            formBody.append("business license", formData.businessLicense);
            formBody.append("store policy", formData.storePolicy);
            formBody.append("selfie", formData.selfie);

            await profileApi.verifyKyc(formBody); // Call the KYC submission API

            // --- SUCCESS -> Switch to PENDING view ---
            console.log("DEBUG: KYC Submit Success!");
            setShowLoadingMessage(false);

            // Update sellerData state with submitted info for the Pending screen
            setSellerData(prev => ({
                ...prev, // Keep existing buyer data (like fullName)
                storeName: formData.storeName,
                // If API doesn't return createAt, simulate it for display
                createAt: prev?.createAt || new Date().toISOString() // Use createAt based on API response
            }));

            // --- This is the crucial step to change the UI ---
            setKycStatus("PENDING");

        } catch (error) {
            console.error("KYC Submission Error:", error);
            setShowLoadingMessage(false);
            // Display specific error from backend if available, otherwise generic message
            alert(error.response?.data?.message || error.message || "Failed to submit KYC verification.");
            // Display field-specific validation errors from server if provided
            if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
                setErrors(error.response.data.errors);
            }
        } finally {
            setIsLoading(false); // Always turn off loading state
        }
    };

    // ------------------------------------
    // === CONDITIONAL RENDERING LOGIC ===
    // ------------------------------------

    // 1. Show loading indicator during initial checks
    if (checkingStatus) {
        return (
            <div className="upgrade-container">
                <p className="form-message loading">Đang kiểm tra thông tin...</p>
            </div>
        );
    }

    // 2. Show message if buyer profile is incomplete
    if (!isProfileComplete) {
        return (
            <div className="upgrade-container">
                <div className="upgrade-wrapper profile-incomplete-notice">
                    <p className="form-message error">Bạn chưa hoàn thành thông tin cá nhân.</p>
                    <p className="form-message">Vui lòng quay về trang thông tin cá nhân để tiếp tục.</p>
                    <div className="form-buttons">
                        {/* This button uses the passed function to switch view in parent */}
                        <button type="button" className="btn btn-submit" onClick={onGoToProfile}>
                           Hoàn tất hồ sơ {/* Button text */}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Buyer profile is complete, render based on KYC status

    // 3a. KYC is ACCEPTED
    if (kycStatus === "ACCEPTED") {
        // Pass the combined sellerData (buyer info + seller info)
        return <SellerApplicationAccepted data={sellerData} />;
    }

    // 3b. KYC is PENDING
    if (kycStatus === "PENDING") {
        // Pass the combined sellerData
        return <SellerApplicationPending data={sellerData} />;
    }

    // 4. KYC is NOT_SUBMITTED (or null, or rejected/deleted) -> Show the application form
    return (
        <div className="upgrade-container">
            <div className="upgrade-wrapper">
                <h1 className="upgrade-title">Trở thành người bán</h1>

                {/* Loading message during form submission */}
                {showLoadingMessage && (
                    <p className="form-message loading">
                        Hệ thống đang xác thực thông tin của bạn. Vui lòng đợi...
                    </p>
                )}

                <form onSubmit={handleSubmit} className="upgrade-form" noValidate>
                    {/* Store Name */}
                    <div className="form-group">
                        <label htmlFor="storeName" className="form-label">Store name *</label>
                        <input id="storeName" name="storeName" value={formData.storeName} onChange={handleInputChange} className={`form-input ${errors.storeName ? "input-error" : ""}`} aria-invalid={!!errors.storeName} aria-describedby={errors.storeName ? "storeName-error" : undefined}/>
                        {errors.storeName && <p id="storeName-error" className="error-text">{errors.storeName}</p>}
                    </div>

                    {/* Tax Number */}
                    <div className="form-group">
                        <label htmlFor="taxNumber" className="form-label">Tax number *</label>
                        <input id="taxNumber" name="taxNumber" value={formData.taxNumber} onChange={handleInputChange} className={`form-input ${errors.taxNumber ? "input-error" : ""}`} aria-invalid={!!errors.taxNumber} aria-describedby={errors.taxNumber ? "taxNumber-error" : undefined}/>
                        {errors.taxNumber && <p id="taxNumber-error" className="error-text">{errors.taxNumber}</p>}
                    </div>

                    {/* Identity Number */}
                    <div className="form-group">
                        <label htmlFor="identityNumber" className="form-label">Identity number *</label>
                        <input id="identityNumber" name="identityNumber" value={formData.identityNumber} onChange={handleInputChange} className={`form-input ${errors.identityNumber ? "input-error" : ""}`} aria-invalid={!!errors.identityNumber} aria-describedby={errors.identityNumber ? "identityNumber-error" : undefined}/>
                        {errors.identityNumber && (<p id="identityNumber-error" className="error-text">{errors.identityNumber}</p>)}
                    </div>

                    <p className="upload-note">Upload 1 supported file: PDF or image.</p>

                    {/* File Inputs */}
                    {[
                        ["frontOfIdentity", "Front of identity image *"],
                        ["backOfIdentity", "Back of identity image *"],
                        ["businessLicense", "Business license *"],
                        ["selfie", "Selfie (portrait picture) *"],
                        ["storePolicy", "Store policy *"],
                    ].map(([key, label]) => (
                        <div className="file-upload-item" key={key}>
                            <label className="file-label">{label}</label>
                            <div className={`file-upload-box ${errors[key] ? 'input-error' : ''}`}>
                                <input type="file" id={key} name={key} onChange={(e) => handleFileUpload(e, key)} className="file-input" accept=".pdf,.jpg,.jpeg,.png" disabled={isLoading} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined}/>
                                <label htmlFor={key} className={`file-button ${isLoading ? 'disabled' : ''}`}>
                                    ⬇ Add file
                                </label>
                            </div>
                            {uploadedFiles[key] && <p className="file-name">{uploadedFiles[key]}</p>}
                            {errors[key] && <p id={`${key}-error`} className="error-text">{errors[key]}</p>}
                        </div>
                    ))}

                    {/* Policy Agreement */}
                    <div className={`policy-agreement ${errors.policy ? 'input-error' : ''}`}>
                        <input type="checkbox" id="agreePolicy" checked={agreePolicy} onChange={(e) => { setAgreePolicy(e.target.checked); if (e.target.checked) setErrors(prev => ({ ...prev, policy: null })); }} className="checkbox-input" disabled={isLoading} aria-invalid={!!errors.policy} aria-describedby={errors.policy ? "policy-error" : undefined}/>
                        <label htmlFor="agreePolicy" className="agreement-text">
                            I agree to the terms and policies. *
                            <button type="button" className="policy-link" onClick={() => !isLoading && setShowPolicyModal(true)} disabled={isLoading}>
                                Chính sách
                            </button>
                        </label>
                    </div>
                    {errors.policy && <p id="policy-error" className="error-text" style={{ marginTop: '8px' }}>{errors.policy}</p>}

                    {/* Buttons */}
                    <div className="form-buttons">
                        <button type="submit" className="btn btn-submit" disabled={isLoading}>
                            {isLoading ? "Đang gửi..." : "Submit"}
                        </button>
                        <button type="button" className="btn btn-reset" onClick={handleReset} disabled={isLoading}>
                            Hủy
                        </button>
                    </div>
                </form>
            </div>

            {/* Policy Modal */}
            {showPolicyModal && <PolicyModal onClose={() => setShowPolicyModal(false)} />}
        </div>
    );
}