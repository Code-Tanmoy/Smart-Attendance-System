const express = require("express");
const router = express.Router();
const PeriodwiseAttendanceLog = require("../models/PeriodwiseAttendanceLog");
const Student = require("../models/Student");
const AttendanceLog = require("../models/AttendanceLog");
const Subject = require("../models/Subject");
const {
  ArchivedPeriodwiseLog,
  ArchivedDailyLog,
} = require("../models/ArchivedLogs");

// Helper: Get Current Day Name
function getCurrentDayName(dateObj) {
  return dateObj.toLocaleString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });
}

// Helper: Get Current Time "HH:mm"
function getCurrentTimeStats(dateObj) {
  const kolkataTime = new Date(
    dateObj.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const hours = kolkataTime.getHours().toString().padStart(2, "0");
  const minutes = kolkataTime.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// 🟢 RESTORED: GET All Attendance Logs (This fixes the empty table & schedule)
router.get("/", async (req, res) => {
  try {
    const logs = await PeriodwiseAttendanceLog.find().sort({
      recognizedAt: -1,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 🟢 UPGRADED: Current Active Periods (Now supports multiple simultaneous classes)
router.get("/current", async (req, res) => {
  try {
    const now = new Date();
    const dayName = getCurrentDayName(now);
    const timeString = getCurrentTimeStats(now);

    if (dayName === "Saturday" || dayName === "Sunday")
      return res.json({ periods: [] });

   // 🟢 UPDATED: Now checks if today (dayName) is inside the 'day' array
    const activeSubjects = await Subject.find({
      day: dayName, // MongoDB automatically handles checking inside the array!
      startTime: { $lte: timeString },
      endTime: { $gte: timeString },
    });

    if (activeSubjects.length > 0) {
      // Map to an array of objects so the frontend knows exactly which ones are live
      const activeList = activeSubjects.map((sub) => ({
        id: sub._id.toString(),
        name: sub.name,
        department: sub.department,
      }));
      res.json({ periods: activeList });
    } else {
      res.json({ periods: [] });
    }
  } catch (err) {
    res.status(500).json({ periods: [] });
  }
});

// 🚀 POST: Save Attendance (STRICT SUBJECT ID LOGIC - Unchanged from your successful test)
router.post("/", async (req, res) => {
  const { urn, subjectId, recognizedAt } = req.body;

  if (!urn || !subjectId) {
    return res
      .status(400)
      .json({ message: "URN and Class Session (Subject ID) are required." });
  }
  // 🟢 NEW FIX: The Holiday / Weekend Blocker
  // Determine the date (either from manual entry or current time)
  const attendanceDate = recognizedAt ? new Date(recognizedAt) : new Date();
  const dayName = getCurrentDayName(attendanceDate);

  if (dayName === "Saturday" || dayName === "Sunday") {
    return res.status(403).json({
      message: `Access Denied: College is closed. Cannot mark attendance on ${dayName}.`,
    });
  }

  try {
    const student = await Student.findOne({ urn });
    if (!student)
      return res
        .status(404)
        .json({ message: "Student not enrolled in system." });

    const activeSubject = await Subject.findById(subjectId);
    if (!activeSubject) {
      return res.status(400).json({ message: "Invalid Class Selected." });
    }

    const isCorrectDept = student.department === activeSubject.department;
    const isCorrectYear = student.year === activeSubject.year;
    const isCorrectSem = student.semester === activeSubject.semester;

    if (!isCorrectDept || !isCorrectYear || !isCorrectSem) {
      return res.status(403).json({
        message: `Denied! This class is for ${activeSubject.department} ${activeSubject.year} (${activeSubject.semester} Sem). You belong in ${student.department} ${student.year}.`,
      });
    }

    // 🟢 NEW FIX: Ensure the class actually runs on this specific day
    // Handle both cases: if 'day' is a string (old data) or an array (new data)
    const activeDays = Array.isArray(activeSubject.day) ? activeSubject.day : [activeSubject.day];
    
    if (!activeDays.includes(dayName)) {
      return res.status(400).json({
        message: `Schedule Mismatch: ${activeSubject.name} is not scheduled for ${dayName}.`,
      });
    }

    const now = recognizedAt ? new Date(recognizedAt) : new Date();
    // 🛡️ SECURITY CHECK: Prevent Future Dates
    const attendanceDateObj = new Date(now);
    if (attendanceDateObj > new Date()) {
      return res.status(400).json({
        message:
          "Invalid Action: You cannot record attendance for a future time.",
      });
    }

    // 🛡️ SECURITY CHECK: Ensure the time matches the subject's strict schedule
    const kolkataTime = new Date(
      attendanceDateObj.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );
    const submittedTimeStr = `${kolkataTime.getHours().toString().padStart(2, "0")}:${kolkataTime.getMinutes().toString().padStart(2, "0")}`;

    if (
      submittedTimeStr < activeSubject.startTime ||
      submittedTimeStr > activeSubject.endTime
    ) {
      return res.status(400).json({
        message: `Time Mismatch! You submitted ${submittedTimeStr}, but ${activeSubject.name} strictly runs from ${activeSubject.startTime} to ${activeSubject.endTime}.`,
      });
    }

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    const existingLog = await PeriodwiseAttendanceLog.findOne({
      urn,
      period: activeSubject.name,
      recognizedAt: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingLog) {
      return res.status(400).json({
        message: `Attendance already marked for ${activeSubject.name}.`,
      });
    }

    const periodLog = new PeriodwiseAttendanceLog({
      urn,
      name: student.name,
      course: student.department,
      period: activeSubject.name,
      recognizedAt: now,
    });
    await periodLog.save();

    const dailyExists = await AttendanceLog.findOne({
      urn,
      recognizedAt: { $gte: startOfDay, $lt: endOfDay },
    });

    if (!dailyExists) {
      await new AttendanceLog({
        urn,
        name: student.name,
        course: student.department,
        recognizedAt: now,
      }).save();
    }

    return res.status(200).json({
      message: `Success! Attendance recorded for ${activeSubject.name}`,
      log: periodLog,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ADMIN ONLY: End Semester (Archive & Reset)
router.post("/end-semester", async (req, res) => {
  try {
    // 1. Scoop up all the current active logs
    const currentPeriodLogs = await PeriodwiseAttendanceLog.find({});
    const currentDailyLogs = await AttendanceLog.find({});

    // 2. Safely copy them into the Archive collections
    if (currentPeriodLogs.length > 0) {
      await ArchivedPeriodwiseLog.insertMany(currentPeriodLogs);
    }
    if (currentDailyLogs.length > 0) {
      await ArchivedDailyLog.insertMany(currentDailyLogs);
    }

    // 3. ONLY after a safe copy, clear the active dashboards
    await PeriodwiseAttendanceLog.deleteMany({});
    await AttendanceLog.deleteMany({});

    res
      .status(200)
      .json({
        message: "Semester successfully archived! Active dashboards are reset.",
      });
  } catch (err) {
    console.error("Error archiving semester:", err);
    res.status(500).json({ message: "Failed to archive attendance." });
  }
});

module.exports = router;
