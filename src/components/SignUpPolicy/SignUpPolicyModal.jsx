import "./SignUpPolicyModal.css";


const policyContent = `
CHÍNH SÁCH & ĐIỀU KHOẢN SỬ DỤNG

Bằng việc đăng ký tài khoản, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản sau:

1. Đăng ký & sử dụng tài khoản
- Người dùng phải cung cấp thông tin chính xác, đầy đủ khi đăng ký.
- Không chia sẻ hoặc sử dụng tài khoản của người khác.
- Nền tảng có quyền tạm khóa hoặc xóa tài khoản khi phát hiện hành vi gian lận, vi phạm pháp luật hoặc điều khoản này.

2. Bảo mật thông tin cá nhân
- Thông tin bạn cung cấp được bảo mật theo quy định pháp luật.
- Chúng tôi chỉ sử dụng dữ liệu cho mục đích xác minh, giao dịch, hỗ trợ và cải thiện dịch vụ.
- Bạn có quyền yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân bất cứ lúc nào.

3. Thanh toán & hoàn tiền
- Hệ thống hỗ trợ nhiều phương thức thanh toán (ví điện tử, chuyển khoản, COD...).
- Trường hợp thanh toán trực tuyến, nếu giao dịch bị lỗi hoặc đơn hàng bị hủy, tiền sẽ được hoàn theo quy trình hỗ trợ của hệ thống.
- Với đơn hàng COD, không áp dụng hoàn tiền tự động.

4. Khiếu nại & giải quyết tranh chấp
- Người dùng có thể gửi khiếu nại qua email hoặc hotline hỗ trợ.
- Nền tảng cam kết phản hồi trong vòng 3–5 ngày làm việc.
- Mọi tranh chấp sẽ được giải quyết trên tinh thần hợp tác, tuân thủ quy định pháp luật Việt Nam.

5. Quyền & nghĩa vụ của người dùng
- Tuân thủ quy định pháp luật, không đăng tải nội dung vi phạm, lừa đảo hoặc gây hại cho người khác.
- Tự chịu trách nhiệm về hoạt động của mình trên nền tảng.
- Không can thiệp hoặc làm gián đoạn hệ thống.
`

export default function SignUpPolicyModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chính sách & Điều khoản sử dụng</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="policy-text">{policyContent}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
