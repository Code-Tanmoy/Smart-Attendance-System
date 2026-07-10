import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { backend, faceApi } from "../services/api";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaChalkboardTeacher,
  FaLayerGroup,
  FaCalendarAlt,
  FaArrowLeft,
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

        // 🟢 NEW: Map JS day index (0-6) to string names matching your DB
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

            // 🟢 UPDATED: Now requires the day to match AND the time to match
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
        // 🟢 NEW: Custom icon toast for Alumni
        toast("Welcome back, Alumni! (Attendance skipped)", { icon: "🎓" });
        return;
      }
      setRecognizedStudentName(matchedStudent.name);
    } else {
      setRecognizedStudentName("Unknown ID");
    }

    // 🟢 NEW: Fire a loading toast while connecting to the database
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
      // 🟢 NEW: Transform the loading toast into a success mark
      toast.success(res.data.message, { id: dbToast });
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to record.";
      setAttendanceMessage(errMsg);
      setMatchStatus("error");
      // 🟢 NEW: Transform the loading toast into an error mark
      toast.error(errMsg, { id: dbToast });
    }
  };

  const handleRecognize = async () => {
    if (isScanning) return;
    if (!selectedSubjectId) {
      // 🟢 NEW: Replaced the boring browser alert
      toast("You must select the active class session first!", { icon: "⚠️" });
      return;
    }

    setIsScanning(true);
    setMatchStatus("idle");
    setAttendanceMessage("Hold still...");
    setRecognizedName("Scanning...");
    setRecognizedStudentName("...");

    // 🟢 NEW: Fire the loading toast for the AI scanning process
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
          // 🟢 NEW: Dismiss the scanning toast since we found a face!
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
      // 🟢 NEW: Transform the scanning toast into an error
      toast.error("Face not recognized. Please try again.", { id: scanToast });
    }

    setIsScanning(false);
  };

  const currentSubject = mySubjects.find((s) => s._id === selectedSubjectId);

  // Renders a Holiday badge on weekends, or the scheduled days if not today
  const getSubjectStatus = (subject) => {
    const now = new Date();
    const today = now.getDay();

    // Check for weekends first!
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

    // 🟢 NEW: If it's not today, show the actual days it is scheduled!
    if (!activeDays.includes(todayName)) {
      // Formats ["Monday", "Wednesday"] into "MON, WED"
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[100px]"></div>
      </div>

      <div className="flex flex-col xl:flex-row gap-10 w-full max-w-7xl p-6 z-10 relative">
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

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-64 h-64 border-2 border-dashed rounded-3xl transition-colors duration-300 ${
                  isScanning
                    ? "border-blue-400 opacity-100"
                    : "border-white/30 opacity-50"
                }`}
              ></div>
            </div>

            {isScanning && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent w-full h-full animate-scan"></div>
            )}
          </div>
        </div>

        <div className="w-full xl:w-1/2 flex flex-col justify-center">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
              Smart{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Scanner
              </span>
            </h1>
            <Link
              to={userRole === "admin" ? "/dashboard" : "/teacherdashboard"}
              className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <FaArrowLeft /> Exit to Dashboard
            </Link>
          </div>

          <div className="mb-6 bg-slate-900/50 p-5 rounded-3xl border border-slate-800 backdrop-blur-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
              <label className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase">
                <FaChalkboardTeacher className="text-blue-400 text-sm" /> Class
                Session Configuration
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

            {currentSubject && (
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                    <FaLayerGroup />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {currentSubject.department} • {currentSubject.year}
                    </p>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      {currentSubject.startTime} - {currentSubject.endTime}
                    </p>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 border rounded-lg text-xs font-bold tracking-wide ${getSubjectStatus(currentSubject).color}`}
                >
                  {getSubjectStatus(currentSubject).text}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Identified Student
                </p>
                <h2
                  className={`text-2xl sm:text-3xl font-bold transition-colors duration-300 ${matchStatus === "success" ? "text-white" : "text-slate-600"}`}
                >
                  {recognizedStudentName}
                </h2>
              </div>
              {matchStatus === "success" ? (
                <FaCheckCircle className="text-4xl text-emerald-500" />
              ) : matchStatus === "error" ? (
                <FaExclamationTriangle className="text-4xl text-rose-500" />
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-sm">Status Message</span>
                <span
                  className={`font-bold text-right text-sm ${matchStatus === "success" ? "text-emerald-400" : matchStatus === "error" ? "text-rose-400" : "text-slate-500"}`}
                >
                  {attendanceMessage || "Ready to Scan"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRecognize}
            disabled={isScanning || !selectedSubjectId}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] ${
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
        </div>
      </div>
    </div>
  );
};

export default Front;
