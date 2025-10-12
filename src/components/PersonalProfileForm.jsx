"use client"

import { useState } from "react"
import "./PersonalProfileForm.css"

export default function PersonalProfileForm() {
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    email: "",
    gender: "male",
    birthday: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
  }

  return (
    <div className="profile-form-container">
      <h2 className="form-title">Personal profile</h2>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-field">
          <label htmlFor="fullname" className="form-label">
            Fullname*
          </label>
          <input
            id="fullname"
            type="text"
       
            value={formData.fullname}
            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor="phone" className="form-label">
            Phone number*
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor="email" className="form-label">
            Email*
          </label>
          <input
            id="email"
            type="email"
            placeholder="abc@gmail.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Gender*</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === "male"}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              />
              <span>Male</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === "female"}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              />
              <span>Female</span>
            </label>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="birthday" className="form-label">
            Birthday*
          </label>
          <input
            id="birthday"
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-submit">
          <button type="submit" className="submit-button">
            Save Change
          </button>
        </div>
      </form>
    </div>
  )
}
