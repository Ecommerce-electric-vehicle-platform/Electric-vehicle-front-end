const STORAGE_KEY = 'order_confirmations';

const safeParse = (value) => {
    if (!value) return {};
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const loadStore = () => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return {};
        return safeParse(window.localStorage.getItem(STORAGE_KEY));
    } catch {
        return {};
    }
};

const writeStore = (store) => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        /* ignore */
    }
};

const normalizeId = (orderId) => {
    if (orderId == null) return '';
    return String(orderId).trim();
};

export const hasOrderConfirmedLocally = (orderId) => {
    const key = normalizeId(orderId);
    if (!key) return false;
    const store = loadStore();
    return Boolean(store[key]);
};

export const markOrderConfirmed = (orderId) => {
    const key = normalizeId(orderId);
    if (!key) return;
    const store = loadStore();
    store[key] = {
        confirmedAt: new Date().toISOString()
    };
    writeStore(store);
};

export const clearOrderConfirmation = (orderId) => {
    const key = normalizeId(orderId);
    if (!key) return;
    const store = loadStore();
    if (store[key]) {
        delete store[key];
        writeStore(store);
    }
};

