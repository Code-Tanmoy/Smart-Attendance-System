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
  FaSearch,
} from "react-icons/fa";
import { backend } from "../services/api";
import toast from "react-hot-toast"; // 🟢 NEW: Imported React Hot Toast

// 🟢 MAP YEARS TO VALID SEMESTERS
const semesterMap = {
  "1st Year": ["1st", "2nd"],
  "2nd Year": ["3rd", "4th"],
  "3rd Year": ["5th", "6th"],
  "4th Year": ["7th", "8th"],
};

const Schedule = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 FORM STATE
  const [newSubject, setNewSubject] = useState({
    name: "",
    teacher: "",
    teacherId: "",
    department: "",
    year: "",
    semester: "",
    startTime: "",
    endTime: "",
  });

  // 🟢 SEARCHABLE DROPDOWN STATE
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // 🟢 EDIT MODE STATE
  const [editingId, setEditingId] = useState(null);

  // 🟢 FILTER STATE
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");

  const endTimeRef = useRef(null);

  useEffect(() => {
    fetchSubjects();
    fetchTeachers();
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

  const fetchTeachers = async () => {
    try {
      const res = await backend.get("/api/teachers");
      setTeachers(res.data);
    } catch (err) {
      console.error("Failed to fetch teachers");
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "name") {
      value = value.toUpperCase();
    }

    setNewSubject((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "year") {
        updated.semester = "";
      }
      return updated;
    });

    if (name === "startTime" && value) {
      if (endTimeRef.current) {
        endTimeRef.current.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newSubject.teacherId) {
      // 🟢 NEW: Replaced alert with custom icon toast
      return toast.error("Please select a teacher from the dropdown list.", {
        icon: "🧑‍🏫",
      });
    }

    // 🟢 NEW: Fire a loading toast based on the mode (edit or create)
    const saveToast = toast.loading(
      editingId ? "Updating class schedule..." : "Scheduling new class...",
    );

    try {
      if (editingId) {
        await backend.put(`/api/subjects/${editingId}`, newSubject);
        toast.success("Class Updated Successfully!", { id: saveToast });
      } else {
        await backend.post("/api/subjects", newSubject);
        toast.success("Class Scheduled Successfully!", { id: saveToast });
      }
      resetForm();
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save class.", {
        id: saveToast,
      });
    }
  };

  const handleEditClick = (sub) => {
    setEditingId(sub._id);
    setNewSubject({
      name: sub.name,
      teacher: sub.teacher,
      teacherId: sub.teacherId || "",
      department: sub.department,
      year: sub.year,
      semester: sub.semester,
      startTime: sub.startTime,
      endTime: sub.endTime,
    });
    // Pre-fill the search box so it looks correct when editing
    setTeacherSearch(`${sub.teacher} (${sub.teacherId})`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTeacherSearch(""); // Reset search box
    setNewSubject({
      name: "",
      teacher: "",
      teacherId: "",
      department: "",
      year: "",
      semester: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scheduled class?")) return;

    // 🟢 NEW: Loading toast for deletion
    const deleteToast = toast.loading("Deleting scheduled class...");

    try {
      await backend.delete(`/api/subjects/${id}`);
      fetchSubjects();
      toast.success("Class deleted successfully.", { id: deleteToast });
    } catch (err) {
      toast.error("Failed to delete class.", { id: deleteToast });
    }
  };

  // 🟢 SMART FILTER FOR TEACHER SEARCH
  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.department.toLowerCase().includes(teacherSearch.toLowerCase()),
  );

  const filteredSubjects = subjects
    .filter((sub) => {
      const matchDept = filterDept === "All" || sub.department === filterDept;
      const matchYear = filterYear === "All" || sub.year === filterYear;
      const matchSem =
        filterSemester === "All" || sub.semester === filterSemester;
      return matchDept && matchYear && matchSem;
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      if (a.semester !== b.semester)
        return a.semester.localeCompare(b.semester);
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

            {/* 🟢 CUSTOM SEARCHABLE TEACHER DROPDOWN */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Assigned Teacher
              </label>
              <div className="relative mt-1">
                <FaSearch className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                <input
                  required
                  type="text"
                  value={teacherSearch}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay so click registers
                  onChange={(e) => {
                    setTeacherSearch(e.target.value);
                    setShowDropdown(true);
                    // Clear backend state if they start typing again
                    setNewSubject((prev) => ({
                      ...prev,
                      teacherId: "",
                      teacher: "",
                    }));
                  }}
                  placeholder="Search by name, ID, or Dept..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                />

                {/* 🟢 The Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map((t) => (
                        <div
                          key={t._id}
                          // onMouseDown fires before onBlur, ensuring the click registers
                          onMouseDown={() => {
                            setNewSubject((prev) => ({
                              ...prev,
                              teacherId: t.teacherId,
                              teacher: t.name.toUpperCase(),
                            }));
                            setTeacherSearch(
                              `${t.name.toUpperCase()} (${t.teacherId})`,
                            );
                            setShowDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <div className="font-bold text-gray-800">
                            {t.name.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-blue-600">
                              {t.teacherId}
                            </span>
                            <span>• {t.department}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-center text-sm text-gray-500 italic">
                        No teachers found.
                      </div>
                    )}
                  </div>
                )}
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
            <div className="flex flex-wrap items-center gap-3">
              <FaFilter className="text-gray-400 text-sm" />

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
