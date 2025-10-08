import React from "react";

// ✅ Hàm gộp class (thay thế cho “cn” trong TS)
function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

// ===== CARD WRAPPER =====
export function Card({ className = "", ...props }) {
    return (
        <div
            data-slot="card"
            className={cn(
                "card-base",
                className
            )}
            {...props}
        />
    );
}

// ===== CARD CONTENT =====
export function CardContent({ className = "", ...props }) {
    return (
        <div
            data-slot="card-content"
            className={cn("card-inner", className)}
            {...props}
        />
    );
}
