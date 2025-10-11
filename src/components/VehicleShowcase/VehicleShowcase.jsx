import { useState } from "react"
import { Battery, Car, MapPin, Gauge, Search, Star, Eye, Heart, ArrowRight, Filter, SortAsc, Zap, Shield } from "lucide-react"
import "./VehicleShowcase.css"
import { useNavigate } from "react-router-dom"

// 🏍 ẢNH XE ĐIỆN
import xe1 from "../../assets/imgs_old/1.jpg"
import xe2 from "../../assets/imgs_old/2.jpg"
import xe3 from "../../assets/imgs_old/3.jpg"
import xe4 from "../../assets/imgs_old/4.jpg"
import xe5 from "../../assets/imgs_old/5.jpg"
import xe6 from "../../assets/imgs_old/6.jpg"
import xe7 from "../../assets/imgs_old/7.jpg"
import xe8 from "../../assets/imgs_old/8.webp"
import xe9 from "../../assets/imgs_old/9.jpg"
import xe10 from "../../assets/imgs_old/10.webp"

// 🔋 ẢNH PIN XE ĐIỆN
import pin1 from "../../assets/imgs_pin/Cell-pin-Lipo-1.jpg"
import pin2 from "../../assets/imgs_pin/Cell-Pin-lithium-polymer-3.7V-8000mah-50C-600x600.jpg"
import pin3 from "../../assets/imgs_pin/Cell-pin-polymer-3.7V-45Ah-600x600.jpg"
import pin4 from "../../assets/imgs_pin/Dong-pin-xe-dap-dien-theo-yeu-cau-scaled-600x600.jpg"
import pin5 from "../../assets/imgs_pin/Pin-xe-dap-dien-Bridgestone-36V-10Ah-600x600.jpg"
import pin6 from "../../assets/imgs_pin/Pin-xe-dap-dien-Hitasa-600x600.jpg"

import placeholder from "../../assets/imgs/placeholder.svg"

export function VehicleShowcase() {
  const [activeTab, setActiveTab] = useState("vehicles")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("Tất cả khu vực")
  const [sortDate, setSortDate] = useState("newest")
  const [sortPrice, setSortPrice] = useState("none")

  const navigate = useNavigate()

  // ✅ DỮ LIỆU XE ĐIỆN (chỉ sản phẩm có sẵn)
  const vehicles = [
    {
      name: "VinFast Feliz S",
      year: 2024,
      price: 20800000,
      originalPrice: 23100000,
      range: "200 km",
      battery: "Lithium-ion",
      location: "TP.HCM",
      image: xe1,
      featured: true,
      createdAt: "2025-10-08",
      rating: 4.8,
      reviews: 24,
      mileage: "5,000 km"
    },
    {
      name: "YADEA Xmen Neo",
      year: 2023,
      price: 19000000,
      originalPrice: 20600000,
      range: "120 km",
      battery: "Lithium 60V",
      location: "Hà Nội",
      image: xe2,
      createdAt: "2025-10-07",
      rating: 4.6,
      reviews: 18,
      mileage: "8,500 km"
    },
    {
      name: "Giant M133S",
      year: 2023,
      price: 16500000,
      originalPrice: 17500000,
      range: "90 km",
      battery: "Ắc quy 60V",
      location: "Đà Nẵng",
      image: xe3,
      createdAt: "2025-10-06",
      rating: 4.7,
      reviews: 31,
      mileage: "3,200 km"
    },
    {
      name: "Dibao Gogo SS",
      year: 2022,
      price: 17800000,
      originalPrice: 19800000,
      range: "100 km",
      battery: "Lithium-ion",
      location: "Cần Thơ",
      image: xe4,
      createdAt: "2025-10-03",
      rating: 4.5,
      reviews: 15,
      mileage: "12,000 km"
    },
    {
      name: "VinFast Evo200",
      year: 2024,
      price: 22000000,
      originalPrice: 24400000,
      range: "203 km",
      battery: "Lithium 70V",
      location: "Hải Phòng",
      image: xe5,
      createdAt: "2025-09-30",
      rating: 4.9,
      reviews: 42,
      mileage: "2,100 km"
    },
    {
      name: "Pega Aura",
      year: 2023,
      price: 18500000,
      originalPrice: 20500000,
      range: "150 km",
      battery: "Lithium-ion",
      location: "TP.HCM",
      image: xe6,
      createdAt: "2025-09-29",
      rating: 4.7,
      reviews: 28,
      mileage: "6,800 km"
    },
    {
      name: "DK Bike Roma",
      year: 2022,
      price: 15900000,
      originalPrice: 17700000,
      range: "120 km",
      battery: "Ắc quy 60V",
      location: "Huế",
      image: xe7,
      createdAt: "2025-09-28",
      rating: 4.4,
      reviews: 12,
      mileage: "15,500 km"
    },
    {
      name: "Yadea BuyE",
      year: 2024,
      price: 20500000,
      originalPrice: 22800000,
      range: "180 km",
      battery: "Lithium-ion",
      location: "Đà Nẵng",
      image: xe8,
      createdAt: "2025-09-27",
      rating: 4.8,
      reviews: 35,
      mileage: "4,200 km"
    },
    {
      name: "Gogo Elite",
      year: 2022,
      price: 17400000,
      originalPrice: 19300000,
      range: "110 km",
      battery: "Lithium 48V",
      location: "TP.HCM",
      image: xe9,
      createdAt: "2025-09-26",
      rating: 4.3,
      reviews: 19,
      mileage: "18,000 km"
    },
    {
      name: "VinFast Klara A2",
      year: 2024,
      price: 23900000,
      originalPrice: 26600000,
      range: "190 km",
      battery: "Lithium 60V",
      location: "Hà Nội",
      image: xe10,
      createdAt: "2025-09-25",
      rating: 4.9,
      reviews: 48,
      mileage: "1,800 km"
    },
  ]

  // ✅ DỮ LIỆU PIN XE ĐIỆN
  const batteries = [
    { name: "Cell Pin Lipo 3.7V 6000mAh", capacity: "3.7V – 6000mAh", price: 850000, health: "95%", cycles: "420 chu kỳ", location: "TP.HCM", image: pin1, featured: true, createdAt: "2025-10-08" },
    { name: "Cell Pin Lithium 8000mAh", capacity: "3.7V – 8000mAh", price: 920000, health: "93%", cycles: "500 chu kỳ", location: "Đà Nẵng", image: pin2, createdAt: "2025-10-07" },
    { name: "Cell Pin Polymer 45Ah", capacity: "3.7V – 45Ah", price: 1100000, health: "90%", cycles: "380 chu kỳ", location: "Hà Nội", image: pin3, createdAt: "2025-10-06" },
    { name: "Pin Xe Đạp Điện Theo Yêu Cầu", capacity: "48V – 20Ah", price: 1250000, health: "94%", cycles: "440 chu kỳ", location: "Hải Phòng", image: pin4, featured: true, createdAt: "2025-10-05" },
    { name: "Pin Bridgestone 36V 10Ah", capacity: "36V – 10Ah", price: 1050000, health: "89%", cycles: "350 chu kỳ", location: "TP.HCM", image: pin5, createdAt: "2025-10-03" },
    { name: "Pin Hitasa 36V 12Ah", capacity: "36V – 12Ah", price: 1180000, health: "92%", cycles: "400 chu kỳ", location: "Đà Nẵng", image: pin6, createdAt: "2025-10-02" },
  ]

  const items = activeTab === "vehicles" ? vehicles : batteries
  const allLocations = ["Tất cả khu vực", ...new Set(items.map((i) => i.location))]

  // ✅ Lọc dữ liệu
  const filteredItems = items
    .filter((item) => {
      const searchMatch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      const locationMatch = selectedLocation === "Tất cả khu vực" || item.location === selectedLocation
      return searchMatch && locationMatch
    })
    .sort((a, b) => (sortDate === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt)))
    .sort((a, b) => {
      if (sortPrice === "low") return a.price - b.price
      if (sortPrice === "high") return b.price - a.price
      return 0
    })

  // ✅ Format tiền VNĐ
  const formatCurrency = (value) =>
    value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })

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
          {filteredItems.slice(0, 10).map((item, index) => (
            <div key={index} className="showcase-card">
              <div className="card-image-wrapper">
                <img src={item.image || placeholder} alt={item.name} className="card-image" />

                {/* Featured badge */}
                {item.featured && <div className="featured-badge">🌟 Nổi bật</div>}

                {/* Card actions */}
                <div className="card-actions">
                  <button className="action-btn wishlist-btn">
                    <Heart className="action-icon" />
                  </button>
                  <button className="action-btn view-btn">
                    <Eye className="action-icon" />
                  </button>
                </div>
              </div>

              <div className="card-content">
                <div className="card-header">
                  <h3 className="card-title">{item.name}</h3>
                  <div className="card-rating">
                    <Star className="star-icon" />
                    <span className="rating-value">{item.rating}</span>
                    <span className="reviews-count">({item.reviews})</span>
                  </div>
                </div>

                <div className="card-price-section">
                  <div className="price-current">{formatCurrency(item.price)}</div>
                  {item.originalPrice && (
                    <div className="price-original">{formatCurrency(item.originalPrice)}</div>
                  )}
                </div>

                {activeTab === "vehicles" ? (
                  <div className="card-specs">
                    <div className="spec-item">
                      <span className="spec-label">Năm:</span>
                      <span className="spec-value">{item.year}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Km:</span>
                      <span className="spec-value">{item.mileage}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Pin:</span>
                      <span className="spec-value">{item.battery}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Tầm xa:</span>
                      <span className="spec-value">{item.range}</span>
                    </div>
                  </div>
                ) : (
                  <div className="card-specs">
                    <div className="spec-item">
                      <span className="spec-label">Dung lượng:</span>
                      <span className="spec-value">{item.capacity}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Tình trạng:</span>
                      <span className="spec-value">{item.health}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Chu kỳ:</span>
                      <span className="spec-value">{item.cycles}</span>
                    </div>
                  </div>
                )}

                <div className="card-location">
                  <MapPin className="location-icon" />
                  <span>{item.location}</span>
                </div>

                <button className="card-button">
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
