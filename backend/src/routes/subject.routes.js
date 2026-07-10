const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");

/*****
 * HELPER: Check for Teacher Schedule Conflicts
 * UPDATED: Now accepts an array of days and uses the $in operator
 */
async function checkTeacherConflict(
  teacherId,
  daysArray, // 🟢 NOW EXPECTING AN ARRAY OF DAYS
  startTime,
  endTime,
  excludeSubjectId = null,
) {
  const query = {
    teacherId: teacherId,
    // 🟢 NEW: Checks if the teacher has a class on ANY of the submitted days
    day: { $in: daysArray },
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
  const {
    name,
    teacher,
    teacherId,
    day, // 🟢 Expecting an array like ["Monday", "Wednesday"]
    startTime,
    endTime,
    department,
    year,
    semester,
  } = req.body;

  // 🟢 Updated Validation: Check if day exists, is an array, and is not empty
  if (
    !name ||
    !teacher ||
    !teacherId ||
    !day ||
    !Array.isArray(day) ||
    day.length === 0 ||
    !startTime ||
    !endTime ||
    !department ||
    !year ||
    !semester
  ) {
    return res.status(400).json({
      message:
        "All fields are required, and at least one Day must be selected.",
    });
  }

  try {
    const conflict = await checkTeacherConflict(
      teacherId,
      day,
      startTime,
      endTime,
    );

    if (conflict) {
      // 🟢 Updated Error Message to join the conflict's day array nicely
      return res.status(400).json({
        message: `Scheduling Conflict: ${teacher} is already taking "${conflict.name}" on ${conflict.day.join(" and ")} between ${conflict.startTime} and ${conflict.endTime}.`,
      });
    }

    const newSubject = new Subject({
      name,
      teacher,
      teacherId,
      day,
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
  const { teacher, teacherId, day, startTime, endTime } = req.body;

  // 🟢 Validation for PUT as well
  if (!day || !Array.isArray(day) || day.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one Day must be selected." });
  }

  try {
    const conflict = await checkTeacherConflict(
      teacherId,
      day,
      startTime,
      endTime,
      req.params.id,
    );

    if (conflict) {
      return res.status(400).json({
        message: `Conflict Detected: ${teacher} is already assigned to "${conflict.name}" on ${conflict.day.join(" and ")} during this time slot.`,
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
