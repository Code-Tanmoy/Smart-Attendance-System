// // backend/src/app.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");

const auth = require("./middleware/auth");

const studentsRoutes = require("./routes/students.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const periodwiseRoutes = require("./routes/periodwise.routes");
const authRoutes = require("./routes/auth.routes");
const reportsRoutes = require("./routes/reports.routes");
const subjectRoutes = require("./routes/subject.routes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.json());

connectDB();

// public
app.use("/", authRoutes);

// 🔒 PROTECTED ROUTES
app.use("/api/students", studentsRoutes);
app.use("/api/attendance", auth, attendanceRoutes);
app.use("/api/periodwise-attendance", auth, periodwiseRoutes);
app.use("/api/reports", auth, reportsRoutes);
app.use("/api/subjects", subjectRoutes);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
