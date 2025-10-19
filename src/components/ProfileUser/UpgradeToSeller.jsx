"use client";

import { useState } from "react";
import "./UpgradeToSeller.css";
import PolicyModal from "./PolicyModal";
import profileApi from "../../api/profileApi";

export default function UpgradeToSeller() {
  const [formData, setFormData] = useState({
    storeName: "",
    taxNumber: "",
    identityNumber: "",
    frontOfIdentity: null,
    backOfIdentity: null,
    businessLicense: null,
    selfie: null,
    storePolicy: null,
  });

  const [errors, setErrors] = useState({});
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    frontOfIdentity: null,
    backOfIdentity: null,
    businessLicense: null,
    selfie: null,
    storePolicy: null,
  });

  // 🧩 Regex giống backend (Java Pattern)
  const regex = {
    storeName: /^[A-Za-z0-9\s\u00C0-\u1EF9]{2,50}$/,
    taxNumber: /^[0-9]{10,13}$/,
    identityNumber: /^[0-9]{9,12}$/,
  };

  // 🧩 Xử lý nhập liệu realtime
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // validate realtime
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: "This field is required." }));
    } else if (regex[name] && !regex[name].test(value)) {
      setErrors((prev) => ({
        ...prev,
        [name]:
          name === "storeName"
            ? "Store name must be 2–50 characters, letters & numbers only."
            : name === "taxNumber"
            ? "Tax number must be 10–13 digits."
            : "Identity number must be 9–12 digits.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // 🧩 Xử lý upload file
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
      setUploadedFiles((prev) => ({
        ...prev,
        [fieldName]: file.name,
      }));
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  // 🧩 Validate toàn form trước khi gửi
  const validateForm = () => {
    const newErrors = {};
    if (!formData.storeName.trim()) newErrors.storeName = "Store name is required.";
    if (!formData.taxNumber.trim()) newErrors.taxNumber = "Tax number is required.";
    if (!formData.identityNumber.trim())
      newErrors.identityNumber = "Identity number is required.";

    // check regex
    if (formData.storeName && !regex.storeName.test(formData.storeName))
      newErrors.storeName =
        "Store name must be 2–50 characters, letters & numbers only.";
    if (formData.taxNumber && !regex.taxNumber.test(formData.taxNumber))
      newErrors.taxNumber = "Tax number must be 10–13 digits.";
    if (formData.identityNumber && !regex.identityNumber.test(formData.identityNumber))
      newErrors.identityNumber = "Identity number must be 9–12 digits.";

    // file required
    ["frontOfIdentity", "backOfIdentity", "businessLicense", "selfie", "storePolicy"].forEach(
      (f) => {
        if (!formData[f]) newErrors[f] = "Please upload this file.";
      }
    );

    // policy required
    if (!agreePolicy) newErrors.policy = "You must agree to the terms.";

    setErrors(newErrors);
    return newErrors;
  };

  // 🧩 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      const missing = Object.entries(newErrors)
        .map(([key, msg]) => `• ${key}: ${msg}`)
        .join("\n");
      alert("Please correct these errors before submitting:\n\n" + missing);
      return;
    }

    try {
      const formBody = new FormData();
      formBody.append("storeName", formData.storeName);
      formBody.append("taxNumber", formData.taxNumber);
      formBody.append("identityNumber", formData.identityNumber);
      formBody.append("front of identity", formData.frontOfIdentity);
      formBody.append("back of identity", formData.backOfIdentity);
      formBody.append("business license", formData.businessLicense);
      formBody.append("store policy", formData.storePolicy);
      formBody.append("selfie", formData.selfie);

      await profileApi.verifyKyc(formBody);
      alert("KYC verification submitted successfully!");
      handleReset();
    } catch (error) {
      console.error("KYC Error:", error);
      alert(error.message || "Failed to submit KYC verification.");
    }
  };

  const handleReset = () => {
    setFormData({
      storeName: "",
      taxNumber: "",
      identityNumber: "",
      frontOfIdentity: null,
      backOfIdentity: null,
      businessLicense: null,
      selfie: null,
      storePolicy: null,
    });
    setUploadedFiles({
      frontOfIdentity: null,
      backOfIdentity: null,
      businessLicense: null,
      selfie: null,
      storePolicy: null,
    });
    setAgreePolicy(false);
    setErrors({});
  };

  return (
    <div className="upgrade-container">
      <div className="upgrade-wrapper">
        <h1 className="upgrade-title">Trở thành người bán</h1>

        <form onSubmit={handleSubmit} className="upgrade-form">
          {/* Store Name */}
          <div className="form-group">
            <label className="form-label">Store name *</label>
            <input
              name="storeName"
              value={formData.storeName}
              onChange={handleInputChange}
              className={`form-input ${errors.storeName ? "input-error" : ""}`}
            />
            {errors.storeName && <p className="error-text">{errors.storeName}</p>}
          </div>

          {/* Tax Number */}
          <div className="form-group">
            <label className="form-label">Tax number *</label>
            <input
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleInputChange}
              className={`form-input ${errors.taxNumber ? "input-error" : ""}`}
            />
            {errors.taxNumber && <p className="error-text">{errors.taxNumber}</p>}
          </div>

          {/* Identity Number */}
          <div className="form-group">
            <label className="form-label">Identity number *</label>
            <input
              name="identityNumber"
              value={formData.identityNumber}
              onChange={handleInputChange}
              className={`form-input ${errors.identityNumber ? "input-error" : ""}`}
            />
            {errors.identityNumber && (
              <p className="error-text">{errors.identityNumber}</p>
            )}
          </div>

          <p className="upload-note">Upload 1 supported file: PDF or image.</p>

          {/* File Inputs */}
          {[
            ["frontOfIdentity", "Front of identity image"],
            ["backOfIdentity", "Back of identity image"],
            ["businessLicense", "Business license"],
            ["selfie", "Selfie (portrait picture)"],
            ["storePolicy", "Store policy"],
          ].map(([key, label]) => (
            <div className="file-upload-item" key={key}>
              <label className="file-label">{label}</label>
              <div className="file-upload-box">
                <input
                  type="file"
                  id={key}
                  onChange={(e) => handleFileUpload(e, key)}
                  className="file-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor={key} className="file-button">
                  ⬇ Add file
                </label>
              </div>
              {uploadedFiles[key] && <p className="file-name">{uploadedFiles[key]}</p>}
              {errors[key] && <p className="error-text">{errors[key]}</p>}
            </div>
          ))}

          {/* Policy Agreement */}
          <div className="policy-agreement">
            <input
              type="checkbox"
              id="agreePolicy"
              checked={agreePolicy}
              onChange={(e) => setAgreePolicy(e.target.checked)}
              className="checkbox-input"
            />
            <label htmlFor="agreePolicy" className="agreement-text">
              I agree to the terms and policies.
              <button
                type="button"
                className="policy-link"
                onClick={() => setShowPolicyModal(true)}
              >
                Chính sách
              </button>
            </label>
          </div>
          {errors.policy && <p className="error-text">{errors.policy}</p>}

          {/* Buttons */}
          <div className="form-buttons">
            <button type="submit" className="btn btn-submit">
              Submit
            </button>
            <button type="button" className="btn btn-reset" onClick={handleReset}>
              Hủy
            </button>
          </div>
        </form>
      </div>
      {showPolicyModal && <PolicyModal onClose={() => setShowPolicyModal(false)} />}
    </div>
  );
}
