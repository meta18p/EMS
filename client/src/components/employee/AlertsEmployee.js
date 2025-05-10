import { FaBell } from "react-icons/fa"

const AlertsEmployee = ({ alerts }) => {
  // Sort alerts by date (newest first)
  const sortedAlerts = [...alerts].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Alerts & Reminders</h2>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        {sortedAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedAlerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <FaBell className="text-blue-500 mr-2" />
                  <h3 className="font-medium">{alert.title}</h3>
                </div>
                <p className="text-gray-700 mb-3">{alert.message}</p>
                <p className="text-sm text-gray-500">{new Date(alert.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaBell className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-500">No alerts or reminders at this time.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlertsEmployee
