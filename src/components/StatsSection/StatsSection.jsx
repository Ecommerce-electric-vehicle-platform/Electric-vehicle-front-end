import "./StatsSection.css"

export function StatsSection() {
  const stats = [
    { value: "10,000+", label: "Happy Customers" },
    { value: "5,000+", label: "Vehicles Sold" },
    { value: "2,500+", label: "Batteries Traded" },
    { value: "50+", label: "Cities Covered" },
  ]

  return (
    <section className="stats-section">
      <div className="stats-container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
