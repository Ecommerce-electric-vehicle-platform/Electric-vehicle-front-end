import React from "react";
import { Heart, MapPin } from "lucide-react";
import { Button } from "./ui/Button";

export default function ProductCard({
    image,
    title,
    price,
    location,
    condition,
    featured = false,
}) {
    return (
        <div className={`product-card ${featured ? "featured" : ""}`}>
            <div className="product-img">
                <img src={image || "/placeholder.png"} alt={title} />

                <Button className="btn-heart">
                    <Heart size={16} />
                </Button>

                {featured && <span className="badge-featured">Nổi bật</span>}
                <span className="badge-condition">{condition}</span>
            </div>

            <div className="product-info">
                <h3>{title}</h3>
                <p className="product-price">{price}</p>
                <div className="product-location">
                    <MapPin size={14} />
                    <span>{location}</span>
                </div>
            </div>
        </div>
    );
}
