import axiosInstance from "./axiosInstance";
import { normalizeProduct, fetchPostProductById } from "./productApi";

/**
 * GET /api/v1/buyer/wish-list
 * Lấy danh sách wishlist của buyer
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (0-indexed, default: 0)
 * @param {number} params.size - Page size (default: 10)
 * @param {string|null} params.priority - Filter by priority: "LOW" | "MEDIUM" | "HIGH" | null (all)
 * @returns {Promise<{items: Array, totalPages: number, totalElements: number}>}
 */
export async function fetchWishlist({ page = 0, size = 10, priority = null } = {}) {
    try {
        const params = {
            page: Number(page),
            size: Number(size),
        };

        // Chỉ thêm priority vào params nếu có giá trị (không phải null/undefined)
        if (priority && (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH")) {
            params.priority = priority;
        }

        const response = await axiosInstance.get("/api/v1/buyer/wish-list", { params });

        // Backend response có thể có cấu trúc khác nhau, chuẩn hóa
        const raw = response?.data ?? {};
        const data = raw?.data ?? raw;

        // Tìm danh sách items trong response
        const content =
            data?.content ||
            data?.items ||
            data?.wishList ||
            data?.wishlist ||
            (Array.isArray(data) ? data : []);

        // Tìm pagination metadata
        const pageInfo = data?.page ?? data?.meta ?? data?.pagination ?? {};

        const totalPages =
            pageInfo?.totalPages ??
            data?.totalPages ??
            Math.max(1, Math.ceil((pageInfo?.totalElements ?? content?.length ?? 0) / size));

        const totalElements =
            pageInfo?.totalElements ??
            data?.totalElements ??
            (Array.isArray(content) ? content.length : 0);

        // Log raw response để debug cấu trúc
        if (content.length > 0) {
            const sample = content[0];
            console.log('[wishlistApi] Sample wishlist item structure:', {
                firstItem: sample,
                firstItemKeys: Object.keys(sample || {}),
                hasPostProduct: !!(sample?.postProduct),
                hasProduct: !!(sample?.product),
                hasPost: !!(sample?.post),
                wishlistId: sample?.wishlistId,
                wishlist_id: sample?.wishlist_id,
                id: sample?.id,
                postProductId: sample?.postProductId,
                postId: sample?.postId,
                // Log toàn bộ structure
                fullStructure: JSON.stringify(sample, null, 2)
            });
        }

        // Chuẩn hóa mỗi item trong wishlist
        // Mỗi item có thể có cấu trúc: { wishlistId, postProduct, priority, note, addedAt }
        // hoặc đã là product object trực tiếp
        // hoặc chỉ có { id, postId, buyerId, priority, note } (cần fetch product data)
        let itemsToProcess = (Array.isArray(content) ? content : [])
            .map((item, index) => {
                // Extract wishlist metadata - thử nhiều field names
                // Backend có thể dùng: wishlistId, id, wishlist_id, hoặc các field khác
                let wishlistId = item.wishlistId ??
                    item.wishlist_id ??
                    item.wishListId ??
                    item.wishlistItemId ??
                    null;

                // Nếu vẫn không có, có thể id chính là wishlistId (nếu có postProduct riêng)
                // Hoặc có thể backend trả về structure khác
                if (!wishlistId && item.id) {
                    // Nếu có postProduct hoặc postId/postProductId khác với id, 
                    // thì id có thể là wishlistId
                    const productId = item.postProduct?.postId ??
                        item.postProduct?.id ??
                        item.postId ??
                        item.postProductId ??
                        null;

                    if (productId && productId !== item.id) {
                        wishlistId = item.id;
                    }
                }

                // Final fallback: nếu vẫn không có wishlistId rõ ràng
                // Có thể backend trả về products trực tiếp không có wishlist wrapper
                // Trong trường hợp này, dùng một giá trị tạm hoặc productId làm wishlistId
                // (nhưng sẽ không thể xóa được nếu không có wishlistId thật)
                let finalWishlistId = wishlistId;

                if (!finalWishlistId) {
                    // Nếu item có postProduct, thì item.id có thể là wishlistId
                    if (item.postProduct && item.id) {
                        finalWishlistId = item.id;
                    }
                    // Nếu không có postProduct, có thể item chính là product
                    // Trong trường hợp này, không có wishlistId thật, chỉ có thể dùng index tạm
                    // Nhưng để tránh lỗi, hãy thử tìm id từ product data
                    else if (!item.postProduct) {
                        // Có thể item chính là product, không có wishlist wrapper
                        // Dùng index hoặc một giá trị unique làm wishlistId tạm
                        // (nhưng lưu ý: sẽ không thể xóa được nếu backend yêu cầu wishlistId)
                        const tempId = item.postId || item.postProductId || item.id || `temp_${index}`;
                        finalWishlistId = tempId;
                        console.warn('[wishlistApi] No wishlistId found, using temporary ID:', {
                            tempId: finalWishlistId,
                            itemKeys: Object.keys(item),
                            note: 'Item may not be deletable if backend requires wishlistId'
                        });
                    }
                }

                if (!finalWishlistId) {
                    console.warn('[wishlistApi] Cannot determine wishlistId, skipping:', {
                        index,
                        itemKeys: Object.keys(item),
                        sampleFields: {
                            id: item.id,
                            wishlistId: item.wishlistId,
                            wishlist_id: item.wishlist_id,
                            postProductId: item.postProductId,
                            postId: item.postId
                        }
                    });
                    return null;
                }

                // Tìm product data - ưu tiên các field chứa product object
                let productData = null;

                // Ưu tiên 1: postProduct (object chứa product)
                if (item.postProduct && typeof item.postProduct === 'object' && !Array.isArray(item.postProduct)) {
                    productData = item.postProduct;
                }
                // Ưu tiên 2: product field
                else if (item.product && typeof item.product === 'object' && !Array.isArray(item.product)) {
                    productData = item.product;
                }
                // Ưu tiên 3: post field
                else if (item.post && typeof item.post === 'object' && !Array.isArray(item.post)) {
                    productData = item.post;
                }
                // Trường hợp đặc biệt: nếu item có postProductId/postId và các field của product
                else if ((item.postProductId || item.postId) && (item.title || item.price !== undefined)) {
                    // Item có thể chính là product, nhưng cần kiểm tra kỹ
                    const itemPostId = item.postId || item.postProductId;
                    // Chỉ dùng nếu postId/postProductId khác với wishlistId
                    if (itemPostId && itemPostId !== finalWishlistId) {
                        productData = { ...item, postId: itemPostId };
                    }
                }
                // Trường hợp backend trả về product data trực tiếp (không có wrapper postProduct)
                // Kiểm tra nếu item có các field của product như title, price, images, v.v.
                else if (item.title || item.price !== undefined || item.images || item.image || item.batteryType) {
                    // Item chính là product data, nhưng cần tìm postId
                    const productId = item.postId ||
                        item.postProductId ||
                        item.post_product_id ||
                        (item.id && item.id !== finalWishlistId ? item.id : null);

                    if (productId) {
                        productData = { ...item, postId: productId };
                    } else {
                        // Nếu không tìm thấy postId rõ ràng, thử dùng item trực tiếp
                        productData = item;
                    }
                }
                // Trường hợp backend chỉ trả về postId (không có full product data)
                // Đây là cấu trúc từ WishListingResponse: { id, postId, buyerId, priority, note }
                else if (item.postId && !item.title && item.price === undefined) {
                    // Backend chỉ trả về postId, cần fetch product data riêng
                    // Trả về object đặc biệt để fetch sau
                    return {
                        _needsFetch: true,
                        wishlistId: finalWishlistId,
                        postId: item.postId,
                        priority: item.priority ?? null,
                        note: item.note ?? "",
                        addedAt: item.addedAt ?? item.added_at ?? item.createdAt ?? null,
                    };
                }

                // Nếu không có productData và không phải trường hợp cần fetch, skip
                if (!productData && !item._needsFetch) {
                    console.warn('[wishlistApi] Wishlist item missing product data:', {
                        wishlistId: finalWishlistId,
                        hasPostProduct: !!item.postProduct,
                        hasProduct: !!item.product,
                        hasPost: !!item.post,
                        hasPostProductId: !!item.postProductId,
                        hasPostId: !!item.postId,
                        itemId: item.id,
                        hasTitle: !!item.title,
                        hasPrice: item.price !== undefined,
                        itemKeys: Object.keys(item)
                    });
                    return null;
                }

                // Nếu cần fetch product data, return ngay (sẽ fetch sau)
                if (item._needsFetch || productData?._needsFetch) {
                    return item._needsFetch ? item : productData;
                }

                // Đảm bảo productData không có id trùng với wishlistId
                // Tạo clean copy để tránh nhầm lẫn
                const cleanProductData = { ...productData };
                if (cleanProductData.id === finalWishlistId) {
                    delete cleanProductData.id; // Loại bỏ id trùng với wishlistId
                }
                if (cleanProductData.wishlistId === finalWishlistId) {
                    delete cleanProductData.wishlistId;
                }

                // Chuẩn hóa product
                const normalized = normalizeProduct(cleanProductData);

                // normalizeProduct sẽ return null nếu không có postId hợp lệ
                if (!normalized || !normalized.postId || !normalized.id) {
                    console.warn('[wishlistApi] Skipping item - missing valid product ID after normalization:', {
                        wishlistId: finalWishlistId,
                        hasPostId: !!cleanProductData?.postId,
                        hasPostProductId: !!cleanProductData?.postProductId,
                        cleanProductDataKeys: Object.keys(cleanProductData)
                    });
                    return null;
                }

                // Đảm bảo product ID KHÁC wishlistId (quan trọng!)
                const normalizedProductId = normalized.postId || Number(normalized.id);
                if (normalizedProductId === finalWishlistId || String(normalized.id) === String(finalWishlistId)) {
                    console.error('[wishlistApi] Product ID matches wishlistId - REJECTING item (cannot distinguish):', {
                        wishlistId: finalWishlistId,
                        productId: normalizedProductId,
                        normalizedId: normalized.id,
                        itemStructure: {
                            hasPostProduct: !!item.postProduct,
                            itemId: item.id,
                            itemPostId: item.postId,
                            itemPostProductId: item.postProductId
                        }
                    });
                    return null; // Reject item này vì không thể phân biệt được productId và wishlistId
                }

                // Đảm bảo ID là số nguyên hợp lệ (không phải số thập phân)
                const productIdNum = Number(normalized.id);
                if (isNaN(productIdNum) || productIdNum <= 0 || !Number.isInteger(productIdNum)) {
                    console.warn('[wishlistApi] Skipping item - invalid product ID format:', {
                        wishlistId: finalWishlistId,
                        productId: normalized.id
                    });
                    return null;
                }

                // Final check: đảm bảo ID string không chứa dấu chấm
                const idString = String(normalized.id);
                if (idString.includes('.') || idString === 'NaN' || idString === '0') {
                    console.warn('[wishlistApi] Skipping item - invalid product ID string:', {
                        wishlistId: finalWishlistId,
                        idString
                    });
                    return null;
                }

                // Bổ sung thông tin wishlist
                return {
                    ...normalized,
                    wishlistId: finalWishlistId,
                    priority: item.priority ?? null, // "LOW" | "MEDIUM" | "HIGH" | null
                    note: item.note ?? "",
                    addedAt: item.addedAt ?? item.added_at ?? item.createdAt ?? null,
                };
            })
            .filter(Boolean); // Remove null items (invalid products)

        // Tách items thành 2 nhóm: có product data và cần fetch
        const itemsWithData = itemsToProcess.filter(item => !item._needsFetch);
        const itemsNeedingFetch = itemsToProcess.filter(item => item._needsFetch);

        // Fetch product data cho các items cần fetch
        let fetchedItems = [];
        if (itemsNeedingFetch.length > 0) {
            console.log(`[wishlistApi] Fetching product data for ${itemsNeedingFetch.length} items...`);
            try {
                // Fetch song song tất cả products
                const fetchPromises = itemsNeedingFetch.map(async (item) => {
                    try {
                        const productData = await fetchPostProductById(item.postId);
                        if (productData && productData.postId) {
                            return {
                                ...productData,
                                wishlistId: item.wishlistId,
                                priority: item.priority,
                                note: item.note,
                                addedAt: item.addedAt,
                            };
                        }
                        console.warn(`[wishlistApi] Failed to fetch product ${item.postId} for wishlist ${item.wishlistId}`);
                        return null;
                    } catch (err) {
                        console.error(`[wishlistApi] Error fetching product ${item.postId} for wishlist ${item.wishlistId}:`, err);
                        return null;
                    }
                });

                fetchedItems = (await Promise.all(fetchPromises)).filter(Boolean);
                console.log(`[wishlistApi] Successfully fetched ${fetchedItems.length}/${itemsNeedingFetch.length} products`);
            } catch (err) {
                console.error('[wishlistApi] Error fetching products:', err);
                // Tiếp tục với items đã có data
            }
        }

        // Merge items có data và items đã fetch
        const normalizedItems = [...itemsWithData, ...fetchedItems];

        return {
            items: normalizedItems,
            totalPages: Number(totalPages) || 1,
            totalElements: Number(totalElements) || 0,
            raw: data,
        };
    } catch (error) {
        console.error("[wishlistApi] Error fetching wishlist:", error);
        throw error;
    }
}

/**
 * POST /api/v1/buyer/wish-list
 * Thêm sản phẩm vào wishlist
 * @param {Object} payload
 * @param {number} payload.postId - ID của sản phẩm (PostProduct)
 * @param {string} payload.priority - Priority: "LOW" | "MEDIUM" | "HIGH" (default: "LOW")
 * @param {string} payload.note - Ghi chú (optional)
 * @returns {Promise<Object>}
 */
export async function addToWishlist({ postId, priority = "LOW", note = "" }) {
    try {
        if (!postId || postId <= 0) {
            throw new Error("postId không hợp lệ");
        }

        // Validate priority
        const validPriorities = ["LOW", "MEDIUM", "HIGH"];
        const normalizedPriority = validPriorities.includes(priority?.toUpperCase())
            ? priority.toUpperCase()
            : "LOW";

        const payload = {
            postId: Number(postId),
            priority: normalizedPriority,
            note: String(note || "").trim(),
        };

        const response = await axiosInstance.post("/api/v1/buyer/wish-list", payload);

        // Backend response có thể là { success, message, data, error }
        const raw = response?.data ?? {};
        const result = raw?.data ?? raw;

        return {
            success: raw?.success !== false,
            message: raw?.message || "Đã thêm vào danh sách yêu thích",
            data: result,
        };
    } catch (error) {
        console.error("[wishlistApi] Error adding to wishlist:", error);
        throw error;
    }
}

/**
 * POST /api/v1/buyer/remove-wish-list/{wishId}
 * Xóa sản phẩm khỏi wishlist
 * @param {number|string} wishId - ID của wishlist item (wishId)
 * @returns {Promise<Object>}
 */
export async function removeFromWishlist(wishId) {
    try {
        if (!wishId) {
            throw new Error("wishId không hợp lệ");
        }

        // Validate wishId là số hợp lệ
        const normalizedWishId = Number(wishId);
        if (isNaN(normalizedWishId) || normalizedWishId <= 0 || !Number.isInteger(normalizedWishId)) {
            throw new Error("wishId phải là số nguyên dương hợp lệ");
        }

        console.log('[wishlistApi] Calling remove API with:', {
            wishId: normalizedWishId,
            method: 'POST',
            endpoint: `/api/v1/buyer/remove-wish-list/${normalizedWishId}`
        });

        // API sử dụng POST method, không phải DELETE
        // Endpoint: POST /api/v1/buyer/remove-wish-list/{wishId}
        const response = await axiosInstance.post(
            `/api/v1/buyer/remove-wish-list/${normalizedWishId}`
        );

        console.log('[wishlistApi] Remove API response:', response?.data);

        // Backend response có thể là { success, message, data, error }
        // Hoặc empty object {} nếu thành công
        const raw = response?.data ?? {};

        // Nếu response là empty object {}, coi như success
        const isEmptyResponse = Object.keys(raw).length === 0;

        return {
            success: isEmptyResponse || raw?.success !== false,
            message: raw?.message || "Đã xóa khỏi danh sách yêu thích",
            data: raw?.data ?? raw,
        };
    } catch (error) {
        console.error("[wishlistApi] Error removing from wishlist:", error);

        // Xử lý các loại lỗi phổ biến
        if (error?.response?.status === 404) {
            throw new Error("Không tìm thấy mục yêu thích này");
        } else if (error?.response?.status === 403) {
            throw new Error("Bạn không có quyền xóa mục này");
        } else if (error?.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
}

/**
 * Chuẩn hóa wishlist item để hiển thị trong UI
 * @param {Object} item - Wishlist item từ API
 * @returns {Object} Normalized wishlist item
 */
export function normalizeWishlistItem(item) {
    if (!item || typeof item !== "object") return null;

    // Extract wishlist metadata trước
    const wishlistId = item.wishlistId ?? item.id ?? item.wishlist_id;

    // Nếu item có postProduct, lấy từ đó (KHÔNG fallback sang item để tránh lấy wishlistId làm postId)
    const productData = item.postProduct ?? item.product ?? item.post;

    // Chỉ dùng item nếu nó có postId/id và KHÔNG phải là wishlistId
    let finalProductData = productData;
    if (!finalProductData) {
        // Chỉ dùng item nếu nó có postId hoặc có id khác với wishlistId
        if (item.postId || (item.id && item.id !== wishlistId)) {
            finalProductData = item;
        }
    }

    if (!finalProductData) {
        console.warn('[wishlistApi] normalizeWishlistItem: Missing product data for wishlistId:', wishlistId);
        return null;
    }

    const normalized = normalizeProduct(finalProductData);

    // Nếu normalized product không có valid postId/id, return null
    if (!normalized || (!normalized.postId && !normalized.id)) {
        console.warn('[wishlistApi] normalizeWishlistItem: Normalized product missing valid ID for wishlistId:', wishlistId);
        return null;
    }

    return {
        ...normalized,
        wishlistId,
        priority: item.priority ?? null,
        note: item.note ?? "",
        addedAt: item.addedAt ?? item.added_at ?? item.createdAt ?? null,
    };
}

