import React, { useState, useEffect } from "react";
import {
  FaUserGraduate,
  FaClock,
  FaCalendarAlt,
  FaChartPie,
  FaSignOutAlt,
} from "react-icons/fa";
import { backend } from "../services/api";

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const urn = localStorage.getItem("studentUrn");
        if (!urn) {
          window.location.href = "/signin";
          return;
        }

        // Ensure this path exactly matches your backend route from Step 2
        const res = await backend.get(`/api/students/me/${urn}`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching student data");
      } finally {
        setLoading(false);
      }
    };
    fetchMyData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/signin";
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

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center mb-6 shadow-sm">
        <div className="font-bold text-xl text-blue-600">
          SmartCampus Student
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-500 flex items-center gap-2 text-sm font-bold transition-colors"
        >
          <FaSignOutAlt /> Logout
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 space-y-6">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, {profile.name}!
            </h1>
            <p className="text-blue-100 opacity-90 flex items-center gap-2">
              <FaUserGraduate /> URN: {profile.urn} • {profile.department} •{" "}
              {profile.year} ({profile.semester} Sem)
            </p>
          </div>
          <div className="text-left md:text-right bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
            <div className="text-sm text-blue-200 font-bold uppercase tracking-wider mb-1">
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
                  {schedule.map((sub, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-md transition-all"
                    >
                      <h3 className="font-bold text-gray-800 text-lg mb-1">
                        {sub.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {sub.teacher}
                      </p>
                      <div className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-xs font-bold text-gray-600">
                        <FaClock className="text-gray-400" /> {sub.startTime} -{" "}
                        {sub.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic py-4">
                  No classes scheduled yet.
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
                        className={`h-2.5 rounded-full ${sub.percentage >= 75 ? "bg-green-500" : sub.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
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
    </div>
  );
};

export default StudentDashboard;
