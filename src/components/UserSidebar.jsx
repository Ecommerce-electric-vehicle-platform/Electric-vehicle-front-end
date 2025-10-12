"use client"
import "./UserSidebar.css"

export default function UserSidebar({ activeItem = "Personal profile", onItemClick }) {
  const menuItems = [
    "Personal profile",
    "Address book",
    "Change password",
    "My order",
    "Personal E-wallet",
    "Upgrade to Seller",
  ]

  return (
    <aside className="user-sidebar">
      <div className="sidebar-profile">
        <div className="profile-avatar">
         
        </div>
        <p className="profile-name">Fullname of user</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => onItemClick?.(item)}
            className={`nav-item ${activeItem === item ? "active" : ""}`}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  )
}
