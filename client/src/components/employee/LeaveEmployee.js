"use client"

import { useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FaPlus, FaCalendarPlus } from "react-icons/fa"

const LeaveEmployee = ({ leaves, setLeaves, userId }) => {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    type: "paid",
    start_date: "",
    end_date: "",
    reason: "",
  })

  const handleAddClick = () => {
    setFormData({
      type: "paid",
      start_date: "",
      end_date: "",
      reason: "",
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const res = await axios.post("http://localhost:5000/api/leaves", {
        ...formData,
        employee_id: userId,
        status: "pending",
      })

      setLeaves([...leaves, res.data])
      toast.success("Leave request submitted successfully")
      setShowModal(false)
    } catch (err) {
      toast.error("Failed to submit leave request")
      console.error(err)
    }
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
        <h2 className="text-xl font-semibold">Leave Requests</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center" onClick={handleAddClick}>
          <FaPlus className="mr-2" /> Apply for Leave
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium mb-4">My Leave History</h3>

        {leaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Start Date</th>
                  <th className="py-3 px-4 text-left">End Date</th>
                  <th className="py-3 px-4 text-left">Reason</th>
                  <th className="py-3 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...leaves]
                  .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                  .map((leave) => (
                    <tr key={leave.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 capitalize">{leave.type}</td>
                      <td className="py-3 px-4">{new Date(leave.start_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{new Date(leave.end_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{leave.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-white ${getStatusBadgeClass(leave.status)}`}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No leave requests found</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <div className="flex items-center mb-4">
              <FaCalendarPlus className="text-blue-500 mr-2" size={20} />
              <h2 className="text-xl font-semibold">Apply for Leave</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Leave Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  min={formData.start_date}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 mr-2">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveEmployee
