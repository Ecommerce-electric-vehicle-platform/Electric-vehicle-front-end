const STORAGE_KEY = 'favorites_items';

export function getFavorites() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function saveFavorites(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function isFavorite(productId) {
    return getFavorites().some((x) => x.id === productId);
}

export function toggleFavorite(product) {
    const items = getFavorites();
    const exists = items.some((x) => x.id === product.id);
    let next;
    if (exists) {
        next = items.filter((x) => x.id !== product.id);
    } else {
        const payload = {
            id: product.id,
            title: product.title,
            price: product.price,
            type: product.type || (product.batteryType ? 'battery' : 'vehicle'),
            thumbnail: product.image || product.thumbnail,
            condition: product.condition || product.conditionLevel || 'Đã qua sử dụng',
            warranty: product.warranty || product.guarantee || '1 tháng',
            meta: product.meta || {},
        };
        next = [payload, ...items];
    }
    saveFavorites(next);
    return !exists;
}


