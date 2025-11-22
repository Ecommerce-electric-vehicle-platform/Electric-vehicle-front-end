import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ServicePackageGuard } from "../../../components/ServicePackageGuard/ServicePackageGuard";
import sellerApi from "../../../api/sellerApi";
import "./CreatePost.css";

export default function CreatePost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sellerId, setSellerId] = useState("");
  const [pictures, setPictures] = useState([]);
  const [pictureUrls, setPictureUrls] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    model: "",
    manufacturerYear: new Date().getFullYear(), // hiển thị cho người dùng
    usedDuration: "",
    price: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    conditionLevel: "",
    description: "",
    locationTrading: "",
    categoryId: "",
  });

  // Lấy sellerId từ localStorage (buyerId chính là sellerId)
  useEffect(() => {
    // Trong hệ thống này, mỗi seller đều nâng cấp từ buyer
    // Nên buyerId chính là sellerId
    console.log("🔍 [CreatePost] Checking localStorage...");
    console.log("🔍 All localStorage:", { ...localStorage });
    
    const buyerId = localStorage.getItem("buyerId");
    console.log("🔍 buyerId from localStorage:", buyerId, typeof buyerId);
    
    if (buyerId) {
      const sellerIdValue = parseInt(buyerId); // Convert to number
      console.log("✅ [CreatePost] Using buyerId as sellerId:", sellerIdValue);
      setSellerId(sellerIdValue);
    } else {
      console.error("❌ [CreatePost] No buyerId found in localStorage!");
      console.error("❌ Available keys:", Object.keys(localStorage));
      alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + pictures.length > 10) {
      alert("Tối đa 10 ảnh!");
      return;
    }
    const previews = files.map((file) => URL.createObjectURL(file));
    setPictures((prev) => [...prev, ...files]);
    setPictureUrls((prev) => [...prev, ...previews]);
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
    if (!formData.categoryId) newErrors.categoryId = "Vui lòng chọn danh mục";
    if (pictures.length === 0)
      newErrors.pictures = "Vui lòng thêm ít nhất 1 ảnh";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate các field bắt buộc cho AI (không bao gồm description)
  const validateForAI = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Tiêu đề là bắt buộc";
    if (!formData.brand.trim()) newErrors.brand = "Thương hiệu là bắt buộc";
    if (!formData.model.trim()) newErrors.model = "Model là bắt buộc";
    if (!formData.price || formData.price <= 0)
      newErrors.price = "Giá phải lớn hơn 0";
    if (!formData.locationTrading.trim())
      newErrors.locationTrading = "Địa điểm giao dịch là bắt buộc";
    if (!formData.categoryId) newErrors.categoryId = "Vui lòng chọn danh mục (BẮT BUỘC cho AI)";
    if (pictures.length === 0)
      newErrors.pictures = "Vui lòng thêm ít nhất 1 ảnh";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gọi AI để tạo mô tả tự động
  const handleGenerateAIDescription = async () => {
    console.log("[AI] Starting AI description generation...");
    console.log("[AI] Current categoryId:", formData.categoryId, typeof formData.categoryId);
    
    // Kiểm tra categoryId có tồn tại không (BẮT BUỘC theo BE)
    if (!formData.categoryId) {
      console.error("[AI] categoryId is missing!");
      alert("Vui lòng chọn danh mục trước khi sử dụng AI!");
      return;
    }

    // Validate các field bắt buộc trước khi gọi AI
    if (!validateForAI()) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc trước khi sử dụng AI!");
      return;
    }

    // Kiểm tra lại có ảnh hay không
    if (!pictures || pictures.length === 0) {
      alert("Vui lòng thêm ít nhất 1 ảnh trước khi sử dụng AI!");
      return;
    }

    try {
      setAiLoading(true);
      
      // Không cần truyền sellerId, chỉ cần categoryId
      const dataToSend = { ...formData };
      
      console.log("[AI] Data to send:", {
        categoryId: dataToSend.categoryId,
        categoryIdType: typeof dataToSend.categoryId,
        dataToSend: dataToSend,
        imageFile: pictures[0]?.name,
        imageFileSize: pictures[0]?.size,
        imageFileType: pictures[0]?.type
      });
      
      // Gọi API AI với thông tin sản phẩm và ảnh đầu tiên
      const response = await sellerApi.generateAIDescription(
        dataToSend, // Thêm sellerId vào data
        pictures[0] // Gửi ảnh đầu tiên
      );

      console.log("AI Response:", response);

      if (response?.data?.success) {
        // Lấy description từ response.data.data (là string trực tiếp)
        const aiDescription = response?.data?.data || "";
        
        if (aiDescription) {
          // \n trong string sẽ tự động hiển thị như xuống dòng trong textarea
          // Không cần xử lý gì thêm, textarea tự động nhận diện \n
          setFormData((prev) => ({ ...prev, description: aiDescription }));
          
          // Xóa lỗi của description nếu có
          if (errors.description) {
            setErrors((prev) => ({ ...prev, description: "" }));
          }
          
          console.log("[AI] Description received and filled!");
          alert("AI đã tạo mô tả thành công!");
        } else {
          throw new Error("AI không trả về mô tả");
        }
      } else {
        throw new Error(response?.data?.message || "AI tạo mô tả thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi gọi AI:", error);
      console.error("Error response:", error?.response);
      
      let errorMsg = " Không thể tạo mô tả bằng AI.\n";
      
      // Phân tích lỗi cụ thể
      if (error?.response?.status === 500) {
        errorMsg += "Lỗi từ server (500). Có thể do:\n" +
                   "- AI service (Gemini) chưa được cấu hình\n" +
                   "- Backend chưa xử lý đúng request\n" +
                   "- File ảnh không đúng định dạng";
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMsg += "Lỗi xác thực. Vui lòng đăng nhập lại!";
      } else if (error?.response?.status === 400) {
        errorMsg += "Dữ liệu không hợp lệ: " + (error?.response?.data?.message || "");
      } else if (error?.message?.includes("timeout")) {
        errorMsg += "Request timeout. AI đang xử lý quá lâu.";
      } else {
        errorMsg += error?.response?.data?.message || error?.message || "Vui lòng thử lại!";
      }
      
      alert(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  // Gửi dữ liệu multipart/form-data lên BE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      const formDataToSend = new FormData();
      formDataToSend.append("sellerId", sellerId);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("brand", formData.brand);
      formDataToSend.append("model", formData.model);
      formDataToSend.append(
        "manufactureYear",
        parseInt(formData.manufacturerYear)
      );
      formDataToSend.append("usedDuration", formData.usedDuration);
      formDataToSend.append(
        "conditionLevel",
        formData.conditionLevel || "Good"
      );
      formDataToSend.append("price", parseFloat(formData.price));
      formDataToSend.append("length", formData.length);
      formDataToSend.append("width", formData.width);
      formDataToSend.append("height", formData.height);
      formDataToSend.append("weight", formData.weight);
      // Đã xóa field color - không gửi lên backend
      formDataToSend.append("description", formData.description);
      formDataToSend.append("locationTrading", formData.locationTrading);
      formDataToSend.append("categoryId", formData.categoryId);

      pictures.forEach((file) => formDataToSend.append("pictures", file));

      const response = await sellerApi.createPostProduct(
        formDataToSend,
        setUploadProgress
      );

      if (response?.data?.success) {
        alert("Đăng tin thành công!");
        navigate("/seller/manage-posts");
      } else {
        throw new Error(response?.data?.message || "Tạo bài thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi tạo bài đăng:", error);
      const errorMsg =
        error?.response?.data?.message ||
        "Đăng tin thất bại. Vui lòng thử lại!";
      alert(errorMsg);
    } finally {
      setLoading(false);
      setUploadProgress(0);
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
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={errors.title ? "error" : ""}
                  placeholder="VD: Xe máy điện VinFast Klara S 2024"
                />
                {errors.title && (
                  <span className="error-msg">{errors.title}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thương hiệu *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className={errors.brand ? "error" : ""}
                    placeholder="VD: VinFast, Honda, Yamaha..."
                  />
                  {errors.brand && (
                    <span className="error-msg">{errors.brand}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className={errors.model ? "error" : ""}
                    placeholder="VD: Klara S, Vision, SH Mode..."
                  />
                  {errors.model && (
                    <span className="error-msg">{errors.model}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Năm sản xuất *</label>
                  <input
                    type="number"
                    name="manufacturerYear"
                    value={formData.manufacturerYear}
                    onChange={handleChange}
                    min="1900"
                    max="2100"
                    placeholder="VD: 2024"
                  />
                </div>

                <div className="form-group">
                  <label>Thời gian sử dụng *</label>
                  <input
                    type="text"
                    name="usedDuration"
                    value={formData.usedDuration}
                    onChange={handleChange}
                    placeholder="VD: Mới 100%, 6 tháng, 1 năm..."
                  />
                </div>

                <div className="form-group">
                  <label>Danh mục *</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className={errors.categoryId ? "error" : ""}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    <option value="1">Xe điện</option>
                    <option value="2">Pin điện</option>
                  </select>
                  {errors.categoryId && (
                    <span className="error-msg">{errors.categoryId}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={errors.price ? "error" : ""}
                  placeholder="VD: 50000000"
                />
                {errors.price && (
                  <span className="error-msg">{errors.price}</span>
                )}
              </div>
            </div>

            {/* Thông số kỹ thuật */}
            <div className="form-section">
              <h2>Thông số kỹ thuật</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Chiều dài (cm)</label>
                  <input
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleChange}
                    placeholder="VD: 180"
                  />
                </div>

                <div className="form-group">
                  <label>Chiều rộng (cm)</label>
                  <input
                    type="number"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    placeholder="VD: 70"
                  />
                </div>

                <div className="form-group">
                  <label>Chiều cao (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="VD: 110"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Trọng lượng (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="VD: 95"
                  />
                </div>

                <div className="form-group">
                  <label>Tình trạng</label>
                  <select
                    name="conditionLevel"
                    value={formData.conditionLevel || ""}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn tình trạng --</option>
                    <option value="New">Mới 100%</option>
                    <option value="Like New">Như mới</option>
                    <option value="Good">Tốt</option>
                    <option value="Fair">Khá</option>
                    <option value="Poor">Cần sửa chữa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div className="form-section">
              <div className="description-header">
                <h2>Mô tả chi tiết</h2>
                <button
                  type="button"
                  className="btn-ai-generate"
                  onClick={handleGenerateAIDescription}
                  disabled={aiLoading || loading}
                >
                  {aiLoading ? "🤖 Đang tạo..." : "✨ AI viết giúp"}
                </button>
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="8"
                className={`description-textarea ${
                  errors.description ? "error" : ""
                }`}
                placeholder="Nhập mô tả chi tiết về sản phẩm của bạn (tình trạng, màu sắc, lý do bán, v.v.)..."
              />
              {errors.description && (
                <span className="error-msg">{errors.description}</span>
              )}
            </div>

            {/* Địa điểm */}
            <div className="form-section">
              <h2>Địa điểm giao dịch *</h2>
              <input
                type="text"
                name="locationTrading"
                value={formData.locationTrading}
                onChange={handleChange}
                className={`location-input ${
                  errors.locationTrading ? "error" : ""
                }`}
                placeholder="VD: Hà Nội, Quận Hoàn Kiếm, Phố Tràng Tiền..."
              />
              {errors.locationTrading && (
                <span className="error-msg">{errors.locationTrading}</span>
              )}
            </div>

            {/* Hình ảnh */}
            <div className="form-section">
              <h2>Hình ảnh sản phẩm *</h2>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              {errors.pictures && (
                <span className="error-msg">{errors.pictures}</span>
              )}

              {pictureUrls.length > 0 && (
                <div className="image-preview-grid">
                  {pictureUrls.map((url, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={url} alt={`preview-${index}`} />
                      <button type="button" onClick={() => removeImage(index)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loading && (
              <div className="upload-progress">
                <p>Đang tải ảnh... {uploadProgress}%</p>
                <progress value={uploadProgress} max="100"></progress>
              </div>
            )}

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
