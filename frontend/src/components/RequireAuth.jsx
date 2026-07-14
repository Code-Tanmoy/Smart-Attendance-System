import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { backend } from "../services/api";

const RequireAuth = ({ allowedRoles }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const role = localStorage.getItem("userRole");

        if (role === "student") {
          const urn = localStorage.getItem("studentUrn");
          setIsAuthenticated(!!urn);
          setLoading(false);
          return;
        }

        await backend.get("/check-auth");
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFC] font-sans p-4 relative overflow-hidden selection:bg-indigo-100">
        {/* Background Blobs */}
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>

        {/* Glassmorphism Card */}
        <div className="bg-white/60 backdrop-blur-xl border border-white p-10 rounded-[20px] shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center relative z-10">
          <div className="relative flex items-center justify-center w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-[16px] opacity-60"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-[16px] animate-spin shadow-sm"></div>
            <span className="text-indigo-600 font-bold text-xs tracking-wider animate-pulse">
              ST
            </span>
          </div>

          <h3 className="text-slate-800 font-bold text-lg mb-1 tracking-tight">
            Authenticating
          </h3>
          <p className="text-slate-500 font-medium text-sm">
            Securing your session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  const userRole = localStorage.getItem("userRole");

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === "student")
      return <Navigate to="/student-dashboard" replace />;
    if (userRole === "teacher")
      return <Navigate to="/teacherdashboard" replace />;
    if (userRole === "admin") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
