import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Auth.css";
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
                        <h3>Lần đầu đến đây?</h3>
                        <p>
                            Khám phá <b>GreenTrade</b> — nền tảng giao dịch hàng đầu cho{" "}
                            <b>xe điện và pin đã qua sử dụng</b>. Tìm kiếm những sản phẩm chất lượng cao với giá cả phải chăng,
                            góp phần bảo vệ môi trường và tiết kiệm chi phí!
                        </p>
                        <button
                            className="btn transparent"
                            onClick={() => navigate("/signup")}
                        >
                            Đăng ký
                        </button>
                    </div>
                </div>

                <div className="panel right-panel">
                    <div className="content">
                        <h3>Chào mừng trở lại!</h3>
                        <p>
                            Chào mừng bạn quay trở lại với <b>GreenTrade</b>! Tiếp tục khám phá những
                            <b>sản phẩm xe điện và pin chất lượng</b> với giá cả hợp lý. Cộng đồng của chúng ta
                            luôn sẵn sàng hỗ trợ bạn tìm được những giao dịch tốt nhất!
                        </p>
                        <button
                            className="btn transparent"
                            onClick={() => navigate("/signin")}
                        >
                            Đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
