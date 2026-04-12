

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Student = require("../models/Student");
const PeriodwiseAttendanceLog = require("../models/PeriodwiseAttendanceLog");
const Subject = require("../models/Subject"); // 🟢 Added for Dashboard calculations
const auth = require("../middleware/auth"); // 🟢 Bring the lock into this file

// ==========================================
// 🛡️ ADMIN ROUTES (Existing)
// ==========================================

// POST: Register New Student with College Hierarchy
router.post("/", auth, async (req, res) => {
  const { name, urn, age, phone, department, year, semester } = req.body;

  if (!name || !urn || !age || !phone || !department || !year || !semester) {
    return res
      .status(400)
      .json({ message: "All college hierarchy fields are required" });
  }

  try {
    const existing = await Student.findOne({ urn });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Student with this URN already exists" });
    }

    const newStudent = new Student({
      name,
      urn,
      age,
      phone,
      department,
      year,
      semester,
    });

    await newStudent.save();
    res
      .status(200)
      .json({ message: "Student enrolled successfully in " + department });
  } catch (err) {
    console.error("Enrollment Error:", err);
    res.status(500).json({ message: "Failed to enroll student" });
  }
});

// GET: Fetch all students (Sorted by Department and Year)
router.get("/",auth, async (_req, res) => {
  try {
    const students = await Student.find().sort({
      department: 1,
      year: 1,
      name: 1,
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student records" });
  }
});

// DELETE: Cascading Delete
router.delete("/:urn",auth, async (req, res) => {
  const { urn } = req.params;
  try {
    const deletedStudent = await Student.findOneAndDelete({ urn });
    if (!deletedStudent)
      return res.status(404).json({ message: "Student not found" });

    // Clean up attendance logs
    await PeriodwiseAttendanceLog.deleteMany({ urn });

    res
      .status(200)
      .json({ message: "Student and records deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during deletion" });
  }
});

// ==========================================
// 🎓 STUDENT PORTAL ROUTES (New)
// ==========================================

// 🟢 1. STUDENT SIGNUP (Claim Account)
router.post("/student-signup", async (req, res) => {
  try {
    const { urn, password } = req.body;

    // Check if the admin has actually enrolled this student
    const student = await Student.findOne({ urn });
    if (!student) {
      return res
        .status(404)
        .json({
          message: "URN not found. Please see admin to enroll your face first.",
        });
    }

    // Check if the account is already claimed
    if (student.password) {
      return res
        .status(400)
        .json({ message: "Account already claimed. Please login." });
    }

    // Hash password and save
    const hashedPassword = await bcrypt.hash(password, 10);
    student.password = hashedPassword;
    await student.save();

    res
      .status(200)
      .json({ message: "Account successfully created! You can now log in." });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error during signup." });
  }
});

// 🟢 2. STUDENT LOGIN
router.post("/student-login", async (req, res) => {
  try {
    const { urn, password } = req.body;

    const student = await Student.findOne({ urn });
    if (!student || !student.password) {
      return res
        .status(404)
        .json({ message: "Student not found or account not claimed yet." });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Generate Student JWT
    const token = jwt.sign(
      { id: student._id, urn: student.urn, role: "student" },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "7d" },
    );

    res.cookie("token", token, { httpOnly: true });
    res
      .status(200)
      .json({ message: "Login Successful", role: "student", urn: student.urn });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// 🟢 3. GET STUDENT DASHBOARD DATA
router.get("/me/:urn",auth, async (req, res) => {
  try {
    const { urn } = req.params;

    const student = await Student.findOne({ urn });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Fetch only subjects meant for this student's specific hierarchy
    const mySubjects = await Subject.find({
      department: student.department,
      year: student.year,
      semester: student.semester,
    });

    const myLogs = await PeriodwiseAttendanceLog.find({ urn });
    const allLogs = await PeriodwiseAttendanceLog.find();

    // Calculate total times each subject has been held globally
    const subjectSessions = {};
    allLogs.forEach((log) => {
      const dateStr = new Date(log.recognizedAt).toISOString().split("T")[0];
      if (!subjectSessions[log.period]) subjectSessions[log.period] = new Set();
      subjectSessions[log.period].add(dateStr);
    });

    let totalPossible = 0;
    let totalAttended = myLogs.length;

    const breakdown = mySubjects.map((sub) => {
      const possible = subjectSessions[sub.name]?.size || 0;
      const attended = myLogs.filter((log) => log.period === sub.name).length;
      totalPossible += possible;
      return {
        name: sub.name,
        teacher: sub.teacher,
        startTime: sub.startTime,
        endTime: sub.endTime,
        possible,
        attended,
        percentage:
          possible === 0 ? 0 : Math.round((attended / possible) * 100),
      };
    });

    const overallPercentage =
      totalPossible === 0
        ? 0
        : Math.round((totalAttended / totalPossible) * 100);

    res.status(200).json({
      profile: student,
      schedule: mySubjects,
      stats: { totalPossible, totalAttended, overallPercentage, breakdown },
    });
  } catch (err) {
    console.error("Dashboard Data Error:", err);
    res.status(500).json({ message: "Server error fetching student data." });
  }
});

module.exports = router;
