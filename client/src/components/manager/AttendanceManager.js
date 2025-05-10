"use client"

import { useState, useEffect, useContext } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FaCalendarAlt, FaUserAlt } from "react-icons/fa"
import { SocketContext } from "../../context/SocketContext"

const AttendanceManager = ({ attendance, employees, setAttendance }) => {
  const [viewMode, setViewMode] = useState("byDate")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedEmployee, setSelectedEmployee] = useState("")
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
    } catch (err) {
      toast.error("Failed to update attendance status")
      console.error(err)
    }
  }

  const handleOvertimeChange = async (attendanceId, hours) => {
    try {
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
    } catch (err) {
      toast.error("Failed to update overtime hours")
      console.error(err)
    }
  }

  const filterAttendanceByDate = () => {
    return attendance.filter((item) => item.date.split("T")[0] === selectedDate)
  }

  const filterAttendanceByEmployee = () => {
    return attendance.filter((item) => item.employee_id === Number.parseInt(selectedEmployee))
  }

  const getEmployeeName = (id) => {
    const employee = employees.find((emp) => emp.id === id)
    return employee ? employee.name : "Unknown"
  }

  const renderByDate = () => {
    const filteredAttendance = filterAttendanceByDate()

    return (
      <div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4 text-left">Employee</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Check-In</th>
                <th className="py-3 px-4 text-left">Check-Out</th>
                <th className="py-3 px-4 text-left">Overtime</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{getEmployeeName(item.employee_id)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-white ${
                          item.status === "present"
                            ? "bg-green-500"
                            : item.status === "absent"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.check_in_time || "N/A"}</td>
                    <td className="py-3 px-4">{item.check_out_time || "N/A"}</td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={item.overtime_hours || 0}
                        onChange={(e) => handleOvertimeChange(item.id, Number.parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="px-2 py-1 border rounded"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center">
                    No attendance records for this date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderByEmployee = () => {
    const filteredAttendance = filterAttendanceByEmployee()

    return (
      <div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-2 border rounded w-full md:w-auto"
          >
            <option value="">Select an employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Check-In</th>
                  <th className="py-3 px-4 text-left">Check-Out</th>
                  <th className="py-3 px-4 text-left">Overtime</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length > 0 ? (
                  filteredAttendance.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-white ${
                            item.status === "present"
                              ? "bg-green-500"
                              : item.status === "absent"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        >
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">{item.check_in_time || "N/A"}</td>
                      <td className="py-3 px-4">{item.check_out_time || "N/A"}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          value={item.overtime_hours || 0}
                          onChange={(e) => handleOvertimeChange(item.id, Number.parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 px-4 text-center">
                      No attendance records for this employee
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Attendance Monitoring</h2>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded flex items-center ${viewMode === "byDate" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setViewMode("byDate")}
          >
            <FaCalendarAlt className="mr-2" /> By Date
          </button>
          <button
            className={`px-4 py-2 rounded flex items-center ${viewMode === "byEmployee" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setViewMode("byEmployee")}
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



// "use client"

// import { useState } from "react"
// import axios from "axios"
// import { toast } from "react-toastify"
// import { FaCalendarAlt, FaUserAlt } from "react-icons/fa"

// const AttendanceManager = ({ attendance, employees, setAttendance }) => {
//   const [viewMode, setViewMode] = useState("byDate")
//   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
//   const [selectedEmployee, setSelectedEmployee] = useState("")

//   const handleStatusChange = async (attendanceId, newStatus) => {
//     try {
//       const res = await axios.put(`http://localhost:5000/api/attendance/${attendanceId}`, {
//         status: newStatus,
//       })

//       setAttendance(attendance.map((item) => (item.id === attendanceId ? res.data : item)))

//       toast.success("Attendance status updated")
//     } catch (err) {
//       toast.error("Failed to update attendance status")
//       console.error(err)
//     }
//   }

//   const filterAttendanceByDate = () => {
//     return attendance.filter((item) => item.date.split("T")[0] === selectedDate)
//   }

//   const filterAttendanceByEmployee = () => {
//     return attendance.filter((item) => item.employee_id === Number.parseInt(selectedEmployee))
//   }

//   const getEmployeeName = (id) => {
//     const employee = employees.find((emp) => emp.id === id)
//     return employee ? employee.name : "Unknown"
//   }

//   const renderByDate = () => {
//     const filteredAttendance = filterAttendanceByDate()

//     return (
//       <div>
//         <div className="mb-4">
//           <label className="block text-gray-700 mb-2">Select Date</label>
//           <input
//             type="date"
//             value={selectedDate}
//             onChange={(e) => setSelectedDate(e.target.value)}
//             className="px-3 py-2 border rounded"
//           />
//         </div>

//         <div className="overflow-x-auto">
//           <table className="min-w-full bg-white">
//             <thead>
//               <tr className="bg-gray-200 text-gray-700">
//                 <th className="py-3 px-4 text-left">Employee</th>
//                 <th className="py-3 px-4 text-left">Status</th>
//                 <th className="py-3 px-4 text-left">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredAttendance.length > 0 ? (
//                 filteredAttendance.map((item) => (
//                   <tr key={item.id} className="border-b hover:bg-gray-50">
//                     <td className="py-3 px-4">{getEmployeeName(item.employee_id)}</td>
//                     <td className="py-3 px-4">
//                       <span
//                         className={`px-2 py-1 rounded text-white ${
//                           item.status === "present"
//                             ? "bg-green-500"
//                             : item.status === "absent"
//                               ? "bg-red-500"
//                               : "bg-yellow-500"
//                         }`}
//                       >
//                         {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
//                       </span>
//                     </td>
//                     <td className="py-3 px-4">
//                       <select
//                         value={item.status}
//                         onChange={(e) => handleStatusChange(item.id, e.target.value)}
//                         className="px-2 py-1 border rounded"
//                       >
//                         <option value="present">Present</option>
//                         <option value="absent">Absent</option>
//                         <option value="late">Late</option>
//                       </select>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="3" className="py-4 px-4 text-center">
//                     No attendance records for this date
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     )
//   }

//   const renderByEmployee = () => {
//     const filteredAttendance = filterAttendanceByEmployee()

//     return (
//       <div>
//         <div className="mb-4">
//           <label className="block text-gray-700 mb-2">Select Employee</label>
//           <select
//             value={selectedEmployee}
//             onChange={(e) => setSelectedEmployee(e.target.value)}
//             className="px-3 py-2 border rounded w-full md:w-auto"
//           >
//             <option value="">Select an employee</option>
//             {employees.map((emp) => (
//               <option key={emp.id} value={emp.id}>
//                 {emp.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         {selectedEmployee && (
//           <div className="overflow-x-auto">
//             <table className="min-w-full bg-white">
//               <thead>
//                 <tr className="bg-gray-200 text-gray-700">
//                   <th className="py-3 px-4 text-left">Date</th>
//                   <th className="py-3 px-4 text-left">Status</th>
//                   <th className="py-3 px-4 text-left">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredAttendance.length > 0 ? (
//                   filteredAttendance.map((item) => (
//                     <tr key={item.id} className="border-b hover:bg-gray-50">
//                       <td className="py-3 px-4">{new Date(item.date).toLocaleDateString()}</td>
//                       <td className="py-3 px-4">
//                         <span
//                           className={`px-2 py-1 rounded text-white ${
//                             item.status === "present"
//                               ? "bg-green-500"
//                               : item.status === "absent"
//                                 ? "bg-red-500"
//                                 : "bg-yellow-500"
//                           }`}
//                         >
//                           {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4">
//                         <select
//                           value={item.status}
//                           onChange={(e) => handleStatusChange(item.id, e.target.value)}
//                           className="px-2 py-1 border rounded"
//                         >
//                           <option value="present">Present</option>
//                           <option value="absent">Absent</option>
//                           <option value="late">Late</option>
//                         </select>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="3" className="py-4 px-4 text-center">
//                       No attendance records for this employee
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     )
//   }

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-xl font-semibold">Attendance Monitoring</h2>
//         <div className="flex space-x-2">
//           <button
//             className={`px-4 py-2 rounded flex items-center ${viewMode === "byDate" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
//             onClick={() => setViewMode("byDate")}
//           >
//             <FaCalendarAlt className="mr-2" /> By Date
//           </button>
//           <button
//             className={`px-4 py-2 rounded flex items-center ${viewMode === "byEmployee" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
//             onClick={() => setViewMode("byEmployee")}
//           >
//             <FaUserAlt className="mr-2" /> By Employee
//           </button>
//         </div>
//       </div>

//       {viewMode === "byDate" ? renderByDate() : renderByEmployee()}
//     </div>
//   )
// }

// export default AttendanceManager
