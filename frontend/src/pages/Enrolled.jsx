import React, { useState, useEffect } from "react";
import {
  FaTrash,
  FaSearch,
  FaUser,
  FaIdCard,
  FaFilter,
  FaUniversity,
  FaLayerGroup,
  FaCalendarAlt,
} from "react-icons/fa";
import { backend, faceApi } from "../services/api";

const Enrolled = () => {
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // 🔍 HIERARCHY FILTERS
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, attendanceRes] = await Promise.all([
          backend.get("/api/students"),
          backend.get("/api/attendance"),
        ]);
        // Sort: Department -> Year -> Name
        const sorted = studentsRes.data.sort(
          (a, b) =>
            a.department.localeCompare(b.department) ||
            a.year.localeCompare(b.year) ||
            a.name.localeCompare(b.name),
        );
        setStudents(sorted);
        setAttendanceLogs(attendanceRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const todayDate = new Date().toISOString().split("T")[0];

  const getAttendanceStatus = (urn) => {
    const hasLogToday = attendanceLogs.some((log) => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return log.urn === urn && logDate === todayDate;
    });
    return hasLogToday ? "Present" : "Absent";
  };

  // 🔍 COMBINED FILTER LOGIC
  const filteredStudents = students
    .filter((student) => {
      const query = search.toLowerCase();

      // 1. Check Search Query
      const matchesSearch =
        student.name.toLowerCase().includes(query) ||
        student.urn.toLowerCase().includes(query);

      // 2. Check Hierarchy Filters
      const matchesDept =
        selectedDept === "All" || student.department === selectedDept;
      const matchesYear =
        selectedYear === "All" || student.year === selectedYear;

      return matchesSearch && matchesDept && matchesYear;
    })
    .sort((a, b) => {
      // 1st Priority: Sort by Year ("1st Year" before "2nd Year")
      if (a.year !== b.year) {
        return a.year.localeCompare(b.year);
      }

      // 2nd Priority: Sort by URN (Roll Number) numerically
      return a.urn.localeCompare(b.urn, undefined, { numeric: true });
    });

  const handleDelete = async (urn, name, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete ${name}? This removes ALL face data and attendance records.`,
      )
    )
      return;

    try {
      try {
        await faceApi.post("/delete", { urn });
      } catch (e) {
        console.warn("Face delete skipped");
      }
      await backend.delete(`/api/students/${urn}`);
      setStudents(students.filter((s) => s.urn !== urn));
      alert("Student deleted successfully.");
    } catch (err) {
      alert("Failed to delete student.");
    }
  };

  return (
    <>
      {/* 📄 MODAL: STUDENT DETAILS */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center gap-4 text-white">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                <p className="text-blue-100 text-sm font-mono opacity-90">
                  {selectedStudent.urn}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="ml-auto bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <FaUniversity className="text-blue-500 text-lg" />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">
                    Department
                  </p>
                  <p className="text-gray-700 font-bold">
                    {selectedStudent.department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <FaLayerGroup className="text-blue-500 text-lg" />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">
                    Year & Semester
                  </p>
                  <p className="text-gray-700 font-bold">
                    {selectedStudent.year} • {selectedStudent.semester} Sem
                  </p>
                </div>
              </div>
              <div className="pt-2 text-center">
                <p className="text-xs text-gray-400">
                  Enrolled on{" "}
                  {new Date(selectedStudent.enrolledAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📄 HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mt-1 flex items-center gap-2">
            Student Database
          </h1>
          <span className="text-gray-500 text-sm">
            Manage college enrollment hierarchy
          </span>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="relative">
            <FaUniversity className="absolute left-3 top-3 text-gray-400 text-xs" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="All">All Depts</option>
              {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-3 text-gray-400 text-xs" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="All">All Years</option>
              {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search Name / URN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 📋 TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">URN</th>
                <th className="px-6 py-4 font-semibold">Dept & Year</th>
                <th className="px-6 py-4 font-semibold">Semester</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const status = getAttendanceStatus(student.urn);
                  return (
                    <tr
                      key={student._id}
                      onClick={() => setSelectedStudent(student)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {student.name.charAt(0)}
                        </div>
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        {student.urn}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 mr-2">
                          {student.department}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {student.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {student.semester} Sem
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold border ${status === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) =>
                            handleDelete(student.urn, student.name, e)
                          }
                          className="text-gray-400 hover:text-red-600 p-2 transition"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    No students found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Enrolled;
