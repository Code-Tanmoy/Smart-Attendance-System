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

// Custom Hook to cleanly handle clicks outside dropdowns
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
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

  // FORM STATE
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

  // DROPDOWN REFS & STATE (Form)
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const formDropdownRef = useRef();

  useOnClickOutside(formDropdownRef, () => setShowDropdown(false));

  const [editingId, setEditingId] = useState(null);

  // FILTER STATE
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterDay, setFilterDay] = useState("All");

  // DROPDOWN REFS & STATE (Filter)
  const [filterTeacherId, setFilterTeacherId] = useState("All");
  const [filterTeacherSearch, setFilterTeacherSearch] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef();

  useOnClickOutside(filterDropdownRef, () => setShowFilterDropdown(false));

  // PAGINATION STATE
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
    if (name === "name") value = value.toUpperCase();

    setNewSubject((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "year") updated.semester = "";
      return updated;
    });

    if (name === "startTime" && value) {
      if (endTimeRef.current) endTimeRef.current.focus();
    }
  };

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
    if (!newSubject.teacherId)
      return toast.error("Please select a teacher from the list.", {
        icon: "🧑‍🏫",
      });
    if (!newSubject.day || newSubject.day.length === 0)
      return toast.error("Please select at least one day.", { icon: "📅" });

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

  const filteredSubjects = subjects
    .filter((sub) => {
      const matchDept = filterDept === "All" || sub.department === filterDept;
      const matchYear = filterYear === "All" || sub.year === filterYear;
      const matchSem =
        filterSemester === "All" || sub.semester === filterSemester;
      const matchTeacher =
        filterTeacherId === "All" || sub.teacherId === filterTeacherId;
      const normalizedDays = Array.isArray(sub.day) ? sub.day : [sub.day];
      const matchDay =
        filterDay === "All" || normalizedDays.includes(filterDay);
      return matchDept && matchYear && matchSem && matchDay && matchTeacher;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // PAGINATION LOGIC
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableData = filteredSubjects.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Common styles
  const inputClassesWithIcon =
    "w-full pl-10 pr-4 py-3 rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm appearance-none";
  const selectClasses =
    "w-full mt-1.5 px-4 py-3 rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-800 appearance-none disabled:opacity-50 disabled:bg-slate-100/50 shadow-sm cursor-pointer";
  const labelClasses =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1";
  const iconClasses =
    "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm z-10 pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300";

  return (
    <div className="max-w-7xl mx-auto pb-10 relative z-10 space-y-8">
      {/* 📄 HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 rounded-[10px] text-indigo-500">
            <FaCalendarAlt size={16} />
          </div>
          Class Schedule Manager
        </h1>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">
          Organize timetables and assign faculty to active classes.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
        {/* 📝 LEFT PANEL: ADD/EDIT CLASS FORM */}
        <div className="w-full xl:w-[35%]">
          <div
            className={`p-6 sm:p-8 rounded-[24px] shadow-sm border transition-colors duration-300 ${editingId ? "bg-amber-50/40 border-amber-200/60 backdrop-blur-sm" : "bg-white/80 border-slate-200/60 backdrop-blur-sm"}`}
          >
            <div className="mb-6 flex justify-between items-start border-b border-slate-100/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5 tracking-tight">
                  <div
                    className={`p-1.5 rounded-[8px] ${editingId ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}
                  >
                    {editingId ? <FaEdit size={14} /> : <FaPlus size={14} />}
                  </div>
                  {editingId ? "Edit Class" : "Schedule Class"}
                </h2>
                <p className="text-[11px] font-medium text-slate-500 mt-1.5 uppercase tracking-widest">
                  {editingId
                    ? "Update session details"
                    : "Add new timetable session"}
                </p>
              </div>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-slate-400 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 p-2 rounded-full border border-slate-200/80 shadow-sm"
                  title="Cancel Edit"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4.5">
              <div>
                <label className={labelClasses}>Subject Name</label>
                <div className="relative group">
                  <FaBook className={iconClasses} />
                  <input
                    required
                    type="text"
                    name="name"
                    value={newSubject.name}
                    onChange={handleChange}
                    placeholder="EX: ADVANCED JAVA"
                    className={inputClassesWithIcon}
                  />
                </div>
              </div>

              {/* CUSTOM SEARCHABLE TEACHER DROPDOWN */}
              <div className="relative z-30" ref={formDropdownRef}>
                <label className={labelClasses}>Assigned Teacher</label>
                <div className="relative mt-1 group">
                  <FaSearch className={iconClasses} />
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
                    className={inputClassesWithIcon}
                  />
                  {showDropdown && (
                    <div className="absolute w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[16px] shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in duration-200">
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
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100/60 last:border-0 transition-colors flex flex-col gap-0.5"
                          >
                            <div className="font-bold text-slate-800 text-sm tracking-tight">
                              {t.name.toUpperCase()}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                              <span className="font-mono font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-[6px] text-indigo-600">
                                {t.teacherId}
                              </span>
                              <span>• {t.department} Dept</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-center text-sm font-medium text-slate-500 italic">
                          No teachers found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClasses}>Department</label>
                <select
                  required
                  name="department"
                  value={newSubject.department}
                  onChange={handleChange}
                  className={selectClasses}
                >
                  <option value="">-- Select Dept --</option>
                  {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Year</label>
                  <select
                    required
                    name="year"
                    value={newSubject.year}
                    onChange={handleChange}
                    className={selectClasses}
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
                  <label className={labelClasses}>Semester</label>
                  <select
                    required
                    name="semester"
                    value={newSubject.semester}
                    onChange={handleChange}
                    disabled={!newSubject.year}
                    className={selectClasses}
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

              {/* 🟢 Day Select Multi-Pills */}
              <div className="pt-1">
                <label className={`${labelClasses} flex items-center gap-1.5`}>
                  <FaCalendarAlt className="text-indigo-400" /> Active Days
                </label>
                <div className="flex gap-2.5 flex-wrap mt-2.5">
                  {daysOfWeek.map((d) => {
                    const isActive = newSubject.day.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`px-3.5 py-2 rounded-[10px] text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${
                          isActive
                            ? "bg-indigo-50/80 text-indigo-700 border-indigo-200/80 shadow-sm shadow-indigo-100 -translate-y-0.5"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className={labelClasses}>Start Time</label>
                  <div className="relative group">
                    <FaClock className={iconClasses} />
                    <input
                      required
                      type="time"
                      name="startTime"
                      value={newSubject.startTime}
                      onChange={handleChange}
                      className={`${inputClassesWithIcon} !pr-3 cursor-text`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>End Time</label>
                  <div className="relative group">
                    <FaClock className={iconClasses} />
                    <input
                      required
                      type="time"
                      name="endTime"
                      ref={endTimeRef}
                      value={newSubject.endTime}
                      onChange={handleChange}
                      className={`${inputClassesWithIcon} !pr-3 cursor-text`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100/80">
                <button
                  type="submit"
                  className={`flex-1 font-bold py-3.5 rounded-[12px] shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white flex items-center justify-center gap-2 ${
                    editingId
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-200/50 hover:shadow-amber-300/50"
                      : "bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-indigo-200/50 hover:shadow-indigo-300/50"
                  }`}
                >
                  {editingId ? (
                    <>
                      <FaEdit /> Update Schedule
                    </>
                  ) : (
                    <>
                      <FaPlus /> Confirm Schedule
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 font-bold rounded-[12px] transition-all duration-300 shadow-sm hover:shadow active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* 🗓️ RIGHT PANEL: SCHEDULE LIST & FILTERS */}
        <div className="w-full xl:w-[65%]">
          <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-[24px] shadow-sm border border-slate-200/60 min-h-[500px] flex flex-col">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-5 border-b border-slate-100/80 pb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  Master Timetable
                </h2>
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500 mt-1">
                  Manage all active classes
                </p>
              </div>

              <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto bg-white/60 backdrop-blur-md p-2 rounded-[20px] shadow-sm border border-slate-200/60">
                  {/* Filter Searchable Dropdown */}
                  <div
                    className="relative z-20 flex-grow sm:flex-grow-0"
                    ref={filterDropdownRef}
                  >
                    <div className="relative group">
                      <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        value={filterTeacherSearch}
                        onFocus={() => setShowFilterDropdown(true)}
                        onChange={(e) => {
                          setFilterTeacherSearch(e.target.value);
                          setShowFilterDropdown(true);
                          setFilterTeacherId(
                            e.target.value === "" ? "All" : "",
                          );
                        }}
                        placeholder="Search Teacher..."
                        className="w-full sm:w-48 pl-10 pr-8 py-2.5 rounded-[12px] bg-white/50 border border-slate-200/80 text-sm text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white hover:border-slate-300 transition-all shadow-sm"
                      />
                      {filterTeacherId !== "All" && filterTeacherId !== "" && (
                        <button
                          onClick={() => {
                            setFilterTeacherId("All");
                            setFilterTeacherSearch("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-full p-0.5"
                          title="Clear Filter"
                        >
                          <FaTimes size={12} />
                        </button>
                      )}
                    </div>
                    {showFilterDropdown && (
                      <div className="absolute w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[16px] shadow-xl max-h-48 overflow-y-auto animate-in fade-in duration-200">
                        <div
                          onClick={() => {
                            setFilterTeacherId("All");
                            setFilterTeacherSearch("");
                            setShowFilterDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100/60 transition-colors text-[13px] font-bold text-slate-700"
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
                              className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100/60 last:border-0 transition-colors"
                            >
                              <div className="font-bold text-slate-800 text-xs tracking-tight">
                                {t.name.toUpperCase()}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono font-medium mt-0.5">
                                {t.teacherId}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-xs font-medium text-slate-500 italic">
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
                    className="flex-grow sm:flex-grow-0 px-4 py-2.5 rounded-[12px] bg-white/50 border border-slate-200/80 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white hover:border-slate-300 transition-all appearance-none cursor-pointer shadow-sm"
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
                    className="flex-grow sm:flex-grow-0 px-4 py-2.5 rounded-[12px] bg-white/50 border border-slate-200/80 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white hover:border-slate-300 transition-all appearance-none cursor-pointer shadow-sm hidden md:block"
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
                    className="flex-grow sm:flex-grow-0 px-4 py-2.5 rounded-[12px] bg-white/50 border border-slate-200/80 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white hover:border-slate-300 transition-all appearance-none cursor-pointer shadow-sm hidden sm:block"
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
                    className="flex-grow sm:flex-grow-0 px-4 py-2.5 rounded-[12px] bg-white/50 border border-slate-200/80 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white hover:border-slate-300 transition-all appearance-none disabled:opacity-50 disabled:bg-slate-50 cursor-pointer shadow-sm hidden sm:block"
                  >
                    <option value="All">All Sems</option>
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
              <div className="bg-indigo-50/80 backdrop-blur-sm border border-indigo-100 text-indigo-800 px-5 py-3.5 rounded-[16px] text-sm font-bold flex items-center justify-between mb-6 shadow-sm">
                <span className="flex items-center gap-2.5">
                  <FaChalkboardTeacher className="text-indigo-500" size={16} />{" "}
                  {filterTeacherSearch}'s Workload
                </span>
                <span className="bg-white text-indigo-600 px-3 py-1.5 rounded-[8px] shadow-sm text-[11px] uppercase tracking-widest border border-indigo-100/60 font-bold">
                  {filteredSubjects.length} Classes
                </span>
              </div>
            )}

            {/* TABLE */}
            <div className="flex-grow flex flex-col">
              {loading ? (
                <div className="text-center py-20 flex flex-col items-center gap-4 text-slate-400 m-auto">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span className="font-medium text-sm">
                    Loading schedule...
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto min-h-[350px]">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/80 backdrop-blur-md text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200/60">
                      <tr>
                        <th className="px-6 py-4.5 rounded-tl-[16px]">
                          Subject & Teacher
                        </th>
                        <th className="px-6 py-4.5">Target Group</th>
                        <th className="px-6 py-4.5">Time Slot & Days</th>
                        <th className="px-6 py-4.5 rounded-tr-[16px] text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {currentTableData.length > 0 ? (
                        currentTableData.map((sub) => {
                          const normalizedDays = Array.isArray(sub.day)
                            ? sub.day
                            : [sub.day].filter(Boolean);
                          return (
                            <tr
                              key={sub._id}
                              className={`transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] ${editingId === sub._id ? "bg-amber-50/40 relative z-10" : "hover:bg-slate-50/80"}`}
                            >
                              <td className="px-6 py-4.5">
                                <div className="font-bold text-slate-800 tracking-tight">
                                  {sub.name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-1.5 bg-slate-50 border border-slate-100/80 w-fit px-2 py-0.5 rounded-[6px]">
                                  <FaChalkboardTeacher className="text-slate-400" />{" "}
                                  {sub.teacher}
                                </div>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className="bg-slate-100/80 text-slate-600 border border-slate-200/60 px-3 py-1.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest mr-2 shadow-sm">
                                  {sub.department}
                                </span>
                                <div className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest pl-0.5">
                                  {sub.year} • {sub.semester} Sem
                                </div>
                              </td>
                              <td className="px-6 py-4.5">
                                <div className="flex flex-col gap-2 items-start">
                                  <div className="font-bold text-slate-700 bg-white inline-block px-3 py-1.5 rounded-[8px] border border-slate-200/80 shadow-sm text-xs flex items-center gap-1.5">
                                    <FaClock
                                      className="text-indigo-400"
                                      size={10}
                                    />{" "}
                                    {sub.startTime} - {sub.endTime}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                                    {normalizedDays.map((d) => (
                                      <span
                                        key={d}
                                        className="bg-indigo-50/80 text-indigo-600 border border-indigo-100/60 px-2 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-widest shadow-sm"
                                      >
                                        {d.slice(0, 3)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4.5 text-center">
                                <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    onClick={() => handleEditClick(sub)}
                                    className="text-slate-400 hover:text-amber-500 border border-transparent hover:border-amber-200 bg-white hover:bg-amber-50 hover:shadow-sm p-2 rounded-[10px] transition-all hover:-translate-y-0.5"
                                    title="Edit Class"
                                  >
                                    <FaEdit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(sub._id)}
                                    className="text-slate-400 hover:text-rose-500 border border-transparent hover:border-rose-200 bg-white hover:bg-rose-50 hover:shadow-sm p-2 rounded-[10px] transition-all hover:-translate-y-0.5"
                                    title="Delete Class"
                                  >
                                    <FaTrash size={14} />
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
                            className="text-center py-20 text-slate-400 text-sm font-medium bg-slate-50/30"
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

            {/* 🟢 Pagination Controls */}
            {!loading && filteredSubjects.length > itemsPerPage && (
              <div className="flex justify-between items-center mt-auto border-t border-slate-100/80 pt-6">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                  Page {currentPage} of{" "}
                  {Math.ceil(filteredSubjects.length / itemsPerPage)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2.5 text-xs font-bold rounded-[10px] bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:text-slate-600 shadow-sm transition-all active:scale-95 disabled:active:scale-100"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      indexOfLastItem < filteredSubjects.length &&
                      paginate(currentPage + 1)
                    }
                    disabled={indexOfLastItem >= filteredSubjects.length}
                    className="px-4 py-2.5 text-xs font-bold rounded-[10px] bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:text-slate-600 shadow-sm transition-all active:scale-95 disabled:active:scale-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
