const BATTERY_KEYWORDS = [
    "pin",
    "ac quy",
    "ắc quy",
    "battery",
    "batteries",
    "pack pin",
    "cell pin",
    "pin xe",
    "pin litium",
    "pin lithium",
    "pin xe dien",
];

const VEHICLE_KEYWORDS = [
    "xe điện",
    "xe dien",
    "xe máy điện",
    "xe may dien",
    "xe máy",
    "xe may",
    "xe đạp điện",
    "xe dap dien",
    "xe đạp",
    "xe dap",
    "xe scooter",
    "scooter",
    "motor",
    "motorbike",
    "motorcycle",
    "bike",
    "bicycle",
    "xe ô tô",
    "xe oto",
    "ô tô",
    "oto",
    "car",
    "vehicle",
];

export const PRODUCT_TYPE_FILTERS = {
    ALL: "all",
    VEHICLE: "vehicle",
    BATTERY: "battery",
};

const CATEGORY_ID_MAP = {
    1: PRODUCT_TYPE_FILTERS.VEHICLE,
    2: PRODUCT_TYPE_FILTERS.BATTERY,
};

export const removeDiacritics = (text) => {
    if (!text) return "";
    return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
};

const getNumericCategoryId = (product) => {
    const candidates = [
        product?.categoryId,
        product?.category_id,
        product?.category,
        product?._raw?.categoryId,
        product?._raw?.category_id,
        product?._raw?.category,
        product?._raw?.categorySlug,
        product?._raw?.categoryName,
    ];

    for (const candidate of candidates) {
        if (candidate === null || candidate === undefined) continue;

        if (typeof candidate === "number" && Number.isFinite(candidate)) {
            return candidate;
        }

        if (typeof candidate === "string") {
            const trimmed = candidate.trim();
            if (/^\d+$/.test(trimmed)) {
                return Number(trimmed);
            }
        }

        if (typeof candidate === "object" && candidate !== null) {
            const nested = getNumericCategoryId(candidate);
            if (nested) return nested;
        }
    }
    return null;
};

export const detectProductType = (product) => {
    if (!product || typeof product !== "object") return "unknown";
    const categoryCandidates = [];

    const pushCategoryCandidate = (value) => {
        if (!value) return;
        if (typeof value === "string") {
            categoryCandidates.push(value);
        } else if (typeof value === "number") {
            categoryCandidates.push(String(value));
        } else if (typeof value === "object") {
            if (value?.name) categoryCandidates.push(value.name);
            if (value?.slug) categoryCandidates.push(value.slug);
            if (value?.title) categoryCandidates.push(value.title);
        }
    };

    pushCategoryCandidate(product.categoryName);
    pushCategoryCandidate(product.category);
    pushCategoryCandidate(product._raw?.categoryName);
    pushCategoryCandidate(product._raw?.category);
    pushCategoryCandidate(product._raw?.categorySlug);
    pushCategoryCandidate(product._raw?.productType);

    const numericCategoryId = getNumericCategoryId(product);
    if (numericCategoryId != null && CATEGORY_ID_MAP[numericCategoryId]) {
        return CATEGORY_ID_MAP[numericCategoryId];
    }

    const normalizedCategories = categoryCandidates
        .map((value) => removeDiacritics(value).toLowerCase())
        .filter(Boolean);

    const categoryMatchesBattery = normalizedCategories.some((category) =>
        ["pin", "battery", "ac quy", "ắc quy"].some((keyword) =>
            category.includes(keyword)
        )
    );

    if (categoryMatchesBattery) {
        return PRODUCT_TYPE_FILTERS.BATTERY;
    }

    const categoryMatchesVehicle = normalizedCategories.some((category) =>
        ["xe", "vehicle", "motor", "bike", "car", "oto", "ô tô"].some(
            (keyword) => category.includes(keyword)
        )
    );

    if (categoryMatchesVehicle) {
        return PRODUCT_TYPE_FILTERS.VEHICLE;
    }

    const textSources = [
        product.title,
        product.description,
        product.brand,
        product.model,
    ]
        .map((field) =>
            removeDiacritics(field ? String(field).toLowerCase() : "")
        )
        .filter(Boolean);

    if (textSources.length === 0) return "unknown";

    const combined = textSources.join(" ");
    const hasBatteryKeyword = BATTERY_KEYWORDS.some((keyword) =>
        combined.includes(keyword)
    );
    const hasVehicleKeyword = VEHICLE_KEYWORDS.some((keyword) =>
        combined.includes(keyword)
    );

    if (hasBatteryKeyword && !hasVehicleKeyword) {
        return PRODUCT_TYPE_FILTERS.BATTERY;
    }

    if (hasVehicleKeyword && !hasBatteryKeyword) {
        return PRODUCT_TYPE_FILTERS.VEHICLE;
    }

    if (hasBatteryKeyword && hasVehicleKeyword) {
        const findFirstIndex = (keywords) => {
            let firstIndex = -1;
            keywords.forEach((keyword) => {
                const idx = combined.indexOf(keyword);
                if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
                    firstIndex = idx;
                }
            });
            return firstIndex;
        };

        const firstBatteryIndex = findFirstIndex(BATTERY_KEYWORDS);
        const firstVehicleIndex = findFirstIndex(VEHICLE_KEYWORDS);

        if (firstBatteryIndex === -1 && firstVehicleIndex !== -1) {
            return PRODUCT_TYPE_FILTERS.VEHICLE;
        }
        if (firstVehicleIndex === -1 && firstBatteryIndex !== -1) {
            return PRODUCT_TYPE_FILTERS.BATTERY;
        }

        if (
            firstBatteryIndex !== -1 &&
            firstVehicleIndex !== -1 &&
            firstBatteryIndex < firstVehicleIndex
        ) {
            return PRODUCT_TYPE_FILTERS.BATTERY;
        }
        if (
            firstBatteryIndex !== -1 &&
            firstVehicleIndex !== -1 &&
            firstVehicleIndex < firstBatteryIndex
        ) {
            return PRODUCT_TYPE_FILTERS.VEHICLE;
        }
    }

    return "unknown";
};

export const matchesProductTypeFilter = (product, filter) => {
    if (filter === PRODUCT_TYPE_FILTERS.ALL) return true;
    const productType = detectProductType(product);
    if (filter === PRODUCT_TYPE_FILTERS.BATTERY) {
        return productType === PRODUCT_TYPE_FILTERS.BATTERY;
    }
    if (filter === PRODUCT_TYPE_FILTERS.VEHICLE) {
        return (
            productType === PRODUCT_TYPE_FILTERS.VEHICLE ||
            productType === "unknown"
        );
    }
    return true;
};


