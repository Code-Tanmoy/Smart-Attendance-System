import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { backend, faceApi } from "../services/api";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaChalkboardTeacher,
  FaLayerGroup,
  FaCalendarAlt,
  FaArrowLeft,
  FaCamera,
} from "react-icons/fa";

const Front = () => {
  const [recognizedName, setRecognizedName] = useState("Scan to verify");
  const [recognizedStudentName, setRecognizedStudentName] = useState(
    "Waiting for face...",
  );
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [students, setStudents] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [matchStatus, setMatchStatus] = useState("idle");

  const [mySubjects, setMySubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // 🛡️ SECURITY GUARD
  const userRole = localStorage.getItem("userRole");
  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    // If a student tries to access this, kick them out
    if (userRole !== "teacher" && userRole !== "admin") {
      navigate("/signin");
    }
  }, [userRole, navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await backend.get("/api/students");
        setStudents(response.data);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    const fetchSubjectsAndAutoSelect = async () => {
      try {
        const res = await backend.get("/api/subjects");

        // 1. Filter classes to ONLY show this teacher's classes
        const teacherClasses = res.data.filter(
          (sub) => sub.teacherId === teacherId,
        );

        // Sort by time
        teacherClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setMySubjects(teacherClasses);

        // SMART AUTO-SELECT: Find the class that is happening RIGHT NOW
        const now = new Date();
        const today = now.getDay(); // Get the day of the week

        let liveClass = undefined;

        // 🟢 Map JS day index (0-6) to string names matching your DB
        const daysOfWeek = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const todayName = daysOfWeek[today];

        // ONLY search for a live class if it's NOT Sunday (0) and NOT Saturday (6)
        if (today !== 0 && today !== 6) {
          const currentStr =
            now.getHours().toString().padStart(2, "0") +
            ":" +
            now.getMinutes().toString().padStart(2, "0");

          liveClass = teacherClasses.find((sub) => {
            // Safely handle both new array format and old string format
            const activeDays = Array.isArray(sub.day) ? sub.day : [sub.day];

            // 🟢 Requires the day to match AND the time to match
            return (
              activeDays.includes(todayName) &&
              currentStr >= sub.startTime &&
              currentStr <= sub.endTime
            );
          });
        }

        if (liveClass) {
          setSelectedSubjectId(liveClass._id);
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
      }
    };

    fetchStudents();
    fetchSubjectsAndAutoSelect();
  }, [teacherId]);

  // Camera Setup
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
        toast.error("Camera access denied or unavailable.");
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
      toast.error("Please Select a Class First!");
      return;
    }

    setRecognizedName(urn);

    const matchedStudent = students.find((student) => student.urn === urn);
    if (matchedStudent) {
      if (matchedStudent.status === "Graduated") {
        setRecognizedStudentName(`${matchedStudent.name} 🎓`);
        setAttendanceMessage("Welcome back, Alumni! (Attendance skipped)");
        setMatchStatus("success");
        toast("Welcome back, Alumni! (Attendance skipped)", { icon: "🎓" });
        return;
      }
      setRecognizedStudentName(matchedStudent.name);
    } else {
      setRecognizedStudentName("Unknown ID");
    }

    const dbToast = toast.loading(
      `Recording attendance for ${matchedStudent ? matchedStudent.name : urn}...`,
    );

    try {
      const res = await backend.post("/api/periodwise-attendance", {
        urn,
        subjectId: selectedSubjectId,
        recognizedAt: new Date().toISOString(),
      });

      setAttendanceMessage(res.data.message);
      setMatchStatus("success");
      toast.success(res.data.message, { id: dbToast });
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to record.";
      setAttendanceMessage(errMsg);
      setMatchStatus("error");
      toast.error(errMsg, { id: dbToast });
    }
  };

  const handleRecognize = async () => {
    if (isScanning) return;
    if (!selectedSubjectId) {
      toast("You must select the active class session first!", { icon: "⚠️" });
      return;
    }

    setIsScanning(true);
    setMatchStatus("idle");
    setAttendanceMessage("Hold still...");
    setRecognizedName("Scanning...");
    setRecognizedStudentName("...");

    const scanToast = toast.loading("Analyzing facial biometrics...");

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
          toast.dismiss(scanToast);
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
      toast.error("Face not recognized. Please try again.", { id: scanToast });
    }

    setIsScanning(false);
  };

  const currentSubject = mySubjects.find((s) => s._id === selectedSubjectId);

  // Renders a Holiday badge on weekends, or the scheduled days if not today
  const getSubjectStatus = (subject) => {
    const now = new Date();
    const today = now.getDay();

    if (today === 0 || today === 6) {
      return {
        text: "🏖️ HOLIDAY",
        color: "text-slate-400 bg-slate-900/50 border-slate-800",
      };
    }

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayName = daysOfWeek[today];
    const activeDays = Array.isArray(subject.day) ? subject.day : [subject.day];

    if (!activeDays.includes(todayName)) {
      const formattedDays = activeDays
        .map((d) => d.slice(0, 3).toUpperCase())
        .join(", ");

      return {
        text: `📅 ${formattedDays}`,
        color: "text-slate-500 bg-slate-900/50 border-slate-800",
      };
    }

    const currentStr =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    if (currentStr < subject.startTime)
      return {
        text: "⏳ UPCOMING",
        color: "text-amber-400 bg-amber-950/40 border-amber-900/50",
      };
    if (currentStr > subject.endTime)
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
    <div className="min-h-screen w-full bg-[#0a0a0a] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[120px]"></div>
      </div>

      {/* Sticky mobile-friendly header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#0a0a0a]/70 border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400">
              Attendance Terminal
            </p>
            <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
              Smart{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Scanner
              </span>
            </h1>
          </div>
          <Link
            to={userRole === "admin" ? "/dashboard" : "/teacherdashboard"}
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 px-3 sm:px-4 py-2 rounded-xl transition-colors"
          >
            <FaArrowLeft className="text-xs" />
            <span className="hidden sm:inline">Exit to Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
          {/* Camera panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center"
          >
            <div
              className={`relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 transition-colors duration-500 ${
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
                className="w-full h-full object-cover transform scale-x-[-1] bg-slate-950"
              />
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                className="hidden"
              ></canvas>

              {/* Corner-bracket focus frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-52 sm:w-64 sm:h-64">
                  {[
                    "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
                    "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
                    "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
                    "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
                  ].map((cls, idx) => (
                    <div
                      key={idx}
                      className={`absolute w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-300 ${cls} ${
                        isScanning ? "border-blue-400" : "border-white/40"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {isScanning && (
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: "100%" }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-blue-500/25 to-transparent"
                ></motion.div>
              )}

              {/* Status chip */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <FaCamera
                  className={`text-xs ${isScanning ? "text-blue-400" : "text-slate-400"}`}
                />
                <span className="text-[11px] font-semibold text-slate-200">
                  {isScanning ? "Live · Scanning" : "Live"}
                </span>
              </div>
            </div>

            <button
              onClick={handleRecognize}
              disabled={isScanning || !selectedSubjectId}
              className={`mt-5 w-full py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all transform active:scale-[0.98] ${
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
          </motion.div>

          {/* Right column: session config + result */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full flex flex-col gap-5"
          >
            {/* Session Config */}
            <div className="bg-slate-900/50 p-5 rounded-3xl border border-slate-800 backdrop-blur-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <label className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wide">
                  <FaChalkboardTeacher className="text-blue-400 text-sm" />
                  Class Session Configuration
                </label>
              </div>

              <div className="relative">
                <FaCalendarAlt className="absolute left-4 top-3.5 text-slate-500 text-sm" />
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 pl-10 pr-10 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-sm"
                >
                  <option value="">-- Select Your Class to Start --</option>
                  {mySubjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.department} • {sub.semester} Sem)
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-4 text-slate-500 pointer-events-none text-xs">
                  ▼
                </div>
              </div>

              <AnimatePresence mode="wait">
                {currentSubject && (
                  <motion.div
                    key={currentSubject._id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          <FaLayerGroup />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {currentSubject.department} • {currentSubject.year}
                          </p>
                          <p className="text-xs text-slate-300 font-mono mt-0.5">
                            {currentSubject.startTime} -{" "}
                            {currentSubject.endTime}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1.5 border rounded-lg text-xs font-bold tracking-wide shrink-0 ${getSubjectStatus(currentSubject).color}`}
                      >
                        {getSubjectStatus(currentSubject).text}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Result panel */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Identified Student
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={recognizedStudentName}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={`text-2xl sm:text-3xl font-bold ${
                        matchStatus === "success"
                          ? "text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {recognizedStudentName}
                    </motion.h2>
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  {matchStatus === "success" ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <FaCheckCircle className="text-4xl text-emerald-500" />
                    </motion.div>
                  ) : matchStatus === "error" ? (
                    <motion.div
                      key="error"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <FaExclamationTriangle className="text-4xl text-rose-500" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Front;
