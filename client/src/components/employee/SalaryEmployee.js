"use client"

import { useState, useEffect, useContext } from "react"
import { FaMoneyBillWave, FaCalendarAlt, FaInfoCircle } from "react-icons/fa"
import { SocketContext } from "../../context/SocketContext"
import { toast } from "react-toastify"

const SalaryEmployee = ({ profile, attendance, leaves, setAttendance, setLeaves }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [salaryData, setSalaryData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { socket, connected } = useContext(SocketContext)

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  useEffect(() => {
    if (!socket || !connected) return

    // Listen for real-time salary updates
    const handleSalaryUpdate = (data) => {
      setLoading(true)
      setSalaryData(data.salary)
      toast.info("Your salary information has been updated")
      setLoading(false)
    }

    socket.on("salary_updated", handleSalaryUpdate)
    socket.on("salary_calculation_complete", () => {
      toast.info("Your monthly salary has been calculated")
    })

    return () => {
      socket.off("salary_updated", handleSalaryUpdate)
      socket.off("salary_calculation_complete")
    }
  }, [socket, connected])

  // Calculate salary
  const calculateSalary = () => {
    if (!profile) return { baseSalary: 0, overtime: 0, deductions: 0, finalSalary: 0 }

    // If we have received real-time salary data, use it
    if (salaryData && salaryData.baseSalary) {
      return salaryData
    }

    const baseSalary = profile.base_salary

    // Get attendance for the selected month
    const monthAttendance = attendance.filter((item) => {
      const date = new Date(item.date)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })

    // Get leaves for the selected month
    const monthLeaves = leaves.filter((item) => {
      const date = new Date(item.start_date)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && item.status === "approved"
    })

    // Calculate absences
    const absences = monthAttendance.filter((record) => record.status === "absent").length
    const absenceDeduction = (baseSalary / 30) * absences

    // Calculate late arrivals
    const lateArrivals = monthAttendance.filter((record) => record.status === "late").length
    const lateDeduction = (baseSalary / 30 / 3) * lateArrivals // 1/3 of daily salary for late

    // Calculate deductions for unpaid leaves
    const unpaidLeaveDeduction = monthLeaves.reduce((total, leave) => {
      if (leave.type === "unpaid") {
        const startDate = new Date(leave.start_date)
        const endDate = new Date(leave.end_date)
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
        return total + (baseSalary / 30) * days // Assuming 30 days in a month
      }
      return total
    }, 0)

    // Calculate overtime
    const overtime = monthAttendance.reduce((total, record) => {
      if (record.overtime_hours > 0) {
        return total + (baseSalary / (30 * 8)) * 1.5 * record.overtime_hours // Assuming 8 working hours per day
      }
      return total
    }, 0)

    // Calculate final salary
    const totalDeductions = absenceDeduction + lateDeduction + unpaidLeaveDeduction
    const finalSalary = baseSalary + overtime - totalDeductions

    return {
      baseSalary,
      overtime,
      deductions: totalDeductions,
      finalSalary,
    }
  }

  const salary = calculateSalary()

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-6">Salary Information</h2>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        {loading && (
          <div className="text-center py-4 mb-4 bg-blue-50 rounded">
            <p className="text-blue-600">Updating your salary information...</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Salary Breakdown</h3>
          <div className="flex space-x-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number.parseInt(e.target.value))
                setSalaryData(null) // Clear real-time data when changing month
              }}
              className="px-3 py-2 border rounded"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number.parseInt(e.target.value))
                setSalaryData(null) // Clear real-time data when changing year
              }}
              className="px-3 py-2 border rounded"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex items-center mb-4">
              <FaCalendarAlt className="text-blue-500 mr-2" />
              <h4 className="font-medium">Pay Period</h4>
            </div>
            <p className="text-gray-700">
              {months[selectedMonth]} 1 - {months[selectedMonth]}{" "}
              {new Date(selectedYear, selectedMonth + 1, 0).getDate()}, {selectedYear}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <div className="flex items-center mb-4">
              <FaMoneyBillWave className="text-green-500 mr-2" />
              <h4 className="font-medium">Payment Status</h4>
            </div>
            <p className="text-gray-700">
              {new Date(selectedYear, selectedMonth, 1) <= new Date() ? (
                <span className="text-green-600 font-medium">Paid</span>
              ) : (
                <span className="text-yellow-600 font-medium">Pending</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <h4 className="font-medium mb-4">Salary Breakdown</h4>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Base Salary</span>
              <span className="font-medium">${Number(salary.baseSalary).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>Overtime</span>
              <span>+${salary.overtime.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-red-600">
              <span>Deductions</span>
              <span>-${salary.deductions.toFixed(2)}</span>
            </div>

            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>${salary.finalSalary.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 p-4 rounded">
          <div className="flex items-start">
            <FaInfoCircle className="text-blue-500 mt-1 mr-2" />
            <div>
              <h4 className="font-medium text-blue-700">Salary Calculation Details</h4>
              <p className="text-sm text-blue-600 mt-1">
                Your salary is calculated based on your base salary, overtime hours, absences, late arrivals, and
                approved leaves. Overtime is paid at 1.5x your hourly rate. Absences result in a deduction of your daily
                rate, and late arrivals result in a deduction of 1/3 of your daily rate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalaryEmployee



// "use client"

// import { useState } from "react"
// import { FaMoneyBillWave, FaCalendarAlt } from "react-icons/fa"

// const SalaryEmployee = ({ profile, attendance, leaves }) => {
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

//   const months = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ]

//   const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

//   // Calculate salary
//   const calculateSalary = () => {
//     if (!profile) return { baseSalary: 0, overtime: 0, unpaidLeaveDeduction: 0, finalSalary: 0 }

//     const baseSalary = profile.base_salary

//     // Get attendance for the selected month
//     const monthAttendance = attendance.filter((item) => {
//       const date = new Date(item.date)
//       return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
//     })

//     // Get leaves for the selected month
//     const monthLeaves = leaves.filter((item) => {
//       const date = new Date(item.start_date)
//       return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && item.status === "approved"
//     })

//     // Calculate deductions for unpaid leaves
//     const unpaidLeaveDeduction = monthLeaves.reduce((total, leave) => {
//       if (leave.type === "unpaid") {
//         const startDate = new Date(leave.start_date)
//         const endDate = new Date(leave.end_date)
//         const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
//         return total + (baseSalary / 30) * days // Assuming 30 days in a month
//       }
//       return total
//     }, 0)

//     // Calculate overtime (assuming 10% bonus for each hour of overtime)
//     const overtime = monthAttendance.reduce((total, record) => {
//       if (record.overtime_hours > 0) {
//         return total + (baseSalary / (30 * 8)) * 1.5 * record.overtime_hours // Assuming 8 working hours per day
//       }
//       return total
//     }, 0)

//     // Calculate final salary
//     const finalSalary = baseSalary + overtime - unpaidLeaveDeduction

//     return {
//       baseSalary,
//       overtime,
//       unpaidLeaveDeduction,
//       finalSalary,
//     }
//   }

//   const salary = calculateSalary()

//   return (
//     <div>
//       <h2 className="text-xl font-semibold mb-6">Salary Information</h2>

//       <div className="bg-white rounded-lg shadow-sm border p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h3 className="text-lg font-medium">Salary Breakdown</h3>
//           <div className="flex space-x-2">
//             <select
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(Number.parseInt(e.target.value))}
//               className="px-3 py-2 border rounded"
//             >
//               {months.map((month, index) => (
//                 <option key={month} value={index}>
//                   {month}
//                 </option>
//               ))}
//             </select>
//             <select
//               value={selectedYear}
//               onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
//               className="px-3 py-2 border rounded"
//             >
//               {years.map((year) => (
//                 <option key={year} value={year}>
//                   {year}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="bg-gray-50 p-4 rounded">
//             <div className="flex items-center mb-4">
//               <FaCalendarAlt className="text-blue-500 mr-2" />
//               <h4 className="font-medium">Pay Period</h4>
//             </div>
//             <p className="text-gray-700">
//               {months[selectedMonth]} 1 - {months[selectedMonth]}{" "}
//               {new Date(selectedYear, selectedMonth + 1, 0).getDate()}, {selectedYear}
//             </p>
//           </div>

//           <div className="bg-gray-50 p-4 rounded">
//             <div className="flex items-center mb-4">
//               <FaMoneyBillWave className="text-green-500 mr-2" />
//               <h4 className="font-medium">Payment Status</h4>
//             </div>
//             <p className="text-gray-700">
//               {new Date(selectedYear, selectedMonth, 1) <= new Date() ? (
//                 <span className="text-green-600 font-medium">Paid</span>
//               ) : (
//                 <span className="text-yellow-600 font-medium">Pending</span>
//               )}
//             </p>
//           </div>
//         </div>

//         <div className="mt-6 border-t pt-6">
//           <h4 className="font-medium mb-4">Salary Breakdown</h4>

//           <div className="space-y-3">
//             <div className="flex justify-between">
//               <span>Base Salary</span>
//               <span className="font-medium">${Number(salary.baseSalary).toFixed(2)}</span>
//             </div>

//             <div className="flex justify-between text-green-600">
//               <span>Overtime</span>
//               <span>+${salary.overtime.toFixed(2)}</span>
//             </div>

//             <div className="flex justify-between text-red-600">
//               <span>Unpaid Leave Deductions</span>
//               <span>-${salary.unpaidLeaveDeduction.toFixed(2)}</span>
//             </div>

//             <div className="border-t pt-3 flex justify-between font-bold">
//               <span>Total</span>
//               <span>${salary.finalSalary.toFixed(2)}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default SalaryEmployee
