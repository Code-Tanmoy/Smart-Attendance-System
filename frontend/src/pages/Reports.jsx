import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaDownload,
  FaFilter,
  FaSearch,
  FaArrowLeft,
  FaUserGraduate,
  FaLayerGroup,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";
import { backend } from "../services/api";
import toast from "react-hot-toast";

const Report = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ROLE & VIEW CONTEXT
  const userRole = localStorage.getItem("userRole");
  const teacherId = localStorage.getItem("teacherId");
  const [viewMode, setViewMode] = useState("Subject");
  const [teacherDept, setTeacherDept] = useState("");

  // GLOBAL FILTERS
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const fetchPromises = [
          backend.get("/api/students"),
          backend.get("/api/subjects"),
          backend.get("/api/periodwise-attendance"),
        ];

        if (userRole === "teacher")
          fetchPromises.push(backend.get("/api/teachers"));

        const results = await Promise.all(fetchPromises);
        const activeStudents = results[0].data.filter(
          (s) => s.status === "Active" || !s.status,
        );

        setStudents(activeStudents);
        setSubjects(results[1].data);
        setLogs(results[2].data);

        // Lock Department for Teachers
        if (userRole === "teacher" && results[3]) {
          const me = results[3].data.find((t) => t.teacherId === teacherId);
          if (me) {
            setTeacherDept(me.department);
            setFilterDept(me.department);
          } else {
            const mySub = results[1].data.find(
              (s) => s.teacherId === teacherId,
            );
            if (mySub) {
              setTeacherDept(mySub.department);
              setFilterDept(mySub.department);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching report data", error);
        toast.error("Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [userRole, teacherId]);

  const handleClearFilters = () => {
    if (userRole !== "teacher") setFilterDept("All");
    setFilterSemester("All");
    setFilterSubjectId("");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  // ENGINE 1: SUBJECT-SPECIFIC VIEW
  const availableSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchDept = filterDept === "All" || s.department === filterDept;
      const matchYear =
        filterSemester === "All" || s.semester === filterSemester;
      const matchTeacher =
        userRole === "teacher" ? s.teacherId === teacherId : true;
      return matchDept && matchYear && matchTeacher;
    });
  }, [subjects, filterDept, filterSemester, userRole, teacherId]);

  const selectedSubject = subjects.find((s) => s._id === filterSubjectId);

  const subjectReportData = useMemo(() => {
    if (viewMode !== "Subject" || !selectedSubject || !students.length)
      return [];

    let targetStudents = students.filter(
      (s) =>
        s.department === selectedSubject.department &&
        s.semester === selectedSubject.semester,
    );

    if (searchTerm) {
      targetStudents = targetStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.urn.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    targetStudents.sort((a, b) => a.name.localeCompare(b.name));

    const filteredLogs = logs.filter((log) => {
      if (!startDate && !endDate) return true;
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      if (startDate && endDate)
        return logDate >= startDate && logDate <= endDate;
      if (startDate) return logDate >= startDate;
      if (endDate) return logDate <= endDate;
      return true;
    });

    const subjectLogs = filteredLogs.filter((log) => {
      const logSubId = log.subjectId?._id || log.subjectId;
      return (
        (logSubId && String(logSubId) === String(selectedSubject._id)) ||
        log.period === selectedSubject.name
      );
    });

    const uniqueDatesHeld = new Set(
      subjectLogs.map(
        (log) => new Date(log.recognizedAt).toISOString().split("T")[0],
      ),
    ).size;

    return targetStudents.map((student) => {
      const attended = subjectLogs.filter(
        (log) => String(log.urn) === String(student.urn),
      ).length;
      return {
        ...student,
        totalPossible: uniqueDatesHeld,
        totalAttended: attended,
        percentage:
          uniqueDatesHeld === 0
            ? 0
            : Math.round((attended / uniqueDatesHeld) * 100),
      };
    });
  }, [
    students,
    logs,
    selectedSubject,
    searchTerm,
    viewMode,
    startDate,
    endDate,
  ]);

  // ENGINE 2: MASTER CONSOLIDATED VIEW
  const masterReportData = useMemo(() => {
    if (viewMode !== "Master" || !students.length || !subjects.length)
      return [];

    let targetStudents = students;
    if (filterDept !== "All")
      targetStudents = targetStudents.filter(
        (s) => s.department === filterDept,
      );
    if (filterSemester !== "All")
      targetStudents = targetStudents.filter(
        (s) => s.semester === filterSemester,
      );
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      targetStudents = targetStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.urn.toLowerCase().includes(query),
      );
    }

    const semesterWeights = {
      "1st": 1,
      "2nd": 2,
      "3rd": 3,
      "4th": 4,
      "5th": 5,
      "6th": 6,
      "7th": 7,
      "8th": 8,
    };
    targetStudents.sort((a, b) => {
      const semA = semesterWeights[a.semester] || 99;
      const semB = semesterWeights[b.semester] || 99;
      if (semA !== semB) return semA - semB;
      return a.urn.localeCompare(b.urn, undefined, { numeric: true });
    });

    const filteredLogs = logs.filter((log) => {
      if (!startDate && !endDate) return true;
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      if (startDate && endDate)
        return logDate >= startDate && logDate <= endDate;
      if (startDate) return logDate >= startDate;
      if (endDate) return logDate <= endDate;
      return true;
    });

    const subjectStats = {};
    subjects.forEach((sub) => {
      const subLogs = filteredLogs.filter((log) => {
        const logSubId = log.subjectId?._id || log.subjectId;
        return (
          (logSubId && String(logSubId) === String(sub._id)) ||
          log.period === sub.name
        );
      });
      subjectStats[sub._id] = new Set(
        subLogs.map(
          (log) => new Date(log.recognizedAt).toISOString().split("T")[0],
        ),
      ).size;
    });

    return targetStudents.map((student) => {
      const studentSubjects = subjects.filter(
        (sub) =>
          sub.department === student.department &&
          sub.semester === student.semester,
      );
      let overallAttended = 0;
      let overallPossible = 0;
      const breakdown = [];

      studentSubjects.forEach((sub) => {
        const possible = subjectStats[sub._id] || 0;
        const attended = filteredLogs.filter((log) => {
          const logSubId = log.subjectId?._id || log.subjectId;
          const isCorrectClass =
            (logSubId && String(logSubId) === String(sub._id)) ||
            log.period === sub.name;
          return isCorrectClass && String(log.urn) === String(student.urn);
        }).length;

        overallPossible += possible;
        overallAttended += attended;

        if (possible > 0)
          breakdown.push({ name: sub.name, attended, possible });
      });

      return {
        ...student,
        breakdown,
        overallAttended,
        overallPossible,
        percentage:
          overallPossible === 0
            ? 0
            : Math.round((overallAttended / overallPossible) * 100),
      };
    });
  }, [
    students,
    logs,
    subjects,
    filterDept,
    filterSemester,
    searchTerm,
    viewMode,
    startDate,
    endDate,
  ]);

  const handleEndSemester = async () => {
    const isConfirmed = window.confirm(
      "📦 ARCHIVE SEMESTER \n\nAre you sure you want to officially end this semester?\n\nThis will safely move all current attendance records into the Database Archive for historical keeping, and reset the active dashboard to 0% for the new semester.\n\nClick OK to proceed.",
    );

    if (isConfirmed) {
      const archiveToast = toast.loading(
        "Archiving historical data and resetting dashboard...",
      );
      try {
        const res = await backend.post(
          "/api/periodwise-attendance/end-semester",
        );
        setLogs([]);
        toast.success(res.data.message, { id: archiveToast, icon: "📦" });
      } catch (err) {
        toast.error("Failed to archive semester.", { id: archiveToast });
      }
    }
  };

  const handleExportCSV = () => {
    const dataToExport =
      viewMode === "Subject" ? subjectReportData : masterReportData;
    if (dataToExport.length === 0) {
      return toast.error(
        "No data available to export based on current filters.",
      );
    }

    let headers = [];
    let csvRows = [];
    let filename = "";
    const dateStr =
      startDate || endDate
        ? `_from_${startDate || "start"}_to_${endDate || "end"}`
        : "_Overall";

    if (viewMode === "Subject") {
      filename = `${selectedSubject.name}_Report${dateStr}.csv`;
      headers = [
        "Name",
        "URN",
        "Department",
        "Classes Held",
        "Classes Attended",
        "Percentage (%)",
      ];
      csvRows = dataToExport.map((s) => [
        `"${s.name}"`,
        `="${s.urn}"`,
        `"${s.department}"`,
        s.totalPossible,
        s.totalAttended,
        s.percentage,
      ]);
    } else {
      filename = `Master_Report_${filterDept}_${filterSemester}${dateStr}.csv`;
      headers = [
        "Student Name",
        "URN",
        "Department",
        "Semester",
        "Total Classes Held",
        "Total Classes Attended",
        "Overall Percentage (%)",
        "Subject Breakdown",
      ];
      csvRows = dataToExport.map((s) => {
        const breakdownStr = s.breakdown
          .map((b) => `${b.name}: ${b.attended}/${b.possible}`)
          .join(" | ");
        return [
          `"${s.name}"`,
          `="${s.urn}"`,
          `"${s.department}"`,
          `"${s.semester}"`,
          s.overallPossible,
          s.overallAttended,
          s.percentage,
          `"${breakdownStr}"`,
        ];
      });
    }

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported successfully!");
  };

  const inputClasses =
    "w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/50 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-300 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-700 placeholder-slate-400 shadow-sm";
  const selectClasses = `${inputClasses} appearance-none disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed cursor-pointer`;
  const iconClasses =
    "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300";

  return (
    <div
      className={
        userRole === "teacher"
          ? "min-h-screen bg-[#F8FAFC] pb-10 relative selection:bg-indigo-100"
          : "max-w-7xl mx-auto pb-10 relative z-10 space-y-8"
      }
    >
      {/* Ambient Blobs for Teacher View */}
      {userRole === "teacher" && (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
          <div className="fixed bottom-[-10%] right-[-5%] w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
        </>
      )}

      {/* TEACHER NAVBAR */}
      {userRole === "teacher" && (
        <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center mb-8 shadow-sm relative z-20">
          <div className="font-bold text-xl text-indigo-600 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-[10px] flex items-center justify-center">
              <FaChalkboardTeacher size={14} />
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
            : "relative z-10"
        }
      >
        {/* VIEW TOGGLE & HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 border-b border-slate-200/60 pb-6">
          <div>
            <div className="flex bg-slate-100/80 p-1.5 rounded-[16px] w-fit mb-4 border border-slate-200/50">
              <button
                onClick={() => setViewMode("Subject")}
                className={`px-6 py-2.5 rounded-[12px] font-bold text-sm transition-all duration-300 ${viewMode === "Subject" ? "bg-white text-indigo-600 shadow-sm shadow-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
              >
                Subject View
              </button>
              <button
                onClick={() => setViewMode("Master")}
                className={`px-6 py-2.5 rounded-[12px] font-bold text-sm transition-all duration-300 ${viewMode === "Master" ? "bg-white text-indigo-600 shadow-sm shadow-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
              >
                Master View
              </button>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {viewMode === "Subject"
                ? "Subject Attendance Report"
                : "Master Consolidated Report"}
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {viewMode === "Subject"
                ? "View detailed attendance logs for your specific classes."
                : "View combined attendance across all subjects for grading and mentoring."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={handleExportCSV}
              disabled={
                (viewMode === "Subject" && !selectedSubject) ||
                (viewMode === "Master" && masterReportData.length === 0)
              }
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0 text-white px-6 py-3 rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:active:scale-100 text-sm"
            >
              <FaDownload /> Export CSV
            </button>
            {userRole === "admin" && (
              <button
                onClick={handleEndSemester}
                className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-lg hover:shadow-rose-200 hover:-translate-y-0.5 text-white px-6 py-3 rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] text-sm"
              >
                End Semester
              </button>
            )}
          </div>
        </div>

        {/* UNIVERSAL FILTERS BAR */}
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-[24px] shadow-sm border border-slate-200/60 mb-8 w-full relative">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FaFilter /> Report Parameters
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 px-3 py-1.5 rounded-[8px] transition-all border border-slate-200/80 hover:border-rose-200 shadow-sm flex items-center gap-1.5"
            >
              <FaTimes /> Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="relative group w-full">
              <FaFilter className={iconClasses} />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                disabled={userRole === "teacher"}
                className={selectClasses}
              >
                <option value="All">All Departments</option>
                {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative group w-full">
              <FaLayerGroup className={iconClasses} />
              <select
                value={filterSemester}
                onChange={(e) => {
                  setFilterSemester(e.target.value);
                  setFilterSubjectId("");
                }}
                className={selectClasses}
              >
                <option value="All">All Semesters</option>
                {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"].map(
                  (sem) => (
                    <option key={sem} value={sem}>
                      {sem} Semester
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="relative group w-full xl:col-span-2">
              <FaSearch className={iconClasses} />
              <input
                type="text"
                placeholder="Search by Student Name or URN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-4 pt-4 mt-4 border-t border-slate-100/80">
            {viewMode === "Subject" && (
              <div className="relative group w-full xl:w-1/3">
                <FaChalkboardTeacher className={iconClasses} />
                <select
                  value={filterSubjectId}
                  onChange={(e) => setFilterSubjectId(e.target.value)}
                  className={`${selectClasses} !bg-indigo-50/50 hover:!bg-indigo-50 !border-indigo-200/60 !text-indigo-800 focus:!ring-indigo-500/20`}
                >
                  <option value="">-- Select Subject --</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.department} - {sub.semester})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full ${viewMode === "Subject" ? "xl:w-2/3 xl:justify-end" : "justify-start"}`}
            >
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest pl-1">
                <FaCalendarAlt /> Date Range:
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${inputClasses.replace("pl-10", "pl-4")} w-full sm:w-auto !py-2.5 cursor-pointer`}
                />
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  to
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${inputClasses.replace("pl-10", "pl-4")} w-full sm:w-auto !py-2.5 cursor-pointer`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* DYNAMIC TABLE RENDERING */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[24px] shadow-sm border border-slate-200/60 w-full overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            {/* --- TABLE: SUBJECT MODE --- */}
            {viewMode === "Subject" && (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 backdrop-blur-md text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200/60">
                  <tr>
                    <th className="px-6 py-4.5 rounded-tl-[16px]">
                      Student Name
                    </th>
                    <th className="px-6 py-4.5">URN</th>
                    <th className="px-6 py-4.5 text-center">Classes Held</th>
                    <th className="px-6 py-4.5 text-center">Attended</th>
                    <th className="px-6 py-4.5 text-center rounded-tr-[16px]">
                      Subject %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-20 text-slate-400"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                          <span className="font-medium text-sm">
                            Loading records...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : !selectedSubject ? (
                    <tr>
                      <td colSpan="5" className="text-center py-24">
                        <div className="p-4 bg-slate-50 inline-block rounded-full mb-4 border border-slate-100">
                          <FaChalkboardTeacher className="text-3xl text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">
                          Please select a subject from the dropdown above.
                        </p>
                      </td>
                    </tr>
                  ) : subjectReportData.length > 0 ? (
                    subjectReportData.map((student, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/80 transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                      >
                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[8px] bg-indigo-50/80 border border-indigo-100/60 text-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm">
                            {student.name.charAt(0)}
                          </div>
                          {student.name}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs font-medium">
                          {student.urn}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 font-medium">
                          {student.totalPossible}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                          {student.totalAttended}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold border shadow-sm ${student.percentage >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200/80" : student.percentage >= 50 ? "bg-amber-50 text-amber-700 border-amber-200/80" : "bg-rose-50 text-rose-700 border-rose-200/80"}`}
                          >
                            {student.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-20 text-slate-400 italic text-sm font-medium bg-slate-50/30"
                      >
                        No students found for this subject.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* --- TABLE: MASTER MODE --- */}
            {viewMode === "Master" && (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 backdrop-blur-md text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200/60">
                  <tr>
                    <th className="px-6 py-4.5 rounded-tl-[16px]">
                      Student Details
                    </th>
                    <th className="px-6 py-4.5">Cohort</th>
                    <th className="px-6 py-4.5">Subject Breakdown</th>
                    <th className="px-6 py-4.5 text-center">Overall Ratio</th>
                    <th className="px-6 py-4.5 text-center rounded-tr-[16px]">
                      Overall %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-20 text-slate-400"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                          <span className="font-medium text-sm">
                            Compiling master records...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : masterReportData.length > 0 ? (
                    masterReportData.map((student, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/80 transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[12px] bg-slate-100 border border-slate-200/80 text-slate-600 flex items-center justify-center text-sm font-bold shadow-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 tracking-tight">
                              {student.name}
                            </span>
                            <span className="text-slate-500 font-mono text-[10px] font-medium">
                              {student.urn}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100/80 border border-slate-200/60 text-slate-600 px-3 py-1.5 rounded-[8px] text-[10px] uppercase tracking-widest font-bold inline-block shadow-sm">
                            {student.department} • {student.semester}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {student.breakdown.length > 0 ? (
                            <div className="flex flex-wrap gap-2 max-w-sm sm:max-w-md">
                              {student.breakdown.map((sub, idx) => {
                                const subPercent = Math.round(
                                  (sub.attended / sub.possible) * 100,
                                );
                                let tagColor =
                                  "bg-emerald-50/80 text-emerald-700 border-emerald-200/80 shadow-sm";
                                if (subPercent < 75)
                                  tagColor =
                                    "bg-amber-50/80 text-amber-700 border-amber-200/80 shadow-sm";
                                if (subPercent < 50)
                                  tagColor =
                                    "bg-rose-50/80 text-rose-700 border-rose-200/80 shadow-sm";

                                return (
                                  <span
                                    key={idx}
                                    className={`text-[9px] font-bold px-2 py-1 rounded-[6px] border ${tagColor}`}
                                    title={`${sub.name}: ${subPercent}%`}
                                  >
                                    {sub.name}: {sub.attended}/{sub.possible}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-medium">
                              No classes held yet
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-slate-800 bg-white border border-slate-200/80 shadow-sm inline-block px-3 py-1.5 rounded-[8px] text-[13px]">
                            {student.overallAttended}{" "}
                            <span className="text-slate-400 text-[10px] font-bold uppercase ml-0.5">
                              / {student.overallPossible}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3.5 py-2 rounded-[10px] text-[13px] font-bold shadow-sm border ${student.percentage >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200/80" : student.percentage >= 50 ? "bg-amber-50 text-amber-700 border-amber-200/80" : "bg-rose-50 text-rose-700 border-rose-200/80"}`}
                          >
                            {student.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-24 bg-slate-50/30"
                      >
                        <div className="p-4 bg-white inline-block rounded-full mb-4 border border-slate-100 shadow-sm">
                          <FaUserGraduate className="text-3xl text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm italic">
                          No students found matching these filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
