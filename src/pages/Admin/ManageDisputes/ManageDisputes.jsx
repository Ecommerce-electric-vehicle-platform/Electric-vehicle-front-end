import React, { useEffect, useState, useCallback } from "react";
import {
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CSpinner,
  CAlert,
} from "@coreui/react";
import {
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Calendar,
  DollarSign,
  Package,
  User,
  MessageSquare,
} from "lucide-react";
import {
  getDisputes,
  getDisputeDetail,
  resolveDispute,
} from "../../../api/adminApi";
import "./ManageDisputes.css";

export default function ManageDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [size] = useState(10);
  const [error, setError] = useState(null);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeDetail, setDisputeDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Decision form state
  const [decisionForm, setDecisionForm] = useState({
    decision: "ACCEPTED",
    resolution: "",
    resolutionType: "REFUND",
    refundPercent: 0,
  });

  // State cho cảnh báo nhập phần trăm hoàn tiền không hợp lệ
  const [refundError, setRefundError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDisputes(page, size);

      // Xử lý response từ BE: response.data.data.dispute
      const responseData = response?.data?.data || response?.data || response;
      const disputesData = responseData?.dispute || [];
      const totalPagesData = responseData?.totalPages || 0;

      setDisputes(Array.isArray(disputesData) ? disputesData : []);
      setTotalPages(totalPagesData);
    } catch (e) {
      console.error("Error fetching disputes:", e);
      setError("Không thể tải danh sách tranh chấp. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetail = async (disputeId) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    setDisputeDetail(null);

    try {
      const response = await getDisputeDetail(disputeId);
      // Xử lý response từ BE: response.data.data hoặc response.data
      const detailData = response?.data?.data || response?.data || response;
      setDisputeDetail(detailData);
    } catch (e) {
      console.error("Error fetching dispute detail:", e);
      setError("Không thể tải chi tiết tranh chấp.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenDecisionModal = (dispute) => {
    setSelectedDispute(dispute);
    setDecisionForm({
      decision: "ACCEPTED",
      resolution: "",
      resolutionType: "REFUND",
      refundPercent: 0,
    });
    setShowDecisionModal(true);
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;

    // Validation
    if (!decisionForm.resolution.trim()) {
      alert("Vui lòng nhập lý do giải quyết!");
      return;
    }

    if (
      decisionForm.decision === "ACCEPTED" &&
      decisionForm.resolutionType === "REFUND"
    ) {
      if (decisionForm.refundPercent <= 0 || decisionForm.refundPercent > 100) {
        alert("Phần trăm hoàn tiền phải từ 1 đến 100!");
        return;
      }
    }

    setResolving(true);
    try {
      await resolveDispute({
        disputeId: selectedDispute.disputeId || selectedDispute.id,
        decision: decisionForm.decision,
        resolution: decisionForm.resolution,
        resolutionType: decisionForm.resolutionType,
        refundPercent:
          decisionForm.decision === "ACCEPTED" &&
          decisionForm.resolutionType === "REFUND"
            ? decisionForm.refundPercent
            : 0,
      });

      alert("Quyết định đã được gửi thành công!");
      setShowDecisionModal(false);
      setSelectedDispute(null);
      fetchData(); // Reload danh sách
    } catch (e) {
      console.error("Error resolving dispute:", e);
      const errorMsg =
        e?.response?.data?.message ||
        "Không thể gửi quyết định. Vui lòng thử lại.";
      alert(errorMsg);
    } finally {
      setResolving(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
      case "OPEN":
        return "warning";
      case "IN_REVIEW":
        return "info";
      case "RESOLVED":
      case "ACCEPTED":
        return "success";
      case "REJECTED":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      PENDING: "Đang chờ",
      OPEN: "Mở",
      IN_REVIEW: "Đang xem xét",
      RESOLVED: "Đã giải quyết",
      ACCEPTED: "Đã chấp nhận",
      REJECTED: "Đã từ chối",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="manage-disputes-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-semibold m-0">
          Quản lý tranh chấp
        </h2>
        <CButton
          className="refresh-btn"
          color="primary"
          variant="outline"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spinning" : ""} />
          <span className="ms-2">Làm mới danh sách</span>
        </CButton>
      </div>

      {error && (
        <CAlert color="danger" className="mb-3">
          {error}
        </CAlert>
      )}

      <CCard className="shadow-sm">
        <CCardBody>
          {loading && disputes.length === 0 ? (
            <div className="text-center py-5">
              <CSpinner />
              <p className="mt-3">Đang tải danh sách tranh chấp...</p>
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={64} className="text-muted mb-3" />
              <h5>Chưa có tranh chấp nào</h5>
              <p className="text-muted">
                Hiện tại không có tranh chấp đang chờ xử lý.
              </p>
            </div>
          ) : (
            <>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Mã đơn hàng</CTableHeaderCell>
                    <CTableHeaderCell>Lý do</CTableHeaderCell>
                    <CTableHeaderCell>Ngày tạo</CTableHeaderCell>
                    <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                    <CTableHeaderCell>Thao tác</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {disputes.map((dispute) => (
                    <CTableRow key={dispute.disputeId}>
                      <CTableDataCell>
                        <strong>#{dispute.disputeId}</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        {dispute.orderCode || dispute.orderId || "N/A"}
                      </CTableDataCell>
                      <CTableDataCell>
                        <div
                          className="text-truncate"
                          style={{ maxWidth: "200px" }}
                          title={
                            dispute.disputeCategoryName ||
                            dispute.description ||
                            ""
                          }
                        >
                          {dispute.disputeCategoryName ||
                            dispute.description ||
                            "N/A"}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <small className="text-muted">
                          {formatDate(
                            dispute.createdAt || dispute.submissionDate
                          )}
                        </small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={getStatusColor(dispute.status)}>
                          {getStatusText(dispute.status)}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          <CButton
                            size="sm"
                            color="info"
                            variant="outline"
                            onClick={() => handleViewDetail(dispute.disputeId)}
                          >
                            <Eye size={14} className="me-1" />
                            Chi tiết
                          </CButton>
                          {(dispute.status === "PENDING" ||
                            dispute.status === "OPEN") && (
                            <CButton
                              size="sm"
                              color="success"
                              variant="outline"
                              onClick={() => handleOpenDecisionModal(dispute)}
                            >
                              <CheckCircle size={14} className="me-1" />
                              Quyết định
                            </CButton>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span className="text-muted">
                      Trang {page + 1} / {totalPages}
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    <CButton
                      size="sm"
                      color="secondary"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0 || loading}
                    >
                      Trước
                    </CButton>
                    <CButton
                      size="sm"
                      color="secondary"
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1 || loading}
                    >
                      Sau
                    </CButton>
                  </div>
                </div>
              )}
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Modal Chi tiết Dispute */}
      <CModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>
            Chi tiết tranh chấp #
            {selectedDispute?.disputeId ||
              disputeDetail?.disputeId ||
              disputeDetail?.id}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loadingDetail ? (
            <div className="text-center py-4">
              <CSpinner />
              <p className="mt-3">Đang tải chi tiết...</p>
            </div>
          ) : disputeDetail ? (
            <div className="dispute-detail">
              <div className="detail-section">
                <h5 className="section-title">
                  <Package size={18} className="me-2" />
                  Thông tin đơn hàng
                </h5>
                <div className="detail-info">
                  <div className="info-row">
                    <span className="label">Mã đơn hàng:</span>
                    <span className="value">
                      {disputeDetail.orderCode ||
                        disputeDetail.orderId ||
                        "N/A"}
                    </span>
                  </div>
                  {disputeDetail.orderAmount && (
                    <div className="info-row">
                      <span className="label">Giá trị đơn hàng:</span>
                      <span className="value">
                        {formatCurrency(disputeDetail.orderAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h5 className="section-title">
                  <MessageSquare size={18} className="me-2" />
                  Thông tin tranh chấp
                </h5>
                <div className="detail-info">
                  <div className="info-row">
                    <span className="label">Danh mục:</span>
                    <span className="value">
                      {disputeDetail.disputeCategoryName ||
                        disputeDetail.reason ||
                        disputeDetail.disputeReason ||
                        "N/A"}
                    </span>
                  </div>
                  {disputeDetail.disputeCategoryId && (
                    <div className="info-row">
                      <span className="label">Mã danh mục:</span>
                      <span className="value">
                        {disputeDetail.disputeCategoryId}
                      </span>
                    </div>
                  )}
                  {disputeDetail.description ? (
                    <div className="info-row">
                      <span className="label">Mô tả:</span>
                      <span className="value">{disputeDetail.description}</span>
                    </div>
                  ) : (
                    <div className="info-row">
                      <span className="label">Mô tả:</span>
                      <span className="value text-muted">Không có mô tả</span>
                    </div>
                  )}
                </div>
              </div>

              {disputeDetail.evidences &&
                disputeDetail.evidences.length > 0 && (
                  <div className="detail-section">
                    <h5 className="section-title">Bằng chứng</h5>
                    <div className="evidence-grid">
                      {disputeDetail.evidences
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((ev, idx) => (
                          <div key={ev.id || idx} className="evidence-item">
                            <img
                              src={
                                ev.imageUrl ||
                                ev.url ||
                                (typeof ev === "string" ? ev : "")
                              }
                              alt={`Bằng chứng ${ev.order || idx + 1}`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/200?text=Không+tải+được";
                              }}
                            />
                            {ev.order && (
                              <div className="evidence-order">
                                Hình {ev.order}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {disputeDetail.buyer && (
                <div className="detail-section">
                  <h5 className="section-title">
                    <User size={18} className="me-2" />
                    Thông tin người khiếu nại
                  </h5>
                  <div className="detail-info">
                    <div className="info-row">
                      <span className="label">Tên:</span>
                      <span className="value">
                        {disputeDetail.buyer.name ||
                          disputeDetail.buyerName ||
                          "N/A"}
                      </span>
                    </div>
                    {disputeDetail.buyer.email && (
                      <div className="info-row">
                        <span className="label">Email:</span>
                        <span className="value">
                          {disputeDetail.buyer.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h5 className="section-title">
                  <Calendar size={18} className="me-2" />
                  Thông tin khác
                </h5>
                <div className="detail-info">
                  <div className="info-row">
                    <span className="label">Trạng thái:</span>
                    <CBadge color={getStatusColor(disputeDetail.status)}>
                      {getStatusText(disputeDetail.status)}
                    </CBadge>
                  </div>
                  <div className="info-row">
                    <span className="label">Quyết định:</span>
                    <span className="value">
                      {disputeDetail.decision === "NOT_HAVE_YET"
                        ? "Chưa có quyết định"
                        : disputeDetail.decision === "ACCEPTED"
                        ? "Chấp nhận"
                        : disputeDetail.decision === "REJECTED"
                        ? "Từ chối"
                        : disputeDetail.decision || "N/A"}
                    </span>
                  </div>
                  {disputeDetail.resolution && (
                    <div className="info-row">
                      <span className="label">Giải quyết:</span>
                      <span className="value">{disputeDetail.resolution}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="label">Ngày tạo:</span>
                    <span className="value">
                      {formatDate(
                        disputeDetail.createdAt || disputeDetail.submissionDate
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">Không thể tải chi tiết tranh chấp.</p>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </CButton>
          {disputeDetail &&
            (disputeDetail.status === "PENDING" ||
              disputeDetail.status === "OPEN") && (
              <CButton
                color="primary"
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenDecisionModal(disputeDetail);
                }}
              >
                Đưa ra quyết định
              </CButton>
            )}
        </CModalFooter>
      </CModal>

      {/* Modal Đưa ra quyết định */}
      <CModal
        visible={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>
            Đưa ra quyết định cho tranh chấp #
            {selectedDispute?.disputeId || selectedDispute?.id}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <label className="form-label">
                <strong>Quyết định *</strong>
              </label>
              <CFormSelect
                value={decisionForm.decision}
                onChange={(e) => {
                  const newDecision = e.target.value;
                  setDecisionForm({
                    ...decisionForm,
                    decision: newDecision,
                    resolutionType:
                      newDecision === "REJECTED" ? "REJECTED" : "REFUND",
                    refundPercent:
                      newDecision === "REJECTED"
                        ? 0
                        : decisionForm.refundPercent,
                  });
                }}
              >
                <option value="ACCEPTED">Chấp nhận</option>
                <option value="REJECTED">Từ chối</option>
              </CFormSelect>
            </div>

            <div className="mb-3">
              <label className="form-label">
                <strong>Loại giải quyết *</strong>
              </label>
              <CFormSelect
                value={decisionForm.resolutionType}
                onChange={(e) =>
                  setDecisionForm({
                    ...decisionForm,
                    resolutionType: e.target.value,
                  })
                }
                disabled={decisionForm.decision === "REJECTED"}
              >
                <option value="REFUND">Hoàn tiền</option>
                <option value="REJECTED">Từ chối</option>
              </CFormSelect>
              {decisionForm.decision === "REJECTED" && (
                <small className="text-muted d-block mt-1">
                  Khi từ chối, loại giải quyết sẽ tự động là "REJECTED"
                </small>
              )}
            </div>

            {decisionForm.decision === "ACCEPTED" &&
              decisionForm.resolutionType === "REFUND" && (
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Phần trăm hoàn tiền (%) *</strong>
                  </label>
                  <CFormInput
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={decisionForm.refundPercent}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/[^0-9]/g, "");
                      let num = Number(value);
                      if (value === "") {
                        setRefundError("Vui lòng nhập số từ 1 đến 100");
                        setDecisionForm({ ...decisionForm, refundPercent: "" });
                      } else if (num < 1 || num > 100) {
                        setRefundError("Chỉ được nhập giá trị từ 1 đến 100");
                        setDecisionForm({
                          ...decisionForm,
                          refundPercent: num,
                        });
                      } else {
                        setRefundError("");
                        setDecisionForm({
                          ...decisionForm,
                          refundPercent: num,
                        });
                      }
                    }}
                    placeholder="Nhập phần trăm hoàn tiền (1-100)"
                  />
                  <small className="text-muted d-block mt-1">
                    Nhập số phần trăm hoàn tiền cho người mua (từ 1 đến 100)
                  </small>
                  {refundError && (
                    <div className="text-danger small mt-1">{refundError}</div>
                  )}
                </div>
              )}

            <div className="mb-3">
              <label className="form-label">
                <strong>Lý do giải quyết *</strong>
              </label>
              <CFormTextarea
                rows="4"
                value={decisionForm.resolution}
                onChange={(e) =>
                  setDecisionForm({
                    ...decisionForm,
                    resolution: e.target.value,
                  })
                }
                placeholder="Nhập lý do và giải thích cho quyết định này..."
                required
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowDecisionModal(false)}
            disabled={resolving}
          >
            Hủy
          </CButton>
          <CButton color="primary" onClick={handleResolve} disabled={resolving}>
            {resolving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="me-2" />
                Xác nhận quyết định
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
