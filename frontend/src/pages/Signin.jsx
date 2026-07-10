// import React, { useState, useEffect } from "react";
// import {
//   FaUser,
//   FaEnvelope,
//   FaLock,
//   FaArrowRight,
//   FaEye,
//   FaEyeSlash,
//   FaUserGraduate,
//   FaUserShield,
//   FaServer,
// } from "react-icons/fa";
// import { useLocation } from "react-router-dom";
// import toast from "react-hot-toast"; // 🟢 NEW: Imported React Hot Toast

// const Signin = () => {
//   const location = useLocation();
//   // 🟢 SYSTEM STATUS STATE (checking, setup, ready)
//   const [systemStatus, setSystemStatus] = useState("checking");

//   const [role, setRole] = useState("admin");
//   const [authMode, setAuthMode] = useState("login");
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);

//   // 🟢 FORGOT PASSWORD STATES
//   const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
//   const [forgotEmail, setForgotEmail] = useState("");
//   const [forgotMessage, setForgotMessage] = useState("");
//   const [isForgotLoading, setIsForgotLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     username: "", // Only used for initial setup
//     email: "",
//     urn: "",
//     password: "",
//     retypePassword: "",
//   });

//   // 🟢 AUTO-LOGIN CHECK: If already logged in, skip the login page!
//   useEffect(() => {
//     const existingRole = localStorage.getItem("userRole");
//     if (existingRole) {
//       if (existingRole === "student") {
//         window.location.href = "/student-dashboard";
//       } else if (existingRole === "teacher") {
//         window.location.href = "/teacherdashboard";
//       } else if (existingRole === "admin") {
//         window.location.href = "/dashboard";
//       }
//     }
//   }, []);

//   useEffect(() => {
//     const checkSystemStatus = async () => {
//       try {
//         const response = await fetch(
//           "http://localhost:5001/api/system/setup-status",
//         );
//         const data = await response.json();

//         if (data.setupRequired) {
//           setSystemStatus("setup");
//         } else {
//           setSystemStatus("ready");
//         }
//       } catch (err) {
//         console.error("Failed to check system status:", err);
//         // If the check fails, default to secure/locked mode
//         setSystemStatus("ready");
//       }
//     };

//     checkSystemStatus();
//   }, []);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // 🟢 FORGOT PASSWORD HANDLER
//   const handleForgotPassword = async (e) => {
//     e.preventDefault();
//     setIsForgotLoading(true);
//     setForgotMessage("");

//     // 🟢 NEW: Loading Toast
//     const resetToast = toast.loading("Sending reset link...");

//     try {
//       const response = await fetch(
//         "http://localhost:5001/api/security/forgot-password",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ email: forgotEmail }),
//         },
//       );

//       const data = await response.json();

//       if (response.ok) {
//         setForgotMessage(data.message);
//         toast.success("Reset link sent to your email!", { id: resetToast });
//       } else {
//         const errorMsg = data.message || "An error occurred.";
//         setForgotMessage(errorMsg);
//         toast.error(errorMsg, { id: resetToast });
//       }
//     } catch (err) {
//       setForgotMessage("Failed to connect to the server.");
//       toast.error("Failed to connect to the server.", { id: resetToast });
//     } finally {
//       setIsForgotLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const { username, email, urn, password, retypePassword } = formData;

//     // 🟢 INITIAL SETUP LOGIC
//     if (systemStatus === "setup") {
//       // 🟢 NEW: Replaced alerts with error toasts
//       if (!username || !email || !password || !retypePassword)
//         return toast.error("All fields are required!");
//       if (password !== retypePassword)
//         return toast.error("Passwords do not match!");
//       if (password.length < 6)
//         return toast.error("Password must be at least 6 characters.");

//       setLoading(true);
//       const setupToast = toast.loading("Initializing Master Admin...");

//       try {
//         const response = await fetch(
//           "http://localhost:5001/api/system/setup-admin",
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ username, email, password }),
//           },
//         );
//         const data = await response.json();

//         if (response.ok) {
//           // 🟢 NEW: Custom success toast with confetti icon
//           toast.success("Master Admin created! System is locked down.", {
//             id: setupToast,
//             icon: "🎉",
//             duration: 4000,
//           });
//           setSystemStatus("ready"); // Instantly switch to secure mode!
//           setFormData({
//             email: "",
//             urn: "",
//             password: "",
//             retypePassword: "",
//             username: "",
//           });
//         } else {
//           toast.error(data.message || "Setup failed.", { id: setupToast });
//         }
//       } catch (err) {
//         toast.error("Error during setup: " + err.message, { id: setupToast });
//       } finally {
//         setLoading(false);
//       }
//       return; // Stop here so it doesn't run the login logic below
//     }

//     // 🟢 STANDARD LOGIN & CLAIM LOGIC
//     // 🟢 NEW: Replaced alerts with error toasts
//     if (role === "admin" && !email)
//       return toast.error("Login identifier is required!");
//     if (role === "student" && !urn) return toast.error("URN is required!");
//     if (!password) return toast.error("Password is required!");

//     setLoading(true);

//     // 🟢 NEW: Dynamic loading message
//     const authToast = toast.loading(
//       authMode === "signup" ? "Claiming your account..." : "Authenticating...",
//     );

//     try {
//       let endpoint = "";
//       let payload = {};

//       if (role === "admin") {
//         endpoint = "http://localhost:5001/signin";
//         payload = { email, password };
//       } else {
//         endpoint =
//           authMode === "signup"
//             ? "http://localhost:5001/api/students/student-signup"
//             : "http://localhost:5001/api/students/student-login";
//         payload = { urn, password };
//       }

//       const response = await fetch(endpoint, {
//         method: "POST",
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         if (authMode === "signup") {
//           // 🟢 NEW: Success toast for signup
//           toast.success("Account claimed successfully! Please log in.", {
//             id: authToast,
//             icon: "🎓",
//           });
//           setAuthMode("login");
//           setFormData({ ...formData, password: "", retypePassword: "" });
//         } else {
//           // 🟢 NEW: Success toast for login
//           toast.success("Welcome back!", { id: authToast });

//           const loggedInRole = data.role || role;
//           localStorage.setItem("userRole", loggedInRole);
//           localStorage.setItem("adminName", data.admin?.username || "Admin");

//           if (loggedInRole === "student") {
//             localStorage.setItem("studentUrn", data.urn || urn);
//             window.location.href = "/student-dashboard";
//           } else if (loggedInRole === "teacher") {
//             localStorage.setItem("teacherId", data.teacher.teacherId);
//             window.location.href = "/teacherdashboard";
//           } else {
//             window.location.href = "/dashboard";
//           }
//         }
//       } else {
//         toast.error(
//           data.message?.message || data.message || "Authentication failed",
//           { id: authToast },
//         );
//       }
//     } catch (err) {
//       toast.error("Network Error: " + err.message, { id: authToast });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🟢 SHOW A LOADER WHILE CHECKING THE DATABASE
//   if (systemStatus === "checking") {
//     return (
//       <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
//         <div className="text-gray-500 font-bold flex flex-col items-center gap-4 animate-pulse">
//           <FaServer size={40} className="text-blue-500" />
//           Checking System Status...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex min-h-screen w-full bg-gray-50 relative">
//       {/* 🎨 LEFT SIDE: Branding */}
//       <div className="hidden lg:flex w-1/2 bg-[#0F172A] relative overflow-hidden items-center justify-center p-12">
//         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 z-0"></div>
//         <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
//         <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]"></div>

//         <div className="relative z-10 text-white max-w-lg">
//           <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm font-medium">
//             <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
//             Smart Attendance System
//           </div>
//           <h1 className="text-5xl font-bold mb-6 leading-tight">
//             Manage your classroom <br />
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
//               intelligently.
//             </span>
//           </h1>
//           <p className="text-lg text-slate-300 leading-relaxed mb-8">
//             The automated attendance platform powered by facial recognition
//             technology. Secure, fast, and completely paperless.
//           </p>
//         </div>
//       </div>

//       {/* 📝 RIGHT SIDE: Form */}
//       <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12">
//         <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
//           {/* ========================================================
//               🛠️ FIRST-TIME SETUP UI
//               ======================================================== */}
//           {systemStatus === "setup" ? (
//             <div className="animate-fadeIn">
//               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3 mb-6">
//                 <FaServer className="text-indigo-500 mt-1 flex-shrink-0" />
//                 <div>
//                   <h3 className="font-bold text-indigo-800 text-sm">
//                     System Initialization
//                   </h3>
//                   <p className="text-xs text-indigo-600 mt-1">
//                     No administrators found. Please create the Master Admin
//                     account to lock down the system and secure the database.
//                   </p>
//                 </div>
//               </div>

//               <h2 className="text-2xl font-bold text-gray-800 mb-2">
//                 Master Setup
//               </h2>
//               <p className="text-gray-500 text-sm mb-6">
//                 Create your root credentials.
//               </p>

//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div className="space-y-1">
//                   <label className="text-xs font-bold text-gray-500 uppercase">
//                     Admin Username
//                   </label>
//                   <div className="relative">
//                     <FaUser className="absolute left-4 top-3.5 text-gray-400" />
//                     <input
//                       type="text"
//                       name="username"
//                       value={formData.username}
//                       onChange={handleChange}
//                       required
//                       className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
//                       placeholder="e.g., First_admin"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1">
//                   <label className="text-xs font-bold text-gray-500 uppercase">
//                     Email Address
//                   </label>
//                   <div className="relative">
//                     <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
//                     <input
//                       type="email"
//                       name="email"
//                       value={formData.email}
//                       onChange={handleChange}
//                       required
//                       className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
//                       placeholder="admin@gmail.com"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1">
//                   <label className="text-xs font-bold text-gray-500 uppercase">
//                     Master Password
//                   </label>
//                   <div className="relative">
//                     <FaLock className="absolute left-4 top-3.5 text-gray-400" />
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       name="password"
//                       value={formData.password}
//                       onChange={handleChange}
//                       required
//                       className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
//                       placeholder="••••••••"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-4 top-3.5 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors"
//                     >
//                       {showPassword ? <FaEyeSlash /> : <FaEye />}
//                     </button>
//                   </div>
//                 </div>

//                 <div className="space-y-1">
//                   <label className="text-xs font-bold text-gray-500 uppercase">
//                     Confirm Password
//                   </label>
//                   <div className="relative">
//                     <FaLock className="absolute left-4 top-3.5 text-gray-400" />
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       name="retypePassword"
//                       value={formData.retypePassword}
//                       onChange={handleChange}
//                       required
//                       className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
//                       placeholder="••••••••"
//                     />
//                   </div>
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 active:scale-[0.98]"
//                 >
//                   {loading ? "Initializing..." : "Secure System & Setup Admin"}{" "}
//                   <FaArrowRight />
//                 </button>
//               </form>
//             </div>
//           ) : (
//             /* ========================================================
//              🔒 STANDARD LOGIN UI (If system is already setup)
//              ======================================================== */
//             <div className="animate-fadeIn">
//               <div className="flex justify-center mb-6">
//                 <div className="bg-gray-100 p-1 rounded-full inline-flex gap-1">
//                   <button
//                     onClick={() => {
//                       setRole("admin");
//                       setAuthMode("login");
//                       setFormData({
//                         email: "",
//                         urn: "",
//                         password: "",
//                         retypePassword: "",
//                         username: "",
//                       });
//                     }}
//                     className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${role === "admin" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
//                   >
//                     <FaUserShield /> Teacher / Admin
//                   </button>
//                   <button
//                     onClick={() => {
//                       setRole("student");
//                       setFormData({
//                         email: "",
//                         urn: "",
//                         password: "",
//                         retypePassword: "",
//                         username: "",
//                       });
//                     }}
//                     className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${role === "student" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
//                   >
//                     <FaUserGraduate /> Student
//                   </button>
//                 </div>
//               </div>

//               {role === "student" ? (
//                 <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setAuthMode("login");
//                       setFormData({
//                         ...formData,
//                         password: "",
//                         retypePassword: "",
//                       });
//                     }}
//                     className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${authMode === "login" ? "bg-white text-blue-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
//                   >
//                     Log In
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setAuthMode("signup");
//                       setFormData({
//                         ...formData,
//                         password: "",
//                         retypePassword: "",
//                       });
//                     }}
//                     className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${authMode === "signup" ? "bg-white text-blue-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
//                   >
//                     Claim Account
//                   </button>
//                 </div>
//               ) : (
//                 <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
//                   <div className="flex-1 py-3 text-sm font-bold rounded-lg bg-white text-blue-600 shadow-sm text-center border border-gray-200">
//                     Staff Login Portal
//                   </div>
//                 </div>
//               )}

//               <h2 className="text-2xl font-bold text-gray-800 mb-2">
//                 {authMode === "login" ? "Welcome Back" : "Get Started"}
//               </h2>
//               <p className="text-gray-500 text-sm mb-8">
//                 {role === "admin"
//                   ? "Enter your credentials to access your portal."
//                   : authMode === "login"
//                     ? "Login to view your attendance portal."
//                     : "Enter your URN to set up your password."}
//               </p>

//               <form onSubmit={handleSubmit} className="space-y-5">
//                 <div className="space-y-1">
//                   <label className="text-xs font-bold text-gray-500 uppercase">
//                     {role === "admin" ? "Email or Teacher ID" : "Student URN"}
//                   </label>
//                   <div className="relative">
//                     {role === "admin" ? (
//                       <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
//                     ) : (
//                       <FaUser className="absolute left-4 top-3.5 text-gray-400" />
//                     )}
//                     <input
//                       type="text"
//                       name={role === "admin" ? "email" : "urn"}
//                       value={role === "admin" ? formData.email : formData.urn}
//                       onChange={handleChange}
//                       required
//                       className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono"
//                       placeholder={
//                         role === "admin"
//                           ? "teacher@gmail.com or TA2025"
//                           : "Ex. 276001"
//                       }
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1">
//                   <label className="text-xs font-bold text-gray-500 uppercase">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <FaLock className="absolute left-4 top-3.5 text-gray-400" />
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       name="password"
//                       value={formData.password}
//                       onChange={handleChange}
//                       required
//                       className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//                       placeholder="••••••••"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-600 focus:outline-none transition-colors"
//                     >
//                       {showPassword ? <FaEyeSlash /> : <FaEye />}
//                     </button>
//                   </div>
//                 </div>

//                 {/* 🟢 FORGOT PASSWORD LINK (Only on Login mode) */}
//                 {authMode === "login" && (
//                   <div className="text-right">
//                     <button
//                       type="button"
//                       onClick={() => setIsForgotModalOpen(true)}
//                       className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
//                     >
//                       Forgot Password?
//                     </button>
//                   </div>
//                 )}

//                 {authMode === "signup" && role === "student" && (
//                   <div className="space-y-1">
//                     <label className="text-xs font-bold text-gray-500 uppercase">
//                       Confirm Password
//                     </label>
//                     <div className="relative">
//                       <FaLock className="absolute left-4 top-3.5 text-gray-400" />
//                       <input
//                         type={showPassword ? "text" : "password"}
//                         name="retypePassword"
//                         value={formData.retypePassword}
//                         onChange={handleChange}
//                         required
//                         className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//                         placeholder="••••••••"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 active:scale-[0.98]"}`}
//                 >
//                   {loading ? (
//                     "Processing..."
//                   ) : (
//                     <>
//                       {authMode === "login"
//                         ? role === "admin"
//                           ? "Sign In to Portal"
//                           : "Enter Student Portal"
//                         : "Claim My Account"}{" "}
//                       <FaArrowRight />
//                     </>
//                   )}
//                 </button>
//               </form>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ========================================================
//           🟢 FORGOT PASSWORD MODAL (Overlay)
//           ======================================================== */}
//       {isForgotModalOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeIn">
//             {/* Close Button */}
//             <button
//               onClick={() => {
//                 setIsForgotModalOpen(false);
//                 setForgotMessage("");
//                 setForgotEmail("");
//               }}
//               className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
//             >
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M6 18L18 6M6 6l12 12"
//                 />
//               </svg>
//             </button>

//             <div className="mb-6 text-center">
//               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <FaLock size={20} />
//               </div>
//               <h2 className="text-2xl font-bold text-gray-800">
//                 Reset Password
//               </h2>
//               <p className="text-sm text-gray-500 mt-2">
//                 Enter your registered email address and we will send you a
//                 secure reset link.
//               </p>
//             </div>

//             <form onSubmit={handleForgotPassword} className="space-y-4">
//               <div className="relative">
//                 <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
//                 <input
//                   type="email"
//                   required
//                   placeholder="Enter your email"
//                   value={forgotEmail}
//                   onChange={(e) => setForgotEmail(e.target.value)}
//                   className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={isForgotLoading}
//                 className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-lg hover:shadow-blue-500/30"
//               >
//                 {isForgotLoading ? "Sending Link..." : "Send Reset Link"}
//               </button>
//             </form>

//             {/* Status Message */}
//             {forgotMessage && (
//               <div
//                 className={`mt-6 p-4 text-sm text-center rounded-xl font-medium ${forgotMessage.includes("sent") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
//               >
//                 {forgotMessage}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Signin;

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

// 🟢 NEW: Dynamic URL router. Uses Vercel environment variable in production, localhost in development.
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
    const existingRole = localStorage.getItem("userRole");
    if (existingRole) {
      if (existingRole === "student") {
        window.location.href = "/student-dashboard";
      } else if (existingRole === "teacher") {
        window.location.href = "/teacherdashboard";
      } else if (existingRole === "admin") {
        window.location.href = "/dashboard";
      }
    }
  }, []);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        // 🟢 UPDATED: Using dynamic BACKEND_URL
        const response = await fetch(`${BACKEND_URL}/api/system/setup-status`);
        const data = await response.json();

        if (data.setupRequired) {
          setSystemStatus("setup");
        } else {
          setSystemStatus("ready");
        }
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
      // 🟢 UPDATED: Using dynamic BACKEND_URL
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
        // 🟢 UPDATED: Using dynamic BACKEND_URL
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
        // 🟢 UPDATED: Using dynamic BACKEND_URL
        endpoint = `${BACKEND_URL}/signin`;
        payload = { email, password };
      } else {
        // 🟢 UPDATED: Using dynamic BACKEND_URL
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

  if (systemStatus === "checking") {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 font-bold flex flex-col items-center gap-4 animate-pulse">
          <FaServer size={40} className="text-blue-500" />
          Checking System Status...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 relative">
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

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          {systemStatus === "setup" ? (
            <div className="animate-fadeIn">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3 mb-6">
                <FaServer className="text-indigo-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-indigo-800 text-sm">
                    System Initialization
                  </h3>
                  <p className="text-xs text-indigo-600 mt-1">
                    No administrators found. Please create the Master Admin
                    account to lock down the system and secure the database.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Master Setup
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Create your root credentials.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Admin Username
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      placeholder="e.g., First_admin"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      placeholder="admin@gmail.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Master Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

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
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 active:scale-[0.98]"
                >
                  {loading ? "Initializing..." : "Secure System & Setup Admin"}{" "}
                  <FaArrowRight />
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-full inline-flex gap-1">
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
                    className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${role === "admin" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <FaUserShield /> Teacher / Admin
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
                    className={`px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${role === "student" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <FaUserGraduate /> Student
                  </button>
                </div>
              </div>

              {role === "student" ? (
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
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
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${authMode === "login" ? "bg-white text-blue-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
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
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${authMode === "signup" ? "bg-white text-blue-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Claim Account
                  </button>
                </div>
              ) : (
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                  <div className="flex-1 py-3 text-sm font-bold rounded-lg bg-white text-blue-600 shadow-sm text-center border border-gray-200">
                    Staff Login Portal
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {authMode === "login" ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                {role === "admin"
                  ? "Enter your credentials to access your portal."
                  : authMode === "login"
                    ? "Login to view your attendance portal."
                    : "Enter your URN to set up your password."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    {role === "admin" ? "Email or Teacher ID" : "Student URN"}
                  </label>
                  <div className="relative">
                    {role === "admin" ? (
                      <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
                    ) : (
                      <FaUser className="absolute left-4 top-3.5 text-gray-400" />
                    )}
                    <input
                      type="text"
                      name={role === "admin" ? "email" : "urn"}
                      value={role === "admin" ? formData.email : formData.urn}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono"
                      placeholder={
                        role === "admin"
                          ? "teacher@gmail.com or TA2025"
                          : "Ex. 276001"
                      }
                    />
                  </div>
                </div>

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
                      required
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

                {authMode === "login" && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {authMode === "signup" && role === "student" && (
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
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 active:scale-[0.98]"}`}
                >
                  {loading ? (
                    "Processing..."
                  ) : (
                    <>
                      {authMode === "login"
                        ? role === "admin"
                          ? "Sign In to Portal"
                          : "Enter Student Portal"
                        : "Claim My Account"}{" "}
                      <FaArrowRight />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeIn">
            <button
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotMessage("");
                setForgotEmail("");
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

            <div className="mb-6 text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Reset Password
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Enter your registered email address and we will send you a
                secure reset link.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isForgotLoading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-lg hover:shadow-blue-500/30"
              >
                {isForgotLoading ? "Sending Link..." : "Send Reset Link"}
              </button>
            </form>

            {forgotMessage && (
              <div
                className={`mt-6 p-4 text-sm text-center rounded-xl font-medium ${forgotMessage.includes("sent") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
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
