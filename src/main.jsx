import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// ✨ Thêm 2 dòng này để đồng bộ với trang cũ
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



// import React from "react"
// import { createRoot } from "react-dom/client"
// import App from "./App.jsx"
// import "./index.css"

// // 🎠 Slick carousel styles
// import "slick-carousel/slick/slick.css"
// import "slick-carousel/slick/slick-theme.css"

// // 🪄 Render App
// const root = createRoot(document.getElementById("root"))
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )
