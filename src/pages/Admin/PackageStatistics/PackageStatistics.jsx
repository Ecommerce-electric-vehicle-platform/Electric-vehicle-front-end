import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
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
  CSpinner,
  CAlert,
  CPagination,
  CPaginationItem,
} from "@coreui/react";
import {
  BarChart3,
  Users,
  DollarSign,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getPackageStatistics,
  getPackageStatisticsById,
  getPackageSubscribers,
} from "../../../api/adminApi";
import "./PackageStatistics.css";

export default function PackageStatistics() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageDetail, setPackageDetail] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // Pagination for subscribers
  const [subscriberPage, setSubscriberPage] = useState(0);
  const [subscriberSize] = useState(10);
  const [subscriberTotalPages, setSubscriberTotalPages] = useState(0);
  const [subscriberTotalElements, setSubscriberTotalElements] = useState(0);

  // Load packages statistics
  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPackageStatistics();
      const packagesData = response?.data?.packages || response?.data || [];
      setPackages(Array.isArray(packagesData) ? packagesData : []);
    } catch (err) {
      console.error("Lỗi khi tải thống kê packages:", err);
      setError("Không thể tải thống kê gói dịch vụ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Load package detail and subscribers
  const loadPackageDetail = async (packageId) => {
    try {
      setLoadingDetail(true);
      setLoadingSubscribers(true);
      setSubscriberPage(0);

      // Load package statistics with subscribers
      const [detailResponse, subscribersResponse] = await Promise.all([
        getPackageStatisticsById(packageId, true),
        getPackageSubscribers(packageId, 0, subscriberSize),
      ]);

      const detailData = detailResponse?.data || detailResponse || {};
      setPackageDetail(detailData);

      // Extract subscribers from detail or separate API
      const subscribersData =
        detailData.subscribers ||
        subscribersResponse?.data?.content ||
        subscribersResponse?.data ||
        [];
      setSubscribers(Array.isArray(subscribersData) ? subscribersData : []);

      // Extract pagination info
      const meta = subscribersResponse?.data?.meta || {};
      setSubscriberTotalPages(meta.totalPages || 0);
      setSubscriberTotalElements(meta.totalElements || subscribersData.length);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết package:", err);
      setError("Không thể tải chi tiết gói dịch vụ. Vui lòng thử lại.");
    } finally {
      setLoadingDetail(false);
      setLoadingSubscribers(false);
    }
  };

  // Load subscribers with pagination
  const loadSubscribers = async (page) => {
    if (!selectedPackage) return;

    try {
      setLoadingSubscribers(true);
      const response = await getPackageSubscribers(selectedPackage.packageId, page, subscriberSize);
      const subscribersData =
        response?.data?.content || response?.data || [];
      setSubscribers(Array.isArray(subscribersData) ? subscribersData : []);

      const meta = response?.data?.meta || {};
      setSubscriberTotalPages(meta.totalPages || 0);
      setSubscriberTotalElements(meta.totalElements || subscribersData.length);
    } catch (err) {
      console.error("Lỗi khi tải subscribers:", err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleViewDetail = async (pkg) => {
    setSelectedPackage(pkg);
    setShowDetailModal(true);
    await loadPackageDetail(pkg.packageId);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedPackage(null);
    setPackageDetail(null);
    setSubscribers([]);
    setSubscriberPage(0);
  };

  const handleSubscriberPageChange = (newPage) => {
    setSubscriberPage(newPage);
    loadSubscribers(newPage);
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // Calculate totals
  const totalSubscribers = packages.reduce((sum, pkg) => sum + (pkg.totalSubscribers || 0), 0);
  const totalRevenue = packages.reduce((sum, pkg) => sum + (pkg.totalRevenue || 0), 0);

  return (
    <div className="package-statistics-page">
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Thống kê mua gói dịch vụ</h4>
            <p className="text-muted mb-0">Xem chi tiết thống kê theo từng nhóm gói</p>
          </div>
          <CButton color="secondary" onClick={loadPackages} disabled={loading}>
            <BarChart3 size={16} style={{ marginRight: "8px" }} />
            Làm mới
          </CButton>
        </CCardHeader>
        <CCardBody>
          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}

          {/* Summary Cards */}
          <div className="statistics-summary mb-4">
            <div className="summary-card">
              <Package size={24} />
              <div>
                <div className="summary-label">Tổng số gói</div>
                <div className="summary-value">{packages.length}</div>
              </div>
            </div>
            <div className="summary-card">
              <Users size={24} />
              <div>
                <div className="summary-label">Tổng người mua</div>
                <div className="summary-value">{totalSubscribers}</div>
              </div>
            </div>
            <div className="summary-card">
              <DollarSign size={24} />
              <div>
                <div className="summary-label">Tổng doanh thu</div>
                <div className="summary-value">{formatCurrency(totalRevenue)}</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <CSpinner />
              <p className="mt-3">Đang tải dữ liệu...</p>
            </div>
          ) : packages.length === 0 ? (
            <CAlert color="info">Chưa có gói dịch vụ nào.</CAlert>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>ID</CTableHeaderCell>
                  <CTableHeaderCell>Tên gói</CTableHeaderCell>
                  <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                  <CTableHeaderCell>Số người mua</CTableHeaderCell>
                  <CTableHeaderCell>Doanh thu</CTableHeaderCell>
                  <CTableHeaderCell>Thao tác</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {packages.map((pkg) => (
                  <CTableRow key={pkg.packageId}>
                    <CTableDataCell>{pkg.packageId}</CTableDataCell>
                    <CTableDataCell>
                      <strong>{pkg.packageName || "N/A"}</strong>
                    </CTableDataCell>
                    <CTableDataCell>
                      {pkg.isActive ? (
                        <CBadge color="success">Đang hoạt động</CBadge>
                      ) : (
                        <CBadge color="secondary">Không hoạt động</CBadge>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <Users size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                      {pkg.totalSubscribers || 0}
                    </CTableDataCell>
                    <CTableDataCell>
                      <DollarSign size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                      {formatCurrency(pkg.totalRevenue || 0)}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="info"
                        size="sm"
                        onClick={() => handleViewDetail(pkg)}
                      >
                        <Eye size={14} style={{ marginRight: "4px" }} />
                        Xem chi tiết
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Detail Modal */}
      <CModal
        visible={showDetailModal}
        onClose={handleCloseModal}
        size="xl"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>
            Chi tiết gói: {selectedPackage?.packageName || "N/A"}
          </CModalTitle>
          <CButton color="secondary" onClick={handleCloseModal}>
            <X size={16} />
          </CButton>
        </CModalHeader>
        <CModalBody>
          {loadingDetail ? (
            <div className="text-center py-5">
              <CSpinner />
              <p className="mt-3">Đang tải chi tiết...</p>
            </div>
          ) : packageDetail ? (
            <>
              {/* Package Info */}
              <div className="package-detail-info mb-4">
                <h5>Thông tin gói</h5>
                <div className="detail-grid">
                  <div>
                    <strong>Mô tả:</strong> {packageDetail.description || "N/A"}
                  </div>
                  <div>
                    <strong>Trạng thái:</strong>{" "}
                    {packageDetail.isActive ? (
                      <CBadge color="success">Đang hoạt động</CBadge>
                    ) : (
                      <CBadge color="secondary">Không hoạt động</CBadge>
                    )}
                  </div>
                  <div>
                    <strong>Tổng người mua:</strong> {packageDetail.totalSubscribers || 0}
                  </div>
                  <div>
                    <strong>Tổng doanh thu:</strong> {formatCurrency(packageDetail.totalRevenue || 0)}
                  </div>
                </div>
              </div>

              {/* Subscribers Table */}
              <div className="subscribers-section">
                <h5>Danh sách người mua</h5>
                {loadingSubscribers ? (
                  <div className="text-center py-3">
                    <CSpinner size="sm" />
                  </div>
                ) : subscribers.length === 0 ? (
                  <CAlert color="info">Chưa có người mua nào.</CAlert>
                ) : (
                  <>
                    <CTable hover responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Seller ID</CTableHeaderCell>
                          <CTableHeaderCell>Tên seller</CTableHeaderCell>
                          <CTableHeaderCell>Tên cửa hàng</CTableHeaderCell>
                          <CTableHeaderCell>Giá mua</CTableHeaderCell>
                          <CTableHeaderCell>Ngày bắt đầu</CTableHeaderCell>
                          <CTableHeaderCell>Ngày kết thúc</CTableHeaderCell>
                          <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {subscribers.map((sub, idx) => (
                          <CTableRow key={sub.subscriptionId || idx}>
                            <CTableDataCell>{sub.sellerId || "N/A"}</CTableDataCell>
                            <CTableDataCell>{sub.sellerName || "N/A"}</CTableDataCell>
                            <CTableDataCell>{sub.storeName || "N/A"}</CTableDataCell>
                            <CTableDataCell>
                              {formatCurrency(sub.priceAtPurchase || 0)}
                            </CTableDataCell>
                            <CTableDataCell>
                              <Calendar size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                              {formatDate(sub.startDay)}
                            </CTableDataCell>
                            <CTableDataCell>
                              <Calendar size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                              {formatDate(sub.endDay)}
                            </CTableDataCell>
                            <CTableDataCell>
                              {sub.isActive ? (
                                <CBadge color="success">
                                  <CheckCircle size={12} style={{ marginRight: "4px" }} />
                                  Đang hoạt động
                                </CBadge>
                              ) : (
                                <CBadge color="secondary">
                                  <XCircle size={12} style={{ marginRight: "4px" }} />
                                  Hết hạn
                                </CBadge>
                              )}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>

                    {/* Pagination */}
                    {subscriberTotalPages > 1 && (
                      <CPagination className="mt-3">
                        <CPaginationItem
                          disabled={subscriberPage === 0}
                          onClick={() => handleSubscriberPageChange(subscriberPage - 1)}
                        >
                          <ChevronLeft size={16} />
                        </CPaginationItem>
                        {Array.from({ length: subscriberTotalPages }, (_, i) => (
                          <CPaginationItem
                            key={i}
                            active={i === subscriberPage}
                            onClick={() => handleSubscriberPageChange(i)}
                          >
                            {i + 1}
                          </CPaginationItem>
                        ))}
                        <CPaginationItem
                          disabled={subscriberPage >= subscriberTotalPages - 1}
                          onClick={() => handleSubscriberPageChange(subscriberPage + 1)}
                        >
                          <ChevronRight size={16} />
                        </CPaginationItem>
                      </CPagination>
                    )}
                    <div className="text-muted mt-2">
                      Hiển thị {subscribers.length} / {subscriberTotalElements} người mua
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <CAlert color="warning">Không tìm thấy thông tin chi tiết.</CAlert>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCloseModal}>
            Đóng
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}

