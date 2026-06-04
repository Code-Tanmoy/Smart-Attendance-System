const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Admin = require("../models/Admin");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const auth = require("../middleware/auth"); // Needed to check who is logged in

const router = express.Router();

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================================
// 1. CHANGE PASSWORD (LOGGED IN)
// ==========================================
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // The auth middleware should provide req.user (which contains id and role)
    const { id, role } = req.user;

    // Determine which database to look in
    let Model;
    if (role === "admin") Model = Admin;
    else if (role === "teacher") Model = Teacher;
    else if (role === "student") Model = Student;
    else return res.status(400).json({ message: "Invalid user role" });

    const user = await Model.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ message: "Server error during password change" });
  }
});

// ==========================================
// 2. FORGOT PASSWORD (LOGGED OUT)
// ==========================================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Search databases in order to find who owns this email
    let user = await Admin.findOne({ email });
    let Model = Admin;

    if (!user) {
      user = await Teacher.findOne({ email });
      Model = Teacher;
    }
    if (!user) {
      user = await Student.findOne({ email });
      Model = Student;
    }

    if (!user) {
      // Security best practice: Don't reveal if email exists or not to prevent user enumeration
      return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
    }

    // Generate a secure random token (The key)
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash the token to save in the database (The lock)
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expiration to 15 minutes from now
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Create the reset URL pointing to your React frontend
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "🔒 SmartTrack Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Please click the button below to set a new password. This link is valid for 15 minutes.</p>
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">Reset My Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions).catch((err) => console.error("Email error:", err));

    res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error processing request" });
  }
});

// ==========================================
// 3. RESET PASSWORD (USING THE LINK)
// ==========================================
router.put("/reset-password/:token", async (req, res) => {
  try {
    // Re-hash the token from the URL to compare with the database
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // We must search all three models again to see who has this active token
    const query = {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Token must not be expired
    };

    let user = await Admin.findOne(query);
    if (!user) user = await Teacher.findOne(query);
    if (!user) user = await Student.findOne(query);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Token is valid! Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Wipe the tokens from the database so they can't be used again
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error resetting password" });
  }
});

module.exports = router;