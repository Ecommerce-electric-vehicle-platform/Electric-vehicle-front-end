import React from "react";
import logo from "../../../assets/logo/Logo 2.png";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
    const navigate = useNavigate();

    return (
        <form className="sign-up-form">
            <img src={logo} alt="GreenTrade Logo" className="gt-logo" />
            <h2 className="title">Join the Green Revolution</h2>

            <div className="input-field">
                <i className="fas fa-user"></i>
                <input type="text" placeholder="Username" />
            </div>

            <div className="input-field">
                <i className="fas fa-lock"></i>
                <input type="password" placeholder="Password" />
            </div>

            <div className="input-field">
                <i className="fas fa-envelope"></i>
                <input type="email" placeholder="Email" />
            </div>

            <label className="agree">
                <input type="checkbox" /> I agree to{" "}
                <a href="#">Terms & Privacy</a>
            </label>

            <input type="submit" value="Sign up" className="btn solid" />

            <p className="divider">
                <span>or Sign up with</span>
            </p>

            <button type="button" className="btn google-btn">
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google Icon"
                />
                Sign up with Google
            </button>

            <p className="switch-text">
                Already have an account?{" "}
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate("/signin");
                    }}
                >
                    Sign in
                </a>
            </p>
        </form>
    );
}
