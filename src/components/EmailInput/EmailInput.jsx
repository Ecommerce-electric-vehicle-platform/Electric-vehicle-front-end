import React, { useState, useEffect } from 'react';
import { validateEmail, validateEmailRealTime } from '../../utils/emailValidation';
import './EmailInput.css';

/**
 * Reusable Email Input Component with comprehensive validation
 * @param {object} props - Component props
 * @param {string} props.value - Email value
 * @param {function} props.onChange - Change handler
 * @param {function} props.onBlur - Blur handler
 * @param {function} props.onValidation - Validation result handler
 * @param {string} props.placeholder - Input placeholder
 * @param {boolean} props.required - Whether email is required
 * @param {boolean} props.realTimeValidation - Enable real-time validation
 * @param {string} props.className - Additional CSS classes
 * @param {object} props.inputProps - Additional input props
 */
const EmailInput = ({
    value = '',
    onChange,
    onBlur,
    onValidation,
    placeholder = 'Nhập email của bạn',
    required = true,
    realTimeValidation = true,
    className = '',
    inputProps = {}
}) => {
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Validate email when value changes (real-time)
    useEffect(() => {
        if (realTimeValidation && hasInteracted) {
            const validation = validateEmailRealTime(value, required);
            setError(validation.error);
            if (onValidation) {
                onValidation(validation);
            }
        }
    }, [value, realTimeValidation, hasInteracted, required, onValidation]);

    // Handle input change
    const handleChange = (e) => {
        const newValue = e.target.value;
        setHasInteracted(true);

        if (onChange) {
            onChange(newValue);
        }
    };

    // Handle input blur
    const handleBlur = (e) => {
        setIsFocused(false);
        setHasInteracted(true);

        // Full validation on blur
        const validation = validateEmail(value, required);
        setError(validation.error);

        if (onValidation) {
            onValidation(validation);
        }

        if (onBlur) {
            onBlur(e);
        }
    };

    // Handle input focus
    const handleFocus = (e) => {
        setIsFocused(true);
        setHasInteracted(true);
    };

    // Get input classes
    const getInputClasses = () => {
        let classes = 'email-input';
        if (error) classes += ' email-input--error';
        if (isFocused) classes += ' email-input--focused';
        if (className) classes += ` ${className}`;
        return classes;
    };

    return (
        <div className="email-input-container">
            <div className="email-input-wrapper">
                <input
                    type="email"
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className={getInputClasses()}
                    autoComplete="email"
                    {...inputProps}
                />
                <div className="email-input-icon">
                    <i className="fas fa-envelope"></i>
                </div>
                {error && (
                    <div className="email-input-error">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailInput;
