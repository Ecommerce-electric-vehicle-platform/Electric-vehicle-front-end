/**
 * 🔤 Text normalization utilities for Vietnamese search
 * Hỗ trợ tìm kiếm có dấu và không dấu
 */

/**
 * Chuẩn hóa text tiếng Việt - loại bỏ dấu và chuyển về lowercase
 * @param {string} text - Text cần chuẩn hóa
 * @returns {string} - Text đã chuẩn hóa
 */
export function normalizeVietnameseText(text) {
    if (!text || typeof text !== 'string') return '';

    return text
        .toLowerCase()
        .normalize('NFD') // Tách ký tự và dấu
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
        .replace(/đ/g, 'd') // Thay thế đ/Đ thành d
        .replace(/Đ/g, 'd')
        .replace(/[^\w\s]/g, ' ') // Loại bỏ ký tự đặc biệt, thay bằng space
        .replace(/\s+/g, ' ') // Gộp nhiều space thành 1 space
        .trim();
}

/**
 * Kiểm tra xem text có chứa search term không (hỗ trợ có dấu và không dấu)
 * @param {string} text - Text cần kiểm tra
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @returns {boolean} - True nếu tìm thấy
 */
export function containsSearchTerm(text, searchTerm) {
    if (!text || !searchTerm) return false;

    const normalizedText = normalizeVietnameseText(text);
    const normalizedSearchTerm = normalizeVietnameseText(searchTerm);

    return normalizedText.includes(normalizedSearchTerm);
}

/**
 * Tìm kiếm trong một object sản phẩm với nhiều trường
 * @param {Object} product - Object sản phẩm
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {Array} fields - Danh sách các trường cần tìm kiếm
 * @returns {boolean} - True nếu tìm thấy trong bất kỳ trường nào
 */
export function searchInProduct(product, searchTerm, fields = ['title', 'brand', 'model', 'description', 'locationTrading', 'condition', 'manufactureYear']) {
    if (!product || !searchTerm) return false;

    const normalizedSearchTerm = normalizeVietnameseText(searchTerm);
    const searchWords = normalizedSearchTerm.split(' ').filter(word => word.length > 0);

    // Debug logging cho từ khóa "Katali"
    const isDebugMode = searchTerm.trim() === "Katali";

    return fields.some(field => {
        const fieldValue = product[field];
        if (!fieldValue) return false;

        const normalizedFieldValue = normalizeVietnameseText(fieldValue);

        // Tìm kiếm chính xác - toàn bộ search term
        if (normalizedFieldValue.includes(normalizedSearchTerm)) {
            if (isDebugMode) {
                console.log(`✅ Exact match in ${field}:`, {
                    field,
                    fieldValue,
                    normalizedFieldValue,
                    searchTerm,
                    normalizedSearchTerm
                });
            }
            return true;
        }

        // Tìm kiếm từng từ riêng lẻ - chỉ khi từ tìm kiếm có ít nhất 2 ký tự
        const wordMatch = searchWords.every(searchWord => {
            if (searchWord.length < 2) return true; // Bỏ qua từ quá ngắn

            const fieldWords = normalizedFieldValue.split(' ');
            return fieldWords.some(fieldWord => {
                // Chỉ khớp khi từ tìm kiếm có ít nhất 3 ký tự hoặc khớp chính xác
                if (searchWord.length >= 3) {
                    return fieldWord.includes(searchWord);
                } else {
                    return fieldWord === searchWord; // Khớp chính xác cho từ ngắn
                }
            });
        });

        if (isDebugMode && wordMatch) {
            console.log(`✅ Word match in ${field}:`, {
                field,
                fieldValue,
                normalizedFieldValue,
                searchWords,
                searchTerm
            });
        }

        return wordMatch;
    });
}

/**
 * Tạo search score cho sản phẩm (để sắp xếp kết quả)
 * @param {Object} product - Object sản phẩm
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @returns {number} - Điểm số (cao hơn = phù hợp hơn)
 */
export function calculateSearchScore(product, searchTerm) {
    if (!product || !searchTerm) return 0;

    const normalizedSearchTerm = normalizeVietnameseText(searchTerm);
    const searchWords = normalizedSearchTerm.split(' ').filter(word => word.length > 0);
    let score = 0;

    // Hàm tính điểm cho một trường
    const calculateFieldScore = (fieldValue, baseScore, exactMatchBonus = 0, startMatchBonus = 0) => {
        if (!fieldValue) return 0;

        const normalizedField = normalizeVietnameseText(fieldValue);
        let fieldScore = 0;

        // Kiểm tra khớp chính xác
        if (normalizedField.includes(normalizedSearchTerm)) {
            fieldScore += baseScore + exactMatchBonus;
            if (normalizedField.startsWith(normalizedSearchTerm)) {
                fieldScore += startMatchBonus;
            }
        }

        // Kiểm tra khớp từng từ riêng lẻ
        const fieldWords = normalizedField.split(' ');
        searchWords.forEach(searchWord => {
            fieldWords.forEach(fieldWord => {
                if (fieldWord.includes(searchWord)) {
                    fieldScore += baseScore * 0.3; // 30% điểm cho khớp từng từ
                    if (fieldWord.startsWith(searchWord)) {
                        fieldScore += baseScore * 0.2; // 20% bonus cho bắt đầu từ
                    }
                }
            });
        });

        return fieldScore;
    };

    // Tìm kiếm trong title (trọng số cao nhất)
    score += calculateFieldScore(product.title, 100, 50, 30);

    // Tìm kiếm trong brand
    score += calculateFieldScore(product.brand, 80, 40, 20);

    // Tìm kiếm trong model
    score += calculateFieldScore(product.model, 70, 35, 15);

    // Tìm kiếm trong condition
    score += calculateFieldScore(product.condition, 60, 30, 10);

    // Tìm kiếm trong manufactureYear
    score += calculateFieldScore(product.manufactureYear, 50, 25, 10);

    // Tìm kiếm trong description
    score += calculateFieldScore(product.description, 30, 15, 5);

    // Tìm kiếm trong location
    score += calculateFieldScore(product.locationTrading, 20, 10, 5);

    return Math.round(score);
}

/**
 * Sắp xếp danh sách sản phẩm theo độ phù hợp với search term
 * @param {Array} products - Danh sách sản phẩm
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @returns {Array} - Danh sách đã sắp xếp
 */
export function sortProductsByRelevance(products, searchTerm) {
    if (!products || !Array.isArray(products) || !searchTerm) return products;

    return [...products].sort((a, b) => {
        const scoreA = calculateSearchScore(a, searchTerm);
        const scoreB = calculateSearchScore(b, searchTerm);
        return scoreB - scoreA; // Sắp xếp giảm dần
    });
}
