import React, { useState, useEffect, useCallback } from "react";
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
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormSelect,
  CFormCheck,
  CSpinner,
  CAlert,
  CPagination,
  CPaginationItem,
  CRow,
  CCol,
} from "@coreui/react";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Eye,
  Save,
} from "lucide-react";
import {
  getSubscriptionPackages,
  getSubscriptionPackageById,
  createSubscriptionPackage,
  updateSubscriptionPackage,
} from "../../../api/adminApi";
import "./SubscriptionPackages.css";

export default function SubscriptionPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPriceId, setSelectedPriceId] = useState(null);
  const [selectedEditPriceId, setSelectedEditPriceId] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
    maxProduct: "",
    maxImgPerPost: "",
    canSendVerifyRequest: true,
    prices: [],
  });

  // Price form state
  const [priceForm, setPriceForm] = useState({
    price: "",
    isActive: true,
    durationByDay: "",
    currency: "VND",
    discountPercent: "0",
  });

  // Kiểm tra quyền Super Admin
  useEffect(() => {
    const checkSuperAdmin = () => {
      try {
        const adminRole = localStorage.getItem("adminRole");
        if (adminRole === "SUPER_ADMIN") {
          setIsSuperAdmin(true);
          return;
        }

        const adminProfileStr = localStorage.getItem("adminProfile");
        if (adminProfileStr) {
          const adminProfile = JSON.parse(adminProfileStr);
          const isSuper =
            adminProfile?.isSuperAdmin === true ||
            adminProfile?.superAdmin === true ||
            adminProfile?.is_super_admin === true;
          setIsSuperAdmin(isSuper);
        }
      } catch (err) {
        console.error("Error checking super admin:", err);
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();
  }, []);

  // Fetch packages
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await getSubscriptionPackages(page, size);
      
      // Xử lý response theo cấu trúc: { success, message, data: { content, totalPages, totalElements } }
      const responseData = response?.data || response;
      const dataContent = responseData?.data || responseData;
      const content = dataContent?.content || [];
      
      // Lấy pagination info
      const totalPagesData = dataContent?.totalPages || 
                            responseData?.totalPages || 
                            (content.length > 0 ? Math.ceil(content.length / size) : 0);
      const totalElementsData = dataContent?.totalElements || 
                               responseData?.totalElements || 
                               content.length;

      // Normalize dữ liệu: map `active` thành `isActive` để tương thích với component
      const normalizedPackages = (Array.isArray(content) ? content : []).map((pkg) => ({
        ...pkg,
        isActive: pkg.active !== undefined ? pkg.active : pkg.isActive !== undefined ? pkg.isActive : true,
      }));

      setPackages(normalizedPackages);
      setTotalPages(totalPagesData);
      setTotalElements(totalElementsData);
      
      // Hiển thị message từ API nếu có
      if (responseData?.message && responseData?.success) {
        setSuccess(responseData.message);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error fetching subscription packages:", err);
      setError(
        err?.response?.data?.message ||
          "Không thể tải danh sách subscription packages. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format duration (days to months/days)
  const formatDuration = (days) => {
    if (!days) return "-";
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (months > 0 && remainingDays === 0) {
      return `${months} tháng`;
    } else if (months > 0) {
      return `${months} tháng ${remainingDays} ngày`;
    } else {
      return `${days} ngày`;
    }
  };

  // Tính giá theo tháng
  const calculatePricePerMonth = (price, durationByDay) => {
    if (!price || !durationByDay) return 0;
    return Math.round((price / durationByDay) * 30);
  };

  // Tính tiết kiệm so với giá 1 tháng (nếu có)
  const calculateSavings = (price, durationByDay, basePricePerMonth) => {
    if (!basePricePerMonth || !durationByDay) return null;
    const months = durationByDay / 30;
    const expectedPrice = basePricePerMonth * months;
    const savings = expectedPrice - price;
    return savings > 0 ? savings : null;
  };

  // Get status badge
  const getStatusBadge = (isActive) => {
    return isActive ? (
      <CBadge color="success" className="badge-active">Active</CBadge>
    ) : (
      <CBadge color="danger" className="badge-inactive">Inactive</CBadge>
    );
  };

  // Handle open create modal
  const handleOpenCreateModal = () => {
    if (!isSuperAdmin) {
      alert("Chỉ Super Admin mới có thể tạo subscription package!");
      return;
    }
    setForm({
      name: "",
      description: "",
      isActive: true,
      maxProduct: "",
      maxImgPerPost: "",
      canSendVerifyRequest: true,
      prices: [],
    });
    setPriceForm({
      price: "",
      isActive: true,
      durationByDay: "",
      currency: "VND",
      discountPercent: "0",
    });
    setShowCreateModal(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = async (packageId) => {
    if (!isSuperAdmin) {
      alert("Chỉ Super Admin mới có thể cập nhật subscription package!");
      return;
    }

    setLoadingDetail(true);
    setShowEditModal(true);
    try {
      // Sử dụng dữ liệu đã có trong danh sách
      const packageData = packages.find((pkg) => pkg.id === packageId);
      let finalPackageData = packageData;

      if (!finalPackageData) {
        // Nếu không có, gọi API
        const response = await getSubscriptionPackageById(packageId);
        finalPackageData = response?.data?.data || response?.data || response;
      }

      setSelectedPackage(finalPackageData);
      setForm({
        name: finalPackageData.name || "",
        description: finalPackageData.description || "",
        isActive: finalPackageData.isActive !== undefined ? finalPackageData.isActive : (finalPackageData.active !== undefined ? finalPackageData.active : true),
        maxProduct: finalPackageData.maxProduct?.toString() || "",
        maxImgPerPost: finalPackageData.maxImgPerPost?.toString() || "",
        canSendVerifyRequest:
          finalPackageData.canSendVerifyRequest !== undefined
            ? finalPackageData.canSendVerifyRequest
            : true,
        prices: finalPackageData.prices || [],
      });

      // Set combo đầu tiên làm mặc định để chỉnh sửa
      if (finalPackageData.prices && finalPackageData.prices.length > 0) {
        const sortedPrices = [...finalPackageData.prices].sort((a, b) => 
          (a.durationByDay || 0) - (b.durationByDay || 0)
        );
        setSelectedEditPriceId(sortedPrices[0].id);
        setEditingPrice({ ...sortedPrices[0] });
      } else {
        setSelectedEditPriceId(null);
        setEditingPrice(null);
      }
    } catch (err) {
      console.error("Error fetching package detail:", err);
      setError("Không thể tải chi tiết package.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle open detail modal
  const handleOpenDetailModal = (packageId) => {
    // Sử dụng dữ liệu đã có trong danh sách thay vì gọi API mới
    const packageData = packages.find((pkg) => pkg.id === packageId);
    if (packageData) {
      setSelectedPackage(packageData);
      // Set combo đầu tiên làm mặc định
      if (packageData.prices && packageData.prices.length > 0) {
        const sortedPrices = [...packageData.prices].sort((a, b) => 
          (a.durationByDay || 0) - (b.durationByDay || 0)
        );
        setSelectedPriceId(sortedPrices[0].id);
      } else {
        setSelectedPriceId(null);
      }
      setShowDetailModal(true);
      setError(""); // Clear error nếu có
    } else {
      // Nếu không tìm thấy trong danh sách, thử gọi API
      setLoadingDetail(true);
      setShowDetailModal(true);
      getSubscriptionPackageById(packageId)
        .then((response) => {
          const data = response?.data?.data || response?.data || response;
          setSelectedPackage(data);
          // Set combo đầu tiên làm mặc định
          if (data.prices && data.prices.length > 0) {
            const sortedPrices = [...data.prices].sort((a, b) => 
              (a.durationByDay || 0) - (b.durationByDay || 0)
            );
            setSelectedPriceId(sortedPrices[0].id);
          } else {
            setSelectedPriceId(null);
          }
          setError("");
        })
        .catch((err) => {
          console.error("Error fetching package detail:", err);
          setError("Không thể tải chi tiết package.");
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    }
  };

  // Handle add price
  const handleAddPrice = () => {
    if (!priceForm.price || !priceForm.durationByDay) {
      alert("Vui lòng nhập đầy đủ thông tin price!");
      return;
    }

    const newPrice = {
      price: parseInt(priceForm.price),
      isActive: priceForm.isActive,
      durationByDay: parseInt(priceForm.durationByDay),
      currency: priceForm.currency,
      discountPercent: parseFloat(priceForm.discountPercent) || 0,
    };

    setForm({
      ...form,
      prices: [...form.prices, newPrice],
    });

    // Reset price form
    setPriceForm({
      price: "",
      isActive: true,
      durationByDay: "",
      currency: "VND",
      discountPercent: "0",
    });
  };

  // Handle remove price
  const handleRemovePrice = (index) => {
    const newPrices = form.prices.filter((_, i) => i !== index);
    setForm({
      ...form,
      prices: newPrices,
    });
    // Nếu price bị xóa là price đang được chỉnh sửa, reset editing state
    if (form.prices[index]?.id === selectedEditPriceId) {
      setSelectedEditPriceId(null);
      setEditingPrice(null);
    }
  };

  // Handle select price to edit
  const handleSelectPriceToEdit = (priceIdOrString) => {
    // e.target.value luôn là string, cần xử lý đúng
    const valueStr = String(priceIdOrString);
    
    // Nếu là string dạng "new-30", parse thành number để so sánh với durationByDay
    if (valueStr.startsWith('new-')) {
      const durationByDay = parseInt(valueStr.replace('new-', ''));
      const price = form.prices.find((p) => !p.id && p.durationByDay === durationByDay);
      if (price) {
        setSelectedEditPriceId(`new-${price.durationByDay}`);
        setEditingPrice({ ...price });
      }
    } else {
      // Nếu là id (number dạng string), convert sang number để so sánh
      const priceId = parseInt(valueStr);
      const price = form.prices.find((p) => p.id && Number(p.id) === priceId);
      if (price) {
        setSelectedEditPriceId(price.id);
        setEditingPrice({ ...price });
      }
    }
  };

  // Handle update selected price
  const handleUpdateSelectedPrice = () => {
    if (!editingPrice || !selectedEditPriceId) return;

    const updatedPrices = form.prices.map((p) => {
      if (p.id && p.id === selectedEditPriceId) {
        return { ...editingPrice };
      } else if (!p.id && `new-${p.durationByDay}` === selectedEditPriceId) {
        return { ...editingPrice };
      }
      return p;
    });
    setForm({ ...form, prices: updatedPrices });
    setError("");
    setSuccess("Đã cập nhật combo!");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Handle create package
  const handleCreatePackage = async () => {
    // Validation
    if (!form.name || !form.description || !form.maxProduct || !form.maxImgPerPost) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (parseInt(form.maxProduct) <= 0 || parseInt(form.maxImgPerPost) <= 0) {
      alert("maxProduct và maxImgPerPost phải lớn hơn 0!");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const packageData = {
        name: form.name,
        description: form.description,
        isActive: form.isActive,
        maxProduct: parseInt(form.maxProduct),
        maxImgPerPost: parseInt(form.maxImgPerPost),
        canSendVerifyRequest: form.canSendVerifyRequest,
        prices: form.prices.map((p) => ({
          price: p.price,
          isActive: p.isActive,
          durationByDay: p.durationByDay,
          currency: p.currency,
          discountPercent: p.discountPercent || 0,
        })),
      };

      await createSubscriptionPackage(packageData);
      setSuccess("Tạo subscription package thành công!");
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error("Error creating package:", err);
      setError(
        err?.response?.data?.message ||
          "Không thể tạo subscription package. Vui lòng thử lại sau."
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle update package
  const handleUpdatePackage = async () => {
    if (!selectedPackage) return;

    // Validation
    if (!form.name || !form.description || !form.maxProduct || !form.maxImgPerPost) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (parseInt(form.maxProduct) <= 0 || parseInt(form.maxImgPerPost) <= 0) {
      alert("maxProduct và maxImgPerPost phải lớn hơn 0!");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const packageData = {
        name: form.name,
        description: form.description,
        // Backend: isActive is optional - if null when updating, keep existing value
        // Nếu form.isActive là boolean (true/false), gửi giá trị đó
        // Nếu undefined, gửi null để backend giữ nguyên giá trị hiện tại
        isActive: form.isActive !== undefined ? form.isActive : null,
        maxProduct: parseInt(form.maxProduct),
        maxImgPerPost: parseInt(form.maxImgPerPost),
        canSendVerifyRequest: form.canSendVerifyRequest,
        prices: form.prices.map((p) => {
          // Nếu price có id, giữ nguyên id để update
          if (p.id) {
            return {
              id: p.id,
              price: p.price,
              // Backend: isActive is optional - if null when updating, keep existing value
              isActive: p.isActive !== undefined ? p.isActive : null,
              durationByDay: p.durationByDay,
              currency: p.currency,
              discountPercent: p.discountPercent || 0,
            };
          }
          // Không có id → tạo mới
          return {
            price: p.price,
            // Khi tạo mới, nếu isActive là undefined/null thì default là true
            isActive: p.isActive !== undefined && p.isActive !== null ? p.isActive : true,
            durationByDay: p.durationByDay,
            currency: p.currency,
            discountPercent: p.discountPercent || 0,
          };
        }),
      };

      await updateSubscriptionPackage(selectedPackage.id, packageData);
      setSuccess("Cập nhật subscription package thành công!");
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.error("Error updating package:", err);
      setError(
        err?.response?.data?.message ||
          "Không thể cập nhật subscription package. Vui lòng thử lại sau."
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div className="subscription-packages-page">
      <CCard className="shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Quản lý Gói Dịch Vụ</h4>
            <p className="text-muted mb-0 small">
              Quản lý các gói dịch vụ và giá
            </p>
          </div>
          <div className="d-flex gap-2">
            {isSuperAdmin && (
              <CButton
                color="primary"
                onClick={handleOpenCreateModal}
                className="d-flex align-items-center gap-2"
              >
                <Plus size={16} />
                Tạo mới
              </CButton>
            )}
            <CButton
              color="secondary"
              onClick={handleRefresh}
              disabled={loading}
              className="d-flex align-items-center gap-2"
            >
              <RefreshCw size={16} />
              Làm mới
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible onClose={() => setError("")}>
              {error}
            </CAlert>
          )}
          {success && (
            <CAlert color="success" dismissible onClose={() => setSuccess("")}>
              {success}
            </CAlert>
          )}

          {loading ? (
            <div className="text-center p-5">
              <CSpinner color="primary" />
              <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center p-5">
              <p className="text-muted">Không có subscription package nào.</p>
            </div>
          ) : (
            <>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Tên gói</CTableHeaderCell>
                    <CTableHeaderCell>Mô tả</CTableHeaderCell>
                    <CTableHeaderCell>Số bài đăng tối đa</CTableHeaderCell>
                    <CTableHeaderCell>Số ảnh tối đa/Bài đăng</CTableHeaderCell>
                    <CTableHeaderCell>Được gửi yêu cầu xác minh</CTableHeaderCell>
                    <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                    <CTableHeaderCell>Giá</CTableHeaderCell>
                    <CTableHeaderCell>Thao tác</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {packages.map((pkg) => (
                    <CTableRow key={pkg.id}>
                      <CTableDataCell>{pkg.id}</CTableDataCell>
                      <CTableDataCell>
                        <strong>{pkg.name}</strong>
                      </CTableDataCell>
                      <CTableDataCell>
                        <span className="text-muted small">
                          {pkg.description?.substring(0, 50)}
                          {pkg.description?.length > 50 ? "..." : ""}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>{pkg.maxProduct}</CTableDataCell>
                      <CTableDataCell>{pkg.maxImgPerPost}</CTableDataCell>
                      <CTableDataCell>
                        {pkg.canSendVerifyRequest ? (
                          <CBadge color="info" className="badge-yes">Yes</CBadge>
                        ) : (
                          <CBadge color="secondary" className="badge-no">No</CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>{getStatusBadge(pkg.isActive)}</CTableDataCell>
                      <CTableDataCell>
                        <div>
                          <span className={`badge ${(pkg.prices?.length || 0) > 0 ? 'bg-success badge-combo' : 'bg-secondary badge-combo-empty'}`}>
                            {pkg.prices?.length || 0} combo
                          </span>
                          {pkg.prices && pkg.prices.length > 0 && (
                            <div className="mt-1">
                              <small className="text-muted">
                                Từ {formatCurrency(pkg.prices[0]?.price || 0)}/{formatDuration(pkg.prices[0]?.durationByDay || 0)}
                              </small>
                            </div>
                          )}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          <CButton
                            color="info"
                            size="sm"
                            onClick={() => handleOpenDetailModal(pkg.id)}
                            className="d-flex align-items-center gap-1"
                          >
                            <Eye size={14} />
                            Chi tiết
                          </CButton>
                          {isSuperAdmin && (
                            <CButton
                              color="primary"
                              size="sm"
                              onClick={() => handleOpenEditModal(pkg.id)}
                              className="d-flex align-items-center gap-1"
                            >
                              <Edit size={14} />
                              Sửa
                            </CButton>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <CPagination>
                    <CPaginationItem
                      disabled={page === 0}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      Trước
                    </CPaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <CPaginationItem
                        key={i}
                        active={i === page}
                        onClick={() => handlePageChange(i)}
                      >
                        {i + 1}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={page === totalPages - 1}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Sau
                    </CPaginationItem>
                  </CPagination>
                </div>
              )}

              <div className="mt-3 text-muted small text-center">
                Hiển thị {packages.length} / {totalElements} packages
              </div>
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Create Package Modal */}
      <CModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        backdrop="static"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Tạo Subscription Package</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow>
              <CCol md={6}>
                <CFormLabel>
                  <strong>Name *</strong>
                </CFormLabel>
                <CFormInput
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Premium Plan"
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>
                  <strong>Max Product *</strong>
                </CFormLabel>
                <CFormInput
                  type="number"
                  value={form.maxProduct}
                  onChange={(e) =>
                    setForm({ ...form, maxProduct: e.target.value })
                  }
                  placeholder="200"
                  min="1"
                />
              </CCol>
            </CRow>
            <CRow className="mt-3">
              <CCol md={6}>
                <CFormLabel>
                  <strong>Max Img/Post *</strong>
                </CFormLabel>
                <CFormInput
                  type="number"
                  value={form.maxImgPerPost}
                  onChange={(e) =>
                    setForm({ ...form, maxImgPerPost: e.target.value })
                  }
                  placeholder="10"
                  min="1"
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>
                  <strong>Status</strong>
                </CFormLabel>
                <CFormSelect
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.value === "true" })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </CFormSelect>
              </CCol>
            </CRow>
            <div className="mt-3">
              <CFormLabel>
                <strong>Description *</strong>
              </CFormLabel>
              <CFormTextarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Mô tả gói..."
                rows="3"
              />
            </div>
            <div className="mt-3">
              <CFormCheck
                label="Can Send Verify Request"
                checked={form.canSendVerifyRequest}
                onChange={(e) =>
                  setForm({
                    ...form,
                    canSendVerifyRequest: e.target.checked,
                  })
                }
              />
            </div>

            {/* Prices Section */}
            <div className="mt-4 border-top pt-3">
              <h5>Prices</h5>
              <CRow>
                <CCol md={3}>
                  <CFormLabel>Price (VND) *</CFormLabel>
                  <CFormInput
                    type="number"
                    value={priceForm.price}
                    onChange={(e) =>
                      setPriceForm({ ...priceForm, price: e.target.value })
                    }
                    placeholder="200000"
                    min="0"
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Duration (Days) *</CFormLabel>
                  <CFormInput
                    type="number"
                    value={priceForm.durationByDay}
                    onChange={(e) =>
                      setPriceForm({
                        ...priceForm,
                        durationByDay: e.target.value,
                      })
                    }
                    placeholder="30"
                    min="1"
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Discount (%)</CFormLabel>
                  <CFormInput
                    type="number"
                    value={priceForm.discountPercent}
                    onChange={(e) =>
                      setPriceForm({
                        ...priceForm,
                        discountPercent: e.target.value,
                      })
                    }
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Currency</CFormLabel>
                  <CFormSelect
                    value={priceForm.currency}
                    onChange={(e) =>
                      setPriceForm({ ...priceForm, currency: e.target.value })
                    }
                  >
                    <option value="VND">VND</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2} className="d-flex align-items-end">
                  <CButton
                    color="primary"
                    onClick={handleAddPrice}
                    className="w-100"
                  >
                    Thêm
                  </CButton>
                </CCol>
              </CRow>

              {/* Prices List */}
              {form.prices.length > 0 && (
                <div className="mt-3">
                  <h6>Danh sách Prices:</h6>
                  <CTable hover size="sm">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Price</CTableHeaderCell>
                        <CTableHeaderCell>Duration</CTableHeaderCell>
                        <CTableHeaderCell>Discount</CTableHeaderCell>
                        <CTableHeaderCell>Currency</CTableHeaderCell>
                        <CTableHeaderCell>Action</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {form.prices.map((price, index) => (
                        <CTableRow key={index}>
                          <CTableDataCell>
                            {formatCurrency(price.price)}
                          </CTableDataCell>
                          <CTableDataCell>{price.durationByDay} days</CTableDataCell>
                          <CTableDataCell>{price.discountPercent}%</CTableDataCell>
                          <CTableDataCell>{price.currency}</CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              color="danger"
                              size="sm"
                              onClick={() => handleRemovePrice(index)}
                            >
                              <Trash2 size={14} />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowCreateModal(false)}
            disabled={saving}
          >
            Hủy
          </CButton>
          <CButton color="primary" onClick={handleCreatePackage} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Đang tạo...
              </>
            ) : (
              "Tạo mới"
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Package Modal */}
      <CModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        backdrop="static"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Cập nhật Subscription Package</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loadingDetail ? (
            <div className="text-center p-5">
              <CSpinner color="primary" />
              <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <CForm>
              <CRow>
                <CCol md={6}>
                  <CFormLabel>
                    <strong>Name *</strong>
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Premium Plan"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>
                    <strong>Max Product *</strong>
                  </CFormLabel>
                  <CFormInput
                    type="number"
                    value={form.maxProduct}
                    onChange={(e) =>
                      setForm({ ...form, maxProduct: e.target.value })
                    }
                    placeholder="200"
                    min="1"
                  />
                </CCol>
              </CRow>
              <CRow className="mt-3">
                <CCol md={6}>
                  <CFormLabel>
                    <strong>Max Img/Post *</strong>
                  </CFormLabel>
                  <CFormInput
                    type="number"
                    value={form.maxImgPerPost}
                    onChange={(e) =>
                      setForm({ ...form, maxImgPerPost: e.target.value })
                    }
                    placeholder="10"
                    min="1"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>
                    <strong>Status</strong>
                  </CFormLabel>
                  <CFormSelect
                    value={form.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.value === "true" })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </CFormSelect>
                </CCol>
              </CRow>
              <div className="mt-3">
                <CFormLabel>
                  <strong>Description *</strong>
                </CFormLabel>
                <CFormTextarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Mô tả gói..."
                  rows="3"
                />
              </div>
              <div className="mt-3">
                <CFormCheck
                  label="Can Send Verify Request"
                  checked={form.canSendVerifyRequest}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      canSendVerifyRequest: e.target.checked,
                    })
                  }
                />
              </div>

              {/* Prices Section */}
              <div className="mt-4 border-top pt-3">
                <h5>Combo Pricing</h5>
                <div className="alert alert-info small">
                  <strong>Lưu ý:</strong> Prices có id sẽ được update, prices không có id sẽ được tạo mới, prices hiện có không có trong danh sách sẽ bị xóa (soft delete).
                </div>

                {/* Select combo to edit */}
                {form.prices && form.prices.length > 0 && (
                  <div className="mb-4">
                    <CFormLabel>
                      <strong>Chọn combo để chỉnh sửa:</strong>
                    </CFormLabel>
                    <CFormSelect
                      value={selectedEditPriceId || ""}
                      onChange={(e) => handleSelectPriceToEdit(e.target.value)}
                      className="combo-select"
                    >
                      {(() => {
                        const sortedPrices = [...form.prices].sort((a, b) => 
                          (a.durationByDay || 0) - (b.durationByDay || 0)
                        );
                        return sortedPrices.map((price) => {
                          return (
                            <option key={price.id || `new-${price.durationByDay}`} value={price.id || `new-${price.durationByDay}`}>
                              {price.id ? `Combo ${formatDuration(price.durationByDay)} - ${formatCurrency(price.price)}` : `[Mới] Combo ${formatDuration(price.durationByDay)} - ${formatCurrency(price.price)}`}
                            </option>
                          );
                        });
                      })()}
                    </CFormSelect>
                  </div>
                )}

                {/* Edit selected price */}
                {editingPrice && selectedEditPriceId && (
                  <div className="mb-4 p-3 border rounded bg-light">
                    <h6 className="mb-3">Chỉnh sửa Combo {formatDuration(editingPrice.durationByDay)}</h6>
                    <CRow>
                      <CCol md={12} className="mb-3">
                        <CFormLabel>Price (VND) *</CFormLabel>
                        <CFormInput
                          type="number"
                          value={editingPrice.price || ""}
                          onChange={(e) =>
                            setEditingPrice({ ...editingPrice, price: parseInt(e.target.value) || 0 })
                          }
                          placeholder="200000"
                          min="0"
                        />
                      </CCol>
                      <CCol md={12} className="mb-3">
                        <CFormLabel>Duration (Days) *</CFormLabel>
                        <CFormInput
                          type="number"
                          value={editingPrice.durationByDay || ""}
                          onChange={(e) =>
                            setEditingPrice({
                              ...editingPrice,
                              durationByDay: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="30"
                          min="1"
                        />
                      </CCol>
                      <CCol md={12} className="mb-3">
                        <CFormLabel>Discount (%)</CFormLabel>
                        <CFormInput
                          type="number"
                          value={editingPrice.discountPercent || 0}
                          onChange={(e) =>
                            setEditingPrice({
                              ...editingPrice,
                              discountPercent: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      </CCol>
                    </CRow>
                    <div className="mt-3">
                      <CButton
                        color="success"
                        onClick={handleUpdateSelectedPrice}
                        className="me-2"
                      >
                        <Save size={14} className="me-1" />
                        Lưu thay đổi combo này
                      </CButton>
                      <CButton
                        color="secondary"
                        variant="outline"
                        onClick={() => {
                          const originalPrice = form.prices.find((p) => p.id === selectedEditPriceId);
                          if (originalPrice) {
                            setEditingPrice({ ...originalPrice });
                          }
                        }}
                      >
                        Hủy
                      </CButton>
                    </div>
                  </div>
                )}

                {/* Add new price */}
                <div className="mt-4 border-top pt-3">
                  <h6>Thêm combo mới:</h6>
                  <CRow>
                    <CCol md={12} className="mb-3">
                      <CFormLabel>Price (VND) *</CFormLabel>
                      <CFormInput
                        type="number"
                        value={priceForm.price}
                        onChange={(e) =>
                          setPriceForm({ ...priceForm, price: e.target.value })
                        }
                        placeholder="200000"
                        min="0"
                      />
                    </CCol>
                    <CCol md={12} className="mb-3">
                      <CFormLabel>Duration (Days) *</CFormLabel>
                      <CFormInput
                        type="number"
                        value={priceForm.durationByDay}
                        onChange={(e) =>
                          setPriceForm({
                            ...priceForm,
                            durationByDay: e.target.value,
                          })
                        }
                        placeholder="30"
                        min="1"
                      />
                    </CCol>
                    <CCol md={12} className="mb-3">
                      <CFormLabel>Discount (%)</CFormLabel>
                      <CFormInput
                        type="number"
                        value={priceForm.discountPercent}
                        onChange={(e) =>
                          setPriceForm({
                            ...priceForm,
                            discountPercent: e.target.value,
                          })
                        }
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </CCol>
                    <CCol md={12} className="mb-3">
                      <CFormLabel>Currency</CFormLabel>
                      <CFormSelect
                        value={priceForm.currency}
                        onChange={(e) =>
                          setPriceForm({ ...priceForm, currency: e.target.value })
                        }
                      >
                        <option value="VND">VND</option>
                      </CFormSelect>
                    </CCol>
                    <CCol md={12} className="mb-3">
                      <CButton
                        color="primary"
                        onClick={handleAddPrice}
                        className="w-100"
                      >
                        Thêm
                      </CButton>
                    </CCol>
                  </CRow>
                </div>

                {/* Prices List */}
                {form.prices.length > 0 && (
                  <div className="mt-3">
                    <h6>Danh sách tất cả Combo:</h6>
                    <CTable hover size="sm">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>ID</CTableHeaderCell>
                          <CTableHeaderCell>Thời hạn</CTableHeaderCell>
                          <CTableHeaderCell>Price</CTableHeaderCell>
                          <CTableHeaderCell>Giá/tháng</CTableHeaderCell>
                          <CTableHeaderCell>Discount</CTableHeaderCell>
                          <CTableHeaderCell>Currency</CTableHeaderCell>
                          <CTableHeaderCell>Action</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {form.prices.map((price, index) => {
                          const pricePerMonth = calculatePricePerMonth(price.price, price.durationByDay);
                          return (
                            <CTableRow key={index}>
                              <CTableDataCell>
                                {price.id ? price.id : <span className="text-muted">New</span>}
                              </CTableDataCell>
                              <CTableDataCell>
                                {formatDuration(price.durationByDay)}
                                <br />
                                <small className="text-muted">({price.durationByDay} ngày)</small>
                              </CTableDataCell>
                              <CTableDataCell>
                                <strong>{formatCurrency(price.price)}</strong>
                              </CTableDataCell>
                              <CTableDataCell>
                                {formatCurrency(pricePerMonth)}/tháng
                              </CTableDataCell>
                              <CTableDataCell>{price.discountPercent || 0}%</CTableDataCell>
                              <CTableDataCell>{price.currency}</CTableDataCell>
                              <CTableDataCell>
                                <CButton
                                  color="danger"
                                  size="sm"
                                  onClick={() => handleRemovePrice(index)}
                                >
                                  <Trash2 size={14} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })}
                      </CTableBody>
                    </CTable>
                  </div>
                )}
              </div>
            </CForm>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={saving || loadingDetail}
          >
            Hủy
          </CButton>
          <CButton
            color="primary"
            onClick={handleUpdatePackage}
            disabled={saving || loadingDetail}
          >
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Đang cập nhật...
              </>
            ) : (
              "Cập nhật"
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Detail Package Modal */}
      <CModal
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPriceId(null);
        }}
        size="xl"
        className="combo-detail-modal"
      >
        <CModalHeader>
          <CModalTitle>Chi tiết Subscription Package</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loadingDetail ? (
            <div className="text-center p-5">
              <CSpinner color="primary" />
              <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : selectedPackage ? (
            <div>
              <CRow className="mb-3">
                <CCol md={6}>
                  <strong>ID:</strong> {selectedPackage.id}
                </CCol>
                <CCol md={6}>
                  <strong>Name:</strong> {selectedPackage.name}
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol md={12}>
                  <strong>Description:</strong>
                  <p className="mt-1">{selectedPackage.description}</p>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol md={4}>
                  <strong>Max Product:</strong> {selectedPackage.maxProduct}
                </CCol>
                <CCol md={4}>
                  <strong>Max Img/Post:</strong> {selectedPackage.maxImgPerPost}
                </CCol>
                <CCol md={4}>
                  <strong>Status:</strong> {getStatusBadge(selectedPackage.isActive)}
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol md={12}>
                  <strong>Can Send Verify Request:</strong>{" "}
                  {selectedPackage.canSendVerifyRequest ? (
                    <CBadge color="info">Yes</CBadge>
                  ) : (
                    <CBadge color="secondary">No</CBadge>
                  )}
                </CCol>
              </CRow>
              {selectedPackage.prices && selectedPackage.prices.length > 0 && (
                <div className="mt-4">
                  <div className="mb-4">
                    <CFormLabel>
                      <strong>Chọn combo để xem chi tiết:</strong>
                    </CFormLabel>
                    <CFormSelect
                      value={selectedPriceId || ""}
                      onChange={(e) => setSelectedPriceId(parseInt(e.target.value))}
                      className="combo-select"
                    >
                      {(() => {
                        const sortedPrices = [...selectedPackage.prices].sort((a, b) => 
                          (a.durationByDay || 0) - (b.durationByDay || 0)
                        );
                        return sortedPrices.map((price) => {
                          const pricePerMonth = calculatePricePerMonth(price.price, price.durationByDay);
                          return (
                            <option key={price.id} value={price.id}>
                              Combo {formatDuration(price.durationByDay)} - {formatCurrency(price.price)} ({formatCurrency(pricePerMonth)}/tháng)
                              {price.discountPercent > 0 && ` - Giảm ${price.discountPercent}%`}
                            </option>
                          );
                        });
                      })()}
                    </CFormSelect>
                  </div>

                  {selectedPriceId && (() => {
                    // Tìm price được chọn
                    const selectedPrice = selectedPackage.prices.find(p => p.id === selectedPriceId);
                    if (!selectedPrice) return null;

                    // Sắp xếp prices để tìm base price
                    const sortedPrices = [...selectedPackage.prices].sort((a, b) => 
                      (a.durationByDay || 0) - (b.durationByDay || 0)
                    );
                    
                    // Tìm giá 1 tháng làm base để tính tiết kiệm
                    const oneMonthPrice = sortedPrices.find(
                      (p) => p.durationByDay === 30
                    )?.price;
                    const basePricePerMonth = oneMonthPrice || 
                      calculatePricePerMonth(sortedPrices[0]?.price, sortedPrices[0]?.durationByDay);

                    const price = selectedPrice;
                    const pricePerMonth = calculatePricePerMonth(price.price, price.durationByDay);
                    const savings = calculateSavings(price.price, price.durationByDay, basePricePerMonth);
                    const hasDiscount = price.discountPercent > 0 || (savings && savings > 0);
                    const months = Math.floor(price.durationByDay / 30);

                    // Tạo mô tả chi tiết cho combo
                    const getComboDescription = () => {
                      if (months === 1) {
                        return "Gói đăng ký 1 tháng - Phù hợp để trải nghiệm dịch vụ";
                      } else if (months === 3) {
                        return "Combo 3 tháng - Tiết kiệm hơn so với mua từng tháng. Phù hợp cho người dùng thường xuyên.";
                      } else if (months === 6) {
                        return "Combo 6 tháng - Tiết kiệm đáng kể. Lý tưởng cho doanh nghiệp vừa và nhỏ.";
                      } else if (months === 9) {
                        return "Combo 9 tháng - Tiết kiệm tối đa. Phù hợp cho doanh nghiệp lớn với nhu cầu ổn định lâu dài.";
                      } else if (months >= 12) {
                        return `Combo ${months} tháng - Gói dài hạn với mức giá ưu đãi nhất. Phù hợp cho doanh nghiệp có kế hoạch dài hạn.`;
                      } else {
                        return `Combo ${formatDuration(price.durationByDay)} - Gói đăng ký với thời hạn linh hoạt.`;
                      }
                    };

                    return (
                      <CRow>
                        <CCol md={12}>
                          <div 
                            className={`combo-card card ${hasDiscount ? 'combo-card-featured' : 'combo-card-standard'}`}
                          >
                            {hasDiscount && (
                              <div className="combo-badge-ribbon">
                                <span>ƯU ĐÃI</span>
                              </div>
                            )}
                            <div className={`card-header combo-header ${hasDiscount ? 'combo-header-featured' : 'combo-header-standard'}`}>
                              <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                  Combo {formatDuration(price.durationByDay)}
                                </h5>
                                {price.discountPercent > 0 && (
                                  <CBadge className="combo-discount-badge">
                                    -{price.discountPercent}%
                                  </CBadge>
                                )}
                              </div>
                            </div>
                            <div className="card-body combo-body">
                              <div className="combo-price-section text-center mb-4">
                                <div className="combo-main-price">
                                  {formatCurrency(price.price)}
                                </div>
                                <div className="combo-price-per-month">
                                  {formatCurrency(pricePerMonth)}/tháng
                                </div>
                              </div>

                              {savings && savings > 0 && (
                                <div className="combo-savings-box mb-3">
                                  <div className="combo-savings-icon">💰</div>
                                  <div className="combo-savings-content">
                                    <div className="combo-savings-title">Tiết kiệm</div>
                                    <div className="combo-savings-amount">
                                      {formatCurrency(savings)}
                                    </div>
                                    <div className="combo-savings-subtitle">
                                      so với mua {months} tháng riêng lẻ
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="combo-description mb-3">
                                <p className="mb-0">
                                  {getComboDescription()}
                                </p>
                              </div>

                              <div className="combo-details">
                                <div className="combo-detail-item">
                                  <span className="combo-detail-label">Thời hạn:</span>
                                  <span className="combo-detail-value">{price.durationByDay} ngày</span>
                                </div>
                                <div className="combo-detail-item">
                                  <span className="combo-detail-label">ID:</span>
                                  <span className="combo-detail-value">#{price.id}</span>
                                </div>
                                <div className="combo-detail-item">
                                  <span className="combo-detail-label">Status:</span>
                                  <span className="combo-detail-value">
                                    {getStatusBadge(price.isActive !== undefined ? price.isActive : true)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CCol>
                      </CRow>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted">Không có dữ liệu.</p>
          )}
        </CModalBody>
      </CModal>
    </div>
  );
}

