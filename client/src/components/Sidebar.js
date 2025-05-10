"use client"

import { useState } from "react"
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import {
  FaBars,
  FaTimes,
  FaUserAlt,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaClipboardList,
  FaChartLine,
  FaBell,
  FaSignOutAlt,
} from "react-icons/fa"

const Sidebar = ({ onMenuSelect }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useContext(AuthContext)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleMenuClick = (menuItem) => {
    onMenuSelect(menuItem)
    if (window.innerWidth < 768) {
      setIsOpen(false)
    }
  }

  return (
    <>
      <button className="fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-500 text-white" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-40 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-5">
          <div className="flex items-center justify-center mb-6 mt-8">
            <div className="text-center">
              <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
              <p className="text-sm text-gray-400 capitalize">{user?.role || "Role"}</p>
            </div>
          </div>

          <nav>
            <ul className="space-y-2">
              <li>
                <button
                  className="flex items-center w-full p-3 rounded hover:bg-gray-700"
                  onClick={() => handleMenuClick("employees")}
                >
                  <FaUserAlt className="mr-3" />
                  <span>Employees</span>
                </button>
              </li>
              <li>
                <button
                  className="flex items-center w-full p-3 rounded hover:bg-gray-700"
                  onClick={() => handleMenuClick("attendance")}
                >
                  <FaCalendarCheck className="mr-3" />
                  <span>Attendance</span>
                </button>
              </li>
              <li>
                <button
                  className="flex items-center w-full p-3 rounded hover:bg-gray-700"
                  onClick={() => handleMenuClick("salary")}
                >
                  <FaMoneyBillWave className="mr-3" />
                  <span>Salary</span>
                </button>
              </li>
              <li>
                <button
                  className="flex items-center w-full p-3 rounded hover:bg-gray-700"
                  onClick={() => handleMenuClick("leaves")}
                >
                  <FaClipboardList className="mr-3" />
                  <span>Leaves</span>
                </button>
              </li>
              <li>
                <button
                  className="flex items-center w-full p-3 rounded hover:bg-gray-700"
                  onClick={() => handleMenuClick("performance")}
                >
                  <FaChartLine className="mr-3" />
                  <span>Performance</span>
                </button>
              </li>
              <li>
                <button
                  className="flex items-center w-full p-3 rounded hover:bg-gray-700"
                  onClick={() => handleMenuClick("alerts")}
                >
                  <FaBell className="mr-3" />
                  <span>Alerts</span>
                </button>
              </li>
              <li className="mt-8">
                <button
                  className="flex items-center w-full p-3 rounded hover:bg-gray-700 text-red-400"
                  onClick={logout}
                >
                  <FaSignOutAlt className="mr-3" />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay to close sidebar on mobile */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={toggleSidebar}></div>}
    </>
  )
}

export default Sidebar
