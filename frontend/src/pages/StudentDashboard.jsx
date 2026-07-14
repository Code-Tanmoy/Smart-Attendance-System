import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUserGraduate,
  FaClock,
  FaCalendarAlt,
  FaChartPie,
  FaSignOutAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCog,
  FaLock,
  FaUserEdit,
  FaPhone,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaExclamationCircle,
  FaChalkboardTeacher,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { backend } from "../services/api";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // SETTINGS DROPDOWN & MODAL STATES
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Password State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdData, setPwdData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [isPwdLoading, setIsPwdLoading] = useState(false);

  // Profile State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ email: "", phone: "" });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const urn = localStorage.getItem("studentUrn");
        if (!urn) {
          window.location.href = "/signin";
          return;
        }

        const res = await backend.get(
          `/api/students/me/${urn}?_t=${Date.now()}`,
        );
        setData(res.data);
      } catch (err) {
        console.error("Error fetching student data");
      } finally {
        setLoading(false);
      }
    };
    fetchMyData();

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    toast.loading("Logging out...", { duration: 1000 });
    try {
      await backend.post("/logout");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      localStorage.clear();
      navigate("/signin", { replace: true });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage("");
    setPwdError("");

    if (pwdData.newPassword !== pwdData.confirmPassword)
      return setPwdError("New passwords do not match.");
    if (pwdData.newPassword.length < 6)
      return setPwdError("Password must be at least 6 characters.");

    setIsPwdLoading(true);
    try {
      const res = await backend.put("/api/security/change-password", {
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword,
      });

      setPwdMessage(res.data.message);
      setPwdData({ currentPassword: "", newPassword: "", confirmPassword: "" });

      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPwdMessage("");
      }, 2000);
    } catch (err) {
      setPwdError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setIsPwdLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setIsProfileLoading(true);

    try {
      const res = await backend.put(
        "/api/students/me/update-profile",
        profileData,
      );
      setProfileMessage(res.data.message);

      setData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          email: profileData.email,
          phone: profileData.phone,
        },
      }));

      setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileMessage("");
      }, 2000);
    } catch (err) {
      setProfileError(
        err.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setIsProfileLoading(false);
    }
  };

  const openProfileModal = () => {
    setProfileData({ email: data.profile.email, phone: data.profile.phone });
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
        <div className="flex flex-col items-center gap-4 relative z-10 bg-white/80 backdrop-blur-xl p-8 rounded-[24px] shadow-2xl border border-white">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100/50"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-bold tracking-tight">
            Loading your portal...
          </p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-5 px-4 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center text-2xl shadow-sm">
          <FaExclamationTriangle />
        </div>
        <p className="text-slate-800 font-bold text-lg tracking-tight">
          Failed to load data. Please log in again.
        </p>
        <button
          onClick={handleLogout}
          className="px-8 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold rounded-[12px] shadow-lg shadow-rose-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all"
        >
          Log Out
        </button>
      </div>
    );

  const { profile, schedule, stats } = data;

  if (profile.status === "Graduated") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>

        <div className="bg-white/90 backdrop-blur-xl p-10 sm:p-12 rounded-[32px] shadow-2xl shadow-indigo-100 max-w-lg w-full border border-white relative z-10 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 mx-auto mb-6 rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <FaUserGraduate className="text-5xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">
            Congratulations, {profile.name}!
          </h1>
          <p className="text-slate-600 font-medium mb-6 text-lg">
            You have officially graduated from the {profile.department}{" "}
            department.
          </p>
          <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100 mb-8">
            <p className="text-sm text-slate-500 italic font-medium">
              Your academic records are permanently sealed and securely stored
              in the alumni database.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-10 py-4 bg-slate-800 text-white rounded-[16px] font-bold hover:bg-slate-900 transition-all duration-300 shadow-xl shadow-slate-300 active:scale-95"
          >
            Close Session
          </button>
        </div>
      </div>
    );
  }

  const checkIsLive = (subject) => {
    const today = new Date().getDay();
    if (today === 0 || today === 6) return false;

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
    const activeDays = Array.isArray(subject.day)
      ? subject.day
      : [subject.day].filter(Boolean);

    if (!activeDays.includes(todayName)) return false;

    const currentStr =
      currentTime.getHours().toString().padStart(2, "0") +
      ":" +
      currentTime.getMinutes().toString().padStart(2, "0");
    return currentStr >= subject.startTime && currentStr <= subject.endTime;
  };

  const getHeaderGradient = (percentage, totalPossible) => {
    if (totalPossible === 0)
      return "from-blue-600 via-indigo-600 to-indigo-700";
    if (percentage >= 75) return "from-emerald-500 via-emerald-600 to-teal-700";
    if (percentage >= 50) return "from-amber-500 via-amber-600 to-orange-700";
    return "from-rose-500 via-rose-600 to-red-700";
  };

  const renderAlertBanner = (percentage, totalPossible) => {
    if (totalPossible === 0) {
      return (
        <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/80 p-4 sm:p-5 rounded-[16px] flex items-start gap-4 shadow-sm mb-8 animate-in fade-in duration-300">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-[10px]">
            <FaCalendarAlt size={18} />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 tracking-tight">
              No classes held yet
            </h3>
            <p className="text-[13px] text-blue-700/90 font-medium mt-0.5">
              Your attendance will calculate once classes begin.
            </p>
          </div>
        </div>
      );
    }
    if (percentage >= 75) {
      return (
        <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/80 p-4 sm:p-5 rounded-[16px] flex items-start gap-4 shadow-sm mb-8 animate-in fade-in duration-300">
          <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-[10px]">
            <FaCheckCircle size={18} />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 tracking-tight">
              Attendance is on track
            </h3>
            <p className="text-[13px] text-emerald-700/90 font-medium mt-0.5">
              Great job! Keep attending classes to maintain your good standing.
            </p>
          </div>
        </div>
      );
    } else if (percentage >= 50) {
      return (
        <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/80 p-4 sm:p-5 rounded-[16px] flex items-start gap-4 shadow-sm mb-8 animate-in fade-in duration-300">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-[10px]">
            <FaExclamationTriangle size={18} />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 tracking-tight">
              Warning: Attendance below 75%
            </h3>
            <p className="text-[13px] text-amber-700/90 font-medium mt-0.5">
              Your attendance has dropped to {percentage}%. Please attend
              upcoming classes to recover your average.
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200/80 p-4 sm:p-5 rounded-[16px] flex items-start gap-4 shadow-sm mb-8 animate-in fade-in duration-300">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-[10px]">
            <FaExclamationTriangle size={18} />
          </div>
          <div>
            <h3 className="font-bold text-rose-900 tracking-tight">
              CRITICAL: Attendance below 50%
            </h3>
            <p className="text-[13px] text-rose-700/90 font-medium mt-0.5">
              It will be mathematically difficult to recover. Please contact
              your department head immediately.
            </p>
          </div>
        </div>
      );
    }
  };

  const inputClasses =
    "w-full pl-11 pr-4 py-3.5 rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm";
  const labelClasses =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1";
  const iconClasses =
    "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 relative selection:bg-indigo-100 font-sans text-slate-800 overflow-x-hidden">
      {/* Ambient Background Blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-[-5%] w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none z-0"></div>

      {/* 🚀 NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center mb-8 shadow-sm">
        <div className="font-bold text-xl text-slate-800 flex items-center gap-3 tracking-tight">
          <span className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200/50">
            <FaUserGraduate size={18} />
          </span>
          <span>
            Student <span className="text-indigo-600">Portal</span>
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-slate-50 text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all border border-slate-200/80 hover:border-indigo-200 hover:rotate-90 duration-300"
          >
            <FaCog size={18} />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              ></div>
              <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-[20px] shadow-2xl shadow-slate-300/50 border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100/80 mb-1 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-800 tracking-tight truncate">
                    {profile.name}
                  </p>
                  <p className="text-[11px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5 truncate">
                    {profile.urn}
                  </p>
                </div>
                <div className="px-2 py-1 space-y-0.5">
                  <button
                    onClick={openProfileModal}
                    className="w-full text-left px-4 py-2.5 rounded-[12px] text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors group"
                  >
                    <FaUserEdit className="text-slate-400 group-hover:text-indigo-500 transition-colors" />{" "}
                    Update Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsPasswordModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-[12px] text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors group"
                  >
                    <FaLock className="text-slate-400 group-hover:text-indigo-500 transition-colors" />{" "}
                    Change Password
                  </button>
                </div>
                <div className="border-t border-slate-100/80 mt-1 pt-1 px-2 pb-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 rounded-[12px] text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors font-bold group"
                  >
                    <FaSignOutAlt className="text-rose-400 group-hover:text-rose-500 transition-colors" />{" "}
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {renderAlertBanner(stats.overallPercentage, stats.totalPossible)}

        {/* 🎓 WELCOME HEADER */}
        <div
          className={`relative overflow-hidden bg-gradient-to-r ${getHeaderGradient(stats.overallPercentage, stats.totalPossible)} rounded-[24px] p-8 sm:p-10 text-white shadow-xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border border-white/10 transition-all duration-500`}
        >
          <div className="pointer-events-none absolute -top-20 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-20 left-1/4 w-72 h-72 bg-black/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm">
              Student Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
              Welcome back, {profile.name}!
            </h1>
            <p className="text-white/90 flex flex-wrap items-center gap-2 text-sm font-medium">
              <span className="font-bold bg-white/10 px-2 py-0.5 rounded-[6px]">
                {profile.urn}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/50"></span>
              {profile.department} Dept
              <span className="w-1 h-1 rounded-full bg-white/50"></span>
              {profile.year} ({profile.semester} Sem)
            </p>
          </div>
          <div className="relative z-10 text-left md:text-right bg-white/15 p-5 rounded-[20px] backdrop-blur-md border border-white/20 shadow-inner min-w-[160px]">
            <div className="text-[10px] text-white/90 font-bold uppercase tracking-widest mb-1">
              Overall Attendance
            </div>
            <div className="text-5xl font-black tabular-nums tracking-tighter">
              {stats.overallPercentage}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* TIMETABLE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-[10px]">
                <FaCalendarAlt size={16} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                My Master Timetable
              </h2>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-[24px] shadow-sm border border-slate-200/60">
              {schedule.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {schedule.map((sub, idx) => {
                    const isLive = checkIsLive(sub);
                    const activeDays = Array.isArray(sub.day)
                      ? sub.day
                      : [sub.day].filter(Boolean);
                    const daysString = activeDays
                      .map((d) => d.slice(0, 3).toUpperCase())
                      .join(", ");

                    return (
                      <div
                        key={idx}
                        className={`relative p-5 rounded-[20px] border transition-all duration-300 flex flex-col justify-between min-h-[160px] overflow-hidden hover:-translate-y-1 ${
                          isLive
                            ? "bg-gradient-to-br from-blue-50/90 to-white border-blue-200 ring-4 ring-blue-500/10 shadow-lg shadow-blue-100/50 z-10"
                            : "bg-slate-50/50 hover:bg-white border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300"
                        }`}
                      >
                        {isLive && (
                          <div className="absolute top-0 right-0 flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-bl-[16px] shadow-sm uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>{" "}
                            LIVE NOW
                          </div>
                        )}

                        <div>
                          <h3
                            className={`font-bold text-[17px] tracking-tight mb-1.5 pr-16 ${isLive ? "text-blue-700" : "text-slate-800"}`}
                          >
                            {sub.name}
                          </h3>
                          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mb-1 w-fit bg-white border border-slate-100/80 px-2 py-0.5 rounded-[6px] shadow-sm">
                            <FaChalkboardTeacher className="text-slate-400" />{" "}
                            {sub.teacher}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mb-4 pl-1">
                            <FaPhone size={9} />{" "}
                            {sub.teacherPhone || "Contact hidden"}
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1.5 w-fit text-[10px] text-indigo-600 font-bold mb-4 uppercase tracking-widest bg-indigo-50 border border-indigo-100/60 px-2.5 py-1 rounded-[8px] shadow-sm">
                          <FaCalendarAlt size={10} /> {daysString}
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100/80">
                          <div
                            className={`w-fit inline-flex items-center gap-2 border px-3 py-1.5 rounded-[10px] text-xs font-bold shadow-sm ${
                              isLive
                                ? "bg-blue-100/50 border-blue-200 text-blue-700"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <FaClock
                              className={
                                isLive ? "text-blue-500" : "text-slate-400"
                              }
                            />
                            {sub.startTime} - {sub.endTime}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50/50 rounded-[20px] border border-dashed border-slate-200/80">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white border border-slate-100 text-slate-300 text-2xl flex items-center justify-center shadow-sm">
                    <FaCalendarAlt />
                  </div>
                  <p className="text-slate-600 font-bold tracking-tight">
                    No classes scheduled yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ATTENDANCE BARS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-[10px]">
                <FaChartPie size={16} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Attendance Breakdown
              </h2>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-[24px] shadow-sm border border-slate-200/60">
              <div className="space-y-6">
                {stats.breakdown.length > 0 ? (
                  stats.breakdown.map((sub, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-[13px] text-slate-700 truncate pr-2">
                          {sub.name}
                        </span>
                        <span className="text-slate-500 font-mono font-medium text-[11px] whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-[6px] border border-slate-100">
                          {sub.attended} / {sub.possible}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100/80 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200/50">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            sub.percentage >= 75
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                              : sub.percentage >= 50
                                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                : "bg-gradient-to-r from-rose-400 to-rose-500"
                          }`}
                          style={{ width: `${sub.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">
                        {sub.percentage}%
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 italic text-sm font-medium">
                    No attendance data recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          🟢 CHANGE PASSWORD MODAL 
          ======================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl w-full max-w-md p-8 relative border border-white animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPwdError("");
                setPwdMessage("");
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-colors bg-slate-50"
            >
              <FaTimes size={14} />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100/50 text-indigo-600 rounded-[14px] flex items-center justify-center shadow-inner">
                <FaLock size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  Change Password
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Keep your account secure
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4.5">
              <div>
                <label className={labelClasses}>Current Password</label>
                <div className="relative group">
                  <FaLock className={iconClasses} />
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    value={pwdData.currentPassword}
                    onChange={(e) =>
                      setPwdData({
                        ...pwdData,
                        currentPassword: e.target.value,
                      })
                    }
                    className={`${inputClasses} !pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                  >
                    {showPasswords ? (
                      <FaEyeSlash size={16} />
                    ) : (
                      <FaEye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClasses}>New Password</label>
                <div className="relative group">
                  <FaLock className={iconClasses} />
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    value={pwdData.newPassword}
                    onChange={(e) =>
                      setPwdData({ ...pwdData, newPassword: e.target.value })
                    }
                    className={`${inputClasses} !pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                  >
                    {showPasswords ? (
                      <FaEyeSlash size={16} />
                    ) : (
                      <FaEye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Confirm New Password</label>
                <div className="relative group">
                  <FaLock className={iconClasses} />
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    value={pwdData.confirmPassword}
                    onChange={(e) =>
                      setPwdData({
                        ...pwdData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`${inputClasses} !pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                  >
                    {showPasswords ? (
                      <FaEyeSlash size={16} />
                    ) : (
                      <FaEye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {pwdError && (
                <div className="p-3.5 bg-rose-50 text-rose-700 rounded-[12px] text-[13px] border border-rose-200/80 font-bold flex items-center gap-2 shadow-sm animate-in slide-in-from-top-2">
                  <FaExclamationCircle
                    className="text-rose-500 shrink-0"
                    size={16}
                  />{" "}
                  {pwdError}
                </div>
              )}
              {pwdMessage && (
                <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-[12px] text-[13px] border border-emerald-200/80 font-bold flex items-center gap-2 shadow-sm animate-in slide-in-from-top-2">
                  <FaCheckCircle
                    className="text-emerald-500 shrink-0"
                    size={16}
                  />{" "}
                  {pwdMessage}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPwdLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3.5 rounded-[12px] hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isPwdLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          🟢 UPDATE PROFILE MODAL 
          ======================================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl w-full max-w-md p-8 relative border border-white animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsProfileModalOpen(false);
                setProfileError("");
                setProfileMessage("");
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-colors bg-slate-50"
            >
              <FaTimes size={14} />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100/50 text-indigo-600 rounded-[14px] flex items-center justify-center shadow-inner">
                <FaUserEdit size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  Update Profile
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Manage your contact details
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4.5">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className={labelClasses}>Full Name</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.name}
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-[12px] bg-slate-100 text-slate-500 font-bold outline-none cursor-not-allowed text-sm shadow-inner"
                  />
                </div>
                <div>
                  <label className={labelClasses}>URN</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.urn}
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-[12px] bg-slate-100 text-slate-500 font-bold outline-none cursor-not-allowed text-sm shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Contact Email</label>
                <div className="relative group">
                  <FaEnvelope className={iconClasses} />
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Phone Number</label>
                <div className="relative group">
                  <FaPhone className={iconClasses} />
                  <input
                    type="text"
                    required
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
              </div>

              {profileError && (
                <div className="p-3.5 bg-rose-50 text-rose-700 rounded-[12px] text-[13px] border border-rose-200/80 font-bold flex items-center gap-2 shadow-sm animate-in slide-in-from-top-2">
                  <FaExclamationCircle
                    className="text-rose-500 shrink-0"
                    size={16}
                  />{" "}
                  {profileError}
                </div>
              )}
              {profileMessage && (
                <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-[12px] text-[13px] border border-emerald-200/80 font-bold flex items-center gap-2 shadow-sm animate-in slide-in-from-top-2">
                  <FaCheckCircle
                    className="text-emerald-500 shrink-0"
                    size={16}
                  />{" "}
                  {profileMessage}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProfileLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3.5 rounded-[12px] hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isProfileLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
