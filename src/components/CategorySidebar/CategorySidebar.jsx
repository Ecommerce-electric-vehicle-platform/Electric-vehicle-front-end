import { useState } from "react"
import { ChevronRight, Car, Bike, Battery, Zap } from "lucide-react"
import "./CategorySidebar.css"

export function CategorySidebar() {
    const [activeCategory, setActiveCategory] = useState(null)
    const [hoveredCategory, setHoveredCategory] = useState(null)

    // Dữ liệu danh mục sản phẩm
    const categories = [
        {
            id: 'electric-motorcycles',
            name: 'Xe máy điện',
            icon: Car,
            brands: ['Honda', 'Yamaha', 'VinFast', 'Pega', 'Detech', 'Gogoro'],
            types: ['Xe máy điện phổ thông', 'Xe máy điện thể thao', 'Xe máy điện cao cấp', 'Xe máy điện mini']
        },
        {
            id: 'electric-bikes',
            name: 'Xe đạp điện',
            icon: Bike,
            brands: ['Giant', 'Trek', 'Specialized', 'Cannondale', 'Merida', 'Scott'],
            types: ['Xe đạp điện thành phố', 'Xe đạp điện leo núi', 'Xe đạp điện gấp', 'Xe đạp điện trẻ em']
        },
        {
            id: 'batteries',
            name: 'Pin đã qua sử dụng',
            icon: Battery,
            brands: ['Samsung', 'LG', 'Panasonic', 'BYD', 'CATL', 'Tesla'],
            types: ['Pin Li-ion', 'Pin Li-Po', 'Pin LiFePO4', 'Pin NiMH', 'Pin Lead-acid']
        }
    ]

    const handleCategoryClick = (categoryId) => {
        setActiveCategory(activeCategory === categoryId ? null : categoryId)
    }

    const handleCategoryHover = (categoryId) => {
        setHoveredCategory(categoryId)
    }

    const handleCategoryLeave = () => {
        setHoveredCategory(null)
    }

    // Xử lý click nút Sản phẩm
    const handleProductsClick = () => {
        // Scroll đến phần sản phẩm
        const productsSection = document.getElementById('products-section')
        if (productsSection) {
            productsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        }
    }

    // Xử lý click nút Hãng
    const handleBrandsClick = () => {
        // Có thể mở modal hoặc chuyển đến trang brands
        console.log('Brands clicked - có thể mở modal hoặc chuyển trang')
    }

    return (
        <div className="category-sidebar">
            <div className="category-header">
                <Zap className="category-header-icon" />
                <h3 className="category-title">Danh mục sản phẩm</h3>
            </div>

            <div className="category-list">
                {categories.map((category) => {
                    const IconComponent = category.icon
                    const isActive = activeCategory === category.id
                    const isHovered = hoveredCategory === category.id

                    return (
                        <div
                            key={category.id}
                            className={`category-item ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                            onClick={() => handleCategoryClick(category.id)}
                            onMouseEnter={() => handleCategoryHover(category.id)}
                            onMouseLeave={handleCategoryLeave}
                        >
                            <div className="category-main">
                                <div className="category-icon">
                                    <IconComponent />
                                </div>
                                <span className="category-name">{category.name}</span>
                                <ChevronRight className={`category-arrow ${isActive ? 'rotated' : ''}`} />
                            </div>

                            {isActive && (
                                <div className="category-details">
                                    <div className="category-section">
                                        <h4 className="section-title">Hãng xe/Pin</h4>
                                        <div className="brand-list">
                                            {category.brands.map((brand, index) => (
                                                <span key={index} className="brand-tag">
                                                    {brand}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="category-section">
                                        <h4 className="section-title">Loại sản phẩm</h4>
                                        <div className="type-list">
                                            {category.types.map((type, index) => (
                                                <span key={index} className="type-tag">
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
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
