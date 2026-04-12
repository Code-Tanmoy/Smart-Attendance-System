const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Admin = require("../models/Admin");

//Cookie Options for both Login & Logout
const COOKIE_OPTIONS = {
  httpOnly: true,
  // Secure is false on localhost, true on production (HTTPS)
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax", // 'lax' is usually better for top-level navigation than 'strict'
  path: "/", // CRITICAL: Ensures cookie is cleared from all paths
};

// CHECK AUTH (used by frontend guards)
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

// SIGNUP
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = new Admin({ username, email, password: hashed });
    await admin.save();

    console.log("✅ Admin created:", admin.email);

    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// SIGNIN (email OR username in same box)
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email/Username & password required" });
    }

    // Find by email OR username
    const admin = await Admin.findOne({
      $or: [{ email }, { username: email }],
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ FIX: Use consistent options AND add maxAge
    res.cookie("token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000, // 1 Day in milliseconds
    });

    console.log("✅ Admin logged in:", admin.email);

    res.status(200).json({
      message: "Signin successful",
      admin: { username: admin.username, email: admin.email },
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  // ✅ FIX: Clear using EXACT same options (path is critical here)
  res.clearCookie("token", COOKIE_OPTIONS);

  return res.json({ message: "Logged out successfully" });
});

module.exports = router;
