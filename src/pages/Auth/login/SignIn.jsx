import React from "react";
import logo from "../../../assets/logo/Logo 2.png";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
    const navigate = useNavigate();

    return (
        <form className="sign-in-form">
            <img src={logo} alt="GreenTrade Logo" className="gt-logo" />
            <h2 className="title">Sign in</h2>

            <div className="input-field">
                <i className="fas fa-user"></i>
                <input type="text" placeholder="Username or Email" />
            </div>

            <div className="input-field">
                <i className="fas fa-lock"></i>
                <input type="password" placeholder="Password" />
            </div>

            <a href="#" className="forgot-password">Forgot password?</a>


            <input type="submit" value="Sign in" className="btn solid" />

            <p className="divider">
                <span>or Sign in with</span>
            </p>

            <button type="button" className="btn google-btn">
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google Icon"
                />
                Sign in with Google
            </button>

            <p className="switch-text">
                Don’t have an account?{" "}
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate("/signup");
                    }}
                >
                    Sign up
                </a>
            </p>
        </form>
    );
}
