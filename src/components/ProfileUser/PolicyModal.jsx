
import "./PolicyModal.css"

const policyContent = `QUY ĐỊNH VỀ ĐĂNG BÁN SẢN PHẨM TRÊN GREENTRADE

A. PHẠM VI VÀ ĐỐI TƯỢNG ÁP DỤNG

1. Đối tượng áp dụng
Quy định này áp dụng đối với tất cả Người Bán trên Sàn TMĐT GreenTrade ("Sàn GreenTrade").

2. Phạm vi áp dụng
Quy định này quy định về việc đăng bán các sản phẩm xe máy, xe đạp, linh kiện, phụ tùng, pin, ắc quy và các sản phẩm liên quan trên Sàn GreenTrade.

B. QUY ĐỊNH CHUNG

1. Nguyên tắc chung
a. Đăng bán sản phẩm trên GreenTrade là hoạt động của Người Bán sử dụng hàng hóa, dịch vụ và tài liệu mô tả để giới thiệu với khách hàng về hàng hóa, dịch vụ đó.

b. Khi đăng bán sản phẩm trên GreenTrade, Người Bán có trách nhiệm tuân thủ các quy định của pháp luật hiện hành về thương mại điện tử, an toàn hàng hóa, môi trường và quản lý sản phẩm có pin/ắc quy, đặc biệt đối với:
- Xe máy, xe đạp điện, pin lithium, ắc quy chì và các linh kiện liên quan.
- Các quy định về thu hồi, tái chế hoặc xử lý rác thải pin, ắc quy theo quy định của pháp luật Việt Nam.

c. Tất cả chứng từ mà Người Bán được yêu cầu cung cấp cho GreenTrade phải đảm bảo là bản scan từ chứng từ gốc, không làm giả, không chỉnh sửa, không tẩy xóa (ví dụ: giấy chứng nhận đăng ký kinh doanh, chứng nhận an toàn sản phẩm, chứng nhận nguồn gốc pin, hóa đơn nhập hàng...).

2. Các nội dung không được phép đăng bán
Người Bán được quyền đăng bán các sản phẩm hợp pháp nhằm mục đích kinh doanh trên GreenTrade. Tuy nhiên, NGHIÊM CẤM đăng tải hoặc kinh doanh các sản phẩm có nội dung hoặc tính chất sau:

a. Sản phẩm không rõ nguồn gốc, không đủ điều kiện lưu hành, ví dụ:
- Xe máy, xe đạp, xe điện không có số khung, số máy rõ ràng hoặc không có giấy tờ chứng minh nguồn gốc hợp pháp.
- Pin, ắc quy đã qua sử dụng không có nhãn, không đảm bảo an toàn kỹ thuật hoặc có dấu hiệu rò rỉ, cháy nổ.

b. Sản phẩm vi phạm quy định về an toàn kỹ thuật hoặc môi trường, bao gồm:
- Pin lithium, ắc quy, hoặc linh kiện có nguy cơ cháy nổ, rò rỉ hóa chất.
- Xe điện độ chế, thay đổi kết cấu kỹ thuật không được cấp phép.
- Sản phẩm không có tem kiểm định, nhãn năng lượng, hoặc thông tin cảnh báo theo quy định.

c. Sản phẩm vi phạm quyền sở hữu trí tuệ, ví dụ:
- Xe, linh kiện, phụ tùng hoặc pin gắn logo, nhãn hiệu giả mạo thương hiệu của bên thứ ba.
- Tài liệu kỹ thuật, phần mềm điều khiển bị sao chép trái phép.

d. Sản phẩm thuộc danh sách bị cấm/hạn chế đăng bán của GreenTrade, bao gồm:
- Xe máy, xe điện, hoặc pin bị thu hồi do lỗi kỹ thuật hoặc nguy cơ cháy nổ.
- Ắc quy, pin lithium hoặc thiết bị lưu trữ năng lượng không đạt tiêu chuẩn an toàn của Bộ Khoa học & Công nghệ hoặc Bộ Công Thương.

3. Trách nhiệm của Người Bán
- Đảm bảo mọi sản phẩm đăng bán có mô tả chính xác, trung thực, bao gồm:
  - Thông tin về loại xe/pin, tình trạng sử dụng, dung lượng, năm sản xuất, chính sách đổi trả.
  - Cảnh báo an toàn khi sử dụng, sạc hoặc lưu trữ pin.
- Không được cố tình ẩn thông tin sản phẩm đã qua sử dụng, đánh tráo thông tin kỹ thuật, hoặc đăng hình ảnh sai lệch với sản phẩm thực tế.
- Phối hợp với GreenTrade trong trường hợp có khiếu nại hoặc yêu cầu xác minh nguồn gốc sản phẩm.

4. Chế tài xử lý vi phạm
GreenTrade có quyền tạm ẩn, gỡ bỏ hoặc khóa tài khoản Người Bán nếu phát hiện vi phạm các quy định nêu trên.
Các hành vi vi phạm nghiêm trọng (ví dụ: bán pin cũ không an toàn, xe điện không nguồn gốc, giả nhãn mác) có thể bị báo cáo đến cơ quan chức năng theo quy định pháp luật.`

export default function PolicyModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chính sách bán hàng</h2>
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
