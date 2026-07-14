import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaTrash,
  FaSearch,
  FaUniversity,
  FaLayerGroup,
  FaSyncAlt,
  FaUserGraduate,
  FaEdit,
  FaTimes,
  FaArrowLeft,
  FaPhone,
  FaBookOpen,
  FaExclamationTriangle,
} from "react-icons/fa";
import { backend, faceApi } from "../services/api";
import toast from "react-hot-toast";

const Enrolled = () => {
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [periodLogs, setPeriodLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // HIERARCHY FILTERS
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Active");

  // TEACHER-SPECIFIC SUBJECT FILTER
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState("All");

  // MODAL STATES
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});

  // ROLE CONTEXT
  const userRole = localStorage.getItem("userRole");
  const teacherId = localStorage.getItem("teacherId");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, campusAttRes, periodAttRes, subjectsRes] =
        await Promise.all([
          backend.get(`/api/students?_t=${Date.now()}`),
          backend.get(`/api/attendance?_t=${Date.now()}`),
          backend
            .get(`/api/periodwise-attendance?_t=${Date.now()}`)
            .catch(() => ({ data: [] })),
          backend.get(`/api/subjects?_t=${Date.now()}`),
        ]);

      let fetchedStudents = studentsRes.data;

      if (userRole === "teacher") {
        const myClasses = subjectsRes.data.filter(
          (s) => s.teacherId === teacherId,
        );
        setTeacherSubjects(myClasses);
        const validGroups = myClasses.map(
          (c) => `${c.department}-${c.semester}`,
        );
        fetchedStudents = fetchedStudents.filter((student) => {
          const studentGroup = `${student.department}-${student.semester}`;
          return validGroups.includes(studentGroup);
        });
      }

      const sorted = fetchedStudents.sort(
        (a, b) =>
          a.department.localeCompare(b.department) ||
          a.semester.localeCompare(b.semester) ||
          a.name.localeCompare(b.name),
      );

      setStudents(sorted);
      setAttendanceLogs(campusAttRes.data);
      setPeriodLogs(periodAttRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole, teacherId]);

  const handleRefresh = async () => {
    const syncToast = toast.loading("Syncing database...");
    await fetchData();
    toast.success("Database synced successfully!", { id: syncToast });
  };

  const todayDate = new Date().toISOString().split("T")[0];

  const getCampusStatus = (urn) => {
    const isCampusPresent = attendanceLogs.some((log) => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return String(log.urn) === String(urn) && logDate === todayDate;
    });

    const isPeriodPresent = periodLogs.some((log) => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return String(log.urn) === String(urn) && logDate === todayDate;
    });

    return isCampusPresent || isPeriodPresent ? "Present" : "Absent";
  };

  const getClassStatus = (urn, subject) => {
    if (!subject) return "Absent";

    const hasLogClass = periodLogs.some((log) => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      const logSubId = log.subjectId?._id || log.subjectId;
      const isCorrectClass =
        (logSubId && String(logSubId) === String(subject._id)) ||
        log.period === subject.name;
      return (
        String(log.urn) === String(urn) &&
        logDate === todayDate &&
        isCorrectClass
      );
    });

    return hasLogClass ? "Present" : "Absent";
  };

  const filteredStudents = students
    .filter((student) => {
      const query = search.toLowerCase();
      const matchesSearch =
        student.name.toLowerCase().includes(query) ||
        student.urn.toLowerCase().includes(query) ||
        (student.email && student.email.toLowerCase().includes(query)) ||
        (student.phone && student.phone.includes(query));
      const matchesDept =
        selectedDept === "All" || student.department === selectedDept;
      const matchesSemester =
        selectedSemester === "All" || student.semester === selectedSemester;

      let matchesStatus = true;
      if (selectedStatus === "Active")
        matchesStatus = student.status === "Active" || !student.status;
      else if (selectedStatus === "Graduated")
        matchesStatus = student.status === "Graduated";

      let matchesSubject = true;
      if (userRole === "teacher" && selectedTeacherSubject !== "All") {
        const sub = teacherSubjects.find(
          (s) => String(s._id) === String(selectedTeacherSubject),
        );
        if (sub)
          matchesSubject =
            student.department === sub.department &&
            student.semester === sub.semester;
      }

      return (
        matchesSearch &&
        matchesDept &&
        matchesSemester &&
        matchesStatus &&
        matchesSubject
      );
    })
    .sort((a, b) => {
      if (a.semester !== b.semester)
        return a.semester.localeCompare(b.semester);
      return a.urn.localeCompare(b.urn, undefined, { numeric: true });
    });

  const openEditModal = (student, e) => {
    e.stopPropagation();
    setEditingStudent(student);
    setEditForm({ ...student });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const editToast = toast.loading("Updating student information...");
    try {
      const res = await backend.put(
        `/api/students/${editingStudent.urn}`,
        editForm,
      );
      setStudents((prev) =>
        prev.map((s) => (s.urn === editingStudent.urn ? res.data : s)),
      );
      setEditingStudent(null);
      toast.success("Student information updated successfully.", {
        id: editToast,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update student.", {
        id: editToast,
      });
    }
  };

  const handleDelete = async (urn, name, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete ${name}? This removes ALL face data and attendance records.`,
      )
    )
      return;

    const deleteToast = toast.loading(`Deleting ${name}...`);
    try {
      try {
        await faceApi.post("/delete", { urn });
      } catch (e) {
        console.warn("Face delete skipped");
      }
      await backend.delete(`/api/students/${urn}`);
      setStudents(students.filter((s) => s.urn !== urn));
      toast.success("Student deleted successfully.", { id: deleteToast });
    } catch (err) {
      toast.error("Failed to delete student.", { id: deleteToast });
    }
  };

  const activeSubject =
    userRole === "teacher" && selectedTeacherSubject !== "All"
      ? teacherSubjects.find(
          (s) => String(s._id) === String(selectedTeacherSubject),
        )
      : null;

  const inputClasses =
    "w-full px-4 py-3 rounded-[12px] border border-slate-200/80 bg-slate-50/50 text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-300 focus:bg-white transition-all text-sm outline-none appearance-none";
  const labelClasses =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1";

  return (
    <div
      className={
        userRole === "teacher"
          ? "min-h-screen bg-[#F8FAFC] pb-10 relative selection:bg-indigo-100"
          : "max-w-7xl mx-auto relative z-10 space-y-8"
      }
    >
      {/* Ambient Blobs for Teacher View */}
      {userRole === "teacher" && (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
          <div className="fixed bottom-[-10%] right-[-5%] w-96 h-96 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
        </>
      )}

      {/* TEACHER NAVBAR */}
      {userRole === "teacher" && (
        <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center mb-8 shadow-sm relative z-20">
          <div className="font-bold text-xl text-indigo-600 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-[10px] flex items-center justify-center">
              <FaBookOpen size={14} />
            </div>
            Teacher's Dashboard
          </div>
          <Link
            to="/teacherdashboard"
            className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-bold transition-all hover:-translate-x-1"
          >
            <FaArrowLeft /> Back
          </Link>
        </nav>
      )}

      <div
        className={
          userRole === "teacher"
            ? "max-w-7xl mx-auto px-4 lg:px-8 relative z-10"
            : ""
        }
      >
        {/* MODAL: EDIT STUDENT */}
        {editingStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white my-8">
              <div className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/60 p-5 px-6 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-[8px]">
                    <FaEdit size={14} />
                  </div>
                  Edit Student Info
                </h2>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors p-2 bg-slate-100 rounded-full"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              <form onSubmit={submitEdit} className="p-6 sm:p-8 space-y-5">
                <div>
                  <label className={labelClasses}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name || ""}
                    onChange={handleEditChange}
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <label className={labelClasses}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email || ""}
                    onChange={handleEditChange}
                    className={inputClasses}
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-[2]">
                    <label className={labelClasses}>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone || ""}
                      onChange={handleEditChange}
                      className={inputClasses}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={labelClasses}>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={editForm.age || ""}
                      onChange={handleEditChange}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClasses}>Department</label>
                    <select
                      name="department"
                      value={editForm.department || ""}
                      onChange={handleEditChange}
                      className={inputClasses}
                    >
                      {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Year</label>
                    <select
                      name="year"
                      value={editForm.year || ""}
                      onChange={handleEditChange}
                      className={inputClasses}
                    >
                      {["1st Year", "2nd Year", "3rd Year", "4th Year"].map(
                        (y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Semester</label>
                    <select
                      name="semester"
                      value={editForm.semester || ""}
                      onChange={handleEditChange}
                      className={inputClasses}
                    >
                      {[
                        "1st",
                        "2nd",
                        "3rd",
                        "4th",
                        "5th",
                        "6th",
                        "7th",
                        "8th",
                      ].map((sem) => (
                        <option key={sem} value={sem}>
                          {sem} Sem
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-[16px] border border-indigo-100/60 flex items-start gap-3 mt-6">
                  <div className="text-indigo-500 mt-0.5">
                    <FaExclamationTriangle size={14} />
                  </div>
                  <p className="text-xs text-indigo-800/80 font-medium leading-relaxed">
                    <strong>Note:</strong> URN ({editingStudent.urn}) cannot be
                    changed here as it acts as the primary security key for face
                    recognition data.
                  </p>
                </div>

                <div className="pt-6 flex gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 px-4 py-3.5 rounded-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3.5 rounded-[12px] font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* HEADER & FILTERS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {userRole === "admin"
                ? "Student Database"
                : "Class Rosters & Analysis"}
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              {userRole === "admin"
                ? "Manage college enrollment & alumni"
                : "Identify bunking patterns and view class-specific attendance"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto bg-white/60 backdrop-blur-md p-2 rounded-[20px] shadow-sm border border-slate-200/60">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 text-slate-600 rounded-[12px] hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-sm"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">
                {loading ? "Syncing..." : "Refresh"}
              </span>
            </button>

            {userRole === "teacher" && (
              <div className="relative group">
                <FaBookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 text-sm pointer-events-none" />
                <select
                  value={selectedTeacherSubject}
                  onChange={(e) => {
                    setSelectedTeacherSubject(e.target.value);
                    setSelectedDept("All");
                    setSelectedSemester("All");
                  }}
                  className="pl-10 pr-10 py-2.5 rounded-[12px] border border-indigo-200/60 bg-indigo-50/50 text-indigo-700 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none transition-colors hover:bg-indigo-100/50 cursor-pointer"
                >
                  <option value="All">All My Students</option>
                  {teacherSubjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.department}-{sub.semester})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative group">
              <FaUserGraduate className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-indigo-500 pointer-events-none transition-colors" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-10 pr-10 py-2.5 rounded-[12px] border border-slate-200/80 bg-white/50 text-slate-700 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none hover:bg-white hover:border-slate-300 transition-all cursor-pointer"
              >
                <option value="Active">Active Students</option>
                <option value="Graduated">Alumni (Graduated)</option>
                <option value="All">Everyone</option>
              </select>
            </div>

            {!(userRole === "teacher" && selectedTeacherSubject !== "All") && (
              <>
                <div className="relative group hidden sm:block">
                  <FaUniversity className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-indigo-500 pointer-events-none transition-colors" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="pl-10 pr-10 py-2.5 rounded-[12px] border border-slate-200/80 bg-white/50 text-slate-700 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none hover:bg-white hover:border-slate-300 transition-all cursor-pointer"
                  >
                    <option value="All">All Depts</option>
                    {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative group hidden md:block">
                  <FaLayerGroup className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-indigo-500 pointer-events-none transition-colors" />
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="pl-10 pr-10 py-2.5 rounded-[12px] border border-slate-200/80 bg-white/50 text-slate-700 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none hover:bg-white hover:border-slate-300 transition-all cursor-pointer"
                  >
                    <option value="All">All Sems</option>
                    {[
                      "1st",
                      "2nd",
                      "3rd",
                      "4th",
                      "5th",
                      "6th",
                      "7th",
                      "8th",
                    ].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem} Sem
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="relative flex-grow xl:flex-grow-0 group">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full xl:w-56 pl-10 pr-4 py-2.5 rounded-[12px] border border-slate-200/80 bg-white/50 text-slate-700 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white hover:border-slate-300 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[20px] shadow-sm border border-slate-200/60 overflow-hidden relative z-10">
          <div className="overflow-x-auto min-h-[500px]">
            <table className="min-w-full table-auto text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 backdrop-blur-md text-slate-500 uppercase text-[10px] tracking-widest font-bold border-b border-slate-200/60">
                  <th className="px-6 py-4.5">Student Name & Contact</th>
                  <th className="px-6 py-4.5">URN</th>
                  <th className="px-6 py-4.5">Department</th>
                  <th className="px-6 py-4.5">Academic State</th>
                  <th className="px-6 py-4.5">Campus Status</th>
                  {activeSubject && (
                    <th className="px-6 py-4.5 text-indigo-600 bg-indigo-50/50">
                      My Class Status
                    </th>
                  )}
                  {userRole === "admin" && (
                    <th className="px-6 py-4.5 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {loading ? (
                  <tr>
                    <td
                      colSpan={userRole === "admin" ? "7" : "6"}
                      className="text-center py-20 text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="font-medium">Syncing database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const isGraduated = student.status === "Graduated";
                    const campusStatus = getCampusStatus(student.urn);
                    let classStatus = "-";
                    let isBunking = false;

                    if (activeSubject && !isGraduated) {
                      classStatus = getClassStatus(student.urn, activeSubject);
                      isBunking =
                        campusStatus === "Present" && classStatus === "Absent";
                    }

                    return (
                      <tr
                        key={student._id}
                        className={`transition-all duration-300 group hover:-translate-y-[1px] ${
                          isBunking
                            ? "bg-orange-50/30 hover:bg-orange-50/60"
                            : "hover:bg-slate-50/80 hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative z-0 hover:z-10"
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-4">
                          <div
                            className={`w-11 h-11 rounded-[14px] flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm border ${
                              isGraduated
                                ? "bg-slate-100 text-slate-500 border-slate-200"
                                : isBunking
                                  ? "bg-orange-100/80 text-orange-600 border-orange-200"
                                  : "bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border-indigo-100/60"
                            }`}
                          >
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-900 truncate max-w-[150px] sm:max-w-[220px] font-bold tracking-tight">
                              {student.name}
                            </span>
                            <div className="flex items-center gap-2">
                              {student.email && (
                                <span className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                                  {student.email}
                                </span>
                              )}
                              {student.phone && (
                                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                  <FaPhone className="text-[9px] text-slate-300" />{" "}
                                  {student.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs font-medium">
                          {student.urn}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 text-[10px] font-bold rounded-[8px] bg-slate-100/80 text-slate-600 border border-slate-200/60 uppercase tracking-widest shadow-sm">
                            {student.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm">
                          {isGraduated ? (
                            <span className="text-slate-400">Alumni</span>
                          ) : (
                            <span className="text-slate-600">
                              {student.semester} Sem
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isGraduated ? (
                            <span className="text-slate-300 font-bold">-</span>
                          ) : (
                            <span
                              className={`px-3 py-1.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                                campusStatus === "Present"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                  : "bg-rose-50 text-rose-700 border-rose-200/80"
                              }`}
                            >
                              {campusStatus}
                            </span>
                          )}
                        </td>

                        {activeSubject && (
                          <td className="px-6 py-4 bg-indigo-50/20">
                            {isGraduated ? (
                              <span className="text-slate-300 font-bold">
                                -
                              </span>
                            ) : isBunking ? (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest bg-orange-100 text-orange-700 border border-orange-200/80 w-fit shadow-sm animate-pulse">
                                <FaExclamationTriangle className="text-[11px]" />{" "}
                                Bunking
                              </div>
                            ) : (
                              <span
                                className={`px-3 py-1.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                                  classStatus === "Present"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                    : "bg-rose-50 text-rose-700 border-rose-200/80"
                                }`}
                              >
                                {classStatus}
                              </span>
                            )}
                          </td>
                        )}

                        {userRole === "admin" && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                              <button
                                onClick={(e) => openEditModal(student, e)}
                                className="text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm p-2 transition-all duration-300 rounded-[10px] border border-transparent hover:border-slate-200 hover:-translate-y-0.5"
                                title="Edit Student"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button
                                onClick={(e) =>
                                  handleDelete(student.urn, student.name, e)
                                }
                                className="text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm p-2 transition-all duration-300 rounded-[10px] border border-transparent hover:border-slate-200 hover:-translate-y-0.5"
                                title="Delete Student"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={userRole === "admin" ? "7" : "6"}
                      className="text-center py-24 text-slate-400 text-sm font-medium bg-slate-50/30"
                    >
                      No students found matching your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrolled;
