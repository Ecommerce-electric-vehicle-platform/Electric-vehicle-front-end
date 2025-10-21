"use client"

import "./SellerBuyPackage.css"

export default function SellerBuyPackage() {
  const packages = [
    {
      id: "standard",
      name: "Standard package",
      subtitle: "For Individuals Trying Out",
      color: "standard",
      features: [
        {
          title: "Management & Products",
          description: "up to 30 products, maximum 7 images/product.",
        },
        {
          title: "Visibility & Branding",
          description:
            'products get priority display within their product category (e.g., in "Electric Batteries," Pro shops rank higher than Standard).',
        },
        {
          title: "Support & Fees",
          description:
            "faster response than Standard (via email/chat, or hotline during business hours). Revenue commission ~5%.",
        },
      ],
      pricing: [
        { duration: "1 month", price: "200,000 VND" },
        { duration: "3 months", price: "540,000 VND" },
        { duration: "6 months", price: "900,000 VND" },
      ],
    },
    {
      id: "pro",
      name: "Pro Package",
      subtitle: "For Small Businesses",
      color: "pro",
      features: [
        {
          title: "Management & Products",
          description: "up to 30 products, maximum 7 images/product.",
        },
        {
          title: "Visibility & Branding",
          description:
            'products get priority display within their product category (e.g., in "Electric Batteries," Pro shops rank higher than Standard).',
        },
        {
          title: "Support & Fees",
          description: "faster response than Standard (via email/chat during business hours). Revenue commission ~5%.",
        },
      ],
      pricing: [
        { duration: "1 month", price: "400,000 VND" },
        { duration: "3 months", price: "1,080,000 VND" },
        { duration: "6 months", price: "1,800,000 VND" },
      ],
    },
    {
      id: "vip",
      name: "VIP Package",
      subtitle: "For Enterprises Benefits",
      color: "vip",
      features: [
        {
          title: "Management & Products",
          description: "up to 100 products, maximum 10 images/product; new product listings get priority approval.",
        },
        {
          title: "Visibility & Branding",
          description:
            "products get higher priority in overall search results; option to display brand logo on the store page.",
        },
        {
          title: "Support & Fees",
          description: "24/7 priority support, fastest response time. Revenue commission ~3%.",
        },
      ],
      pricing: [
        { duration: "1 month", price: "1,200,000 VND" },
        { duration: "3 months", price: "3,240,000 VND" },
        { duration: "6 months", price: "5,400,000 VND" },
      ],
    },
  ]

  return (
    <div className="seller-package-container">
      <h1 className="package-title">Seller business package</h1>

      <div className="packages-grid">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`package-card ${pkg.color}`}>
            <div className="package-header">
              <h2 className="package-name">{pkg.name}</h2>
              <p className="package-subtitle">{pkg.subtitle}</p>
            </div>

            <div className="package-features">
              {pkg.features.map((feature, idx) => (
                <div key={idx} className="feature">
                  <h3 className="feature-title">{feature.title}:</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="package-pricing">
              {pkg.pricing.map((price, idx) => (
                <button key={idx} className="price-button">
                  {price.price} / {price.duration}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
