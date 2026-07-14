import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserEdit,
  FaLayerGroup,
  FaHistory,
  FaFilter,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";
import { backend } from "../services/api";
import toast from "react-hot-toast";

const ManualEntry = () => {
  const [mySubjects, setMySubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [manualDate, setManualDate] = useState("");

  // New States for Digital Roster
  const [students, setStudents] = useState([]);
  const [rosterSelection, setRosterSelection] = useState({});
  const [quickUrn, setQuickUrn] = useState("");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();
  const teacherId = localStorage.getItem("teacherId");
  const userRole = localStorage.getItem("userRole");

  // 🛡️ SECURITY GUARD
  useEffect(() => {
    if (userRole !== "teacher" && userRole !== "admin") {
      navigate("/signin");
    }
  }, [userRole, navigate]);

  const fetchData = async () => {
    try {
      // Fetch Subjects, Logs, and Students concurrently
      const [subRes, logsRes, stuRes] = await Promise.all([
        backend.get("/api/subjects"),
        backend.get("/api/periodwise-attendance"),
        backend.get("/api/students"), // 🟢 NEW: Fetch all students
      ]);

      setStudents(stuRes.data);

      // 1. Filter Subjects for this teacher
      const teacherClasses = subRes.data.filter(
        (sub) => sub.teacherId === teacherId,
      );
      teacherClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setMySubjects(teacherClasses);

      // Auto-select LIVE class
      const now = new Date();
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const todayName = daysOfWeek[now.getDay()];
      const currentStr =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0");

      const liveClass = teacherClasses.find((sub) => {
        const activeDays = Array.isArray(sub.day)
          ? sub.day
          : [sub.day].filter(Boolean);
        return (
          activeDays.includes(todayName) &&
          currentStr >= sub.startTime &&
          currentStr <= sub.endTime
        );
      });
      if (liveClass && !selectedSubjectId) setSelectedSubjectId(liveClass._id);

      // 2. Filter Logs for this teacher's classes ONLY (Today's logs)
      const todayStr = new Date().toISOString().split("T")[0];
      const teacherClassNames = teacherClasses.map((c) => c.name);

      const myRecentLogs = logsRes.data
        .filter((log) => {
          const logDate = new Date(log.recognizedAt)
            .toISOString()
            .split("T")[0];
          return teacherClassNames.includes(log.period) && logDate === todayStr;
        })
        .sort((a, b) => new Date(b.recognizedAt) - new Date(a.recognizedAt));

      setLogs(myRecentLogs);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teacherId]);

  const currentSubject = mySubjects.find((s) => s._id === selectedSubjectId);

  // ==========================================
  // 📋 DIGITAL ROSTER LOGIC
  // ==========================================
  const currentClassStudents = useMemo(() => {
    if (!currentSubject) return [];
    return students.filter(
      (s) =>
        s.department === currentSubject.department &&
        s.semester === currentSubject.semester &&
        (s.status === "Active" || !s.status),
    );
  }, [students, currentSubject]);

  // Initialize roster when class changes
  useEffect(() => {
    if (currentClassStudents.length > 0) {
      const initialRoster = {};
      currentClassStudents.forEach((s) => {
        initialRoster[s.urn] = true; // Default to present, or change to false if you prefer default absent
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

  const displayedStudents = useMemo(() => {
    if (!quickUrn.trim()) return currentClassStudents;
    const query = quickUrn.toLowerCase().trim();
    return currentClassStudents.filter(
      (s) =>
        s.urn.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query),
    );
  }, [currentClassStudents, quickUrn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setMessage({ text: "Please select a class.", type: "error" });
      return;
    }

    let recognizedTimestamp = new Date();

    if (currentSubject) {
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

      const activeDays = Array.isArray(currentSubject.day)
        ? currentSubject.day
        : [currentSubject.day].filter(Boolean);

      if (activeDays.length > 0 && !activeDays.includes(selectedDayName)) {
        setMessage({
          text: `Error: ${currentSubject.name} does not run on a ${selectedDayName}. Scheduled days: ${activeDays.join(", ")}`,
          type: "error",
        });
        return;
      }

      recognizedTimestamp = new Date(
        `${dateToUse}T${currentSubject.startTime}:00`,
      );

      if (recognizedTimestamp > new Date()) {
        setMessage({
          text: "Error: Cannot mark attendance for a class that hasn't started yet!",
          type: "error",
        });
        return;
      }
    }

    const presentUrns = Object.keys(rosterSelection).filter(
      (urn) => rosterSelection[urn],
    );

    if (presentUrns.length === 0) {
      setMessage({ text: "No students marked as present.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });
    const entryToast = toast.loading(
      `Marking ${presentUrns.length} students present...`,
    );

    try {
      // 🟢 NEW: Process all selected students simultaneously
      await Promise.all(
        presentUrns.map((urn) =>
          backend.post("/api/periodwise-attendance", {
            urn,
            subjectId: selectedSubjectId,
            recognizedAt: recognizedTimestamp.toISOString(),
          }),
        ),
      );

      toast.success("Attendance saved successfully!", { id: entryToast });
      setMessage({
        text: `Successfully logged ${presentUrns.length} students.`,
        type: "success",
      });
      fetchData(); // Refresh the log table
    } catch (err) {
      toast.error("Failed to mark some attendance records.", {
        id: entryToast,
      });
      setMessage({
        text: "Failed to record some attendance. Check connection.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayedLogs = useMemo(() => {
    if (!selectedSubjectId) return logs;
    const subjectName = currentSubject?.name;
    return logs.filter((log) => log.period === subjectName);
  }, [logs, selectedSubjectId, currentSubject]);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center mb-6 shadow-sm">
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

      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaUserEdit className="text-amber-500" /> Digital Class Roster
          </h1>
          <p className="text-gray-500 mt-1">
            Quickly bulk-mark student attendance for your scheduled classes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: DIGITAL ROSTER FORM */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col h-full space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Target Class
                  </label>
                  <select
                    required
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold text-sm"
                  >
                    <option value="">-- Select Class --</option>
                    {mySubjects.map((sub) => {
                      const activeDays = Array.isArray(sub.day)
                        ? sub.day
                        : [sub.day].filter(Boolean);
                      const daysString = activeDays
                        .map((d) => d.slice(0, 3).toUpperCase())
                        .join(", ");
                      return (
                        <option key={sub._id} value={sub._id}>
                          {sub.name} ({sub.startTime}){" "}
                          {daysString && `[${daysString}]`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {currentSubject && (
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <FaLayerGroup />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase">
                        {currentSubject.department} • Sem{" "}
                        {currentSubject.semester}
                      </p>
                      <p className="text-xs text-blue-800 font-bold">
                        {currentSubject.startTime} - {currentSubject.endTime}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">
                    Choose Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full mt-1 text-sm rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-500"
                  />
                </div>

                {/* 🟢 NEW: INTERACTIVE STUDENT LIST */}
                {currentSubject && currentClassStudents.length > 0 && (
                  <div className="flex-grow flex flex-col min-h-0 border border-gray-200 rounded-xl bg-gray-50/50 mt-2">
                    <div className="p-2 border-b border-gray-200 relative">
                      <FaSearch className="absolute left-4 top-4 text-gray-400 text-sm" />
                      <input
                        type="text"
                        value={quickUrn}
                        onChange={(e) => setQuickUrn(e.target.value)}
                        placeholder="Search Name or URN..."
                        className="w-full text-sm rounded-lg bg-white border border-gray-200 pl-8 pr-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-100/50 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      <span>
                        Students ({displayedStudents.length}/
                        {currentClassStudents.length})
                      </span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => markAll(true)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Mark P
                        </button>
                        <button
                          type="button"
                          onClick={() => markAll(false)}
                          className="text-rose-600 hover:text-rose-800"
                        >
                          Mark A
                        </button>
                      </div>
                    </div>

                    <div className="overflow-y-auto p-2 flex flex-col gap-1 flex-grow custom-scrollbar">
                      {displayedStudents.length > 0 ? (
                        displayedStudents.map((s) => (
                          <div
                            key={s.urn}
                            onClick={() => toggleStudentAttendance(s.urn)}
                            className={`flex justify-between items-center p-2.5 rounded-lg cursor-pointer transition-all border ${rosterSelection[s.urn] ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                          >
                            <div>
                              <p
                                className={`text-sm font-bold ${rosterSelection[s.urn] ? "text-blue-900" : "text-gray-800"}`}
                              >
                                {s.name}
                              </p>
                              <p
                                className={`text-[10px] font-mono mt-0.5 ${rosterSelection[s.urn] ? "text-blue-500" : "text-gray-500"}`}
                              >
                                {s.urn}
                              </p>
                            </div>
                            <div className="text-lg">
                              {rosterSelection[s.urn] ? (
                                <FaCheckCircle className="text-blue-600" />
                              ) : (
                                <FaTimesCircle className="text-gray-200" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-gray-400 p-4">
                          No matching students found.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {message.text && (
                  <div
                    className={`p-3 rounded-xl text-sm font-bold flex items-start gap-2 flex-shrink-0 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
                  >
                    {message.type === "success" ? (
                      <FaCheckCircle className="mt-0.5" />
                    ) : (
                      <FaExclamationTriangle className="mt-0.5" />
                    )}
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !selectedSubjectId ||
                    currentClassStudents.length === 0
                  }
                  className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-all flex-shrink-0 ${loading || !selectedSubjectId ? "bg-gray-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 active:scale-[0.98]"}`}
                >
                  {loading ? "Processing..." : "Save Bulk Attendance"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: TODAY's LOGS */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaHistory className="text-blue-500" /> Today's Logbook
                </h2>

                {currentSubject && (
                  <div className="text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full flex items-center gap-1 border border-blue-100">
                    <FaFilter /> {currentSubject.name} Only
                  </div>
                )}
              </div>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar border border-gray-100 rounded-xl">
                <table className="min-w-full text-left text-sm relative">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3">Student URN</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Class Logged</th>
                      <th className="px-4 py-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedLogs.length > 0 ? (
                      displayedLogs.map((log, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono font-bold text-gray-700">
                            {log.urn}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {log.name || "Unknown"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs font-bold">
                              {log.period}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500 text-xs">
                            {new Date(log.recognizedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-10 text-gray-400 italic"
                        >
                          {selectedSubjectId
                            ? `No attendance recorded for ${currentSubject?.name} today.`
                            : "No attendance recorded for your classes today."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualEntry;
