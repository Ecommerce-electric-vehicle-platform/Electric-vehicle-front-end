import { useState, useEffect } from "react"
import profileApi from "../../api/profileApi"
import "./PersonalProfileForm.css"

export default function PersonalProfileForm() {
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    email: "",
    gender: "male",
    birthday: "",
    province: "",
    district: "",
    commune: "",
    address: "",
  })

  const [avatarFile, setAvatarFile] = useState(null)
  const [userId, setUserId] = useState(null)

  //  Lấy email & userId từ localStorage khi load trang
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    const storedUserId = localStorage.getItem("buyerId");

    setFormData((prev) => ({
      ...prev,
      email: storedEmail || "",
    }));

    if (storedUserId) setUserId(storedUserId);
  }, []);


  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  //  Gửi dữ liệu profile lên backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return alert("User ID not found");
    if (!avatarFile) return alert("Please select an avatar"); // bắt buộc

    try {
      const fullAddress = `${formData.address}, ${formData.commune}, ${formData.district}, ${formData.province}`;
      const formBody = new FormData();
      formBody.append("fullName", formData.fullname);
      formBody.append("phoneNumber", formData.phone);
      formBody.append("defaultShippingAddress", fullAddress);
      formBody.append("gender", formData.gender.toUpperCase());
      formBody.append("dob", formData.birthday);
      formBody.append("avatar_url", avatarFile); //  gửi avatar

      const response = await profileApi.uploadProfile(userId, formBody);
      alert("Profile saved successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save profile");
    }
  };



  return (
    <div className="profile-form-container">
      <h2 className="form-title">Personal profile</h2>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-field">
          <label htmlFor="fullname" className="form-label">Fullname*</label>
          <input
            id="fullname"
            type="text"
            value={formData.fullname}
            onChange={(e) =>
              setFormData({ ...formData, fullname: e.target.value })
            }
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor="phone" className="form-label">Phone number*</label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor="email" className="form-label">Email*</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
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
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
              />
              <span>Male</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === "female"}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
              />
              <span>Female</span>
            </label>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="birthday" className="form-label">Birthday*</label>
          <input
            id="birthday"
            type="date"
            value={formData.birthday}
            onChange={(e) =>
              setFormData({ ...formData, birthday: e.target.value })
            }
            className="form-input"
          />
        </div>


        <div className="form-field">
          <label htmlFor="province" className="form-label">Province/City*</label>
          <input
            id="province"
            type="text"
            placeholder="e.g. Ho Chi Minh City"
            value={formData.province}
            onChange={(e) =>
              setFormData({ ...formData, province: e.target.value })
            }
            className="form-input"
          />
        </div>


        <div className="form-field">
          <label htmlFor="district" className="form-label">District*</label>
          <input
            id="district"
            type="text"
            placeholder="e.g. District 1"
            value={formData.district}
            onChange={(e) =>
              setFormData({ ...formData, district: e.target.value })
            }
            className="form-input"
          />
        </div>


        <div className="form-field">
          <label htmlFor="commune" className="form-label">Commune/Ward*</label>
          <input
            id="commune"
            type="text"
            placeholder="e.g. Ward 5"
            value={formData.commune}
            onChange={(e) =>
              setFormData({ ...formData, commune: e.target.value })
            }
            className="form-input"
          />
        </div>


        <div className="form-field">
          <label htmlFor="address" className="form-label">Address*</label>
          <input
            id="address"
            type="text"
            placeholder="123/123 Nguyen Trai"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor="avatar" className="form-label">Avatar*</label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files[0])}
            className="form-input"
          />
        </div>

        <div className="form-submit">
          <button type="submit" className="submit-button">Save Change</button>
        </div>
      </form>
    </div>
  )
}
