// models/ArchivedLogs.js
const mongoose = require("mongoose");

// Exact copy of your Periodwise schema
const ArchivedPeriodwiseSchema = new mongoose.Schema({
  urn: { type: String, required: true },
  name: { type: String },
  course: { type: String },
  period: { type: String },
  recognizedAt: { type: Date },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  archivedAt: { type: Date, default: Date.now } // 🟢 Tagged with the archive date
});

// Exact copy of your Daily schema
const ArchivedDailySchema = new mongoose.Schema({
  urn: { type: String, required: true },
  name: { type: String },
  course: { type: String },
  recognizedAt: { type: Date },
  archivedAt: { type: Date, default: Date.now }
});

const ArchivedPeriodwiseLog = mongoose.model("ArchivedPeriodwiseLog", ArchivedPeriodwiseSchema);
const ArchivedDailyLog = mongoose.model("ArchivedDailyLog", ArchivedDailySchema);

module.exports = { ArchivedPeriodwiseLog, ArchivedDailyLog };