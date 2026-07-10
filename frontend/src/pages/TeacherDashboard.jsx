import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
} from "react-icons/fa";
import { backend } from "../services/api";

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState(null);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [isPwdLoading, setIsPwdLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false); // 🟢 NEW STATE

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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/signin";
  };

  // 🟢 UPDATED FUNCTION: Now checks the actual days the class runs!
  const checkIsLive = (subject) => {
    const today = new Date().getDay();
    // 1. Check if it's the weekend
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

    // 2. Check if the class is actually scheduled for today
    if (!activeDays.includes(todayName)) return false;

    // 3. Normal time check
    const currentStr =
      currentTime.getHours().toString().padStart(2, "0") +
      ":" +
      currentTime.getMinutes().toString().padStart(2, "0");
    return currentStr >= subject.startTime && currentStr <= subject.endTime;
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
      // Using the existing teacher update route
      const res = await backend.put(`/api/teachers/${teacher._id}`, {
        ...teacher, // Pass existing read-only data back
        email: profileData.email,
        phone: profileData.phone,
      });

      setProfileMessage("Profile updated successfully!");
      setTeacher(res.data); // Update local state

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

  // 🟢 FETCH & OPEN ADMIN CONTACTS
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
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">
        Loading Faculty Portal...
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500 font-bold gap-4">
        <p>Authentication Error. Please log in again.</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-100 rounded-lg"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 🚀 NAVBAR WITH DROPDOWN */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center mb-6 shadow-sm">
        <div className="font-bold text-xl text-blue-600 flex items-center gap-2">
          <FaChalkboardTeacher /> Faculty Portal
        </div>

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
                  {teacher.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {teacher.teacherId}
                </p>
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

              <button
                onClick={openAdminContacts}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
              >
                <FaUserShield /> Contact Admins
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
        {/* 🎓 WELCOME HEADER */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <p className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">
              Faculty Portal
            </p>
            <h1 className="text-3xl font-bold mb-1">
              Welcome, {teacher.name}!
            </h1>
            <p className="text-white/90 flex items-center gap-2">
              ID: {teacher.teacherId} • {teacher.department} Department
            </p>
          </div>
          <div className="text-left md:text-right bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
            <div className="text-sm text-white/90 font-bold uppercase tracking-wider mb-1">
              Assigned Classes
            </div>
            <div className="text-4xl font-bold">{myClasses.length}</div>
          </div>
        </div>

        {/* ⚡ QUICK ACTIONS */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Link
            to="/scanner"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all group flex flex-col items-center text-center cursor-pointer active:scale-95"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FaCamera />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Launch Scanner</h3>
            <p className="text-xs text-gray-500 mt-1">
              Start biometric attendance
            </p>
          </Link>

          <Link
            to="/manual-entry"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-300 transition-all group flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <FaClipboardList />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Manual Entry</h3>
            <p className="text-xs text-gray-500 mt-1">
              Override or fix records
            </p>
          </Link>

          <Link
            to="/teacher-roster"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-300 transition-all group flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FaUsers />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Class Roster</h3>
            <p className="text-xs text-gray-500 mt-1">View enrolled students</p>
          </Link>

          <Link
            to="/teacher-reports"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col items-center text-center cursor-pointer active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <FaChartBar />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">My Reports</h3>
            <p className="text-xs text-gray-500 mt-1">View class analytics</p>
          </Link>
        </div>

        {/* 📅 MY SCHEDULE */}
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-500" /> My Teaching Schedule
        </h2>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          {myClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClasses.map((sub) => {
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
                    key={sub._id}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                      isLive
                        ? "bg-white border-blue-400 ring-4 ring-blue-500/10 shadow-md transform scale-[1.02] z-10"
                        : "bg-gray-50 border-gray-100 hover:shadow-sm"
                    }`}
                  >
                    {isLive && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl animate-pulse shadow-sm">
                        LIVE NOW
                      </div>
                    )}
                    <h3
                      className={`font-bold text-xl mb-1 ${isLive ? "text-blue-600" : "text-gray-800"}`}
                    >
                      {sub.name}
                    </h3>

                    <div className="text-sm text-gray-500 font-bold mb-1">
                      {sub.department} • {sub.year} ({sub.semester} Sem)
                    </div>

                    {/* 🟢 NEW: Days displayed here */}
                    <div className="text-xs text-blue-500 font-bold mb-4 uppercase tracking-wider">
                      📅 {daysString}
                    </div>

                    {/* Time is kept exactly as it was */}
                    <div
                      className={`inline-flex items-center gap-2 border px-3 py-1.5 rounded-lg text-sm font-bold ${
                        isLive
                          ? "bg-blue-50 border-blue-100 text-blue-700"
                          : "bg-white border-gray-200 text-gray-600"
                      }`}
                    >
                      <FaClock
                        className={isLive ? "text-blue-400" : "text-gray-400"}
                      />
                      {sub.startTime} - {sub.endTime}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-gray-400 text-5xl mb-3 flex justify-center">
                <FaCalendarAlt />
              </div>
              <p className="text-gray-500 font-bold">
                No classes assigned yet.
              </p>
              <p className="text-sm text-gray-400">
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
              <FaTimes size={20} />
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
          🟢 2. UPDATE PROFILE MODAL 
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
              <FaTimes size={20} />
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
                    value={teacher.name}
                    className="w-full p-2.5 border rounded-xl bg-gray-100 text-gray-500 font-bold outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Teacher ID
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={teacher.teacherId}
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

      {/* ========================================================
          🟢 3. CONTACT ADMINS MODAL
          ======================================================== */}
      {isAdminContactModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 flex justify-between items-center text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <FaUserShield size={24} />
                <h2 className="text-xl font-bold">System Administrators</h2>
              </div>
              <button
                onClick={() => setIsAdminContactModalOpen(false)}
                className="bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {isAdminsLoading ? (
                <div className="text-center py-10 text-gray-500 font-bold animate-pulse">
                  Loading Admin Directory...
                </div>
              ) : adminContacts.length > 0 ? (
                <div className="space-y-4">
                  {adminContacts.map((admin) => (
                    <div
                      key={admin._id}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800 text-lg">
                          {admin.username || "System Admin"}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 py-1 px-2 rounded-md">
                          {admin.designation || "Master Admin"}
                        </span>
                      </div>
                      <div className="space-y-2 mt-3">
                        <a
                          href={`mailto:${admin.email}`}
                          className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors w-fit"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                            <FaEnvelope />
                          </div>
                          {admin.email}
                        </a>
                        <a
                          href={`tel:${admin.phone || ""}`}
                          className="flex items-center gap-3 text-sm text-gray-600 hover:text-green-600 transition-colors w-fit"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                            <FaPhone />
                          </div>
                          {admin.phone || "No phone number listed"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 italic">
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
