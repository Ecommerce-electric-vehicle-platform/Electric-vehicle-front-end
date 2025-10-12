import React from "react";

export function Button({ children, className = "", onClick }) {
    return (
        <button className={`btn-base ${className}`} onClick={onClick}>
            {children}
        </button>
    );
}
