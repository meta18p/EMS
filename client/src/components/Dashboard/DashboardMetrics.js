import { FaUsers, FaCalendarCheck, FaClipboardList, FaExclamationTriangle } from "react-icons/fa"

const DashboardMetrics = ({ employees, attendance, leaves, alerts }) => {
  // Calculate metrics
  const totalEmployees = employees.length

  const today = new Date().toISOString().split("T")[0]
  const presentToday = attendance.filter((a) => a.date.split("T")[0] === today && a.status === "present").length

  const absentToday = attendance.filter((a) => a.date.split("T")[0] === today && a.status === "absent").length

  const lateToday = attendance.filter((a) => a.date.split("T")[0] === today && a.status === "late").length

  const pendingLeaves = leaves.filter((l) => l.status === "pending").length

  const activeAlerts = alerts.length

  // Calculate attendance percentage
  const attendancePercentage = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4">
              <FaUsers size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalEmployees}</p>
            </div>
          </div>
        </div>

        {/* Attendance Today */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mr-4">
              <FaCalendarCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Today</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{presentToday}</p>
                <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">({attendancePercentage}%)</p>
              </div>
              <div className="flex text-xs mt-1">
                <span className="text-yellow-500 mr-2">Late: {lateToday}</span>
                <span className="text-red-500">Absent: {absentToday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mr-4">
              <FaClipboardList size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Leaves</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingLeaves}</p>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mr-4">
              <FaExclamationTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeAlerts}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardMetrics
