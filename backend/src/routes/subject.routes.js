const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");

/**
 * 🛡️ HELPER: Check for Teacher Schedule Conflicts
 * 🟢 UPDATED: Now checks using the unique teacherId instead of the name
 */
async function checkTeacherConflict(
  teacherId,
  startTime,
  endTime,
  excludeSubjectId = null,
) {
  const query = {
    teacherId: teacherId, // 🟢 FIX: Checking by ID
    $or: [
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
    ],
  };

  if (excludeSubjectId) {
    query._id = { $ne: excludeSubjectId };
  }
  return await Subject.findOne(query);
}

// GET: Fetch all subjects sorted by start time
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ startTime: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// POST: Add a new Subject with Conflict Validation
router.post("/", async (req, res) => {
  // 🟢 FIX: Extracting teacherId from the frontend request
  const {
    name,
    teacher,
    teacherId,
    startTime,
    endTime,
    department,
    year,
    semester,
  } = req.body;

  // 🟢 FIX: Checking if teacherId exists
  if (
    !name ||
    !teacher ||
    !teacherId ||
    !startTime ||
    !endTime ||
    !department ||
    !year ||
    !semester
  ) {
    return res.status(400).json({
      message: "All fields, including Teacher ID, Dept and Year, are required",
    });
  }

  try {
    // 🟢 FIX: Pass teacherId to the conflict checker
    const conflict = await checkTeacherConflict(teacherId, startTime, endTime);
    if (conflict) {
      return res.status(400).json({
        message: `Scheduling Conflict: ${teacher} is already taking "${conflict.name}" class between ${conflict.startTime} and ${conflict.endTime}.`,
      });
    }

    // 🟢 FIX: Passing teacherId to the database
    const newSubject = new Subject({
      name,
      teacher,
      teacherId,
      startTime,
      endTime,
      department,
      year,
      semester,
    });

    await newSubject.save();
    res.json(newSubject);
  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT: Update/Edit a Subject
router.put("/:id", async (req, res) => {
  // 🟢 FIX: Extract teacherId for edits
  const { teacher, teacherId, startTime, endTime } = req.body;

  try {
    // 🟢 FIX: Pass teacherId to conflict checker
    const conflict = await checkTeacherConflict(
      teacherId,
      startTime,
      endTime,
      req.params.id,
    );
    if (conflict) {
      return res.status(400).json({
        message: `Conflict Detected: ${teacher} is already assigned to "${conflict.name}" during this time slot.`,
      });
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    res.json(updatedSubject);
  } catch (err) {
    console.error("Error updating subject:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// DELETE: Remove a Subject
router.delete("/:id", async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
