const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Neon PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Root route
app.get("/", (req, res) => {
  res.send("API is running ✅");
});

// DB test route
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "DB error",
      error: err.message,
    });
  }
});

// 👉 Save user route
app.post("/api/users", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO app_users (email, password) VALUES ($1, $2) RETURNING id, email, created_at",
      [email, password]
    );

    res.status(201).json({
      success: true,
      message: "User saved successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({
      success: false,
      message: "Could not save user",
      error: err.message,
    });
  }
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
