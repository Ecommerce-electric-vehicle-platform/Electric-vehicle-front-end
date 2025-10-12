"use client"

import { useState } from "react"
import "./AddressBook.css"

export default function AddressBook() {
  const [addresses, setAddresses] = useState([])
  const [formData, setFormData] = useState({
    fullname: "",
    phoneNumber: "",
    province: "",
    district: "",
    commune: "",
    address: "",
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

    // Add new address to the list
    const newAddress = {
      id: Date.now(),
      ...formData,
    }

    setAddresses((prev) => [...prev, newAddress])

    // Reset form
    setFormData({
      fullname: "",
      phoneNumber: "",
      province: "",
      district: "",
      commune: "",
      address: "",
    })
  }

  return (
    <div className="address-book-container">
      {/* Display saved addresses */}
      <div className="address-book-section">
        <h2 className="section-title">Address book</h2>
        <div className="saved-addresses">
          {addresses.length === 0 ? (
            <div className="empty-address">No saved addresses yet</div>
          ) : (
            addresses.map((addr) => (
              <div key={addr.id} className="address-card">
                <div className="address-header">
                  {addr.fullname} | {addr.phoneNumber}
                </div>
                <div className="address-details">
                  {addr.address}, {addr.commune}, {addr.district}, {addr.province}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit address form */}
      <div className="edit-address-section">
        <h2 className="section-title">Edit address</h2>
        <form onSubmit={handleSubmit} className="address-form">
          <div className="form-group">
            <label htmlFor="fullname">Fullname*</label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone number*</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="province">Province/City*</label>
            <select id="province" name="province" value={formData.province} onChange={handleChange} required>
              <option value="">Select province/city</option>
              <option value="Hanoi">Hanoi</option>
              <option value="Ho Chi Minh">Ho Chi Minh</option>
              <option value="Da Nang">Da Nang</option>
              <option value="Hai Phong">Hai Phong</option>
              <option value="Can Tho">Can Tho</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="district">District*</label>
            <select id="district" name="district" value={formData.district} onChange={handleChange} required>
              <option value="">Select district</option>
              <option value="District 1">District 1</option>
              <option value="District 2">District 2</option>
              <option value="District 3">District 3</option>
              <option value="District 4">District 4</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="commune">Commune/Ward*</label>
            <select id="commune" name="commune" value={formData.commune} onChange={handleChange} required>
              <option value="">Select commune/ward</option>
              <option value="Ward 1">Ward 1</option>
              <option value="Ward 2">Ward 2</option>
              <option value="Ward 3">Ward 3</option>
              <option value="Ward 4">Ward 4</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address*</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123/123"
              required
            />
          </div>

          <button type="submit" className="save-button">
            Save change
          </button>
        </form>
      </div>
    </div>
  )
}
