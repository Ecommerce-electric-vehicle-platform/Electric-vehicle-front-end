import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchProducts, quickSearch } from '../../api/searchApi';
import { normalizeProduct } from '../../api/productApi';
import { ProductCard } from '../ProductCard/ProductCard';
import { normalizeVietnameseText } from '../../utils/textUtils';
import './GlobalSearch.css';

export function GlobalSearch({
    placeholder = "Tìm kiếm sản phẩm...",
    showSuggestions = true,
    maxSuggestions = 5,
    onProductClick,
    className = ""
}) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestionsList, setShowSuggestionsList] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const navigate = useNavigate();

    // Debounced search với hỗ trợ tìm kiếm có dấu và không dấu
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestionsList(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Gửi query gốc để API backend xử lý tìm kiếm có dấu/không dấu
                const results = await quickSearch(query);
                setSuggestions(results);
                setShowSuggestionsList(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Search error:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Handle input change
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
    };

    // Handle clear
    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        setShowSuggestionsList(false);
        setSelectedIndex(-1);
    };

    // Handle product click
    const handleProductClick = (product) => {
        if (onProductClick) {
            onProductClick(product);
        } else {
            navigate(`/product/${product.id}`);
        }
        setShowSuggestionsList(false);
        setQuery('');
    };

    // Handle search submit
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            // Gửi query gốc để backend xử lý tìm kiếm có dấu/không dấu
            navigate(`/products?search=${encodeURIComponent(query.trim())}`);
            setShowSuggestionsList(false);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestionsList || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleProductClick(suggestions[selectedIndex]);
                } else {
                    handleSearchSubmit(e);
                }
                break;
            case 'Escape':
                setShowSuggestionsList(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.global-search')) {
                setShowSuggestionsList(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className={`global-search ${className}`}>
            <form onSubmit={handleSearchSubmit} className="global-search__form">
                <div className="global-search__input-container">
                    <Search className="global-search__icon" size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query.trim() && setShowSuggestionsList(true)}
                        placeholder={placeholder}
                        className="global-search__input"
                        autoComplete="off"
                    />
                    {isLoading && (
                        <Loader2 className="global-search__loading" size={16} />
                    )}
                    {query && !isLoading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="global-search__clear"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestionsList && suggestions.length > 0 && (
                <div className="global-search__suggestions">
                    <div className="global-search__suggestions-header">
                        <span className="global-search__suggestions-title">
                            Kết quả tìm kiếm
                        </span>
                        <span className="global-search__suggestions-count">
                            {suggestions.length} sản phẩm
                        </span>
                    </div>

                    <div className="global-search__suggestions-list">
                        {suggestions.map((product, index) => (
                            <div
                                key={product.id}
                                className={`global-search__suggestion-item ${index === selectedIndex ? 'global-search__suggestion-item--selected' : ''
                                    }`}
                                onClick={() => handleProductClick(product)}
                            >
                                <ProductCard
                                    product={product}
                                    variant="compact"
                                    onViewDetails={() => handleProductClick(product)}
                                    showActions={false}
                                    showCondition={true}
                                    showLocation={true}
                                    showDate={false}
                                    showVerified={true}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="global-search__suggestions-footer">
                        <button
                            type="button"
                            onClick={handleSearchSubmit}
                            className="global-search__view-all"
                        >
                            <ExternalLink size={16} />
                            Xem tất cả kết quả
                        </button>
                    </div>
                </div>
            )}

            {/* No results */}
            {showSuggestionsList && !isLoading && suggestions.length === 0 && query.trim() && (
                <div className="global-search__suggestions">
                    <div className="global-search__no-results">
                        <h4 className="global-search__no-results-title">Không tìm thấy sản phẩm</h4>
                        <p className="global-search__no-results-message">
                            Không có sản phẩm nào chứa từ khóa "<strong>{query}</strong>"
                        </p>
                        <div className="global-search__no-results-suggestions">
                            <p className="global-search__suggestions-text">
                                Thử <strong>kiểm tra chính tả</strong> hoặc <strong>từ khóa ngắn gọn hơn</strong>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSearchSubmit}
                            className="global-search__view-all"
                        >
                            <ExternalLink size={16} />
                            Tìm kiếm trong tất cả sản phẩm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GlobalSearch;
