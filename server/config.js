// Configuration for the application
module.exports = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
  JWT_EXPIRY: "24h",

  // Database configuration
  DB_CONNECTION_STRING:
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_lhT07IwEVmfd@ep-cold-night-a486sf3y-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",

  // CORS configuration
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  // API prefix
  API_PREFIX: "/api",
}
