import { useEffect, useMemo, useState } from "react"
import { Battery, Car, MapPin, Search, ArrowRight, Filter, SortAsc, Zap } from "lucide-react"
import "./VehicleShowcase.css"
import { useNavigate } from "react-router-dom"
import { fetchPostProducts, normalizeProduct } from "../../api/productApi"
import { ProductCard } from "../ProductCard/ProductCard"
import { GlobalSearch } from "../GlobalSearch/GlobalSearch"

export function VehicleShowcase() {
  const [activeTab, setActiveTab] = useState("vehicles")
  const [selectedLocation, setSelectedLocation] = useState("Tất cả khu vực")
  const [sortDate, setSortDate] = useState("newest")
  const [sortPrice, setSortPrice] = useState("none")
  const navigate = useNavigate()

  // Xử lý click xem chi tiết
  const handleViewDetails = (product) => {
    navigate(`/product/${product.postId ?? product.id}`)
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [itemsRaw, setItemsRaw] = useState([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError("")
    fetchPostProducts({ page: 1, size: 24 })
      .then(({ items }) => { if (mounted) setItemsRaw(items || []) })
      .catch((err) => { if (mounted) setError(err?.message || "Không thể tải dữ liệu") })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const items = useMemo(
    () =>
      (itemsRaw || [])
        .map(normalizeProduct)
        .filter(Boolean)
        .filter((p) => !(p?.isSold || String(p?.status).toLowerCase() === "sold")),
    [itemsRaw]
  )
  const allLocations = ["Tất cả khu vực", ...new Set(items.map((i) => i.locationTrading))]

  // ✅ Lọc dữ liệu
  const filteredItems = items
    .filter((item) => {
      const locationMatch = selectedLocation === "Tất cả khu vực" || item.locationTrading === selectedLocation
      return locationMatch
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


        {/* Global Search */}
        <div className="vehicle-search-section">
          <GlobalSearch
            placeholder="Tìm kiếm sản phẩm, thương hiệu, model..."
            className="vehicle-search"
          />
        </div>

        {/* Thanh lọc */}
        <div className="filter-section">
          <div className="filter-bar">

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
          {loading && (<div className="showcase-card" style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>)}
          {error && !loading && (<div className="showcase-card" style={{ padding: '2rem', textAlign: 'center' }}>{error}</div>)}
          {!loading && !error && filteredItems.slice(0, 12).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="default"
              onViewDetails={handleViewDetails}
              showActions={true}
              showCondition={true}
              showLocation={true}
              showDate={true}
              showVerified={true}
            />
          ))}
        </div>

        {/* Nút Xem tất cả */}
        <div className="showcase-footer">
          <button className="btn-view-all" onClick={() => navigate("/products")}>
            <span>Xem tất cả sản phẩm</span>
            <ArrowRight className="btn-arrow" />
          </button>
        </div>

      </div>
    </section>
  )
}
