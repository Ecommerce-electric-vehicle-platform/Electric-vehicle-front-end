"use client"

import { useState } from "react"
import UserSidebar from "./UserSidebar"
import PersonalProfileForm from "./PersonalProfileForm"
import "./PersonalProfilePage.css"
import ChangePassword from "./ChangePassword"
import UpgradeToSeller from "./UpgradeToSeller"
import AddressBook from "./AddressBook"

export default function PersonalProfilePage() {
  const [activeSection, setActiveSection] = useState("Personal profile")

  return (
    <div className="profile-page">
      <UserSidebar activeItem={activeSection} onItemClick={setActiveSection} />

      <main className="main-content">
        {activeSection === "Personal profile" && <PersonalProfileForm />}
        {activeSection === "Address book" && <AddressBook />}
        {activeSection === "Change password" && <ChangePassword />}
        {activeSection === "My order" && <div>My order content coming soon...</div>}
        {activeSection === "Personal E-wallet" && <div>Personal E-wallet content coming soon...</div>}
        {activeSection === "Upgrade to Seller" && <UpgradeToSeller />}
      </main>
    </div>
  )
}
