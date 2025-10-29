import React, { useState } from 'react';
import EmailInput from './EmailInput';
import './EmailInputExample.css';

/**
 * Example usage of EmailInput component
 * Demonstrates comprehensive email validation
 */
const EmailInputExample = () => {
    const [email, setEmail] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Handle email change
    const handleEmailChange = (value) => {
        setEmail(value);
        setSubmitted(false);
    };

    // Handle validation result
    const handleValidation = (validation) => {
        setIsValid(validation.isValid);
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);

        if (isValid) {
            alert(`Email hợp lệ: ${email}`);
        } else {
            alert('Vui lòng kiểm tra lại email');
        }
    };

    // Handle email blur
    const handleEmailBlur = (e) => {
        console.log('Email field blurred');
    };

    return (
        <div className="email-example-container">
            <div className="email-example-card">
                <div className="email-example-header">
                    <h2>Ví dụ kiểm tra Email</h2>
                    <p>Nhập email để kiểm tra validation</p>
                </div>

                <form onSubmit={handleSubmit} className="email-example-form">
                    <div className="email-example-field">
                        <label htmlFor="email-input" className="email-example-label">
                            Email <span className="required">*</span>
                        </label>
                        <EmailInput
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={handleEmailBlur}
                            onValidation={handleValidation}
                            placeholder="Nhập email của bạn"
                            required={true}
                            realTimeValidation={true}
                            inputProps={{
                                id: 'email-input',
                                'data-testid': 'email-input'
                            }}
                        />
                    </div>

                    <div className="email-example-status">
                        <div className={`status-indicator ${isValid ? 'valid' : 'invalid'}`}>
                            <i className={`fas ${isValid ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            <span>{isValid ? 'Email hợp lệ' : 'Email chưa hợp lệ'}</span>
                        </div>
                    </div>

                    <div className="email-example-actions">
                        <button
                            type="submit"
                            className={`submit-button ${isValid ? 'enabled' : 'disabled'}`}
                            disabled={!isValid}
                        >
                            <i className="fas fa-paper-plane"></i>
                            Gửi Email
                        </button>
                    </div>

                    {submitted && (
                        <div className="email-example-result">
                            {isValid ? (
                                <div className="result-success">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Email đã được gửi thành công!</span>
                                </div>
                            ) : (
                                <div className="result-error">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <span>Vui lòng kiểm tra lại email trước khi gửi</span>
                                </div>
                            )}
                        </div>
                    )}
                </form>

                <div className="email-example-info">
                    <h3>Yêu cầu Email:</h3>
                    <ul>
                        <li>Email là bắt buộc</li>
                        <li>Định dạng email hợp lệ (user@domain.com)</li>
                        <li>Không có khoảng trắng ở đầu/cuối</li>
                        <li>Tối đa 254 ký tự</li>
                        <li>Không có hai dấu chấm liên tiếp</li>
                        <li>Chỉ có một ký tự @</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EmailInputExample;
