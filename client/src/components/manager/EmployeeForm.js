"use client"

import { useState, useEffect } from "react"

const EmployeeForm = ({ employee, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    joining_date: "",
    base_salary: "",
  })

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        password: "",
        role: employee.role,
        joining_date: new Date(employee.joining_date).toISOString().split("T")[0],
        base_salary: employee.base_salary,
      })
    }
  }, [employee])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "base_salary" ? Number.parseFloat(value) || "" : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">{employee ? "Edit Employee" : "Add Employee"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Password {employee && "(Leave blank to keep current)"}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required={!employee}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="hr">HR</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Joining Date</label>
            <input
              type="date"
              name="joining_date"
              value={formData.joining_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Base Salary</label>
            <input
              type="number"
              name="base_salary"
              value={formData.base_salary}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 mr-2">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
              {employee ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EmployeeForm
