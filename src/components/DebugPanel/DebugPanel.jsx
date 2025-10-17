import React, { useState } from 'react';
import { Settings, Wallet, Package, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import './DebugPanel.css';

function DebugPanel({ isOpen, onClose }) {
    const [walletStatus, setWalletStatus] = useState(localStorage.getItem('walletLinked') || 'true');
    const [productScenario, setProductScenario] = useState(localStorage.getItem('testProductScenario') || 'available');
    const [multipleSellers, setMultipleSellers] = useState(localStorage.getItem('testMultipleSellers') || 'false');

    const handleWalletChange = (value) => {
        setWalletStatus(value);
        localStorage.setItem('walletLinked', value);
    };

    const handleProductScenarioChange = (value) => {
        setProductScenario(value);
        localStorage.setItem('testProductScenario', value);
    };

    const handleMultipleSellersChange = (value) => {
        setMultipleSellers(value);
        localStorage.setItem('testMultipleSellers', value);
    };

    const resetToDefault = () => {
        localStorage.setItem('walletLinked', 'true');
        localStorage.setItem('testProductScenario', 'available');
        localStorage.setItem('testMultipleSellers', 'false');
        setWalletStatus('true');
        setProductScenario('available');
        setMultipleSellers('false');
    };

    if (!isOpen) return null;

    return (
        <div className="debug-overlay" onClick={onClose}>
            <div className="debug-panel" onClick={(e) => e.stopPropagation()}>
                <div className="debug-header">
                    <div className="debug-title">
                        <Settings size={20} />
                        <span>Debug Panel - Test Scenarios</span>
                    </div>
                    <button className="debug-close" onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="debug-content">
                    {/* Wallet Status */}
                    <div className="debug-section">
                        <div className="debug-section-title">
                            <Wallet size={16} />
                            <span>Trạng thái ví điện tử</span>
                        </div>
                        <div className="debug-options">
                            <label className="debug-option">
                                <input
                                    type="radio"
                                    name="wallet"
                                    value="true"
                                    checked={walletStatus === 'true'}
                                    onChange={(e) => handleWalletChange(e.target.value)}
                                />
                                <span className="option-label">
                                    <CheckCircle size={14} color="#28a745" />
                                    Đã liên kết ví
                                </span>
                            </label>
                            <label className="debug-option">
                                <input
                                    type="radio"
                                    name="wallet"
                                    value="false"
                                    checked={walletStatus === 'false'}
                                    onChange={(e) => handleWalletChange(e.target.value)}
                                />
                                <span className="option-label">
                                    <XCircle size={14} color="#dc3545" />
                                    Chưa liên kết ví
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Product Availability */}
                    <div className="debug-section">
                        <div className="debug-section-title">
                            <Package size={16} />
                            <span>Trạng thái sản phẩm</span>
                        </div>
                        <div className="debug-options">
                            <label className="debug-option">
                                <input
                                    type="radio"
                                    name="product"
                                    value="available"
                                    checked={productScenario === 'available'}
                                    onChange={(e) => handleProductScenarioChange(e.target.value)}
                                />
                                <span className="option-label">
                                    <CheckCircle size={14} color="#28a745" />
                                    Còn hàng
                                </span>
                            </label>
                            <label className="debug-option">
                                <input
                                    type="radio"
                                    name="product"
                                    value="sold"
                                    checked={productScenario === 'sold'}
                                    onChange={(e) => handleProductScenarioChange(e.target.value)}
                                />
                                <span className="option-label">
                                    <XCircle size={14} color="#dc3545" />
                                    Đã bán
                                </span>
                            </label>
                            <label className="debug-option">
                                <input
                                    type="radio"
                                    name="product"
                                    value="unavailable"
                                    checked={productScenario === 'unavailable'}
                                    onChange={(e) => handleProductScenarioChange(e.target.value)}
                                />
                                <span className="option-label">
                                    <XCircle size={14} color="#ffc107" />
                                    Tạm hết hàng
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Multiple Sellers */}
                    <div className="debug-section">
                        <div className="debug-section-title">
                            <ShoppingCart size={16} />
                            <span>Giỏ hàng</span>
                        </div>
                        <div className="debug-options">
                            <label className="debug-option">
                                <input
                                    type="radio"
                                    name="sellers"
                                    value="false"
                                    checked={multipleSellers === 'false'}
                                    onChange={(e) => handleMultipleSellersChange(e.target.value)}
                                />
                                <span className="option-label">
                                    <CheckCircle size={14} color="#28a745" />
                                    1 người bán
                                </span>
                            </label>
                            <label className="debug-option">
                                <input
                                    type="radio"
                                    name="sellers"
                                    value="true"
                                    checked={multipleSellers === 'true'}
                                    onChange={(e) => handleMultipleSellersChange(e.target.value)}
                                />
                                <span className="option-label">
                                    <XCircle size={14} color="#dc3545" />
                                    Nhiều người bán
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="debug-actions">
                        <button className="debug-btn debug-btn-reset" onClick={resetToDefault}>
                            Reset về mặc định
                        </button>
                        <button className="debug-btn debug-btn-close" onClick={onClose}>
                            Đóng
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="debug-instructions">
                        <h4>Hướng dẫn test:</h4>
                        <ol>
                            <li>Chọn các trường hợp muốn test</li>
                            <li>Refresh trang để áp dụng</li>
                            <li>Click "Mua ngay" để xem flow</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DebugPanel;
