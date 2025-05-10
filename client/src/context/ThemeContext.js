"use client"

import { createContext, useState, useEffect } from "react"

export const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has previously set a preference
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      return savedTheme === "dark"
    }
    // Otherwise check for system preference
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem("theme", darkMode ? "dark" : "light")

    // Update document class for styling
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
