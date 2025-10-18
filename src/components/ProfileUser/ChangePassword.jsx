

import { useState } from "react"
import profileApi from "../../api/profileApi"
import "./ChangePassword.css"

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  //  Regex pattern giống backend
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\\s]{8,}$/

  const validateField = (name, value) => {
    let error = ""

    // Không kiểm tra required ở đây (để làm khi submit)
    if (value && !passwordRegex.test(value)) {
      error =
        "Password must be at least 8 characters, include letters, numbers, and special characters, and contain no spaces."
    }

    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check required (NotBlank)
    const newErrors = {}
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) newErrors[key] = "This field is required."
    })

    // Kiểm tra khớp password
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "New passwords do not match."
    }

    // Kiểm tra password giống cũ
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "New password must be different from current password."
    }

    // Nếu còn lỗi thì dừng
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }))
      return
    }

    setLoading(true)
    try {
      const username = localStorage.getItem("username")
      const payload = {
        username,
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      }

      const res = await profileApi.changePassword(payload)
      console.log(" Password changed:", res.data)

      alert("Password changed successfully!")

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setErrors({})
    } catch (err) {
      console.error(" Error changing password:", err)
      alert(err.response?.data?.message || "Failed to change password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="change-password">
      <h2 className="change-password-title">Change password</h2>

      <form onSubmit={handleSubmit} className="change-password-form">
        {/* CURRENT PASSWORD */}
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
            className={errors.currentPassword ? "error-input" : ""}
          />
          {errors.currentPassword && (
            <p className="error-message">{errors.currentPassword}</p>
          )}
        </div>

        {/* NEW PASSWORD */}
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
            className={errors.newPassword ? "error-input" : ""}
          />
          {errors.newPassword && (
            <p className="error-message">{errors.newPassword}</p>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
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
            className={errors.confirmPassword ? "error-input" : ""}
          />
          {errors.confirmPassword && (
            <p className="error-message">{errors.confirmPassword}</p>
          )}
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Saving..." : "Save Change"}
        </button>
      </form>
    </div>
  )
}
