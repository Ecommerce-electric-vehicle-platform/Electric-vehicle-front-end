"use client"

import { useState } from "react"
import "./UpgradeToSeller.css"

export default function UpgradeToSeller({ username }) {
  const [formData, setFormData] = useState({
    storeName: "",
    taxNumber: "",
    identityNumber: "",
  })

  const [files, setFiles] = useState({
    frontIdentity: null,
    backIdentity: null,
    businessLicense: null,
    portrait: null,
    storePolicy: null,
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5 MB")
        return
      }
      setFiles((prev) => ({
        ...prev,
        [fieldName]: file,
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form Data:", formData)
    console.log("Files:", files)
    // Add your submit logic here
    alert("Seller upgrade request submitted!")
  }

  return (
    <div className="upgrade-to-seller">
      <h2>Upgrade to Seller</h2>
      <p className="welcome-text">Welcome &lt;{username || "User"}&gt;</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="storeName">Store name* :</label>
          <input
            type="text"
            id="storeName"
            name="storeName"
            value={formData.storeName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="taxNumber">Tax number :</label>
          <input type="text" id="taxNumber" name="taxNumber" value={formData.taxNumber} onChange={handleInputChange} />
        </div>

        <div className="form-group">
          <label htmlFor="identityNumber">Identity number* :</label>
          <input
            type="text"
            id="identityNumber"
            name="identityNumber"
            value={formData.identityNumber}
            onChange={handleInputChange}
            required
          />
        </div>

        <p className="upload-instruction">Upload 1 supported file: PDF or image. Max 5 MB.</p>

        <div className="file-upload-group">
          <label>Front of identity image</label>
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="frontIdentity"
              accept=".pdf,image/*"
              onChange={(e) => handleFileChange(e, "frontIdentity")}
              style={{ display: "none" }}
            />
            <label htmlFor="frontIdentity" className="add-file-btn">
              <span className="download-icon">↓</span> Add file
            </label>
            {files.frontIdentity && <span className="file-name">{files.frontIdentity.name}</span>}
          </div>
        </div>

        <div className="file-upload-group">
          <label>Back of identity image</label>
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="backIdentity"
              accept=".pdf,image/*"
              onChange={(e) => handleFileChange(e, "backIdentity")}
              style={{ display: "none" }}
            />
            <label htmlFor="backIdentity" className="add-file-btn">
              <span className="download-icon">↓</span> Add file
            </label>
            {files.backIdentity && <span className="file-name">{files.backIdentity.name}</span>}
          </div>
        </div>

        <div className="file-upload-group">
          <label>Business license</label>
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="businessLicense"
              accept=".pdf,image/*"
              onChange={(e) => handleFileChange(e, "businessLicense")}
              style={{ display: "none" }}
            />
            <label htmlFor="businessLicense" className="add-file-btn">
              <span className="download-icon">↓</span> Add file
            </label>
            {files.businessLicense && <span className="file-name">{files.businessLicense.name}</span>}
          </div>
        </div>

        <div className="file-upload-group">
          <label>Portrait picture</label>
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="portrait"
              accept=".pdf,image/*"
              onChange={(e) => handleFileChange(e, "portrait")}
              style={{ display: "none" }}
            />
            <label htmlFor="portrait" className="add-file-btn">
              <span className="download-icon">↓</span> Add file
            </label>
            {files.portrait && <span className="file-name">{files.portrait.name}</span>}
          </div>
        </div>

        <div className="file-upload-group">
          <label>Store policy</label>
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="storePolicy"
              accept=".pdf,image/*"
              onChange={(e) => handleFileChange(e, "storePolicy")}
              style={{ display: "none" }}
            />
            <label htmlFor="storePolicy" className="add-file-btn">
              <span className="download-icon">↓</span> Add file
            </label>
            {files.storePolicy && <span className="file-name">{files.storePolicy.name}</span>}
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Submit
        </button>
      </form>
    </div>
  )
}
