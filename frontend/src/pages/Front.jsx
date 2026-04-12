import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { backend, faceApi } from "../services/api";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserAstronaut,
  FaChalkboardTeacher,
  FaLayerGroup,
  FaFilter,
  FaCalendarAlt,
} from "react-icons/fa";

const Front = () => {
  const [recognizedName, setRecognizedName] = useState("Scan to verify");
  const [recognizedStudentName, setRecognizedStudentName] = useState(
    "Waiting for face...",
  );
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [students, setStudents] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [matchStatus, setMatchStatus] = useState("idle"); // idle, success, error

  // 🟢 Session & Filter State
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const userRole = localStorage.getItem("userRole");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Determine button destination and text dynamically
  let portalLink = "/signin";
  let portalText = "Portal Login";

  if (userRole === "admin") {
    portalLink = "/dashboard";
    portalText = "Admin Dashboard";
  } else if (userRole === "student") {
    portalLink = "/student-dashboard";
    portalText = "Student Portal";
  }

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await backend.get("/api/students");
        setStudents(response.data);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    const fetchSubjects = async () => {
      try {
        const res = await backend.get("/api/subjects");
        setAvailableSubjects(res.data);
      } catch (err) {
        console.error("Error fetching subjects:", err);
      }
    };

    fetchStudents();
    fetchSubjects();
  }, []);

  // Camera Logic
  useEffect(() => {
    let stream;
    const getCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera error:", error);
      }
    };
    getCamera();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const markAttendance = async (urn) => {
    if (!selectedSubjectId) {
      setAttendanceMessage("Please Select a Class First!");
      setMatchStatus("error");
      return;
    }

    setRecognizedName(urn);

    const matchedStudent = students.find((student) => student.urn === urn);
    if (matchedStudent) {
      setRecognizedStudentName(matchedStudent.name);
    } else {
      setRecognizedStudentName("Unknown ID");
    }

    try {
      const res = await backend.post("/api/periodwise-attendance", {
        urn,
        subjectId: selectedSubjectId,
        recognizedAt: new Date().toISOString(),
      });

      setAttendanceMessage(res.data.message);
      setMatchStatus("success");
    } catch (err) {
      setAttendanceMessage(err.response?.data?.message || "Failed to record.");
      setMatchStatus("error");
    }
  };

  const handleRecognize = async () => {
    if (isScanning) return;
    if (!selectedSubjectId) {
      alert("⚠️ You must select the active class session first!");
      return;
    }

    setIsScanning(true);
    setMatchStatus("idle");
    setAttendanceMessage("Hold still...");
    setRecognizedName("Scanning...");
    setRecognizedStudentName("...");

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    let matchFound = false;

    for (let i = 0; i < 5; i++) {
      if (matchFound) break;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");

      try {
        const response = await faceApi.post("/recognize", { image: imageData });
        const urn = response.data.urn;
        if (
          urn &&
          urn !== "Unknown" &&
          urn !== "No face detected" &&
          urn !== "No trained data"
        ) {
          matchFound = true;
          await markAttendance(urn);
          break;
        }
      } catch (err) {
        console.warn(`Frame ${i + 1} check failed.`);
      }

      if (i < 4 && !matchFound) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    if (!matchFound) {
      setAttendanceMessage("Face not recognized.");
      setRecognizedName("Unknown");
      setRecognizedStudentName("Try Again");
      setMatchStatus("error");
    }

    setIsScanning(false);
  };

  // 🟢 SMART LOGIC: Cascading Filters & Sorting
  const filteredSubjects = availableSubjects
    .filter((sub) => {
      const matchDept = filterDept === "All" || sub.department === filterDept;
      const matchYear = filterYear === "All" || sub.year === filterYear;
      return matchDept && matchYear;
    })
    .sort((a, b) => {
      // 1st Priority: Sort by Semester (e.g., "5th" before "6th")
      if (a.semester !== b.semester)
        return a.semester.localeCompare(b.semester);

      // 2nd Priority: Sort Alphabetically by Subject Name (A-Z)
      return a.name.localeCompare(b.name);
    });

  const currentSubject = availableSubjects.find(
    (s) => s._id === selectedSubjectId,
  );

  // 🟢 SMART LOGIC: Real-Time Status Checker
  const getSubjectStatus = (startTime, endTime) => {
    const now = new Date();
    const currentStr =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    if (currentStr < startTime)
      return {
        text: "⏳ UPCOMING",
        color: "text-amber-400 bg-amber-950/40 border-amber-900/50",
      };
    if (currentStr > endTime)
      return {
        text: "🔴 ENDED",
        color: "text-rose-400 bg-rose-950/40 border-rose-900/50",
      };
    return {
      text: "🟢 LIVE NOW",
      color:
        "text-emerald-400 bg-emerald-950/40 border-emerald-900/50 animate-pulse",
    };
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Gradient Mesh */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[100px]"></div>
      </div>

      <div className="flex flex-col xl:flex-row gap-10 w-full max-w-7xl p-6 z-10 relative">
        {/* 📹 LEFT: Camera Feed */}
        <div className="w-full xl:w-1/2 flex items-center justify-center">
          <div
            className={`relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-500 ${
              matchStatus === "success"
                ? "border-emerald-500 shadow-emerald-500/20"
                : matchStatus === "error"
                  ? "border-rose-500 shadow-rose-500/20"
                  : "border-slate-800"
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="hidden"
            ></canvas>

            {/* Face Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-64 h-64 border-2 border-dashed rounded-3xl transition-colors duration-300 ${
                  isScanning
                    ? "border-blue-400 opacity-100"
                    : "border-white/30 opacity-50"
                }`}
              ></div>
            </div>

            {/* Scanning Effect */}
            {isScanning && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent w-full h-full animate-scan"></div>
            )}
          </div>
        </div>

        {/* 📝 RIGHT: Info Panel */}
        <div className="w-full xl:w-1/2 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
              Smart{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Attendance
              </span>
            </h1>
          </div>

          {/* 🟢 TARGET CLASS CONFIGURATOR */}
          <div className="mb-6 bg-slate-900/50 p-5 rounded-3xl border border-slate-800 backdrop-blur-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
              <label className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase">
                <FaChalkboardTeacher className="text-blue-400 text-sm" /> Target
                Class Configuration
              </label>

              {/* 🟢 NEW: 1-Click Reset Button */}
              {(filterDept !== "All" ||
                filterYear !== "All" ||
                selectedSubjectId !== "") && (
                <button
                  onClick={() => {
                    setFilterDept("All");
                    setFilterYear("All");
                    setSelectedSubjectId("");
                  }}
                  className="text-[10px] bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 px-2 py-1 rounded transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              {/* Dept Filter */}
              <div className="relative w-full sm:w-1/2">
                <FaFilter className="absolute left-3 top-3.5 text-slate-500 text-xs" />
                <select
                  value={filterDept}
                  onChange={(e) => {
                    setFilterDept(e.target.value);
                    setSelectedSubjectId("");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 pl-8 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm font-medium"
                >
                  <option value="All">All Departments</option>
                  {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="relative w-full sm:w-1/2">
                <FaCalendarAlt className="absolute left-3 top-3.5 text-slate-500 text-xs" />
                <select
                  value={filterYear}
                  onChange={(e) => {
                    setFilterYear(e.target.value);
                    setSelectedSubjectId("");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 pl-8 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm font-medium"
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

            {/* Subject Dropdown */}
            <div className="relative">
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  const newSubjectId = e.target.value;
                  setSelectedSubjectId(newSubjectId);

                  // 🟢 NEW: Auto-fill Dept and Year if a subject is picked directly
                  if (newSubjectId) {
                    const matchedSub = availableSubjects.find(
                      (s) => s._id === newSubjectId,
                    );
                    if (matchedSub) {
                      setFilterDept(matchedSub.department);
                      setFilterYear(matchedSub.year);
                    }
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 pl-4 pr-10 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-sm"
              >
                <option value="">-- Select Target Class to Start --</option>
                {filteredSubjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} ({sub.semester} Sem)
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-4 text-slate-500 pointer-events-none text-xs">
                ▼
              </div>
            </div>

            {/* Dynamic Clock Indicator */}
            {currentSubject && (
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                    <FaLayerGroup />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {currentSubject.teacher}
                    </p>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      {currentSubject.startTime} - {currentSubject.endTime}
                    </p>
                  </div>
                </div>

                {/* The dynamic status badge */}
                <div
                  className={`px-3 py-1.5 border rounded-lg text-xs font-bold tracking-wide ${getSubjectStatus(currentSubject.startTime, currentSubject.endTime).color}`}
                >
                  {
                    getSubjectStatus(
                      currentSubject.startTime,
                      currentSubject.endTime,
                    ).text
                  }
                </div>
              </div>
            )}
          </div>

          {/* Status Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Identified Student
                </p>
                <h2
                  className={`text-2xl sm:text-3xl font-bold transition-colors duration-300 ${
                    matchStatus === "success" ? "text-white" : "text-slate-600"
                  }`}
                >
                  {recognizedStudentName}
                </h2>
              </div>
              {matchStatus === "success" ? (
                <FaCheckCircle className="text-4xl text-emerald-500" />
              ) : matchStatus === "error" ? (
                <FaExclamationTriangle className="text-4xl text-rose-500" />
              ) : (
                <FaUserAstronaut className="text-4xl text-slate-700" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-sm">Status Message</span>
                <span
                  className={`font-bold text-right text-sm ${
                    matchStatus === "success"
                      ? "text-emerald-400"
                      : matchStatus === "error"
                        ? "text-rose-400"
                        : "text-slate-500"
                  }`}
                >
                  {attendanceMessage || "Ready to Scan"}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleRecognize}
              disabled={isScanning || !selectedSubjectId}
              className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] ${
                isScanning || !selectedSubjectId
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25 hover:brightness-110"
              }`}
            >
              {isScanning
                ? "Analyzing Face..."
                : !selectedSubjectId
                  ? "Select Class First"
                  : "Scan Face"}
            </button>

            {/* 🟢 SMART PORTAL BUTTON */}
            <Link to={portalLink}>
              <button className="px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white bg-transparent border border-slate-700 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                <FaUserAstronaut className="text-lg hidden sm:block" />
                {portalText}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Front;
