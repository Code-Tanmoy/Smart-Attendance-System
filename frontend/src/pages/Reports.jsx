
import React, { useState, useEffect, useMemo } from "react";
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
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { backend } from "../services/api";
import toast from "react-hot-toast";

const Report = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🛡️ ROLE & VIEW CONTEXT
  const userRole = localStorage.getItem("userRole");
  const teacherId = localStorage.getItem("teacherId");
  const [viewMode, setViewMode] = useState("Subject"); // "Subject" or "Master"
  const [teacherDept, setTeacherDept] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const fetchPromises = [
          backend.get("/api/students"),
          backend.get("/api/subjects"),
          backend.get("/api/periodwise-attendance"),
        ];

        // Fetch teachers to lock the department if it's a teacher
        if (userRole === "teacher") {
          fetchPromises.push(backend.get("/api/teachers"));
        }

        const results = await Promise.all(fetchPromises);
        const activeStudents = results[0].data.filter(
          (s) => s.status === "Active" || !s.status,
        );

        setStudents(activeStudents);
        setSubjects(results[1].data);
        setLogs(results[2].data);

        // 🔒 Lock Department for Teachers
        if (userRole === "teacher" && results[3]) {
          const me = results[3].data.find((t) => t.teacherId === teacherId);
          if (me) {
            setTeacherDept(me.department);
            setFilterDept(me.department);
          } else {
            // Fallback: Guess dept from subjects they teach
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

  // ==========================================
  // 🧠 ENGINE 1: SUBJECT-SPECIFIC VIEW
  // ==========================================
  const availableSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchDept = filterDept === "All" || s.department === filterDept;
      const matchYear =
        filterSemester === "All" || s.semester === filterSemester;
      // If teacher is in Subject View, only show THEIR subjects
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
          s.urn.toLowerCase().includes(searchTerm),
      );
    }
    targetStudents.sort((a, b) => a.name.localeCompare(b.name));

    // MODE B: DAILY VIEW
    if (filterDate) {
      return targetStudents.map((student) => {
        const presentLog = logs.find((log) => {
          const logDate = new Date(log.recognizedAt)
            .toISOString()
            .split("T")[0];
          const logSubId = log.subjectId?._id || log.subjectId;
          const isCorrectClass =
            (logSubId && String(logSubId) === String(selectedSubject._id)) ||
            log.period === selectedSubject.name;
          return (
            log.urn === student.urn && isCorrectClass && logDate === filterDate
          );
        });

        return {
          ...student,
          isPresent: !!presentLog,
          timePunched: presentLog
            ? new Date(presentLog.recognizedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
        };
      });
    }

    // MODE A: OVERALL SUBJECT VIEW
    const subjectLogs = logs.filter((log) => {
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
  }, [students, logs, selectedSubject, filterDate, searchTerm, viewMode]);

  // ==========================================
  // 🧠 ENGINE 2: MASTER CONSOLIDATED VIEW
  // ==========================================
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
    targetStudents.sort((a, b) => a.name.localeCompare(b.name));

    const subjectStats = {};
    subjects.forEach((sub) => {
      const subLogs = logs.filter((log) => {
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
        const attended = logs.filter((log) => {
          const logSubId = log.subjectId?._id || log.subjectId;
          const isCorrectClass =
            (logSubId && String(logSubId) === String(sub._id)) ||
            log.period === sub.name;
          return isCorrectClass && String(log.urn) === String(student.urn);
        }).length;

        overallPossible += possible;
        overallAttended += attended;

        if (possible > 0) {
          breakdown.push({ name: sub.name, attended, possible });
        }
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
  ]);

  // 📥 SMART EXPORT LOGIC
  const handleExportCSV = () => {
    const dataToExport =
      viewMode === "Subject" ? subjectReportData : masterReportData;
    if (dataToExport.length === 0) {
      toast.error("No data available to export based on current filters.");
      return;
    }

    let headers = [];
    let csvRows = [];
    let filename = "";

    if (viewMode === "Subject") {
      filename = `${selectedSubject.name}_Report_${filterDate || "Overall"}.csv`;
      if (filterDate) {
        headers = [
          "Name",
          "URN",
          "Department",
          "Date",
          "Status",
          "Time Punched",
        ];
        csvRows = dataToExport.map((s) => [
          `"${s.name}"`,
          `="${s.urn}"`,
          `"${s.department}"`,
          filterDate,
          s.isPresent ? "Present" : "Absent",
          s.timePunched,
        ]);
      } else {
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
      }
    } else {
      filename = `Master_Report_${filterDept}_${filterSemester}.csv`;
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
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported successfully!");
  };

  return (
    <div className="relative pb-10 w-full max-w-full bg-gray-50 min-h-screen">
      {userRole === "teacher" && (
        <nav className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex justify-between items-center mb-8 shadow-sm w-full">
          <div className="font-bold text-xl text-blue-600 flex items-center gap-2">
            Teacher's Dashboard
          </div>
          <Link
            to="/teacherdashboard"
            className="text-gray-500 hover:text-blue-600 flex items-center gap-2 text-sm font-bold transition-colors"
          >
            <FaArrowLeft /> Back to Dashboard
          </Link>
        </nav>
      )}

      <div
        className={`w-full ${userRole === "teacher" ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : "px-4 pt-6"}`}
      >
        {/* 🔄 VIEW TOGGLE & HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-gray-200 pb-6">
          <div>
            <div className="flex bg-gray-200/60 p-1 rounded-xl w-fit mb-4 border border-gray-200 shadow-inner">
              <button
                onClick={() => setViewMode("Subject")}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                  viewMode === "Subject"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Subject View
              </button>
              <button
                onClick={() => setViewMode("Master")}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                  viewMode === "Master"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Master View
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              {viewMode === "Subject"
                ? "Subject Attendance Report"
                : "Master Consolidated Report"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {viewMode === "Subject"
                ? "View detailed attendance logs for your specific classes."
                : "View combined attendance across all subjects for grading and mentoring."}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={
              (viewMode === "Subject" && !selectedSubject) ||
              (viewMode === "Master" && masterReportData.length === 0)
            }
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
          >
            <FaDownload /> Export CSV
          </button>
        </div>

        {/* 🔍 FILTERS BAR */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4 w-full">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* DEPARTMENT FILTER (Locked for Teachers) */}
            <div className="relative w-full lg:w-1/4">
              <FaFilter className="absolute left-3 top-3.5 text-gray-400 text-sm" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                disabled={userRole === "teacher"}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none border focus:ring-2 focus:ring-blue-500 ${
                  userRole === "teacher"
                    ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <option value="All">All Departments</option>
                {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* SEMESTER FILTER */}
            <div className="relative w-full lg:w-1/4">
              <FaLayerGroup className="absolute left-3 top-3.5 text-gray-400 text-sm" />
              <select
                value={filterSemester}
                onChange={(e) => {
                  setFilterSemester(e.target.value);
                  setFilterSubjectId("");
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none text-gray-700 focus:ring-2 focus:ring-blue-500"
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

            {/* SEARCH */}
            <div className="relative w-full lg:w-2/4">
              <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Student Name or URN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* SECONDARY FILTERS (Only visible in Subject Mode) */}
          {viewMode === "Subject" && (
            <div className="flex flex-col lg:flex-row gap-4 border-t border-gray-100 pt-4">
              <div className="relative flex-grow w-full">
                <FaChalkboardTeacher className="absolute left-3 top-3.5 text-blue-500" />
                <select
                  value={filterSubjectId}
                  onChange={(e) => setFilterSubjectId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold outline-none text-blue-800 focus:ring-2 focus:ring-blue-600 truncate"
                >
                  <option value="">-- Select Your Subject --</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.department} - {sub.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full lg:w-auto flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">
                  Daily View:
                </span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold outline-none transition-colors ${
                    filterDate
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-2.5 rounded-lg font-bold whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 📊 DYNAMIC TABLE RENDERING */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="overflow-x-auto min-h-[400px] w-full pb-4">
            {/* --- TABLE: SUBJECT MODE --- */}
            {viewMode === "Subject" && (
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">URN</th>
                    {!filterDate ? (
                      <>
                        <th className="px-6 py-4 text-center">Classes Held</th>
                        <th className="px-6 py-4 text-center">Attended</th>
                        <th className="px-6 py-4 text-center">Subject %</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-center">Date</th>
                        <th className="px-6 py-4 text-center">Time Punched</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-10 text-gray-400"
                      >
                        Loading records...
                      </td>
                    </tr>
                  ) : !selectedSubject ? (
                    <tr>
                      <td colSpan="6" className="text-center py-20">
                        <FaChalkboardTeacher className="mx-auto text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">
                          Please select a subject from the dropdown to view
                          attendance.
                        </p>
                      </td>
                    </tr>
                  ) : subjectReportData.length > 0 ? (
                    subjectReportData.map((student, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-gray-800 whitespace-nowrap">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                          {student.urn}
                        </td>
                        {!filterDate ? (
                          <>
                            <td className="px-6 py-4 text-center text-gray-500">
                              {student.totalPossible}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-gray-800">
                              {student.totalAttended}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${student.percentage >= 75 ? "bg-green-100 text-green-700" : student.percentage >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                              >
                                {student.percentage}%
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-center font-medium text-gray-600 whitespace-nowrap">
                              {filterDate}
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-xs text-gray-500">
                              {student.timePunched}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {student.isPresent ? (
                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full font-bold text-xs whitespace-nowrap">
                                  <FaCheckCircle /> Present
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full font-bold text-xs whitespace-nowrap">
                                  <FaTimesCircle /> Absent
                                </span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-10 text-gray-400 italic"
                      >
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* --- TABLE: MASTER MODE --- */}
            {viewMode === "Master" && (
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Student Details</th>
                    <th className="px-6 py-4">Cohort</th>
                    <th className="px-6 py-4">Subject Breakdown</th>
                    <th className="px-6 py-4 text-center">Overall Ratio</th>
                    <th className="px-6 py-4 text-center">Overall %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-10 text-gray-400"
                      >
                        Compiling master records...
                      </td>
                    </tr>
                  ) : masterReportData.length > 0 ? (
                    masterReportData.map((student, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">
                            {student.name}
                          </div>
                          <div className="text-gray-500 font-mono text-xs mt-0.5">
                            {student.urn}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold inline-block">
                            {student.department} • {student.semester}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {student.breakdown.length > 0 ? (
                            <div className="flex flex-wrap gap-2 max-w-sm">
                              {student.breakdown.map((sub, idx) => {
                                const subPercent = Math.round(
                                  (sub.attended / sub.possible) * 100,
                                );
                                let tagColor =
                                  "bg-blue-50 text-blue-700 border-blue-100";
                                if (subPercent < 75)
                                  tagColor =
                                    "bg-orange-50 text-orange-700 border-orange-100";
                                if (subPercent < 50)
                                  tagColor =
                                    "bg-red-50 text-red-700 border-red-100";
                                return (
                                  <span
                                    key={idx}
                                    className={`text-[10px] font-bold px-2 py-1 rounded border ${tagColor}`}
                                    title={`${sub.name}: ${subPercent}%`}
                                  >
                                    {sub.name}: {sub.attended}/{sub.possible}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">
                              No classes held yet
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-gray-800">
                            {student.overallAttended}{" "}
                            <span className="text-gray-400 text-xs font-normal">
                              / {student.overallPossible}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm ${student.percentage >= 75 ? "bg-green-100 text-green-700 border border-green-200" : student.percentage >= 50 ? "bg-yellow-100 text-yellow-700 border border-yellow-200" : "bg-red-100 text-red-700 border border-red-200"}`}
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
                        className="text-center py-16 text-gray-400 italic"
                      >
                        <FaUserGraduate className="mx-auto text-4xl text-gray-300 mb-3" />
                        No students found matching these filters.
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
