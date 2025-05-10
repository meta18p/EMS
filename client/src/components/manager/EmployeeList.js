"use client"

import { useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa"
import EmployeeForm from "./EmployeeForm"

const EmployeeList = ({ employees, setEmployees }) => {
  const [showModal, setShowModal] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState(null)

  const handleAddClick = () => {
    setCurrentEmployee(null)
    setShowModal(true)
  }

  const handleEditClick = (employee) => {
    setCurrentEmployee(employee)
    setShowModal(true)
  }

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await axios.delete(`http://localhost:5000/api/employees/${id}`)
        setEmployees(employees.filter((emp) => emp.id !== id))
        toast.success("Employee deleted successfully")
      } catch (err) {
        toast.error("Failed to delete employee")
        console.error(err)
      }
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (currentEmployee) {
        // Update existing employee
        const res = await axios.put(`http://localhost:5000/api/employees/${currentEmployee.id}`, formData)
        setEmployees(employees.map((emp) => (emp.id === currentEmployee.id ? res.data : emp)))
        toast.success("Employee updated successfully")
      } else {
        // Add new employee
        const res = await axios.post("http://localhost:5000/api/employees", formData)
        setEmployees([...employees, res.data])
        toast.success("Employee added successfully")
      }
      setShowModal(false)
    } catch (err) {
      toast.error("Failed to save employee")
      console.error(err)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Employee Records</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center" onClick={handleAddClick}>
          <FaPlus className="mr-2" /> Add Employee
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Role</th>
              <th className="py-3 px-4 text-left">Joining Date</th>
              <th className="py-3 px-4 text-left">Base Salary</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((employee) => (
                <tr key={employee.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{employee.name}</td>
                  <td className="py-3 px-4">{employee.email}</td>
                  <td className="py-3 px-4 capitalize">{employee.role}</td>
                  <td className="py-3 px-4">{new Date(employee.joining_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">${Number(employee.base_salary).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <button className="text-blue-500 mr-3" onClick={() => handleEditClick(employee)}>
                      <FaEdit />
                    </button>
                    <button className="text-red-500" onClick={() => handleDeleteClick(employee.id)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
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

      {showModal && (
        <EmployeeForm employee={currentEmployee} onSubmit={handleFormSubmit} onCancel={() => setShowModal(false)} />
      )}
    </div>
  )
}

export default EmployeeList
