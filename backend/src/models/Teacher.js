const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true,sparse: true, // if some  don't have emails yet
    index: true, unique: true },
  phone: { type: String, required: true },
  teacherId: { type: String, required: true, unique: true, uppercase: true }, 
  department: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "teacher" },
  createdAt: { type: Date, default: Date.now },
  
  //  Password Reset 
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

module.exports = mongoose.model("Teacher", TeacherSchema);