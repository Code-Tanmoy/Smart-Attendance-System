const mongoose = require('mongoose');

const periodwiseAttendanceLogSchema = new mongoose.Schema({
  urn: String,
  name: String,
  course: String,
  period: String,
  recognizedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PeriodwiseAttendanceLog', periodwiseAttendanceLogSchema);
