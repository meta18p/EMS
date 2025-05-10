"use client"

import { useState, useEffect, useContext } from "react"
import { Navigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { AuthContext } from "../context/AuthContext"
import { SocketContext } from "../context/SocketContext"
import Sidebar from "../components/Sidebar"
import EmployeeProfile from "../components/employee/EmployeeProfile"
import AttendanceEmployee from "../components/employee/AttendanceEmployee"
import SalaryEmployee from "../components/employee/SalaryEmployee"
import LeaveEmployee from "../components/employee/LeaveEmployee"
import PerformanceEmployee from "../components/employee/PerformanceEmployee"
import AlertsEmployee from "../components/employee/AlertsEmployee"
import config from "../config"

const EmployeeDashboard = () => {
  const { user, loading } = useContext(AuthContext)
  const { socket, connected } = useContext(SocketContext)
  const [activeComponent, setActiveComponent] = useState("employees")
  const [profile, setProfile] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [performance, setPerformance] = useState([])
  const [alerts, setAlerts] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === "employee") {
        try {
          setDataLoading(true)

          // Fetch all required data for the employee
          const [profileRes, attendanceRes, leavesRes, performanceRes, alertsRes] = await Promise.all([
            axios.get(`${config.endpoints.employees}/${user.id}`),
            axios.get(`${config.endpoints.attendance}/employee/${user.id}`),
            axios.get(`${config.endpoints.leaves}/employee/${user.id}`),
            axios.get(`${config.endpoints.performance}/employee/${user.id}`),
            axios.get(`${config.endpoints.alerts}/employee/${user.id}`),
          ])

          setProfile(profileRes.data)
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
    if (!socket || !connected || !user) return

    // Join user-specific room
    socket.emit("join", user)

    // Listen for profile updates
    socket.on("profile_updated", (updatedProfile) => {
      setProfile(updatedProfile)
      toast.info("Your profile has been updated")
    })

    // Listen for leave updates
    socket.on("leave_updated", (updatedLeave) => {
      setLeaves((prevLeaves) => prevLeaves.map((leave) => (leave.id === updatedLeave.id ? updatedLeave : leave)))
      toast.info(`Your leave request status has been updated to: ${updatedLeave.status}`)
    })

    // Listen for alert notifications
    socket.on("alert_received", (newAlert) => {
      setAlerts((prevAlerts) => [...prevAlerts, newAlert])
      toast.info(`New alert: ${newAlert.title}`)
    })

    // Listen for data refresh requests
    socket.on("refresh_data", (dataType) => {
      fetchSpecificData(dataType)
    })

    return () => {
      socket.off("profile_updated")
      socket.off("leave_updated")
      socket.off("alert_received")
      socket.off("refresh_data")
    }
  }, [socket, connected, user])

  const fetchSpecificData = async (dataType) => {
    if (!user) return

    try {
      let endpoint
      switch (dataType) {
        case "attendance":
          endpoint = `${config.endpoints.attendance}/employee/${user.id}`
          const attendanceRes = await axios.get(endpoint)
          setAttendance(attendanceRes.data)
          break
        case "leaves":
          endpoint = `${config.endpoints.leaves}/employee/${user.id}`
          const leavesRes = await axios.get(endpoint)
          setLeaves(leavesRes.data)
          break
        case "performance":
          endpoint = `${config.endpoints.performance}/employee/${user.id}`
          const performanceRes = await axios.get(endpoint)
          setPerformance(performanceRes.data)
          break
        case "alerts":
          endpoint = `${config.endpoints.alerts}/employee/${user.id}`
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

  if (user.role !== "employee") {
    return <Navigate to="/manager" replace />
  }

  const renderComponent = () => {
    if (dataLoading) {
      return <div className="flex justify-center items-center h-full">Loading data...</div>
    }

    switch (activeComponent) {
      case "employees":
        return <EmployeeProfile profile={profile} />
      case "attendance":
        return <AttendanceEmployee attendance={attendance} setAttendance={setAttendance} userId={user.id} />
      case "salary":
        return (
          <SalaryEmployee
            profile={profile}
            attendance={attendance}
            leaves={leaves}
            setAttendance={setAttendance}
            setLeaves={setLeaves}
          />
        )
      case "leaves":
        return <LeaveEmployee leaves={leaves} setLeaves={setLeaves} userId={user.id} />
      case "performance":
        return <PerformanceEmployee performance={performance} setPerformance={setPerformance} />
      case "alerts":
        return <AlertsEmployee alerts={alerts} />
      default:
        return <EmployeeProfile profile={profile} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onMenuSelect={handleMenuSelect} />

      <div className="flex-1 p-4 md:p-8 ml-0 md:ml-64 mt-16 md:mt-0">
        <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>
        <div className="bg-white rounded-lg shadow-md p-6 min-h-[calc(100vh-180px)]">{renderComponent()}</div>
      </div>
    </div>
  )
}

export default EmployeeDashboard



// "use client"

// import { useState, useEffect, useContext } from "react"
// import { Navigate } from "react-router-dom"
// import axios from "axios"
// import { toast } from "react-toastify"
// import { AuthContext } from "../context/AuthContext"
// import Sidebar from "../components/Sidebar"
// import EmployeeProfile from "../components/employee/EmployeeProfile"
// import AttendanceEmployee from "../components/employee/AttendanceEmployee"
// import SalaryEmployee from "../components/employee/SalaryEmployee"
// import LeaveEmployee from "../components/employee/LeaveEmployee"
// import PerformanceEmployee from "../components/employee/PerformanceEmployee"
// import AlertsEmployee from "../components/employee/AlertsEmployee"
// import config from "../config"

// const EmployeeDashboard = () => {
//   const { user, loading } = useContext(AuthContext)
//   const [activeComponent, setActiveComponent] = useState("employees")
//   const [profile, setProfile] = useState(null)
//   const [attendance, setAttendance] = useState([])
//   const [leaves, setLeaves] = useState([])
//   const [performance, setPerformance] = useState([])
//   const [alerts, setAlerts] = useState([])
//   const [dataLoading, setDataLoading] = useState(true)

//   useEffect(() => {
//     const fetchData = async () => {
//       if (user && user.role === "employee") {
//         try {
//           setDataLoading(true)

//           // Fetch all required data for the employee
//           const [profileRes, attendanceRes, leavesRes, performanceRes, alertsRes] = await Promise.all([
//             axios.get(`${config.endpoints.employees}/${user.id}`),
//             axios.get(`${config.endpoints.attendance}/employee/${user.id}`),
//             axios.get(`${config.endpoints.leaves}/employee/${user.id}`),
//             axios.get(`${config.endpoints.performance}/employee/${user.id}`),
//             axios.get(`${config.endpoints.alerts}/employee/${user.id}`),
//           ])

//           setProfile(profileRes.data)
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

//   if (user.role !== "employee") {
//     return <Navigate to="/manager" replace />
//   }

//   const renderComponent = () => {
//     if (dataLoading) {
//       return <div className="flex justify-center items-center h-full">Loading data...</div>
//     }

//     switch (activeComponent) {
//       case "employees":
//         return <EmployeeProfile profile={profile} />
//       case "attendance":
//         return <AttendanceEmployee attendance={attendance} setAttendance={setAttendance} userId={user.id} />
//       case "salary":
//         return <SalaryEmployee profile={profile} attendance={attendance} leaves={leaves} />
//       case "leaves":
//         return <LeaveEmployee leaves={leaves} setLeaves={setLeaves} userId={user.id} />
//       case "performance":
//         return <PerformanceEmployee performance={performance} />
//       case "alerts":
//         return <AlertsEmployee alerts={alerts} />
//       default:
//         return <EmployeeProfile profile={profile} />
//     }
//   }

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <Sidebar onMenuSelect={handleMenuSelect} />

//       <div className="flex-1 p-4 md:p-8 ml-0 md:ml-64 mt-16 md:mt-0">
//         <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>
//         <div className="bg-white rounded-lg shadow-md p-6 min-h-[calc(100vh-180px)]">{renderComponent()}</div>
//       </div>
//     </div>
//   )
// }

// export default EmployeeDashboard
