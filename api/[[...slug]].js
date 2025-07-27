// api/index.js
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
require("dotenv").config();

// Route imports
const adminRoutes = require("../routes/admin");
const vendorRoutes = require("../routes/vendors");
const userRoutes = require("../routes/users");

// Initialize Express app
const app = express();

app.use(cors());
app.use(express.json());

// Route mounting
app.use("/api", adminRoutes);
app.use("/api", vendorRoutes);
app.use("/api", userRoutes);

// Optional: Basic test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working on Vercel!" });
});

// Export handler for Vercel serverless function
module.exports = serverless(app);
module.exports.app = app;