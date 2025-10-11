import { Search, FileCheck, Handshake, Truck } from "lucide-react"
import "./HowItWorksSection.css"

export function HowItWorksSection() {
  const steps = [
    {
      icon: Search,
      title: "Browse & Search",
      description: "Explore our extensive inventory of certified pre-owned EVs and batteries with advanced filters.",
    },
    {
      icon: FileCheck,
      title: "Verify & Inspect",
      description: "Review detailed inspection reports, battery health data, and vehicle history.",
    },
    {
      icon: Handshake,
      title: "Connect & Negotiate",
      description: "Communicate directly with sellers and negotiate the best deal for your needs.",
    },
    {
      icon: Truck,
      title: "Complete & Deliver",
      description: "Finalize the transaction securely and arrange convenient delivery or pickup.",
    },
  ]

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="how-it-works-container">
        <div className="how-it-works-header">
          <h2 className="how-it-works-title">How It Works</h2>
          <p className="how-it-works-description">Simple, transparent, and secure process from start to finish</p>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="step-wrapper">
                <div className="step-card">
                  <div className="step-number">{index + 1}</div>
                  <div className="step-icon-wrapper">
                    <Icon className="step-icon" />
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
                {index < steps.length - 1 && <div className="step-connector"></div>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
