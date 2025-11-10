import React, { createContext, useContext, useState } from "react";

//ThemeContext quản lý theme (light/dark) cho ứng dụng
const ThemeContext = createContext();

//ThemeProvider cung cấp theme cho các component con bằng cách sử dụng useContext
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-coreui-theme", newTheme); 
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
