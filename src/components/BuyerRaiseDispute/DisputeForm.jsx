import { useState, useEffect } from "react"
import profileApi from "../../api/profileApi"
import "./DisputeForm.css"


// thật ra là không giới hạn
const MAX_PICTURES = 5


// SỬA: Chấp nhận orderId thông qua props. Nếu không có, sẽ dùng giá trị mặc định là 1.
export default function DisputeForm({ initialOrderId }) {
  // === State Dữ liệu Form ===
  const [formData, setFormData] = useState({
    // THÊM: Sử dụng initialOrderId từ props, nếu không có thì mặc định là 1 (số)
    orderId: initialOrderId || 1,
    description: "", // Dùng description cho nội dung khiếu nại
    disputeCategoryId: "",
    pictures: [], // Lưu File objects
  })


  // === State Logic UI ===
  const [disputeCategories, setDisputeCategories] = useState([]) // Danh sách category từ API
  // SỬA: LUÔN MỞ CATEGORY
  //const [expandedCategory, setExpandedCategory] = useState(true)
  const [previewUrls, setPreviewUrls] = useState([]) // Lưu Data URLs cho preview
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" }) // {type: 'success' | 'error', message: '...'}




  // === useEffect: Load Dispute Categories ===
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await profileApi.getDisputeCategories()
        if (response.data?.success && Array.isArray(response.data.data)) {
          setDisputeCategories(response.data.data)
        } else {
          setStatusMessage({ type: "error", message: "Không thể tải danh mục khiếu nại." })
        }
      } catch (err) {
        console.error("Error loading dispute categories:", err)
        setStatusMessage({ type: "error", message: "Lỗi kết nối khi tải danh mục." })
      }
    }
    loadCategories()
  }, [])


  // === Handlers chung ===
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setStatusMessage({ type: "", message: "" })
  }


  // === Xử lý Upload ảnh ===
  const handleImageUpload = (e, index) => {
    const file = e.target.files[0]
    if (!file) return


    setStatusMessage({ type: "", message: "" })


    const reader = new FileReader()
    reader.onloadend = () => {
      const newPictures = [...formData.pictures]
      // Đảm bảo rằng files được chèn đúng vị trí để FormData gửi đúng
      newPictures[index] = file
      setFormData({ ...formData, pictures: newPictures })


      const newPreviewUrls = [...previewUrls]
      newPreviewUrls[index] = reader.result
      setPreviewUrls(newPreviewUrls)
    }
    reader.readAsDataURL(file)
  }


  const handleRemoveImage = (index) => {
    // Để giữ vị trí (slot) ảnh, ta set null vào vị trí đó (thay vì filter)
    const newPictures = [...formData.pictures]
    newPictures[index] = null
    const newPreviewUrls = [...previewUrls]
    newPreviewUrls[index] = null


    // Sau đó loại bỏ các giá trị null khỏi mảng pictures
    const cleanPictures = newPictures.filter(Boolean);
    const cleanPreviews = newPreviewUrls.filter(Boolean);


    setFormData({ ...formData, pictures: cleanPictures })
    setPreviewUrls(cleanPreviews)
  }


  // === Xử lý Submit Form (Gửi FormData) ===
  const handleSubmit = async (e) => {
    e.preventDefault()


    // Validation cơ bản
    if (!formData.disputeCategoryId || !formData.description) {
      setStatusMessage({ type: "error", message: "Vui lòng chọn loại và điền nội dung khiếu nại." })
      return
    }


    setIsLoading(true)
    setStatusMessage({ type: "", message: "" })


    try {
      const formBody = new FormData()


      // 1. Dữ liệu form
      formBody.append("disputeCategoryId", formData.disputeCategoryId)
      formBody.append("orderId", formData.orderId)
      formBody.append("description", formData.description)


      // 2. THÊM FILE: GỬI TẤT CẢ FILE VỚI MỘT KEY DUY NHẤT LÀ 'pictures'
      // Đây là cách chuẩn để gửi nhiều file cùng một lúc dưới một tên trường.
      formData.pictures.forEach((file) => {
        if (file) {
          // Bắt buộc phải là 'pictures' (có 's') và không có index
          formBody.append(`pictures`, file, file.name)
        }
      })
     
      // Chạy API POST Dispute
      const response = await profileApi.raiseDispute(formBody)
      const responseData = response.data


      if (responseData?.success) {
        // Reset form khi thành công
        // SỬA: Khi reset, giữ lại orderId hardcode/từ props
        setFormData({ orderId: initialOrderId || 1, description: "", disputeCategoryId: "", pictures: [] })
        setPreviewUrls([])
        setStatusMessage({ type: "success", message: responseData.message || "Gửi đơn khiếu nại thành công." })
      } else {
        // Xử lý lỗi trả về từ backend
        const errorMsg = responseData?.error?.message || responseData?.message || "Gửi đơn khiếu nại thất bại."
        setStatusMessage({ type: "error", message: errorMsg })
        console.error("Dispute submission failed:", responseData)
      }


    } catch (error) {
      console.error("API error during dispute submission:", error)
      const errorMsg = getAxiosErrorMessage(error)
      setStatusMessage({ type: "error", message: errorMsg || "Lỗi kết nối khi gửi đơn." })
    } finally {
      setIsLoading(false)
    }
  }


  // Sửa handleCancel
  const handleCancel = () => {
    // SỬA: Khi cancel, giữ lại orderId hardcode/từ props
    setFormData({ orderId: initialOrderId || 1, description: "", disputeCategoryId: "", pictures: [] })
    setPreviewUrls([])
    setStatusMessage({ type: "", message: "" })
  }
 
  // Custom helper để lấy message lỗi từ Axios/response (đã định nghĩa ở ngoài)
  const getAxiosErrorMessage = (error) => {
    const errorData = error.response?.data?.error;
    if (errorData?.message) return errorData.message;
    if (error.response?.data?.message) return error.response.data.message;
    return error.message || 'Lỗi không xác định.';
  };




  return (
    <div className="dispute-form-container">
      <div className="dispute-form-header">
        <h1>Đơn khiếu nại</h1>
        {/* Nút đóng/cancel nếu component này là modal, nếu không thì ẩn */}
        <button className="close-btn" onClick={handleCancel}>×</button>
      </div>


      <form onSubmit={handleSubmit} className="dispute-form">


        {/* Status Message */}
        {statusMessage.message && (
          <div className={`status-message ${statusMessage.type}`}>
            {statusMessage.message}
          </div>
        )}
       
        {/* THÊM: Hiển thị Order ID hardcode/từ props (Chỉ để hiển thị) */}
        <div className="form-section read-only-info">
          <label className="form-label">
            Mã đơn hàng liên quan: <strong>#{formData.orderId} (Tạm thời)</strong>
          </label>
          <p className="note">
            Thông tin này sẽ được gắn tự động khi bạn gửi khiếu nại từ trang Chi tiết đơn hàng.
          </p>
        </div>




        {/* Category Section */}
        <div className="form-section">
          {/* BỎ NÚT category-toggle */}
          {/* BỎ ĐIỀU KIỆN expandedCategory && để luôn hiển thị */}
          <div className="category-content" style={{ paddingTop: 0 }}>
            <label htmlFor="disputeCategoryId" className="form-label">
              Chọn loại khiếu nại *
            </label>
            <select
              id="disputeCategoryId"
              name="disputeCategoryId"
              value={formData.disputeCategoryId}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">-- Chọn loại khiếu nại --</option>
              {disputeCategories.map((category) => (
                <option key={category.disputeCategoryId} value={category.disputeCategoryId}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
        </div>
       
        {/* Description Section */}
        <div className="form-section">
          <label htmlFor="description" className="form-label">
            Nội dung chi tiết khiếu nại *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input form-textarea"
            placeholder="Mô tả chi tiết vấn đề bạn gặp phải."
            rows="4"
            required
          />
        </div>




        {/* Pictures Section */}
        <div className="form-section">
          <label className="form-label">Hình ảnh đính kèm (Tối đa {MAX_PICTURES} ảnh)</label>
          <div className="pictures-grid">
            {Array.from({ length: MAX_PICTURES }).map((_, index) => (
              <div key={index} className="picture-slot">
                {previewUrls[index] ? (
                  <div className="picture-preview">
                    {/* Placeholder for error handling */}
                    <img src={previewUrls[index]} alt={`Preview ${index}`}
                        onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
                    />
                    <button type="button" className="remove-image-btn" onClick={() => handleRemoveImage(index)}>
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="picture-upload-label" style={{ cursor: formData.pictures.length < MAX_PICTURES ? 'pointer' : 'not-allowed' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, index)}
                      style={{ display: "none" }}
                      disabled={formData.pictures.length >= MAX_PICTURES}
                    />
                    <span className="plus-icon">+</span>
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-submit" disabled={isLoading}>
            {isLoading ? "Đang gửi..." : "Gửi đơn"}
          </button>
          <button type="button" className="btn btn-cancel" onClick={handleCancel} disabled={isLoading}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  )
}



