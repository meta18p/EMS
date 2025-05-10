"use client"

import { useState, useEffect, useContext } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { FaStar, FaRegStar, FaEdit } from "react-icons/fa"
import { SocketContext } from "../../context/SocketContext"

const PerformanceManager = ({ performance, employees, setPerformance }) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState({
    rating: 0,
    feedback: "",
    review_date: new Date().toISOString().split("T")[0],
  })
  const { socket, connected } = useContext(SocketContext)

  useEffect(() => {
    if (!socket || !connected) return

    // Listen for real-time performance updates
    const handlePerformanceUpdate = (updatedPerformance) => {
      setPerformance((prevPerformance) => {
        const exists = prevPerformance.some((p) => p.id === updatedPerformance.id)
        if (exists) {
          return prevPerformance.map((p) => (p.id === updatedPerformance.id ? updatedPerformance : p))
        } else {
          return [...prevPerformance, updatedPerformance]
        }
      })
      toast.info(`Performance evaluation for ${getEmployeeName(updatedPerformance.employee_id)} has been updated`)
    }

    socket.on("performance_update", handlePerformanceUpdate)

    return () => {
      socket.off("performance_update", handlePerformanceUpdate)
    }
  }, [socket, connected, setPerformance])

  const getEmployeeName = (id) => {
    const employee = employees.find((emp) => emp.id === id)
    return employee ? employee.name : "Unknown"
  }

  const handleEditClick = (employeeId) => {
    const existingPerformance = performance.find((p) => p.employee_id === employeeId)

    if (existingPerformance) {
      setFormData({
        rating: existingPerformance.rating,
        feedback: existingPerformance.feedback,
        review_date: new Date(existingPerformance.review_date).toISOString().split("T")[0],
      })
    } else {
      setFormData({
        rating: 0,
        feedback: "",
        review_date: new Date().toISOString().split("T")[0],
      })
    }

    setSelectedEmployee(employeeId)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const existingPerformance = performance.find((p) => p.employee_id === selectedEmployee)

      let res
      if (existingPerformance) {
        // Update existing performance
        res = await axios.put(`http://localhost:5000/api/performance/${existingPerformance.id}`, {
          ...formData,
          employee_id: selectedEmployee,
        })

        // Update local state immediately for responsive UI
        setPerformance(performance.map((p) => (p.id === existingPerformance.id ? res.data : p)))
      } else {
        // Create new performance record
        res = await axios.post("http://localhost:5000/api/performance", {
          ...formData,
          employee_id: selectedEmployee,
        })

        // Update local state immediately for responsive UI
        setPerformance([...performance, res.data])
      }

      // Emit socket event for real-time update
      if (socket && connected) {
        socket.emit("performance_update", res.data)
      }

      toast.success("Performance evaluation saved")
      setShowModal(false)
    } catch (err) {
      toast.error("Failed to save performance evaluation")
      console.error(err)
    }
  }

  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="text-yellow-500" />)
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-500" />)
      }
    }
    return <div className="flex">{stars}</div>
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Performance Evaluation</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-3 px-4 text-left">Employee</th>
              <th className="py-3 px-4 text-left">Rating</th>
              <th className="py-3 px-4 text-left">Feedback</th>
              <th className="py-3 px-4 text-left">Review Date</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const employeePerformance = performance.find((p) => p.employee_id === employee.id)

              return (
                <tr key={employee.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{employee.name}</td>
                  <td className="py-3 px-4">
                    {employeePerformance ? renderStars(employeePerformance.rating) : "Not evaluated"}
                  </td>
                  <td className="py-3 px-4">{employeePerformance ? employeePerformance.feedback : "N/A"}</td>
                  <td className="py-3 px-4">
                    {employeePerformance ? new Date(employeePerformance.review_date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-500 hover:text-blue-700" onClick={() => handleEditClick(employee.id)}>
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Evaluate {getEmployeeName(selectedEmployee)}</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Rating (1-5)</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="text-2xl focus:outline-none"
                    >
                      {star <= formData.rating ? (
                        <FaStar className="text-yellow-500" />
                      ) : (
                        <FaRegStar className="text-yellow-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Feedback</label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Review Date</label>
                <input
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 mr-2">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceManager


// "use client"

// import { useState } from "react"
// import axios from "axios"
// import { toast } from "react-toastify"
// import { FaStar, FaRegStar, FaEdit } from "react-icons/fa"

// const PerformanceManager = ({ performance, employees, setPerformance }) => {
//   const [showModal, setShowModal] = useState(false)
//   const [selectedEmployee, setSelectedEmployee] = useState(null)
//   const [formData, setFormData] = useState({
//     rating: 0,
//     feedback: "",
//     review_date: new Date().toISOString().split("T")[0],
//   })

//   const getEmployeeName = (id) => {
//     const employee = employees.find((emp) => emp.id === id)
//     return employee ? employee.name : "Unknown"
//   }

//   const handleEditClick = (employeeId) => {
//     const existingPerformance = performance.find((p) => p.employee_id === employeeId)

//     if (existingPerformance) {
//       setFormData({
//         rating: existingPerformance.rating,
//         feedback: existingPerformance.feedback,
//         review_date: new Date(existingPerformance.review_date).toISOString().split("T")[0],
//       })
//     } else {
//       setFormData({
//         rating: 0,
//         feedback: "",
//         review_date: new Date().toISOString().split("T")[0],
//       })
//     }

//     setSelectedEmployee(employeeId)
//     setShowModal(true)
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     try {
//       const existingPerformance = performance.find((p) => p.employee_id === selectedEmployee)

//       if (existingPerformance) {
//         // Update existing performance
//         const res = await axios.put(`http://localhost:5000/api/performance/${existingPerformance.id}`, {
//           ...formData,
//           employee_id: selectedEmployee,
//         })

//         setPerformance(performance.map((p) => (p.id === existingPerformance.id ? res.data : p)))
//       } else {
//         // Create new performance record
//         const res = await axios.post("http://localhost:5000/api/performance", {
//           ...formData,
//           employee_id: selectedEmployee,
//         })

//         setPerformance([...performance, res.data])
//       }

//       toast.success("Performance evaluation saved")
//       setShowModal(false)
//     } catch (err) {
//       toast.error("Failed to save performance evaluation")
//       console.error(err)
//     }
//   }

//   const renderStars = (rating) => {
//     const stars = []
//     for (let i = 1; i <= 5; i++) {
//       if (i <= rating) {
//         stars.push(<FaStar key={i} className="text-yellow-500" />)
//       } else {
//         stars.push(<FaRegStar key={i} className="text-yellow-500" />)
//       }
//     }
//     return <div className="flex">{stars}</div>
//   }

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-xl font-semibold">Performance Evaluation</h2>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full bg-white">
//           <thead>
//             <tr className="bg-gray-200 text-gray-700">
//               <th className="py-3 px-4 text-left">Employee</th>
//               <th className="py-3 px-4 text-left">Rating</th>
//               <th className="py-3 px-4 text-left">Feedback</th>
//               <th className="py-3 px-4 text-left">Review Date</th>
//               <th className="py-3 px-4 text-left">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {employees.map((employee) => {
//               const employeePerformance = performance.find((p) => p.employee_id === employee.id)

//               return (
//                 <tr key={employee.id} className="border-b hover:bg-gray-50">
//                   <td className="py-3 px-4">{employee.name}</td>
//                   <td className="py-3 px-4">
//                     {employeePerformance ? renderStars(employeePerformance.rating) : "Not evaluated"}
//                   </td>
//                   <td className="py-3 px-4">{employeePerformance ? employeePerformance.feedback : "N/A"}</td>
//                   <td className="py-3 px-4">
//                     {employeePerformance ? new Date(employeePerformance.review_date).toLocaleDateString() : "N/A"}
//                   </td>
//                   <td className="py-3 px-4">
//                     <button className="text-blue-500 hover:text-blue-700" onClick={() => handleEditClick(employee.id)}>
//                       <FaEdit />
//                     </button>
//                   </td>
//                 </tr>
//               )
//             })}
//           </tbody>
//         </table>
//       </div>

//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-8 w-full max-w-md">
//             <h2 className="text-xl font-semibold mb-4">Evaluate {getEmployeeName(selectedEmployee)}</h2>

//             <form onSubmit={handleSubmit}>
//               <div className="mb-4">
//                 <label className="block text-gray-700 mb-2">Rating (1-5)</label>
//                 <div className="flex space-x-2">
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <button
//                       key={star}
//                       type="button"
//                       onClick={() => setFormData({ ...formData, rating: star })}
//                       className="text-2xl focus:outline-none"
//                     >
//                       {star <= formData.rating ? (
//                         <FaStar className="text-yellow-500" />
//                       ) : (
//                         <FaRegStar className="text-yellow-500" />
//                       )}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-gray-700 mb-2">Feedback</label>
//                 <textarea
//                   value={formData.feedback}
//                   onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
//                   className="w-full px-3 py-2 border rounded"
//                   rows="4"
//                   required
//                 ></textarea>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-gray-700 mb-2">Review Date</label>
//                 <input
//                   type="date"
//                   value={formData.review_date}
//                   onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
//                   className="w-full px-3 py-2 border rounded"
//                   required
//                 />
//               </div>

//               <div className="flex justify-end">
//                 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 mr-2">
//                   Cancel
//                 </button>
//                 <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
//                   Save
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default PerformanceManager
