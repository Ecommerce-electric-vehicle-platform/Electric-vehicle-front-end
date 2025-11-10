import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ServicePackageGuard } from "../../../components/ServicePackageGuard/ServicePackageGuard";
import sellerApi from "../../../api/sellerApi";
import { normalizeProduct } from "../../../api/productApi";
import "./EditPost.css";

export default function EditPost() {
  const navigate = useNavigate();
  const { postId } = useParams();

  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newPictures, setNewPictures] = useState([]); // Ảnh mới được chọn
  const [existingImages, setExistingImages] = useState([]); // Ảnh cũ từ backend
  const [errors, setErrors] = useState({});

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
    conditionLevel: "",
    description: "",
    locationTrading: "",
    categoryId: "",
  });

  // Load dữ liệu bài đăng
  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        // Sử dụng sellerApi.getPostById thay vì fetchPostProductById (vì API GET by ID bị lỗi 500)
        const post = await sellerApi.getPostById(postId);
        console.log("[EditPost] Loaded post data (raw):", post);
        
        // Lấy categoryId từ raw data (có thể có trong post data)
        // Backend có thể trả về categoryId hoặc categoryName
        const categoryId = post?.categoryId || post?.category_id || post?.category?.categoryId || "";
        console.log("[EditPost] CategoryId from raw data:", categoryId, "CategoryName:", post?.categoryName || post?.category);
        
        // Normalize post data để đảm bảo format đúng
        const product = normalizeProduct(post);
        if (!product) {
          throw new Error("Không thể xử lý dữ liệu bài đăng");
        }
        console.log("[EditPost] Normalized product data:", product);

        setFormData({
          title: product.title || "",
          brand: product.brand || "",
          model: product.model || "",
          manufacturerYear: product.manufactureYear || new Date().getFullYear(),
          usedDuration: product.usedDuration || "",
          color: product.color || "",
          price: product.price || "",
          length: product.length || "",
          width: product.width || "",
          height: product.height || "",
          weight: product.weight || "",
          conditionLevel: product.conditionLevel || "Good",
          description: product.description || "",
          locationTrading: product.locationTrading || "",
          // Ưu tiên lấy từ raw data, nếu không có thì dùng từ normalized product
          categoryId: categoryId || product.categoryId || product.category || "",
        });

        // Lấy images từ product (đã được normalize)
        const existingImages = product.images?.map((img) => {
          // img có thể là string (URL) hoặc object với imgUrl
          return typeof img === 'string' ? img : (img?.imgUrl || img);
        }) || [];
        setExistingImages(existingImages);
      } catch (err) {
        console.error("Lỗi tải bài đăng:", err);
        alert("Không thể tải dữ liệu bài đăng này: " + (err?.message || "Lỗi không xác định"));
        navigate("/seller/manage-posts");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // 📝 Cập nhật giá trị input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // 🖼️ Thêm ảnh mới
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingImages.length + newPictures.length > 10) {
      alert("Tối đa 10 ảnh!");
      return;
    }
    setNewPictures((prev) => [...prev, ...files]);
  };

  // Xóa ảnh cũ
  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Xóa ảnh mới
  const removeNewImage = (index) => {
    setNewPictures((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate form
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🚀 Gửi dữ liệu lên BE (update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      // Chuẩn bị FormData cho API update (multipart/form-data)
      const formDataToSend = new FormData();
      
      // Append các field text
      formDataToSend.append("title", formData.title);
      formDataToSend.append("brand", formData.brand);
      formDataToSend.append("model", formData.model);
      formDataToSend.append("manufactureYear", parseInt(formData.manufacturerYear));
      formDataToSend.append("usedDuration", formData.usedDuration || "");
      formDataToSend.append("conditionLevel", formData.conditionLevel || "Good");
      formDataToSend.append("price", parseFloat(formData.price));
      if (formData.length) formDataToSend.append("length", formData.length);
      if (formData.width) formDataToSend.append("width", formData.width);
      if (formData.height) formDataToSend.append("height", formData.height);
      if (formData.weight) formDataToSend.append("weight", formData.weight);
      if (formData.color) formDataToSend.append("color", formData.color);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("locationTrading", formData.locationTrading);
      formDataToSend.append("categoryId", formData.categoryId);
      
      // Append ảnh vào FormData
      // Backend @RequestPart("pictures") yêu cầu BẮT BUỘC phải có ít nhất 1 file
      // Strategy:
      // 1. Nếu có ảnh mới: gửi ảnh mới (backend sẽ thay thế toàn bộ)
      // 2. Nếu không có ảnh mới nhưng có ảnh cũ: download ảnh cũ và gửi lại
      // 3. Nếu không có ảnh nào: báo lỗi
      
      if (newPictures.length > 0) {
        // Có ảnh mới: chỉ gửi ảnh mới
        console.log(`[EditPost] Sending ${newPictures.length} new pictures`);
        newPictures.forEach((file) => {
          if (file instanceof File) {
            formDataToSend.append("pictures", file);
          }
        });
      } else if (existingImages.length > 0) {
        // Không có ảnh mới: download ảnh cũ và convert sang File
        console.log(`[EditPost] No new pictures, attempting to download ${existingImages.length} existing images`);
        
        try {
          // Download ảnh cũ từ URLs và convert sang File objects
          // Lưu ý: Có thể gặp CORS issue nếu ảnh từ domain khác
          const downloadPromises = existingImages.map(async (url, index) => {
            try {
              console.log(`[EditPost] Downloading image ${index + 1}/${existingImages.length}: ${url}`);
              
              // Thử fetch với mode 'no-cors' nếu gặp CORS issue
              let response;
              try {
                response = await fetch(url, { mode: 'cors' });
              } catch (corsError) {
                console.warn(`[EditPost] CORS error for ${url}, trying no-cors mode:`, corsError);
                // Nếu CORS fail, thử proxy qua backend hoặc yêu cầu user thêm ảnh mới
                throw new Error(`Không thể tải ảnh từ ${url} (CORS error). Vui lòng thêm ảnh mới hoặc liên hệ admin.`);
              }
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              const blob = await response.blob();
              if (!blob || blob.size === 0) {
                throw new Error("Empty blob received");
              }
              
              const fileName = `existing-image-${index + 1}.${blob.type.split('/')[1] || 'jpg'}`;
              const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
              console.log(`[EditPost] Successfully downloaded image ${index + 1}: ${fileName} (${blob.size} bytes)`);
              return file;
            } catch (error) {
              console.error(`[EditPost] Failed to download image ${index + 1} from ${url}:`, error);
              return { error: error.message, url, index };
            }
          });
          
          const results = await Promise.all(downloadPromises);
          
          // Filter out failed downloads
          const validFiles = results.filter(result => result instanceof File);
          const failedDownloads = results.filter(result => result && result.error);
          
          if (validFiles.length === 0) {
            // Tất cả đều fail
            const errorDetails = failedDownloads.map(f => `- Ảnh ${f.index + 1}: ${f.error}`).join('\n');
            console.error("[EditPost] All image downloads failed:", errorDetails);
            alert(
              "Không thể tải ảnh cũ từ server.\n\n" +
              "Nguyên nhân có thể:\n" +
              "- Lỗi kết nối mạng\n" +
              "- Ảnh đã bị xóa hoặc không tồn tại\n" +
              "- Lỗi CORS (Cross-Origin Resource Sharing)\n\n" +
              "Giải pháp: Vui lòng thêm ít nhất 1 ảnh mới để cập nhật bài đăng."
            );
            setLoading(false);
            return;
          }
          
          // Append ảnh đã download thành công vào FormData
          validFiles.forEach((file) => {
            formDataToSend.append("pictures", file);
          });
          
          console.log(`[EditPost] Successfully loaded ${validFiles.length}/${existingImages.length} existing images`);
          
          if (failedDownloads.length > 0) {
            console.warn(`[EditPost] ${failedDownloads.length} images failed to download, but continuing with ${validFiles.length} images`);
          }
        } catch (error) {
          console.error("[EditPost] Unexpected error loading existing images:", error);
          alert(
            "Lỗi khi tải ảnh cũ: " + error.message + "\n\n" +
            "Vui lòng thêm ít nhất 1 ảnh mới để tiếp tục cập nhật bài đăng."
          );
          setLoading(false);
          return;
        }
      } else {
        // Không có ảnh nào: báo lỗi
        alert("Vui lòng thêm ít nhất 1 ảnh!");
        setLoading(false);
        return;
      }

      // Gọi API update với FormData (multipart/form-data)
      const response = await sellerApi.updatePostById(postId, formDataToSend);
      if (response?.data?.success) {
        alert("Cập nhật bài đăng thành công!");
        navigate("/seller/manage-posts");
      } else {
        throw new Error(response?.data?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật bài đăng:", error);
      console.error("Error details:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        url: error?.config?.url
      });
      
      // Xử lý lỗi cụ thể
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
      } else if (error?.response?.status === 404) {
        alert("Không tìm thấy bài đăng này!");
      } else if (error?.response?.status === 500) {
        const errorMsg = error?.response?.data?.message || error?.message || "Lỗi server. Vui lòng thử lại sau!";
        alert("Lỗi server: " + errorMsg);
      } else {
        const errorMsg = error?.response?.data?.message || error?.message || "Vui lòng thử lại!";
        alert("Lỗi khi cập nhật bài đăng: " + errorMsg);
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <ServicePackageGuard viewOnly={true}>
        <div className="edit-post-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu bài đăng...</p>
          </div>
        </div>
      </ServicePackageGuard>
    );
  }

  return (
    <ServicePackageGuard viewOnly={true}>
      <div className="edit-post-page">
        <div className="edit-post-container">
          <div className="page-header">
            <h1>Chỉnh Sửa Tin Đăng</h1>
            <p>Cập nhật thông tin bài đăng của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="edit-post-form">
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
                  />
                </div>

                <div className="form-group">
                  <label>Thời gian sử dụng *</label>
                  <input
                    type="text"
                    name="usedDuration"
                    value={formData.usedDuration}
                    onChange={handleChange}
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

                <div className="form-group">
                  <label>Màu sắc</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="VD: Đen, Trắng, Đỏ..."
                  />
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div className="form-section">
              <h2>Mô tả chi tiết</h2>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="8"
                className={`description-textarea ${
                  errors.description ? "error" : ""
                }`}
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
              />
              {errors.locationTrading && (
                <span className="error-msg">{errors.locationTrading}</span>
              )}
            </div>

            {/* Ảnh */}
            <div className="form-section">
              <h2>Hình ảnh sản phẩm</h2>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              
              {/* Hiển thị ảnh cũ */}
              {existingImages.length > 0 && (
                <div className="existing-images-section">
                  <h3>Ảnh hiện tại:</h3>
                  <div className="image-preview-grid">
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="image-preview-item">
                        <img src={url} alt={`existing-${index}`} />
                        <button type="button" onClick={() => removeExistingImage(index)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Hiển thị ảnh mới */}
              {newPictures.length > 0 && (
                <div className="new-images-section">
                  <h3>Ảnh mới thêm:</h3>
                  <div className="image-preview-grid">
                    {newPictures.map((file, index) => {
                      const preview = URL.createObjectURL(file);
                      return (
                        <div key={`new-${index}`} className="image-preview-item">
                          <img src={preview} alt={`new-${index}`} />
                          <button type="button" onClick={() => removeNewImage(index)}>
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {loading && (
              <div className="upload-progress">
                <p>Đang lưu thay đổi... {uploadProgress}%</p>
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
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ServicePackageGuard>
  );
}
