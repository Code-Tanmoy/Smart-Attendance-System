const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const Admin = require("../models/Admin");
const Teacher = require("../models/Teacher");
const nodemailer = require("nodemailer");

//SETUP FOR EMAILS
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================================
// 🛡️ SECURITY & SCHEMAS
// ==========================================

const signupSchema = z.object({
  email: z.string().email("Invalid email address format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  // 🟢 NEW: Tell Zod these fields are safe to accept
  phone: z.string().optional(),
  designation: z.string().optional(),
});

// Strict schema for Admin creating a Teacher
const teacherSignupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone number required"),
  teacherId: z.string().min(3, "Teacher ID required"),
  department: z.string().min(2, "Department required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signinSchema = z.object({
  email: z.string().min(3, "Username, Email, or Teacher ID is required"),
  password: z.string().min(6, "Password is required"),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

router.get("/check-auth", (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ loggedIn: true });
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// ==========================================
// 🔐 AUTH ROUTES
// ==========================================

// 🟢 UPDATED: ADMIN SIGNUP (Now accepts phone & designation)
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, phone, designation } =
      signupSchema.parse(req.body);

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Save all the fields to the database
    const admin = new Admin({
      username,
      email,
      password: hashed,
      phone: phone || "",
      designation: designation || "Admin",
    });

    await admin.save();

    console.log("✅ Admin created:", admin.email);
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// TEACHER REGISTRATION (Admin uses this to add teachers)
router.post("/register-teacher", async (req, res) => {
  try {
    const { name, email, phone, teacherId, department, password } =
      teacherSignupSchema.parse(req.body);

    // Check if email or Teacher ID already exists
    const exists = await Teacher.findOne({ $or: [{ email }, { teacherId }] });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Email or Teacher ID already registered" });
    }

    // Match your existing hashing style
    const hashed = await bcrypt.hash(password, 10);

    const teacher = new Teacher({
      name,
      email,
      phone,
      teacherId,
      department,
      password: hashed,
    });

    await teacher.save();
    console.log("✅ Teacher created:", teacher.teacherId);

    // 🟢 EMAIL DISPATCH LOGIC
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔒 Your SmartTrack Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #2563eb; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SmartTrack Portal</h1>
          </div>
          <div style="padding: 32px; background-color: #f8fafc;">
            <p style="font-size: 16px; color: #334155;">Hello <strong>Prof. ${name}</strong>,</p>
            <p style="font-size: 16px; color: #334155;">Your administrator has successfully created your faculty account. Below are your secure login credentials:</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #475569;"><strong>Teacher ID (Login):</strong> <span style="color: #2563eb; font-family: monospace; font-size: 16px;">${teacherId}</span></p>
              <p style="margin: 0; font-size: 15px; color: #475569;"><strong>Temporary Password:</strong> <span style="color: #2563eb; font-family: monospace; font-size: 16px;">${password}</span></p>
            </div>

            <p style="font-size: 14px; color: #ef4444; font-weight: bold;">⚠️ Security Warning: It is recommended to change your password.</p>
          </div>
        </div>
      `,
    };

    // Send the email asynchronously
    transporter.sendMail(mailOptions).catch((err) => {
      console.error("⚠️ Failed to send welcome email:", err);
    });

    res.status(201).json({
      message: "Teacher account created & credentials emailed successfully!",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UNIFIED SIGNIN (Checks Admin, then checks Teacher)
router.post("/signin", loginLimiter, async (req, res) => {
  try {
    const { email, password } = signinSchema.parse(req.body);

    // 1. First, check if it's an Admin
    let user = await Admin.findOne({ $or: [{ email }, { username: email }] });
    let role = "admin";

    // 2. If not an Admin, check if it's a Teacher (Logging in via email or Teacher ID)
    if (!user) {
      user = await Teacher.findOne({
        $or: [{ email }, { teacherId: email.toUpperCase() }],
      });
      role = "teacher";
    }

    // 3. If neither, reject
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Verify Password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error(
        "CRITICAL: JWT_SECRET is not defined in environment variables.",
      );
    }

    const token = jwt.sign(
      { id: user._id, role: role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.cookie("token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log(`✅ ${role.toUpperCase()} logged in:`, user.email);

    // Send the correct response based on who logged in
    if (role === "admin") {
      res.status(200).json({
        message: "Admin signin successful",
        role: "admin",
        admin: { username: user.username, email: user.email },
      });
    } else {
      res.status(200).json({
        message: "Teacher signin successful",
        role: "teacher",
        teacher: {
          name: user.name,
          email: user.email,
          teacherId: user.teacherId,
        },
      });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  return res.json({ message: "Logged out successfully" });
});

// ==========================================
// 👔 TEACHER MANAGEMENT API
// ==========================================

// GET all teachers for the Admin Dashboard
router.get("/api/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching teachers" });
  }
});

// PUT: Update a teacher's details
router.put("/api/teachers/:id", async (req, res) => {
  try {
    const { name, email, phone, department } = req.body;

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, department },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json(updatedTeacher);
  } catch (err) {
    res.status(500).json({ message: "Error updating teacher" });
  }
});

// DELETE a teacher
router.delete("/api/teachers/:id", async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ message: "Teacher deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting teacher" });
  }
});

// GET: Fetch all Admins
router.get("/api/admins", async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Error fetching admins" });
  }
});

// DELETE: Remove an Admin
router.delete("/api/admins/:id", async (req, res) => {
  try {
    // 🛡️ THE LAST MAN STANDING RULE
    const adminCount = await Admin.countDocuments();
    if (adminCount <= 1) {
      return res.status(403).json({
        message:
          "Action Denied: You cannot delete the last remaining Master Admin. The system must have at least one administrator.",
      });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Please add a Admin Before deleting this one" });
  }
});

// ======================================================
// 🟢 SYSTEM BOOTSTRAP ROUTES (INITIAL SETUP)
// ======================================================

// GET: Check if the system needs a Master Admin
router.get("/api/system/setup-status", async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      return res.json({
        setupRequired: true,
        message: "System needs initialization.",
      });
    }
    return res.json({ setupRequired: false, message: "System is secure." });
  } catch (err) {
    console.error("Setup Status Error:", err);
    res.status(500).json({ message: "Error checking system status." });
  }
});

// PUT: Update an Admin's details
router.put("/api/admins/:id", async (req, res) => {
  try {
    const { username, email, phone, designation } = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      { username, email, phone, designation },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(updatedAdmin);
  } catch (err) {
    res.status(500).json({ message: "Error updating admin" });
  }
});

// POST: Create the First Master Admin (SELF-LOCKING)
router.post("/api/system/setup-admin", async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({
        message:
          "Forbidden: Setup is complete. New admins must be created from the internal dashboard.",
      });
    }

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const masterAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await masterAdmin.save();

    res
      .status(201)
      .json({ message: "Master Admin created successfully! System locked." });
  } catch (err) {
    console.error("Setup Admin Error:", err);
    res
      .status(500)
      .json({ message: "Error setting up Master Admin.", error: err.message });
  }
});

module.exports = router;
