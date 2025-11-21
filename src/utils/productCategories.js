import { fetchPostProducts } from '../api/productApi';

/**
 * Phân tích tất cả sản phẩm để tạo danh mục động
 */
export async function analyzeProducts() {
    try {
        // Lấy nhiều sản phẩm để phân tích
        const allProducts = [];
        let page = 1;
        let hasMore = true;
        const pageSize = 100;

        while (hasMore && page <= 10) { // Giới hạn 10 trang để tránh quá tải
            const result = await fetchPostProducts({ page, size: pageSize });
            if (result.items && result.items.length > 0) {
                allProducts.push(...result.items);
                hasMore = result.items.length === pageSize;
                page++;
            } else {
                hasMore = false;
            }
        }

        // Phân tích dữ liệu
        const brands = new Set();
        const models = new Set();
        const categories = new Set();
        const batteryTypes = new Set();
        const conditions = new Set();
        const locations = new Set();

        // Map để lưu models theo brand
        const brandModelsMap = new Map();
        // Map để lưu products theo category
        const categoryProductsMap = new Map();

        allProducts.forEach(product => {
            // Brand
            if (product.brand && product.brand.trim()) {
                brands.add(product.brand.trim());
                if (!brandModelsMap.has(product.brand.trim())) {
                    brandModelsMap.set(product.brand.trim(), new Set());
                }
            }

            // Model
            if (product.model && product.model.trim()) {
                models.add(product.model.trim());
                if (product.brand && product.brand.trim()) {
                    brandModelsMap.get(product.brand.trim())?.add(product.model.trim());
                }
            }

            // Category - có thể là string hoặc object
            let categoryValue = product.category;
            if (typeof categoryValue === 'object' && categoryValue !== null) {
                categoryValue = categoryValue.name || categoryValue.id || categoryValue;
            }
            if (categoryValue) {
                categories.add(String(categoryValue).trim());
                if (!categoryProductsMap.has(String(categoryValue).trim())) {
                    categoryProductsMap.set(String(categoryValue).trim(), []);
                }
                categoryProductsMap.get(String(categoryValue).trim()).push(product);
            }

            // Battery Type
            if (product.batteryType && product.batteryType.trim()) {
                batteryTypes.add(product.batteryType.trim());
            }

            // Condition
            if (product.condition || product.conditionLevel) {
                const cond = product.condition || product.conditionLevel;
                if (cond && String(cond).trim()) {
                    conditions.add(String(cond).trim());
                }
            }

            // Location
            if (product.locationTrading && product.locationTrading.trim()) {
                locations.add(product.locationTrading.trim());
            }
        });

        // Phân loại sản phẩm theo loại xe
        const electricMotorcycles = [];
        const electricBikes = [];
        const batteries = [];

        allProducts.forEach(product => {
            const title = (product.title || '').toLowerCase();
            const description = (product.description || '').toLowerCase();
            const category = String(product.category || '').toLowerCase();
            const brand = (product.brand || '').toLowerCase();

            // Phân loại dựa trên title, description, category
            const isMotorcycle =
                title.includes('xe máy') ||
                title.includes('motorcycle') ||
                title.includes('scooter') ||
                description.includes('xe máy điện') ||
                description.includes('motorcycle') ||
                category.includes('motorcycle') ||
                category.includes('xe máy') ||
                ['honda', 'yamaha', 'vinfast', 'pega', 'detech', 'gogoro'].some(b => brand.includes(b));

            const isBike =
                title.includes('xe đạp') ||
                title.includes('bicycle') ||
                title.includes('bike') ||
                description.includes('xe đạp điện') ||
                description.includes('bicycle') ||
                category.includes('bicycle') ||
                category.includes('xe đạp') ||
                ['giant', 'trek', 'specialized', 'cannondale', 'merida', 'scott'].some(b => brand.includes(b));

            const isBattery =
                title.includes('pin') ||
                title.includes('battery') ||
                title.includes('ắc quy') ||
                description.includes('pin') ||
                description.includes('battery') ||
                category.includes('battery') ||
                category.includes('pin');

            if (isMotorcycle) {
                electricMotorcycles.push(product);
            } else if (isBike) {
                electricBikes.push(product);
            } else if (isBattery) {
                batteries.push(product);
            }
        });

        // Helper function để normalize brand name (loại bỏ khoảng trắng, chuyển lowercase)
        const normalizeBrand = (brand) => {
            if (!brand) return '';
            return brand.trim().toLowerCase();
        };

        // Helper function để normalize model name
        const normalizeModel = (model) => {
            if (!model) return '';
            return model.trim().toLowerCase();
        };

        // Lọc brands và models theo category, chỉ lấy những brand/model thực sự có sản phẩm
        const getCategoryBrands = (products) => {
            const brandSet = new Set();
            products.forEach(p => {
                if (p.brand && p.brand.trim()) {
                    brandSet.add(p.brand.trim());
                }
            });
            return Array.from(brandSet).sort();
        };

        const getCategoryModels = (products) => {
            const modelSet = new Set();
            products.forEach(p => {
                if (p.model && p.model.trim()) {
                    modelSet.add(p.model.trim());
                }
            });
            return Array.from(modelSet).sort();
        };

        // Tạo cấu trúc danh mục với brands và models được lọc từ products thực tế
        const categoryStructure = {
            'electric-motorcycles': {
                id: 'electric-motorcycles',
                name: 'Xe máy điện',
                products: electricMotorcycles,
                brands: getCategoryBrands(electricMotorcycles),
                models: getCategoryModels(electricMotorcycles),
                count: electricMotorcycles.length
            },
            'electric-bikes': {
                id: 'electric-bikes',
                name: 'Xe đạp điện',
                products: electricBikes,
                brands: getCategoryBrands(electricBikes),
                models: getCategoryModels(electricBikes),
                count: electricBikes.length
            },
            'batteries': {
                id: 'batteries',
                name: 'Pin đã qua sử dụng',
                products: batteries,
                brands: getCategoryBrands(batteries),
                models: getCategoryModels(batteries),
                count: batteries.length
            }
        };

        return {
            allProducts,
            brands: Array.from(brands).sort(),
            models: Array.from(models).sort(),
            categories: Array.from(categories).sort(),
            batteryTypes: Array.from(batteryTypes).sort(),
            conditions: Array.from(conditions).sort(),
            locations: Array.from(locations).sort(),
            brandModelsMap: Object.fromEntries(
                Array.from(brandModelsMap.entries()).map(([brand, models]) => [brand, Array.from(models).sort()])
            ),
            categoryProductsMap: Object.fromEntries(
                Array.from(categoryProductsMap.entries()).map(([cat, products]) => [cat, products])
            ),
            categoryStructure,
            stats: {
                totalProducts: allProducts.length,
                totalBrands: brands.size,
                totalModels: models.size,
                totalCategories: categories.size
            }
        };
    } catch (error) {
        console.error('[analyzeProducts] Error analyzing products:', error);
        // Trả về cấu trúc mặc định nếu có lỗi
        return getDefaultCategoryStructure();
    }
}

/**
 * Cấu trúc danh mục mặc định khi không thể fetch dữ liệu
 */
export function getDefaultCategoryStructure() {
    return {
        categoryStructure: {
            'electric-motorcycles': {
                id: 'electric-motorcycles',
                name: 'Xe máy điện',
                brands: ['Honda', 'Yamaha', 'VinFast', 'Pega', 'Detech', 'Gogoro'],
                models: [],
                count: 0
            },
            'electric-bikes': {
                id: 'electric-bikes',
                name: 'Xe đạp điện',
                brands: ['Giant', 'Trek', 'Specialized', 'Cannondale', 'Merida', 'Scott'],
                models: [],
                count: 0
            },
            'batteries': {
                id: 'batteries',
                name: 'Pin đã qua sử dụng',
                brands: ['Samsung', 'LG', 'Panasonic', 'BYD', 'CATL', 'Tesla'],
                models: [],
                count: 0
            }
        },
        brands: [],
        models: [],
        categories: [],
        stats: {
            totalProducts: 0,
            totalBrands: 0,
            totalModels: 0,
            totalCategories: 0
        }
    };
}

/**
 * Tạo URL query params cho filter
 */
export function buildProductFilterUrl(filters) {
    const params = new URLSearchParams();

    // API search parameters (ưu tiên)
    if (filters.type) {
        params.append('type', filters.type);
    }
    if (filters.value) {
        params.append('value', filters.value);
    }

    // Legacy filter parameters (vẫn giữ để tương thích)
    if (filters.category) {
        params.append('category', filters.category);
    }
    if (filters.brand) {
        params.append('brand', filters.brand);
        // Nếu có brand nhưng chưa có type, set type=brand và value=brand
        if (!filters.type) {
            params.set('type', 'brand');
            params.set('value', filters.brand);
        }
    }
    if (filters.model) {
        params.append('model', filters.model);
        // Nếu có model nhưng chưa có type, set type=model và value=model
        if (!filters.type) {
            params.set('type', 'model');
            params.set('value', filters.model);
        }
    }
    if (filters.batteryType) {
        params.append('batteryType', filters.batteryType);
    }
    if (filters.condition) {
        params.append('condition', filters.condition);
        // Nếu có condition nhưng chưa có type, set type=conditionLevel và value=condition
        if (!filters.type) {
            params.set('type', 'conditionLevel');
            params.set('value', filters.condition);
        }
    }
    if (filters.location) {
        params.append('location', filters.location);
        // Nếu có location nhưng chưa có type, set type=locationTrading và value=location
        if (!filters.type) {
            params.set('type', 'locationTrading');
            params.set('value', filters.location);
        }
    }
    if (filters.minPrice) {
        params.append('minPrice', filters.minPrice);
    }
    if (filters.maxPrice) {
        params.append('maxPrice', filters.maxPrice);
    }
    if (filters.search) {
        params.append('search', filters.search);
        // Nếu có search nhưng chưa có type, set type=title và value=search
        if (!filters.type) {
            params.set('type', 'title');
            params.set('value', filters.search);
        }
    }

    return params.toString();
}

