import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaUser,
  FaDownload,
  FaClock,
  FaChartBar,
  FaCamera,
  FaSync,
} from "react-icons/fa";
import { backend } from "../services/api";
import { faceApi } from "../services/api";
import { useState } from "react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to determine style based on active path
  const getLinkClass = (path) => {
    const baseClass =
      "flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl transition-all duration-300";
    if (location.pathname === path) {
      return `${baseClass} bg-gray-100 font-semibold shadow-sm text-blue-700`; // Active Style
    }
    return `${baseClass} text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-200`; // Inactive Style
  };

  const handleLogout = async () => {
    try {
      // 1. Tell Backend to clear cookie
      await backend.post("/logout");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      // 🟢 THE CRITICAL FIX: Wipe the browser's memory so the Front page resets!
      localStorage.clear();

      // 2. Redirect to Signin and REPLACE history (so Back button doesn't work)
      navigate("/signin", { replace: true });
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncFaces = async () => {
    setIsSyncing(true);
    try {
      const res = await faceApi.post("/sync");
      alert(`✅ ${res.data.message}`);
    } catch (error) {
      alert("❌ Failed to sync faces. Is the Python server running?");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full lg:w-64 bg-white shadow-xl rounded-2xl p-4 flex flex-col justify-between min-h-[90vh]">
      <div>
        <h2 className="text-xl font-bold text-center mb-6 mt-4 text-gray-800">
          Admin Panel
        </h2>

        <div className="flex flex-col gap-2">
          {/* Go to Face Scanner (Kiosk Mode) */}
          <Link to="/">
            <button className="flex items-center space-x-2 w-full text-left py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all mb-4 font-semibold">
              <FaCamera />
              <span>Live Scanner</span>
            </button>
          </Link>

          <p className="text-xs font-bold text-gray-400 uppercase px-4 mb-1 mt-2">
            Menu
          </p>

          <Link to="/dashboard">
            <button className={getLinkClass("/dashboard")}>
              <FaHome
                className={
                  location.pathname === "/dashboard"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Home</span>
            </button>
          </Link>
          <Link to="/Addstudent">
            <button className={getLinkClass("/Addstudent")}>
              <FaUser
                className={
                  location.pathname === "/Addstudent"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Add Students</span>
            </button>
          </Link>
          <Link to="/Enrolled">
            <button className={getLinkClass("/Enrolled")}>
              <FaFileAlt
                className={
                  location.pathname === "/Enrolled"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Enrolled</span>
            </button>
          </Link>
          <Link to="/schedule">
            <button className={getLinkClass("/schedule")}>
              <FaClock
                className={
                  location.pathname === "/schedule"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Schedule</span>
            </button>
          </Link>
          <Link to="/Period">
            <button className={getLinkClass("/Period")}>
              <FaClock
                className={
                  location.pathname === "/Period"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Period Wise</span>
            </button>
          </Link>

          <Link to="/Reports">
            <button className={getLinkClass("/Reports")}>
              <FaChartBar
                className={
                  location.pathname === "/Reports"
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              />
              <span>Reports</span>
            </button>
          </Link>
          <button
            onClick={handleSyncFaces}
            disabled={isSyncing}
            className={`w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-sm font-bold transition-all ${
              isSyncing
                ? "bg-slate-700 text-slate-400 cursor-wait"
                : "bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white"
            }`}
          >
            <FaSync className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing AI..." : "Sync Face Database"}
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 flex items-center justify-center space-x-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-300 font-medium"
      >
        <FaDownload />
        <span>Log Out</span>
      </button>
    </div>
  );
};

export default Sidebar;
