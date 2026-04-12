import React, { useEffect, useState } from "react";
import {
  FaChalkboardTeacher,
  FaClock,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
import { backend } from "../services/api";

const Period = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentPeriods, setCurrentPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Filters specifically for the Subject Cubes (Cards)
  const [cardFilterDept, setCardFilterDept] = useState("All");
  const [cardFilterYear, setCardFilterYear] = useState("All");

  // Filters for the Logbook Table
  const [filterDept, setFilterDept] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  // Pagination for Logbook
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, subjectsRes] = await Promise.all([
          backend.get("/api/periodwise-attendance"),
          backend.get("/api/subjects"),
        ]);
        setAttendanceData(logsRes.data);
        const sortedSubjects = subjectsRes.data.sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        );
        setSubjects(sortedSubjects);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCurrentPeriods = async () => {
      try {
        const res = await backend.get("/api/periodwise-attendance/current");
        setCurrentPeriods(res.data.periods || []);
      } catch (err) {
        console.error("Error fetching period");
      }
    };
    fetchCurrentPeriods();
    const interval = setInterval(fetchCurrentPeriods, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  // 📊 FILTER & SORT LOGIC FOR CARDS
  const displaySubjects = subjects
    .filter((sub) => {
      const matchDept =
        cardFilterDept === "All" || sub.department === cardFilterDept;
      const matchYear = cardFilterYear === "All" || sub.year === cardFilterYear;
      return matchDept && matchYear;
    })
    .sort((a, b) => {
      // 1st Priority: Sort by Year (e.g., "1st Year" before "2nd Year")
      if (a.year !== b.year) return a.year.localeCompare(b.year);

      // 2nd Priority: Sort by Semester (e.g., "3rd" before "4th")
      if (a.semester !== b.semester)
        return a.semester.localeCompare(b.semester);

      // 3rd Priority: Sort by Start Time
      return a.startTime.localeCompare(b.startTime);
    });

  // 📊 FILTER & SORT LOGIC FOR LOGBOOK
  const filteredData = attendanceData
    .filter((log) => {
      const matchDept = filterDept === "All" || log.course === filterDept;
      let matchDate = true;
      if (filterDate) {
        const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
        matchDate = logDate === filterDate;
      }
      return matchDept && matchDate;
    })
    .sort((a, b) => {
      // 1. Find the parent subject for both logs to discover their Year & Semester
      const subA = subjects.find((s) => s.name === a.period) || {
        year: "Unknown",
        semester: "Unknown",
      };
      const subB = subjects.find((s) => s.name === b.period) || {
        year: "Unknown",
        semester: "Unknown",
      };

      // 2. 1st Priority: Sort by Year ("1st Year" before "2nd Year")
      if (subA.year !== subB.year) return subA.year.localeCompare(subB.year);

      // 3. 2nd Priority: Sort by Semester ("3rd" before "4th")
      if (subA.semester !== subB.semester)
        return subA.semester.localeCompare(subB.semester);

      // 4. 3rd Priority: Sort by exact scan time (most recent scans first)
      return new Date(b.recognizedAt) - new Date(a.recognizedAt);
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableData = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            Period Status & Logs
          </h1>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
          <span className={`relative flex h-3 w-3`}>
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                currentPeriods.length > 0 ? "bg-green-400" : "bg-gray-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                currentPeriods.length > 0 ? "bg-green-500" : "bg-gray-500"
              }`}
            ></span>
          </span>
          <span className="text-gray-600 text-sm font-medium">
            Active:{" "}
            <span className="font-bold text-gray-800">
              {currentPeriods.length > 0
                ? currentPeriods.map((p) => p.name).join(", ")
                : "No Period"}
            </span>
          </span>
        </div>
      </div>

      {/* 🟢 NEW FILTER BAR FOR CARDS */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-bold text-gray-800">Today's Schedule</h2>
        <div className="flex gap-2">
          <select
            value={cardFilterDept}
            onChange={(e) => setCardFilterDept(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="All">All Depts</option>
            {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={cardFilterYear}
            onChange={(e) => setCardFilterYear(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="All">All Years</option>
            {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📅 DYNAMIC SCHEDULE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
        {displaySubjects.length > 0 ? (
          displaySubjects.map((subject) => {
            const isLive = currentPeriods.some((p) => p.id === subject._id);
            const todayCount = attendanceData.filter((log) => {
              const logDate = new Date(log.recognizedAt)
                .toISOString()
                .split("T")[0];
              return log.period === subject.name && logDate === todayStr;
            }).length;

            return (
              <div
                key={subject._id}
                className={`relative flex flex-col justify-between rounded-2xl p-4 border transition-all ${
                  isLive
                    ? "bg-white border-blue-500 ring-4 ring-blue-500/10 z-10 scale-105"
                    : "bg-white border-gray-100"
                }`}
              >
                {isLive && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg animate-pulse">
                    LIVE
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">
                    {subject.department}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 text-right">
                    <div>{subject.year}</div>
                    <div className="text-blue-400">{subject.semester} Sem</div>
                  </div>
                </div>

                <h2
                  className={`text-lg font-bold mb-1 ${
                    isLive ? "text-blue-600" : "text-gray-800"
                  }`}
                >
                  {subject.name}
                </h2>
                <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-3">
                  <FaChalkboardTeacher /> {subject.teacher}
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <div className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <FaClock className="text-gray-300" /> {subject.startTime} -{" "}
                    {subject.endTime}
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {todayCount}{" "}
                    <span className="text-[10px] text-gray-400 font-normal">
                      Present
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
            No classes match your filter.
          </div>
        )}
      </div>

      {/* 📋 DETAILED LOGS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-lg font-bold text-gray-800">
            Attendance Logbook
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filterDate && (
                <button
                  onClick={() => {
                    setFilterDate("");
                    setCurrentPage(1);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-[8px]"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <FaFilter className="text-gray-400 text-xs" />
              <select
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-sm text-gray-600 font-medium focus:outline-none"
              >
                <option value="All">All Depts</option>
                {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold text-right">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : currentTableData.length > 0 ? (
                currentTableData.map((log, index) => {
                  const logSubject = subjects.find(
                    (s) => s.name === log.period,
                  );
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {log.name ? log.name.charAt(0) : "?"}
                        </div>
                        {log.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-800 font-mono text-xs">
                          {log.urn}
                        </div>
                        <div className="text-[10px] font-bold text-blue-600 bg-blue-50 inline-block px-1 rounded mt-0.5">
                          {log.course}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700 font-bold">
                          {log.period}
                        </div>
                        {logSubject && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {logSubject.year} • {logSubject.semester} Sem
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 font-mono text-xs">
                        {new Date(log.recognizedAt).toLocaleString()}
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
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6 border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-400">Page {currentPage}</span>
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
                indexOfLastItem < filteredData.length &&
                paginate(currentPage + 1)
              }
              disabled={indexOfLastItem >= filteredData.length}
              className="px-3 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Period;
