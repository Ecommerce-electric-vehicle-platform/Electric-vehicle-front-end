import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Environment } from "./environments/environment.js";


// Giữ nguyên phần slick carousel
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={Environment.GG_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);


// import React from "react";
// import ReactDOM from "react-dom/client";
// import "./index.css";
// import App from "./App.jsx";

// // ✅ Thêm import GoogleOAuthProvider
// import { GoogleOAuthProvider } from "@react-oauth/google";

// // ✅ Định nghĩa clientId — thay bằng client ID thật từ Google Cloud Console
// const clientId = "YOUR_GOOGLE_CLIENT_ID";

// // 🛞 Giữ nguyên phần slick carousel
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <GoogleOAuthProvider clientId={clientId}>
//       <App />
//     </GoogleOAuthProvider>
//   </React.StrictMode>
// );
