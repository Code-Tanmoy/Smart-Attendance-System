import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
  FaUserShield,
  FaServer,
} from "react-icons/fa";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";

// Dynamic URL router. Uses Vercel environment variable in production, localhost in development.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const Signin = () => {
  const location = useLocation();
  const [systemStatus, setSystemStatus] = useState("checking");
  const [role, setRole] = useState("admin");
  const [authMode, setAuthMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    urn: "",
    password: "",
    retypePassword: "",
  });

  useEffect(() => {
    const checkExistingSession = async () => {
      const existingRole = localStorage.getItem("userRole");
      if (!existingRole) return;

      try {
        const response = await fetch(`${BACKEND_URL}/check-auth`, {
          credentials: "include",
        });
        if (response.ok) {
          if (existingRole === "student")
            window.location.href = "/student-dashboard";
          else if (existingRole === "teacher")
            window.location.href = "/teacherdashboard";
          else if (existingRole === "admin")
            window.location.href = "/dashboard";
        } else {
          localStorage.clear();
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.clear();
      }
    };
    checkExistingSession();
  }, []);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/system/setup-status`);
        const data = await response.json();
        setSystemStatus(data.setupRequired ? "setup" : "ready");
      } catch (err) {
        console.error("Failed to check system status:", err);
        setSystemStatus("ready");
      }
    };
    checkSystemStatus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsForgotLoading(true);
    setForgotMessage("");
    const resetToast = toast.loading("Sending reset link...");

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/security/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setForgotMessage(data.message);
        toast.success("Reset link sent to your email!", { id: resetToast });
      } else {
        const errorMsg = data.message || "An error occurred.";
        setForgotMessage(errorMsg);
        toast.error(errorMsg, { id: resetToast });
      }
    } catch (err) {
      setForgotMessage("Failed to connect to the server.");
      toast.error("Failed to connect to the server.", { id: resetToast });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, urn, password, retypePassword } = formData;

    if (systemStatus === "setup") {
      if (!username || !email || !password || !retypePassword)
        return toast.error("All fields are required!");
      if (password !== retypePassword)
        return toast.error("Passwords do not match!");
      if (password.length < 6)
        return toast.error("Password must be at least 6 characters.");

      setLoading(true);
      const setupToast = toast.loading("Initializing Master Admin...");

      try {
        const response = await fetch(`${BACKEND_URL}/api/system/setup-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();

        if (response.ok) {
          toast.success("Master Admin created! System is locked down.", {
            id: setupToast,
            icon: "🎉",
            duration: 4000,
          });
          setSystemStatus("ready");
          setFormData({
            email: "",
            urn: "",
            password: "",
            retypePassword: "",
            username: "",
          });
        } else {
          toast.error(data.message || "Setup failed.", { id: setupToast });
        }
      } catch (err) {
        toast.error("Error during setup: " + err.message, { id: setupToast });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (role === "admin" && !email)
      return toast.error("Login identifier is required!");
    if (role === "student" && !urn) return toast.error("URN is required!");
    if (!password) return toast.error("Password is required!");

    setLoading(true);
    const authToast = toast.loading(
      authMode === "signup" ? "Claiming your account..." : "Authenticating...",
    );

    try {
      let endpoint = "";
      let payload = {};

      if (role === "admin") {
        endpoint = `${BACKEND_URL}/signin`;
        payload = { email, password };
      } else {
        endpoint =
          authMode === "signup"
            ? `${BACKEND_URL}/api/students/student-signup`
            : `${BACKEND_URL}/api/students/student-login`;
        payload = { urn, password };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (authMode === "signup") {
          toast.success("Account claimed successfully! Please log in.", {
            id: authToast,
            icon: "🎓",
          });
          setAuthMode("login");
          setFormData({ ...formData, password: "", retypePassword: "" });
        } else {
          toast.success("Welcome back!", { id: authToast });
          const loggedInRole = data.role || role;
          localStorage.setItem("userRole", loggedInRole);
          localStorage.setItem("adminName", data.admin?.username || "Admin");

          if (loggedInRole === "student") {
            localStorage.setItem("studentUrn", data.urn || urn);
            window.location.href = "/student-dashboard";
          } else if (loggedInRole === "teacher") {
            localStorage.setItem("teacherId", data.teacher.teacherId);
            window.location.href = "/teacherdashboard";
          } else {
            window.location.href = "/dashboard";
          }
        }
      } else {
        toast.error(
          data.message?.message || data.message || "Authentication failed",
          { id: authToast },
        );
      }
    } catch (err) {
      toast.error("Network Error: " + err.message, { id: authToast });
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full pl-11 pr-12 py-3.5 rounded-[12px] bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm";
  const labelClasses =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1";
  const iconClasses =
    "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[15px] pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300";

  if (systemStatus === "checking") {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[24px] shadow-2xl border border-white flex flex-col items-center gap-5 relative z-10">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin shadow-sm"></div>
          <p className="text-slate-600 font-bold tracking-tight">
            Checking System Status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] relative font-sans selection:bg-indigo-100">
      {/* 🌌 HERO LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/20 to-blue-600/20 z-0"></div>
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-indigo-500/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-[100px]"></div>

        <div className="relative z-10 text-white max-w-lg">
          <div className="mb-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] uppercase tracking-widest font-bold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            Smart Attendance System
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-[1.15] tracking-tight">
            Manage your classroom <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300">
              intelligently.
            </span>
          </h1>
          <p className="text-lg text-slate-300/90 font-medium leading-relaxed mb-8 max-w-md">
            The automated attendance platform powered by facial recognition
            technology. Secure, fast, and completely paperless.
          </p>
        </div>
      </div>

      {/* 🔐 AUTH RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Right side background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none lg:hidden"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none lg:hidden"></div>

        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-[24px] shadow-2xl shadow-slate-200/50 border border-white relative z-10 animate-in fade-in zoom-in-95 duration-500">
          {systemStatus === "setup" ? (
            <div className="animate-in fade-in duration-300">
              <div className="bg-indigo-50/80 p-4 rounded-[16px] border border-indigo-100/80 flex items-start gap-3.5 mb-8 shadow-sm">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-[10px]">
                  <FaServer size={14} />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 text-sm tracking-tight">
                    System Initialization
                  </h3>
                  <p className="text-xs text-indigo-700/80 mt-1 font-medium leading-relaxed">
                    No administrators found. Please create the Master Admin
                    account to lock down the system and secure the database.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">
                Master Setup
              </h2>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Create your root credentials.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4.5">
                <div>
                  <label className={labelClasses}>Admin Username</label>
                  <div className="relative group">
                    <FaUser className={iconClasses} />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                      placeholder="e.g., Master_Admin"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Email Address</label>
                  <div className="relative group">
                    <FaEnvelope className={iconClasses} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                      placeholder="admin@college.edu"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Master Password</label>
                  <div className="relative group">
                    <FaLock className={iconClasses} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                    >
                      {showPassword ? (
                        <FaEyeSlash size={16} />
                      ) : (
                        <FaEye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Confirm Password</label>
                  <div className="relative group">
                    <FaLock className={iconClasses} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="retypePassword"
                      value={formData.retypePassword}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 rounded-[12px] font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mt-8 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-indigo-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Secure System & Setup Admin <FaArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              {/* ROLE TOGGLE PILLS */}
              <div className="flex justify-center mb-8">
                <div className="bg-slate-100/80 p-1.5 rounded-[16px] inline-flex gap-1 w-full max-w-[320px] border border-slate-200/50 shadow-inner">
                  <button
                    onClick={() => {
                      setRole("admin");
                      setAuthMode("login");
                      setFormData({
                        email: "",
                        urn: "",
                        password: "",
                        retypePassword: "",
                        username: "",
                      });
                    }}
                    className={`flex-1 py-2.5 rounded-[12px] text-sm font-bold flex justify-center items-center gap-2 transition-all duration-300 ${role === "admin" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                  >
                    <FaUserShield size={14} /> Staff
                  </button>
                  <button
                    onClick={() => {
                      setRole("student");
                      setFormData({
                        email: "",
                        urn: "",
                        password: "",
                        retypePassword: "",
                        username: "",
                      });
                    }}
                    className={`flex-1 py-2.5 rounded-[12px] text-sm font-bold flex justify-center items-center gap-2 transition-all duration-300 ${role === "student" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                  >
                    <FaUserGraduate size={14} /> Student
                  </button>
                </div>
              </div>

              {/* STUDENT AUTH MODE TOGGLE */}
              {role === "student" ? (
                <div className="flex bg-slate-50/50 border border-slate-200/80 p-1.5 rounded-[12px] mb-8 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setFormData({
                        ...formData,
                        password: "",
                        retypePassword: "",
                      });
                    }}
                    className={`flex-1 py-2 text-[11px] uppercase tracking-widest font-bold rounded-[8px] transition-all duration-300 ${authMode === "login" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setFormData({
                        ...formData,
                        password: "",
                        retypePassword: "",
                      });
                    }}
                    className={`flex-1 py-2 text-[11px] uppercase tracking-widest font-bold rounded-[8px] transition-all duration-300 ${authMode === "signup" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Claim Account
                  </button>
                </div>
              ) : (
                <div className="flex bg-slate-50/50 border border-slate-200/80 p-1.5 rounded-[12px] mb-8 shadow-sm">
                  <div className="flex-1 py-2 text-[11px] uppercase tracking-widest font-bold rounded-[8px] bg-white text-indigo-600 shadow-sm text-center border border-slate-200/50">
                    Staff Login Portal
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">
                {authMode === "login" ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">
                {role === "admin"
                  ? "Enter your credentials to access your portal."
                  : authMode === "login"
                    ? "Login to view your attendance portal."
                    : "Enter your URN to set up your password."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelClasses}>
                    {role === "admin" ? "Email or Teacher ID" : "Student URN"}
                  </label>
                  <div className="relative group">
                    {role === "admin" ? (
                      <FaEnvelope className={iconClasses} />
                    ) : (
                      <FaUser className={iconClasses} />
                    )}
                    <input
                      type="text"
                      name={role === "admin" ? "email" : "urn"}
                      value={role === "admin" ? formData.email : formData.urn}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                      placeholder={
                        role === "admin"
                          ? "teacher@college.edu or TA202"
                          : "Ex. 276001..."
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Password</label>
                  <div className="relative group">
                    <FaLock className={iconClasses} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                    >
                      {showPassword ? (
                        <FaEyeSlash size={16} />
                      ) : (
                        <FaEye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {authMode === "login" && (
                  <div className="text-right mt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors uppercase tracking-widest"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {authMode === "signup" && role === "student" && (
                  <div>
                    <label className={labelClasses}>Confirm Password</label>
                    <div className="relative group">
                      <FaLock className={iconClasses} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="retypePassword"
                        value={formData.retypePassword}
                        onChange={handleChange}
                        required
                        className={inputClasses}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 rounded-[12px] font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mt-8 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-indigo-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {authMode === "login"
                        ? role === "admin"
                          ? "Sign In to Portal"
                          : "Enter Student Portal"
                        : "Claim My Account"}
                      <FaArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 🟢 FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[24px] shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-300 border border-white">
            <button
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotMessage("");
                setForgotEmail("");
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full"
            >
              <FaTimes size={16} />
            </button>

            <div className="mb-8 text-center">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100/50 text-indigo-600 rounded-[14px] flex items-center justify-center mx-auto mb-4 shadow-inner">
                <FaLock size={22} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Reset Password
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed px-4">
                Enter your registered email address and we will send you a
                secure reset link.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="relative group">
                <FaEnvelope className={iconClasses} />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <button
                type="submit"
                disabled={isForgotLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3.5 rounded-[12px] hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none transition-all duration-300 active:scale-[0.98] active:translate-y-0 flex items-center justify-center"
              >
                {isForgotLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            {forgotMessage && (
              <div
                className={`mt-6 p-4 text-[13px] text-center rounded-[12px] font-bold border shadow-sm animate-in slide-in-from-top-2 ${forgotMessage.includes("sent") ? "bg-emerald-50 text-emerald-700 border-emerald-200/80" : "bg-rose-50 text-rose-700 border-rose-200/80"}`}
              >
                {forgotMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Signin;
