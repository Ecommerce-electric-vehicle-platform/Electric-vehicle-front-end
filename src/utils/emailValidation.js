/**
 * Email validation utility functions
 * Comprehensive email validation with clear error messages
 */

/**
 * Validates email format using regex
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Comprehensive email validation
 * @param {string} email - Email to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
    // 1. Check if not empty (Required)
    if (!email || email.trim() === '') {
        return {
            isValid: false,
            error: 'Email là bắt buộc.'
        };
    }

    // 2. Check for leading/trailing whitespace
    if (email !== email.trim()) {
        return {
            isValid: false,
            error: 'Email không được có khoảng trắng ở đầu hoặc cuối.'
        };
    }

    // 3. Check length (max 254 characters)
    if (email.length > 254) {
        return {
            isValid: false,
            error: 'Email không được vượt quá 254 ký tự.'
        };
    }

    // 4. Check email format using regex
    if (!isValidEmailFormat(email)) {
        return {
            isValid: false,
            error: 'Email không đúng định dạng. Ví dụ: user@example.com'
        };
    }

    // 5. Additional checks for common issues
    if (email.includes('..')) {
        return {
            isValid: false,
            error: 'Email không được chứa hai dấu chấm liên tiếp.'
        };
    }

    if (email.startsWith('.') || email.endsWith('.')) {
        return {
            isValid: false,
            error: 'Email không được bắt đầu hoặc kết thúc bằng dấu chấm.'
        };
    }

    if (email.split('@').length !== 2) {
        return {
            isValid: false,
            error: 'Email chỉ được có một ký tự @.'
        };
    }

    // All validations passed
    return {
        isValid: true,
        error: ''
    };
};

/**
 * Real-time email validation for input field
 * @param {string} email - Email to validate
 * @param {boolean} isRequired - Whether email is required
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateEmailRealTime = (email, isRequired = true) => {
    // If empty and not required, it's valid
    if (!email || email.trim() === '') {
        if (!isRequired) {
            return { isValid: true, error: '' };
        }
        return { isValid: false, error: 'Email là bắt buộc.' };
    }

    // For real-time validation, be less strict about empty fields
    // Only show errors when user has started typing
    if (email.length === 0) {
        return { isValid: true, error: '' };
    }

    // Check for whitespace issues
    if (email !== email.trim()) {
        return {
            isValid: false,
            error: 'Email không được có khoảng trắng ở đầu hoặc cuối.'
        };
    }

    // Check length
    if (email.length > 254) {
        return {
            isValid: false,
            error: 'Email không được vượt quá 254 ký tự.'
        };
    }

    // Check for obvious format issues
    if (email.includes('..')) {
        return {
            isValid: false,
            error: 'Email không được chứa hai dấu chấm liên tiếp.'
        };
    }

    if (email.startsWith('.') || email.endsWith('.')) {
        return {
            isValid: false,
            error: 'Email không được bắt đầu hoặc kết thúc bằng dấu chấm.'
        };
    }

    if (email.split('@').length > 2) {
        return {
            isValid: false,
            error: 'Email chỉ được có một ký tự @.'
        };
    }

    // If email looks complete, validate format
    if (email.includes('@') && email.includes('.')) {
        if (!isValidEmailFormat(email)) {
            return {
                isValid: false,
                error: 'Email không đúng định dạng. Ví dụ: user@example.com'
            };
        }
    }

    return { isValid: true, error: '' };
};
