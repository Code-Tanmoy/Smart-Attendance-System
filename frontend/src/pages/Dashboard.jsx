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
  FaSearch,
  FaTimes,
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

  // Filter State
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");

  // Quick Search & Roster State
  const [quickUrn, setQuickUrn] = useState("");
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

  // Digital Roster Logic
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
    setRosterSelection((prev) => ({ ...prev, [urn]: !prev[urn] }));
  };

  const markAll = (status) => {
    const updated = {};
    currentClassStudents.forEach((s) => {
      updated[s.urn] = status;
    });
    setRosterSelection(updated);
  };

  const handleSubmitRoster = async () => {
    if (!manualSubjectId) return toast.error("Please select a Class Session.");
    const selectedSub = subjects.find((s) => s._id === manualSubjectId);
    let recognizedTimestamp = new Date();

    if (selectedSub) {
      const dateToUse = manualDate || new Date().toISOString().split("T")[0];
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

      if (activeDays.length > 0 && !activeDays.includes(selectedDayName)) {
        return toast.error(
          `${selectedSub.name} does not run on a ${selectedDayName}.`,
          { icon: "📅" },
        );
      }
      recognizedTimestamp = new Date(
        `${dateToUse}T${selectedSub.startTime}:00`,
      );
      if (recognizedTimestamp > new Date()) {
        return toast.error("Cannot mark attendance for a future class!", {
          icon: "⏳",
        });
      }
    }

    const presentUrns = Object.keys(rosterSelection).filter(
      (urn) => rosterSelection[urn],
    );
    if (presentUrns.length === 0)
      return toast.error("No students marked as present.");

    const entryToast = toast.loading(
      `Marking ${presentUrns.length} students present...`,
    );
    try {
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
      setManualSubjectId("");
      fetchData();
    } catch (err) {
      toast.error("Failed to mark some records.", { id: entryToast });
    }
  };

  // Analytics Engine
  const targetDate = selectedDate || new Date().toISOString().split("T")[0];

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        (selectedDept === "All" || s.department === selectedDept) &&
        (s.status === "Active" || !s.status),
    );
  }, [students, selectedDept]);

  const presentUrnsToday = useMemo(() => {
    const presentRecords = attendance.filter(
      (log) =>
        new Date(log.recognizedAt).toISOString().split("T")[0] === targetDate,
    );
    return new Set(presentRecords.map((log) => log.urn));
  }, [attendance, targetDate]);

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

  const dynamicChartData = useMemo(() => {
    if (selectedDept === "All") {
      return ["CSE", "ECE", "ME", "AI", "CS", "IT"].map((dept) => {
        const deptStudents = filteredStudents.filter(
          (s) => s.department === dept,
        );
        const total = deptStudents.length;
        let present = 0;
        deptStudents.forEach((s) => {
          if (presentUrnsToday.has(s.urn)) present++;
        });
        return {
          name: dept,
          percentage: total ? Math.round((present / total) * 100) : 0,
          present,
          total,
          type: "Dept",
        };
      });
    } else {
      return ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"].map(
        (sem) => {
          const semStudents = filteredStudents.filter(
            (s) => s.semester === sem,
          );
          const total = semStudents.length;
          let present = 0;
          semStudents.forEach((s) => {
            if (presentUrnsToday.has(s.urn)) present++;
          });
          return {
            name: `${sem} Sem`,
            percentage: total ? Math.round((present / total) * 100) : 0,
            present,
            total,
            type: "Sem",
          };
        },
      );
    }
  }, [filteredStudents, presentUrnsToday, selectedDept]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-[16px] shadow-xl border border-slate-100 text-sm min-w-[150px]">
          <p className="font-bold text-slate-800 border-b border-slate-100/60 pb-2 mb-2 uppercase tracking-wide flex justify-between">
            {label}
            {data.type === "Dept" && (
              <span className="text-slate-400 text-[10px] ml-2 normal-case flex items-center">
                (Click to view)
              </span>
            )}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-xs">Rate:</span>
              <span
                className={`font-bold ${data.percentage < 75 ? "text-rose-600" : "text-indigo-600"}`}
              >
                {data.percentage}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-xs">
                Present:
              </span>
              <span className="font-bold text-emerald-600">{data.present}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-xs">Total:</span>
              <span className="font-bold text-slate-800">{data.total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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
    <div className="max-w-7xl mx-auto space-y-8 relative z-10">
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Analytics Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {selectedDate
              ? `Statistics for ${selectedDate}`
              : "Real-time statistics for Today"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto bg-white/60 backdrop-blur-md p-2 rounded-[16px] shadow-sm border border-slate-200/60">
          <div className="relative w-full sm:w-auto">
            <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-200/80 rounded-[12px] text-sm text-slate-600 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 hover:border-slate-300"
            />
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-200/80"></div>
          <div className="relative w-full sm:w-auto">
            <FaUniversity className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white/50 border border-slate-200/80 rounded-[12px] text-sm text-slate-600 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 appearance-none hover:border-slate-300 cursor-pointer"
            >
              <option value="All">All Departments</option>
              {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DYNAMIC STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-xl shadow-indigo-200/50 border border-indigo-400/30 group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest mb-1.5 opacity-90">
                Active Students {selectedDept !== "All" && `(${selectedDept})`}
              </p>
              <h3 className="text-4xl font-extrabold tracking-tight">
                {totalStudents}
              </h3>
            </div>
            <div className="p-4 bg-white/10 rounded-[16px] backdrop-blur-md border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <FaUserGraduate className="text-2xl text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-400 to-teal-500 p-6 text-white shadow-xl shadow-emerald-200/50 border border-emerald-400/30 group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold text-emerald-50 uppercase tracking-widest mb-1.5 opacity-90">
                Present {selectedDate ? "On Date" : "Today"}
              </p>
              <h3 className="text-4xl font-extrabold tracking-tight">
                {uniquePresentCount}
              </h3>
            </div>
            <div className="p-4 bg-white/10 rounded-[16px] backdrop-blur-md border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <FaClipboardList className="text-2xl text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold relative z-10">
            <span className="bg-white/20 px-3 py-1.5 rounded-[8px] backdrop-blur-md border border-white/20 shadow-sm">
              {attendanceRate}% Attendance Rate
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-rose-400 to-pink-500 p-6 text-white shadow-xl shadow-rose-200/50 border border-rose-400/30 group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-1/2 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-8 -translate-y-1/2 pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold text-rose-100 uppercase tracking-widest mb-1.5 opacity-90">
                Absent {selectedDate ? "On Date" : "Today"}
              </p>
              <h3 className="text-4xl font-extrabold tracking-tight">
                {safeAbsent}
              </h3>
            </div>
            <div className="p-4 bg-white/10 rounded-[16px] backdrop-blur-md border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <FaUsers className="text-2xl text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col xl:flex-row gap-6 lg:gap-8">
        {/* ANALYTICS CHART PANEL */}
        <div className="w-full xl:w-[62%] flex flex-col">
          <div className="bg-white/80 backdrop-blur-sm rounded-[20px] shadow-sm border border-slate-200/60 p-6 h-full flex flex-col min-h-[420px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-slate-800 text-lg font-bold flex items-center gap-2 tracking-tight">
                <div className="p-2 bg-indigo-50 rounded-[10px] text-indigo-500">
                  <FaChartBar size={16} />
                </div>
                {selectedDept === "All"
                  ? "Departmental Overview"
                  : `${selectedDept} Semester Breakdown`}
              </h2>
              {selectedDept !== "All" && (
                <button
                  onClick={() => setSelectedDept("All")}
                  className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-[10px] hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                >
                  ← Back to All
                </button>
              )}
            </div>

            <div className="flex-grow w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dynamicChartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#818cf8"
                        stopOpacity={0.7}
                      />
                    </linearGradient>
                    <linearGradient id="colorBad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#fb7185"
                        stopOpacity={0.7}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
                    dy={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    content={<CustomTooltip />}
                  />
                  <ReferenceLine
                    y={75}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{
                      position: "insideTopLeft",
                      value: "75% Min",
                      fill: "#f43f5e",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    dataKey="percentage"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                    onClick={(data) => {
                      if (data.type === "Dept") setSelectedDept(data.name);
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

        {/* DIGITAL ROSTER FORM */}
        <div className="bg-white/80 backdrop-blur-sm w-full xl:w-[38%] rounded-[20px] shadow-sm border border-slate-200/60 p-6 flex flex-col h-[650px] xl:h-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-slate-800 text-lg font-bold mb-0.5 tracking-tight">
                Manual Roster
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                Select class to mark bulk attendance.
              </p>
            </div>
            <button
              onClick={() => {
                setManualDept("All");
                setManualSemester("All");
                setManualSubjectId("");
                setQuickUrn("");
              }}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 px-3 py-2 rounded-[10px] transition-all border border-slate-200 hover:border-rose-200 shadow-sm flex items-center gap-1.5"
            >
              <FaTimes /> Clear
            </button>
          </div>

          <div className="flex flex-col gap-3.5 flex-shrink-0">
            <div className="grid grid-cols-2 gap-3.5">
              <select
                value={manualDept}
                onChange={(e) => {
                  setManualDept(e.target.value);
                  setManualSubjectId("");
                }}
                className="w-full text-sm font-medium rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 px-4 py-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-700 transition-all appearance-none cursor-pointer"
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
                className="w-full text-sm font-medium rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 px-4 py-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-700 transition-all appearance-none cursor-pointer"
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

            <select
              value={manualSubjectId}
              onChange={(e) => {
                const val = e.target.value;
                setManualSubjectId(val);
                if (val) {
                  const selected = subjects.find((s) => s._id === val);
                  if (selected) {
                    setManualDept(selected.department);
                    setManualSemester(selected.semester);
                  }
                }
              }}
              disabled={filteredManualSubjects.length === 0}
              className="w-full text-sm font-medium rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 px-4 py-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-700 disabled:opacity-50 transition-all appearance-none cursor-pointer"
            >
              <option value="">-- Choose Class Session --</option>
              {filteredManualSubjects.map((sub) => {
                const activeDays = Array.isArray(sub.day)
                  ? sub.day
                  : [sub.day].filter(Boolean);
                const daysString = activeDays
                  .map((d) => d.slice(0, 3).toUpperCase())
                  .join(", ");
                return (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} ({sub.department} - {sub.semester}){" "}
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
              className="w-full text-sm font-medium rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 px-4 py-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-700 transition-all cursor-text"
            />
          </div>

          {manualSubjectId && currentClassStudents.length > 0 && (
            <div className="mt-5 mb-2 relative group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={quickUrn}
                onChange={(e) => setQuickUrn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && quickUrn.trim() !== "") {
                    const parsedUrn = quickUrn.trim();
                    if (currentClassStudents.some((s) => s.urn === parsedUrn)) {
                      toggleStudentAttendance(parsedUrn);
                      setQuickUrn("");
                    } else {
                      toast.error("URN not found.", {
                        icon: "⚠️",
                        duration: 2000,
                      });
                    }
                  }
                }}
                placeholder="Search Name or URN..."
                className="w-full text-sm font-medium rounded-[12px] bg-white border border-slate-200/80 pl-10 pr-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 transition-all shadow-sm hover:border-slate-300"
              />
            </div>
          )}

          <div className="mt-3 flex-grow overflow-hidden flex flex-col border border-slate-200/60 rounded-[16px] bg-slate-50/30">
            {manualSubjectId && currentClassStudents.length > 0 ? (
              <>
                <div className="flex justify-between items-center p-3.5 border-b border-slate-200/60 bg-slate-100/40 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>
                    Students ({displayedStudents.length}/
                    {currentClassStudents.length})
                  </span>
                  <div className="flex gap-4">
                    <button
                      onClick={() => markAll(true)}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Mark P
                    </button>
                    <button
                      onClick={() => markAll(false)}
                      className="text-rose-600 hover:text-rose-800 transition-colors"
                    >
                      Mark A
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto p-2 flex flex-col gap-2 flex-grow custom-scrollbar">
                  {displayedStudents.length > 0 ? (
                    displayedStudents.map((s) => (
                      <div
                        key={s.urn}
                        onClick={() => toggleStudentAttendance(s.urn)}
                        className={`flex justify-between items-center p-3.5 rounded-[12px] cursor-pointer transition-all duration-300 border ${rosterSelection[s.urn] ? "bg-indigo-50/80 border-indigo-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5"}`}
                      >
                        <div>
                          <p
                            className={`text-sm font-bold ${rosterSelection[s.urn] ? "text-indigo-900" : "text-slate-800"}`}
                          >
                            {s.name}
                          </p>
                          <p
                            className={`text-xs font-mono font-medium mt-0.5 ${rosterSelection[s.urn] ? "text-indigo-500" : "text-slate-400"}`}
                          >
                            {s.urn}
                          </p>
                        </div>
                        <div className="text-xl">
                          {rosterSelection[s.urn] ? (
                            <FaCheckCircle className="text-indigo-600 drop-shadow-sm" />
                          ) : (
                            <FaTimesCircle className="text-slate-200" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm font-medium text-slate-400 p-8">
                      No matching students found for "{quickUrn}"
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-sm font-medium text-slate-400 p-6 text-center">
                Select a class session to view the roster.
              </div>
            )}
          </div>

          <button
            onClick={handleSubmitRoster}
            disabled={!manualSubjectId || currentClassStudents.length === 0}
            className="w-full mt-5 flex-shrink-0 rounded-[12px] py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 font-bold text-white shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
          >
            Save Attendance Records
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
