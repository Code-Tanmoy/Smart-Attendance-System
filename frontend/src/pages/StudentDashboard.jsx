import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";
import { backend } from "../services/api";

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Force a re-render every minute so the "Live Now" badge updates automatically
  const [currentTime, setCurrentTime] = useState(new Date());

  //  SETTINGS DROPDOWN & MODAL STATES
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/signin";
  };

  // 🟢 HANDLE PASSWORD CHANGE
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage("");
    setPwdError("");

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      return setPwdError("New passwords do not match.");
    }
    if (pwdData.newPassword.length < 6) {
      return setPwdError("Password must be at least 6 characters.");
    }

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

  // 🟢 HANDLE PROFILE UPDATE
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

      // Update local state so UI reflects changes immediately without refresh
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
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">
        Loading your portal...
      </div>
    );
  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">
        Failed to load data. Please log in again.
      </div>
    );

  const { profile, schedule, stats } = data;

  if (profile.status === "Graduated") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100">
          <FaUserGraduate className="text-6xl text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Congratulations, {profile.name}!
          </h1>
          <p className="text-gray-600 mb-6">
            You have officially graduated from the {profile.department}{" "}
            department.
          </p>
          <p className="text-sm text-gray-400 italic mb-8">
            Your academic records are permanently sealed and stored in the
            alumni database.
          </p>
          <button
            onClick={handleLogout}
            className="px-8 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-md"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // 🟢 UPDATED FUNCTION: Now checks the actual days the class runs!
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
    if (totalPossible === 0) return "from-blue-600 to-indigo-700";
    if (percentage >= 75) return "from-emerald-500 to-teal-600";
    if (percentage >= 50) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-red-600";
  };

  const renderAlertBanner = (percentage, totalPossible) => {
    if (totalPossible === 0) {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm mb-6">
          <FaCalendarAlt className="text-xl text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-800">No classes held yet</h3>
            <p className="text-sm text-blue-700">
              Your attendance will calculate once classes begin.
            </p>
          </div>
        </div>
      );
    }

    if (percentage >= 75) {
      return (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm mb-6">
          <FaCheckCircle className="text-xl text-green-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-green-800">Attendance is on track</h3>
            <p className="text-sm text-green-700">
              Great job! Keep attending classes to maintain your good standing.
            </p>
          </div>
        </div>
      );
    } else if (percentage >= 50) {
      return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm mb-6">
          <FaExclamationTriangle className="text-xl text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800">
              Warning: Attendance below 75%
            </h3>
            <p className="text-sm text-amber-700">
              Your attendance has dropped to {percentage}%. Please attend
              upcoming classes to recover your average.
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm mb-6">
          <FaExclamationTriangle className="text-xl text-red-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800">
              CRITICAL: Attendance below 50%
            </h3>
            <p className="text-sm text-red-700">
              It will be mathematically difficult to recover. Please contact
              your department head immediately.
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 🟢 UPDATED NAVBAR WITH DROPDOWN */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center mb-6 shadow-sm">
        <div className="font-bold text-xl text-blue-600">Student Portal</div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-200"
          >
            <FaCog size={18} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-gray-50 mb-2">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {profile.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile.urn}</p>
              </div>

              <button
                onClick={openProfileModal}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
              >
                <FaUserEdit /> Update Profile
              </button>

              <button
                onClick={() => {
                  setIsPasswordModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
              >
                <FaLock /> Change Password
              </button>

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-bold"
                >
                  <FaSignOutAlt /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6">
        {renderAlertBanner(stats.overallPercentage, stats.totalPossible)}

        <div
          className={`bg-gradient-to-r ${getHeaderGradient(stats.overallPercentage, stats.totalPossible)} rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 transition-all duration-500`}
        >
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, {profile.name}!
            </h1>
            <p className="text-white/90 flex items-center gap-2">
              <FaUserGraduate /> URN: {profile.urn} • {profile.department} •{" "}
              {profile.year} ({profile.semester} Sem)
            </p>
          </div>
          <div className="text-left md:text-right bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
            <div className="text-sm text-white/90 font-bold uppercase tracking-wider mb-1">
              Overall Attendance
            </div>
            <div className="text-5xl font-bold">{stats.overallPercentage}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TIMETABLE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" /> My Master Timetable
              </h2>
              {schedule.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {schedule.map((sub, idx) => {
                    // 🟢 Pass the whole subject
                    const isLive = checkIsLive(sub);

                    // 🟢 Format the days string
                    const activeDays = Array.isArray(sub.day)
                      ? sub.day
                      : [sub.day].filter(Boolean);
                    const daysString = activeDays
                      .map((d) => d.slice(0, 3).toUpperCase())
                      .join(", ");

                    return (
                      <div
                        key={idx}
                        className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px] ${
                          isLive
                            ? "bg-white border-blue-400 ring-4 ring-blue-500/10 shadow-md transform scale-[1.02] z-10"
                            : "bg-gray-50 border-gray-100 hover:shadow-sm hover:border-gray-300"
                        }`}
                      >
                        {isLive && (
                          <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl animate-pulse shadow-sm">
                            LIVE NOW
                          </div>
                        )}

                        <div>
                          <h3
                            className={`font-bold text-lg mb-1 ${isLive ? "text-blue-600" : "text-gray-800"}`}
                          >
                            {sub.name}
                          </h3>
                          <p className="text-sm text-gray-600 font-bold mb-0.5">
                            {sub.teacher}
                          </p>

                          <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mb-2">
                            <FaPhone className="text-[10px]" />{" "}
                            {sub.teacherPhone || "Contact info hidden"}
                          </p>
                        </div>

                        {/* 🟢 NEW: Days displayed here */}
                        <div className="text-xs text-blue-500 font-bold mb-3 uppercase tracking-wider">
                          📅 {daysString}
                        </div>

                        <div
                          className={`mt-auto w-fit inline-flex items-center gap-1.5 border px-2 py-1 rounded text-xs font-bold ${
                            isLive
                              ? "bg-blue-50 border-blue-100 text-blue-700"
                              : "bg-white border-gray-200 text-gray-600"
                          }`}
                        >
                          <FaClock
                            className={
                              isLive ? "text-blue-400" : "text-gray-400"
                            }
                          />{" "}
                          {sub.startTime} - {sub.endTime}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic py-4">
                  No classes scheduled yet for this semester.
                </p>
              )}
            </div>
          </div>

          {/* ATTENDANCE BARS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartPie className="text-blue-500" /> Attendance Breakdown
            </h2>
            <div className="space-y-6">
              {stats.breakdown.length > 0 ? (
                stats.breakdown.map((sub, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-gray-700">
                        {sub.name}
                      </span>
                      <span className="text-gray-500 font-mono text-xs">
                        {sub.attended} / {sub.possible} Classes
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${sub.percentage >= 75 ? "bg-emerald-500" : sub.percentage >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${sub.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-[10px] font-bold text-gray-400 mt-1">
                      {sub.percentage}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">
                  No attendance data recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          🟢 CHANGE PASSWORD MODAL 
          ======================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPwdError("");
                setPwdMessage("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <FaLock size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Change Password
              </h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Current Password
                </label>
                <div className="relative">
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
                    className="w-full p-3 pr-12 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showPasswords ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    value={pwdData.newPassword}
                    onChange={(e) =>
                      setPwdData({ ...pwdData, newPassword: e.target.value })
                    }
                    className="w-full p-3 pr-12 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showPasswords ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
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
                    className="w-full p-3 pr-12 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showPasswords ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {pwdError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm text-center border border-red-100">
                  {pwdError}
                </div>
              )}
              {pwdMessage && (
                <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm text-center border border-green-100">
                  {pwdMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={isPwdLoading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors mt-2 shadow-md"
              >
                {isPwdLoading ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          🟢 UPDATE PROFILE MODAL 
          ======================================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => {
                setIsProfileModalOpen(false);
                setProfileError("");
                setProfileMessage("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <FaUserEdit size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Update Profile
              </h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* READ-ONLY FIELDS */}
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={profile.name}
                    className="w-full p-2.5 border rounded-xl bg-gray-100 text-gray-500 font-bold outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    URN
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={profile.urn}
                    className="w-full p-2.5 border rounded-xl bg-gray-100 text-gray-500 font-bold outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* EDITABLE FIELDS */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Contact Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {profileError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm text-center border border-red-100">
                  {profileError}
                </div>
              )}
              {profileMessage && (
                <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm text-center border border-green-100">
                  {profileMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isProfileLoading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors mt-2 shadow-md"
              >
                {isProfileLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
