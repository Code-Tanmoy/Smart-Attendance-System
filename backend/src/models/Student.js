const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  urn: { type: String, required: true, unique: true,index: true },
  age: { type: Number, required: true },
  phone: { type: String, required: true },
  password: { type: String, default: null },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ["Active", "Graduated", "Dropped"],
    default: "Active",
  },
  department: {
    type: String,
    required: true,
    enum: ["CSE", "ECE", "ME", "AI", "CS", "IT"],
  },
  year: {
    type: String,
    required: true,
    enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
  },
  semester: {
    type: String,
    required: true,
    enum: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
  },
  
  //  Password Reset 
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  enrolledAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Student", StudentSchema);