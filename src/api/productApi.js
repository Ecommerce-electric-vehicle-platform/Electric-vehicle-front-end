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

        console.log(`[fetchPostProductById] API Response for ID ${id}:`, response?.data);

        // Backend response có thể có nhiều cấu trúc:
        // 1. {success, message, data: {...product...}, error}
        // 2. {...product...} trực tiếp
        // 3. {success: true, data: null, error: "..."} - product không tồn tại
        const rawResponse = response?.data ?? {};

        console.log(`[fetchPostProductById] Raw response for ID ${id}:`, rawResponse);
        console.log(`[fetchPostProductById] Response structure check:`, {
            hasSuccess: 'success' in rawResponse,
            hasData: 'data' in rawResponse,
            hasError: 'error' in rawResponse,
            dataIsNull: rawResponse?.data === null,
            dataType: typeof rawResponse?.data
        });

        // Kiểm tra nếu response có error và data là null (product không tồn tại)
        if (rawResponse?.error && rawResponse?.data === null) {
            const errorMsg = rawResponse?.error || rawResponse?.message || `Không tìm thấy sản phẩm với ID: ${id}`;
            console.error(`[fetchPostProductById] Error in response for ID ${id}:`, errorMsg);
            throw new Error(errorMsg);
        }

        // Extract item - thử nhiều cách:
        // 1. rawResponse.data (nếu có wrapper)
        // 2. rawResponse (nếu là product trực tiếp)
        // 3. rawResponse.content (một số API dùng content)
        // 4. rawResponse.product (một số API dùng product)
        let item = null;

        if (rawResponse?.data !== null && rawResponse?.data !== undefined) {
            item = rawResponse.data;
            console.log(`[fetchPostProductById] Using rawResponse.data for ID ${id}`);
        } else if (rawResponse?.content) {
            item = rawResponse.content;
            console.log(`[fetchPostProductById] Using rawResponse.content for ID ${id}`);
        } else if (rawResponse?.product) {
            item = rawResponse.product;
            console.log(`[fetchPostProductById] Using rawResponse.product for ID ${id}`);
        } else if (!('success' in rawResponse) && !('error' in rawResponse)) {
            // Nếu không phải response wrapper, có thể rawResponse chính là product
            item = rawResponse;
            console.log(`[fetchPostProductById] Using rawResponse directly for ID ${id}`);
        }

        console.log(`[fetchPostProductById] Extracted item for ID ${id}:`, item);

        // Kiểm tra item có hợp lệ không
        if (!item || (typeof item === 'object' && Object.keys(item).length === 0)) {
            console.warn(`[fetchPostProductById] Empty or null item for ID ${id}`, {
                rawResponse,
                item,
                hasPostId: item?.postId,
                hasId: item?.id
            });
            throw new Error(`Không tìm thấy dữ liệu sản phẩm với ID: ${id}`);
        }

        const normalized = normalizeProduct(item);
        console.log(`[fetchPostProductById] Normalized product for ID ${id}:`, normalized);

        if (!normalized) {
            console.error(`[fetchPostProductById] normalizeProduct returned null for ID ${id}, item was:`, item);
            throw new Error(`Không thể xử lý dữ liệu sản phẩm với ID: ${id}`);
        }

        return normalized;
    } catch (err) {
        console.error(`[fetchPostProductById] Error fetching product ID ${id}:`, err);

        // Fallback: tìm trong danh sách tất cả products
        try {
            console.log(`[fetchPostProductById] Trying fallback search for ID ${id}`);
            const { items } = await fetchPostProducts({ page: 1, size: 100 });
            const found = (items || []).find(
                (x) => String(x?.id ?? x?.postId ?? x?.post_id) === String(id)
            );
            if (found) {
                console.log(`[fetchPostProductById] Found in fallback for ID ${id}:`, found);
                return normalizeProduct(found);
            }
        } catch (fallbackErr) {
            console.error(`[fetchPostProductById] Fallback also failed for ID ${id}:`, fallbackErr);
        }

        throw err;
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

/**
 * Helper function to validate and normalize product ID
 * @param {any} id - The ID to validate
 * @returns {number|null} - Valid integer ID or null
 */
function validateProductId(id) {
    if (id == null) return null;

    if (typeof id === 'number') {
        return (id > 0 && Number.isInteger(id)) ? id : null;
    }

    if (typeof id === 'string') {
        const trimmed = id.trim();
        if (trimmed === '') return null;
        const num = Number(trimmed);
        return (!isNaN(num) && num > 0 && Number.isInteger(num)) ? num : null;
    }

    return null;
}

export function normalizeProduct(item) {
    if (!item || typeof item !== "object") {
        console.warn('[normalizeProduct] Item is null or not an object:', item);
        return null;
    }

    // Xử lý trường hợp item có thể là response wrapper
    // Nếu item có cấu trúc {success, message, data: {...}, error}, extract data
    let productData = item;
    if (item.data && typeof item.data === 'object' && !Array.isArray(item.data)) {
        // Có thể là wrapper, nhưng cũng có thể data là một object product
        // Chỉ unwrap nếu có các field của response wrapper
        if ('success' in item || 'message' in item || 'error' in item) {
            productData = item.data;
            // Nếu data là null, có thể product không tồn tại
            if (!productData) {
                console.warn('[normalizeProduct] Response wrapper has null data:', item);
                return null;
            }
        }
    }

    // Helper: chuyển URL tương đối thành tuyệt đối theo baseURL BE
    const toAbsoluteUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        if (!trimmed) return '';
        const isAbsolute = /^https?:\/\//i.test(trimmed);
        if (isAbsolute) return trimmed;
        const base = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
        const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return `${base}${path}`;
    };

    // Ảnh chính và danh sách ảnh
    let imageUrl = "";
    let images = [];

    // Xử lý trường hợp BE trả về images là mảng object với imgUrl
    if (Array.isArray(productData.images) && productData.images.length > 0) {
        // Sắp xếp theo order nếu có
        const sortedImages = [...productData.images].sort((a, b) =>
            (a.order || 0) - (b.order || 0)
        );

        // Lấy mảng các URL từ imgUrl, filter out empty strings và null
        images = sortedImages
            .map(img => {
                if (typeof img === 'string') return img;
                if (typeof img === 'object' && img !== null) {
                    return img.imgUrl || img.url || img.image || null;
                }
                return null;
            })
            .filter(url => url && typeof url === 'string' && url.trim() !== '')
            .map(toAbsoluteUrl);

        // Ảnh chính là ảnh đầu tiên hợp lệ
        imageUrl = images[0] || "";
    }
    // Fallback cho các format cũ
    else if (Array.isArray(productData.imageUrls) && productData.imageUrls.length > 0) {
        images = productData.imageUrls
            .filter(url => url && typeof url === 'string' && url.trim() !== '')
            .map(toAbsoluteUrl);
        imageUrl = images[0] || "";
    }
    else if (typeof productData.imageUrls === "string" && productData.imageUrls.trim() !== "") {
        images = [toAbsoluteUrl(productData.imageUrls)];
        imageUrl = images[0];
    }

    // Thử các trường khác nếu chưa có ảnh
    if (!imageUrl) {
        const fallbackImg = productData.thumbnail || productData.image || productData.coverUrl || "";
        if (fallbackImg && typeof fallbackImg === 'string' && fallbackImg.trim() !== '') {
            const abs = toAbsoluteUrl(fallbackImg);
            images = [abs];
            imageUrl = abs;
        }
    }

    // 💰 Giá
    const price = Number(productData.price ?? 0);

    // 🧭 Chuẩn hóa key theo BE thực tế
    // Lấy postId - đây là ID thực sự của post-product
    // Thử nhiều field names để tìm ID
    const postId = productData.postId ??
        productData.id ??
        productData.post_id ??
        productData.postProductId ??
        productData.productId;

    // Validate postId sử dụng helper function
    const normalizedPostId = validateProductId(postId);

    // Nếu không có postId hợp lệ, không thể normalize product này
    // Return null để caller biết bỏ qua item này
    if (!normalizedPostId) {
        // Chỉ log warning nếu có postId nhưng không hợp lệ (không log nếu null/undefined)
        if (postId != null) {
            console.warn('[normalizeProduct] Cannot normalize product - invalid postId:', {
                postId,
                postIdType: typeof postId,
                title: productData.title,
            });
        }
        return null;
    }

    // Chỉ trả về product nếu có postId hợp lệ
    return {
        // Luôn dùng normalizedPostId (đã validate) làm id chính
        id: String(normalizedPostId),
        postId: normalizedPostId, // Số nguyên hợp lệ
        title: productData.title ?? "Sản phẩm",
        brand: productData.brand ?? "",
        model: productData.model ?? "",
        manufactureYear: productData.manufactureYear ?? productData.manufacture_year,
        usedDuration: productData.usedDuration ?? productData.used_duration,
        condition: productData.conditionLevel ?? productData.condition_level ?? productData.condition,
        price,
        description: productData.description ?? "",
        locationTrading: productData.locationTrading ?? productData.location_trading ?? "Toàn quốc",
        // Verified: chỉ true khi đã được admin duyệt (APPROVED) và verified === true
        verified: Boolean(
            productData.verified &&
            productData.verifiedDecisionStatus === "APPROVED"
        ),
        verifiedDecisionStatus: productData.verifiedDecisionStatus,
        createdAt: productData.createdAt || productData.created_at || new Date().toISOString(),
        updatedAt: productData.updatedAt || productData.updated_at || productData.created_at || productData.createdAt || new Date().toISOString(),
        isSold: Boolean(productData.is_sold),

        //  Ảnh
        image: toAbsoluteUrl(imageUrl) || imageUrl,
        images: images.map(toAbsoluteUrl),

        //  Thông tin pin và tầm xa
        batteryType: productData.batteryType ?? productData.battery_type,
        range: productData.range ?? productData.maxRange ?? productData.max_range,

        //  Kích thước và trọng lượng
        width: productData.width ?? "",
        height: productData.height ?? "",
        length: productData.length ?? "",
        weight: productData.weight ?? "",
        color: productData.color ?? "",

        //  Thông tin bổ sung
        sellerId: productData.sellerId ?? productData.seller_id,
        sellerName: productData.sellerName ?? productData.seller_name,
        category: productData.category ?? productData.categoryId ?? productData.category_id,
        categoryName: productData.categoryName ?? productData.category_name ?? "",
        status: productData.status ?? "active",

        // Debug - giữ nguyên raw để debug
        _raw: productData,
    };
}
