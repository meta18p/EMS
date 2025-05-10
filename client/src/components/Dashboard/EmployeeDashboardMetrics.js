import { FaCalendarCheck, FaCalendarTimes, FaClipboardList, FaBell } from "react-icons/fa"

const EmployeeDashboardMetrics = ({ attendance, leaves, alerts, profile }) => {
  // Calculate metrics
  const totalAttendance = attendance.length

  const presentDays = attendance.filter((a) => a.status === "present").length
  const absentDays = attendance.filter((a) => a.status === "absent").length
  const lateDays = attendance.filter((a) => a.status === "late").length

  const pendingLeaves = leaves.filter((l) => l.status === "pending").length
  const approvedLeaves = leaves.filter((l) => l.status === "approved").length

  const activeAlerts = alerts.length

  // Calculate attendance percentage
  const attendancePercentage = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : 0

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mr-4">
              <FaCalendarCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendancePercentage}%</p>
              <div className="flex text-xs mt-1">
                <span className="text-green-500 mr-2">Present: {presentDays}</span>
                <span className="text-red-500">Absent: {absentDays}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Late Days */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 mr-4">
              <FaCalendarTimes size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Late Days</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{lateDays}</p>
              {totalAttendance > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ({Math.round((lateDays / totalAttendance) * 100)}% of total)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Leave Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mr-4">
              <FaClipboardList size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Leave Status</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingLeaves + approvedLeaves}</p>
              <div className="flex text-xs mt-1">
                <span className="text-yellow-500 mr-2">Pending: {pendingLeaves}</span>
                <span className="text-green-500">Approved: {approvedLeaves}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mr-4">
              <FaBell size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Notifications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeAlerts}</p>
              {activeAlerts > 0 && <p className="text-xs text-red-500">{activeAlerts} unread</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboardMetrics
