"use client"

import { useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FaPlus, FaTrash, FaBell } from "react-icons/fa"

const AlertsManager = ({ alerts, employees, setAlerts }) => {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    employee_id: "",
    date: new Date().toISOString().split("T")[0],
  })

  const handleAddClick = () => {
    setFormData({
      title: "",
      message: "",
      employee_id: "",
      date: new Date().toISOString().split("T")[0],
    })
    setShowModal(true)
  }

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this alert?")) {
      try {
        await axios.delete(`http://localhost:5000/api/alerts/${id}`)
        setAlerts(alerts.filter((alert) => alert.id !== id))
        toast.success("Alert deleted successfully")
      } catch (err) {
        toast.error("Failed to delete alert")
        console.error(err)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const res = await axios.post("http://localhost:5000/api/alerts", formData)
      setAlerts([...alerts, res.data])
      toast.success("Alert created successfully")
      setShowModal(false)
    } catch (err) {
      toast.error("Failed to create alert")
      console.error(err)
    }
  }

  const getEmployeeName = (id) => {
    if (id === "all") return "All Employees"
    const employee = employees.find((emp) => emp.id === id)
    return employee ? employee.name : "Unknown"
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Alerts and Reminders</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center" onClick={handleAddClick}>
          <FaPlus className="mr-2" /> Add Alert
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <FaBell className="text-blue-500 mr-2" />
                  <h3 className="font-semibold">{alert.title}</h3>
                </div>
                <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteClick(alert.id)}>
                  <FaTrash />
                </button>
              </div>
              <p className="text-gray-600 mt-2">{alert.message}</p>
              <div className="mt-4 text-sm text-gray-500 flex justify-between">
                <span>For: {getEmployeeName(alert.employee_id)}</span>
                <span>Date: {new Date(alert.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">No alerts or reminders found</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Alert</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">For</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select recipient</option>
                  <option value="all">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 mr-2">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertsManager
