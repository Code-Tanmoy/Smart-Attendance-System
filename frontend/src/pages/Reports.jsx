import React, { useState, useEffect, useMemo } from "react";
import {
  FaDownload,
  FaFilter,
  FaSearch,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { backend } from "../services/api";

const Report = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 NEW: Teacher-Focused Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterDate, setFilterDate] = useState(""); // Mode Switcher

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [studentRes, subjectRes, logRes] = await Promise.all([
          backend.get("/api/students"),
          backend.get("/api/subjects"),
          backend.get("/api/periodwise-attendance"),
        ]);
        setStudents(studentRes.data);
        setSubjects(subjectRes.data);
        setLogs(logRes.data);
      } catch (error) {
        console.error("Error fetching report data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // 1. Get Subjects based on Dept & Year selection
  const availableSubjects = subjects.filter((s) => {
    const matchDept = filterDept === "All" || s.department === filterDept;
    const matchYear = filterYear === "All" || s.year === filterYear;
    return matchDept && matchYear;
  });

  const selectedSubject = subjects.find((s) => s._id === filterSubjectId);

  // 2. 🧠 CORE ENGINE: Calculate Mode A (Overall) or Mode B (Daily)
  const reportData = useMemo(() => {
    if (!selectedSubject || !students.length) return [];

    // Filter students who belong to this subject's class
    let targetStudents = students.filter(
      (s) =>
        s.department === selectedSubject.department &&
        s.year === selectedSubject.year,
    );

    // Apply Search Term
    if (searchTerm) {
      targetStudents = targetStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.urn.includes(searchTerm),
      );
    }

    // Sort Alphabetically by Name
    targetStudents.sort((a, b) => a.name.localeCompare(b.name));

    // MODE B: DAILY VIEW (If date is selected)
    if (filterDate) {
      return targetStudents.map((student) => {
        // Find if they have a log for this subject ON THIS DATE
        const presentLog = logs.find((log) => {
          const logDate = new Date(log.recognizedAt)
            .toISOString()
            .split("T")[0];
          return (
            log.urn === student.urn &&
            log.period === selectedSubject.name &&
            logDate === filterDate
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

    // MODE A: OVERALL VIEW (If no date is selected)
    // How many distinct days was THIS subject held?
    const subjectLogs = logs.filter(
      (log) => log.period === selectedSubject.name,
    );
    const uniqueDatesHeld = new Set(
      subjectLogs.map(
        (log) => new Date(log.recognizedAt).toISOString().split("T")[0],
      ),
    ).size;

    return targetStudents.map((student) => {
      // How many times did THIS student attend?
      const attended = logs.filter(
        (log) => log.urn === student.urn && log.period === selectedSubject.name,
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
  }, [students, logs, selectedSubject, filterDate, searchTerm]);

  // 🟢 SMART EXPORT LOGIC
  const handleExportCSV = () => {
    if (reportData.length === 0) return alert("No data to export!");

    let headers = [];
    let csvRows = [];

    if (filterDate) {
      // Export Daily View
      headers = ["Name", "URN", "Department", "Date", "Status", "Time Punched"];
      csvRows = reportData.map((s) => [
        `"${s.name}"`,
        `="${s.urn}"`,
        `"${s.department}"`,
        filterDate,
        s.isPresent ? "Present" : "Absent",
        s.timePunched,
      ]);
    } else {
      // Export Overall View
      headers = [
        "Name",
        "URN",
        "Department",
        "Classes Held",
        "Classes Attended",
        "Percentage (%)",
      ];
      csvRows = reportData.map((s) => [
        `"${s.name}"`,
        `="${s.urn}"`,
        `"${s.department}"`,
        s.totalPossible,
        s.totalAttended,
        s.percentage,
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedSubject.name}_Report_${filterDate || "Overall"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select your subject to view detailed student attendance.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!selectedSubject || reportData.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <FaDownload /> Export CSV
        </button>
      </div>

      {/* 🔍 TEACHER CONTROLS BAR */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Step 1: Dept & Year Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FaFilter className="absolute left-3 top-3.5 text-gray-400 text-sm" />
              <select
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setFilterSubjectId("");
                }}
                className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none text-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Depts</option>
                {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setFilterSubjectId("");
              }}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Years</option>
              {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Subject Picker */}
          <div className="relative flex-grow">
            <FaChalkboardTeacher className="absolute left-3 top-3.5 text-blue-500" />
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold outline-none text-blue-800 focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Step 1: Select Your Subject --</option>
              {availableSubjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.department} - {sub.year}) • {sub.teacher}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 3: Search & Date */}
        <div className="flex flex-col lg:flex-row gap-4 border-t border-gray-100 pt-4">
          <div className="relative w-full lg:w-1/3">
            <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div className="relative w-full lg:w-auto flex-grow flex items-center justify-end gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase">
              View Mode:
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
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-2.5 rounded-lg font-bold"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 📊 MAIN TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">URN</th>
                {/* DYNAMIC HEADERS BASED ON VIEW MODE */}
                {!filterDate ? (
                  <>
                    <th className="px-6 py-4 text-center">Classes Held</th>
                    <th className="px-6 py-4 text-center">Attended</th>
                    <th className="px-6 py-4 text-center">Overall %</th>
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
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    Loading records...
                  </td>
                </tr>
              ) : !selectedSubject ? (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <FaChalkboardTeacher className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">
                      Please select a subject from the dropdown above.
                    </p>
                  </td>
                </tr>
              ) : reportData.length > 0 ? (
                reportData.map((student, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {student.urn}
                    </td>

                    {/* DYNAMIC CELLS BASED ON VIEW MODE */}
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
                        <td className="px-6 py-4 text-center font-medium text-gray-600">
                          {filterDate}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-gray-500">
                          {student.timePunched}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {student.isPresent ? (
                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full font-bold text-xs">
                              <FaCheckCircle /> Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full font-bold text-xs">
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
                    No students found for this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Report;
