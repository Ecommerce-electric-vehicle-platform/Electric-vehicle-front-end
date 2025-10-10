import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("light");

    // Gắn class vào body để đổi nền tổng thể
    useEffect(() => {
        document.body.className = theme === "dark" ? "dark-mode" : "light-mode";
    }, [theme]);

    const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

import { useTheme } from "./ThemeProvider";
const { theme, toggleTheme } = useTheme();
<button onClick={toggleTheme}>Chuyển {theme === "light" ? "Dark" : "Light"} Mode</button>
