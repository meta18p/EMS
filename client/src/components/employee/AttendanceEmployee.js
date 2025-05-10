"use client"

import { useState, useEffect, useContext } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FaCalendarCheck, FaCalendarTimes, FaClock, FaSignInAlt, FaSignOutAlt } from "react-icons/fa"
import { SocketContext } from "../../context/SocketContext"

const AttendanceEmployee = ({ attendance, setAttendance, userId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [status, setStatus] = useState("present")
  const [overtimeHours, setOvertimeHours] = useState(0)
  const [checkInTime, setCheckInTime] = useState("")
  const [checkOutTime, setCheckOutTime] = useState("")
  const { socket, connected } = useContext(SocketContext)
  const [loading, setLoading] = useState(false)

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
    }
  }, [todayAttendance, selectedDate])

  // const handleMarkAttendance = async () => {
  //   try {
  //     if (todayAttendance) {
  //       // Update existing attendance
  //       const res = await axios.put(`http://localhost:5000/api/attendance/${todayAttendance.id}`, {
  //         status,
  //         overtime_hours: overtimeHours,
  //         check_in_time: checkInTime,
  //         check_out_time: checkOutTime,
  //       })

  //       // Update local state immediately for responsive UI
  //       setAttendance(attendance.map((item) => (item.id === todayAttendance.id ? res.data : item)))

  //       toast.success("Attendance updated successfully")
  //     } else {
  //       // Create new attendance record
  //       const res = await axios.post("http://localhost:5000/api/attendance", {
  //         employee_id: userId,
  //         date: selectedDate,
  //         status,
  //         overtime_hours: overtimeHours,
  //         check_in_time: checkInTime,
  //         check_out_time: checkOutTime,
  //       })

  //       // Update local state immediately for responsive UI
  //       setAttendance([...attendance, res.data])

  //       toast.success("Attendance marked successfully")
  //     }
  //   } catch (err) {
  //     toast.error("Failed to mark attendance")
  //     console.error(err)
  //   }
  // }

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
    }
  }

  const handleCheckOut = async () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0]

    // Find today's attendance record
    const todayRecord = attendance.find((item) => new Date(item.date).toISOString().split("T")[0] === today)


    const now = new Date()
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const currentTime = `${hours}:${minutes}`
    const res = await axios.post("http://localhost:5000/api/attendance", {
      employee_id: userId,
      date: today,
      status: status,
      overtime_hours: 0,
      check_out_time: currentTime,
    })
    if (!todayRecord || !todayRecord.check_in_time) {
      setCheckOutTime(currentTime)
      toast.success("Checked out successfully")
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
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-6">Attendance</h2>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Mark Attendance</h3>

            {loading && (
              <div className="text-center py-2 mb-4 bg-blue-50 rounded">
                <p className="text-blue-600">Updating your attendance data...</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Status</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="present"
                    checked={status === "present"}
                    onChange={() => setStatus("present")}
                    className="mr-2"
                  />
                  <span>Present</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="absent"
                    checked={status === "absent"}
                    onChange={() => setStatus("absent")}
                    className="mr-2"
                  />
                  <span>Absent</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="late"
                    checked={status === "late"}
                    onChange={() => setStatus("late")}
                    className="mr-2"
                  />
                  <span>Late</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Check-In Time</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Check-Out Time</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Overtime Hours</label>
              <input
                type="number"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(Math.max(0, Number.parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border rounded"
                min="0"
                max="12"
              />
            </div>

            <div className="flex space-x-2">
             
              <button onClick={handleCheckIn} className="bg-green-500 text-white px-4 py-2 rounded flex items-center">
                <FaSignInAlt className="mr-2" /> Check In
              </button>
              <button onClick={handleCheckOut} className="bg-red-500 text-white px-4 py-2 rounded flex items-center">
                <FaSignOutAlt className="mr-2" /> Check Out
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Recent Attendance</h3>

            {attendance.length > 0 ? (
              <div className="space-y-4">
                {[...attendance]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.id} className="flex items-center p-3 border rounded">
                      {item.status === "present" ? (
                        <FaCalendarCheck className="text-green-500 mr-3" size={20} />
                      ) : item.status === "absent" ? (
                        <FaCalendarTimes className="text-red-500 mr-3" size={20} />
                      ) : (
                        <FaClock className="text-yellow-500 mr-3" size={20} />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{new Date(item.date).toLocaleDateString()}</p>
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
                        <div className="ml-auto bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          +{item.overtime_hours}h overtime
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500">No attendance records found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceEmployee


// "use client"

// import { useState, useEffect, useContext } from "react"
// import axios from "axios"
// import { toast } from "react-toastify"
// import { FaCalendarCheck, FaCalendarTimes, FaClock, FaSignInAlt, FaSignOutAlt } from "react-icons/fa"
// import { SocketContext } from "../../context/SocketContext"

// const AttendanceEmployee = ({ attendance, setAttendance, userId }) => {
//   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
//   const [status, setStatus] = useState("present")
//   const [overtimeHours, setOvertimeHours] = useState(0)
//   const [checkInTime, setCheckInTime] = useState("")
//   const [checkOutTime, setCheckOutTime] = useState("")
//   const { socket, connected } = useContext(SocketContext)
//   const [loading, setLoading] = useState(false)

//   const todayAttendance = attendance.find((item) => new Date(item.date).toISOString().split("T")[0] === selectedDate)

//   useEffect(() => {
//     if (!socket || !connected) return

//     // Listen for real-time attendance updates
//     const handleAttendanceUpdate = (updatedAttendance) => {
//       setLoading(true)
//       setAttendance((prevAttendance) => {
//         const exists = prevAttendance.some((a) => a.id === updatedAttendance.id)
//         if (exists) {
//           return prevAttendance.map((a) => (a.id === updatedAttendance.id ? updatedAttendance : a))
//         } else {
//           return [...prevAttendance, updatedAttendance]
//         }
//       })
//       toast.info("Your attendance record has been updated")
//       setLoading(false)
//     }

//     socket.on("attendance_updated", handleAttendanceUpdate)

//     return () => {
//       socket.off("attendance_updated", handleAttendanceUpdate)
//     }
//   }, [socket, connected, setAttendance])

//   useEffect(() => {
//     // Set current time as default for check-in/out
//     const now = new Date()
//     const hours = now.getHours().toString().padStart(2, "0")
//     const minutes = now.getMinutes().toString().padStart(2, "0")
//     const currentTime = `${hours}:${minutes}`

//     if (!checkInTime) setCheckInTime(currentTime)

//     // If there's an existing record for today, populate the form
//     if (todayAttendance) {
//       setStatus(todayAttendance.status)
//       setOvertimeHours(todayAttendance.overtime_hours || 0)
//       if (todayAttendance.check_in_time) setCheckInTime(todayAttendance.check_in_time.substring(0, 5))
//       if (todayAttendance.check_out_time) setCheckOutTime(todayAttendance.check_out_time.substring(0, 5))
//     }
//   }, [todayAttendance, selectedDate])

//   const handleMarkAttendance = async () => {
//     try {
//       if (todayAttendance) {
//         // Update existing attendance
//         const res = await axios.put(`http://localhost:5000/api/attendance/${todayAttendance.id}`, {
//           status,
//           overtime_hours: overtimeHours,
//           check_in_time: checkInTime,
//           check_out_time: checkOutTime,
//         })

//         // Update local state immediately for responsive UI
//         setAttendance(attendance.map((item) => (item.id === todayAttendance.id ? res.data : item)))

//         toast.success("Attendance updated successfully")
//       } else {
//         // Create new attendance record
//         const res = await axios.post("http://localhost:5000/api/attendance", {
//           employee_id: userId,
//           date: selectedDate,
//           status,
//           overtime_hours: overtimeHours,
//           check_in_time: checkInTime,
//           check_out_time: checkOutTime,
//         })

//         // Update local state immediately for responsive UI
//         setAttendance([...attendance, res.data])

//         toast.success("Attendance marked successfully")
//       }
//     } catch (err) {
//       toast.error("Failed to mark attendance")
//       console.error(err)
//     }
//   }

//   const handleCheckIn = async () => {
//     const now = new Date()
//     const hours = now.getHours().toString().padStart(2, "0")
//     const minutes = now.getMinutes().toString().padStart(2, "0")
//     const currentTime = `${hours}:${minutes}`

//     setCheckInTime(currentTime)

//     try {
//       if (todayAttendance) {
//         // Update existing attendance
//         const res = await axios.put(`http://localhost:5000/api/attendance/${todayAttendance.id}`, {
//           status: "present",
//           overtime_hours: todayAttendance.overtime_hours || 0,
//           check_in_time: currentTime,
//           check_out_time: todayAttendance.check_out_time,
//         })

//         // Update local state immediately for responsive UI
//         setAttendance(attendance.map((item) => (item.id === todayAttendance.id ? res.data : item)))

//         toast.success("Checked in successfully")
//       } else {
//         // Create new attendance record
//         const res = await axios.post("http://localhost:5000/api/attendance", {
//           employee_id: userId,
//           date: selectedDate,
//           status: "present",
//           overtime_hours: 0,
//           check_in_time: currentTime,
//           check_out_time: null,
//         })

//         // Update local state immediately for responsive UI
//         setAttendance([...attendance, res.data])

//         toast.success("Checked in successfully")
//       }
//     } catch (err) {
//       toast.error("Failed to check in")
//       console.error(err)
//     }
//   }

//   const handleCheckOut = async () => {
//     if (!todayAttendance) {
//       toast.error("You need to check in first")
//       return
//     }

//     const now = new Date()
//     const hours = now.getHours().toString().padStart(2, "0")
//     const minutes = now.getMinutes().toString().padStart(2, "0")
//     const currentTime = `${hours}:${minutes}`

//     setCheckOutTime(currentTime)

//     // Calculate overtime if any
//     let overtime = 0
//     if (todayAttendance.check_in_time) {
//       const checkIn = new Date()
//       const [checkInHours, checkInMinutes] = todayAttendance.check_in_time.split(":")
//       checkIn.setHours(Number.parseInt(checkInHours), Number.parseInt(checkInMinutes), 0, 0)

//       const checkOut = new Date()
//       checkOut.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

//       // Assuming 8-hour workday
//       const workHours = (checkOut - checkIn) / (1000 * 60 * 60)
//       if (workHours > 8) {
//         overtime = Math.floor(workHours - 8)
//       }
//     }

//     try {
//       // Update existing attendance
//       const res = await axios.put(`http://localhost:5000/api/attendance/${todayAttendance.id}`, {
//         status: todayAttendance.status,
//         overtime_hours: Math.max(overtime, todayAttendance.overtime_hours || 0),
//         check_in_time: todayAttendance.check_in_time,
//         check_out_time: currentTime,
//       })

//       // Update local state immediately for responsive UI
//       setAttendance(attendance.map((item) => (item.id === todayAttendance.id ? res.data : item)))

//       toast.success("Checked out successfully")
//       if (overtime > 0) {
//         toast.info(`${overtime} hours of overtime recorded`)
//       }
//     } catch (err) {
//       toast.error("Failed to check out")
//       console.error(err)
//     }
//   }

//   return (
//     <div className="w-full">
//       <h2 className="text-xl font-semibold mb-6">Attendance</h2>

//       <div className="bg-white rounded-lg shadow-sm border p-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <h3 className="text-lg font-medium mb-4">Mark Attendance</h3>

//             {loading && (
//               <div className="text-center py-2 mb-4 bg-blue-50 rounded">
//                 <p className="text-blue-600">Updating your attendance data...</p>
//               </div>
//             )}

//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Date</label>
//               <input
//                 type="date"
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 max={new Date().toISOString().split("T")[0]}
//               />
//             </div>

//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Status</label>
//               <div className="flex space-x-4">
//                 <label className="flex items-center">
//                   <input
//                     type="radio"
//                     name="status"
//                     value="present"
//                     checked={status === "present"}
//                     onChange={() => setStatus("present")}
//                     className="mr-2"
//                   />
//                   <span>Present</span>
//                 </label>
//                 <label className="flex items-center">
//                   <input
//                     type="radio"
//                     name="status"
//                     value="absent"
//                     checked={status === "absent"}
//                     onChange={() => setStatus("absent")}
//                     className="mr-2"
//                   />
//                   <span>Absent</span>
//                 </label>
//                 <label className="flex items-center">
//                   <input
//                     type="radio"
//                     name="status"
//                     value="late"
//                     checked={status === "late"}
//                     onChange={() => setStatus("late")}
//                     className="mr-2"
//                   />
//                   <span>Late</span>
//                 </label>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4 mb-4">
//               <div>
//                 <label className="block text-gray-700 mb-2">Check-In Time</label>
//                 <input
//                   type="time"
//                   value={checkInTime}
//                   onChange={(e) => setCheckInTime(e.target.value)}
//                   className="w-full px-3 py-2 border rounded"
//                 />
//               </div>
//               <div>
//                 <label className="block text-gray-700 mb-2">Check-Out Time</label>
//                 <input
//                   type="time"
//                   value={checkOutTime}
//                   onChange={(e) => setCheckOutTime(e.target.value)}
//                   className="w-full px-3 py-2 border rounded"
//                 />
//               </div>
//             </div>

//             <div className="mb-6">
//               <label className="block text-gray-700 mb-2">Overtime Hours</label>
//               <input
//                 type="number"
//                 value={overtimeHours}
//                 onChange={(e) => setOvertimeHours(Math.max(0, Number.parseInt(e.target.value) || 0))}
//                 className="w-full px-3 py-2 border rounded"
//                 min="0"
//                 max="12"
//               />
//             </div>

//             <div className="flex space-x-2">
//               <button onClick={handleMarkAttendance} className="bg-blue-500 text-white px-4 py-2 rounded">
//                 {todayAttendance ? "Update Attendance" : "Mark Attendance"}
//               </button>
//               <button onClick={handleCheckIn} className="bg-green-500 text-white px-4 py-2 rounded flex items-center">
//                 <FaSignInAlt className="mr-2" /> Check In
//               </button>
//               <button onClick={handleCheckOut} className="bg-red-500 text-white px-4 py-2 rounded flex items-center">
//                 <FaSignOutAlt className="mr-2" /> Check Out
//               </button>
//             </div>
//           </div>

//           <div>
//             <h3 className="text-lg font-medium mb-4">Recent Attendance</h3>

//             {attendance.length > 0 ? (
//               <div className="space-y-4">
//                 {[...attendance]
//                   .sort((a, b) => new Date(b.date) - new Date(a.date))
//                   .slice(0, 5)
//                   .map((item) => (
//                     <div key={item.id} className="flex items-center p-3 border rounded">
//                       {item.status === "present" ? (
//                         <FaCalendarCheck className="text-green-500 mr-3" size={20} />
//                       ) : item.status === "absent" ? (
//                         <FaCalendarTimes className="text-red-500 mr-3" size={20} />
//                       ) : (
//                         <FaClock className="text-yellow-500 mr-3" size={20} />
//                       )}
//                       <div className="flex-1">
//                         <p className="font-medium">{new Date(item.date).toLocaleDateString()}</p>
//                         <div className="flex justify-between text-sm text-gray-500">
//                           <span className="capitalize">{item.status}</span>
//                           {item.check_in_time && (
//                             <span>
//                               In: {item.check_in_time.substring(0, 5)}
//                               {item.check_out_time && ` | Out: ${item.check_out_time.substring(0, 5)}`}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                       {item.overtime_hours > 0 && (
//                         <div className="ml-auto bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
//                           +{item.overtime_hours}h overtime
//                         </div>
//                       )}
//                     </div>
//                   ))}
//               </div>
//             ) : (
//               <p className="text-gray-500">No attendance records found</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default AttendanceEmployee

// -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// "use client"

// import { useState } from "react"
// import axios from "axios"
// import { toast } from "react-toastify"
// import { FaCalendarCheck, FaCalendarTimes, FaClock } from "react-icons/fa"

// const AttendanceEmployee = ({ attendance, setAttendance, userId }) => {
//   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
//   const [status, setStatus] = useState("present")
//   const [overtimeHours, setOvertimeHours] = useState(0)

//   const todayAttendance = attendance.find((item) => new Date(item.date).toISOString().split("T")[0] === selectedDate)

//   const handleMarkAttendance = async () => {
//     try {
//       if (todayAttendance) {
//         // Update existing attendance
//         const res = await axios.put(`http://localhost:5000/api/attendance/${todayAttendance.id}`, {
//           status,
//           overtime_hours: overtimeHours,
//         })

//         setAttendance(attendance.map((item) => (item.id === todayAttendance.id ? res.data : item)))

//         toast.success("Attendance updated successfully")
//       } else {
//         // Create new attendance record
//         const res = await axios.post("http://localhost:5000/api/attendance", {
//           employee_id: userId,
//           date: selectedDate,
//           status,
//           overtime_hours: overtimeHours,
//         })

//         setAttendance([...attendance, res.data])
//         toast.success("Attendance marked successfully")
//       }
//     } catch (err) {
//       toast.error("Failed to mark attendance")
//       console.error(err)
//     }
//   }

//   return (
//     <div>
//       <h2 className="text-xl font-semibold mb-6">Attendance</h2>

//       <div className="bg-white rounded-lg shadow-sm border p-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <h3 className="text-lg font-medium mb-4">Mark Attendance</h3>

//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Date</label>
//               <input
//                 type="date"
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 className="w-full px-3 py-2 border rounded"
//                 max={new Date().toISOString().split("T")[0]}
//               />
//             </div>

//             <div className="mb-4">
//               <label className="block text-gray-700 mb-2">Status</label>
//               <div className="flex space-x-4">
//                 <label className="flex items-center">
//                   <input
//                     type="radio"
//                     name="status"
//                     value="present"
//                     checked={status === "present"}
//                     onChange={() => setStatus("present")}
//                     className="mr-2"
//                   />
//                   <span>Present</span>
//                 </label>
//                 <label className="flex items-center">
//                   <input
//                     type="radio"
//                     name="status"
//                     value="absent"
//                     checked={status === "absent"}
//                     onChange={() => setStatus("absent")}
//                     className="mr-2"
//                   />
//                   <span>Absent</span>
//                 </label>
//                 <label className="flex items-center">
//                   <input
//                     type="radio"
//                     name="status"
//                     value="late"
//                     checked={status === "late"}
//                     onChange={() => setStatus("late")}
//                     className="mr-2"
//                   />
//                   <span>Late</span>
//                 </label>
//               </div>
//             </div>

//             <div className="mb-6">
//               <label className="block text-gray-700 mb-2">Overtime Hours</label>
//               <input
//                 type="number"
//                 value={overtimeHours}
//                 onChange={(e) => setOvertimeHours(Math.max(0, Number.parseInt(e.target.value) || 0))}
//                 className="w-full px-3 py-2 border rounded"
//                 min="0"
//                 max="12"
//               />
//             </div>

//             <button onClick={handleMarkAttendance} className="bg-blue-500 text-white px-4 py-2 rounded">
//               {todayAttendance ? "Update Attendance" : "Mark Attendance"}
//             </button>
//           </div>

//           <div>
//             <h3 className="text-lg font-medium mb-4">Recent Attendance</h3>

//             {attendance.length > 0 ? (
//               <div className="space-y-4">
//                 {[...attendance]
//                   .sort((a, b) => new Date(b.date) - new Date(a.date))
//                   .slice(0, 5)
//                   .map((item) => (
//                     <div key={item.id} className="flex items-center p-3 border rounded">
//                       {item.status === "present" ? (
//                         <FaCalendarCheck className="text-green-500 mr-3" size={20} />
//                       ) : item.status === "absent" ? (
//                         <FaCalendarTimes className="text-red-500 mr-3" size={20} />
//                       ) : (
//                         <FaClock className="text-yellow-500 mr-3" size={20} />
//                       )}
//                       <div>
//                         <p className="font-medium">{new Date(item.date).toLocaleDateString()}</p>
//                         <p className="text-sm text-gray-500 capitalize">{item.status}</p>
//                       </div>
//                       {item.overtime_hours > 0 && (
//                         <div className="ml-auto bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
//                           +{item.overtime_hours}h overtime
//                         </div>
//                       )}
//                     </div>
//                   ))}
//               </div>
//             ) : (
//               <p className="text-gray-500">No attendance records found</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default AttendanceEmployee
