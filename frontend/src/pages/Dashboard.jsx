import React, { useState, useEffect, useMemo } from "react";
import {
  FaUserGraduate,
  FaClipboardList,
  FaUsers,
  FaUniversity,
  FaChartBar,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { backend } from "../services/api";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filter State (Global Analytics)
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  // ⚡ QUICK SEARCH STATE
  const [quickUrn, setQuickUrn] = useState("");

  // ✍️ DIGITAL ROSTER STATE
  const [manualDept, setManualDept] = useState("All");
  const [manualSemester, setManualSemester] = useState("All");
  const [manualSubjectId, setManualSubjectId] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [rosterSelection, setRosterSelection] = useState({});

  const fetchData = async () => {
    try {
      const [attRes, stuRes, subRes] = await Promise.all([
        backend.get(`/api/attendance?_t=${Date.now()}`),
        backend.get(`/api/students?_t=${Date.now()}`),
        backend.get(`/api/subjects?_t=${Date.now()}`),
      ]);
      setAttendance(attRes.data);
      setStudents(stuRes.data);
      setSubjects(subRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // 📋 DIGITAL ROSTER LOGIC
  // ==========================================
  const filteredManualSubjects = subjects.filter((sub) => {
    const matchDept = manualDept === "All" || sub.department === manualDept;
    const matchSem =
      manualSemester === "All" || sub.semester === manualSemester;
    return matchDept && matchSem;
  });

  const currentClassStudents = useMemo(() => {
    if (manualDept === "All" || manualSemester === "All" || !manualSubjectId)
      return [];
    return students.filter(
      (s) =>
        s.department === manualDept &&
        s.semester === manualSemester &&
        (s.status === "Active" || !s.status),
    );
  }, [students, manualDept, manualSemester, manualSubjectId]);

  // Initialize roster to "Present" when class loads
  useEffect(() => {
    if (currentClassStudents.length > 0) {
      const initialRoster = {};
      currentClassStudents.forEach((s) => {
        initialRoster[s.urn] = true;
      });
      setRosterSelection(initialRoster);
    } else {
      setRosterSelection({});
    }
  }, [currentClassStudents]);

  const toggleStudentAttendance = (urn) => {
    setRosterSelection((prev) => ({
      ...prev,
      [urn]: !prev[urn],
    }));
  };

  const markAll = (status) => {
    const updated = {};
    currentClassStudents.forEach((s) => {
      updated[s.urn] = status;
    });
    setRosterSelection(updated);
  };

  const handleSubmitRoster = async () => {
    if (!manualSubjectId) {
      toast.error("Please select a Class Session.");
      return;
    }

    const selectedSub = subjects.find((s) => s._id === manualSubjectId);
    let recognizedTimestamp = new Date();

    if (selectedSub) {
      const dateToUse = manualDate || new Date().toISOString().split("T")[0];

      // 🟢 NEW: Safely get the local day name from the selected date
      const [year, month, day] = dateToUse.split("-");
      const selectedDateObj = new Date(year, month - 1, day);
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const selectedDayName = daysOfWeek[selectedDateObj.getDay()];

      const activeDays = Array.isArray(selectedSub.day)
        ? selectedSub.day
        : [selectedSub.day].filter(Boolean);

      // 🟢 NEW: Block submission if the class doesn't run on the selected day
      if (activeDays.length > 0 && !activeDays.includes(selectedDayName)) {
        toast.error(
          `${selectedSub.name} does not run on a ${selectedDayName}. Scheduled days: ${activeDays.join(", ")}`,
          { icon: "📅" },
        );
        return;
      }

      recognizedTimestamp = new Date(
        `${dateToUse}T${selectedSub.startTime}:00`,
      );

      if (recognizedTimestamp > new Date()) {
        toast.error(
          "You cannot mark attendance for a class that hasn't started yet!",
          { icon: "⏳" },
        );
        return;
      }
    }

    const presentUrns = Object.keys(rosterSelection).filter(
      (urn) => rosterSelection[urn],
    );

    if (presentUrns.length === 0) {
      toast.error("No students marked as present.");
      return;
    }

    const entryToast = toast.loading(
      `Marking ${presentUrns.length} students present...`,
    );

    try {
      // Send individual records dynamically so backend API remains intact
      await Promise.all(
        presentUrns.map((urn) =>
          backend.post("/api/periodwise-attendance", {
            urn,
            subjectId: manualSubjectId,
            recognizedAt: recognizedTimestamp.toISOString(),
          }),
        ),
      );

      toast.success("Attendance saved successfully!", { id: entryToast });
      setManualSubjectId(""); // reset to clear roster screen
      fetchData();
    } catch (err) {
      toast.error("Failed to mark some attendance records.", {
        id: entryToast,
      });
    }
  };

  // ==========================================
  // 🧠 CORE ANALYTICS ENGINE (Original Global Logic)
  // ==========================================
  const targetDate = selectedDate || new Date().toISOString().split("T")[0];

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchDept = selectedDept === "All" || s.department === selectedDept;
      const isActive = s.status === "Active" || !s.status;
      return matchDept && isActive;
    });
  }, [students, selectedDept]);

  const presentUrnsToday = useMemo(() => {
    const presentRecords = attendance.filter((log) => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return logDate === targetDate;
    });
    return new Set(presentRecords.map((log) => log.urn));
  }, [attendance, targetDate]);

  // TOP CARDS STATS
  const totalStudents = filteredStudents.length;
  let uniquePresentCount = 0;
  filteredStudents.forEach((s) => {
    if (presentUrnsToday.has(s.urn)) uniquePresentCount++;
  });
  const safeAbsent = Math.max(0, totalStudents - uniquePresentCount);
  const attendanceRate =
    totalStudents > 0
      ? Math.round((uniquePresentCount / totalStudents) * 100)
      : 0;

  // 📊 DYNAMIC CHART DATA (Drill-down logic)
  const dynamicChartData = useMemo(() => {
    if (selectedDept === "All") {
      // Show All Departments
      const depts = ["CSE", "ECE", "ME", "AI", "CS", "IT"];
      return depts.map((dept) => {
        const deptStudents = filteredStudents.filter(
          (s) => s.department === dept,
        );
        const total = deptStudents.length;
        if (total === 0)
          return {
            name: dept,
            percentage: 0,
            present: 0,
            total: 0,
            type: "Dept",
          };

        let present = 0;
        deptStudents.forEach((s) => {
          if (presentUrnsToday.has(s.urn)) present++;
        });
        return {
          name: dept,
          percentage: Math.round((present / total) * 100),
          present,
          total,
          type: "Dept",
        };
      });
    } else {
      // Drill-down: Show Semesters for the selected Department
      const sems = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
      return sems.map((sem) => {
        const semStudents = filteredStudents.filter((s) => s.semester === sem);
        const total = semStudents.length;
        if (total === 0)
          return {
            name: `${sem} Sem`,
            percentage: 0,
            present: 0,
            total: 0,
            type: "Sem",
          };

        let present = 0;
        semStudents.forEach((s) => {
          if (presentUrnsToday.has(s.urn)) present++;
        });
        return {
          name: `${sem} Sem`,
          percentage: Math.round((present / total) * 100),
          present,
          total,
          type: "Sem",
        };
      });
    }
  }, [filteredStudents, presentUrnsToday, selectedDept]);

  // 🟢 CONTEXT-AWARE TOOLTIP
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-sm min-w-[150px]">
          <p className="font-bold text-gray-800 border-b border-gray-50 pb-2 mb-2 uppercase tracking-wide flex justify-between">
            {label}
            {data.type === "Dept" && (
              <span className="text-gray-400 text-xs ml-2 normal-case">
                (Click to view sems)
              </span>
            )}
          </p>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 font-medium">Rate:</span>
            <span
              className={`font-bold ${data.percentage < 75 ? "text-rose-600" : "text-blue-600"}`}
            >
              {data.percentage}%
            </span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 font-medium">Present:</span>
            <span className="font-bold text-emerald-600">{data.present}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Total:</span>
            <span className="font-bold text-gray-800">{data.total}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // 🟢 NEW: Real-time search filter for the roster list
  const displayedStudents = useMemo(() => {
    if (!quickUrn.trim()) return currentClassStudents;

    const query = quickUrn.toLowerCase().trim();
    return currentClassStudents.filter(
      (s) =>
        s.urn.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query),
    );
  }, [currentClassStudents, quickUrn]);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            Analytics Hub
          </h1>
          <p className="text-gray-600 text-sm">
            {selectedDate
              ? `Statistics for ${selectedDate}`
              : "Real-time statistics for Today"}
          </p>
        </div>

        {/* Global Date & Dept Filters */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-3 text-gray-400 text-xs" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <FaUniversity className="absolute left-3 top-3 text-gray-400 text-xs" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* 📊 DYNAMIC STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                Active Students {selectedDept !== "All" && `(${selectedDept})`}
              </p>
              <h3 className="text-4xl font-bold mt-2">{totalStudents}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaUserGraduate className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                Present {selectedDate ? "On Date" : "Today"}
              </p>
              <h3 className="text-4xl font-bold mt-2">{uniquePresentCount}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaClipboardList className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium relative z-10">
            <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">
              {attendanceRate}% Rate
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                Absent {selectedDate ? "On Date" : "Today"}
              </p>
              <h3 className="text-4xl font-bold mt-2">{safeAbsent}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaUsers className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col xl:flex-row gap-6">
        {/* 📉 ANALYTICS CHART PANEL */}
        <div className="w-full xl:w-2/3 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-800 text-lg font-bold flex items-center gap-2">
                <FaChartBar className="text-blue-500" />
                {selectedDept === "All"
                  ? "Departmental Attendance"
                  : `${selectedDept} Semester Breakdown`}
              </h2>
              {selectedDept !== "All" && (
                <button
                  onClick={() => setSelectedDept("All")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  ← Back to All Depts
                </button>
              )}
            </div>

            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dynamicChartData}
                  margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                >
                  {/* ✨ SVG Gradients */}
                  <defs>
                    <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#60a5fa"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                    <linearGradient id="colorBad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#f87171"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: "#f9fafb" }}
                    content={<CustomTooltip />}
                  />

                  {/* 🚨 75% Danger Line */}
                  <ReferenceLine
                    y={75}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      position: "top",
                      value: "75% Minimum",
                      fill: "#ef4444",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  />

                  <Bar
                    dataKey="percentage"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                    onClick={(data) => {
                      if (data.type === "Dept") setSelectedDept(data.name); // Click to drill down
                    }}
                    style={{
                      cursor: selectedDept === "All" ? "pointer" : "default",
                    }}
                  >
                    {dynamicChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.percentage < 75
                            ? "url(#colorBad)"
                            : "url(#colorGood)"
                        }
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 📝 DIGITAL ROSTER FORM */}
        <div className="bg-white w-full xl:w-1/3 rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[600px] xl:h-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-gray-800 text-lg font-bold mb-1">
                Manual Entry Roster
              </h1>
              <p className="text-gray-400 text-xs">
                Select class to mark bulk attendance.
              </p>
            </div>
            {/* ⚡ CLEAR FILTERS BUTTON */}
            <button
              onClick={() => {
                setManualDept("All");
                setManualSemester("All");
                setManualSubjectId("");
                setQuickUrn("");
              }}
              className="text-[10px] uppercase font-bold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-lg transition-colors border border-gray-200 shadow-sm"
            >
              ✕ Clear Filters
            </button>
          </div>

          <div className="flex flex-col gap-3 flex-shrink-0">
            {/* Cascading Department & Semester Filters */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={manualDept}
                onChange={(e) => {
                  setManualDept(e.target.value);
                  setManualSubjectId("");
                }}
                className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
              >
                <option value="All">All Dept</option>
                {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={manualSemester}
                onChange={(e) => {
                  setManualSemester(e.target.value);
                  setManualSubjectId("");
                }}
                className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
              >
                <option value="All">All Sem</option>
                {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"].map(
                  (sem) => (
                    <option key={sem} value={sem}>
                      {sem} Sem
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Select Class Session (With Backward Auto-Selection) */}
            <select
              value={manualSubjectId}
              onChange={(e) => {
                const val = e.target.value;
                setManualSubjectId(val);
                // Backward Selection Logic
                if (val) {
                  const selected = subjects.find((s) => s._id === val);
                  if (selected) {
                    setManualDept(selected.department);
                    setManualSemester(selected.semester);
                  }
                }
              }}
              className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 disabled:opacity-50"
              disabled={filteredManualSubjects.length === 0}
            >
              <option value="">-- Choose Class --</option>
              {filteredManualSubjects.map((sub) => {
                // 🟢 NEW: Format the days into a short string like "[MON, WED]"
                const activeDays = Array.isArray(sub.day)
                  ? sub.day
                  : [sub.day].filter(Boolean);
                const daysString = activeDays
                  .map((d) => d.slice(0, 3).toUpperCase())
                  .join(", ");

                return (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} ({sub.department} - {sub.semester} Sem){" "}
                    {daysString && `[${daysString}]`}
                  </option>
                );
              })}
            </select>

            <input
              type="date"
              value={manualDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-500"
            />
          </div>

          {/* ⚡ URN SEARCH & MARK BAR */}
          {manualSubjectId && currentClassStudents.length > 0 && (
            <div className="mt-4 mb-1">
              <input
                type="text"
                value={quickUrn}
                onChange={(e) => setQuickUrn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && quickUrn.trim() !== "") {
                    const parsedUrn = quickUrn.trim();
                    const studentExists = currentClassStudents.some(
                      (s) => s.urn === parsedUrn,
                    );

                    if (studentExists) {
                      toggleStudentAttendance(parsedUrn); // Flips whatever their current status is
                      setQuickUrn(""); // Instantly clear input for the next URN
                    } else {
                      toast.error("URN not found in this class roster.", {
                        icon: "⚠️",
                        duration: 2000,
                      });
                    }
                  }
                }}
                placeholder="Search or Type Name/URN"
                className="w-full text-sm rounded-xl bg-white border-2 border-blue-100 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-gray-700 font-mono placeholder-gray-400 transition-all shadow-sm"
              />
            </div>
          )}

          {/* Student List View */}
          <div className="mt-4 flex-grow overflow-hidden flex flex-col border border-gray-100 rounded-xl bg-gray-50">
            {manualSubjectId && currentClassStudents.length > 0 ? (
              <>
                <div className="flex justify-between items-center p-2.5 border-b border-gray-200 bg-white text-xs font-semibold text-gray-500">
                  {/* 🟢 NEW: Shows filtered count vs total count */}
                  <span>
                    Students ({displayedStudents.length}/
                    {currentClassStudents.length})
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => markAll(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Mark All P
                    </button>
                    <button
                      onClick={() => markAll(false)}
                      className="text-rose-600 hover:underline"
                    >
                      Mark All A
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto p-2 flex flex-col gap-2 flex-grow custom-scrollbar">
                  {/* 🟢 NEW: Map over displayedStudents instead of currentClassStudents */}
                  {displayedStudents.length > 0 ? (
                    displayedStudents.map((s) => (
                      <div
                        key={s.urn}
                        onClick={() => toggleStudentAttendance(s.urn)}
                        className={`flex justify-between items-center p-2.5 rounded-lg cursor-pointer transition-colors border ${
                          rosterSelection[s.urn]
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {s.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {s.urn}
                          </p>
                        </div>
                        <div className="text-lg">
                          {rosterSelection[s.urn] ? (
                            <FaCheckCircle className="text-blue-500" />
                          ) : (
                            <FaTimesCircle className="text-gray-300" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-gray-400 p-6 italic">
                      No matching students found for "{quickUrn}"
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-sm text-gray-400 p-4 text-center">
                Select a class to view the student roster.
              </div>
            )}
          </div>

          <button
            onClick={handleSubmitRoster}
            disabled={!manualSubjectId || currentClassStudents.length === 0}
            className="w-full mt-4 flex-shrink-0 rounded-xl py-3 bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Attendance
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
