import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaSignOutAlt,
  FaCamera,
  FaClipboardList,
  FaChartBar,
  FaClock,
  FaUsers,
  FaCog,
  FaLock,
  FaUserEdit,
  FaUserShield,
  FaPhone,
  FaEnvelope,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaExclamationCircle,
  FaCheckCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { backend } from "../services/api";

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState(null);
  const [myClasses, setMyClasses] = useState([]);
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
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [isPwdLoading, setIsPwdLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Profile State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ email: "", phone: "" });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Admin Contacts State
  const [isAdminContactModalOpen, setIsAdminContactModalOpen] = useState(false);
  const [adminContacts, setAdminContacts] = useState([]);
  const [isAdminsLoading, setIsAdminsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const localTeacherId = localStorage.getItem("teacherId");
        if (!localTeacherId) {
          window.location.href = "/signin";
          return;
        }

        const [teachersRes, subjectsRes] = await Promise.all([
          backend.get("/api/teachers"),
          backend.get("/api/subjects"),
        ]);

        const currentTeacher = teachersRes.data.find(
          (t) => t.teacherId === localTeacherId,
        );
        setTeacher(currentTeacher);

        const assignedClasses = subjectsRes.data.filter(
          (sub) => sub.teacherId === localTeacherId,
        );
        assignedClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setMyClasses(assignedClasses);
      } catch (err) {
        console.error("Error fetching teacher dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();

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
      const res = await backend.put(`/api/teachers/${teacher._id}`, {
        ...teacher,
        email: profileData.email,
        phone: profileData.phone,
      });

      setProfileMessage("Profile updated successfully!");
      setTeacher(res.data);

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

  const openAdminContacts = async () => {
    setIsDropdownOpen(false);
    setIsAdminContactModalOpen(true);
    setIsAdminsLoading(true);
    try {
      const res = await backend.get("/api/admins");
      setAdminContacts(res.data);
    } catch (err) {
      console.error("Failed to load admins", err);
    } finally {
      setIsAdminsLoading(false);
    }
  };

  const openProfileModal = () => {
    setProfileData({ email: teacher.email, phone: teacher.phone });
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
        <div className="flex flex-col items-center gap-4 relative z-10 bg-white/80 backdrop-blur-xl p-8 rounded-[24px] shadow-2xl border border-white">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100/50"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-bold tracking-tight">
            Loading Faculty Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-5 px-4 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center text-2xl shadow-sm">
          <FaLock />
        </div>
        <p className="text-slate-800 font-bold text-lg tracking-tight">
          Authentication Error. Please log in again.
        </p>
        <button
          onClick={handleLogout}
          className="px-8 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold rounded-[12px] shadow-lg shadow-rose-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all"
        >
          Log Out
        </button>
      </div>
    );
  }

  const inputClasses =
    "w-full pl-11 pr-4 py-3.5 rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm";
  const labelClasses =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1";
  const iconClasses =
    "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 relative selection:bg-indigo-100 overflow-x-hidden font-sans text-slate-800">
      {/* Ambient Background Blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-[-5%] w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none z-0"></div>

      {/* 🚀 NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center mb-8 shadow-sm">
        <div className="font-bold text-xl text-slate-800 flex items-center gap-3 tracking-tight">
          <span className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200/50">
            <FaChalkboardTeacher size={18} />
          </span>
          <span>
            Faculty <span className="text-indigo-600">Portal</span>
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
                    {teacher.name}
                  </p>
                  <p className="text-[11px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5 truncate">
                    {teacher.teacherId}
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
                  <button
                    onClick={openAdminContacts}
                    className="w-full text-left px-4 py-2.5 rounded-[12px] text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors group"
                  >
                    <FaUserShield className="text-slate-400 group-hover:text-indigo-500 transition-colors" />{" "}
                    Contact Admins
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 🎓 WELCOME HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-[24px] p-8 sm:p-10 text-white shadow-xl shadow-indigo-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border border-indigo-400/30">
          <div className="pointer-events-none absolute -top-20 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-20 left-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>{" "}
              Faculty Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
              Welcome, {teacher.name}!
            </h1>
            <p className="text-indigo-100 flex items-center gap-2 text-sm font-medium">
              <span className="font-bold bg-white/10 px-2 py-0.5 rounded-[6px]">
                {teacher.teacherId}
              </span>
              <span className="w-1 h-1 rounded-full bg-indigo-300"></span>
              {teacher.department} Department
            </p>
          </div>
          <div className="relative z-10 text-left md:text-right bg-white/10 p-5 rounded-[20px] backdrop-blur-md border border-white/20 min-w-[160px] shadow-inner">
            <div className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest mb-1">
              Assigned Classes
            </div>
            <div className="text-4xl font-black tabular-nums tracking-tighter">
              {myClasses.length}
            </div>
          </div>
        </div>

        {/* ⚡ QUICK ACTIONS */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 text-indigo-500 rounded-[10px]">
            <FaCog size={16} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <Link
            to="/scanner"
            className="relative bg-white/80 backdrop-blur-sm p-6 rounded-[20px] shadow-sm border border-slate-200/60 hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 group flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 border border-indigo-100/60 rounded-[14px] flex items-center justify-center text-2xl mb-4 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
              <FaCamera />
            </div>
            <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">
              Launch Scanner
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1.5">
              Start biometric attendance
            </p>
          </Link>

          <Link
            to="/manual-entry"
            className="relative bg-white/80 backdrop-blur-sm p-6 rounded-[20px] shadow-sm border border-slate-200/60 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 group flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100/60 rounded-[14px] flex items-center justify-center text-2xl mb-4 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
              <FaClipboardList />
            </div>
            <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">
              Manual Entry
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1.5">
              Override or fix records
            </p>
          </Link>

          <Link
            to="/teacher-roster"
            className="relative bg-white/80 backdrop-blur-sm p-6 rounded-[20px] shadow-sm border border-slate-200/60 hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 group flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100/60 rounded-[14px] flex items-center justify-center text-2xl mb-4 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
              <FaUsers />
            </div>
            <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">
              Class Roster
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1.5">
              View enrolled students
            </p>
          </Link>

          <Link
            to="/teacher-reports"
            className="relative bg-white/80 backdrop-blur-sm p-6 rounded-[20px] shadow-sm border border-slate-200/60 hover:shadow-lg hover:shadow-purple-100 hover:-translate-y-1 hover:border-purple-200 transition-all duration-300 group flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-purple-50 text-purple-600 border border-purple-100/60 rounded-[14px] flex items-center justify-center text-2xl mb-4 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-purple-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
              <FaChartBar />
            </div>
            <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">
              My Reports
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1.5">
              View class analytics
            </p>
          </Link>
        </div>

        {/* 📅 MY SCHEDULE */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 text-blue-500 rounded-[10px]">
            <FaCalendarAlt size={16} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            My Teaching Schedule
          </h2>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[24px] shadow-sm border border-slate-200/60 mb-8">
          {myClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myClasses.map((sub) => {
                const isLive = checkIsLive(sub);
                const activeDays = Array.isArray(sub.day)
                  ? sub.day
                  : [sub.day].filter(Boolean);
                const daysString = activeDays
                  .map((d) => d.slice(0, 3).toUpperCase())
                  .join(", ");

                return (
                  <div
                    key={sub._id}
                    className={`relative p-5 rounded-[20px] border transition-all duration-300 overflow-hidden hover:-translate-y-1 ${
                      isLive
                        ? "bg-gradient-to-br from-indigo-50/90 to-white border-indigo-200 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-100/50 z-10"
                        : "bg-slate-50/50 hover:bg-white border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300"
                    }`}
                  >
                    {isLive && (
                      <div className="absolute top-0 right-0 flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-bl-[16px] shadow-sm tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>{" "}
                        LIVE NOW
                      </div>
                    )}

                    <h3
                      className={`font-bold text-[17px] tracking-tight mb-1.5 ${isLive ? "text-indigo-700" : "text-slate-800"}`}
                    >
                      {sub.name}
                    </h3>

                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                      {sub.department} • {sub.year} ({sub.semester} Sem)
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold mb-5 uppercase tracking-widest bg-indigo-50 border border-indigo-100/60 px-2.5 py-1 rounded-[8px] shadow-sm">
                      <FaCalendarAlt size={10} /> {daysString}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100/80">
                      <div
                        className={`inline-flex items-center gap-2 border px-3 py-1.5 rounded-[10px] text-xs font-bold shadow-sm ${
                          isLive
                            ? "bg-indigo-100/50 border-indigo-200 text-indigo-700"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <FaClock
                          className={
                            isLive ? "text-indigo-500" : "text-slate-400"
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
                No classes assigned yet.
              </p>
              <p className="text-[13px] text-slate-400 font-medium mt-1">
                Contact the admin to update your schedule.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          🟢 1. CHANGE PASSWORD MODAL 
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
          🟢 2. UPDATE PROFILE MODAL 
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
                    value={teacher.name}
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-[12px] bg-slate-100 text-slate-500 font-bold outline-none cursor-not-allowed text-sm shadow-inner"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Teacher ID</label>
                  <input
                    type="text"
                    readOnly
                    value={teacher.teacherId}
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

      {/* ========================================================
          🟢 3. CONTACT ADMINS MODAL
          ======================================================== */}
      {isAdminContactModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] border border-white animate-in zoom-in-95 duration-300">
            <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 p-6 sm:p-8 flex justify-between items-center text-white flex-shrink-0 overflow-hidden">
              <div className="pointer-events-none absolute -top-10 -right-6 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/10">
                  <FaUserShield size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    System Administrators
                  </h2>
                  <p className="text-[11px] font-medium text-indigo-100 uppercase tracking-widest mt-1">
                    Directory Contact Info
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminContactModalOpen(false)}
                className="relative z-10 bg-white/10 hover:bg-white/20 border border-transparent hover:border-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[#F8FAFC]">
              {isAdminsLoading ? (
                <div className="text-center py-16 text-slate-400 font-medium flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                  Loading Directory...
                </div>
              ) : adminContacts.length > 0 ? (
                <div className="space-y-4">
                  {adminContacts.map((admin) => (
                    <div
                      key={admin._id}
                      className="bg-white/80 backdrop-blur-sm p-5 rounded-[20px] border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-slate-800 text-[17px] tracking-tight">
                          {admin.username || "System Admin"}
                        </h3>
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-indigo-50 border border-indigo-100/60 text-indigo-600 py-1.5 px-2.5 rounded-[8px] shadow-sm">
                          {admin.designation || "Master Admin"}
                        </span>
                      </div>
                      <div className="space-y-2.5 mt-4">
                        <a
                          href={`mailto:${admin.email}`}
                          className="flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors w-fit group"
                        >
                          <div className="w-8 h-8 rounded-[8px] bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-500 flex items-center justify-center transition-colors">
                            <FaEnvelope size={14} />
                          </div>
                          {admin.email}
                        </a>
                        <a
                          href={`tel:${admin.phone || ""}`}
                          className="flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors w-fit group"
                        >
                          <div className="w-8 h-8 rounded-[8px] bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-500 flex items-center justify-center transition-colors">
                            <FaPhone size={14} />
                          </div>
                          {admin.phone || "No phone number listed"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 font-medium italic bg-white rounded-[20px] border border-dashed border-slate-200">
                  No administrators found in the directory.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
