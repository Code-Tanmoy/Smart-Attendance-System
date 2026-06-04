import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaDownload,
  FaFilter,
  FaSearch,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
} from "react-icons/fa";
import { backend } from "../services/api";

const Report = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // 🛡️ ROLE CONTEXT
  const userRole = localStorage.getItem("userRole");
  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [studentRes, subjectRes, logRes] = await Promise.all([
          backend.get("/api/students"),
          backend.get("/api/subjects"),
          backend.get("/api/periodwise-attendance"),
        ]);

        const activeStudents = studentRes.data.filter(
          (s) => s.status === "Active" || !s.status,
        );

        // 🟢 SMART ROLE FILTERING
        let fetchedSubjects = subjectRes.data;
        if (userRole === "teacher") {
          // Lock the subjects list to ONLY the logged-in teacher's classes
          fetchedSubjects = fetchedSubjects.filter(
            (s) => s.teacherId === teacherId,
          );
        }

        setStudents(activeStudents);
        setSubjects(fetchedSubjects);
        setLogs(logRes.data);
      } catch (error) {
        console.error("Error fetching report data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [userRole, teacherId]);

  // 1. Get Subjects based on Dept & Year selection
  const availableSubjects = subjects.filter((s) => {
    const matchDept = filterDept === "All" || s.department === filterDept;
    const matchYear = filterYear === "All" || s.year === filterYear;
    return matchDept && matchYear;
  });

  const selectedSubject = subjects.find((s) => s._id === filterSubjectId);

  // 2. CORE ENGINE: Calculate Mode A (Overall) or Mode B (Daily)
  const reportData = useMemo(() => {
    if (!selectedSubject || !students.length) return [];

    let targetStudents = students.filter(
      (s) =>
        s.department === selectedSubject.department &&
        s.year === selectedSubject.year,
    );

    if (searchTerm) {
      targetStudents = targetStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.urn.includes(searchTerm),
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

    // MODE A: OVERALL VIEW
    const subjectLogs = logs.filter(
      (log) => log.period === selectedSubject.name,
    );
    const uniqueDatesHeld = new Set(
      subjectLogs.map(
        (log) => new Date(log.recognizedAt).toISOString().split("T")[0],
      ),
    ).size;

    return targetStudents.map((student) => {
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

  // SMART EXPORT LOGIC
  const handleExportCSV = () => {
    if (reportData.length === 0) return alert("No data to export!");

    let headers = [];
    let csvRows = [];

    if (filterDate) {
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
    <div className="relative pb-10 w-full max-w-full">
      {/* 🟢 CONDITIONAL NAVBAR: Removed negative margins causing horizontal overflow */}
      {userRole === "teacher" && (
        <nav className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex justify-between items-center mb-8 shadow-sm w-full">
          <div className="font-bold text-xl text-blue-600">
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

      {/* 🟢 RESPONSIVE WRAPPER */}
      <div
        className={`w-full ${userRole === "teacher" ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : "px-2"}`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {userRole === "admin"
                ? "Global Class Reports"
                : "My Class Reports"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Select your subject to view detailed student attendance.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={!selectedSubject || reportData.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
          >
            <FaDownload /> Export CSV
          </button>
        </div>

        {/* 🔍 TEACHER CONTROLS BAR */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4 w-full">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-auto">
                <FaFilter className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                <select
                  value={filterDept}
                  onChange={(e) => {
                    setFilterDept(e.target.value);
                    setFilterSubjectId("");
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none text-gray-700 focus:ring-2 focus:ring-blue-500"
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
                className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none text-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Years</option>
                {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-grow w-full">
              <FaChalkboardTeacher className="absolute left-3 top-3.5 text-blue-500" />
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold outline-none text-blue-800 focus:ring-2 focus:ring-blue-600 truncate"
              >
                <option value="">
                  -- Step 1: Select {userRole === "admin" ? "a" : "Your"}{" "}
                  Subject --
                </option>
                {availableSubjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} ({sub.department} - {sub.year}) • {sub.teacher}
                  </option>
                ))}
              </select>
            </div>
          </div>

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

            <div className="relative w-full lg:w-auto flex-grow flex items-center justify-start lg:justify-end gap-3 flex-wrap">
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
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-2.5 rounded-lg font-bold whitespace-nowrap"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 📊 MAIN TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
          {/* 🟢 SCROLL WRAPPER: Forces table to scroll horizontally on small screens */}
          <div className="overflow-x-auto min-h-[400px] w-full">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">URN</th>
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
                      No active students found for this class.
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

export default Report;
