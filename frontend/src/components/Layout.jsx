import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaBars } from "react-icons/fa";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden relative selection:bg-indigo-100">
      {/* Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Wrapper */}
      <div className="flex flex-col flex-1 w-full relative z-10">
        {/* Mobile Top Header (Glassmorphism) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/70 backdrop-blur-xl shadow-sm border-b border-slate-200/50 px-4 py-3 flex justify-between items-center transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[12px] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200/50">
              ST
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">
              SmartTrack
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open Menu"
            className="p-2.5 text-slate-600 bg-white border border-slate-200/50 shadow-sm hover:bg-slate-50 hover:text-indigo-600 rounded-[12px] transition-all active:scale-95 focus:outline-none"
          >
            <FaBars size={18} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 w-full scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
