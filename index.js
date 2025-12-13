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

// Test DB route
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


// ----------------------
// 👉 Save User Route (with IP)
// ----------------------
app.post("/api/users", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    // detect real IP
    let ip =
      req.headers["x-forwarded-for"]?.split(",")[0] || 
      req.socket.remoteAddress || 
      req.connection?.remoteAddress || 
      "unknown";

    // Insert into DB
    const result = await pool.query(
      "INSERT INTO app_users (email, password, ip) VALUES ($1, $2, $3) RETURNING id, email, ip, created_at",
      [email, password, ip]
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


// ----------------------
// 👉 Get All Users (shows IP also)
// ----------------------
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, password, ip, created_at FROM app_users ORDER BY id DESC"
    );

    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Could not fetch users",
      error: err.message,
    });
  }
});


// 👉 Get Visitor Logs (users + IP)
app.get("/api/logs", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, ip, created_at FROM app_users ORDER BY id DESC"
    );

    res.json({
      success: true,
      count: result.rows.length,
      logs: result.rows,
    });
  } catch (err) {
    console.error("Logs fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Could not fetch logs",
      error: err.message,
    });
  }
});




//  Get All Products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");

    res.json({
      success: true,
      count: result.rows.length,
      products: result.rows,
    });
  } catch (err) {
    console.error("Fetch product error:", err);
    res.status(500).json({
      success: false,
      message: "Could not fetch products",
      error: err.message,
    });
  }
});





// 👉 Add New Product
app.post("/api/products", async (req, res) => {
  const { title, description, price, image } = req.body;

  if (!title || !price) {
    return res.status(400).json({
      success: false,
      message: "Title and Price are required",
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO products (title, description, price, image) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, price, image]
    );

    res.status(201).json({
      success: true,
      message: "Product added successfully!",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Product insert error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: err.message,
    });
  }
});


// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
