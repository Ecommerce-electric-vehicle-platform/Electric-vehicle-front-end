"use client"

import { useState } from "react"
import "./ChangePassword.css"

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords do not match!")
      return
    }

    // Validate new password is different from current
    if (formData.currentPassword === formData.newPassword) {
      alert("New password must be different from current password!")
      return
    }

    console.log("Password change submitted:", {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    })

    // Reset form after successful submission
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })

    alert("Password changed successfully!")
  }

  return (
    <div className="change-password">
      <h2 className="change-password-title">Change password</h2>

      <form onSubmit={handleSubmit} className="change-password-form">
        <div className="form-group">
          <label htmlFor="currentPassword">Current password*</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Current password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New password*</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="New password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Re-enter new password*</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter new password"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Save Change
        </button>
      </form>
    </div>
  )
}
