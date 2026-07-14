import React, { useState, useEffect } from "react";
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
  FaEye,
  FaEyeSlash,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";
import { backend, faceApi } from "../services/api";
import toast from "react-hot-toast";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const adminName = localStorage.getItem("adminName") || "Admin";

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pwdData, setPwdData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDay = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
  });
  const formattedDate = currentTime.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center space-x-3 w-full text-left py-2.5 px-4 rounded-[12px] transition-all duration-300 text-sm font-semibold group ${
      isActive
        ? "bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm"
        : "text-slate-600 border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm hover:-translate-y-0.5"
    }`;
  };

  const getIconClass = (path) => {
    const isActive = location.pathname === path;
    return `transition-colors duration-300 ${
      isActive
        ? "text-indigo-600"
        : "text-slate-400 group-hover:text-indigo-500"
    }`;
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) setIsOpen(false);
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

  const testEmailEngine = async () => {
    const emailPromise = backend.post("/api/students/trigger-warnings");
    toast.promise(emailPromise, {
      loading: "Triggering Warning Engine... 🚨",
      success: (res) => `📧 ${res.data.message}`,
      error: (err) =>
        err.response?.data?.message || "❌ Failed to trigger email engine.",
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmPassword)
      return toast.error("New passwords do not match.");
    if (pwdData.newPassword.length < 6)
      return toast.error("Password must be at least 6 characters.");

    setIsSettingsLoading(true);
    const pwdToast = toast.loading("Updating password...");

    try {
      const res = await backend.put("/api/security/change-password", {
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword,
      });
      toast.success(res.data.message, { id: pwdToast });
      setPwdData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setIsSettingsOpen(false), 1500);
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
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-white/90 backdrop-blur-xl border-r border-slate-200/60 shadow-2xl lg:shadow-none flex flex-col h-full transform transition-transform duration-300 ease-in-out lg:transform-none lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header Profile Section */}
        <div className="p-6 pb-4 border-b border-slate-100/60">
          <div className="flex justify-between items-start mb-6 lg:hidden">
            <span className="font-bold text-xl text-slate-800 tracking-tight">
              SmartTrack
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
            >
              <FaTimes size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[14px] flex items-center justify-center text-white shadow-lg shadow-indigo-200/50">
              <FaShieldAlt size={22} />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                Administrator
              </h2>
              <p className="text-base font-bold text-slate-800 leading-tight truncate">
                {adminName}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 py-6 space-y-8">
          {/* Time & Date Widget (Slightly Tinted Card) */}
          <div className="bg-indigo-50/50 rounded-[16px] p-4 border border-indigo-100/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-500 flex items-center gap-1.5">
                <FaCalendarAlt size={12} /> {formattedDay}
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-1 rounded-[8px] shadow-sm border border-slate-100 flex items-center gap-1">
                <FaClock className="text-indigo-400" size={10} />{" "}
                {formattedTime}
              </span>
            </div>
            <span className="text-sm font-bold text-slate-800">
              {formattedDate}
            </span>
          </div>

          {/* Links */}
          <nav className="space-y-6">
            <div className="space-y-1.5">
              <Link
                to="/dashboard"
                onClick={handleLinkClick}
                className={getLinkClass("/dashboard")}
              >
                <FaHome size={18} className={getIconClass("/dashboard")} />
                <span>Dashboard</span>
              </Link>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
                Students
              </p>
              <Link
                to="/Addstudent"
                onClick={handleLinkClick}
                className={getLinkClass("/Addstudent")}
              >
                <FaUser size={18} className={getIconClass("/Addstudent")} />
                <span>Add Students</span>
              </Link>
              <Link
                to="/Enrolled"
                onClick={handleLinkClick}
                className={getLinkClass("/Enrolled")}
              >
                <FaFileAlt size={18} className={getIconClass("/Enrolled")} />
                <span>Enrolled</span>
              </Link>
              <Link
                to="/promote"
                onClick={handleLinkClick}
                className={getLinkClass("/promote")}
              >
                <FaGraduationCap
                  size={18}
                  className={getIconClass("/promote")}
                />
                <span>Promote</span>
              </Link>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
                Academics
              </p>
              <Link
                to="/manageteacher"
                onClick={handleLinkClick}
                className={getLinkClass("/manageteacher")}
              >
                <FaChalkboardTeacher
                  size={18}
                  className={getIconClass("/manageteacher")}
                />
                <span>Manage Staff</span>
              </Link>
              <Link
                to="/schedule"
                onClick={handleLinkClick}
                className={getLinkClass("/schedule")}
              >
                <FaClock size={18} className={getIconClass("/schedule")} />
                <span>Class Schedule</span>
              </Link>
              <Link
                to="/Period"
                onClick={handleLinkClick}
                className={getLinkClass("/Period")}
              >
                <FaListAlt size={18} className={getIconClass("/Period")} />
                <span>Period Logs</span>
              </Link>
              <Link
                to="/Reports"
                onClick={handleLinkClick}
                className={getLinkClass("/Reports")}
              >
                <FaChartBar size={18} className={getIconClass("/Reports")} />
                <span>Analytics</span>
              </Link>
            </div>

            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
                System Tools
              </p>
              <button
                onClick={testEmailEngine}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-bold text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                Send Warning Emails
              </button>
              <button
                onClick={handleSyncFaces}
                disabled={isSyncing}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-sm font-bold transition-all duration-300 shadow-sm ${isSyncing ? "bg-slate-50 text-slate-400 border border-slate-200 cursor-wait" : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-200/50 hover:shadow-lg hover:-translate-y-0.5 border-transparent"}`}
              >
                <FaSync className={`${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync AI Database"}
              </button>
            </div>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100/60 bg-slate-50/30 space-y-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full py-2.5 px-4 rounded-[12px] text-slate-600 flex items-center gap-3 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-200 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 font-semibold text-sm group"
          >
            <FaCog
              size={18}
              className="text-slate-400 group-hover:text-indigo-500 transition-colors group-hover:rotate-90 duration-300"
            />
            <span>Account Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-[12px] bg-white border border-slate-200 text-slate-600 flex items-center gap-3 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 font-bold text-sm group"
          >
            <FaDownload
              size={16}
              className="rotate-[-90deg] text-slate-400 group-hover:text-rose-500 transition-colors"
            />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Glassmorphism Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 backdrop-blur-xl rounded-[20px] shadow-2xl border border-white w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsSettingsOpen(false);
                setPwdData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 transition-colors p-2 bg-slate-50 hover:bg-slate-100 rounded-full"
            >
              <FaTimes />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[14px] flex items-center justify-center border border-indigo-100/50">
                <FaCog size={24} className="animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  Account Settings
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  Manage your security preferences
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {["currentPassword", "newPassword", "confirmPassword"].map(
                (field, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                      {field.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <div className="relative group">
                      <input
                        type={showPasswords ? "text" : "password"}
                        required
                        value={pwdData[field]}
                        onChange={(e) =>
                          setPwdData({ ...pwdData, [field]: e.target.value })
                        }
                        className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-[12px] bg-white text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all text-sm group-hover:border-slate-300"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                      >
                        {showPasswords ? (
                          <FaEyeSlash size={18} />
                        ) : (
                          <FaEye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                ),
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSettingsLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3.5 rounded-[12px] hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-indigo-300 disabled:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isSettingsLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    "Save New Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
