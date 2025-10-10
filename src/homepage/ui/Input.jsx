import React from "react";

export function Input({ icon, type = "text", placeholder = "", className = "" }) {
    return (
        <div className={`input-wrapper ${className}`}>
            {icon && <span className="input-icon">{icon}</span>}
            <input type={type} placeholder={placeholder} className="input-field" />
        </div>
    );
}
