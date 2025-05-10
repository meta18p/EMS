# Employee Management System (PERN Stack)

A full-stack Employee Management System built with the PERN stack (PostgreSQL, Express.js, React.js, Node.js). The application features separate dashboards for managers and employees with functionalities like employee records management, attendance tracking, leave management, salary processing, performance evaluation, and alerts/reminders.

## Features

- **Employee Records**: Add, edit, delete, and view employee information
- **Attendance Monitoring**: Mark and track employee attendance
- **Salary Processing**: Calculate salaries based on base salary, overtime, and unpaid leaves
- **Leave Tracking**: Apply for and manage leave requests
- **Performance Evaluation**: Rate and provide feedback on employee performance
- **Alerts and Reminders**: Send notifications to employees

## Tech Stack

- **Frontend**: React.js, React Router, Axios, Tailwind CSS, React Icons, React Toastify
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT, Bcrypt

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database (or use the provided Neon database connection)

### Database Setup

The application uses a PostgreSQL database. You can either:

1. Use the provided Neon database connection string in the server.js file
2. Set up your own PostgreSQL database and update the connection string

The database schema will be automatically created when you start the server for the first time.

### Installation

1. Clone the repository:
\`\`\`
git clone <repository-url>
cd employee-management-system
\`\`\`

2. Install backend dependencies:
\`\`\`
cd server
npm install
\`\`\`

3. Install frontend dependencies:
\`\`\`
cd ../client
npm install
\`\`\`

### Environment Variables

1. Backend (server):
   - Copy `.env.example` to `.env` and update the values
   - Required variables: `PORT`, `JWT_SECRET`, `DATABASE_URL`, `CLIENT_URL`

2. Frontend (client):
   - Copy `.env.example` to `.env` and update the values
   - Required variables: `REACT_APP_API_URL` (set to your backend URL)

### Running the Application Locally

1. Start the backend server:
\`\`\`
cd server
npm start
\`\`\`

2. Start the frontend development server:
\`\`\`
cd ../client
npm start
\`\`\`

3. Access the application at http://localhost:3000

## Deployment

### Backend Deployment

1. Set up environment variables on your hosting platform
2. Deploy the server directory to a Node.js hosting service like Vercel, Heroku, or Railway
3. For Vercel deployment, the included `vercel.json` file configures the project

### Frontend Deployment

1. Set the `REACT_APP_API_URL` environment variable to your deployed backend URL
2. Build the React application:
\`\`\`
cd client
npm run build
\`\`\`
3. Deploy the contents of the `build` directory to a static hosting service like Vercel, Netlify, or GitHub Pages

### Database Deployment

The application is configured to use a Neon PostgreSQL database. Make sure your `DATABASE_URL` environment variable is set correctly in your backend deployment.

## Folder Structure

\`\`\`
employee-management-system/
├── client/                 # React frontend
│   ├── public/             # Public assets
│   ├── src/                # Source files
│   │   ├── components/     # React components
│   │   │   ├── employee/   # Employee dashboard components
│   │   │   └── manager/    # Manager dashboard components
│   │   ├── context/        # React context (auth)
│   │   ├── pages/          # Page components
│   │   ├── config.js       # Application configuration
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   └── package.json        # Frontend dependencies
├── server/                 # Express backend
│   ├── config.js           # Server configuration
│   ├── server.js           # Main server file
│   ├── vercel.json         # Vercel deployment config
│   └── package.json        # Backend dependencies
└── README.md               # Project documentation
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance/employee/:id` - Get attendance by employee ID
- `POST /api/attendance` - Create attendance record
- `PUT /api/attendance/:id` - Update attendance record

### Leaves
- `GET /api/leaves` - Get all leave requests
- `GET /api/leaves/employee/:id` - Get leaves by employee ID
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id` - Update leave status

### Performance
- `GET /api/performance` - Get all performance records
- `GET /api/performance/employee/:id` - Get performance by employee ID
- `POST /api/performance` - Create performance record
- `PUT /api/performance/:id` - Update performance record

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/employee/:id` - Get alerts for employee
- `POST /api/alerts` - Create new alert
- `DELETE /api/alerts/:id` - Delete alert

## Demo Accounts

The application comes with pre-configured demo accounts:

- **Manager**:
  - Email: manager@example.com
  - Password: password123

- **Employee**:
  - Email: employee@example.com
  - Password: password123

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify your DATABASE_URL environment variable
   - Check if your IP is allowed in the database firewall settings
   - Ensure SSL settings are correct

2. **Authentication Issues**:
   - Verify JWT_SECRET is set correctly
   - Check that the token is being properly stored and sent with requests

3. **CORS Errors**:
   - Ensure CLIENT_URL is set to your frontend URL
   - Check that your backend is properly configured to accept requests from your frontend

## License

This project is licensed under the MIT License.
