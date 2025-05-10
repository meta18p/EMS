"use client"

import { useState, useEffect, useContext } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaClock,
  FaSignInAlt,
  FaSignOutAlt,
  FaSpinner,
  FaCalendarAlt,
} from "react-icons/fa"
import { SocketContext } from "../../context/SocketContext"

const AttendanceEmployee = ({ attendance, setAttendance, userId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [status, setStatus] = useState("present")
  const [overtimeHours, setOvertimeHours] = useState(0)
  const [checkInTime, setCheckInTime] = useState("")
  const [checkOutTime, setCheckOutTime] = useState("")
  const { socket, connected } = useContext(SocketContext)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  const todayAttendance = attendance.find((item) => new Date(item.date).toISOString().split("T")[0] === selectedDate)

  useEffect(() => {
    if (!socket || !connected) return

    // Listen for real-time attendance updates
    const handleAttendanceUpdate = (updatedAttendance) => {
      setLoading(true)
      setAttendance((prevAttendance) => {
        const exists = prevAttendance.some((a) => a.id === updatedAttendance.id)
        if (exists) {
          return prevAttendance.map((a) => (a.id === updatedAttendance.id ? updatedAttendance : a))
        } else {
          return [...prevAttendance, updatedAttendance]
        }
      })
      toast.info("Your attendance record has been updated")
      setLoading(false)
    }

    socket.on("attendance_updated", handleAttendanceUpdate)

    return () => {
      socket.off("attendance_updated", handleAttendanceUpdate)
    }
  }, [socket, connected, setAttendance])

  useEffect(() => {
    // Set current time as default for check-in/out
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const currentTime = `${hours}:${minutes}`

    if (!checkInTime) setCheckInTime(currentTime)

    // If there's an existing record for today, populate the form
    if (todayAttendance) {
      setStatus(todayAttendance.status)
      setOvertimeHours(todayAttendance.overtime_hours || 0)
      if (todayAttendance.check_in_time) setCheckInTime(todayAttendance.check_in_time.substring(0, 5))
      if (todayAttendance.check_out_time) setCheckOutTime(todayAttendance.check_out_time.substring(0, 5))
    } else {
      setCheckOutTime("")
    }
  }, [todayAttendance, selectedDate])

  const handleCheckIn = async () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0]

    // Find today's attendance record
    const todayRecord = attendance.find((item) => new Date(item.date).toISOString().split("T")[0] === today)

    // Check if already checked in today
    if (todayRecord && todayRecord.check_in_time) {
      toast.warning("You have already checked in today")
      return
    }

    setLoading(true)
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const currentTime = `${hours}:${minutes}`

    setCheckInTime(currentTime)

    // Determine if late (assuming work starts at 9:00 AM)
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0)
    const status = isLate ? "late" : "present"

    try {
      if (todayRecord) {
        // Update existing attendance
        const res = await axios.put(`http://localhost:5000/api/attendance/${todayRecord.id}`, {
          status: status,
          overtime_hours: todayRecord.overtime_hours || 0,
          check_in_time: currentTime,
          check_out_time: todayRecord.check_out_time,
        })

        // Update local state immediately for responsive UI
        setAttendance(attendance.map((item) => (item.id === todayRecord.id ? res.data : item)))

        toast.success("Checked in successfully")
        if (isLate) {
          toast.warning("You are marked as late today")
        }
      } else {
        // Create new attendance record
        const res = await axios.post("http://localhost:5000/api/attendance", {
          employee_id: userId,
          date: today,
          status: status,
          overtime_hours: 0,
          check_in_time: currentTime,
          check_out_time: null,
        })

        // Update local state immediately for responsive UI
        setAttendance([...attendance, res.data])

        toast.success("Checked in successfully")
        if (isLate) {
          toast.warning("You are marked as late today")
        }
      }
    } catch (err) {
      toast.error("Failed to check in")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0]

    // Find today's attendance record
    const todayRecord = attendance.find((item) => new Date(item.date).toISOString().split("T")[0] === today)

    setLoading(true)
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const currentTime = `${hours}:${minutes}`

    if (!todayRecord) {
      // No check-in record found, create a new one with both check-in and check-out
      try {
        const res = await axios.post("http://localhost:5000/api/attendance", {
          employee_id: userId,
          date: today,
          status: "present",
          overtime_hours: 0,
          check_in_time: currentTime, // Use current time as check-in too
          check_out_time: currentTime,
        })

        setAttendance([...attendance, res.data])
        setCheckOutTime(currentTime)
        toast.success("Checked out successfully")
        toast.warning("No check-in record found. Created a new record with both check-in and check-out.")
      } catch (err) {
        toast.error("Failed to check out")
        console.error(err)
      } finally {
        setLoading(false)
      }
      return
    }

    if (todayRecord.check_out_time) {
      toast.warning("You have already checked out today")
      setLoading(false)
      return
    }

    setCheckOutTime(currentTime)

    // Calculate overtime if any
    let overtime = 0
    if (todayRecord.check_in_time) {
      const checkIn = new Date()
      const [checkInHours, checkInMinutes] = todayRecord.check_in_time.split(":")
      checkIn.setHours(Number.parseInt(checkInHours), Number.parseInt(checkInMinutes), 0, 0)

      const checkOut = new Date()
      checkOut.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      // Assuming 8-hour workday
      const workHours = (checkOut - checkIn) / (1000 * 60 * 60)
      if (workHours > 8) {
        overtime = Math.floor(workHours - 8)
      }
    }

    try {
      // Update existing attendance
      const res = await axios.put(`http://localhost:5000/api/attendance/${todayRecord.id}`, {
        status: todayRecord.status,
        overtime_hours: Math.max(overtime, todayRecord.overtime_hours || 0),
        check_in_time: todayRecord.check_in_time,
        check_out_time: currentTime,
      })

      // Update local state immediately for responsive UI
      setAttendance(attendance.map((item) => (item.id === todayRecord.id ? res.data : item)))

      toast.success("Checked out successfully")
      if (overtime > 0) {
        toast.info(`${overtime} hours of overtime recorded`)
      }
    } catch (err) {
      toast.error("Failed to check out")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Pagination logic
  const sortedAttendance = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date))
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedAttendance.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedAttendance.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center mt-4">
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

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-6">Attendance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium mb-4">Mark Attendance</h3>

          {loading && (
            <div className="text-center py-2 mb-4 bg-blue-50 rounded flex items-center justify-center">
              <FaSpinner className="animate-spin mr-2 text-blue-600" />
              <p className="text-blue-600">Updating your attendance data...</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">Status</label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="present"
                  checked={status === "present"}
                  onChange={() => setStatus("present")}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Present</span>
              </label>
              <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="absent"
                  checked={status === "absent"}
                  onChange={() => setStatus("absent")}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Absent</span>
              </label>
              <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="late"
                  checked={status === "late"}
                  onChange={() => setStatus("late")}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Late</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Check-In Time</label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Check-Out Time</label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">Overtime Hours</label>
            <input
              type="number"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(Math.max(0, Number.parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="12"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSignInAlt className="mr-2" />}
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSignOutAlt className="mr-2" />}
              Check Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium mb-4">Recent Attendance</h3>

          {attendance.length > 0 ? (
            <div className="space-y-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {item.status === "present" ? (
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <FaCalendarCheck size={20} />
                    </div>
                  ) : item.status === "absent" ? (
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <FaCalendarTimes size={20} />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <FaClock size={20} />
                    </div>
                  )}
                  <div className="flex-1 ml-4">
                    <p className="font-medium text-gray-800">{new Date(item.date).toLocaleDateString()}</p>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span className="capitalize">{item.status}</span>
                      {item.check_in_time && (
                        <span>
                          In: {item.check_in_time.substring(0, 5)}
                          {item.check_out_time && ` | Out: ${item.check_out_time.substring(0, 5)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.overtime_hours > 0 && (
                    <div className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      +{item.overtime_hours}h overtime
                    </div>
                  )}
                </div>
              ))}
              {renderPagination()}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaCalendarAlt className="mx-auto text-gray-300 text-4xl mb-3" />
              <p>No attendance records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttendanceEmployee
