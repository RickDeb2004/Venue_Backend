const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/users");
const vendorRoutes = require("./routes/vendors");
app.use("/api", adminRoutes);
app.use("/api", userRoutes);
app.use("/api", vendorRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// server.js
// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();

// const adminRoutes = require("./routes/admin");
// const vendorRoutes = require("./routes/vendors");
// const userRoutes = require("./routes/users");

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use("/api", adminRoutes);
// app.use("/api", vendorRoutes);
// app.use("/api", userRoutes);

// module.exports = app; // export instead of listen
