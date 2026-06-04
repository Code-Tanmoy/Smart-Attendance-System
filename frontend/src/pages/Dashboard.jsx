// import React, { useState, useEffect } from "react";
// import {
//   FaUserGraduate,
//   FaClipboardList,
//   FaUsers,
//   FaTimes,
//   FaUniversity,
// } from "react-icons/fa";
// import { backend } from "../services/api";
// import toast from "react-hot-toast";

// const Dashboard = () => {
//   const [attendance, setAttendance] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [subjects, setSubjects] = useState([]);

//   // Pagination & Filter State
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(5);
//   const [selectedDept, setSelectedDept] = useState("All");
//   const [selectedDate, setSelectedDate] = useState("");

//   // ✍️ MANUAL ENTRY STATE
//   const [manualUrn, setManualUrn] = useState("");
//   const [manualDept, setManualDept] = useState("All");
//   const [manualSemester, setManualSemester] = useState("All");
//   const [manualSubjectId, setManualSubjectId] = useState("");
//   const [manualDate, setManualDate] = useState("");

//   // 🟢 NEW: Extracted fetchData so we can refresh the table WITHOUT reloading the page!
//   const fetchData = async () => {
//     try {
//       const [attRes, stuRes, subRes] = await Promise.all([
//         backend.get(`/api/attendance?_t=${Date.now()}`),
//         backend.get(`/api/students?_t=${Date.now()}`),
//         backend.get(`/api/subjects?_t=${Date.now()}`),
//       ]);
//       setAttendance(attRes.data);
//       setStudents(stuRes.data);
//       setSubjects(subRes.data);
//     } catch (err) {
//       console.error("Error fetching dashboard data:", err);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const handleManualAttendance = async () => {
//     if (!manualUrn || !manualSubjectId) {
//       toast.error("Please enter URN and select a Class Session.");
//       return;
//     }

//     const selectedSub = subjects.find((s) => s._id === manualSubjectId);
//     let recognizedTimestamp = new Date();

//     if (selectedSub) {
//       const dateToUse = manualDate || new Date().toISOString().split("T")[0];
//       recognizedTimestamp = new Date(
//         `${dateToUse}T${selectedSub.startTime}:00`,
//       );

//       if (recognizedTimestamp > new Date()) {
//         toast.error(
//           "You cannot mark attendance for a class that hasn't started yet!",
//           { icon: "⏳" },
//         );
//         return;
//       }
//     }

//     const entryToast = toast.loading("Marking manual attendance...");

//     try {
//       const res = await backend.post("/api/periodwise-attendance", {
//         urn: manualUrn,
//         subjectId: manualSubjectId,
//         recognizedAt: recognizedTimestamp.toISOString(),
//       });

//       toast.success(res.data.message, { id: entryToast });

//       // Clear the URN field so they can type the next one quickly
//       setManualUrn("");

//       // 🟢 NEW: Silently refresh the table data without refreshing the browser!
//       fetchData();
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to mark attendance.", {
//         id: entryToast,
//       });
//     }
//   };

//   // 🧠 CORE CALCULATION & FILTER ENGINE
//   const targetDate = selectedDate || new Date().toISOString().split("T")[0];

//   const filteredStudents = students.filter((s) => {
//     const matchDept = selectedDept === "All" || s.department === selectedDept;
//     const isActive = s.status === "Active" || !s.status;
//     return matchDept && isActive;
//   });

//   const totalStudents = filteredStudents.length;

//   const filteredAttendance = attendance.filter((log) => {
//     const matchDept = selectedDept === "All" || log.course === selectedDept;
//     const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
//     const matchDate = selectedDate ? logDate === selectedDate : true;
//     return matchDept && matchDate;
//   });

//   const presentRecords = attendance.filter((log) => {
//     const matchDept = selectedDept === "All" || log.course === selectedDept;
//     const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
//     return matchDept && logDate === targetDate;
//   });

//   const uniquePresentCount = new Set(presentRecords.map((log) => log.urn)).size;
//   const absentStudents = totalStudents - uniquePresentCount;
//   const safeAbsent = absentStudents < 0 ? 0 : absentStudents;
//   const attendanceRate =
//     totalStudents > 0
//       ? ((uniquePresentCount / totalStudents) * 100).toFixed(0)
//       : 0;

//   // Pagination Logic
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentAttendance = filteredAttendance.slice(
//     indexOfFirstItem,
//     indexOfLastItem,
//   );
//   const paginate = (pageNumber) => setCurrentPage(pageNumber);

//   const filteredManualSubjects = subjects.filter((sub) => {
//     const matchDept = manualDept === "All" || sub.department === manualDept;
//     const matchSem =
//       manualSemester === "All" || sub.semester === manualSemester;
//     return matchDept && matchSem;
//   });

//   return (
//     <>
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold text-gray-800 mt-1">Overview</h1>
//         <p className="text-gray-600 text-sm">
//           {selectedDate
//             ? `Statistics for ${selectedDate}`
//             : "Real-time statistics for Today"}
//         </p>
//       </div>

//       {/* 📊 DYNAMIC STATS CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-6 text-white shadow-lg">
//           <div className="flex items-center justify-between relative z-10">
//             <div>
//               <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
//                 Active Students {selectedDept !== "All" && `(${selectedDept})`}
//               </p>
//               <h3 className="text-4xl font-bold mt-2">{totalStudents}</h3>
//             </div>
//             <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
//               <FaUserGraduate className="text-2xl" />
//             </div>
//           </div>
//         </div>

//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
//           <div className="flex items-center justify-between relative z-10">
//             <div>
//               <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
//                 Present {selectedDate ? "On Date" : "Today"}
//               </p>
//               <h3 className="text-4xl font-bold mt-2">{uniquePresentCount}</h3>
//             </div>
//             <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
//               <FaClipboardList className="text-2xl" />
//             </div>
//           </div>
//           <div className="mt-4 flex items-center gap-2 text-xs font-medium relative z-10">
//             <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">
//               {attendanceRate}% Rate
//             </span>
//           </div>
//         </div>

//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white shadow-lg">
//           <div className="flex items-center justify-between relative z-10">
//             <div>
//               <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
//                 Absent {selectedDate ? "On Date" : "Today"}
//               </p>
//               <h3 className="text-4xl font-bold mt-2">{safeAbsent}</h3>
//             </div>
//             <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
//               <FaUsers className="text-2xl" />
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="w-full flex flex-col xl:flex-row gap-6">
//         {/* 📋 ATTENDANCE LOGS TABLE */}
//         <div className="bg-white w-full xl:w-2/3 rounded-2xl shadow-sm border border-gray-100 p-6">
//           <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
//             <h1 className="text-gray-800 text-lg font-bold">Recent Logs</h1>

//             {/* 🔍 FILTER CONTROLS */}
//             <div className="flex flex-wrap items-center gap-3">
//               <div className="relative">
//                 <input
//                   type="date"
//                   value={selectedDate}
//                   onChange={(e) => {
//                     setSelectedDate(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                   className="border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
//                 />
//                 {selectedDate && (
//                   <button
//                     onClick={() => {
//                       setSelectedDate("");
//                       setCurrentPage(1);
//                     }}
//                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-[8px]"
//                   >
//                     <FaTimes />
//                   </button>
//                 )}
//               </div>

//               <div className="relative">
//                 <FaUniversity className="absolute left-2 top-2.5 text-gray-400 text-xs" />
//                 <select
//                   value={selectedDept}
//                   onChange={(e) => {
//                     setSelectedDept(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                   className="border border-gray-200 bg-gray-50 pl-7 pr-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
//                 >
//                   <option value="All">All Depts</option>
//                   {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
//                     <option key={d} value={d}>
//                       {d}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="overflow-x-auto min-h-[300px]">
//             <table className="min-w-full table-auto text-sm text-left">
//               <thead>
//                 <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
//                   <th className="px-4 py-3 font-semibold">Student</th>
//                   <th className="px-4 py-3 font-semibold">URN</th>
//                   <th className="px-4 py-3 font-semibold">Dept</th>
//                   <th className="px-4 py-3 text-right font-semibold">
//                     Date & Time
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {currentAttendance.length > 0 ? (
//                   currentAttendance.map((log, index) => (
//                     <tr key={index} className="hover:bg-gray-50">
//                       <td className="px-4 py-3 font-medium text-gray-800">
//                         {log.name}
//                       </td>
//                       <td className="px-4 py-3 text-gray-500 font-mono text-xs">
//                         {log.urn}
//                       </td>
//                       <td className="px-4 py-3">
//                         <span className="px-2 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-md">
//                           {log.course}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 text-right font-bold text-gray-700">
//                         <div className="text-[10px] text-gray-400 font-medium mb-0.5 uppercase tracking-wider">
//                           {new Date(log.recognizedAt).toLocaleDateString(
//                             undefined,
//                             { month: "short", day: "numeric", year: "numeric" },
//                           )}
//                         </div>
//                         <div>
//                           {new Date(log.recognizedAt).toLocaleTimeString([], {
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })}
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan="4"
//                       className="text-center py-8 text-gray-400 italic"
//                     >
//                       No logs found for selected filters.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination Controls */}
//           <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
//             <span className="text-xs text-gray-400">
//               Showing {filteredAttendance.length > 0 ? indexOfFirstItem + 1 : 0}{" "}
//               to {Math.min(indexOfLastItem, filteredAttendance.length)} of{" "}
//               {filteredAttendance.length} entries
//             </span>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => paginate(currentPage - 1)}
//                 disabled={currentPage === 1}
//                 className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
//               >
//                 Prev
//               </button>
//               <button
//                 onClick={() => paginate(currentPage + 1)}
//                 disabled={indexOfLastItem >= filteredAttendance.length}
//                 className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* 📝 MANUAL ATTENDANCE FORM */}
//         <div className="bg-white w-full xl:w-1/3 rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
//           <h1 className="text-gray-800 text-lg font-bold mb-1">Manual Entry</h1>
//           <p className="text-gray-400 text-xs mb-6">
//             Mark attendance if scanner fails.
//           </p>

//           <div className="flex flex-col gap-4">
//             {/* 1. Cascading Department & Semester Filters */}
//             <div className="grid grid-cols-2 gap-2">
//               <div>
//                 <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
//                   Dept
//                 </label>
//                 <select
//                   value={manualDept}
//                   onChange={(e) => {
//                     setManualDept(e.target.value);
//                     setManualSubjectId("");
//                   }}
//                   className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
//                 >
//                   <option value="All">All</option>
//                   {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
//                     <option key={d} value={d}>
//                       {d}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
//                   Semester
//                 </label>
//                 <select
//                   value={manualSemester}
//                   onChange={(e) => {
//                     setManualSemester(e.target.value);
//                     setManualSubjectId("");
//                   }}
//                   className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
//                 >
//                   <option value="All">All</option>
//                   {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"].map(
//                     (sem) => (
//                       <option key={sem} value={sem}>
//                         {sem} Sem
//                       </option>
//                     ),
//                   )}
//                 </select>
//               </div>
//             </div>

//             {/* 2. Select Class Session */}
//             <div>
//               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
//                 Select Class Session
//               </label>
//               <select
//                 value={manualSubjectId}
//                 onChange={(e) => setManualSubjectId(e.target.value)}
//                 className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 disabled:opacity-50"
//                 disabled={filteredManualSubjects.length === 0}
//               >
//                 <option value="">-- Choose Class --</option>
//                 {filteredManualSubjects.map((sub) => (
//                   <option key={sub._id} value={sub._id}>
//                     {sub.name} ({sub.department} - {sub.semester} Sem)
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* 3. Date Override Only */}
//             <div>
//               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
//                 Choose Date
//               </label>
//               <input
//                 type="date"
//                 value={manualDate}
//                 max={new Date().toISOString().split("T")[0]}
//                 onChange={(e) => setManualDate(e.target.value)}
//                 className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-500"
//               />
//             </div>

//             {/* 4. Student URN */}
//             <div>
//               <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">
//                 Student URN
//               </label>
//               <input
//                 type="text"
//                 value={manualUrn}
//                 onChange={(e) => setManualUrn(e.target.value)}
//                 className="w-full text-sm rounded-xl bg-white border-2 border-blue-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none font-mono shadow-sm"
//                 placeholder="Ex. 276001"
//               />
//             </div>
//           </div>

//           <button
//             onClick={handleManualAttendance}
//             className="w-full mt-6 rounded-xl py-3 bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700 transition-all active:scale-[0.98]"
//           >
//             Mark Present
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Dashboard;

import React, { useState, useEffect, useMemo } from "react";
import {
  FaUserGraduate,
  FaClipboardList,
  FaUsers,
  FaUniversity,
  FaChartBar,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { backend } from "../services/api";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filter State
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");

  // ✍️ MANUAL ENTRY STATE
  const [manualUrn, setManualUrn] = useState("");
  const [manualDept, setManualDept] = useState("All");
  const [manualSemester, setManualSemester] = useState("All");
  const [manualSubjectId, setManualSubjectId] = useState("");
  const [manualDate, setManualDate] = useState("");

  const fetchData = async () => {
    try {
      const [attRes, stuRes, subRes] = await Promise.all([
        backend.get(`/api/attendance?_t=${Date.now()}`),
        backend.get(`/api/students?_t=${Date.now()}`),
        backend.get(`/api/subjects?_t=${Date.now()}`),
      ]);
      setAttendance(attRes.data);
      setStudents(stuRes.data);
      setSubjects(subRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualAttendance = async () => {
    if (!manualUrn || !manualSubjectId) {
      toast.error("Please enter URN and select a Class Session.");
      return;
    }

    const selectedSub = subjects.find((s) => s._id === manualSubjectId);
    let recognizedTimestamp = new Date();

    if (selectedSub) {
      const dateToUse = manualDate || new Date().toISOString().split("T")[0];
      recognizedTimestamp = new Date(
        `${dateToUse}T${selectedSub.startTime}:00`,
      );

      if (recognizedTimestamp > new Date()) {
        toast.error(
          "You cannot mark attendance for a class that hasn't started yet!",
          { icon: "⏳" },
        );
        return;
      }
    }

    const entryToast = toast.loading("Marking manual attendance...");

    try {
      const res = await backend.post("/api/periodwise-attendance", {
        urn: manualUrn,
        subjectId: manualSubjectId,
        recognizedAt: recognizedTimestamp.toISOString(),
      });

      toast.success(res.data.message, { id: entryToast });
      setManualUrn("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark attendance.", {
        id: entryToast,
      });
    }
  };

  // ==========================================
  // 🧠 CORE ANALYTICS ENGINE
  // ==========================================
  const targetDate = selectedDate || new Date().toISOString().split("T")[0];

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchDept = selectedDept === "All" || s.department === selectedDept;
      const isActive = s.status === "Active" || !s.status;
      return matchDept && isActive;
    });
  }, [students, selectedDept]);

  const presentUrnsToday = useMemo(() => {
    const presentRecords = attendance.filter((log) => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return logDate === targetDate;
    });
    return new Set(presentRecords.map((log) => log.urn));
  }, [attendance, targetDate]);

  // TOP CARDS STATS
  const totalStudents = filteredStudents.length;
  let uniquePresentCount = 0;
  filteredStudents.forEach((s) => {
    if (presentUrnsToday.has(s.urn)) uniquePresentCount++;
  });
  const safeAbsent = Math.max(0, totalStudents - uniquePresentCount);
  const attendanceRate = totalStudents > 0 ? Math.round((uniquePresentCount / totalStudents) * 100) : 0;

  // 📊 DEPARTMENT CHART DATA
  const departmentChartData = useMemo(() => {
    const depts = ["CSE", "ECE", "ME", "AI", "CS", "IT"];
    return depts.map((dept) => {
      const deptStudents = filteredStudents.filter((s) => s.department === dept);
      const total = deptStudents.length;
      if (total === 0) return { name: dept, percentage: 0, present: 0, total: 0 };

      let present = 0;
      deptStudents.forEach((s) => {
        if (presentUrnsToday.has(s.urn)) present++;
      });
      return {
        name: dept,
        percentage: Math.round((present / total) * 100),
        present: present,
        total: total,
      };
    });
  }, [filteredStudents, presentUrnsToday]);

  // Filters for Manual Entry
  const filteredManualSubjects = subjects.filter((sub) => {
    const matchDept = manualDept === "All" || sub.department === manualDept;
    const matchSem = manualSemester === "All" || sub.semester === manualSemester;
    return matchDept && matchSem;
  });

  // 🟢 CUSTOM TOOLTIP FOR BAR CHART
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-sm min-w-[150px]">
          <p className="font-bold text-gray-800 border-b border-gray-50 pb-2 mb-2 uppercase tracking-wide">
            {label} Department
          </p>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 font-medium">Rate:</span>
            <span className={`font-bold ${data.percentage < 60 ? 'text-rose-600' : 'text-blue-600'}`}>
              {data.percentage}%
            </span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 font-medium">Present:</span>
            <span className="font-bold text-emerald-600">{data.present}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Total:</span>
            <span className="font-bold text-gray-800">{data.total}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">Analytics Hub</h1>
          <p className="text-gray-600 text-sm">
            {selectedDate ? `Statistics for ${selectedDate}` : "Real-time statistics for Today"}
          </p>
        </div>
        
        {/* Global Date & Dept Filters */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-3 text-gray-400 text-xs" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <FaUniversity className="absolute left-3 top-3 text-gray-400 text-xs" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Depts</option>
              {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 📊 DYNAMIC STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                Active Students {selectedDept !== "All" && `(${selectedDept})`}
              </p>
              <h3 className="text-4xl font-bold mt-2">{totalStudents}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaUserGraduate className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                Present {selectedDate ? "On Date" : "Today"}
              </p>
              <h3 className="text-4xl font-bold mt-2">{uniquePresentCount}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaClipboardList className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium relative z-10">
            <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">
              {attendanceRate}% Rate
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                Absent {selectedDate ? "On Date" : "Today"}
              </p>
              <h3 className="text-4xl font-bold mt-2">{safeAbsent}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaUsers className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col xl:flex-row gap-6">
        {/* 📉 ANALYTICS CHART PANEL */}
        <div className="w-full xl:w-2/3 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col min-h-[400px]">
            <h2 className="text-gray-800 text-lg font-bold flex items-center gap-2 mb-6">
              <FaChartBar className="text-blue-500" /> Departmental Attendance
            </h2>
            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} content={<CustomTooltip />} />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {departmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.percentage < 60 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 📝 MANUAL ATTENDANCE FORM */}
        <div className="bg-white w-full xl:w-1/3 rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
          <h1 className="text-gray-800 text-lg font-bold mb-1">Manual Entry</h1>
          <p className="text-gray-400 text-xs mb-6">
            Mark attendance if scanner fails.
          </p>

          <div className="flex flex-col gap-4">
            {/* Cascading Department & Semester Filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                  Dept
                </label>
                <select
                  value={manualDept}
                  onChange={(e) => {
                    setManualDept(e.target.value);
                    setManualSubjectId("");
                  }}
                  className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
                >
                  <option value="All">All</option>
                  {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                  Semester
                </label>
                <select
                  value={manualSemester}
                  onChange={(e) => {
                    setManualSemester(e.target.value);
                    setManualSubjectId("");
                  }}
                  className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
                >
                  <option value="All">All</option>
                  {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"].map((sem) => (
                    <option key={sem} value={sem}>{sem} Sem</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select Class Session */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                Select Class Session
              </label>
              <select
                value={manualSubjectId}
                onChange={(e) => setManualSubjectId(e.target.value)}
                className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 disabled:opacity-50"
                disabled={filteredManualSubjects.length === 0}
              >
                <option value="">-- Choose Class --</option>
                {filteredManualSubjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} ({sub.department} - {sub.semester} Sem)
                  </option>
                ))}
              </select>
            </div>

            {/* Date Override */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                Choose Date
              </label>
              <input
                type="date"
                value={manualDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full text-sm rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-500"
              />
            </div>

            {/* Student URN */}
            <div>
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">
                Student URN
              </label>
              <input
                type="text"
                value={manualUrn}
                onChange={(e) => setManualUrn(e.target.value)}
                className="w-full text-sm rounded-xl bg-white border-2 border-blue-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none font-mono shadow-sm"
                placeholder="Ex. 276001"
              />
            </div>
          </div>

          <button
            onClick={handleManualAttendance}
            className="w-full mt-6 rounded-xl py-3 bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            Mark Present
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;