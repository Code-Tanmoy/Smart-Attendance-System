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
} from "react-icons/fa";
import { backend } from "../services/api";

const ManualEntry = () => {
  const [mySubjects, setMySubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [urn, setUrn] = useState("");
  const [manualDate, setManualDate] = useState(""); 

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
      // 1. Fetch and filter Subjects for this teacher
      const subRes = await backend.get("/api/subjects");
      const teacherClasses = subRes.data.filter(
        (sub) => sub.teacherId === teacherId,
      );
      teacherClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setMySubjects(teacherClasses);

      // Auto-select LIVE class
      const now = new Date();
      const currentStr =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0");
      const liveClass = teacherClasses.find(
        (sub) => currentStr >= sub.startTime && currentStr <= sub.endTime,
      );
      if (liveClass && !selectedSubjectId) setSelectedSubjectId(liveClass._id);

      // 2. Fetch and filter Logs for this teacher's classes ONLY (Today's logs)
      const logsRes = await backend.get("/api/periodwise-attendance");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId || !urn) {
      setMessage({
        text: "Please select a class and enter a URN.",
        type: "error",
      });
      return;
    }

    const selectedSub = mySubjects.find((s) => s._id === selectedSubjectId);
    let recognizedTimestamp = new Date();

    if (selectedSub) {
      const dateToUse = manualDate || new Date().toISOString().split("T")[0];
      recognizedTimestamp = new Date(
        `${dateToUse}T${selectedSub.startTime}:00`,
      );

      if (recognizedTimestamp > new Date()) {
        setMessage({
          text: "Error: Cannot mark attendance for a class that hasn't started yet!",
          type: "error",
        });
        return;
      }
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await backend.post("/api/periodwise-attendance", {
        urn: urn.trim(),
        subjectId: selectedSubjectId,
        recognizedAt: recognizedTimestamp.toISOString(), 
      });

      setMessage({
        text: res.data.message || "Attendance manually recorded!",
        type: "success",
      });
      setUrn("");
      fetchData();
    } catch (err) {
      setMessage({
        text:
          err.response?.data?.message ||
          "Failed to record attendance. Check URN.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentSubject = mySubjects.find((s) => s._id === selectedSubjectId);

  // 🟢 NEW: Filter logs based on the selected subject in the form
  const displayedLogs = useMemo(() => {
    if (!selectedSubjectId) return logs; // If no class selected, show all
    
    // Find the name of the currently selected subject to filter the logs
    const subjectName = currentSubject?.name;
    
    return logs.filter(log => log.period === subjectName);
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

      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaUserEdit className="text-amber-500" /> Manual Attendance Entry
          </h1>
          <p className="text-gray-500 mt-1">
            Override the scanner or log students without registered biometrics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: FORM */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    {mySubjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name} ({sub.startTime})
                      </option>
                    ))}
                  </select>
                </div>

                {currentSubject && (
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <FaLayerGroup />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase">
                        {currentSubject.department} • {currentSubject.year}
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
                  <p className="text-[10px] text-gray-400 mt-1">
                    Leave blank for today.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block">
                    Student URN
                  </label>
                  <input
                    required
                    type="text"
                    value={urn}
                    onChange={(e) => setUrn(e.target.value)}
                    placeholder="Ex: 276001"
                    className="w-full mt-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-gray-800"
                  />
                </div>

                {message.text && (
                  <div
                    className={`p-3 rounded-xl text-sm font-bold flex items-start gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
                  >
                    {message.type === "success" ? (
                      <FaCheckCircle className="mt-0.5 text-emerald-500" />
                    ) : (
                      <FaExclamationTriangle className="mt-0.5 text-rose-500" />
                    )}
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98] ${loading ? "bg-gray-400" : "bg-amber-500 hover:bg-amber-600"}`}
                >
                  {loading ? "Processing..." : "Mark as Present"}
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
                
                {/* 🟢 NEW: Visual indicator of what is being filtered */}
                {currentSubject && (
                  <div className="text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full flex items-center gap-1 border border-blue-100">
                    <FaFilter /> {currentSubject.name} Only
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Student URN</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Class Logged</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">
                        Time
                      </th>
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