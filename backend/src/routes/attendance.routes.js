const express = require("express");
const router = express.Router();
const AttendanceLog = require("../models/AttendanceLog");
const PeriodwiseAttendanceLog = require("../models/PeriodwiseAttendanceLog");
const Student = require("../models/Student");
const Subject = require("../models/Subject"); // 👈 Import Subject Model

// 🕒 Helper: Get Current Day Name (e.g., "Monday")
function getCurrentDayName(dateObj) {
  return dateObj.toLocaleString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });
}

// 🕒 Helper: Convert Date object to "HH:mm" string (IST)
function getCurrentTimeStats(dateObj) {
  const kolkataTime = new Date(
    dateObj.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const hours = kolkataTime.getHours().toString().padStart(2, "0");
  const minutes = kolkataTime.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`; // Returns "09:30"
}

// GET: Fetch Daily Attendance
router.get("/", async (req, res) => {
  try {
    const logs = await AttendanceLog.find().sort({ recognizedAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Manual Attendance Entry
router.post("/", async (req, res) => {
  const { name, urn, course, recognizedAt } = req.body;

  if (!name || !urn || !course) {
    return res
      .status(400)
      .json({ message: "Name, URN, and Course are required" });
  }

  try {
    // 1️⃣ VALIDATION: Check Student
    const studentExists = await Student.findOne({ urn });
    if (!studentExists) {
      return res
        .status(404)
        .json({ message: `Student with URN ${urn} is not enrolled.` });
    }

    // 2️⃣ TIMESTAMP & FUTURE CHECK
    const timestamp = recognizedAt ? new Date(recognizedAt) : new Date();
    const now = new Date();
    if (timestamp > now) {
      return res
        .status(400)
        .json({ message: "Cannot mark attendance for a future date/time." });
    }

    // 3️⃣ 🟢 DYNAMIC PERIOD DETECTION
    const dayName = getCurrentDayName(timestamp); // e.g., "Friday"
    const timeString = getCurrentTimeStats(timestamp); // e.g., "09:15"

    // Find a subject that runs on this Day AND covers this Time
    // We compare strings: "09:00" <= "09:15" <= "09:50"
    const activeSubject = await Subject.findOne({
      day: dayName,
      startTime: { $lte: timeString },
      endTime: { $gte: timeString },
    });

    let detectedPeriod = activeSubject ? activeSubject.name : "No Period";

    // 🛑 If it's Saturday/Sunday or outside class hours, activeSubject will be null
    // and detectedPeriod will be "No Period".

    let dailySaved = false;
    let periodSaved = false;

    // 4️⃣ LOG 1: Daily Attendance
    const startOfDay = new Date(timestamp);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    const existingDaily = await AttendanceLog.findOne({
      urn,
      recognizedAt: { $gte: startOfDay, $lt: endOfDay },
    });

    if (!existingDaily) {
      const dailyLog = new AttendanceLog({
        name: studentExists.name,
        urn,
        course: studentExists.course,
        recognizedAt: timestamp,
      });
      await dailyLog.save();
      dailySaved = true;
    }

    // 5️⃣ LOG 2: Period Attendance (Only if a valid period was found)
    if (detectedPeriod !== "No Period") {
      const existingPeriodLog = await PeriodwiseAttendanceLog.findOne({
        urn,
        period: detectedPeriod,
        recognizedAt: { $gte: startOfDay, $lt: endOfDay },
      });

      if (!existingPeriodLog) {
        const periodLog = new PeriodwiseAttendanceLog({
          urn,
          name: studentExists.name,
          course: studentExists.course,
          period: detectedPeriod,
          recognizedAt: timestamp,
        });
        await periodLog.save();
        periodSaved = true;
      }
    }

    // 6️⃣ FINAL RESPONSE
    if (!dailySaved && !periodSaved) {
      return res.status(400).json({ message: `Attendance already recorded.` });
    }

    if (periodSaved) {
      return res
        .status(200)
        .json({
          message: `Attendance marked for Day & ${detectedPeriod} Class!`,
        });
    }

    return res
      .status(200)
      .json({
        message: "Daily attendance marked (No class scheduled at this time).",
      });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({ message: "Failed to mark attendance" });
  }
});

module.exports = router;

