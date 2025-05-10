"use client"

import { useState, useEffect, useContext } from "react"
import { Navigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { AuthContext } from "../context/AuthContext"
import { SocketContext } from "../context/SocketContext"
import Sidebar from "../components/Sidebar"
import EmployeeList from "../components/manager/EmployeeList"
import AttendanceManager from "../components/manager/AttendanceManager"
import SalaryManager from "../components/manager/SalaryManager"
import LeaveManager from "../components/manager/LeaveManager"
import PerformanceManager from "../components/manager/PerformanceManager"
import AlertsManager from "../components/manager/AlertsManager"
import config from "../config"

const ManagerDashboard = () => {
  const { user, loading } = useContext(AuthContext)
  const { socket, connected } = useContext(SocketContext)
  const [activeComponent, setActiveComponent] = useState("employees")
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [performance, setPerformance] = useState([])
  const [alerts, setAlerts] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "manager") {
        try {
          setDataLoading(true)

          // Fetch all required data
          const [employeesRes, attendanceRes, leavesRes, performanceRes, alertsRes] = await Promise.all([
            axios.get(config.endpoints.employees),
            axios.get(config.endpoints.attendance),
            axios.get(config.endpoints.leaves),
            axios.get(config.endpoints.performance),
            axios.get(config.endpoints.alerts),
          ])

          setEmployees(employeesRes.data)
          setAttendance(attendanceRes.data)
          setLeaves(leavesRes.data)
          setPerformance(performanceRes.data)
          setAlerts(alertsRes.data)
        } catch (err) {
          toast.error("Failed to load data: " + (err.response?.data?.message || "Network error"))
          console.error(err)
        } finally {
          setDataLoading(false)
        }
      }
    }

    fetchData()
  }, [user])

  useEffect(() => {
    if (!socket || !connected) return

    // Listen for real-time data updates
    const handleDataRefresh = (dataType) => {
      fetchSpecificData(dataType)
    }

    socket.on("refresh_data", handleDataRefresh)

    return () => {
      socket.off("refresh_data", handleDataRefresh)
    }
  }, [socket, connected])

  const fetchSpecificData = async (dataType) => {
    try {
      let endpoint
      switch (dataType) {
        case "employees":
          endpoint = config.endpoints.employees
          const employeesRes = await axios.get(endpoint)
          setEmployees(employeesRes.data)
          break
        case "attendance":
          endpoint = config.endpoints.attendance
          const attendanceRes = await axios.get(endpoint)
          setAttendance(attendanceRes.data)
          break
        case "leaves":
          endpoint = config.endpoints.leaves
          const leavesRes = await axios.get(endpoint)
          setLeaves(leavesRes.data)
          break
        case "performance":
          endpoint = config.endpoints.performance
          const performanceRes = await axios.get(endpoint)
          setPerformance(performanceRes.data)
          break
        case "alerts":
          endpoint = config.endpoints.alerts
          const alertsRes = await axios.get(endpoint)
          setAlerts(alertsRes.data)
          break
        default:
          break
      }
    } catch (err) {
      console.error(`Failed to refresh ${dataType} data:`, err)
    }
  }

  const handleMenuSelect = (menuItem) => {
    setActiveComponent(menuItem)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (user.role !== "manager") {
    return <Navigate to="/employee" replace />
  }

  const renderComponent = () => {
    if (dataLoading) {
      return <div className="flex justify-center items-center h-full">Loading data...</div>
    }

    switch (activeComponent) {
      case "employees":
        return <EmployeeList employees={employees} setEmployees={setEmployees} />
      case "attendance":
        return <AttendanceManager attendance={attendance} employees={employees} setAttendance={setAttendance} />
      case "salary":
        return <SalaryManager employees={employees} attendance={attendance} leaves={leaves} />
      case "leaves":
        return <LeaveManager leaves={leaves} employees={employees} setLeaves={setLeaves} />
      case "performance":
        return <PerformanceManager performance={performance} employees={employees} setPerformance={setPerformance} />
      case "alerts":
        return <AlertsManager alerts={alerts} employees={employees} setAlerts={setAlerts} />
      default:
        return <EmployeeList employees={employees} setEmployees={setEmployees} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onMenuSelect={handleMenuSelect} />

      <div className="flex-1 p-4 md:p-8 ml-0 md:ml-64 mt-16 md:mt-0">
        <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>
        <div className="bg-white rounded-lg shadow-md p-6 min-h-[calc(100vh-180px)]">{renderComponent()}</div>
      </div>
    </div>
  )
}

export default ManagerDashboard



// "use client"

// import { useState, useEffect, useContext } from "react"
// import { Navigate } from "react-router-dom"
// import axios from "axios"
// import { toast } from "react-toastify"
// import { AuthContext } from "../context/AuthContext"
// import Sidebar from "../components/Sidebar"
// import EmployeeList from "../components/manager/EmployeeList"
// import AttendanceManager from "../components/manager/AttendanceManager"
// import SalaryManager from "../components/manager/SalaryManager"
// import LeaveManager from "../components/manager/LeaveManager"
// import PerformanceManager from "../components/manager/PerformanceManager"
// import AlertsManager from "../components/manager/AlertsManager"
// import config from "../config"

// const ManagerDashboard = () => {
//   const { user, loading } = useContext(AuthContext)
//   const [activeComponent, setActiveComponent] = useState("employees")
//   const [employees, setEmployees] = useState([])
//   const [attendance, setAttendance] = useState([])
//   const [leaves, setLeaves] = useState([])
//   const [performance, setPerformance] = useState([])
//   const [alerts, setAlerts] = useState([])
//   const [dataLoading, setDataLoading] = useState(true)

//   useEffect(() => {
//     const fetchData = async () => {
//       if (user && user.role === "manager") {
//         try {
//           setDataLoading(true)

//           // Fetch all required data
//           const [employeesRes, attendanceRes, leavesRes, performanceRes, alertsRes] = await Promise.all([
//             axios.get(config.endpoints.employees),
//             axios.get(config.endpoints.attendance),
//             axios.get(config.endpoints.leaves),
//             axios.get(config.endpoints.performance),
//             axios.get(config.endpoints.alerts),
//           ])

//           setEmployees(employeesRes.data)
//           setAttendance(attendanceRes.data)
//           setLeaves(leavesRes.data)
//           setPerformance(performanceRes.data)
//           setAlerts(alertsRes.data)
//         } catch (err) {
//           toast.error("Failed to load data: " + (err.response?.data?.message || "Network error"))
//           console.error(err)
//         } finally {
//           setDataLoading(false)
//         }
//       }
//     }

//     fetchData()
//   }, [user])

//   const handleMenuSelect = (menuItem) => {
//     setActiveComponent(menuItem)
//   }

//   if (loading) {
//     return <div className="flex justify-center items-center h-screen">Loading...</div>
//   }

//   if (!user) {
//     return <Navigate to="/" replace />
//   }

//   if (user.role !== "manager") {
//     return <Navigate to="/employee" replace />
//   }

//   const renderComponent = () => {
//     if (dataLoading) {
//       return <div className="flex justify-center items-center h-full">Loading data...</div>
//     }

//     switch (activeComponent) {
//       case "employees":
//         return <EmployeeList employees={employees} setEmployees={setEmployees} />
//       case "attendance":
//         return <AttendanceManager attendance={attendance} employees={employees} setAttendance={setAttendance} />
//       case "salary":
//         return <SalaryManager employees={employees} attendance={attendance} leaves={leaves} />
//       case "leaves":
//         return <LeaveManager leaves={leaves} employees={employees} setLeaves={setLeaves} />
//       case "performance":
//         return <PerformanceManager performance={performance} employees={employees} setPerformance={setPerformance} />
//       case "alerts":
//         return <AlertsManager alerts={alerts} employees={employees} setAlerts={setAlerts} />
//       default:
//         return <EmployeeList employees={employees} setEmployees={setEmployees} />
//     }
//   }

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <Sidebar onMenuSelect={handleMenuSelect} />

//       <div className="flex-1 p-4 md:p-8 ml-0 md:ml-64 mt-16 md:mt-0">
//         <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>
//         <div className="bg-white rounded-lg shadow-md p-6 min-h-[calc(100vh-180px)]">{renderComponent()}</div>
//       </div>
//     </div>
//   )
// }

// export default ManagerDashboard
