import React, { useState, useEffect, useCallback } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CFormInput,
  CFormLabel,
  CAlert,
  CSpinner,
  CRow,
  CCol,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CPagination,
  CPaginationItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormSelect,
  CBadge,
} from "@coreui/react";
import {
  updateSystemConfig,
  getAllSystemConfigs,
  updateBadWords,
  updateWhitelistWords,
  refreshBadWordsCache,
} from "../../../api/adminApi";
import { Save, RefreshCw, Edit, Plus, Trash2, Shield } from "lucide-react";
import "./SystemConfig.css";

export default function SystemConfig() {
  // States cho tabs
  const [activeTab, setActiveTab] = useState("systemConfig");

  // States cho danh sách configs
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchKey, setSearchKey] = useState("");

  // States cho modal edit config
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [configValue, setConfigValue] = useState("");
  const [inputType, setInputType] = useState("seconds"); // "seconds", "hoursMinutes", "datetime"
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [datetimeValue, setDatetimeValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // States cho Bad Words Management
  const [badWords, setBadWords] = useState([]);
  const [badWordsLoading, setBadWordsLoading] = useState(false);
  const [newBadWord, setNewBadWord] = useState("");
  const [badWordsError, setBadWordsError] = useState("");
  const [badWordsSuccess, setBadWordsSuccess] = useState("");
  const [savingBadWords, setSavingBadWords] = useState(false);
  const [refreshingCache, setRefreshingCache] = useState(false);

  // States cho Whitelist Management
  const [whitelistWords, setWhitelistWords] = useState([]);
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [newWhitelistWord, setNewWhitelistWord] = useState("");
  const [whitelistError, setWhitelistError] = useState("");
  const [whitelistSuccess, setWhitelistSuccess] = useState("");
  const [savingWhitelist, setSavingWhitelist] = useState(false);

  // Kiểm tra quyền Super Admin - kiểm tra cả adminRole và adminProfile
  useEffect(() => {
    const checkSuperAdmin = () => {
      try {
        // Cách 1: Kiểm tra từ adminRole
        const adminRole = localStorage.getItem("adminRole");
        if (adminRole === "SUPER_ADMIN") {
          setIsSuperAdmin(true);
          return;
        }

        // Cách 2: Kiểm tra từ adminProfile
        const adminProfileStr = localStorage.getItem("adminProfile");
        if (adminProfileStr) {
          const adminProfile = JSON.parse(adminProfileStr);
          const isSuper = adminProfile?.isSuperAdmin === true || 
                         adminProfile?.superAdmin === true || 
                         adminProfile?.is_super_admin === true;
          if (isSuper) {
            setIsSuperAdmin(true);
            return;
          }
        }

        // Mặc định là false
        setIsSuperAdmin(false);
      } catch (err) {
        console.error("Error checking Super Admin:", err);
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();

    // Lắng nghe sự kiện khi adminProfile thay đổi
    const handleStorageChange = () => {
      checkSuperAdmin();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStatusChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStatusChanged", handleStorageChange);
    };
  }, []);

  // Load danh sách configs
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const response = await getAllSystemConfigs(page, size);
      
      // Xử lý response theo cấu trúc pagination
      const responseData = response?.data?.data || response?.data || response;
      const content = responseData?.content || responseData?.list || [];
      const totalPagesData = responseData?.totalPages || 0;
      const totalElementsData = responseData?.totalElements || responseData?.total || 0;

      setConfigs(Array.isArray(content) ? content : []);
      setTotalPages(totalPagesData);
      setTotalElements(totalElementsData);
    } catch (err) {
      console.error("Lỗi khi load danh sách cấu hình:", err);
      
      let errorMessage = "Không thể tải danh sách cấu hình. Vui lòng thử lại.";
      
      if (err?.response?.status === 500) {
        errorMessage = "Lỗi server: Backend không thể xử lý yêu cầu.";
      } else if (err?.response?.status === 404) {
        errorMessage = "Không tìm thấy endpoint API. Vui lòng kiểm tra cấu hình backend.";
      } else if (err?.response?.status === 403) {
        errorMessage = "Không có quyền truy cập. Vui lòng đăng nhập lại.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  // Load danh sách configs khi component mount hoặc page thay đổi
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // Load Bad Words từ system config
  const loadBadWords = async () => {
    try {
      setBadWordsLoading(true);
      setBadWordsError("");
      setBadWordsSuccess("");
      
      // Load từ system config API
      const response = await getAllSystemConfigs(0, 100); // Lấy nhiều records
      const responseData = response?.data?.data || response?.data || {};
      const content = responseData?.content || responseData?.list || [];
      
      // Tìm config có key là "BAD_WORDS"
      const badWordsConfig = content.find(
        (config) => config.configKey === "BAD_WORDS"
      );
      
      if (badWordsConfig && badWordsConfig.configValue) {
        // Parse JSON string thành array
        try {
          const parsedWords = JSON.parse(badWordsConfig.configValue);
          setBadWords(Array.isArray(parsedWords) ? parsedWords : []);
        } catch (parseError) {
          console.error("Lỗi parse JSON bad words:", parseError);
          setBadWords([]);
          setBadWordsError("Dữ liệu bad words không hợp lệ.");
        }
      } else {
        setBadWords([]);
      }
    } catch (err) {
      console.error("Lỗi khi load bad words:", err);
      
      let errorMessage = "Không thể tải danh sách bad words. Vui lòng thử lại.";
      
      if (err?.response?.status === 403) {
        errorMessage = "Chỉ Super Admin mới có thể xem danh sách bad words.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setBadWordsError(errorMessage);
    } finally {
      setBadWordsLoading(false);
    }
  };

  // Load Whitelist Words từ system config
  const loadWhitelistWords = async () => {
    try {
      setWhitelistLoading(true);
      setWhitelistError("");
      setWhitelistSuccess("");
      
      // Load từ system config API
      const response = await getAllSystemConfigs(0, 100); // Lấy nhiều records
      const responseData = response?.data?.data || response?.data || {};
      const content = responseData?.content || responseData?.list || [];
      
      // Tìm config có key là "BAD_WORDS_WHITELIST"
      const whitelistConfig = content.find(
        (config) => config.configKey === "BAD_WORDS_WHITELIST"
      );
      
      if (whitelistConfig && whitelistConfig.configValue) {
        // Parse JSON string thành array
        try {
          const parsedWords = JSON.parse(whitelistConfig.configValue);
          setWhitelistWords(Array.isArray(parsedWords) ? parsedWords : []);
        } catch (parseError) {
          console.error("Lỗi parse JSON whitelist:", parseError);
          setWhitelistWords([]);
          setWhitelistError("Dữ liệu whitelist không hợp lệ.");
        }
      } else {
        setWhitelistWords([]);
      }
    } catch (err) {
      console.error("Lỗi khi load whitelist words:", err);
      
      let errorMessage = "Không thể tải danh sách whitelist. Vui lòng thử lại.";
      
      if (err?.response?.status === 403) {
        errorMessage = "Chỉ Super Admin mới có thể xem danh sách whitelist.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setWhitelistError(errorMessage);
    } finally {
      setWhitelistLoading(false);
    }
  };

  // Load data khi chuyển tab
  useEffect(() => {
    if (activeTab === "badWords" && isSuperAdmin) {
      loadBadWords();
    } else if (activeTab === "whitelist" && isSuperAdmin) {
      loadWhitelistWords();
    }
  }, [activeTab, isSuperAdmin]);

  // Add Bad Word
  const handleAddBadWord = () => {
    if (!newBadWord.trim()) {
      setBadWordsError("Vui lòng nhập từ cần thêm.");
      return;
    }
    
    if (badWords.includes(newBadWord.trim().toLowerCase())) {
      setBadWordsError("Từ này đã tồn tại trong danh sách.");
      return;
    }
    
    setBadWords([...badWords, newBadWord.trim().toLowerCase()]);
    setNewBadWord("");
    setBadWordsError("");
  };

  // Remove Bad Word
  const handleRemoveBadWord = (word) => {
    setBadWords(badWords.filter((w) => w !== word));
  };

  // Save Bad Words
  const handleSaveBadWords = async () => {
    if (!isSuperAdmin) {
      setBadWordsError("Chỉ Super Admin mới có thể cập nhật bad words.");
      return;
    }

    try {
      setSavingBadWords(true);
      setBadWordsError("");
      setBadWordsSuccess("");
      
      await updateBadWords(badWords);
      
      setBadWordsSuccess("Cập nhật danh sách bad words thành công!");
      setTimeout(() => setBadWordsSuccess(""), 5000);
      loadBadWords();
    } catch (err) {
      console.error("Lỗi khi cập nhật bad words:", err);
      
      let errorMessage = "Không thể cập nhật bad words. Vui lòng thử lại.";
      
      if (err?.response?.status === 403) {
        errorMessage = "Chỉ Super Admin mới có thể cập nhật bad words.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setBadWordsError(errorMessage);
    } finally {
      setSavingBadWords(false);
    }
  };

  // Add Whitelist Word
  const handleAddWhitelistWord = () => {
    if (!newWhitelistWord.trim()) {
      setWhitelistError("Vui lòng nhập từ cần thêm.");
      return;
    }
    
    if (whitelistWords.includes(newWhitelistWord.trim().toLowerCase())) {
      setWhitelistError("Từ này đã tồn tại trong danh sách.");
      return;
    }
    
    setWhitelistWords([...whitelistWords, newWhitelistWord.trim().toLowerCase()]);
    setNewWhitelistWord("");
    setWhitelistError("");
  };

  // Remove Whitelist Word
  const handleRemoveWhitelistWord = (word) => {
    setWhitelistWords(whitelistWords.filter((w) => w !== word));
  };

  // Save Whitelist Words
  const handleSaveWhitelist = async () => {
    if (!isSuperAdmin) {
      setWhitelistError("Chỉ Super Admin mới có thể cập nhật whitelist.");
      return;
    }

    try {
      setSavingWhitelist(true);
      setWhitelistError("");
      setWhitelistSuccess("");
      
      await updateWhitelistWords(whitelistWords);
      
      setWhitelistSuccess("Cập nhật danh sách whitelist thành công!");
      setTimeout(() => setWhitelistSuccess(""), 5000);
      loadWhitelistWords();
    } catch (err) {
      console.error("Lỗi khi cập nhật whitelist:", err);
      
      let errorMessage = "Không thể cập nhật whitelist. Vui lòng thử lại.";
      
      if (err?.response?.status === 403) {
        errorMessage = "Chỉ Super Admin mới có thể cập nhật whitelist.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setWhitelistError(errorMessage);
    } finally {
      setSavingWhitelist(false);
    }
  };

  // Refresh Bad Words Cache
  const handleRefreshCache = async () => {
    if (!isSuperAdmin) {
      setBadWordsError("Chỉ Super Admin mới có thể làm mới cache.");
      return;
    }

    try {
      setRefreshingCache(true);
      setBadWordsError("");
      setBadWordsSuccess("");
      
      await refreshBadWordsCache();
      
      setBadWordsSuccess("Làm mới cache thành công!");
      setTimeout(() => setBadWordsSuccess(""), 5000);
    } catch (err) {
      console.error("Lỗi khi làm mới cache:", err);
      
      let errorMessage = "Không thể làm mới cache. Vui lòng thử lại.";
      
      if (err?.response?.status === 403) {
        errorMessage = "Chỉ Super Admin mới có thể làm mới cache.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setBadWordsError(errorMessage);
    } finally {
      setRefreshingCache(false);
    }
  };

  // Mở modal edit config
  const handleOpenEditModal = async (config) => {
    if (!isSuperAdmin) {
      alert("Chỉ Super Admin mới có thể cập nhật cấu hình!");
      return;
    }

    setSelectedConfig(config);
    const currentValue = config.configValue || "";
    setConfigValue(currentValue);
    
    // Khởi tạo giá trị cho các loại input
    if (currentValue) {
      const seconds = parseInt(currentValue);
      if (!isNaN(seconds)) {
        // Tính giờ và phút từ giây
        const totalMinutes = Math.floor(seconds / 60);
        setHours(Math.floor(totalMinutes / 60));
        setMinutes(totalMinutes % 60);
      }
    } else {
      setHours(0);
      setMinutes(0);
    }
    
    setInputType("seconds");
    setDatetimeValue("");
    setError("");
    setSuccess("");
    setShowEditModal(true);
  };

  // Đóng modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedConfig(null);
    setConfigValue("");
    setInputType("seconds");
    setHours(0);
    setMinutes(0);
    setDatetimeValue("");
    setError("");
    setSuccess("");
  };

  // Chuyển đổi giờ/phút thành giây
  const convertHoursMinutesToSeconds = (hrs, mins) => {
    return (parseInt(hrs) || 0) * 3600 + (parseInt(mins) || 0) * 60;
  };

  // Chuyển đổi datetime thành giây (từ thời điểm hiện tại)
  const convertDatetimeToSeconds = (datetimeStr) => {
    if (!datetimeStr) return 0;
    try {
      const selectedDate = new Date(datetimeStr);
      const now = new Date();
      const diffMs = selectedDate.getTime() - now.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      return diffSeconds > 0 ? diffSeconds : 0;
    } catch {
      return 0;
    }
  };

  // Lấy giá trị config value dựa trên input type
  const getConfigValueFromInput = () => {
    switch (inputType) {
      case "seconds":
        return configValue;
      case "hoursMinutes":
        return convertHoursMinutesToSeconds(hours, minutes).toString();
      case "datetime":
        return convertDatetimeToSeconds(datetimeValue).toString();
      default:
        return configValue;
    }
  };

  // Lưu cấu hình
  const handleSave = async () => {
    if (!selectedConfig) return;

    // Lấy giá trị dựa trên input type
    const finalValue = getConfigValueFromInput();

    // Validate input
    if (!finalValue || finalValue.trim() === "" || finalValue === "0") {
      setError("Vui lòng nhập giá trị cấu hình hợp lệ.");
      return;
    }

    // Validate theo từng loại input
    if (inputType === "hoursMinutes") {
      if ((!hours || hours <= 0) && (!minutes || minutes <= 0)) {
        setError("Vui lòng nhập ít nhất giờ hoặc phút.");
        return;
      }
    } else if (inputType === "datetime") {
      if (!datetimeValue) {
        setError("Vui lòng chọn ngày giờ.");
        return;
      }
      const seconds = convertDatetimeToSeconds(datetimeValue);
      if (seconds <= 0) {
        setError("Ngày giờ phải sau thời điểm hiện tại.");
        return;
      }
    } else if (inputType === "seconds") {
      const seconds = parseInt(finalValue);
      if (isNaN(seconds) || seconds <= 0) {
        setError("Số giây phải là một số nguyên dương.");
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const response = await updateSystemConfig(selectedConfig.configKey, finalValue);
      
      if (response?.success !== false) {
        setSuccess(`Cập nhật cấu hình ${selectedConfig.configKey} thành công!`);
        setTimeout(() => setSuccess(""), 5000);
        handleCloseEditModal();
        loadConfigs(); // Reload danh sách
      } else {
        setError("Không thể cập nhật cấu hình. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật cấu hình:", err);
      
      let errorMessage = "Không thể cập nhật cấu hình. Vui lòng thử lại.";
      
      if (err?.response?.status === 500) {
        errorMessage = "Lỗi server: Backend không thể xử lý yêu cầu.";
      } else if (err?.response?.status === 404) {
        errorMessage = "Không tìm thấy endpoint API.";
      } else if (err?.response?.status === 403) {
        errorMessage = "Không có quyền cập nhật. Chỉ Super Admin mới có quyền cập nhật cấu hình này.";
      } else if (err?.response?.status === 401) {
        errorMessage = "Không có quyền truy cập. Vui lòng đăng nhập lại.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Xử lý thay đổi trang
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  // Filter configs theo search key và loại bỏ BAD_WORDS, WHITELIST
  const filteredConfigs = configs
    .filter((config) => {
      // Loại bỏ BAD_WORDS và WHITELIST khỏi system config
      const configKey = config.configKey?.toUpperCase() || "";
      if (configKey.includes("BAD_WORDS") || configKey.includes("WHITELIST")) {
        return false;
      }
      
      // Filter theo search key nếu có
      if (searchKey) {
        return config.configKey?.toLowerCase().includes(searchKey.toLowerCase());
      }
      
      return true;
    });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };


  return (
    <div className="system-config-container">
      <CCard className="shadow-sm">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Quản lý Cấu Hình Hệ Thống</h4>
              <p className="text-muted mb-0 small">
                Thiết lập và điều chỉnh các cấu hình chung của hệ thống
              </p>
            </div>
            
            {/* Dropdown Select for Tabs */}
            <div style={{ minWidth: "250px" }}>
              <CFormSelect
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                size="lg"
                style={{
                  borderRadius: "8px",
                  border: "2px solid #e0e0e0",
                  fontSize: "15px",
                  fontWeight: "500",
                  padding: "10px 16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <option value="systemConfig">Cấu hình Ký Quỹ chung</option>
                {isSuperAdmin && (
                  <>
                    <option value="badWords">Từ cấm</option>
                    <option value="whitelist">Từ an toàn</option>
                  </>
                )}
              </CFormSelect>
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          {/* System Config Section */}
          {activeTab === "systemConfig" && (
            <div>
              <div className="d-flex align-items-center mb-3">
                <h5 className="mb-0">Danh sách cấu hình</h5>
                <CButton
                  color="secondary"
                  size="sm"
                  onClick={loadConfigs}
                  disabled={loading}
                  className="refresh-button-with-text button-group-right"
                >
                  <RefreshCw size={16} className="me-1" />
                  Làm mới
                </CButton>
              </div>

              {/* Thông báo lỗi */}
              {error && (
                <CAlert color="danger" dismissible onClose={() => setError("")}>
                  {error}
                </CAlert>
              )}

              {/* Thông báo thành công */}
              {success && (
                <CAlert color="success" dismissible onClose={() => setSuccess("")}>
                  {success}
                </CAlert>
              )}

              {/* Tìm kiếm */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    placeholder="Tìm kiếm theo config key..."
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    className="d-flex align-items-center"
                  />
                </CCol>
              </CRow>

              {loading ? (
                <div className="text-center p-5">
                  <CSpinner color="primary" />
                  <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
                </div>
              ) : filteredConfigs.length === 0 ? (
                <div className="text-center p-5">
                  <p className="text-muted">Không có cấu hình nào.</p>
                </div>
              ) : (
                <>
                  <CTable hover responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Config Key</CTableHeaderCell>
                        <CTableHeaderCell>Config Value</CTableHeaderCell>
                        <CTableHeaderCell>Mô tả</CTableHeaderCell>
                        <CTableHeaderCell>Ngày tạo</CTableHeaderCell>
                        <CTableHeaderCell>Ngày cập nhật</CTableHeaderCell>
                        <CTableHeaderCell>Thao tác</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredConfigs.map((config) => (
                        <CTableRow key={config.configKey || config.id}>
                          <CTableDataCell>
                            <strong>{config.configKey || "-"}</strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            <span className="text-break fw-semibold text-primary">
                              {config.configValue ? `${config.configValue} giây` : "-"}
                            </span>
                          </CTableDataCell>
                          <CTableDataCell>
                            <small className="text-muted">
                              {config.description || "-"}
                            </small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <small>{formatDate(config.createdAt)}</small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <small>{formatDate(config.updatedAt)}</small>
                          </CTableDataCell>
                          <CTableDataCell>
                            {isSuperAdmin ? (
                              <CButton
                                color="primary"
                                size="sm"
                                onClick={() => handleOpenEditModal(config)}
                                className="d-flex align-items-center gap-1"
                              >
                                <Edit size={14} />
                                Chỉnh sửa
                              </CButton>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
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
                    Hiển thị {filteredConfigs.length} / {totalElements} records
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bad Words Management Section */}
          {activeTab === "badWords" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">Quản lý Từ cấm</h5>
                  <p className="text-muted mb-0 small">
                    Danh sách các từ cấm được lọc trong nội dung người dùng
                  </p>
                </div>
                <div className="d-flex gap-2 button-group-right">
                  <CButton
                    color="info"
                    size="sm"
                    onClick={handleRefreshCache}
                    disabled={refreshingCache || !isSuperAdmin}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    {refreshingCache ? (
                      <>
                        <CSpinner size="sm" className="me-1" />
                        Đang làm mới...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="me-1" />
                        Làm mới Cache
                      </>
                    )}
                  </CButton>
                  <CButton
                    color="secondary"
                    size="sm"
                    onClick={loadBadWords}
                    disabled={badWordsLoading}
                    className="refresh-button-with-text"
                  >
                    <RefreshCw size={16} className="me-1" />
                    Làm mới
                  </CButton>
                </div>
              </div>

              {/* Thông báo */}
              {badWordsError && (
                <CAlert color="danger" dismissible onClose={() => setBadWordsError("")}>
                  {badWordsError}
                </CAlert>
              )}
              {badWordsSuccess && (
                <CAlert color="success" dismissible onClose={() => setBadWordsSuccess("")}>
                  {badWordsSuccess}
                </CAlert>
              )}

              {badWordsLoading ? (
                <div className="text-center p-5">
                  <CSpinner color="primary" />
                  <p className="mt-3 text-muted">Đang tải danh sách từ cấm...</p>
                </div>
              ) : (
                <>
                  {/* Add new bad word */}
                  <CRow className="mb-4">
                    <CCol md={8}>
                      <CFormInput
                        type="text"
                        placeholder="Nhập từ cấm mới..."
                        value={newBadWord}
                        onChange={(e) => setNewBadWord(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddBadWord();
                          }
                        }}
                        disabled={!isSuperAdmin}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CButton
                        color="primary"
                        onClick={handleAddBadWord}
                        disabled={!isSuperAdmin}
                        className="w-100"
                      >
                        <Plus size={16} className="me-1" />
                        Thêm từ
                      </CButton>
                    </CCol>
                  </CRow>

                  {/* Bad words list */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Danh sách từ cấm ({badWords.length})</strong>
                      {badWords.length > 0 && (
                        <CButton
                          color="success"
                          size="sm"
                          onClick={handleSaveBadWords}
                          disabled={savingBadWords || !isSuperAdmin}
                          className="save-changes-button"
                        >
                          {savingBadWords ? (
                            <>
                              <CSpinner size="sm" className="me-1" />
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="me-1" />
                              Lưu thay đổi
                            </>
                          )}
                        </CButton>
                      )}
                    </div>
                    <div
                      className="p-3 border rounded"
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      {badWords.length === 0 ? (
                        <p className="text-muted text-center mb-0">
                          Chưa có từ cấm nào.
                        </p>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {badWords.map((word, index) => (
                            <CBadge
                              key={index}
                              color="danger"
                              className="d-flex align-items-center gap-2 p-2"
                              style={{ fontSize: "14px" }}
                            >
                              {word}
                              {isSuperAdmin && (
                                <Trash2
                                  size={14}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleRemoveBadWord(word)}
                                />
                              )}
                            </CBadge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Whitelist Management Section */}
          {activeTab === "whitelist" && (
            <div>
              <div className="d-flex align-items-center mb-3">
                <div>
                  <h5 className="mb-1">Quản lý Từ an toàn</h5>
                  <p className="text-muted mb-0 small">
                    Danh sách các từ an toàn không bị lọc dù có trong từ cấm
                  </p>
                </div>
                <CButton
                  color="secondary"
                  size="sm"
                  onClick={loadWhitelistWords}
                  disabled={whitelistLoading}
                  className="refresh-button-with-text button-group-right"
                >
                  <RefreshCw size={16} className="me-1" />
                  Làm mới
                </CButton>
              </div>

              {/* Thông báo */}
              {whitelistError && (
                <CAlert color="danger" dismissible onClose={() => setWhitelistError("")}>
                  {whitelistError}
                </CAlert>
              )}
              {whitelistSuccess && (
                <CAlert color="success" dismissible onClose={() => setWhitelistSuccess("")}>
                  {whitelistSuccess}
                </CAlert>
              )}

              {whitelistLoading ? (
                <div className="text-center p-5">
                  <CSpinner color="primary" />
                  <p className="mt-3 text-muted">Đang tải danh sách từ an toàn...</p>
                </div>
              ) : (
                <>
                  {/* Add new whitelist word */}
                  <CRow className="mb-4">
                    <CCol md={8}>
                      <CFormInput
                        type="text"
                        placeholder="Nhập từ an toàn mới..."
                        value={newWhitelistWord}
                        onChange={(e) => setNewWhitelistWord(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddWhitelistWord();
                          }
                        }}
                        disabled={!isSuperAdmin}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CButton
                        color="primary"
                        onClick={handleAddWhitelistWord}
                        disabled={!isSuperAdmin}
                        className="w-100"
                      >
                        <Plus size={16} className="me-1" />
                        Thêm từ
                      </CButton>
                    </CCol>
                  </CRow>

                  {/* Whitelist words list */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Danh sách Từ an toàn ({whitelistWords.length})</strong>
                      {whitelistWords.length > 0 && (
                        <CButton
                          color="success"
                          size="sm"
                          onClick={handleSaveWhitelist}
                          disabled={savingWhitelist || !isSuperAdmin}
                          className="save-changes-button"
                        >
                          {savingWhitelist ? (
                            <>
                              <CSpinner size="sm" className="me-1" />
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="me-1" />
                              Lưu thay đổi
                            </>
                          )}
                        </CButton>
                      )}
                    </div>
                    <div
                      className="p-3 border rounded"
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      {whitelistWords.length === 0 ? (
                        <p className="text-muted text-center mb-0">
                          Chưa có từ an toàn nào.
                        </p>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {whitelistWords.map((word, index) => (
                            <CBadge
                              key={index}
                              color="success"
                              className="d-flex align-items-center gap-2 p-2"
                              style={{ fontSize: "14px" }}
                            >
                              {word}
                              {isSuperAdmin && (
                                <Trash2
                                  size={14}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleRemoveWhitelistWord(word)}
                                />
                              )}
                            </CBadge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Modal Edit Config */}
      <CModal
        visible={showEditModal}
        onClose={handleCloseEditModal}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Cập nhật System Config</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedConfig && (
            <div>
              <div className="mb-3">
                <CFormLabel>
                  <strong>Config Key:</strong>
                </CFormLabel>
                <CFormInput
                  type="text"
                  value={selectedConfig.configKey || ""}
                  disabled
                  readOnly
                />
              </div>
              {selectedConfig.description && (
                <div className="mb-3">
                  <CFormLabel>
                    <strong>Mô tả:</strong>
                  </CFormLabel>
                  <div className="p-2 bg-light rounded">
                    <small className="text-muted">{selectedConfig.description}</small>
                  </div>
                </div>
              )}

              {/* Chọn loại input */}
              <div className="mb-3">
                <CFormLabel>
                  <strong>Chọn cách nhập:</strong>
                </CFormLabel>
                <CFormSelect
                  value={inputType}
                  onChange={(e) => {
                    setInputType(e.target.value);
                    setError("");
                  }}
                >
                  <option value="seconds">Nhập giây</option>
                  <option value="hoursMinutes">Nhập giờ/phút</option>
                  <option value="datetime">Chọn ngày giờ</option>
                </CFormSelect>
              </div>

              {/* Input theo loại đã chọn */}
              {inputType === "seconds" && (
                <div className="mb-3">
                  <CFormLabel>
                    <strong>Config Value (giây):</strong>
                  </CFormLabel>
                  <CFormInput
                    type="number"
                    value={configValue}
                    onChange={(e) => {
                      setConfigValue(e.target.value);
                      setError("");
                    }}
                    placeholder="Nhập số giây"
                    min="1"
                    invalid={!!error}
                  />
                  {configValue && !isNaN(parseInt(configValue)) && (
                    <small className="text-muted d-block mt-1">
                      Tương đương: {Math.floor(parseInt(configValue) / 3600)} giờ {Math.floor((parseInt(configValue) % 3600) / 60)} phút ({Math.floor(parseInt(configValue) / 86400)} ngày)
                    </small>
                  )}
                </div>
              )}

              {inputType === "hoursMinutes" && (
                <div className="mb-3">
                  <CRow>
                    <CCol md={6}>
                      <CFormLabel>
                        <strong>Giờ:</strong>
                      </CFormLabel>
                      <CFormInput
                        type="number"
                        value={hours}
                        onChange={(e) => {
                          setHours(e.target.value);
                          setError("");
                        }}
                        placeholder="0"
                        min="0"
                        invalid={!!error}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormLabel>
                        <strong>Phút:</strong>
                      </CFormLabel>
                      <CFormInput
                        type="number"
                        value={minutes}
                        onChange={(e) => {
                          setMinutes(e.target.value);
                          setError("");
                        }}
                        placeholder="0"
                        min="0"
                        max="59"
                        invalid={!!error}
                      />
                    </CCol>
                  </CRow>
                  {(hours || minutes) && (
                    <small className="text-muted d-block mt-2">
                      Tương đương: {convertHoursMinutesToSeconds(hours, minutes).toLocaleString()} giây ({Math.floor(convertHoursMinutesToSeconds(hours, minutes) / 86400)} ngày)
                    </small>
                  )}
                </div>
              )}

              {inputType === "datetime" && (
                <div className="mb-3">
                  <CFormLabel>
                    <strong>Chọn ngày giờ:</strong>
                  </CFormLabel>
                  <CFormInput
                    type="datetime-local"
                    value={datetimeValue}
                    onChange={(e) => {
                      setDatetimeValue(e.target.value);
                      setError("");
                    }}
                    invalid={!!error}
                  />
                  {datetimeValue && (
                    <small className="text-muted d-block mt-2">
                      Tương đương: {convertDatetimeToSeconds(datetimeValue).toLocaleString()} giây từ bây giờ ({Math.floor(convertDatetimeToSeconds(datetimeValue) / 86400)} ngày)
                    </small>
                  )}
                </div>
              )}

              {error && (
                <div className="alert alert-danger d-block mb-3">{error}</div>
              )}

              {/* Hiển thị giá trị hiện tại */}
              <div className="mb-3 p-2 bg-light rounded">
                <small>
                  <strong>Giá trị hiện tại:</strong> {selectedConfig.configValue || "-"} giây
                  {selectedConfig.configValue && !isNaN(parseInt(selectedConfig.configValue)) && (
                    <span className="ms-2">
                      ({Math.floor(parseInt(selectedConfig.configValue) / 86400)} ngày, {Math.floor((parseInt(selectedConfig.configValue) % 86400) / 3600)} giờ, {Math.floor((parseInt(selectedConfig.configValue) % 3600) / 60)} phút)
                    </span>
                  )}
                </small>
              </div>
              <div className="mb-2">
                <small className="text-muted">
                  <strong>Ngày tạo:</strong> {formatDate(selectedConfig.createdAt)}
                </small>
              </div>
              <div className="mb-2">
                <small className="text-muted">
                  <strong>Ngày cập nhật:</strong> {formatDate(selectedConfig.updatedAt)}
                </small>
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={handleCloseEditModal}
            disabled={saving}
          >
            Hủy
          </CButton>
          <CButton
            color="primary"
            onClick={handleSave}
            disabled={saving || !getConfigValueFromInput() || getConfigValueFromInput().trim() === "" || getConfigValueFromInput() === "0"}
          >
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} className="me-2" />
                Lưu
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}

