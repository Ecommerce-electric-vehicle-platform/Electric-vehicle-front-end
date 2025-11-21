import axiosInstance from "./axiosInstance";
import { searchInProduct, sortProductsByRelevance } from "../utils/textUtils";
import { fetchPostProducts, normalizeProduct } from "./productApi";

/**
 * 🔍 Tìm kiếm sản phẩm từ Backend API
 * 
 * API: GET /api/v1/post-product/search
 * Parameters:
 *   - type: Search field type (title, brand, model, conditionLevel, locationTrading)
 *   - value: Search keyword/value
 *   - page: Page number (0-based)
 *   - size: Number of items per page
 */
export async function searchProducts({
    query,
    type = 'title', // Default search by title
    page = 1,
    size = 50
} = {}) {
    // Nếu có query nhưng không có type cụ thể, dùng type='title'
    const searchType = type || 'title';
    const searchValue = query || '';

    if (!searchValue || !searchValue.trim()) {
        return {
            items: [],
            totalPages: 0,
            totalElements: 0,
            raw: null,
        };
    }

    try {
        const response = await axiosInstance.get("/api/v1/post-product/search", {
            params: {
                type: searchType,
                value: searchValue.trim(),
                page: Math.max(0, page - 1), // BE dùng 0-based page
                size
            },
        });

        const raw = response?.data ?? {};
        console.log("🔍 Search API Response:", raw);

        // Kiểm tra nếu API trả về error
        if (raw.success === false) {
            console.warn("⚠️ Search API returned error:", raw.message || raw.error);
            // Fallback to client-side search
            return await fallbackClientSearch(searchValue, page, size);
        }

        // BE trả dạng { success, message, data: { items: [...], meta: {...} } }
        const data = raw?.data || raw;

        const items = data?.items ||
            data?.content ||
            data?.results ||
            data?.list ||
            (Array.isArray(data) ? data : []);

        const totalPages = data?.meta?.totalPage ??
            data?.totalPages ??
            data?.page?.totalPages ??
            1;

        const totalElements = data?.meta?.totalElements ??
            data?.totalElements ??
            data?.page?.totalElements ??
            (Array.isArray(items) ? items.length : 0);

        // Normalize all products to ensure proper ID structure
        const normalizedItems = (Array.isArray(items) ? items : []).map(item => {
            return normalizeProduct(item);
        }).filter(Boolean);

        return {
            items: normalizedItems,
            totalPages: Number(totalPages) || 1,
            totalElements: Number(totalElements) || 0,
            raw,
        };
    } catch (error) {
        console.error("❌ Search API Error:", error);
        // Fallback to client-side search if API fails
        return await fallbackClientSearch(searchValue, page, size);
    }
}

/**
 * Fallback: Client-side search khi API không khả dụng
 */
async function fallbackClientSearch(query, page, size) {
    try {
        // Fetch nhiều pages để có đủ dữ liệu tìm kiếm
        const pagesToFetch = Math.ceil(size / 20);
        const allProductsPromises = [];

        for (let i = 1; i <= Math.min(pagesToFetch, 5); i++) {
            allProductsPromises.push(fetchPostProducts({ page: i, size: 20 }));
        }

        const allPagesResults = await Promise.all(allProductsPromises);
        const allItems = allPagesResults.flatMap(result => result.items || []);
        const allProducts = allItems.map(normalizeProduct).filter(Boolean);

        // Sử dụng tìm kiếm cải tiến hỗ trợ có dấu và không dấu
        const filtered = allProducts.filter((item) => {
            return searchInProduct(item, query, ['title', 'brand', 'model', 'description', 'locationTrading', 'condition', 'manufactureYear']);
        });

        // Sắp xếp theo độ phù hợp
        const sortedResults = sortProductsByRelevance(filtered, query);

        // Pagination cho client-side results
        const startIndex = (page - 1) * size;
        const endIndex = startIndex + size;
        const paginatedResults = sortedResults.slice(startIndex, endIndex);
        const totalPages = Math.ceil(sortedResults.length / size);

        return {
            items: paginatedResults,
            totalPages: totalPages || 1,
            totalElements: sortedResults.length,
            raw: null,
        };
    } catch (error) {
        console.error("❌ Fallback client-side search error:", error);
        return {
            items: [],
            totalPages: 0,
            totalElements: 0,
            raw: null,
        };
    }
}

/**
 * 🔍 Tìm kiếm nhanh (suggestions) - trả về 5 kết quả đầu tiên
 * Tìm kiếm theo title
 */
export async function quickSearch(query) {
    if (!query || !query.trim()) return [];

    try {
        const { items } = await searchProducts({ query, type: 'title', size: 5 });
        return items;
    } catch (error) {
        console.error("❌ Quick search error:", error);
        return [];
    }
}

/**
 * 🔍 Tìm kiếm theo brand
 */
export async function searchByBrand(brand, page = 1, size = 50) {
    if (!brand || !brand.trim()) {
        return {
            items: [],
            totalPages: 0,
            totalElements: 0,
            raw: null,
        };
    }
    return await searchProducts({ query: brand, type: 'brand', page, size });
}

/**
 * 🔍 Tìm kiếm theo model
 */
export async function searchByModel(model, page = 1, size = 50) {
    if (!model || !model.trim()) {
        return {
            items: [],
            totalPages: 0,
            totalElements: 0,
            raw: null,
        };
    }
    return await searchProducts({ query: model, type: 'model', page, size });
}

/**
 * 🔍 Tìm kiếm theo conditionLevel
 */
export async function searchByCondition(condition, page = 1, size = 50) {
    if (!condition || !condition.trim()) {
        return {
            items: [],
            totalPages: 0,
            totalElements: 0,
            raw: null,
        };
    }
    return await searchProducts({ query: condition, type: 'conditionLevel', page, size });
}

/**
 * 🔍 Tìm kiếm theo locationTrading
 */
export async function searchByLocation(location, page = 1, size = 50) {
    if (!location || !location.trim()) {
        return {
            items: [],
            totalPages: 0,
            totalElements: 0,
            raw: null,
        };
    }
    return await searchProducts({ query: location, type: 'locationTrading', page, size });
}

