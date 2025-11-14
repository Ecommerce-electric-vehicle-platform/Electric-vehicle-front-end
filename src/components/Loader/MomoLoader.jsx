import "./MomoLoader.css";

export default function MomoLoader({ message = "Đang xử lý..." }) {
    return (
        <div className="momo-loader-overlay">
            <div className="momo-loader-container">
                <div className="momo-loader">
                    <div className="momo-loader-circle"></div>
                    <div className="momo-loader-circle"></div>
                    <div className="momo-loader-circle"></div>
                </div>
                <div className="momo-loader-text">{message}</div>
            </div>
        </div>
    );
}

