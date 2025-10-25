// src/pages/Seller/CreatePost/CreatePost.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ServicePackageGuard } from "../../../components/ServicePackageGuard/ServicePackageGuard";
import sellerApi from "../../../api/sellerApi";
import "./CreatePost.css";

export default function CreatePost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sellerId, setSellerId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    model: "",
    manufacturerYear: new Date().getFullYear(),
    usedDuration: "",
    color: "",
    price: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    description: "",
    locationTrading: "",
  });
  const [pictures, setPictures] = useState([]);
  const [pictureUrls, setPictureUrls] = useState([]);
  const [errors, setErrors] = useState({});

  // Load seller profile để lấy sellerId
  useEffect(() => {
    loadSellerProfile();
  }, []);

  const loadSellerProfile = async () => {
    try {
      const response = await sellerApi.getSellerProfile();
      const profile = response?.data?.data;
      if (profile?.sellerId) {
        setSellerId(profile.sellerId);
      }
    } catch (error) {
      console.error("Error loading seller profile:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error khi user nhập
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + pictures.length > 10) {
      alert("Tối đa 10 ảnh!");
      return;
    }

    // Preview images
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPictures((prev) => [...prev, ...files]);
    setPictureUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setPictures((prev) => prev.filter((_, i) => i !== index));
    setPictureUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Tiêu đề là bắt buộc";
    if (!formData.brand.trim()) newErrors.brand = "Thương hiệu là bắt buộc";
    if (!formData.model.trim()) newErrors.model = "Model là bắt buộc";
    if (!formData.price || formData.price <= 0)
      newErrors.price = "Giá phải lớn hơn 0";
    if (!formData.description.trim())
      newErrors.description = "Mô tả là bắt buộc";
    if (!formData.locationTrading.trim())
      newErrors.locationTrading = "Địa điểm giao dịch là bắt buộc";
    if (pictures.length === 0)
      newErrors.pictures = "Vui lòng thêm ít nhất 1 ảnh";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImages = async () => {
    // TODO: Implement image upload to server
    // Giả định trả về array of URLs
    // Tạm thời return mock URLs
    const mockUrls = pictures.map(
      (_, index) => `https://example.com/images/${Date.now()}_${index}.jpg`
    );
    return mockUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    if (!sellerId) {
      alert("Không tìm thấy thông tin seller. Vui lòng thử lại!");
      return;
    }

    try {
      setLoading(true);

      // 1. Upload images
      console.log("Uploading images...");
      const uploadedUrls = await uploadImages();

      // 2. Create post
      const postData = {
        sellerId: sellerId,
        title: formData.title,
        brand: formData.brand,
        model: formData.model,
        manufacturerYear: parseInt(formData.manufacturerYear),
        usedDuration: formData.usedDuration,
        color: formData.color,
        price: parseFloat(formData.price),
        length: formData.length,
        width: formData.width,
        height: formData.height,
        weight: formData.weight,
        description: formData.description,
        locationTrading: formData.locationTrading,
        pictures: uploadedUrls,
      };

      console.log("Creating post with data:", postData);
      const response = await sellerApi.createPostProduct(postData);

      if (response?.data?.success) {
        const postId = response.data.data?.postId;

        alert("Đăng tin thành công!");

        // 3. Optionally: Request verification
        if (
          postId &&
          window.confirm("Bạn có muốn gửi yêu cầu xác minh bài đăng không?")
        ) {
          try {
            await sellerApi.requestPostVerification(postId);
            alert("Yêu cầu xác minh đã được gửi!");
          } catch (verifyError) {
            console.error("Verification request failed:", verifyError);
          }
        }

        // 4. Navigate to manage posts
        navigate("/seller/manage-posts");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      const errorMsg =
        error?.response?.data?.message ||
        "Đăng tin thất bại. Vui lòng thử lại!";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ServicePackageGuard>
      <div className="create-post-page">
        <div className="create-post-container">
          <div className="page-header">
            <h1>Đăng Tin Bán Xe</h1>
            <p>Điền đầy đủ thông tin để đăng tin bán xe của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="create-post-form">
            {/* Thông tin cơ bản */}
            <div className="form-section">
              <h2>Thông tin cơ bản</h2>

              <div className="form-group">
                <label htmlFor="title">
                  Tiêu đề <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="VD: Xe máy điện VinFast Klara S 2023"
                  className={errors.title ? "error" : ""}
                />
                {errors.title && (
                  <span className="error-msg">{errors.title}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="brand">
                    Thương hiệu <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="VD: VinFast"
                    className={errors.brand ? "error" : ""}
                  />
                  {errors.brand && (
                    <span className="error-msg">{errors.brand}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="model">
                    Model <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="VD: Klara S"
                    className={errors.model ? "error" : ""}
                  />
                  {errors.model && (
                    <span className="error-msg">{errors.model}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="manufacturerYear">Năm sản xuất</label>
                  <input
                    type="number"
                    id="manufacturerYear"
                    name="manufacturerYear"
                    value={formData.manufacturerYear}
                    onChange={handleChange}
                    min="2000"
                    max="2100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="usedDuration">Thời gian sử dụng</label>
                  <input
                    type="text"
                    id="usedDuration"
                    name="usedDuration"
                    value={formData.usedDuration}
                    onChange={handleChange}
                    placeholder="VD: 2 năm"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="color">Màu sắc</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="VD: Đỏ"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="price">
                  Giá bán (VNĐ) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="VD: 25000000"
                  min="0"
                  className={errors.price ? "error" : ""}
                />
                {errors.price && (
                  <span className="error-msg">{errors.price}</span>
                )}
              </div>
            </div>

            {/* Kích thước */}
            <div className="form-section">
              <h2>Kích thước & Trọng lượng</h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="length">Chiều dài</label>
                  <input
                    type="text"
                    id="length"
                    name="length"
                    value={formData.length}
                    onChange={handleChange}
                    placeholder="VD: 1750mm"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="width">Chiều rộng</label>
                  <input
                    type="text"
                    id="width"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    placeholder="VD: 700mm"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="height">Chiều cao</label>
                  <input
                    type="text"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="VD: 1100mm"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="weight">Trọng lượng</label>
                  <input
                    type="text"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="VD: 110kg"
                  />
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div className="form-section">
              <h2>Mô tả chi tiết</h2>

              <div className="form-group">
                <label htmlFor="description">
                  Mô tả <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Mô tả chi tiết về sản phẩm: tình trạng, tính năng, lý do bán..."
                  className={errors.description ? "error" : ""}
                />
                {errors.description && (
                  <span className="error-msg">{errors.description}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="locationTrading">
                  Địa điểm giao dịch <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="locationTrading"
                  name="locationTrading"
                  value={formData.locationTrading}
                  onChange={handleChange}
                  placeholder="VD: Quận 1, TP.HCM"
                  className={errors.locationTrading ? "error" : ""}
                />
                {errors.locationTrading && (
                  <span className="error-msg">{errors.locationTrading}</span>
                )}
              </div>
            </div>

            {/* Hình ảnh */}
            <div className="form-section">
              <h2>Hình ảnh</h2>

              <div className="form-group">
                <label>
                  Ảnh sản phẩm <span className="required">*</span> (Tối đa 10
                  ảnh)
                </label>

                <div className="image-upload-area">
                  <input
                    type="file"
                    id="pictures"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="pictures" className="upload-label">
                    <div className="upload-icon"></div>
                    <p>Click để chọn ảnh</p>
                    <span>Hoặc kéo thả ảnh vào đây</span>
                  </label>
                </div>

                {errors.pictures && (
                  <span className="error-msg">{errors.pictures}</span>
                )}

                {pictureUrls.length > 0 && (
                  <div className="image-preview-grid">
                    {pictureUrls.map((url, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={url} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/seller/manage-posts")}
                disabled={loading}
              >
                Hủy
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Đang đăng tin..." : "Đăng tin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ServicePackageGuard>
  );
}
