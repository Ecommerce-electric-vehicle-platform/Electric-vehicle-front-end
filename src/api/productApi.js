import axiosInstance from "./axiosInstance";

/**
 * GET /api/v1/post-product?page={page}&size={size}
 */
export async function fetchPostProducts({ page = 1, size = 12, params = {} } = {}) {
    const pageIndex = Math.max(0, Number(page) - 1);
    const response = await axiosInstance.get("/api/v1/post-product", {
        params: { page: pageIndex, size, ...params },
    });

    const raw = response?.data ?? {};
    const pageObj = raw?.data || raw;

    const content =
        pageObj?.postList ||
        pageObj?.content ||
        pageObj?.items ||
        pageObj?.results ||
        pageObj?.list ||
        (Array.isArray(pageObj) ? pageObj : []);

    const totalPages =
        pageObj?.meta?.totalPage ??
        pageObj?.totalPages ??
        pageObj?.page?.totalPages ??
        1;

    const totalElements =
        pageObj?.meta?.totalElements ??
        pageObj?.totalElements ??
        pageObj?.page?.totalElements ??
        (Array.isArray(content) ? content.length : 0);

    return {
        items: Array.isArray(content) ? content : [],
        totalPages: Number(totalPages) || 1,
        totalElements: Number(totalElements) || 0,
        raw,
    };
}

/**
 * GET /api/v1/post-product/{id}
 */
export async function fetchPostProductById(id) {
    if (id === undefined || id === null) throw new Error("Thiếu id sản phẩm");
    try {
        const response = await axiosInstance.get(`/api/v1/post-product/${id}`);
        const item = response?.data || null;
        return normalizeProduct(item);
    } catch (err) {
        try {
            const { items } = await fetchPostProducts({ page: 1, size: 50 });
            const found = (items || []).find(
                (x) => String(x?.id ?? x?.postId ?? x?.post_id) === String(id)
            );
            return normalizeProduct(found);
        } catch {
            throw err;
        }
    }
}

/**
 * GET /api/v1/post-product/{postId}/seller
 */
export async function fetchSellerByPostId(postId) {
    if (!postId) throw new Error("Thiếu postId (ID sản phẩm)");
    const response = await axiosInstance.get(`/api/v1/post-product/${postId}/seller`);
    return response.data?.data || response.data;
}

export function normalizeProduct(item) {
    if (!item || typeof item !== "object") return null;

    // Ảnh chính và danh sách ảnh
    let imageUrl = "";
    let images = [];

    // Xử lý trường hợp BE trả về images là mảng object với imgUrl
    if (Array.isArray(item.images) && item.images.length > 0) {
        // Sắp xếp theo order nếu có
        const sortedImages = [...item.images].sort((a, b) => 
            (a.order || 0) - (b.order || 0)
        );
        
        // Lấy mảng các URL từ imgUrl
        images = sortedImages.map(img => img.imgUrl || img.url || img).filter(Boolean);
        
        // Ảnh chính là ảnh đầu tiên
        imageUrl = images[0] || "";
    } 
    // Fallback cho các format cũ
    else if (Array.isArray(item.imageUrls)) {
        images = item.imageUrls;
        imageUrl = images[0] || "";
    } 
    else if (typeof item.imageUrls === "string") {
        images = [item.imageUrls];
        imageUrl = item.imageUrls;
    } 
    else {
        // Thử các trường khác
        const fallbackImg = item.thumbnail || item.image || item.coverUrl || "";
        if (fallbackImg) {
            images = [fallbackImg];
            imageUrl = fallbackImg;
        }
    }

    // 💰 Giá
    const price = Number(item.price ?? 0);

    // 🧭 Chuẩn hóa key theo BE thực tế
    return {
        id: item.postId ?? item.id ?? item.post_id ?? String(Math.random()),
        title: item.title ?? "Sản phẩm",
        brand: item.brand ?? "",
        model: item.model ?? "",
        manufactureYear: item.manufactureYear ?? item.manufacture_year,
        usedDuration: item.usedDuration ?? item.used_duration,
        condition: item.conditionLevel ?? item.condition_level ?? item.condition,
        price,
        description: item.description ?? "",
        locationTrading: item.locationTrading ?? item.location_trading ?? "Toàn quốc",
        // Verified: chỉ true khi đã được admin duyệt (APPROVED) và verified === true
        verified: Boolean(
            item.verified && 
            item.verifiedDecisionStatus === "APPROVED"
        ),
        verifiedDecisionStatus: item.verifiedDecisionStatus,
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        updatedAt: item.updatedAt || item.updated_at || item.created_at || item.createdAt || new Date().toISOString(),
        isSold: Boolean(item.is_sold),

        // 🖼️ Ảnh
        image: imageUrl,
        images,

        // 🔋 Thông tin pin và tầm xa
        batteryType: item.batteryType ?? item.battery_type,
        range: item.range ?? item.maxRange ?? item.max_range,

        // 📊 Thông tin bổ sung
        sellerId: item.sellerId ?? item.seller_id,
        sellerName: item.sellerName ?? item.seller_name,
        category: item.category ?? item.categoryId ?? item.category_id,
        status: item.status ?? "active",

        // Debug
        _raw: item,
    };
}
