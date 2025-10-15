import { useState } from "react"
import { Battery, Car, MapPin, Search, Eye, Heart, ArrowRight, Filter, SortAsc, Zap } from "lucide-react"
import "./VehicleShowcase.css"
import { useNavigate } from "react-router-dom"
import { vehicleProducts, batteryProducts, formatCurrency } from "../../data/productsData"

import placeholder from "../../assets/imgs/placeholder.svg"

export function VehicleShowcase() {
  const [activeTab, setActiveTab] = useState("vehicles")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("Tất cả khu vực")
  const [sortDate, setSortDate] = useState("newest")
  const [sortPrice, setSortPrice] = useState("none")
  const navigate = useNavigate()

  // Xử lý click xem chi tiết
  const handleViewDetails = (product) => {
    navigate(`/product/${product.id}`)
  }

  const items = activeTab === "vehicles" ? vehicleProducts : batteryProducts
  const allLocations = ["Tất cả khu vực", ...new Set(items.map((i) => i.locationTrading))]

  // ✅ Lọc dữ liệu
  const filteredItems = items
    .filter((item) => {
      const searchMatch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.locationTrading.toLowerCase().includes(searchTerm.toLowerCase())
      const locationMatch = selectedLocation === "Tất cả khu vực" || item.locationTrading === selectedLocation
      return searchMatch && locationMatch
    })
    .sort((a, b) => (sortDate === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt)))
    .sort((a, b) => {
      if (sortPrice === "low") return a.price - b.price
      if (sortPrice === "high") return b.price - a.price
      return 0
    })

  return (
    <section className="vehicle-showcase-section" id="vehicles">
      <div className="vehicle-showcase-container">
        <div className="showcase-header">
          <div className="header-content">
            <div className="header-badge">
              <Zap className="badge-icon" />
              <span>Sản phẩm đa dạng</span>
            </div>
            <h2 className="showcase-title">Sản phẩm nổi bật</h2>
            <p className="showcase-description">
              Khám phá các mẫu xe điện và pin chất lượng cao từ Grand Trade – nơi kết nối người mua và người bán uy tín.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="showcase-tabs">
          <button
            className={`tab-button ${activeTab === "vehicles" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("vehicles")}
          >
            <Car className="tab-icon" />
            <span>Xe điện</span>
          </button>
          <button
            className={`tab-button ${activeTab === "batteries" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("batteries")}
          >
            <Battery className="tab-icon" />
            <span>Pin xe điện</span>
          </button>
        </div>

        {/* Thanh lọc */}
        <div className="filter-section">
          <div className="filter-bar">
            <div className="search-bar">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm hoặc khu vực..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="search-clear" onClick={() => setSearchTerm("")}>Xoá</button>
              )}
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <MapPin className="filter-icon" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="filter-select"
                >
                  {allLocations.map((loc, i) => (
                    <option key={i} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <SortAsc className="filter-icon" />
                <select value={sortDate} onChange={(e) => setSortDate(e.target.value)} className="filter-select">
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>

              <div className="filter-group">
                <Filter className="filter-icon" />
                <select value={sortPrice} onChange={(e) => setSortPrice(e.target.value)} className="filter-select">
                  <option value="none">Sắp xếp theo giá</option>
                  <option value="low">Giá thấp đến cao</option>
                  <option value="high">Giá cao đến thấp</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="showcase-grid">
          {filteredItems.slice(0, 12).map((product, index) => (
            <div key={product.id} className="showcase-card">
              <div className="card-image-wrapper">
                <img src={product.image || placeholder} alt={product.title} className="card-image" />


                {/* Card actions */}
                <div className="card-actions">
                  <button className="action-btn wishlist-btn">
                    <Heart className="action-icon" />
                  </button>
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleViewDetails(product)}
                  >
                    <Eye className="action-icon" />
                  </button>
                </div>
              </div>

              <div className="card-content">
                <div className="card-header">
                  <h3 className="card-title">{product.title}</h3>
                  <p className="card-brand">{product.brand} - {product.model}</p>
                </div>

                <div className="card-price-section">
                  <div className="price-current">{formatCurrency(product.price)}</div>
                  {product.originalPrice && (
                    <div className="price-original">{formatCurrency(product.originalPrice)}</div>
                  )}
                </div>

                <div className="card-location">
                  <MapPin className="location-icon" />
                  <span>{product.locationTrading}</span>
                </div>

                <button
                  className="card-button"
                  onClick={() => handleViewDetails(product)}
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="btn-arrow" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Nút Xem tất cả */}
        <div className="showcase-footer">
          <button className="btn-outline-large" onClick={() => navigate("/products")}>
            <span>Xem tất cả sản phẩm</span>
            <ArrowRight className="btn-arrow" />
          </button>
        </div>

      </div>
    </section>
  )
}
