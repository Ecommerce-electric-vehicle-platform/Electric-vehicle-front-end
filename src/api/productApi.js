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
    console.log('[productApi] fetchPostProductById - Received ID:', id, 'Type:', typeof id);

    // Normalize ID để đảm bảo so sánh đúng
    const normalizedId = String(id).trim();

    try {
        // Thử gọi API với ID được truyền vào
        // Backend API endpoint: /api/v1/post-product/{postId}
        // Lưu ý: ID này có thể là postId hoặc id từ URL
        console.log('[productApi] fetchPostProductById - Calling API with ID:', normalizedId);
        const response = await axiosInstance.get(`/api/v1/post-product/${normalizedId}`);
        console.log('[productApi] fetchPostProductById - Full API Response:', response);

        // Backend có thể trả về {success: true, data: {...}} hoặc trực tiếp object
        const rawData = response?.data;

        // Kiểm tra nếu response có success: true nhưng data: null hoặc có error message
        // Đây là trường hợp backend trả về lỗi nhưng vẫn status 200
        if (rawData?.success === true && (rawData?.data === null || rawData?.data === undefined)) {
            const errorMsg = rawData?.error || rawData?.message || 'Không tìm thấy sản phẩm';
            console.warn('[productApi] fetchPostProductById - Backend returned success:true but data is null. Error:', errorMsg);
            // Tạo một error object giống như axios error để trigger fallback
            throw {
                response: {
                    status: 404,
                    data: rawData
                },
                message: errorMsg
            };
        }

        let item = null;

        if (rawData?.data) {
            // Format: {success: true, data: {...}} hoặc {data: {...}}
            item = rawData.data;
        } else if (rawData && typeof rawData === 'object' && rawData.postId) {
            // Format: trực tiếp object với postId (là product object)
            item = rawData;
        } else if (rawData && typeof rawData === 'object' && !rawData.success) {
            // Format: trực tiếp object khác (không phải response wrapper)
            item = rawData;
        } else if (rawData?.success === false) {
            // Backend trả về success: false
            const errorMsg = rawData?.error || rawData?.message || 'Không tìm thấy sản phẩm';
            throw {
                response: {
                    status: 404,
                    data: rawData
                },
                message: errorMsg
            };
        }

        // Nếu không có item hợp lệ, throw error để trigger fallback
        if (!item || (typeof item === 'object' && Object.keys(item).length === 0)) {
            console.warn('[productApi] fetchPostProductById - No valid item extracted from response');
            throw {
                response: {
                    status: 404,
                    data: rawData
                },
                message: 'Không tìm thấy dữ liệu sản phẩm trong response'
            };
        }

        console.log('[productApi] fetchPostProductById - Extracted item:', item);
        console.log('[productApi] fetchPostProductById - Item postId/id/post_id:', {
            postId: item?.postId,
            id: item?.id,
            post_id: item?.post_id
        });

        const normalized = normalizeProduct(item);
        console.log('[productApi] fetchPostProductById - Normalized product:', {
            id: normalized?.id,
            postId: normalized?.postId,
            hasPostId: !!normalized?.postId
        });

        if (!normalized) {
            throw {
                response: {
                    status: 404,
                    data: rawData
                },
                message: `Không thể normalize sản phẩm với ID: ${normalizedId}`
            };
        }

        // Cảnh báo nếu normalized product không có postId (có thể là wish-list ID)
        if (!normalized.postId || normalized.postId === normalized.id) {
            console.warn('[productApi] fetchPostProductById - Warning: Product may not have proper postId. ID:', normalized.id, 'postId:', normalized.postId);
        }

        return normalized;
    } catch (err) {
        const statusCode = err?.response?.status;
        const isNotFound = statusCode === 404;

        console.error('[productApi] fetchPostProductById - Direct API call failed:', {
            message: err.message,
            statusCode,
            isNotFound,
            error: err
        });

        // Nếu là lỗi 404 và không phải do backend issue, không cần fallback
        // Nhưng vì có thể backend có bug với một số ID, chúng ta vẫn thử fallback
        console.log('[productApi] fetchPostProductById - Attempting fallback search...');

        // Fallback: Tìm trong tất cả các pages
        try {
            let found = null;
            let currentPage = 1;
            const maxPages = 20; // Giới hạn tối đa 20 pages để tránh loop vô hạn
            const pageSize = 50; // Lấy nhiều items mỗi page

            while (currentPage <= maxPages && !found) {
                console.log(`[productApi] fetchPostProductById - Searching page ${currentPage}...`);
                const { items, totalPages } = await fetchPostProducts({ page: currentPage, size: pageSize });

                if (!items || items.length === 0) {
                    console.log(`[productApi] fetchPostProductById - No items found on page ${currentPage}, stopping search`);
                    break;
                }

                // Tìm sản phẩm với ID khớp - so sánh nhiều trường ID
                // Cần tìm theo cả postId và id vì ID từ URL có thể là một trong hai
                found = items.find((x) => {
                    // Normalize các trường ID có thể có
                    const itemPostId = String(x?.postId ?? x?.post_id ?? '').trim();
                    const itemId = String(x?.id ?? '').trim();

                    // So sánh với normalizedId (ID từ URL params)
                    // Cần so sánh cả postId và id vì ID trong URL có thể là một trong hai
                    const matchesPostId = itemPostId && itemPostId === normalizedId;
                    const matchesId = itemId && itemId === normalizedId;

                    if (matchesPostId || matchesId) {
                        console.log(`[productApi] fetchPostProductById - Match found on page ${currentPage}:`, {
                            itemPostId,
                            itemId,
                            normalizedId,
                            matchType: matchesPostId ? 'postId' : 'id'
                        });
                        return true;
                    }

                    return false;
                });

                if (found) {
                    console.log(`[productApi] fetchPostProductById - Found product on page ${currentPage}:`, found);
                    break;
                }

                // Nếu đã đến trang cuối, dừng lại
                if (currentPage >= totalPages) {
                    console.log(`[productApi] fetchPostProductById - Reached last page (${totalPages}), stopping search`);
                    break;
                }

                currentPage++;
            }

            if (found) {
                const normalized = normalizeProduct(found);
                console.log('[productApi] fetchPostProductById - Fallback normalized product:', normalized);

                if (!normalized) {
                    throw new Error(`Không thể normalize sản phẩm với ID: ${normalizedId}`);
                }

                return normalized;
            } else {
                console.error(`[productApi] fetchPostProductById - Product with ID ${normalizedId} not found in any page`);
                throw new Error(`Không tìm thấy sản phẩm với ID: ${normalizedId}`);
            }
        } catch (fallbackErr) {
            console.error('[productApi] fetchPostProductById - Fallback search failed:', fallbackErr);
            throw new Error(`Không thể tải sản phẩm với ID: ${normalizedId}. ${fallbackErr.message || err.message}`);
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
    if (!item || typeof item !== "object") {
        console.log('[productApi] normalizeProduct - Item is null or not object:', item);
        return null;
    }

    console.log('[productApi] normalizeProduct - Raw item postId values:', {
        'item.postId': item.postId,
        'item.id': item.id,
        'item.post_id': item.post_id,
        'typeof postId': typeof item.postId,
        'typeof id': typeof item.id,
        'typeof post_id': typeof item.post_id
    });

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
    // Ưu tiên postId vì đây là ID thực sự của post-product
    // Tránh nhầm lẫn với wish-list ID hoặc các ID khác
    const postId = item.postId ?? item.post_id ?? null;
    const itemId = item.id ?? null;

    // finalId ưu tiên postId, chỉ dùng id nếu không có postId
    // Điều này đảm bảo API call sẽ dùng đúng post-product ID
    const finalId = postId ?? itemId ?? String(Math.random());

    console.log('[productApi] normalizeProduct - ID mapping:', {
        originalPostId: item.postId,
        originalId: item.id,
        normalizedPostId: postId,
        normalizedId: itemId,
        finalId: finalId,
        usingRandom: !postId && !itemId
    });

    return {
        id: finalId,
        postId: postId ?? finalId, // Lưu postId riêng để dùng cho API calls
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
