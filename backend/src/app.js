// // backend/src/app.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const mongoSanitize = require("express-mongo-sanitize");

const auth = require("./middleware/auth");

const studentsRoutes = require("./routes/students.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const periodwiseRoutes = require("./routes/periodwise.routes");
const authRoutes = require("./routes/auth.routes");
const reportsRoutes = require("./routes/reports.routes");
const subjectRoutes = require("./routes/subject.routes");
const securityRoutes = require("./routes/security.routes");

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  "http://localhost:5173", // Local Vite frontend
  process.env.FRONTEND_URL, // Deployed Vercel frontend URL
];

app.set("trust proxy", 1);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(bodyParser.json());

connectDB();

// : Only sanitize the body to prevent Express crashes
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body, { replaceWith: "_" });
  }
  next();
});
// public
app.use("/", authRoutes);
app.use("/api/security", securityRoutes);

// 🔒 PROTECTED ROUTES
app.use("/api/students", studentsRoutes);
app.use("/api/attendance", auth, attendanceRoutes);
app.use("/api/periodwise-attendance", auth, periodwiseRoutes);
app.use("/api/reports", auth, reportsRoutes);
app.use("/api/subjects", subjectRoutes);
app.listen(PORT, () => {
  console.log(`Server successfully started and listening on port ${PORT}`);
});
