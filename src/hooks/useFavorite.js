import { useState, useEffect, useCallback } from 'react';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../api/wishlistApi';

/**
 * Custom hook để quản lý trạng thái yêu thích của sản phẩm
 * @param {number|string} postId - ID của sản phẩm
 * @returns {Object} { isFavorite, isLoading, toggleFavorite, checkFavoriteStatus }
 */
export function useFavorite(postId) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGuest, setIsGuest] = useState(true);

    // Kiểm tra trạng thái đăng nhập
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const legacyToken = localStorage.getItem('token');
        setIsGuest(!(accessToken || refreshToken || legacyToken));
    }, []);

    // Kiểm tra xem sản phẩm có trong wishlist không
    const checkFavoriteStatus = useCallback(async (productId) => {
        if (!productId || isGuest) {
            setIsFavorite(false);
            return;
        }

        try {
            setIsLoading(true);
            const result = await fetchWishlist({ page: 0, size: 100 });
            const productIdNum = Number(productId);
            const isInWishlist = (result.items || []).some(
                item => Number(item.postId || item.id) === productIdNum
            );
            setIsFavorite(isInWishlist);
        } catch (err) {
            console.error('[useFavorite] Error checking wishlist status:', err);
            setIsFavorite(false);
        } finally {
            setIsLoading(false);
        }
    }, [isGuest]);

    // Re-check khi postId hoặc isGuest thay đổi
    useEffect(() => {
        if (postId && !isGuest) {
            checkFavoriteStatus(postId);
        } else {
            setIsFavorite(false);
        }
    }, [postId, isGuest, checkFavoriteStatus]);

    // Toggle favorite (thêm hoặc xóa khỏi wishlist)
    const toggleFavorite = useCallback(async (product) => {
        // Nếu là guest, yêu cầu đăng nhập
        if (isGuest) {
            const shouldLogin = window.confirm('Bạn cần đăng nhập để thêm sản phẩm vào danh sách yêu thích. Bạn có muốn đăng nhập không?');
            if (shouldLogin) {
                window.location.href = '/login';
            }
            return;
        }

        const productPostId = product?.postId || product?.id || postId;
        if (!productPostId) {
            console.error('[useFavorite] Cannot toggle favorite: missing product or postId');
            alert('Không tìm thấy ID sản phẩm');
            return;
        }

        const productIdNum = Number(productPostId);

        if (isFavorite) {
            // Xóa khỏi wishlist
            try {
                setIsLoading(true);
                const result = await fetchWishlist({ page: 0, size: 100 });
                const wishlistItem = (result.items || []).find(
                    item => Number(item.postId || item.id) === productIdNum
                );

                if (wishlistItem && wishlistItem.wishlistId) {
                    const confirmRemove = window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?');
                    if (!confirmRemove) {
                        setIsLoading(false);
                        return;
                    }

                    await removeFromWishlist(wishlistItem.wishlistId);
                    setIsFavorite(false);
                    console.log('[useFavorite] Removed from wishlist');
                } else {
                    console.warn('[useFavorite] Could not find wishlistId to remove');
                    alert('Không tìm thấy sản phẩm trong danh sách yêu thích');
                }
            } catch (err) {
                console.error('[useFavorite] Error removing from wishlist:', err);
                const errorMsg = err?.response?.data?.message || err?.message || "Không thể xóa khỏi danh sách yêu thích";
                alert(errorMsg);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Thêm vào wishlist
            try {
                setIsLoading(true);
                const result = await addToWishlist({
                    postId: productIdNum,
                    priority: "LOW",
                    note: ""
                });
                if (result.success) {
                    setIsFavorite(true);
                    console.log('[useFavorite] Added to wishlist');
                } else {
                    console.error('[useFavorite] Failed to add to wishlist:', result.message);
                    const errorMsg = result.message || "Không thể thêm vào danh sách yêu thích";
                    alert(errorMsg);
                }
            } catch (err) {
                console.error('[useFavorite] Error adding to wishlist:', err);
                const errorMsg = err?.response?.data?.message || err?.message || "Không thể thêm vào danh sách yêu thích";
                alert(errorMsg);
            } finally {
                setIsLoading(false);
            }
        }
    }, [isFavorite, isGuest, postId]);

    return {
        isFavorite,
        isLoading,
        toggleFavorite,
        checkFavoriteStatus
    };
}

/**
 * Hook để quản lý nhiều sản phẩm cùng lúc (dùng cho danh sách)
 * @returns {Object} { getFavoriteStatus, toggleFavoriteForProduct }
 */
export function useFavoritesList() {
    const [favoritesMap, setFavoritesMap] = useState(new Map());
    const [loadingMap, setLoadingMap] = useState(new Map());
    const [isGuest, setIsGuest] = useState(true);

    // Kiểm tra trạng thái đăng nhập
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const legacyToken = localStorage.getItem('token');
        setIsGuest(!(accessToken || refreshToken || legacyToken));
    }, []);

    // Load tất cả favorites một lần
    const loadAllFavorites = useCallback(async () => {
        if (isGuest) {
            setFavoritesMap(new Map());
            return;
        }

        try {
            const result = await fetchWishlist({ page: 0, size: 1000 }); // Load nhiều để cover tất cả
            const newMap = new Map();
            (result.items || []).forEach(item => {
                const productId = Number(item.postId || item.id);
                if (productId) {
                    newMap.set(productId, {
                        isFavorite: true,
                        wishlistId: item.wishlistId
                    });
                }
            });
            setFavoritesMap(newMap);
        } catch (err) {
            console.error('[useFavoritesList] Error loading favorites:', err);
        }
    }, [isGuest]);

    // Load favorites khi component mount hoặc isGuest thay đổi
    useEffect(() => {
        loadAllFavorites();
    }, [loadAllFavorites]);

    // Lấy trạng thái favorite của một sản phẩm
    const getFavoriteStatus = useCallback((postId) => {
        if (!postId || isGuest) return false;
        const productId = Number(postId);
        return favoritesMap.get(productId)?.isFavorite || false;
    }, [favoritesMap, isGuest]);

    // Toggle favorite cho một sản phẩm
    const toggleFavoriteForProduct = useCallback(async (product) => {
        if (isGuest) {
            const shouldLogin = window.confirm('Bạn cần đăng nhập để thêm sản phẩm vào danh sách yêu thích. Bạn có muốn đăng nhập không?');
            if (shouldLogin) {
                window.location.href = '/login';
            }
            return;
        }

        const productPostId = product?.postId || product?.id;
        if (!productPostId) {
            console.error('[useFavoritesList] Cannot toggle favorite: missing product or postId');
            alert('Không tìm thấy ID sản phẩm');
            return;
        }

        const productIdNum = Number(productPostId);
        const currentStatus = getFavoriteStatus(productIdNum);
        const isLoading = loadingMap.get(productIdNum);

        if (isLoading) return; // Đang xử lý, không cho phép click lại

        try {
            setLoadingMap(prev => new Map(prev).set(productIdNum, true));

            if (currentStatus) {
                // Xóa khỏi wishlist
                const wishlistItem = favoritesMap.get(productIdNum);
                if (wishlistItem?.wishlistId) {
                    const confirmRemove = window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?');
                    if (!confirmRemove) {
                        setLoadingMap(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(productIdNum);
                            return newMap;
                        });
                        return;
                    }

                    await removeFromWishlist(wishlistItem.wishlistId);
                    setFavoritesMap(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(productIdNum);
                        return newMap;
                    });
                    console.log('[useFavoritesList] Removed from wishlist');
                } else {
                    alert('Không tìm thấy sản phẩm trong danh sách yêu thích');
                }
            } else {
                // Thêm vào wishlist
                const result = await addToWishlist({
                    postId: productIdNum,
                    priority: "LOW",
                    note: ""
                });
                if (result.success) {
                    setFavoritesMap(prev => new Map(prev).set(productIdNum, {
                        isFavorite: true,
                        wishlistId: null // Sẽ được cập nhật khi reload
                    }));
                    console.log('[useFavoritesList] Added to wishlist');
                    // Reload để lấy wishlistId
                    await loadAllFavorites();
                } else {
                    const errorMsg = result.message || "Không thể thêm vào danh sách yêu thích";
                    alert(errorMsg);
                }
            }
        } catch (err) {
            console.error('[useFavoritesList] Error toggling favorite:', err);
            const errorMsg = err?.response?.data?.message || err?.message || "Không thể thực hiện thao tác";
            alert(errorMsg);
        } finally {
            setLoadingMap(prev => {
                const newMap = new Map(prev);
                newMap.delete(productIdNum);
                return newMap;
            });
        }
    }, [isGuest, favoritesMap, getFavoriteStatus, loadingMap, loadAllFavorites]);

    return {
        getFavoriteStatus,
        toggleFavoriteForProduct,
        loadAllFavorites,
        isLoading: (postId) => loadingMap.get(Number(postId)) || false
    };
}

