import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBrain,
  FaShieldAlt,
  FaBolt,
  FaChartPie,
  FaCamera,
} from "react-icons/fa";

const LandingPage = () => {
  // 🟢 SMART LOGIC: Check if someone is already logged in
  const loggedInRole = localStorage.getItem("userRole");

  const getDashboardLink = () => {
    if (loggedInRole === "admin") return "/dashboard";
    if (loggedInRole === "teacher") return "/teacherdashboard";
    if (loggedInRole === "student") return "/student-dashboard";
    return "/signin"; // Fallback
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* 🟢 BACKGROUND GLOW EFFECTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* 🟢 NAVBAR */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <FaCamera className="text-white text-xl" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            SmartTrack<span className="text-blue-500"></span>
          </span>
        </div>

        {/* 🟢 DYNAMIC DOORS: Show "Return to Portal" if logged in, else show Staff & Student links */}
        <div className="flex items-center gap-6">
          {loggedInRole ? (
            <Link
              to={getDashboardLink()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all"
            >
              Return to Portal
            </Link>
          ) : (
            <>
              {/* 🟢 CONSOLIDATED STAFF BUTTON */}
              <Link
                to="/signin"
                state={{ defaultRole: "admin", defaultMode: "login" }}
                className="text-sm font-bold text-gray-300 hover:text-white transition-colors"
              >
                Staff Portal
              </Link>
              <Link
                to="/signin"
                state={{ defaultRole: "student", defaultMode: "login" }}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-sm font-bold backdrop-blur-md transition-all"
              >
                Student Login
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 🟢 HERO SECTION */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col lg:flex-row items-center justify-between gap-16">
        {/* Left Text Content */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            DeepFace Integration Active
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            Automate attendance with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Facial Recognition.
            </span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            A secure, full-stack biometric management system. Powered by the
            MERN stack and Python AI microservices to eliminate proxy attendance
            and paper trails.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            {/* 🟢 DYNAMIC HERO BUTTON */}
            <Link
              to={loggedInRole ? getDashboardLink() : "/signin"}
              state={
                !loggedInRole
                  ? { defaultRole: "admin", defaultMode: "login" }
                  : null
              }
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              {loggedInRole ? "Return to Portal" : "Access System"}{" "}
              <FaArrowRight />
            </Link>
            <a
              href="#architecture"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center justify-center transition-all backdrop-blur-sm"
            >
              View Architecture
            </a>
          </div>
        </div>

        {/* Right Visual Element (The Simulated Scanner) */}
        <div className="flex-1 w-full max-w-md relative">
          <div className="aspect-square rounded-3xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 p-8 relative overflow-hidden backdrop-blur-sm shadow-2xl">
            {/* The Animated Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_5px_rgba(59,130,246,0.5)] animate-[scan_3s_ease-in-out_infinite]"></div>

            {/* The Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

            {/* The Fake Target Face */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Corner Markers */}
                <div className="absolute -top-4 -left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute -top-4 -right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute -bottom-4 -right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>

                {/* Center Icon */}
                <FaCamera className="text-8xl text-white/20" />

                {/* Fake Recognition Data overlay */}
                <div className="absolute -right-24 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-xl hidden sm:block">
                  <div className="text-[10px] text-blue-400 font-mono mb-1">
                    MATCH FOUND
                  </div>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[98%] h-full bg-blue-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 🟢 ARCHITECTURE FEATURES */}
      <section
        id="architecture"
        className="relative z-10 bg-black/20 border-y border-white/5 py-24"
      >
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Enterprise-Grade Architecture
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built with modern frameworks to ensure speed, accuracy, and
              absolute data security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center text-xl mb-4">
                <FaBrain />
              </div>
              <h3 className="font-bold text-lg mb-2">Python AI Engine</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Utilizes the DeepFace library running on an isolated Flask
                microservice for lightning-fast biometric mapping.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-xl mb-4">
                <FaShieldAlt />
              </div>
              <h3 className="font-bold text-lg mb-2">Role-Based Security</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Strict JWT authentication separating Master Admins, Faculty, and
                Students to prevent data tampering.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center text-xl mb-4">
                <FaChartPie />
              </div>
              <h3 className="font-bold text-lg mb-2">Real-Time Analytics</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Dynamic dashboards built in React that instantly calculate
                complex attendance averages and status.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-xl mb-4">
                <FaBolt />
              </div>
              <h3 className="font-bold text-lg mb-2">Automated Warnings</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                A Node-Cron engine evaluates attendance rules weekly and
                triggers automated Nodemailer warnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>
          © {new Date().getFullYear()} SmartTrack Attendance System. All rights
          reserved.
        </p>
      </footer>

      {/* 🟢 REQUIRED CSS FOR THE SCANNER ANIMATION */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { top: 100%; }
        }
      `,
        }}
      />
    </div>
  );
};

export default LandingPage;
