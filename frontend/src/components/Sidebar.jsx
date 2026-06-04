import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaUser,
  FaDownload,
  FaClock,
  FaChartBar,
  FaSync,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaListAlt,
  FaShieldAlt,
  FaCog,
} from "react-icons/fa";
import { backend, faceApi } from "../services/api";
import toast from "react-hot-toast"; // 🟢 NEW: Imported React Hot Toast

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 🟢 Retrieve Admin Name from LocalStorage (Fallback to "Admin" if not found)
  const adminName = localStorage.getItem("adminName") || "Admin";

  // 🟢 SETTINGS / CHANGE PASSWORD STATES
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pwdData, setPwdData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  const getLinkClass = (path) => {
    const baseClass =
      "flex items-center space-x-3 w-full text-left py-2.5 px-4 rounded-xl transition-all duration-200 font-medium text-sm";
    if (location.pathname === path) {
      return `${baseClass} bg-blue-50 text-blue-700 shadow-sm border border-blue-100`;
    }
    return `${baseClass} text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100`;
  };

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

  const [isSyncing, setIsSyncing] = useState(false);

  // 🟢 NEW: Upgraded AI Database Sync to use toast.promise
  const handleSyncFaces = async () => {
    setIsSyncing(true);

    const syncPromise = faceApi.post("/sync");

    toast.promise(syncPromise, {
      loading: "Syncing AI Database...",
      success: (res) => `✅ ${res.data.message}`,
      error: "❌ Failed to sync faces. Is the Python server running?",
    });

    try {
      await syncPromise;
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 🟢 NEW: Upgraded Email Warning Engine to use toast.promise
  const testEmailEngine = async () => {
    const emailPromise = backend.post("/api/students/trigger-warnings");

    toast.promise(emailPromise, {
      loading: "Triggering Warning Engine... 🚨",
      success: (res) => `📧 ${res.data.message}`,
      error: (err) =>
        err.response?.data?.message || "❌ Failed to trigger email engine.",
    });
  };

  // 🟢 CHANGE PASSWORD HANDLER (Upgraded to use Toasts)
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    if (pwdData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    setIsSettingsLoading(true);
    const pwdToast = toast.loading("Updating password...");

    try {
      const res = await backend.put("/api/security/change-password", {
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword,
      });

      toast.success(res.data.message, { id: pwdToast });
      setPwdData({ currentPassword: "", newPassword: "", confirmPassword: "" });

      // Automatically close the modal after 1.5 seconds on success
      setTimeout(() => {
        setIsSettingsOpen(false);
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password.", {
        id: pwdToast,
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full lg:w-64 bg-white shadow-xl rounded-3xl p-5 flex flex-col justify-between min-h-[90vh] border border-gray-100">
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pr-2">
          {/* Personalized Welcome Header */}
          <div className="flex items-center gap-3 mb-8 mt-2 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
              <FaShieldAlt size={20} />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                Welcome,
              </h2>
              <p className="text-lg font-bold text-gray-800 leading-tight truncate">
                {adminName}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Link to="/dashboard" className={getLinkClass("/dashboard")}>
              <FaHome
                className={
                  location.pathname === "/dashboard"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Dashboard</span>
            </Link>

            {/* STUDENTS SECTION */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mb-1 mt-4">
              Students
            </p>
            <Link to="/Addstudent" className={getLinkClass("/Addstudent")}>
              <FaUser
                className={
                  location.pathname === "/Addstudent"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Add Students</span>
            </Link>
            <Link to="/Enrolled" className={getLinkClass("/Enrolled")}>
              <FaFileAlt
                className={
                  location.pathname === "/Enrolled"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Enrolled</span>
            </Link>
            <Link to="/promote" className={getLinkClass("/promote")}>
              <FaGraduationCap
                className={
                  location.pathname === "/promote"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Promote</span>
            </Link>

            {/* ACADEMICS SECTION */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mb-1 mt-4">
              Academics
            </p>
            <Link
              to="/manageteacher"
              className={getLinkClass("/manageteacher")}
            >
              <FaChalkboardTeacher
                className={
                  location.pathname === "/manageteacher"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Manage Staff</span>
            </Link>
            <Link to="/schedule" className={getLinkClass("/schedule")}>
              <FaClock
                className={
                  location.pathname === "/schedule"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Class Schedule</span>
            </Link>
            <Link to="/Period" className={getLinkClass("/Period")}>
              <FaListAlt
                className={
                  location.pathname === "/Period"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Period Logs</span>
            </Link>
            <Link to="/Reports" className={getLinkClass("/Reports")}>
              <FaChartBar
                className={
                  location.pathname === "/Reports"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Analytics</span>
            </Link>

            {/* SYSTEM SECTION */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mb-1 mt-4">
              System Tools
            </p>
            <button
              onClick={testEmailEngine}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
            >
              <span className="text-lg">🚨</span> Test Email Engine
            </button>
            <button
              onClick={handleSyncFaces}
              disabled={isSyncing}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                isSyncing
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-wait"
                  : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white"
              }`}
            >
              <FaSync className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing..." : "Sync AI Database"}
            </button>
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-1.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl text-gray-600 flex items-center gap-3 hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 font-medium text-sm group"
          >
            <FaCog className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            <span>Account Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 flex items-center gap-3 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300 font-bold text-sm"
          >
            <FaDownload className="rotate-[-90deg]" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          🟢 SETTINGS / CHANGE PASSWORD MODAL (Overlay)
          ======================================================== */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => {
                setIsSettingsOpen(false);
                setPwdData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
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
                <FaCog size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Account Settings
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdData.currentPassword}
                  onChange={(e) =>
                    setPwdData({ ...pwdData, currentPassword: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdData.newPassword}
                  onChange={(e) =>
                    setPwdData({ ...pwdData, newPassword: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdData.confirmPassword}
                  onChange={(e) =>
                    setPwdData({ ...pwdData, confirmPassword: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSettingsLoading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors mt-2"
              >
                {isSettingsLoading ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
