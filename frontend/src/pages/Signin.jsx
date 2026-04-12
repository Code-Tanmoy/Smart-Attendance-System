import React, { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
  FaUserShield,
} from "react-icons/fa";

const Signin = () => {
  const [role, setRole] = useState("admin"); // 'admin' or 'student'
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    urn: "",
    password: "",
    retypePassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, urn, password, retypePassword } = formData;

    // Basic Validation
    if (role === "admin" && !email) return alert("Email is required!");
    if (role === "student" && !urn) return alert("URN is required!");
    if (!password) return alert("Password is required!");
    if (authMode === "signup" && password !== retypePassword) {
      return alert("Passwords do not match!");
    }
    if (authMode === "signup" && role === "admin" && !username) {
      return alert("Username is required for Admin signup!");
    }

    setLoading(true);
    try {
      let endpoint = "";
      let payload = {};

      // Route Logic
      if (role === "admin") {
        endpoint =
          authMode === "signup"
            ? "http://localhost:5001/signup"
            : "http://localhost:5001/signin";
        payload =
          authMode === "signup"
            ? { username, email, password }
            : { email, password };
      } else {
        // Adjust these endpoints to match your student routes setup
        endpoint =
          authMode === "signup"
            ? "http://localhost:5001/api/students/student-signup"
            : "http://localhost:5001/api/students/student-login";
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
          alert(
            role === "admin"
              ? "Admin Signup successful! Please log in."
              : "Account claimed successfully! Please log in.",
          );
          setAuthMode("login");
          setFormData({ ...formData, password: "", retypePassword: "" }); // Clear passwords
        } else {
          // Login Success: Save data and redirect
          localStorage.setItem("userRole", data.role || role);
          if (role === "student")
            localStorage.setItem("studentUrn", data.urn || urn);

          window.location.href =
            role === "admin" ? "/dashboard" : "/student-dashboard";
        }
      } else {
        alert(data.message || "Authentication failed");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* 🎨 LEFT SIDE: Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#0F172A] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 z-0"></div>
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]"></div>

        <div className="relative z-10 text-white max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Smart Attendance System
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Manage your classroom <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              intelligently.
            </span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed mb-8">
            The automated attendance platform powered by facial recognition
            technology. Secure, fast, and completely paperless.
          </p>
        </div>
      </div>

      {/* 📝 RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          {/* 🟢 NEW: ROLE SELECTOR PILLS */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-full inline-flex gap-1">
              <button
                onClick={() => {
                  setRole("admin");
                  setFormData({
                    ...formData,
                    urn: "",
                    email: "",
                    username: "",
                  });
                }}
                className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                  role === "admin"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FaUserShield /> Teacher / Admin
              </button>
              <button
                onClick={() => {
                  setRole("student");
                  setFormData({
                    ...formData,
                    urn: "",
                    email: "",
                    username: "",
                  });
                }}
                className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                  role === "student"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FaUserGraduate /> Student
              </button>
            </div>
          </div>

          {/* 🔙 ORIGINAL: MODE TOGGLE */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setFormData({ ...formData, password: "", retypePassword: "" });
              }}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${
                authMode === "login"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setFormData({ ...formData, password: "", retypePassword: "" });
              }}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${
                authMode === "signup"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {role === "student" ? "Claim Account" : "Create Account"}
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {authMode === "login" ? "Welcome Back" : "Get Started"}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {role === "admin"
              ? authMode === "login"
                ? "Enter your credentials to access the admin panel."
                : "Create your admin account to manage students."
              : authMode === "login"
                ? "Login to view your attendance portal."
                : "Enter your URN to set up your password."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ADMIN ONLY: Username (For Signup) */}
            {role === "admin" && authMode === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Username
                </label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="Choose a username"
                  />
                </div>
              </div>
            )}

            {/* IDENTIFIER FIELD (Email for Admin, URN for Student) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                {role === "admin" ? "Email Address" : "Student URN"}
              </label>
              <div className="relative">
                {role === "admin" ? (
                  <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
                ) : (
                  <FaUser className="absolute left-4 top-3.5 text-gray-400" />
                )}
                <input
                  type={role === "admin" ? "email" : "text"}
                  name={role === "admin" ? "email" : "urn"}
                  value={role === "admin" ? formData.email : formData.urn}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono"
                  placeholder={
                    role === "admin" ? "admin@college.edu" : "Ex. 276001"
                  }
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD (For Signup Only) */}
            {authMode === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Confirm Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-3.5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="retypePassword"
                    value={formData.retypePassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  {authMode === "login"
                    ? role === "admin"
                      ? "Sign In to Dashboard"
                      : "Enter Student Portal"
                    : role === "admin"
                      ? "Create Admin Account"
                      : "Claim My Account"}
                  <FaArrowRight />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signin;
