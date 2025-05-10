import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Pages
import Login from "./pages/Login"
import ManagerDashboard from "./pages/ManagerDashboard"
import EmployeeDashboard from "./pages/EmployeeDashboard"

// Context
import { AuthProvider } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
