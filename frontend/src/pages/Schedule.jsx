import React, { useState, useEffect, useRef } from "react";
import {
  FaTrash,
  FaPlus,
  FaFilter,
  FaClock,
  FaBook,
  FaChalkboardTeacher,
  FaUniversity,
  FaCalendarAlt,
  FaEdit,
  FaTimes,
} from "react-icons/fa";
import { backend } from "../services/api";

// 🟢 MAP YEARS TO VALID SEMESTERS
const semesterMap = {
  "1st Year": ["1st", "2nd"],
  "2nd Year": ["3rd", "4th"],
  "3rd Year": ["5th", "6th"],
  "4th Year": ["7th", "8th"],
};

const Schedule = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 FORM STATE
  const [newSubject, setNewSubject] = useState({
    name: "",
    teacher: "",
    department: "",
    year: "",
    semester: "",
    startTime: "",
    endTime: "",
  });

  // 🟢 EDIT MODE STATE
  const [editingId, setEditingId] = useState(null);

  // 🟢 FILTER STATE
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");

  // Reference for Auto-Focus
  const endTimeRef = useRef(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await backend.get("/api/subjects");
      setSubjects(res.data);
    } catch (err) {
      console.error("Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 SMART CHANGE HANDLER
  const handleChange = (e) => {
    let { name, value } = e.target;

    // 1. Force Uppercase for Name and Teacher
    if (name === "name" || name === "teacher") {
      value = value.toUpperCase();
    }

    setNewSubject((prev) => {
      const updated = { ...prev, [name]: value };

      // 2. Dynamic Semester Reset
      if (name === "year") {
        updated.semester = "";
      }
      return updated;
    });

    // 3. Auto-Focus Logic: Jump to End Time when Start Time is filled
    if (name === "startTime" && value) {
      if (endTimeRef.current) {
        endTimeRef.current.focus();
      }
    }
  };

  // 🟢 SUBMIT HANDLER (Handles both Add and Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // UPDATE Existing Class
        await backend.put(`/api/subjects/${editingId}`, newSubject);
        alert("Class Updated Successfully!");
      } else {
        // ADD New Class
        await backend.post("/api/subjects", newSubject);
        alert("Class Scheduled Successfully!");
      }
      resetForm();
      fetchSubjects();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to save class. Check for conflicts.",
      );
    }
  };

  // 🟢 EDIT BUTTON CLICK HANDLER
  const handleEditClick = (sub) => {
    setEditingId(sub._id);
    setNewSubject({
      name: sub.name,
      teacher: sub.teacher,
      department: sub.department,
      year: sub.year,
      semester: sub.semester,
      startTime: sub.startTime,
      endTime: sub.endTime,
    });
    // Scroll to top so user sees the form immediately (helpful on mobile)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🟢 RESET FORM HANDLER
  const resetForm = () => {
    setEditingId(null);
    setNewSubject({
      name: "",
      teacher: "",
      department: "",
      year: "",
      semester: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scheduled class?")) return;
    try {
      await backend.delete(`/api/subjects/${id}`);
      fetchSubjects();
    } catch (err) {
      alert("Failed to delete class");
    }
  };

  // 🟢 FILTER & SORT LOGIC
  const filteredSubjects = subjects
    .filter((sub) => {
      const matchDept = filterDept === "All" || sub.department === filterDept;
      const matchYear = filterYear === "All" || sub.year === filterYear;
      const matchSem =
        filterSemester === "All" || sub.semester === filterSemester;
      return matchDept && matchYear && matchSem;
    })
    .sort((a, b) => {
      // 1st Priority: Sort by Year
      if (a.year !== b.year) return a.year.localeCompare(b.year);

      // 2nd Priority: Sort by Semester
      if (a.semester !== b.semester)
        return a.semester.localeCompare(b.semester);

      // 3rd Priority: Sort by Start Time
      return a.startTime.localeCompare(b.startTime);
    });

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* 📝 LEFT PANEL: ADD/EDIT CLASS FORM */}
      <div className="w-full xl:w-1/3">
        <div
          className={`p-6 rounded-2xl shadow-sm border transition-colors duration-300 ${editingId ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {editingId ? (
                  <FaEdit className="text-amber-500" />
                ) : (
                  <FaPlus className="text-blue-500" />
                )}
                {editingId ? "Edit Class" : "Schedule Class"}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {editingId
                  ? "Update the details for this session"
                  : "Add a new session to the timetable"}
              </p>
            </div>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-red-500 transition"
                title="Cancel Edit"
              >
                <FaTimes size={20} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject Name */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Subject Name
              </label>
              <div className="relative mt-1">
                <FaBook className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input
                  required
                  type="text"
                  name="name"
                  value={newSubject.name}
                  onChange={handleChange}
                  placeholder="EX: JAVA "
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                />
              </div>
            </div>

            {/* Teacher Name */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Teacher Name
              </label>
              <div className="relative mt-1">
                <FaChalkboardTeacher className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input
                  required
                  type="text"
                  name="teacher"
                  value={newSubject.teacher}
                  onChange={handleChange}
                  placeholder="EX: PROF. ....."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Department
              </label>
              <select
                required
                name="department"
                value={newSubject.department}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
              >
                <option value="">-- Select Dept --</option>
                <option value="CSE">Computer Science Eng (CSE)</option>
                <option value="CS">Cyber Security (CS)</option>
                <option value="IT">Information Tech (IT)</option>
                <option value="AI">Artificial Intelligence (AI)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="ME">Mechanical (ME)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Year Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Year
                </label>
                <select
                  required
                  name="year"
                  value={newSubject.year}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                >
                  <option value="">-- Year --</option>
                  {Object.keys(semesterMap).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Semester Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Semester
                </label>
                <select
                  required
                  name="semester"
                  value={newSubject.semester}
                  onChange={handleChange}
                  disabled={!newSubject.year}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 disabled:opacity-50"
                >
                  <option value="">-- Sem --</option>
                  {newSubject.year &&
                    semesterMap[newSubject.year].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem} Sem
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Start Time
                </label>
                <div className="relative mt-1">
                  <FaClock className="absolute left-3 top-3 text-gray-400 text-sm" />
                  <input
                    required
                    type="time"
                    name="startTime"
                    value={newSubject.startTime}
                    onChange={handleChange}
                    className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                  />
                </div>
              </div>

              {/* End Time (Auto-Focused) */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  End Time
                </label>
                <div className="relative mt-1">
                  <FaClock className="absolute left-3 top-3 text-gray-400 text-sm" />
                  <input
                    required
                    type="time"
                    name="endTime"
                    ref={endTimeRef}
                    value={newSubject.endTime}
                    onChange={handleChange}
                    className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className={`flex-1 font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.98] text-white ${
                  editingId
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {editingId ? "Update Schedule" : "Confirm Schedule"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 🗓️ RIGHT PANEL: SCHEDULE LIST & FILTERS */}
      <div className="w-full xl:w-2/3">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Master Timetable
              </h2>
              <p className="text-xs text-gray-500">Manage all active classes</p>
            </div>

            {/* 🔍 FILTERS */}
            {/* 🔍 FILTERS */}
            <div className="flex flex-wrap items-center gap-3">
              <FaFilter className="text-gray-400 text-sm" />

              {/* 🟢 NEW: Department Filter */}
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Depts</option>
                {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setFilterSemester("All");
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Years</option>
                {Object.keys(semesterMap).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                disabled={filterYear === "All"}
                className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="All">All Semesters</option>
                {filterYear !== "All" &&
                  semesterMap[filterYear].map((sem) => (
                    <option key={sem} value={sem}>
                      {sem} Sem
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="text-center py-10 text-gray-400">
              Loading schedule...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Subject & Teacher</th>
                    <th className="px-4 py-3">Target Group</th>
                    <th className="px-4 py-3">Time Slot</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((sub) => (
                      <tr
                        key={sub._id}
                        className={`transition-colors ${editingId === sub._id ? "bg-amber-50/50" : "hover:bg-blue-50/50"}`}
                      >
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-800">
                            {sub.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <FaChalkboardTeacher /> {sub.teacher}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-xs font-bold mr-2">
                            {sub.department}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {sub.year} • {sub.semester} Sem
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-700 bg-gray-50 inline-block px-2 py-1 rounded-md border border-gray-200">
                            {sub.startTime} - {sub.endTime}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(sub)}
                              className="text-gray-400 hover:text-amber-500 bg-gray-50 hover:bg-amber-50 p-2 rounded-lg transition-colors"
                              title="Edit Class"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(sub._id)}
                              className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Delete Class"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-10 text-gray-400 italic"
                      >
                        No classes found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
