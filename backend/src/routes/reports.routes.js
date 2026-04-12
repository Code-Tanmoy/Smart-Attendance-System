const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const PeriodwiseAttendanceLog = require("../models/PeriodwiseAttendanceLog");
const Subject = require("../models/Subject"); // 👈 Import Subject Model

router.get("/", async (req, res) => {
  try {
    // 1. Fetch Students & Logs
    const students = await Student.find({}, "name urn course");
    const logs = await PeriodwiseAttendanceLog.find();

    // 2. 🟢 FETCH DYNAMIC SUBJECTS (Sort by Time)
    // We only need the names, e.g., ["Java", "C++", "Python"]
    const subjectDocs = await Subject.find().sort({ startTime: 1 });
    const subjects = subjectDocs.map((sub) => sub.name);

    // 3. Calculate Stats per Student
    const reportData = students.map((student) => {
      const studentLogs = logs.filter((log) => log.urn === student.urn);
      const subjectWise = {};
      let totalAttended = 0;
      let totalClasses = 0;

      subjects.forEach((sub) => {
        // Calculate Total Classes held for this specific subject
        const allLogsForSubject = logs.filter((l) => l.period === sub);
        // Count unique dates this subject was taught
        const uniqueDates = new Set(
          allLogsForSubject.map((l) => new Date(l.recognizedAt).toDateString())
        );

        // Safety: If no classes ever held, set total to 1 to avoid divide-by-zero
        const totalSubjectClasses = uniqueDates.size || 1;

        // Count how many the student attended
        const attendedCount = studentLogs.filter(
          (l) => l.period === sub
        ).length;

        subjectWise[sub] = {
          attended: attendedCount,
          total: totalSubjectClasses,
          percentage: Math.round((attendedCount / totalSubjectClasses) * 100),
        };

        totalAttended += attendedCount;
        totalClasses += totalSubjectClasses;
      });

      // Overall Percentage
      const overallPercent =
        totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

      return {
        _id: student._id,
        name: student.name,
        urn: student.urn,
        course: student.course,
        overallPercent,
        subjectWise,
      };
    });

    res.json({
      subjects,
      students: reportData,
    });
  } catch (err) {
    console.error("Error generating reports:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
