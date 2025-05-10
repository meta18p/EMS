import { FaUser, FaEnvelope, FaBriefcase, FaCalendarAlt, FaDollarSign } from "react-icons/fa"

const EmployeeProfile = ({ profile }) => {
  if (!profile) {
    return <div className="text-center py-8">Loading profile...</div>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">My Profile</h2>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row">
          <div className="flex justify-center md:w-1/3 mb-6 md:mb-0">
            <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
              <FaUser size={48} />
            </div>
          </div>

          <div className="md:w-2/3">
            <h3 className="text-2xl font-bold mb-4">{profile.name}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <FaEnvelope className="text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FaBriefcase className="text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="capitalize">{profile.role}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FaCalendarAlt className="text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Joining Date</p>
                  <p>{new Date(profile.joining_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FaDollarSign className="text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Base Salary</p>
                  <p>${Number(profile.base_salary).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeProfile
