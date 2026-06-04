const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const Student = require("../models/Student");
const PeriodwiseAttendanceLog = require("../models/PeriodwiseAttendanceLog");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher"); // 🟢 NEW: Imported Teacher model for phone number lookup
const auth = require("../middleware/auth");

// ==========================================
// 🛡️ SECURITY & SCHEMAS
// ==========================================

// 1. STRICT SCHEMA: College Hierarchy & Validation
const studentSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    urn: z
      .string()
      .regex(/^\d+$/, "URN must contain only numbers")
      .min(5, "URN must be at least 5 digits"),
    email: z.string().email("Invalid email address format"),
    status: z
      .enum(["Active", "Graduated", "Dropped"])
      .default("Active")
      .optional(),
    age: z.coerce
      .number()
      .int()
      .min(17, "Age must be at least 17")
      .max(30, "Age must be under 30"),
    phone: z
      .string()
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    department: z.enum(["CSE", "CS", "IT", "AI", "ECE", "ME"], {
      errorMap: () => ({ message: "Invalid Department" }),
    }),
    year: z.enum(["1st Year", "2nd Year", "3rd Year", "4th Year"]),
    semester: z.enum(["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]),
  })
  .superRefine((data, ctx) => {
    const validSemesters = {
      "1st Year": ["1st", "2nd"],
      "2nd Year": ["3rd", "4th"],
      "3rd Year": ["5th", "6th"],
      "4th Year": ["7th", "8th"],
    };

    if (!validSemesters[data.year].includes(data.semester)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Logic Error: A ${data.year} student cannot be in the ${data.semester} semester.`,
        path: ["semester"],
      });
    }
  });

// 2. STRICT SCHEMA: Student Auth Validation
const studentAuthSchema = z.object({
  urn: z
    .string()
    .regex(/^\d+$/, "URN must contain only numbers")
    .min(4, "URN must be at least 4 digits"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// 🟢 NEW: Strict schema for Student updating their own profile
const studentUpdateSchema = z.object({
  email: z.string().email("Invalid email address format"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

// 3. RATE LIMITER: Prevent Brute Force Attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// 🛡️ ADMIN ROUTES
// ==========================================

// POST: Register New Student with College Hierarchy
router.post("/", auth, async (req, res) => {
  try {
    const validatedData = studentSchema.parse(req.body);

    const existing = await Student.findOne({ urn: validatedData.urn });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Student with this URN already exists" });
    }

    const newStudent = new Student(validatedData);
    await newStudent.save();

    res.status(200).json({
      message: "Student enrolled successfully in " + validatedData.department,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid data format",
        errors: err.errors.map((e) => e.message),
      });
    }
    console.error("Enrollment Error:", err);
    res.status(500).json({ message: "Failed to enroll student" });
  }
});

// GET: Fetch all students (with optional filters)
router.get("/", auth, async (req, res) => {
  try {
    const query = {};

    if (req.query.status) query.status = req.query.status;
    if (req.query.department) query.department = req.query.department;
    if (req.query.semester) query.semester = req.query.semester;

    const students = await Student.find(query).sort({
      department: 1,
      semester: 1,
      name: 1,
    });

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student records" });
  }
});

// ==========================================
// 🚀 LIFECYCLE ENGINES
// ==========================================

// POST: Promote Students & Wipe Old Attendance (Clean Slate)
router.post("/promote", auth, async (req, res) => {
  const { urns } = req.body;

  if (!urns || !Array.isArray(urns) || urns.length === 0) {
    return res
      .status(400)
      .json({ message: "No students selected for promotion." });
  }

  try {
    const promotionMap = {
      "1st Year": {
        "1st": { y: "1st Year", s: "2nd" },
        "2nd": { y: "2nd Year", s: "3rd" },
      },
      "2nd Year": {
        "3rd": { y: "2nd Year", s: "4th" },
        "4th": { y: "3rd Year", s: "5th" },
      },
      "3rd Year": {
        "5th": { y: "3rd Year", s: "6th" },
        "6th": { y: "4th Year", s: "7th" },
      },
      "4th Year": {
        "7th": { y: "4th Year", s: "8th" },
        "8th": { status: "Graduated" },
      },
    };

    const studentsToPromote = await Student.find({ urn: { $in: urns } });

    const updatePromises = studentsToPromote.map((student) => {
      const nextStep = promotionMap[student.year]?.[student.semester];
      if (!nextStep) return Promise.resolve();

      if (nextStep.status === "Graduated") {
        student.status = "Graduated";
      } else {
        student.year = nextStep.y;
        student.semester = nextStep.s;
      }

      return student.save();
    });

    await Promise.all(updatePromises);
    await PeriodwiseAttendanceLog.deleteMany({ urn: { $in: urns } });

    res.status(200).json({
      message: `Successfully promoted ${urns.length} students and cleared previous attendance.`,
    });
  } catch (err) {
    console.error("Promotion Error:", err);
    res
      .status(500)
      .json({ message: "Server error during promotion engine execution." });
  }
});

// ==========================================
// ✏️ EDIT STUDENT INFORMATION (BY ADMIN)
// ==========================================
router.put("/:urn", auth, async (req, res) => {
  try {
    const { urn } = req.params;

    const updateData = { ...req.body };
    delete updateData.urn;

    const updatedStudent = await Student.findOneAndUpdate(
      { urn },
      { $set: updateData },
      { new: true },
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Edit Student Error:", error);
    res.status(500).json({ message: "Server error while updating student." });
  }
});

// DELETE: Cascading Delete
router.delete("/:urn", auth, async (req, res) => {
  const { urn } = req.params;
  try {
    const deletedStudent = await Student.findOneAndDelete({ urn });
    if (!deletedStudent)
      return res.status(404).json({ message: "Student not found" });

    await PeriodwiseAttendanceLog.deleteMany({ urn });

    res
      .status(200)
      .json({ message: "Student and records deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during deletion" });
  }
});

// ==========================================
// 🚨 THE WARNING ENGINE (NODEMAILER)
// ==========================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const runWarningEngine = async () => {
  console.log("⚙️  Running Attendance Warning Engine...");

  const allLogs = await PeriodwiseAttendanceLog.find();
  const subjectSessions = {};

  allLogs.forEach((log) => {
    const dateStr = log.recognizedAt
      ? new Date(log.recognizedAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    if (!subjectSessions[log.period]) subjectSessions[log.period] = new Set();
    subjectSessions[log.period].add(dateStr);
  });

  const activeStudents = await Student.find({ status: "Active" });
  let emailsSent = 0;

  for (const student of activeStudents) {
    const mySubjects = await Subject.find({
      department: student.department,
      year: student.year,
      semester: student.semester,
    });

    if (mySubjects.length === 0) continue;

    const myLogs = await PeriodwiseAttendanceLog.find({ urn: student.urn });

    let totalPossible = 0;
    let totalAttended = myLogs.length;

    mySubjects.forEach((sub) => {
      const possible = subjectSessions[sub.name]?.size || 0;
      totalPossible += possible;
    });

    if (totalPossible === 0) continue;

    const percentage = (totalAttended / totalPossible) * 100;
    let subject = "";
    let htmlMessage = "";

    if (percentage < 50) {
      subject = "CRITICAL: Attendance Danger Zone Alert";
      htmlMessage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border-top: 5px solid #ef4444;">
          <h2 style="color: #ef4444;">Urgent Attendance Alert</h2>
          <p>Dear <b>${student.name}</b>,</p>
          <p>Your current attendance has fallen to <b style="color: #ef4444; font-size: 18px;">${percentage.toFixed(1)}%</b>.</p>
          <p>You have attended ${totalAttended} out of ${totalPossible} classes. It will be mathematically difficult to recover. Please contact your department head immediately.</p>
        </div>
      `;
    } else if (percentage < 75) {
      subject = "Warning: Attendance Below 75%";
      htmlMessage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border-top: 5px solid #eab308;">
          <h2 style="color: #ca8a04;">Attendance Warning</h2>
          <p>Dear <b>${student.name}</b>,</p>
          <p>Your current attendance has dropped to <b style="color: #ca8a04; font-size: 18px;">${percentage.toFixed(1)}%</b>.</p>
          <p>You have attended ${totalAttended} out of ${totalPossible} classes. Please ensure you attend upcoming classes to easily recover your average.</p>
        </div>
      `;
    }

    if (subject !== "") {
      try {
        await transporter.sendMail({
          from: `"Smart Attendance System" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: subject,
          html: htmlMessage,
        });
        emailsSent++;
      } catch (err) {
        console.error(`❌ Failed to send email to ${student.email}`, err);
      }
    }
  }

  console.log(`✅ Warning Engine Complete. Sent ${emailsSent} emails.`);
  return emailsSent;
};

// AUTOMATED: Run every Friday at 5:00 PM (17:00)
cron.schedule("0 17 * * 5", async () => {
  const date = new Date();
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  if (weekOfMonth === 2 || weekOfMonth === 4) {
    await runWarningEngine();
  }
});

router.post("/trigger-warnings", auth, async (req, res) => {
  try {
    const count = await runWarningEngine();
    res.status(200).json({
      message: `Success! Engine manually triggered. Fired ${count} warning emails.`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to manually trigger warning engine." });
  }
});

// ==========================================
// 🎓 STUDENT PORTAL ROUTES
// ==========================================

// 1. STUDENT SIGNUP (Claim Account)
router.post("/student-signup", async (req, res) => {
  try {
    const { urn, password } = studentAuthSchema.parse(req.body);

    const student = await Student.findOne({ urn });
    if (!student) {
      return res.status(404).json({
        message: "URN not found. Please see admin to enroll your face first.",
      });
    }

    if (student.password) {
      return res
        .status(400)
        .json({ message: "Account already claimed. Please login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    student.password = hashedPassword;
    await student.save();

    res
      .status(200)
      .json({ message: "Account successfully created! You can now log in." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error during signup." });
  }
});

// 2. STUDENT LOGIN
router.post("/student-login", loginLimiter, async (req, res) => {
  try {
    const { urn, password } = studentAuthSchema.parse(req.body);

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

    if (!process.env.JWT_SECRET) {
      throw new Error(
        "CRITICAL: JWT_SECRET is not defined in environment variables.",
      );
    }

    const token = jwt.sign(
      { id: student._id, urn: student.urn, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token, { httpOnly: true });
    res
      .status(200)
      .json({ message: "Login Successful", role: "student", urn: student.urn });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// 🟢 2.5 UPDATE OWN PROFILE (Restricted to Email & Phone)
router.put("/me/update-profile", auth, async (req, res) => {
  try {
    // Security Check: Only a logged-in student can hit this route
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Unauthorized action." });
    }

    const { email, phone } = studentUpdateSchema.parse(req.body);

    // Check if the requested email is already used by a DIFFERENT student
    const emailExists = await Student.findOne({
      email,
      urn: { $ne: req.user.urn },
    });
    if (emailExists) {
      return res.status(400).json({
        message: "This email is already registered to another student.",
      });
    }

    // Update the student using the URN pulled directly from their secure JWT
    const updatedStudent = await Student.findOneAndUpdate(
      { urn: req.user.urn },
      { $set: { email, phone } },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      message: "Profile updated successfully!",
      profile: updatedStudent,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Server error updating profile." });
  }
});

// 🟢 3. GET STUDENT DASHBOARD DATA
router.get("/me/:urn", auth, async (req, res) => {
  try {
    const { urn } = req.params;

    const student = await Student.findOne({ urn });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const mySubjects = await Subject.find({
      department: student.department,
      year: student.year,
      semester: student.semester,
    });

    const myLogs = await PeriodwiseAttendanceLog.find({ urn });
    const allLogs = await PeriodwiseAttendanceLog.find();

    const subjectSessions = {};
    allLogs.forEach((log) => {
      const dateStr = new Date(log.recognizedAt).toISOString().split("T")[0];
      if (!subjectSessions[log.period]) subjectSessions[log.period] = new Set();
      subjectSessions[log.period].add(dateStr);
    });

    let totalPossible = 0;
    let totalAttended = myLogs.length;

    // 🟢 UPDATED: Use Promise.all to fetch the live Teacher phone number asynchronously
    const breakdown = await Promise.all(
      mySubjects.map(async (sub) => {
        const possible = subjectSessions[sub.name]?.size || 0;
        const attended = myLogs.filter((log) => log.period === sub.name).length;
        totalPossible += possible;

        // Fetch the teacher's phone number using the teacherId saved in the Subject
        let teacherPhone = "N/A";
        if (sub.teacherId) {
          const teacherDoc = await Teacher.findOne({
            teacherId: sub.teacherId,
          });
          if (teacherDoc && teacherDoc.phone) {
            teacherPhone = teacherDoc.phone;
          }
        }

        return {
          name: sub.name,
          teacher: sub.teacher,
          teacherPhone: teacherPhone,
          startTime: sub.startTime,
          endTime: sub.endTime,
          possible,
          attended,
          percentage:
            possible === 0 ? 0 : Math.round((attended / possible) * 100),
        };
      }),
    );

    const overallPercentage =
      totalPossible === 0
        ? 0
        : Math.round((totalAttended / totalPossible) * 100);

    res.status(200).json({
      profile: student,
      schedule: breakdown, // 🟢 Returning the newly mapped breakdown array as the schedule!
      stats: { totalPossible, totalAttended, overallPercentage, breakdown },
    });
  } catch (err) {
    console.error("Dashboard Data Error:", err);
    res.status(500).json({ message: "Server error fetching student data." });
  }
});

module.exports = router;
