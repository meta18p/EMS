"use client"

import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import { toast } from "react-toastify"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState("employee")
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const user = await login(email, password)

      // Check if the user's role matches the selected role
      if (user.role !== selectedRole) {
        toast.warning(`You've logged in as a ${user.role}, not as a ${selectedRole}`)
      }

      toast.success("Login successful!")

      // Redirect based on actual user role, not selected role
      if (user.role === "manager") {
        navigate("/manager")
      } else {
        navigate("/employee")
      }
    } catch (err) {
      toast.error(err.message || "Login failed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Employee Management System</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Login As</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="employee"
                  checked={selectedRole === "employee"}
                  onChange={() => setSelectedRole("employee")}
                  className="mr-2"
                />
                <span>Employee</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="manager"
                  checked={selectedRole === "manager"}
                  onChange={() => setSelectedRole("manager")}
                  className="mr-2"
                />
                <span>Manager</span>
              </label>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
            Login
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
          <p>Demo Accounts:</p>
          <p>Manager: manager@example.com / password123</p>
          <p>Employee: employee@example.com / password123</p>
        </div>
      </div>
    </div>
  )
}

export default Login
