"use client"

import { useContext } from "react"
import { FaSun, FaMoon } from "react-icons/fa"
import { ThemeContext } from "../context/ThemeContext"

const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext)

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
    </button>
  )
}

export default DarkModeToggle
