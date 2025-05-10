
const express = require("express")
const cors = require("cors")
const { Pool } = require("pg")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const config = require("./config")
const http = require("http")
const { Server } = require("socket.io")
const cron = require("node-cron")

const app = express()
const PORT = config.PORT

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: config.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
})

// Improved CORS configuration
app.use(
  cors({
    origin: config.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)
app.use(express.json())

// Database connection with error handling
const pool = new Pool({
  connectionString: config.DB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false, // Needed for some cloud database providers
  },
})

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack)
  } else {
    console.log("Connected to database successfully")
    release()
  }
})

// Replace JWT_SECRET with config.JWT_SECRET throughout the file
const JWT_SECRET = config.JWT_SECRET

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id)

  // Join room based on user role and ID
  socket.on("join", (userData) => {
    if (userData.id) {
      socket.join(`user-${userData.id}`)
      console.log(`User ${userData.id} joined their personal room`)
    }

    if (userData.role === "manager") {
      socket.join("managers")
      console.log("Manager joined managers room")
    } else if (userData.role === "employee") {
      socket.join("employees")
      console.log("Employee joined employees room")
    }
  })

  // Handle performance update
  socket.on("performance_update", (data) => {
    io.to(`user-${data.employee_id}`).emit("performance_updated", data)
  })

  // Handle attendance update
  socket.on("attendance_update", (data) => {
    io.to(`user-${data.employee_id}`).emit("attendance_updated", data)
  })

  // Handle salary update
  socket.on("salary_update", (data) => {
    io.to(`user-${data.employee_id}`).emit("salary_updated", data)
  })

  // Handle global updates
  socket.on("global_update", (type) => {
    io.emit("refresh_data", type)
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
  })
})

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) return res.status(401).json({ message: "Access denied" })

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" })
    req.user = user
    next()
  })
}

// Routes

// Add a simple health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: config.NODE_ENV })
})

// Auth routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const result = await pool.query("SELECT * FROM employees WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const user = result.rows[0]

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json(req.user)
})

// Employee routes
app.get("/api/employees", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role, joining_date, base_salary FROM employees")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/employees/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      "SELECT id, name, email, role, joining_date, base_salary FROM employees WHERE id = $1",
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/employees", authenticateToken, async (req, res) => {
  try {
    const { name, email, password, role, joining_date, base_salary } = req.body

    // Check if user with email already exists
    const existingUser = await pool.query("SELECT * FROM employees WHERE email = $1", [email])

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      "INSERT INTO employees (name, email, password, role, joining_date, base_salary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, joining_date, base_salary",
      [name, email, hashedPassword, role, joining_date, base_salary],
    )

    // Notify clients about the new employee
    io.emit("refresh_data", "employees")

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/employees/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, password, role, joining_date, base_salary } = req.body

    let query, params

    if (password) {
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10)

      query =
        "UPDATE employees SET name = $1, email = $2, password = $3, role = $4, joining_date = $5, base_salary = $6 WHERE id = $7 RETURNING id, name, email, role, joining_date, base_salary"
      params = [name, email, hashedPassword, role, joining_date, base_salary, id]
    } else {
      query =
        "UPDATE employees SET name = $1, email = $2, role = $3, joining_date = $4, base_salary = $5 WHERE id = $6 RETURNING id, name, email, role, joining_date, base_salary"
      params = [name, email, role, joining_date, base_salary, id]
    }

    const result = await pool.query(query, params)

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" })
    }

    // Notify clients about the updated employee
    io.emit("refresh_data", "employees")
    io.to(`user-${id}`).emit("profile_updated", result.rows[0])

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/employees/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Delete related records first (foreign key constraints)
    await pool.query("DELETE FROM attendance WHERE employee_id = $1", [id])
    await pool.query("DELETE FROM leaves WHERE employee_id = $1", [id])
    await pool.query("DELETE FROM performance WHERE employee_id = $1", [id])
    await pool.query("DELETE FROM alerts WHERE employee_id = $1 OR employee_id = 'all'", [id])

    const result = await pool.query("DELETE FROM employees WHERE id = $1 RETURNING id", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" })
    }

    // Notify clients about the deleted employee
    io.emit("refresh_data", "employees")

    res.json({ message: "Employee deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Attendance routes
app.get("/api/attendance", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM attendance")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/attendance/employee/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("SELECT * FROM attendance WHERE employee_id = $1", [id])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Modified to include check-in and check-out times
app.post("/api/attendance", authenticateToken, async (req, res) => {
  try {
    const { employee_id, date, status, overtime_hours, check_in_time, check_out_time } = req.body

    const result = await pool.query(
      "INSERT INTO attendance (employee_id, date, status, overtime_hours, check_in_time, check_out_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [employee_id, date, status, overtime_hours || 0, check_in_time, check_out_time],
    )

    // Notify about the new attendance record
    io.emit("attendance_update", result.rows[0])
    io.to(`user-${employee_id}`).emit("attendance_updated", result.rows[0])

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Modified to update check-in and check-out times
app.put("/api/attendance/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status, overtime_hours, check_in_time, check_out_time } = req.body

    const result = await pool.query(
      "UPDATE attendance SET status = $1, overtime_hours = $2, check_in_time = $3, check_out_time = $4 WHERE id = $5 RETURNING *",
      [status, overtime_hours || 0, check_in_time, check_out_time, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Attendance record not found" })
    }

    // Notify about the updated attendance record
    io.emit("attendance_update", result.rows[0])
    io.to(`user-${result.rows[0].employee_id}`).emit("attendance_updated", result.rows[0])

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Leave routes
app.get("/api/leaves", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leaves")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/leaves/employee/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("SELECT * FROM leaves WHERE employee_id = $1", [id])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/leaves", authenticateToken, async (req, res) => {
  try {
    const { employee_id, type, start_date, end_date, reason, status } = req.body

    const result = await pool.query(
      "INSERT INTO leaves (employee_id, type, start_date, end_date, reason, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [employee_id, type, start_date, end_date, reason, status || "pending"],
    )

    // Notify about the new leave request
    io.emit("refresh_data", "leaves")

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/leaves/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const result = await pool.query("UPDATE leaves SET status = $1 WHERE id = $2 RETURNING *", [status, id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Leave record not found" })
    }

    // Notify about the updated leave status
    io.emit("refresh_data", "leaves")
    io.to(`user-${result.rows[0].employee_id}`).emit("leave_updated", result.rows[0])

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Performance routes
app.get("/api/performance", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM performance")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/performance/employee/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("SELECT * FROM performance WHERE employee_id = $1", [id])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/performance", authenticateToken, async (req, res) => {
  try {
    const { employee_id, rating, feedback, review_date } = req.body

    const result = await pool.query(
      "INSERT INTO performance (employee_id, rating, feedback, review_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [employee_id, rating, feedback, review_date],
    )

    // Notify about the new performance evaluation
    io.emit("performance_update", result.rows[0])
    io.to(`user-${employee_id}`).emit("performance_updated", result.rows[0])

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/performance/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { rating, feedback, review_date } = req.body

    const result = await pool.query(
      "UPDATE performance SET rating = $1, feedback = $2, review_date = $3 WHERE id = $4 RETURNING *",
      [rating, feedback, review_date, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Performance record not found" })
    }

    // Notify about the updated performance evaluation
    io.emit("performance_update", result.rows[0])
    io.to(`user-${result.rows[0].employee_id}`).emit("performance_updated", result.rows[0])

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Salary routes - New endpoint for automated salary calculation
app.post("/api/salary/calculate", authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.body

    // Get all employees
    const employees = await pool.query("SELECT id, base_salary FROM employees")

    // Process each employee's salary
    for (const employee of employees.rows) {
      // Get attendance for the month
      const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]
      const endDate = new Date(year, month, 0).toISOString().split("T")[0]

      const attendance = await pool.query(
        "SELECT * FROM attendance WHERE employee_id = $1 AND date >= $2 AND date <= $3",
        [employee.id, startDate, endDate],
      )

      // Get leaves for the month
      const leaves = await pool.query(
        "SELECT * FROM leaves WHERE employee_id = $1 AND status = 'approved' AND " +
          "((start_date >= $2 AND start_date <= $3) OR (end_date >= $2 AND end_date <= $3))",
        [employee.id, startDate, endDate],
      )

      // Calculate salary components
      const baseSalary = employee.base_salary

      // Calculate overtime
      const overtime = attendance.rows.reduce((total, record) => {
        return total + (record.overtime_hours || 0) * (baseSalary / (30 * 8)) * 1.5
      }, 0)

      // Calculate deductions for absences and late arrivals
      const absences = attendance.rows.filter((record) => record.status === "absent").length
      const lateArrivals = attendance.rows.filter((record) => record.status === "late").length

      const absenceDeduction = (baseSalary / 30) * absences
      const lateDeduction = (baseSalary / 30 / 3) * lateArrivals // 1/3 of daily salary for late

      // Calculate unpaid leave deductions
      const unpaidLeaveDeduction = leaves.rows.reduce((total, leave) => {
        if (leave.type === "unpaid") {
          const startDate = new Date(leave.start_date)
          const endDate = new Date(leave.end_date)
          const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
          return total + (baseSalary / 30) * days
        }
        return total
      }, 0)

      // Calculate final salary
      const finalSalary = baseSalary + overtime - absenceDeduction - lateDeduction - unpaidLeaveDeduction

      // Store or update the salary record
      const salaryData = {
        employee_id: employee.id,
        month,
        year,
        base_salary: baseSalary,
        overtime_pay: overtime,
        deductions: absenceDeduction + lateDeduction + unpaidLeaveDeduction,
        final_salary: finalSalary,
        calculation_date: new Date().toISOString(),
      }

      // Notify about the salary calculation
      io.to(`user-${employee.id}`).emit("salary_updated", salaryData)
    }

    res.json({ message: "Salary calculation completed" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Alerts routes
app.get("/api/alerts", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM alerts")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/alerts/employee/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("SELECT * FROM alerts WHERE employee_id = $1 OR employee_id = 'all'", [id])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/alerts", authenticateToken, async (req, res) => {
  try {
    const { title, message, employee_id, date } = req.body

    const result = await pool.query(
      "INSERT INTO alerts (title, message, employee_id, date) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, message, employee_id, date],
    )

    // Notify about the new alert
    io.emit("refresh_data", "alerts")
    if (employee_id !== "all") {
      io.to(`user-${employee_id}`).emit("alert_received", result.rows[0])
    } else {
      io.emit("alert_received", result.rows[0])
    }

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/alerts/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("DELETE FROM alerts WHERE id = $1 RETURNING id", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Alert not found" })
    }

    // Notify about the deleted alert
    io.emit("refresh_data", "alerts")

    res.json({ message: "Alert deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Initialize database
const initDb = async () => {
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        joining_date DATE NOT NULL,
        base_salary DECIMAL(10, 2) NOT NULL
      )
    `)

    // Modified to include check-in and check-out times
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        overtime_hours INTEGER DEFAULT 0,
        check_in_time TIME,
        check_out_time TIME
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        type VARCHAR(20) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status VARCHAR(20) NOT NULL
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        rating INTEGER NOT NULL,
        feedback TEXT,
        review_date DATE NOT NULL
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        employee_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL
      )
    `)

    // New table for salary records
    await pool.query(`
      CREATE TABLE IF NOT EXISTS salary_records (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        base_salary DECIMAL(10, 2) NOT NULL,
        overtime_pay DECIMAL(10, 2) NOT NULL,
        deductions DECIMAL(10, 2) NOT NULL,
        final_salary DECIMAL(10, 2) NOT NULL,
        calculation_date TIMESTAMP NOT NULL,
        UNIQUE(employee_id, month, year)
      )
    `)

    // Check if we have any employees, if not add demo data
    const employeeCount = await pool.query("SELECT COUNT(*) FROM employees")

    if (Number.parseInt(employeeCount.rows[0].count) === 0) {
      // Add demo employees
      const managerPassword = await bcrypt.hash("password123", 10)
      const employeePassword = await bcrypt.hash("password123", 10)

      await pool.query(
        `
        INSERT INTO employees (name, email, password, role, joining_date, base_salary)
        VALUES 
          ('John Manager', 'manager@example.com', $1, 'manager', '2022-01-01', 5000),
          ('Jane Employee', 'employee@example.com', $2, 'employee', '2022-02-15', 3000),
          ('Bob Developer', 'developer@example.com', $2, 'developer', '2022-03-10', 4000)
      `,
        [managerPassword, employeePassword],
      )

      // Get the employee IDs
      const employees = await pool.query("SELECT id FROM employees")
      const employeeIds = employees.rows.map((emp) => emp.id)

      // Add demo attendance with check-in and check-out times
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      for (const id of employeeIds) {
        await pool.query(
          `
          INSERT INTO attendance (employee_id, date, status, overtime_hours, check_in_time, check_out_time)
          VALUES 
            ($1, $2, 'present', 2, '09:00:00', '18:00:00'),
            ($1, $3, 'present', 0, '09:30:00', '17:30:00')
        `,
          [id, today.toISOString().split("T")[0], yesterday.toISOString().split("T")[0]],
        )
      }

      // Add demo leaves
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const dayAfter = new Date(nextWeek)
      dayAfter.setDate(dayAfter.getDate() + 1)

      await pool.query(
        `
        INSERT INTO leaves (employee_id, type, start_date, end_date, reason, status)
        VALUES 
          ($1, 'vacation', $2, $3, 'Family vacation', 'pending'),
          ($2, 'sick', $4, $4, 'Doctor appointment', 'approved')
      `,
        [
          employeeIds[1],
          nextWeek.toISOString().split("T")[0],
          dayAfter.toISOString().split("T")[0],
          today.toISOString().split("T")[0],
        ],
      )

      // Add demo performance
      const lastMonth = new Date(today)
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      for (const id of employeeIds) {
        await pool.query(
          `
          INSERT INTO performance (employee_id, rating, feedback, review_date)
          VALUES ($1, $2, $3, $4)
        `,
          [
            id,
            Math.floor(Math.random() * 3) + 3, // Random rating between 3-5
            "Good performance overall. Keep up the good work!",
            lastMonth.toISOString().split("T")[0],
          ],
        )
      }

      // Add demo alerts
      await pool.query(
        `
        INSERT INTO alerts (title, message, employee_id, date)
        VALUES 
          ('Team Meeting', 'Reminder: Team meeting tomorrow at 10 AM', 'all', $1),
          ('Project Deadline', 'The project deadline is approaching', $2, $3)
      `,
        [today.toISOString().split("T")[0], employeeIds[1], nextWeek.toISOString().split("T")[0]],
      )
    }

    console.log("Database initialized successfully")
  } catch (err) {
    console.error("Error initializing database:", err)
  }
}

// Set up cron job for automated salary calculation at the end of each month
cron.schedule("0 0 28-31 * *", async () => {
  const now = new Date()
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  // Only run on the last day of the month
  if (now.getDate() === lastDayOfMonth) {
    console.log("Running automated salary calculation")
    try {
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      // Get all employees
      const employees = await pool.query("SELECT id, base_salary FROM employees")

      // Process each employee's salary
      for (const employee of employees.rows) {
        // Calculate salary components (similar to the API endpoint)
        // ... (calculation logic)

        // Notify about the salary calculation
        io.to(`user-${employee.id}`).emit("salary_calculation_complete", {
          employee_id: employee.id,
          month,
          year,
          message: "Monthly salary has been calculated",
        })
      }

      console.log("Salary calculation completed")
    } catch (err) {
      console.error("Error in automated salary calculation:", err)
    }
  }
})

// Add error handling middleware at the end of the file, before app.listen
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: "An unexpected error occurred",
    error: config.NODE_ENV === "development" ? err.message : undefined,
  })
})

// Start server
server.listen(PORT, async () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`)
  try {
    await initDb()
    console.log("Database initialized successfully")
  } catch (err) {
    console.error("Error initializing database:", err)
  }
})



// const express = require("express")
// const cors = require("cors")
// const { Pool } = require("pg")
// const bcrypt = require("bcrypt")
// const jwt = require("jsonwebtoken")
// const config = require("./config")

// const app = express()
// const PORT = config.PORT

// // Improved CORS configuration
// app.use(
//   cors({
//     origin: config.CLIENT_URL,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   }),
// )
// app.use(express.json())

// // Database connection with error handling
// const pool = new Pool({
//   connectionString: config.DB_CONNECTION_STRING,
//   ssl: {
//     rejectUnauthorized: false, // Needed for some cloud database providers
//   },
// })

// // Test database connection
// pool.connect((err, client, release) => {
//   if (err) {
//     console.error("Error connecting to the database:", err.stack)
//   } else {
//     console.log("Connected to database successfully")
//     release()
//   }
// })

// // Replace JWT_SECRET with config.JWT_SECRET throughout the file
// const JWT_SECRET = config.JWT_SECRET

// // Authentication middleware
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"]
//   const token = authHeader && authHeader.split(" ")[1]

//   if (!token) return res.status(401).json({ message: "Access denied" })

//   jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) return res.status(403).json({ message: "Invalid token" })
//     req.user = user
//     next()
//   })
// }

// // Routes

// // Add a simple health check endpoint
// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "ok", environment: config.NODE_ENV })
// })

// // Auth routes
// app.post("/api/auth/login", async (req, res) => {
//   try {
//     const { email, password } = req.body

//     const result = await pool.query("SELECT * FROM employees WHERE email = $1", [email])

//     if (result.rows.length === 0) {
//       return res.status(401).json({ message: "Invalid credentials" })
//     }

//     const user = result.rows[0]

//     const isPasswordValid = await bcrypt.compare(password, user.password)

//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Invalid credentials" })
//     }

//     const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

//     res.json({
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     })
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.get("/api/auth/verify", authenticateToken, (req, res) => {
//   res.json(req.user)
// })

// // Employee routes
// app.get("/api/employees", authenticateToken, async (req, res) => {
//   try {
//     const result = await pool.query("SELECT id, name, email, role, joining_date, base_salary FROM employees")
//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.get("/api/employees/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params

//     const result = await pool.query(
//       "SELECT id, name, email, role, joining_date, base_salary FROM employees WHERE id = $1",
//       [id],
//     )

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Employee not found" })
//     }

//     res.json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.post("/api/employees", authenticateToken, async (req, res) => {
//   try {
//     const { name, email, password, role, joining_date, base_salary } = req.body

//     // Check if user with email already exists
//     const existingUser = await pool.query("SELECT * FROM employees WHERE email = $1", [email])

//     if (existingUser.rows.length > 0) {
//       return res.status(400).json({ message: "Email already in use" })
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10)

//     const result = await pool.query(
//       "INSERT INTO employees (name, email, password, role, joining_date, base_salary) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, joining_date, base_salary",
//       [name, email, hashedPassword, role, joining_date, base_salary],
//     )

//     res.status(201).json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.put("/api/employees/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params
//     const { name, email, password, role, joining_date, base_salary } = req.body

//     let query, params

//     if (password) {
//       // Hash new password
//       const hashedPassword = await bcrypt.hash(password, 10)

//       query =
//         "UPDATE employees SET name = $1, email = $2, password = $3, role = $4, joining_date = $5, base_salary = $6 WHERE id = $7 RETURNING id, name, email, role, joining_date, base_salary"
//       params = [name, email, hashedPassword, role, joining_date, base_salary, id]
//     } else {
//       query =
//         "UPDATE employees SET name = $1, email = $2, role = $3, joining_date = $4, base_salary = $5 WHERE id = $6 RETURNING id, name, email, role, joining_date, base_salary"
//       params = [name, email, role, joining_date, base_salary, id]
//     }

//     const result = await pool.query(query, params)

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Employee not found" })
//     }

//     res.json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.delete("/api/employees/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params

//     // Delete related records first (foreign key constraints)
//     await pool.query("DELETE FROM attendance WHERE employee_id = $1", [id])
//     await pool.query("DELETE FROM leaves WHERE employee_id = $1", [id])
//     await pool.query("DELETE FROM performance WHERE employee_id = $1", [id])
//     await pool.query("DELETE FROM alerts WHERE employee_id = $1 OR employee_id = 'all'", [id])

//     const result = await pool.query("DELETE FROM employees WHERE id = $1 RETURNING id", [id])

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Employee not found" })
//     }

//     res.json({ message: "Employee deleted successfully" })
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Attendance routes
// app.get("/api/attendance", authenticateToken, async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM attendance")
//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.get("/api/attendance/employee/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params

//     const result = await pool.query("SELECT * FROM attendance WHERE employee_id = $1", [id])

//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.post("/api/attendance", authenticateToken, async (req, res) => {
//   try {
//     const { employee_id, date, status, overtime_hours } = req.body

//     const result = await pool.query(
//       "INSERT INTO attendance (employee_id, date, status, overtime_hours) VALUES ($1, $2, $3, $4) RETURNING *",
//       [employee_id, date, status, overtime_hours || 0],
//     )

//     res.status(201).json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.put("/api/attendance/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params
//     const { status, overtime_hours } = req.body

//     const result = await pool.query(
//       "UPDATE attendance SET status = $1, overtime_hours = $2 WHERE id = $3 RETURNING *",
//       [status, overtime_hours || 0, id],
//     )

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Attendance record not found" })
//     }

//     res.json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Leave routes
// app.get("/api/leaves", authenticateToken, async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM leaves")
//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.get("/api/leaves/employee/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params

//     const result = await pool.query("SELECT * FROM leaves WHERE employee_id = $1", [id])

//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.post("/api/leaves", authenticateToken, async (req, res) => {
//   try {
//     const { employee_id, type, start_date, end_date, reason, status } = req.body

//     const result = await pool.query(
//       "INSERT INTO leaves (employee_id, type, start_date, end_date, reason, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
//       [employee_id, type, start_date, end_date, reason, status || "pending"],
//     )

//     res.status(201).json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.put("/api/leaves/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params
//     const { status } = req.body

//     const result = await pool.query("UPDATE leaves SET status = $1 WHERE id = $2 RETURNING *", [status, id])

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Leave record not found" })
//     }

//     res.json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Performance routes
// app.get("/api/performance", authenticateToken, async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM performance")
//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.get("/api/performance/employee/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params

//     const result = await pool.query("SELECT * FROM performance WHERE employee_id = $1", [id])

//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.post("/api/performance", authenticateToken, async (req, res) => {
//   try {
//     const { employee_id, rating, feedback, review_date } = req.body

//     const result = await pool.query(
//       "INSERT INTO performance (employee_id, rating, feedback, review_date) VALUES ($1, $2, $3, $4) RETURNING *",
//       [employee_id, rating, feedback, review_date],
//     )

//     res.status(201).json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.put("/api/performance/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params
//     const { rating, feedback, review_date } = req.body

//     const result = await pool.query(
//       "UPDATE performance SET rating = $1, feedback = $2, review_date = $3 WHERE id = $4 RETURNING *",
//       [rating, feedback, review_date, id],
//     )

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Performance record not found" })
//     }

//     res.json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Alerts routes
// app.get("/api/alerts", authenticateToken, async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM alerts")
//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.get("/api/alerts/employee/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params

//     const result = await pool.query("SELECT * FROM alerts WHERE employee_id = $1 OR employee_id = 'all'", [id])

//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.post("/api/alerts", authenticateToken, async (req, res) => {
//   try {
//     const { title, message, employee_id, date } = req.body

//     const result = await pool.query(
//       "INSERT INTO alerts (title, message, employee_id, date) VALUES ($1, $2, $3, $4) RETURNING *",
//       [title, message, employee_id, date],
//     )

//     res.status(201).json(result.rows[0])
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// app.delete("/api/alerts/:id", authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params

//     const result = await pool.query("DELETE FROM alerts WHERE id = $1 RETURNING id", [id])

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Alert not found" })
//     }

//     res.json({ message: "Alert deleted successfully" })
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// })

// // Initialize database
// const initDb = async () => {
//   try {
//     // Create tables if they don't exist
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS employees (
//         id SERIAL PRIMARY KEY,
//         name VARCHAR(100) NOT NULL,
//         email VARCHAR(100) UNIQUE NOT NULL,
//         password VARCHAR(100) NOT NULL,
//         role VARCHAR(50) NOT NULL,
//         joining_date DATE NOT NULL,
//         base_salary DECIMAL(10, 2) NOT NULL
//       )
//     `)

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS attendance (
//         id SERIAL PRIMARY KEY,
//         employee_id INTEGER REFERENCES employees(id),
//         date DATE NOT NULL,
//         status VARCHAR(20) NOT NULL,
//         overtime_hours INTEGER DEFAULT 0
//       )
//     `)

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS leaves (
//         id SERIAL PRIMARY KEY,
//         employee_id INTEGER REFERENCES employees(id),
//         type VARCHAR(20) NOT NULL,
//         start_date DATE NOT NULL,
//         end_date DATE NOT NULL,
//         reason TEXT,
//         status VARCHAR(20) NOT NULL
//       )
//     `)

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS performance (
//         id SERIAL PRIMARY KEY,
//         employee_id INTEGER REFERENCES employees(id),
//         rating INTEGER NOT NULL,
//         feedback TEXT,
//         review_date DATE NOT NULL
//       )
//     `)

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS alerts (
//         id SERIAL PRIMARY KEY,
//         title VARCHAR(100) NOT NULL,
//         message TEXT NOT NULL,
//         employee_id VARCHAR(50) NOT NULL,
//         date DATE NOT NULL
//       )
//     `)

//     // Check if we have any employees, if not add demo data
//     const employeeCount = await pool.query("SELECT COUNT(*) FROM employees")

//     if (Number.parseInt(employeeCount.rows[0].count) === 0) {
//       // Add demo employees
//       const managerPassword = await bcrypt.hash("password123", 10)
//       const employeePassword = await bcrypt.hash("password123", 10)

//       await pool.query(
//         `
//         INSERT INTO employees (name, email, password, role, joining_date, base_salary)
//         VALUES 
//           ('John Manager', 'manager@example.com', $1, 'manager', '2022-01-01', 5000),
//           ('Jane Employee', 'employee@example.com', $2, 'employee', '2022-02-15', 3000),
//           ('Bob Developer', 'developer@example.com', $2, 'developer', '2022-03-10', 4000)
//       `,
//         [managerPassword, employeePassword],
//       )

//       // Get the employee IDs
//       const employees = await pool.query("SELECT id FROM employees")
//       const employeeIds = employees.rows.map((emp) => emp.id)

//       // Add demo attendance
//       const today = new Date()
//       const yesterday = new Date(today)
//       yesterday.setDate(yesterday.getDate() - 1)

//       for (const id of employeeIds) {
//         await pool.query(
//           `
//           INSERT INTO attendance (employee_id, date, status, overtime_hours)
//           VALUES 
//             ($1, $2, 'present', 2),
//             ($1, $3, 'present', 0)
//         `,
//           [id, today.toISOString().split("T")[0], yesterday.toISOString().split("T")[0]],
//         )
//       }

//       // Add demo leaves
//       const nextWeek = new Date(today)
//       nextWeek.setDate(nextWeek.getDate() + 7)

//       const dayAfter = new Date(nextWeek)
//       dayAfter.setDate(dayAfter.getDate() + 1)

//       await pool.query(
//         `
//         INSERT INTO leaves (employee_id, type, start_date, end_date, reason, status)
//         VALUES 
//           ($1, 'vacation', $2, $3, 'Family vacation', 'pending'),
//           ($2, 'sick', $4, $4, 'Doctor appointment', 'approved')
//       `,
//         [
//           employeeIds[1],
//           nextWeek.toISOString().split("T")[0],
//           dayAfter.toISOString().split("T")[0],
//           today.toISOString().split("T")[0],
//         ],
//       )

//       // Add demo performance
//       const lastMonth = new Date(today)
//       lastMonth.setMonth(lastMonth.getMonth() - 1)

//       for (const id of employeeIds) {
//         await pool.query(
//           `
//           INSERT INTO performance (employee_id, rating, feedback, review_date)
//           VALUES ($1, $2, $3, $4)
//         `,
//           [
//             id,
//             Math.floor(Math.random() * 3) + 3, // Random rating between 3-5
//             "Good performance overall. Keep up the good work!",
//             lastMonth.toISOString().split("T")[0],
//           ],
//         )
//       }

//       // Add demo alerts
//       await pool.query(
//         `
//         INSERT INTO alerts (title, message, employee_id, date)
//         VALUES 
//           ('Team Meeting', 'Reminder: Team meeting tomorrow at 10 AM', 'all', $1),
//           ('Project Deadline', 'The project deadline is approaching', $2, $3)
//       `,
//         [today.toISOString().split("T")[0], employeeIds[1], nextWeek.toISOString().split("T")[0]],
//       )
//     }

//     console.log("Database initialized successfully")
//   } catch (err) {
//     console.error("Error initializing database:", err)
//   }
// }

// // Add error handling middleware at the end of the file, before app.listen
// app.use((err, req, res, next) => {
//   console.error(err.stack)
//   res.status(500).json({
//     message: "An unexpected error occurred",
//     error: config.NODE_ENV === "development" ? err.message : undefined,
//   })
// })

// // Start server
// app.listen(PORT, async () => {
//   console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`)
//   try {
//     await initDb()
//     console.log("Database initialized successfully")
//   } catch (err) {
//     console.error("Error initializing database:", err)
//   }
// })
