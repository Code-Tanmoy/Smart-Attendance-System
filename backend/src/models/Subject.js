const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher: { type: String, required: true },
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true }, // HH:mm

  department: {
    type: String,
    required: true,
    // enum: ["CSE", "ECE", "ME", "EE", "CE", "IT"]
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
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subject", SubjectSchema);
