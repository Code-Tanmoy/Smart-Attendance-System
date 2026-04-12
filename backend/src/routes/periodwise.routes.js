const express = require("express");
const router = express.Router();
const PeriodwiseAttendanceLog = require("../models/PeriodwiseAttendanceLog");
const Student = require("../models/Student");
const AttendanceLog = require("../models/AttendanceLog");
const Subject = require("../models/Subject");

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

    // Use .find() instead of .findOne() to get ALL classes happening right now
    const activeSubjects = await Subject.find({
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

module.exports = router;
