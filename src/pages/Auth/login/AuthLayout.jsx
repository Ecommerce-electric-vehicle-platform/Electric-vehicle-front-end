import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Auth.css";
import logImg from "../../../assets/img/log.svg";
import registerImg from "../../../assets/img/register.svg";
import SignIn from "./SignIn.jsx";
import SignUp from "./SignUp.jsx";

export default function AuthLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const isSignUpMode = location.pathname === "/signup";

    return (
        <div className={`container ${isSignUpMode ? "sign-up-mode" : ""}`}>
            <div className="forms-container">
                <div className="signin-signup">
                    {isSignUpMode ? <SignUp /> : <SignIn />}
                </div>
            </div>

            {/* Panels */}
            <div className="panels-container">
                <div className="panel left-panel">
                    <div className="content">
                        <h3>New here ?</h3>
                        <p>
                            Discover <b>GreenTrade</b> — a trusted marketplace for{" "}
                            <b>second-hand EVs and batteries</b>. Drive sustainability with
                            every trade!
                        </p>
                        <button
                            className="btn transparent"
                            onClick={() => navigate("/signup")}
                        >
                            Sign up
                        </button>
                    </div>
                    <img src={registerImg} className="image" alt="Sign up" />
                </div>

                <div className="panel right-panel">
                    <div className="content">
                        <h3>One of us?</h3>
                        <p>
                            Log in to continue exploring <b>eco-friendly deals</b> and connect
                            with verified EV owners across Vietnam.
                        </p>
                        <button
                            className="btn transparent"
                            onClick={() => navigate("/signin")}
                        >
                            Sign in
                        </button>
                    </div>
                    <img src={logImg} className="image" alt="Sign in" />
                </div>
            </div>
        </div>
    );
}
