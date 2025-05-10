"use client"

import { useState, useEffect, useContext } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FaCalendarAlt, FaUserAlt, FaSearch, FaSpinner } from "react-icons/fa"
import { SocketContext } from "../../context/SocketContext"

const AttendanceManager = ({ attendance, employees, setAttendance }) => {
  const [viewMode, setViewMode] = useState("byDate")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const { socket, connected } = useContext(SocketContext)

  useEffect(() => {
    if (!socket || !connected) return

    // Listen for real-time attendance updates
    const handleAttendanceUpdate = (updatedAttendance) => {
      setAttendance((prevAttendance) => {
        const exists = prevAttendance.some((a) => a.id === updatedAttendance.id)
        if (exists) {
          return prevAttendance.map((a) => (a.id === updatedAttendance.id ? updatedAttendance : a))
        } else {
          return [...prevAttendance, updatedAttendance]
        }
      })

      const employee = employees.find((emp) => emp.id === updatedAttendance.employee_id)
      const employeeName = employee ? employee.name : "An employee"
      toast.info(`${employeeName}'s attendance has been updated`)
    }

    socket.on("attendance_update", handleAttendanceUpdate)

    return () => {
      socket.off("attendance_update", handleAttendanceUpdate)
    }
  }, [socket, connected, setAttendance, employees])

  const handleStatusChange = async (attendanceId, newStatus) => {
    try {
      setLoading(true)
      const attendanceRecord = attendance.find((item) => item.id === attendanceId)

      const res = await axios.put(`http://localhost:5000/api/attendance/${attendanceId}`, {
        status: newStatus,
        overtime_hours: attendanceRecord.overtime_hours,
        check_in_time: attendanceRecord.check_in_time,
        check_out_time: attendanceRecord.check_out_time,
      })

      // Update local state immediately for responsive UI
      setAttendance(attendance.map((item) => (item.id === attendanceId ? res.data : item)))

      // Emit socket event for real-time update
      if (socket && connected) {
        socket.emit("attendance_update", res.data)
      }

      toast.success("Attendance status updated")
      setLoading(false)
    } catch (err) {
      toast.error("Failed to update attendance status")
      console.error(err)
      setLoading(false)
    }
  }

  const handleOvertimeChange = async (attendanceId, hours) => {
    try {
      setLoading(true)
      const attendanceRecord = attendance.find((item) => item.id === attendanceId)

      const res = await axios.put(`http://localhost:5000/api/attendance/${attendanceId}`, {
        status: attendanceRecord.status,
        overtime_hours: hours,
        check_in_time: attendanceRecord.check_in_time,
        check_out_time: attendanceRecord.check_out_time,
      })

      // Update local state immediately for responsive UI
      setAttendance(attendance.map((item) => (item.id === attendanceId ? res.data : item)))

      // Emit socket event for real-time update
      if (socket && connected) {
        socket.emit("attendance_update", res.data)
      }

      toast.success("Overtime hours updated")
      setLoading(false)
    } catch (err) {
      toast.error("Failed to update overtime hours")
      console.error(err)
      setLoading(false)
    }
  }

  const handleCheckInTimeChange = async (attendanceId, time) => {
    try {
      setLoading(true)
      const attendanceRecord = attendance.find((item) => item.id === attendanceId)

      const res = await axios.put(`http://localhost:5000/api/attendance/${attendanceId}`, {
        status: attendanceRecord.status,
        overtime_hours: attendanceRecord.overtime_hours,
        check_in_time: time,
        check_out_time: attendanceRecord.check_out_time,
      })

      // Update local state immediately for responsive UI
      setAttendance(attendance.map((item) => (item.id === attendanceId ? res.data : item)))

      // Emit socket event for real-time update
      if (socket && connected) {
        socket.emit("attendance_update", res.data)
      }

      toast.success("Check-in time updated")
      setLoading(false)
    } catch (err) {
      toast.error("Failed to update check-in time")
      console.error(err)
      setLoading(false)
    }
  }

  const handleCheckOutTimeChange = async (attendanceId, time) => {
    try {
      setLoading(true)
      const attendanceRecord = attendance.find((item) => item.id === attendanceId)

      const res = await axios.put(`http://localhost:5000/api/attendance/${attendanceId}`, {
        status: attendanceRecord.status,
        overtime_hours: attendanceRecord.overtime_hours,
        check_in_time: attendanceRecord.check_in_time,
        check_out_time: time,
      })

      // Update local state immediately for responsive UI
      setAttendance(attendance.map((item) => (item.id === attendanceId ? res.data : item)))

      // Emit socket event for real-time update
      if (socket && connected) {
        socket.emit("attendance_update", res.data)
      }

      toast.success("Check-out time updated")
      setLoading(false)
    } catch (err) {
      toast.error("Failed to update check-out time")
      console.error(err)
      setLoading(false)
    }
  }

  const filterAttendanceByDate = () => {
    return attendance.filter((item) => {
      const dateMatches = item.date.split("T")[0] === selectedDate

      if (!searchTerm) return dateMatches

      const employee = employees.find((emp) => emp.id === item.employee_id)
      const employeeName = employee ? employee.name.toLowerCase() : ""
      return dateMatches && employeeName.includes(searchTerm.toLowerCase())
    })
  }

  const filterAttendanceByEmployee = () => {
    if (!selectedEmployee) return []

    return attendance.filter((item) => {
      const employeeMatches = item.employee_id === Number.parseInt(selectedEmployee)

      if (!searchTerm) return employeeMatches

      const dateStr = new Date(item.date).toLocaleDateString().toLowerCase()
      return employeeMatches && dateStr.includes(searchTerm.toLowerCase())
    })
  }

  const getEmployeeName = (id) => {
    const employee = employees.find((emp) => emp.id === id)
    return employee ? employee.name : "Unknown"
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage

  const filteredAttendance = viewMode === "byDate" ? filterAttendanceByDate() : filterAttendanceByEmployee()
  const currentItems = filteredAttendance.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center mt-6">
        <nav>
          <ul className="flex space-x-2">
            <li>
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1 ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                &laquo;
              </button>
            </li>
            {[...Array(totalPages)].map((_, i) => (
              <li key={i}>
                <button
                  onClick={() => paginate(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    )
  }

  const renderByDate = () => {
    return (
      <div>
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-1/3">
              <label className="block text-gray-700 mb-2 font-medium">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-gray-700 mb-2 font-medium">Search Employee</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center my-4">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Employee
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Check-In
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Check-Out
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Overtime
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                            {getEmployeeName(item.employee_id).charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{getEmployeeName(item.employee_id)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-white text-xs font-medium ${
                            item.status === "present"
                              ? "bg-green-500"
                              : item.status === "absent"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="time"
                          value={item.check_in_time ? item.check_in_time.substring(0, 5) : ""}
                          onChange={(e) => handleCheckInTimeChange(item.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="time"
                          value={item.check_out_time ? item.check_out_time.substring(0, 5) : ""}
                          onChange={(e) => handleCheckOutTimeChange(item.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          value={item.overtime_hours || 0}
                          onChange={(e) => handleOvertimeChange(item.id, Number.parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            const updatedStatus = item.status === "present" ? "absent" : "present"
                            handleStatusChange(item.id, updatedStatus)
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No attendance records for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {renderPagination()}
      </div>
    )
  }

  const renderByEmployee = () => {
    return (
      <div>
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-1/3">
              <label className="block text-gray-700 mb-2 font-medium">Select Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-gray-700 mb-2 font-medium">Search Date</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by date..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center my-4">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
          </div>
        )}

        {selectedEmployee ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Check-In
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Check-Out
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Overtime
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(item.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-white text-xs font-medium ${
                              item.status === "present"
                                ? "bg-green-500"
                                : item.status === "absent"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                            }`}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="time"
                            value={item.check_in_time ? item.check_in_time.substring(0, 5) : ""}
                            onChange={(e) => handleCheckInTimeChange(item.id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="time"
                            value={item.check_out_time ? item.check_out_time.substring(0, 5) : ""}
                            onChange={(e) => handleCheckOutTimeChange(item.id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max="12"
                            value={item.overtime_hours || 0}
                            onChange={(e) => handleOvertimeChange(item.id, Number.parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              const updatedStatus = item.status === "present" ? "absent" : "present"
                              handleStatusChange(item.id, updatedStatus)
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No attendance records for this employee
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            Please select an employee to view their attendance records
          </div>
        )}
        {renderPagination()}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold">Attendance Monitoring</h2>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-md flex items-center transition-colors ${
              viewMode === "byDate" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => {
              setViewMode("byDate")
              setCurrentPage(1)
            }}
          >
            <FaCalendarAlt className="mr-2" /> By Date
          </button>
          <button
            className={`px-4 py-2 rounded-md flex items-center transition-colors ${
              viewMode === "byEmployee" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => {
              setViewMode("byEmployee")
              setCurrentPage(1)
            }}
          >
            <FaUserAlt className="mr-2" /> By Employee
          </button>
        </div>
      </div>

      {viewMode === "byDate" ? renderByDate() : renderByEmployee()}
    </div>
  )
}

export default AttendanceManager
