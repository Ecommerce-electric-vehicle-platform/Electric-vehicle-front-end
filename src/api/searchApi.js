import axiosInstance from "./axiosInstance";

/**
 * 🔍 Tìm kiếm sản phẩm toàn diện từ BE
 * BE: GET /api/v1/products/search?q={query}&page={page}&size={size}
 */
export async function searchProducts({ query, page = 1, size = 50 } = {}) {
    if (!query || !query.trim()) {
        return {
            items: [],
            totalPages: 0,
            totalElements: 0,
            raw: null,
        };
    }

    try {
        const response = await axiosInstance.get("/api/v1/products/search", {
            params: {
                q: query.trim(),
                page: Math.max(0, page - 1), // BE dùng 0-based page
                size
            },
        });

        const raw = response?.data ?? {};

        console.log("🔍 Search API Response:", raw);

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

        return {
            items: Array.isArray(items) ? items : [],
            totalPages: Number(totalPages) || 1,
            totalElements: Number(totalElements) || 0,
            raw,
        };
    } catch (error) {
        console.error("❌ Search API Error:", error);

        // Fallback: tìm kiếm trong tất cả sản phẩm nếu API search chưa có
        try {
            const { items: allItems } = await fetchPostProducts({ page: 1, size: 100 });
            const allProducts = (allItems || []).map(normalizeProduct).filter(Boolean);

            const searchLower = query.toLowerCase();
            const filtered = allProducts.filter((item) => {
                return (
                    item.title.toLowerCase().includes(searchLower) ||
                    item.brand?.toLowerCase().includes(searchLower) ||
                    item.model?.toLowerCase().includes(searchLower) ||
                    item.locationTrading.toLowerCase().includes(searchLower) ||
                    item.description?.toLowerCase().includes(searchLower)
                );
            });

            return {
                items: filtered,
                totalPages: 1,
                totalElements: filtered.length,
                raw: null,
            };
        } catch (fallbackError) {
            console.error("❌ Fallback search error:", fallbackError);
            return {
                items: [],
                totalPages: 0,
                totalElements: 0,
                raw: null,
            };
        }
    }
}

/**
 * 🔍 Tìm kiếm nhanh (suggestions) - trả về 5 kết quả đầu tiên
 */
export async function quickSearch(query) {
    if (!query || !query.trim()) return [];

    try {
        const { items } = await searchProducts({ query, size: 5 });
        return items;
    } catch (error) {
        console.error("❌ Quick search error:", error);
        return [];
    }
}

// Import normalizeProduct từ productApi
import { fetchPostProducts, normalizeProduct } from "./productApi";
