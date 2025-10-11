import { Star } from "lucide-react"
import "./TestimonialsSection.css"

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Tesla Model 3 Buyer",
      content:
        "Amazing experience! The inspection report was thorough, and the entire process was transparent. Got my dream EV at a great price.",
      rating: 5,
      avatar: "/professional-woman-headshot.png",
    },
    {
      name: "Michael Chen",
      role: "Battery Seller",
      content:
        "Sold my old EV battery quickly and at a fair price. The platform made it so easy to connect with buyers. Highly recommend!",
      rating: 5,
      avatar: "/professional-man-headshot.png",
    },
    {
      name: "Emily Rodriguez",
      role: "Nissan Leaf Owner",
      content:
        "The warranty and support gave me complete peace of mind. Best decision I made for sustainable transportation!",
      rating: 5,
      avatar: "/smiling-woman-headshot.png",
    },
  ]

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <h2 className="testimonials-title">What Our Customers Say</h2>
          <p className="testimonials-description">Join thousands of satisfied customers who trust EVolt Market</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="star-icon" fill="currentColor" />
                ))}
              </div>
              <p className="testimonial-content">"{testimonial.content}"</p>
              <div className="testimonial-author">
                <img src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} className="author-avatar" />
                <div>
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-role">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
