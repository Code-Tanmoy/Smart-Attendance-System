import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaLock,
  FaKey,
  FaExclamationCircle,
  FaCheckCircle,
} from "react-icons/fa";

const ResetPassword = () => {
  const { token } = useParams(); // Grabs the /:token from the URL
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setIsLoading(true);
    try {
      // 🟢 FIXED: Using native fetch() to match your project style
      const response = await fetch(
        `http://localhost:5001/api/security/reset-password/${token}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        // Give them 3 seconds to read the success message, then send to login
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setError(data.message || "Invalid or expired token.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden selection:bg-indigo-100 p-4 font-sans text-slate-800">
      {/* Ambient Background Blobs */}
      <div className="absolute top-[10%] left-[-5%] w-96 h-96 bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
      <div
        className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Glassmorphism Card */}
      <div className="bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-[24px] shadow-2xl shadow-slate-200/50 border border-white w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[16px] flex items-center justify-center mb-5 border border-indigo-100/50 shadow-inner">
            <FaLock size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center">
            Set New Password
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium text-center px-4">
            Please enter a secure password for your account to regain access.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200/80 text-rose-700 rounded-[12px] flex items-center gap-3 text-sm font-bold shadow-sm animate-in slide-in-from-top-2">
            <FaExclamationCircle className="text-rose-500 shrink-0" size={18} />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-[12px] flex items-center gap-3 text-sm font-bold shadow-sm animate-in slide-in-from-top-2">
            <FaCheckCircle className="text-emerald-500 shrink-0" size={18} />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
              New Password
            </label>
            <div className="relative group">
              <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
              Confirm Password
            </label>
            <div className="relative group">
              <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || message}
            className="w-full mt-8 py-4 rounded-[12px] font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              "Save New Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
