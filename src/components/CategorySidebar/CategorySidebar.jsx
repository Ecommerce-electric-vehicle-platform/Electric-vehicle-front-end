import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronRight, Car, Bike, Battery, Zap, Loader2 } from "lucide-react"
import "./CategorySidebar.css"
import { analyzeProducts, getDefaultCategoryStructure, buildProductFilterUrl } from "../../utils/productCategories"

export function CategorySidebar({ onClose, isOpen = true }) {
    const navigate = useNavigate()
    const sidebarRef = useRef(null)
    const [activeCategory, setActiveCategory] = useState(null)
    const [hoveredCategory, setHoveredCategory] = useState(null)
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedBrands, setExpandedBrands] = useState(new Set())

    // Fetch và phân tích products khi component mount
    useEffect(() => {
        let mounted = true

        const loadCategories = async () => {
            try {
                setLoading(true)
                const analysis = await analyzeProducts()

                if (!mounted) return

                const { categoryStructure } = analysis

                // Tạo cấu trúc categories với icon
                const categoriesData = [
                    {
                        id: 'electric-motorcycles',
                        name: 'Xe máy điện',
                        icon: Car,
                        brands: categoryStructure['electric-motorcycles']?.brands || [],
                        models: categoryStructure['electric-motorcycles']?.models || [],
                        count: categoryStructure['electric-motorcycles']?.count || 0
                    },
                    {
                        id: 'electric-bikes',
                        name: 'Xe đạp điện',
                        icon: Bike,
                        brands: categoryStructure['electric-bikes']?.brands || [],
                        models: categoryStructure['electric-bikes']?.models || [],
                        count: categoryStructure['electric-bikes']?.count || 0
                    },
                    {
                        id: 'batteries',
                        name: 'Pin đã qua sử dụng',
                        icon: Battery,
                        brands: categoryStructure['batteries']?.brands || [],
                        models: categoryStructure['batteries']?.models || [],
                        count: categoryStructure['batteries']?.count || 0
                    }
                ]

                setCategories(categoriesData)
            } catch (error) {
                console.error('[CategorySidebar] Error loading categories:', error)
                // Fallback về default structure
                if (mounted) {
                    const defaultData = getDefaultCategoryStructure()
                    const categoriesData = [
                        {
                            id: 'electric-motorcycles',
                            name: 'Xe máy điện',
                            icon: Car,
                            brands: defaultData.categoryStructure['electric-motorcycles']?.brands || [],
                            models: [],
                            count: 0
                        },
                        {
                            id: 'electric-bikes',
                            name: 'Xe đạp điện',
                            icon: Bike,
                            brands: defaultData.categoryStructure['electric-bikes']?.brands || [],
                            models: [],
                            count: 0
                        },
                        {
                            id: 'batteries',
                            name: 'Pin đã qua sử dụng',
                            icon: Battery,
                            brands: defaultData.categoryStructure['batteries']?.brands || [],
                            models: [],
                            count: 0
                        }
                    ]
                    setCategories(categoriesData)
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        loadCategories()

        return () => {
            mounted = false
        }
    }, [])

    // Đóng sidebar khi click ra ngoài (nếu có prop onClose và đang mở)
    // Note: Overlay click đã được xử lý bởi Header component, logic này chỉ để backup
    useEffect(() => {
        if (!onClose || !isOpen) return;

        const handleClickOutside = (event) => {
            // Kiểm tra nếu click ra ngoài sidebar element
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                // Đóng tất cả categories trước
                setActiveCategory(null);
                setExpandedBrands(new Set());
                // Đóng sidebar
                onClose();
            }
        };

        // Sử dụng capture phase để bắt sớm hơn overlay handler nếu cần
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('touchstart', handleClickOutside, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('touchstart', handleClickOutside, true);
        };
    }, [onClose, isOpen]);

    const handleCategoryClick = (categoryId) => {
        // Nếu đang active thì đóng lại
        if (activeCategory === categoryId) {
            setActiveCategory(null)
            // Xóa khỏi expandedBrands nếu có
            const newExpanded = new Set(expandedBrands)
            newExpanded.delete(categoryId)
            setExpandedBrands(newExpanded)
        } else {
            // Mở category mới
            setActiveCategory(categoryId)
        }
    }

    const handleCategoryHover = (categoryId) => {
        setHoveredCategory(categoryId)
    }

    const handleCategoryLeave = () => {
        setHoveredCategory(null)
    }

    // Xử lý click vào category - navigate đến trang products với filter
    const handleCategoryNavigate = (categoryId) => {
        const params = buildProductFilterUrl({ category: categoryId })
        navigate(`/products?${params}`)
    }

    // Xử lý click vào brand - navigate đến trang products với API search type=brand
    const handleBrandClick = (categoryId, brand, e) => {
        e.stopPropagation() // Ngăn category click
        const params = buildProductFilterUrl({
            category: categoryId,
            type: 'brand',
            value: brand,
            brand: brand // Giữ để tương thích
        })
        navigate(`/products?${params}`)
    }

    // Xử lý click vào model - navigate đến trang products với API search type=model
    const handleModelClick = (categoryId, brand, model, e) => {
        e.stopPropagation() // Ngăn brand click
        const params = buildProductFilterUrl({
            category: categoryId,
            type: 'model',
            value: model,
            brand: brand, // Giữ để tương thích
            model: model // Giữ để tương thích
        })
        navigate(`/products?${params}`)
    }

    // Xử lý click nút Sản phẩm
    const handleProductsClick = () => {
        navigate('/products')
    }

    // Xử lý click nút Hãng - hiển thị tất cả brands
    const handleBrandsClick = () => {
        // Toggle expand tất cả brands
        if (expandedBrands.size === categories.length) {
            setExpandedBrands(new Set())
        } else {
            setExpandedBrands(new Set(categories.map(c => c.id)))
        }
    }

    if (loading) {
        return (
            <div className="category-sidebar">
                <div className="category-header">
                    <Zap className="category-header-icon" />
                    <h3 className="category-title">Danh mục sản phẩm</h3>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    color: '#6b7280'
                }}>
                    <Loader2 className="spinning" size={20} style={{ marginRight: '8px' }} />
                    <span>Đang tải danh mục...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="category-sidebar" ref={sidebarRef}>
            <div className="category-header">
                <Zap className="category-header-icon" />
                <h3 className="category-title">Danh mục sản phẩm</h3>
            </div>

            <div className="category-list">
                {categories.map((category) => {
                    const IconComponent = category.icon
                    const isActive = activeCategory === category.id
                    const isHovered = hoveredCategory === category.id
                    // Chỉ hiển thị expanded khi activeCategory match hoặc có trong expandedBrands
                    const isExpanded = isActive || expandedBrands.has(category.id)

                    return (
                        <div
                            key={category.id}
                            className={`category-item ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                            onMouseEnter={() => handleCategoryHover(category.id)}
                            onMouseLeave={handleCategoryLeave}
                        >
                            <div
                                className="category-main"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleCategoryClick(category.id)
                                }}
                            >
                                <div className="category-icon">
                                    <IconComponent />
                                </div>
                                <span className="category-name">{category.name}</span>
                                {category.count > 0 && (
                                    <span className="category-count" style={{
                                        marginLeft: '8px',
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        fontWeight: 500
                                    }}>
                                        ({category.count})
                                    </span>
                                )}
                                <ChevronRight className={`category-arrow ${isActive ? 'rotated' : ''}`} />
                            </div>

                            {isExpanded && (
                                <div
                                    className="category-details"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {category.brands.length > 0 && (
                                        <div className="category-section">
                                            <h4 className="section-title">Hãng xe/Pin</h4>
                                            <div className="brand-list">
                                                {category.brands.map((brand, index) => (
                                                    <span
                                                        key={index}
                                                        className="brand-tag clickable"
                                                        onClick={(e) => handleBrandClick(category.id, brand, e)}
                                                        title={`Xem sản phẩm ${brand}`}
                                                    >
                                                        {brand}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {category.models.length > 0 && (
                                        <div className="category-section">
                                            <h4 className="section-title">Dòng xe</h4>
                                            <div className="type-list">
                                                {category.models.slice(0, 10).map((model, index) => {
                                                    // Tìm brand tương ứng với model (nếu có)
                                                    const brand = category.brands.find(b =>
                                                        model.toLowerCase().includes(b.toLowerCase()) ||
                                                        b.toLowerCase().includes(model.toLowerCase())
                                                    ) || category.brands[0]

                                                    return (
                                                        <span
                                                            key={index}
                                                            className="type-tag clickable"
                                                            onClick={(e) => brand && handleModelClick(category.id, brand, model, e)}
                                                            title={`Xem sản phẩm ${model}`}
                                                        >
                                                            {model}
                                                        </span>
                                                    )
                                                })}
                                                {category.models.length > 10 && (
                                                    <span className="type-tag" style={{ opacity: 0.7 }}>
                                                        +{category.models.length - 10} dòng khác
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {category.brands.length === 0 && category.models.length === 0 && (
                                        <div className="category-section">
                                            <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '1rem' }}>
                                                Chưa có sản phẩm trong danh mục này
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="category-footer">
                <div className="category-buttons">
                    <button className="category-btn products-btn" onClick={handleProductsClick}>
                        <span className="btn-text">SẢN</span>
                        <span className="btn-text">PHẨM</span>
                    </button>
                    <button className="category-btn brands-btn" onClick={handleBrandsClick}>
                        <span className="btn-text">HÃNG</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
