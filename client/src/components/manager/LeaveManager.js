"use client"

import { useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FaCheck, FaTimes, FaFilter } from "react-icons/fa"

const LeaveManager = ({ leaves, employees, setLeaves }) => {
  const [filter, setFilter] = useState("all")

  const getEmployeeName = (id) => {
    const employee = employees.find((emp) => emp.id === id)
    return employee ? employee.name : "Unknown"
  }

  const handleStatusChange = async (leaveId, newStatus) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/leaves/${leaveId}`, {
        status: newStatus,
      })

      setLeaves(leaves.map((leave) => (leave.id === leaveId ? res.data : leave)))

      toast.success(`Leave ${newStatus}`)
    } catch (err) {
      toast.error("Failed to update leave status")
      console.error(err)
    }
  }

  const filteredLeaves = () => {
    if (filter === "all") return leaves
    return leaves.filter((leave) => leave.status === filter)
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-yellow-500"
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Leave Tracking</h2>
        <div className="flex items-center">
          <FaFilter className="mr-2 text-gray-600" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border rounded">
            <option value="all">All Leaves</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-3 px-4 text-left">Employee</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Start Date</th>
              <th className="py-3 px-4 text-left">End Date</th>
              <th className="py-3 px-4 text-left">Reason</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves().length > 0 ? (
              filteredLeaves().map((leave) => (
                <tr key={leave.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{getEmployeeName(leave.employee_id)}</td>
                  <td className="py-3 px-4 capitalize">{leave.type}</td>
                  <td className="py-3 px-4">{new Date(leave.start_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{new Date(leave.end_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{leave.reason}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-white ${getStatusBadgeClass(leave.status)}`}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {leave.status === "pending" && (
                      <div className="flex space-x-2">
                        <button
                          className="text-green-500 hover:text-green-700"
                          onClick={() => handleStatusChange(leave.id, "approved")}
                          title="Approve"
                        >
                          <FaCheck />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleStatusChange(leave.id, "rejected")}
                          title="Reject"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-4 px-4 text-center">
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LeaveManager
