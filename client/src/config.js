// Base API URL - defaults to localhost for development
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

// Configuration object
const config = {
  // API URLs
  apiUrl: API_URL,

  // Auth endpoints
  endpoints: {
    login: `${API_URL}/api/auth/login`,
    verify: `${API_URL}/api/auth/verify`,
    employees: `${API_URL}/api/employees`,
    attendance: `${API_URL}/api/attendance`,
    leaves: `${API_URL}/api/leaves`,
    performance: `${API_URL}/api/performance`,
    alerts: `${API_URL}/api/alerts`,
  },

  // JWT token storage key
  tokenKey: "ems_token",
}

export default config
