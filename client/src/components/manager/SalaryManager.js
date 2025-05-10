"use client"

import { useState, useEffect, useContext, useMemo } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FaSearch, FaCalculator, FaSync } from "react-icons/fa"
import { SocketContext } from "../../context/SocketContext"

const SalaryManager = ({ employees, attendance, leaves }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState("")
  const [calculating, setCalculating] = useState(false)
  const { socket, connected } = useContext(SocketContext)
  const [employeeLoading, setEmployeeLoading] = useState({})

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
      toast.info(`Salary for ${data.employee_id} has been updated`)
    }

    socket.on("salary_update", handleSalaryUpdate)

    return () => {
      socket.off("salary_update", handleSalaryUpdate)
    }
  }, [socket, connected])

  // Use memoization for salary calculation to avoid unnecessary re-computations
  const calculateSalary = useMemo(() => {
    return (employee) => {
      const baseSalary = Number(employee.base_salary) || 0

      // Get attendance for the selected month
      const monthAttendance = attendance.filter((item) => {
        const date = new Date(item.date)
        return (
          date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && item.employee_id === employee.id
        )
      })

      // Get leaves for the selected month
      const monthLeaves = leaves.filter((item) => {
        const date = new Date(item.start_date)
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear &&
          item.employee_id === employee.id &&
          item.status === "approved"
        )
      })

      // Calculate absences, late arrivals, unpaid leaves, and overtime
      const absences = monthAttendance.filter((record) => record.status === "absent").length
      const absenceDeduction = (baseSalary / 30) * absences

      const lateArrivals = monthAttendance.filter((record) => record.status === "late").length
      const lateDeduction = (baseSalary / 30 / 3) * lateArrivals

      const unpaidLeaveDeduction = monthLeaves.reduce((total, leave) => {
        if (leave.type === "unpaid") {
          const startDate = new Date(leave.start_date)
          const endDate = new Date(leave.end_date)
          const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
          return total + (baseSalary / 30) * days
        }
        return total
      }, 0)

      // const overtime = monthAttendance.reduce((total, record) => {
      //   if (record.overtime_hours > 0) {
      //     return total + (baseSalary / (30 * 8)) * 1.5 * record.overtime_hours;
      //   }
      //   return total;
      // }, 0);

      const overtime = monthAttendance.reduce((total, record) => {
        const hours = Number(record.overtime_hours) || 0
        return total + (baseSalary / (30 * 8)) * 1.5 * hours
      }, 0)
      const totalDeductions = absenceDeduction + lateDeduction + unpaidLeaveDeduction
      const finalSalary = baseSalary + overtime - totalDeductions

      return {
        baseSalary,
        overtime,
        deductions: totalDeductions,
        finalSalary,
      }
    }
  }, [attendance, leaves, selectedMonth, selectedYear])

  // Filter employees based on search term
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Trigger automated salary calculation
  const triggerSalaryCalculation = async () => {
    try {
      setCalculating(true)

      await axios.post("http://localhost:5000/api/salary/calculate", {
        month: selectedMonth + 1,
        year: selectedYear,
      })

      if (socket && connected) {
        socket.emit("global_update", "salary")
      }

      toast.success("Salary calculation completed")
    } catch (err) {
      if (err.response) {
        toast.error(`Failed to calculate salaries: ${err.response.data.message || "Unknown error"}`)
      } else {
        toast.error("Failed to calculate salaries: Server error")
      }
    } finally {
      setCalculating(false)
    }
  }

  // Handle sending salary details to an employee
  const handleSalaryUpdateClick = async (employee) => {
    setEmployeeLoading((prev) => ({ ...prev, [employee.id]: true }))

    try {
      if (socket && connected) {
        const salary = calculateSalary(employee)
        socket.emit("salary_update", {
          employee_id: employee.id,
          month: selectedMonth + 1,
          year: selectedYear,
          salary,
        })
      }
      toast.success(`Salary details sent to ${employee.name}`)
    } catch (error) {
      toast.error("Failed to send salary details")
    } finally {
      setEmployeeLoading((prev) => ({ ...prev, [employee.id]: false }))
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Salary Processing</h2>
        <div className="flex space-x-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number.parseInt(e.target.value))}
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
            onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={triggerSalaryCalculation}
            disabled={calculating}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {calculating ? (
              <>
                <FaSync className="mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <FaCalculator className="mr-2" /> Calculate Salaries
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full px-3 py-2 border rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-3 px-4 text-left">Employee</th>
              <th className="py-3 px-4 text-left">Base Salary</th>
              <th className="py-3 px-4 text-left">Overtime</th>
              <th className="py-3 px-4 text-left">Deductions</th>
              <th className="py-3 px-4 text-left">Final Salary</th>
              <th className="py-3 px-4 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => {
                const salary = calculateSalary(employee)
                return (
                  <tr key={employee.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{employee.name}</td>
                    <td className="py-3 px-4">${Number(salary.baseSalary).toFixed(2)}</td>
                    <td className="py-3 px-4 text-green-600">+${salary.overtime.toFixed(2)}</td>
                    <td className="py-3 px-4 text-red-600">-${salary.deductions.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold">${salary.finalSalary.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleSalaryUpdateClick(employee)}
                        disabled={employeeLoading[employee.id]}
                      >
                        {employeeLoading[employee.id] ? "Sending..." : "Send Details"}
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-4 px-4 text-center">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SalaryManager
