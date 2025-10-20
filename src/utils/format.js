export function formatCurrency(value, locale = "vi-VN", currency = "VND") {
    const number = Number(value) || 0;

    // Nếu giá < 1000, có thể là triệu VND, nhân với 1,000,000
    // Nếu giá >= 1000, có thể đã là VND
    const finalValue = number < 1000 ? number * 1000000 : number;

    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(finalValue);
}


