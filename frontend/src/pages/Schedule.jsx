import React, { useState, useEffect, useRef } from "react";
import {
  FaTrash,
  FaPlus,
  FaFilter,
  FaClock,
  FaBook,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaEdit,
  FaTimes,
  FaSearch,
} from "react-icons/fa";
import { backend } from "../services/api";
import toast from "react-hot-toast";

const semesterMap = {
  "1st Year": ["1st", "2nd"],
  "2nd Year": ["3rd", "4th"],
  "3rd Year": ["5th", "6th"],
  "4th Year": ["7th", "8th"],
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// 🟢 NEW: Custom Hook to cleanly handle clicks outside dropdowns
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

const Schedule = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 FORM STATE (day is now initialized as an empty array)
  const [newSubject, setNewSubject] = useState({
    name: "",
    teacher: "",
    teacherId: "",
    day: [],
    department: "",
    year: "",
    semester: "",
    startTime: "",
    endTime: "",
  });

  // 🟢 DROPDOWN REFS & STATE (Form)
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const formDropdownRef = useRef();

  useOnClickOutside(formDropdownRef, () => setShowDropdown(false));

  const [editingId, setEditingId] = useState(null);

  // 🟢 FILTER STATE
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterDay, setFilterDay] = useState("All");

  // 🟢 DROPDOWN REFS & STATE (Filter)
  const [filterTeacherId, setFilterTeacherId] = useState("All");
  const [filterTeacherSearch, setFilterTeacherSearch] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef();

  useOnClickOutside(filterDropdownRef, () => setShowFilterDropdown(false));

  // 🟢 PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // 🟢 NEW: Day Pill Toggle Logic
  const toggleDay = (dayStr) => {
    setNewSubject((prev) => {
      const currentDays = prev.day || [];
      if (currentDays.includes(dayStr)) {
        return { ...prev, day: currentDays.filter((d) => d !== dayStr) };
      } else {
        return { ...prev, day: [...currentDays, dayStr] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newSubject.teacherId) {
      return toast.error("Please select a teacher from the list.", {
        icon: "🧑‍🏫",
      });
    }
    if (!newSubject.day || newSubject.day.length === 0) {
      return toast.error("Please select at least one day.", { icon: "📅" });
    }

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

    // Safely handle old records that might still have string days
    const normalizedDays = Array.isArray(sub.day)
      ? sub.day
      : [sub.day].filter(Boolean);

    setNewSubject({
      name: sub.name,
      teacher: sub.teacher,
      teacherId: sub.teacherId || "",
      day: normalizedDays,
      department: sub.department,
      year: sub.year,
      semester: sub.semester,
      startTime: sub.startTime,
      endTime: sub.endTime,
    });
    setTeacherSearch(`${sub.teacher} (${sub.teacherId})`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTeacherSearch("");
    setNewSubject({
      name: "",
      teacher: "",
      teacherId: "",
      day: [],
      department: "",
      year: "",
      semester: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scheduled class?")) return;

    const deleteToast = toast.loading("Deleting scheduled class...");

    try {
      await backend.delete(`/api/subjects/${id}`);
      fetchSubjects();
      toast.success("Class deleted successfully.", { id: deleteToast });
    } catch (err) {
      toast.error("Failed to delete class.", { id: deleteToast });
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.department.toLowerCase().includes(teacherSearch.toLowerCase()),
  );

  const filteredTimetableTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(filterTeacherSearch.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(filterTeacherSearch.toLowerCase()) ||
      t.department.toLowerCase().includes(filterTeacherSearch.toLowerCase()),
  );

  // 🟢 SMART FILTER & SORT FOR TIMETABLE (Updated for Array)
  const filteredSubjects = subjects
    .filter((sub) => {
      const matchDept = filterDept === "All" || sub.department === filterDept;
      const matchYear = filterYear === "All" || sub.year === filterYear;
      const matchSem =
        filterSemester === "All" || sub.semester === filterSemester;
      const matchTeacher =
        filterTeacherId === "All" || sub.teacherId === filterTeacherId;

      // Updated day matching logic for array
      const normalizedDays = Array.isArray(sub.day) ? sub.day : [sub.day];
      const matchDay =
        filterDay === "All" || normalizedDays.includes(filterDay);

      return matchDept && matchYear && matchSem && matchDay && matchTeacher;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // 🟢 PAGINATION LOGIC
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableData = filteredSubjects.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* 📝 LEFT PANEL: ADD/EDIT CLASS FORM */}
      <div className="w-full xl:w-1/3">
        <div
          className={`p-6 rounded-2xl shadow-sm border transition-colors duration-300 ${
            editingId
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-gray-100"
          }`}
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

            {/* CUSTOM SEARCHABLE TEACHER DROPDOWN */}
            <div className="relative z-30" ref={formDropdownRef}>
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
                  onChange={(e) => {
                    setTeacherSearch(e.target.value);
                    setShowDropdown(true);
                    setNewSubject((prev) => ({
                      ...prev,
                      teacherId: "",
                      teacher: "",
                    }));
                  }}
                  placeholder="Search by name, ID, or Dept..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                />
                {showDropdown && (
                  <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map((t) => (
                        <div
                          key={t._id}
                          onClick={() => {
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

            {/* 🟢 NEW: Day Select Multi-Pills */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                <FaCalendarAlt className="text-gray-300" /> Active Days
              </label>
              <div className="flex gap-2 flex-wrap mt-2">
                {daysOfWeek.map((d) => {
                  const isActive = newSubject.day.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        isActive
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {d.slice(0, 3).toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <FaFilter className="text-gray-400 text-sm mr-1" />

                {/* Filter Searchable Dropdown */}
                <div
                  className="relative z-20 w-48 sm:w-56"
                  ref={filterDropdownRef}
                >
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-xs" />
                    <input
                      type="text"
                      value={filterTeacherSearch}
                      onFocus={() => setShowFilterDropdown(true)}
                      onChange={(e) => {
                        setFilterTeacherSearch(e.target.value);
                        setShowFilterDropdown(true);
                        if (e.target.value === "") {
                          setFilterTeacherId("All");
                        } else {
                          setFilterTeacherId("");
                        }
                      }}
                      placeholder="Search Teacher..."
                      className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {filterTeacherId !== "All" && filterTeacherId !== "" && (
                      <button
                        onClick={() => {
                          setFilterTeacherId("All");
                          setFilterTeacherSearch("");
                        }}
                        className="absolute right-2 top-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear Filter"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    )}
                  </div>

                  {showFilterDropdown && (
                    <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      <div
                        onClick={() => {
                          setFilterTeacherId("All");
                          setFilterTeacherSearch("");
                          setShowFilterDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors text-sm font-bold text-gray-700"
                      >
                        All Teachers
                      </div>
                      {filteredTimetableTeachers.length > 0 ? (
                        filteredTimetableTeachers.map((t) => (
                          <div
                            key={t.teacherId}
                            onClick={() => {
                              setFilterTeacherId(t.teacherId);
                              setFilterTeacherSearch(t.name.toUpperCase());
                              setShowFilterDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                          >
                            <div className="font-bold text-gray-800 text-sm">
                              {t.name.toUpperCase()}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                              {t.teacherId}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-center text-xs text-gray-500 italic">
                          No matches
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <select
                  value={filterDay}
                  onChange={(e) => {
                    setFilterDay(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Days</option>
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={filterDept}
                  onChange={(e) => {
                    setFilterDept(e.target.value);
                    setCurrentPage(1);
                  }}
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
                    setCurrentPage(1);
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
                  onChange={(e) => {
                    setFilterSemester(e.target.value);
                    setCurrentPage(1);
                  }}
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
          </div>

          {filterTeacherId !== "All" && filterTeacherId !== "" && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 mb-4 w-full justify-between shadow-sm">
              <span className="flex items-center gap-2">
                <FaChalkboardTeacher /> {filterTeacherSearch}'s Workload
              </span>
              <span className="bg-white text-blue-800 px-2 py-0.5 rounded shadow-sm text-xs border border-blue-200">
                {filteredSubjects.length} Classes
              </span>
            </div>
          )}

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
                    <th className="px-4 py-3">Time Slot & Days</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((sub) => {
                      const normalizedDays = Array.isArray(sub.day)
                        ? sub.day
                        : [sub.day].filter(Boolean);
                      return (
                        <tr
                          key={sub._id}
                          className={`transition-colors ${
                            editingId === sub._id
                              ? "bg-amber-50/50"
                              : "hover:bg-blue-50/50"
                          }`}
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
                            <div className="flex flex-col gap-1.5 items-start">
                              <div className="font-bold text-gray-700 bg-gray-50 inline-block px-2 py-1 rounded-md border border-gray-200">
                                {sub.startTime} - {sub.endTime}
                              </div>
                              {/* 🟢 NEW: Renders array of days nicely */}
                              <div className="flex flex-wrap gap-1">
                                {normalizedDays.map((d) => (
                                  <span
                                    key={d}
                                    className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    {d.slice(0, 3)}
                                  </span>
                                ))}
                              </div>
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
                      );
                    })
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

              {/* 🟢 NEW: Pagination Controls for Table */}
              <div className="flex justify-between items-center mt-6 border-t border-gray-100 pt-4">
                <span className="text-xs text-gray-400">
                  Page {currentPage}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      indexOfLastItem < filteredSubjects.length &&
                      paginate(currentPage + 1)
                    }
                    disabled={indexOfLastItem >= filteredSubjects.length}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
