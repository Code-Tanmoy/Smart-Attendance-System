

// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import {
//   FaTrash,
//   FaSearch,
//   FaUniversity,
//   FaLayerGroup,
//   FaSyncAlt,
//   FaUserGraduate,
//   FaEdit,
//   FaTimes,
//   FaArrowLeft,
//   FaPhone,
//   FaBookOpen,
//   FaExclamationTriangle,
// } from "react-icons/fa";
// import { backend, faceApi } from "../services/api";
// import toast from "react-hot-toast";

// const Enrolled = () => {
//   const [students, setStudents] = useState([]);
//   const [attendanceLogs, setAttendanceLogs] = useState([]);
//   const [periodLogs, setPeriodLogs] = useState([]); // 🟢 NEW: State for class-specific logs
//   const [loading, setLoading] = useState(false);

//   // 🔍 HIERARCHY FILTERS
//   const [search, setSearch] = useState("");
//   const [selectedDept, setSelectedDept] = useState("All");
//   const [selectedSemester, setSelectedSemester] = useState("All");
//   const [selectedStatus, setSelectedStatus] = useState("Active");

//   // 🟢 TEACHER-SPECIFIC SUBJECT FILTER
//   const [teacherSubjects, setTeacherSubjects] = useState([]);
//   const [selectedTeacherSubject, setSelectedTeacherSubject] = useState("All");

//   // 🟢 MODAL STATES
//   const [editingStudent, setEditingStudent] = useState(null);
//   const [editForm, setEditForm] = useState({});

//   // 🛡️ ROLE CONTEXT
//   const userRole = localStorage.getItem("userRole");
//   const teacherId = localStorage.getItem("teacherId");

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       // 🟢 FIXED: Now fetching BOTH general attendance AND period-wise manual attendance
//       const [studentsRes, campusAttRes, periodAttRes, subjectsRes] =
//         await Promise.all([
//           backend.get(`/api/students?_t=${Date.now()}`),
//           backend.get(`/api/attendance?_t=${Date.now()}`),
//           backend
//             .get(`/api/periodwise-attendance?_t=${Date.now()}`)
//             .catch(() => ({ data: [] })),
//           backend.get(`/api/subjects?_t=${Date.now()}`),
//         ]);

//       let fetchedStudents = studentsRes.data;

//       // SMART ROLE FILTERING
//       if (userRole === "teacher") {
//         const myClasses = subjectsRes.data.filter(
//           (s) => s.teacherId === teacherId,
//         );
//         setTeacherSubjects(myClasses);

//         const validGroups = myClasses.map(
//           (c) => `${c.department}-${c.semester}`,
//         );

//         fetchedStudents = fetchedStudents.filter((student) => {
//           const studentGroup = `${student.department}-${student.semester}`;
//           return validGroups.includes(studentGroup);
//         });
//       }

//       const sorted = fetchedStudents.sort(
//         (a, b) =>
//           a.department.localeCompare(b.department) ||
//           a.semester.localeCompare(b.semester) ||
//           a.name.localeCompare(b.name),
//       );

//       setStudents(sorted);
//       setAttendanceLogs(campusAttRes.data);
//       setPeriodLogs(periodAttRes.data); // Store period logs for manual entry check
//     } catch (err) {
//       console.error("Error fetching data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [userRole, teacherId]);

//   const handleRefresh = async () => {
//     const syncToast = toast.loading("Syncing database...");
//     await fetchData();
//     toast.success("Database synced successfully!", { id: syncToast });
//   };

//   const todayDate = new Date().toISOString().split("T")[0];

//   // 🟢 FIXED: Campus check now looks at BOTH databases just to be absolutely safe
//   const getCampusStatus = (urn) => {
//     const isCampusPresent = attendanceLogs.some((log) => {
//       const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
//       return String(log.urn) === String(urn) && logDate === todayDate;
//     });

//     const isPeriodPresent = periodLogs.some((log) => {
//       const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
//       return String(log.urn) === String(urn) && logDate === todayDate;
//     });

//     return isCampusPresent || isPeriodPresent ? "Present" : "Absent";
//   };

//   // 🟢 FIXED: Class check looks strictly at periodLogs and safely converts IDs to strings
//   const getClassStatus = (urn, subject) => {
//     if (!subject) return "Absent";

//     const hasLogClass = periodLogs.some((log) => {
//       const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];

//       // Safely extract subjectId if it's nested
//       const logSubId = log.subjectId?._id || log.subjectId;

//       // Force string comparison because MongoDB Objects will fail exact match
//       const isCorrectClass =
//         (logSubId && String(logSubId) === String(subject._id)) ||
//         log.period === subject.name;

//       return (
//         String(log.urn) === String(urn) &&
//         logDate === todayDate &&
//         isCorrectClass
//       );
//     });

//     return hasLogClass ? "Present" : "Absent";
//   };

//   // 🔍 COMBINED FILTER LOGIC
//   const filteredStudents = students
//     .filter((student) => {
//       const query = search.toLowerCase();
//       const matchesSearch =
//         student.name.toLowerCase().includes(query) ||
//         student.urn.toLowerCase().includes(query) ||
//         (student.email && student.email.toLowerCase().includes(query)) ||
//         (student.phone && student.phone.includes(query));

//       const matchesDept =
//         selectedDept === "All" || student.department === selectedDept;
//       const matchesSemester =
//         selectedSemester === "All" || student.semester === selectedSemester;

//       let matchesStatus = true;
//       if (selectedStatus === "Active") {
//         matchesStatus = student.status === "Active" || !student.status;
//       } else if (selectedStatus === "Graduated") {
//         matchesStatus = student.status === "Graduated";
//       }

//       // Subject Drill-down filter
//       let matchesSubject = true;
//       if (userRole === "teacher" && selectedTeacherSubject !== "All") {
//         const sub = teacherSubjects.find(
//           (s) => String(s._id) === String(selectedTeacherSubject),
//         );
//         if (sub) {
//           matchesSubject =
//             student.department === sub.department &&
//             student.semester === sub.semester;
//         }
//       }

//       return (
//         matchesSearch &&
//         matchesDept &&
//         matchesSemester &&
//         matchesStatus &&
//         matchesSubject
//       );
//     })
//     .sort((a, b) => {
//       if (a.semester !== b.semester)
//         return a.semester.localeCompare(b.semester);
//       return a.urn.localeCompare(b.urn, undefined, { numeric: true });
//     });

//   // ==========================================
//   // 🟢 EDIT & DELETE HANDLERS
//   // ==========================================
//   const openEditModal = (student, e) => {
//     e.stopPropagation();
//     setEditingStudent(student);
//     setEditForm({ ...student });
//   };

//   const handleEditChange = (e) => {
//     const { name, value } = e.target;
//     setEditForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const submitEdit = async (e) => {
//     e.preventDefault();
//     const editToast = toast.loading("Updating student information...");

//     try {
//       const res = await backend.put(
//         `/api/students/${editingStudent.urn}`,
//         editForm,
//       );

//       setStudents((prev) =>
//         prev.map((s) => (s.urn === editingStudent.urn ? res.data : s)),
//       );

//       setEditingStudent(null);
//       toast.success("Student information updated successfully.", {
//         id: editToast,
//       });
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to update student.", {
//         id: editToast,
//       });
//     }
//   };

//   const handleDelete = async (urn, name, e) => {
//     e.stopPropagation();
//     if (
//       !window.confirm(
//         `Delete ${name}? This removes ALL face data and attendance records.`,
//       )
//     )
//       return;

//     const deleteToast = toast.loading(`Deleting ${name}...`);

//     try {
//       try {
//         await faceApi.post("/delete", { urn });
//       } catch (e) {
//         console.warn("Face delete skipped");
//       }
//       await backend.delete(`/api/students/${urn}`);

//       setStudents(students.filter((s) => s.urn !== urn));
//       toast.success("Student deleted successfully.", { id: deleteToast });
//     } catch (err) {
//       toast.error("Failed to delete student.", { id: deleteToast });
//     }
//   };

//   // Active subject context for UI
//   const activeSubject =
//     userRole === "teacher" && selectedTeacherSubject !== "All"
//       ? teacherSubjects.find(
//           (s) => String(s._id) === String(selectedTeacherSubject),
//         )
//       : null;

//   return (
//     <div
//       className={userRole === "teacher" ? "min-h-screen bg-gray-50 pb-10" : ""}
//     >
//       {userRole === "teacher" && (
//         <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center mb-8 shadow-sm">
//           <div className="font-bold text-xl text-blue-600">
//             Teacher's Dashboard
//           </div>
//           <Link
//             to="/teacherdashboard"
//             className="text-gray-500 hover:text-blue-600 flex items-center gap-2 text-sm font-bold transition-colors"
//           >
//             <FaArrowLeft /> Back to Dashboard
//           </Link>
//         </nav>
//       )}

//       <div className={userRole === "teacher" ? "max-w-7xl mx-auto px-4" : ""}>
//         {/* MODAL 1: EDIT STUDENT FORM */}
//         {editingStudent && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
//             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn my-8">
//               <div className="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-center sticky top-0 z-10">
//                 <h2 className="text-xl font-bold text-gray-800">
//                   Edit Student Info
//                 </h2>
//                 <button
//                   onClick={() => setEditingStudent(null)}
//                   className="text-gray-400 hover:text-red-500 transition-colors"
//                 >
//                   <FaTimes size={20} />
//                 </button>
//               </div>

//               <form onSubmit={submitEdit} className="p-6 space-y-5">
//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                     Full Name
//                   </label>
//                   <input
//                     type="text"
//                     name="name"
//                     value={editForm.name || ""}
//                     onChange={handleEditChange}
//                     className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                     Email Address
//                   </label>
//                   <input
//                     type="email"
//                     name="email"
//                     value={editForm.email || ""}
//                     onChange={handleEditChange}
//                     className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
//                     required
//                   />
//                 </div>
//                 <div className="flex gap-4">
//                   <div className="flex-[2]">
//                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                       Phone Number
//                     </label>
//                     <input
//                       type="tel"
//                       name="phone"
//                       value={editForm.phone || ""}
//                       onChange={handleEditChange}
//                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
//                     />
//                   </div>
//                   <div className="flex-1">
//                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                       Age
//                     </label>
//                     <input
//                       type="number"
//                       name="age"
//                       value={editForm.age || ""}
//                       onChange={handleEditChange}
//                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
//                     />
//                   </div>
//                 </div>
//                 <div className="flex gap-4">
//                   <div className="flex-1">
//                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                       Department
//                     </label>
//                     <select
//                       name="department"
//                       value={editForm.department || ""}
//                       onChange={handleEditChange}
//                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
//                     >
//                       {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
//                         <option key={d} value={d}>
//                           {d}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="flex-1">
//                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                       Semester
//                     </label>
//                     <select
//                       name="semester"
//                       value={editForm.semester || ""}
//                       onChange={handleEditChange}
//                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
//                     >
//                       {[
//                         "1st",
//                         "2nd",
//                         "3rd",
//                         "4th",
//                         "5th",
//                         "6th",
//                         "7th",
//                         "8th",
//                       ].map((sem) => (
//                         <option key={sem} value={sem}>
//                           {sem} Sem
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mt-4">
//                   <div className="text-blue-500 mt-0.5">ℹ️</div>
//                   <p className="text-xs text-blue-800">
//                     <strong>Note:</strong> URN ({editingStudent.urn}) cannot be
//                     changed here as it acts as the primary security key for face
//                     recognition data.
//                   </p>
//                 </div>
//                 <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
//                   <button
//                     type="button"
//                     onClick={() => setEditingStudent(null)}
//                     className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
//                   >
//                     Save Changes
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {/* HEADER & FILTERS */}
//         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center text-white mb-8 gap-4">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-800 mt-1 flex items-center gap-2">
//               {userRole === "admin"
//                 ? "Student Database"
//                 : "Class Rosters & Analysis"}
//             </h1>
//             <span className="text-gray-500 text-sm">
//               {userRole === "admin"
//                 ? "Manage college enrollment & alumni"
//                 : "Identify bunking patterns and view class-specific attendance"}
//             </span>
//           </div>

//           <div className="flex flex-wrap gap-3 w-full xl:w-auto">
//             <button
//               onClick={handleRefresh}
//               disabled={loading}
//               className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors font-bold text-sm"
//             >
//               <FaSyncAlt className={loading ? "animate-spin" : ""} />
//               {loading ? "Syncing..." : "Refresh"}
//             </button>

//             {/* TEACHER SUBJECT DROPDOWN */}
//             {userRole === "teacher" && (
//               <div className="relative">
//                 <FaBookOpen className="absolute left-3 top-3 text-gray-400 text-xs" />
//                 <select
//                   value={selectedTeacherSubject}
//                   onChange={(e) => {
//                     setSelectedTeacherSubject(e.target.value);
//                     // Reset global dept/sem filters to avoid conflicts
//                     setSelectedDept("All");
//                     setSelectedSemester("All");
//                   }}
//                   className="pl-8 pr-8 py-2.5 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-800 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
//                 >
//                   <option value="All">All My Students</option>
//                   {teacherSubjects.map((sub) => (
//                     <option key={sub._id} value={sub._id}>
//                       {sub.name} ({sub.department}-{sub.semester})
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             <div className="relative">
//               <FaUserGraduate className="absolute left-3 top-3 text-gray-400 text-xs" />
//               <select
//                 value={selectedStatus}
//                 onChange={(e) => setSelectedStatus(e.target.value)}
//                 className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
//               >
//                 <option value="Active">Active Students</option>
//                 <option value="Graduated">Alumni (Graduated)</option>
//                 <option value="All">Everyone</option>
//               </select>
//             </div>

//             {/* Hide global dept/sem filters if a specific subject is selected to avoid confusion */}
//             {!(userRole === "teacher" && selectedTeacherSubject !== "All") && (
//               <>
//                 <div className="relative">
//                   <FaUniversity className="absolute left-3 top-3 text-gray-400 text-xs" />
//                   <select
//                     value={selectedDept}
//                     onChange={(e) => setSelectedDept(e.target.value)}
//                     className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
//                   >
//                     <option value="All">All Depts</option>
//                     {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
//                       <option key={d} value={d}>
//                         {d}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="relative">
//                   <FaLayerGroup className="absolute left-3 top-3 text-gray-400 text-xs" />
//                   <select
//                     value={selectedSemester}
//                     onChange={(e) => setSelectedSemester(e.target.value)}
//                     className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
//                   >
//                     <option value="All">All Semesters</option>
//                     {[
//                       "1st",
//                       "2nd",
//                       "3rd",
//                       "4th",
//                       "5th",
//                       "6th",
//                       "7th",
//                       "8th",
//                     ].map((sem) => (
//                       <option key={sem} value={sem}>
//                         {sem} Sem
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </>
//             )}

//             <div className="relative flex-grow xl:flex-grow-0">
//               <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-full xl:w-48 pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//               />
//             </div>
//           </div>
//         </div>

//         {/* 📋 TABLE */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//           <div className="overflow-x-auto min-h-[400px]">
//             <table className="min-w-full table-auto text-sm text-left">
//               <thead>
//                 <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
//                   <th className="px-6 py-4 font-semibold">
//                     Student Name & Contact
//                   </th>
//                   <th className="px-6 py-4 font-semibold">URN</th>
//                   <th className="px-6 py-4 font-semibold">Department</th>
//                   <th className="px-6 py-4 font-semibold">Academic State</th>

//                   {/* DYNAMIC STATUS HEADERS */}
//                   <th className="px-6 py-4 font-semibold">Campus Status</th>
//                   {activeSubject && (
//                     <th className="px-6 py-4 font-semibold text-blue-600 bg-blue-50/50">
//                       My Class Status
//                     </th>
//                   )}

//                   {userRole === "admin" && (
//                     <th className="px-6 py-4 text-center font-semibold">
//                       Actions
//                     </th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {loading ? (
//                   <tr>
//                     <td
//                       colSpan={userRole === "admin" ? "7" : "6"}
//                       className="text-center py-10 text-gray-400"
//                     >
//                       Syncing database...
//                     </td>
//                   </tr>
//                 ) : filteredStudents.length > 0 ? (
//                   filteredStudents.map((student) => {
//                     const isGraduated = student.status === "Graduated";
//                     const campusStatus = getCampusStatus(student.urn);

//                     let classStatus = "-";
//                     let isBunking = false;

//                     if (activeSubject && !isGraduated) {
//                       classStatus = getClassStatus(student.urn, activeSubject);
//                       isBunking =
//                         campusStatus === "Present" && classStatus === "Absent";
//                     }

//                     return (
//                       <tr
//                         key={student._id}
//                         className={`transition-colors group ${isBunking ? "bg-orange-50/30 hover:bg-orange-50/60" : "hover:bg-blue-50/50"}`}
//                       >
//                         <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3">
//                           <div
//                             className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm ${isGraduated ? "bg-purple-100 text-purple-600" : isBunking ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}
//                           >
//                             {student.name.charAt(0)}
//                           </div>
//                           <div className="flex flex-col">
//                             <span className="text-gray-900">
//                               {student.name}
//                             </span>
//                             {student.email && (
//                               <span className="text-xs text-gray-500 font-normal mt-0.5 truncate max-w-[200px]">
//                                 {student.email}
//                               </span>
//                             )}
//                             {student.phone && (
//                               <span className="text-xs text-gray-400 font-normal mt-0.5 flex items-center gap-1.5">
//                                 <FaPhone className="text-[10px] text-gray-300" />{" "}
//                                 {student.phone}
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 text-gray-500 font-mono text-sm">
//                           {student.urn}
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 mr-2">
//                             {student.department}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 font-bold">
//                           {isGraduated ? (
//                             <span className="text-purple-600">Alumni</span>
//                           ) : (
//                             <span className="text-gray-600">
//                               {student.semester} Sem
//                             </span>
//                           )}
//                         </td>

//                         {/* CAMPUS STATUS COLUMN */}
//                         <td className="px-6 py-4">
//                           {isGraduated ? (
//                             <span className="text-gray-400 font-bold">-</span>
//                           ) : (
//                             <span
//                               className={`px-3 py-1 rounded-full text-xs font-bold border ${campusStatus === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}
//                             >
//                               {campusStatus}
//                             </span>
//                           )}
//                         </td>

//                         {/* DYNAMIC CLASS STATUS COLUMN */}
//                         {activeSubject && (
//                           <td className="px-6 py-4 bg-blue-50/10">
//                             {isGraduated ? (
//                               <span className="text-gray-400 font-bold">-</span>
//                             ) : isBunking ? (
//                               <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 w-fit shadow-sm">
//                                 <FaExclamationTriangle /> Bunking
//                               </div>
//                             ) : (
//                               <span
//                                 className={`px-3 py-1 rounded-full text-xs font-bold border ${classStatus === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}
//                               >
//                                 {classStatus}
//                               </span>
//                             )}
//                           </td>
//                         )}

//                         {userRole === "admin" && (
//                           <td className="px-6 py-4 text-center">
//                             <div className="flex items-center justify-center gap-1">
//                               <button
//                                 onClick={(e) => openEditModal(student, e)}
//                                 className="text-gray-400 hover:text-blue-600 p-2 transition bg-white rounded-md shadow-sm border border-gray-100"
//                                 title="Edit Student"
//                               >
//                                 <FaEdit />
//                               </button>
//                               <button
//                                 onClick={(e) =>
//                                   handleDelete(student.urn, student.name, e)
//                                 }
//                                 className="text-gray-400 hover:text-red-600 p-2 transition bg-white rounded-md shadow-sm border border-gray-100"
//                                 title="Delete Student"
//                               >
//                                 <FaTrash />
//                               </button>
//                             </div>
//                           </td>
//                         )}
//                       </tr>
//                     );
//                   })
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan={userRole === "admin" ? "7" : "6"}
//                       className="text-center py-12 text-gray-400 italic"
//                     >
//                       No students found matching your filters.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Enrolled;


import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaTrash,
  FaSearch,
  FaUniversity,
  FaLayerGroup,
  FaSyncAlt,
  FaUserGraduate,
  FaEdit,
  FaTimes,
  FaArrowLeft,
  FaPhone,
  FaBookOpen,
  FaExclamationTriangle,
} from "react-icons/fa";
import { backend, faceApi } from "../services/api";
import toast from "react-hot-toast";

const Enrolled = () => {
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [periodLogs, setPeriodLogs] = useState([]); 
  const [loading, setLoading] = useState(false);

  // 🔍 HIERARCHY FILTERS
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Active");

  // 🟢 TEACHER-SPECIFIC SUBJECT FILTER
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState("All");

  // 🟢 MODAL STATES
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});

  // 🛡️ ROLE CONTEXT
  const userRole = localStorage.getItem("userRole");
  const teacherId = localStorage.getItem("teacherId");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, campusAttRes, periodAttRes, subjectsRes] =
        await Promise.all([
          backend.get(`/api/students?_t=${Date.now()}`),
          backend.get(`/api/attendance?_t=${Date.now()}`),
          backend
            .get(`/api/periodwise-attendance?_t=${Date.now()}`)
            .catch(() => ({ data: [] })),
          backend.get(`/api/subjects?_t=${Date.now()}`),
        ]);

      let fetchedStudents = studentsRes.data;

      // SMART ROLE FILTERING
      if (userRole === "teacher") {
        const myClasses = subjectsRes.data.filter(
          (s) => s.teacherId === teacherId,
        );
        setTeacherSubjects(myClasses);

        const validGroups = myClasses.map(
          (c) => `${c.department}-${c.semester}`,
        );

        fetchedStudents = fetchedStudents.filter((student) => {
          const studentGroup = `${student.department}-${student.semester}`;
          return validGroups.includes(studentGroup);
        });
      }

      const sorted = fetchedStudents.sort(
        (a, b) =>
          a.department.localeCompare(b.department) ||
          a.semester.localeCompare(b.semester) ||
          a.name.localeCompare(b.name),
      );

      setStudents(sorted);
      setAttendanceLogs(campusAttRes.data);
      setPeriodLogs(periodAttRes.data); 
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole, teacherId]);

  const handleRefresh = async () => {
    const syncToast = toast.loading("Syncing database...");
    await fetchData();
    toast.success("Database synced successfully!", { id: syncToast });
  };

  const todayDate = new Date().toISOString().split("T")[0];

  const getCampusStatus = (urn) => {
    const isCampusPresent = attendanceLogs.some((log) => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return String(log.urn) === String(urn) && logDate === todayDate;
    });

    const isPeriodPresent = periodLogs.some((log) => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return String(log.urn) === String(urn) && logDate === todayDate;
    });

    return isCampusPresent || isPeriodPresent ? "Present" : "Absent";
  };

  const getClassStatus = (urn, subject) => {
    if (!subject) return "Absent";

    const hasLogClass = periodLogs.some((log) => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];

      const logSubId = log.subjectId?._id || log.subjectId;

      const isCorrectClass =
        (logSubId && String(logSubId) === String(subject._id)) ||
        log.period === subject.name;

      return (
        String(log.urn) === String(urn) &&
        logDate === todayDate &&
        isCorrectClass
      );
    });

    return hasLogClass ? "Present" : "Absent";
  };

  // 🔍 COMBINED FILTER LOGIC
  const filteredStudents = students
    .filter((student) => {
      const query = search.toLowerCase();
      const matchesSearch =
        student.name.toLowerCase().includes(query) ||
        student.urn.toLowerCase().includes(query) ||
        (student.email && student.email.toLowerCase().includes(query)) ||
        (student.phone && student.phone.includes(query));

      const matchesDept =
        selectedDept === "All" || student.department === selectedDept;
      const matchesSemester =
        selectedSemester === "All" || student.semester === selectedSemester;

      let matchesStatus = true;
      if (selectedStatus === "Active") {
        matchesStatus = student.status === "Active" || !student.status;
      } else if (selectedStatus === "Graduated") {
        matchesStatus = student.status === "Graduated";
      }

      let matchesSubject = true;
      if (userRole === "teacher" && selectedTeacherSubject !== "All") {
        const sub = teacherSubjects.find(
          (s) => String(s._id) === String(selectedTeacherSubject),
        );
        if (sub) {
          matchesSubject =
            student.department === sub.department &&
            student.semester === sub.semester;
        }
      }

      return (
        matchesSearch &&
        matchesDept &&
        matchesSemester &&
        matchesStatus &&
        matchesSubject
      );
    })
    .sort((a, b) => {
      if (a.semester !== b.semester)
        return a.semester.localeCompare(b.semester);
      return a.urn.localeCompare(b.urn, undefined, { numeric: true });
    });

  // ==========================================
  // 🟢 EDIT & DELETE HANDLERS
  // ==========================================
  const openEditModal = (student, e) => {
    e.stopPropagation();
    setEditingStudent(student);
    setEditForm({ ...student });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const editToast = toast.loading("Updating student information...");

    try {
      const res = await backend.put(
        `/api/students/${editingStudent.urn}`,
        editForm,
      );

      setStudents((prev) =>
        prev.map((s) => (s.urn === editingStudent.urn ? res.data : s)),
      );

      setEditingStudent(null);
      toast.success("Student information updated successfully.", {
        id: editToast,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update student.", {
        id: editToast,
      });
    }
  };

  const handleDelete = async (urn, name, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete ${name}? This removes ALL face data and attendance records.`,
      )
    )
      return;

    const deleteToast = toast.loading(`Deleting ${name}...`);

    try {
      try {
        await faceApi.post("/delete", { urn });
      } catch (e) {
        console.warn("Face delete skipped");
      }
      await backend.delete(`/api/students/${urn}`);

      setStudents(students.filter((s) => s.urn !== urn));
      toast.success("Student deleted successfully.", { id: deleteToast });
    } catch (err) {
      toast.error("Failed to delete student.", { id: deleteToast });
    }
  };

  const activeSubject =
    userRole === "teacher" && selectedTeacherSubject !== "All"
      ? teacherSubjects.find(
          (s) => String(s._id) === String(selectedTeacherSubject),
        )
      : null;

  return (
    <div
      className={userRole === "teacher" ? "min-h-screen bg-gray-50 pb-10" : ""}
    >
      {userRole === "teacher" && (
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center mb-8 shadow-sm">
          <div className="font-bold text-xl text-blue-600">
            Teacher's Dashboard
          </div>
          <Link
            to="/teacherdashboard"
            className="text-gray-500 hover:text-blue-600 flex items-center gap-2 text-sm font-bold transition-colors"
          >
            <FaArrowLeft /> Back to Dashboard
          </Link>
        </nav>
      )}

      <div className={userRole === "teacher" ? "max-w-7xl mx-auto px-4" : ""}>
        {/* MODAL 1: EDIT STUDENT FORM */}
        {editingStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn my-8">
              <div className="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-800">
                  Edit Student Info
                </h2>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={submitEdit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-[2]">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone || ""}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={editForm.age || ""}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* 🟢 NEW: 3-Column Grid for Dept, Year, and Semester */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Department
                    </label>
                    <select
                      name="department"
                      value={editForm.department || ""}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Year
                    </label>
                    <select
                      name="year"
                      value={editForm.year || ""}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Semester
                    </label>
                    <select
                      name="semester"
                      value={editForm.semester || ""}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"].map((sem) => (
                        <option key={sem} value={sem}>
                          {sem} Sem
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mt-4">
                  <div className="text-blue-500 mt-0.5">ℹ️</div>
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> URN ({editingStudent.urn}) cannot be
                    changed here as it acts as the primary security key for face
                    recognition data.
                  </p>
                </div>
                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* HEADER & FILTERS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center text-white mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mt-1 flex items-center gap-2">
              {userRole === "admin"
                ? "Student Database"
                : "Class Rosters & Analysis"}
            </h1>
            <span className="text-gray-500 text-sm">
              {userRole === "admin"
                ? "Manage college enrollment & alumni"
                : "Identify bunking patterns and view class-specific attendance"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors font-bold text-sm"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              {loading ? "Syncing..." : "Refresh"}
            </button>

            {/* TEACHER SUBJECT DROPDOWN */}
            {userRole === "teacher" && (
              <div className="relative">
                <FaBookOpen className="absolute left-3 top-3 text-gray-400 text-xs" />
                <select
                  value={selectedTeacherSubject}
                  onChange={(e) => {
                    setSelectedTeacherSubject(e.target.value);
                    setSelectedDept("All");
                    setSelectedSemester("All");
                  }}
                  className="pl-8 pr-8 py-2.5 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-800 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="All">All My Students</option>
                  {teacherSubjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.department}-{sub.semester})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <FaUserGraduate className="absolute left-3 top-3 text-gray-400 text-xs" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Active">Active Students</option>
                <option value="Graduated">Alumni (Graduated)</option>
                <option value="All">Everyone</option>
              </select>
            </div>

            {!(userRole === "teacher" && selectedTeacherSubject !== "All") && (
              <>
                <div className="relative">
                  <FaUniversity className="absolute left-3 top-3 text-gray-400 text-xs" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="All">All Depts</option>
                    {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <FaLayerGroup className="absolute left-3 top-3 text-gray-400 text-xs" />
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="All">All Semesters</option>
                    {[
                      "1st",
                      "2nd",
                      "3rd",
                      "4th",
                      "5th",
                      "6th",
                      "7th",
                      "8th",
                    ].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem} Sem
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="relative flex-grow xl:flex-grow-0">
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full xl:w-48 pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* 📋 TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full table-auto text-sm text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <th className="px-6 py-4 font-semibold">
                    Student Name & Contact
                  </th>
                  <th className="px-6 py-4 font-semibold">URN</th>
                  <th className="px-6 py-4 font-semibold">Department</th>
                  <th className="px-6 py-4 font-semibold">Academic State</th>

                  <th className="px-6 py-4 font-semibold">Campus Status</th>
                  {activeSubject && (
                    <th className="px-6 py-4 font-semibold text-blue-600 bg-blue-50/50">
                      My Class Status
                    </th>
                  )}

                  {userRole === "admin" && (
                    <th className="px-6 py-4 text-center font-semibold">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={userRole === "admin" ? "7" : "6"}
                      className="text-center py-10 text-gray-400"
                    >
                      Syncing database...
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const isGraduated = student.status === "Graduated";
                    const campusStatus = getCampusStatus(student.urn);

                    let classStatus = "-";
                    let isBunking = false;

                    if (activeSubject && !isGraduated) {
                      classStatus = getClassStatus(student.urn, activeSubject);
                      isBunking =
                        campusStatus === "Present" && classStatus === "Absent";
                    }

                    return (
                      <tr
                        key={student._id}
                        className={`transition-colors group ${isBunking ? "bg-orange-50/30 hover:bg-orange-50/60" : "hover:bg-blue-50/50"}`}
                      >
                        <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm ${isGraduated ? "bg-purple-100 text-purple-600" : isBunking ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}
                          >
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-900">
                              {student.name}
                            </span>
                            {student.email && (
                              <span className="text-xs text-gray-500 font-normal mt-0.5 truncate max-w-[200px]">
                                {student.email}
                              </span>
                            )}
                            {student.phone && (
                              <span className="text-xs text-gray-400 font-normal mt-0.5 flex items-center gap-1.5">
                                <FaPhone className="text-[10px] text-gray-300" />{" "}
                                {student.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-sm">
                          {student.urn}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 mr-2">
                            {student.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold">
                          {isGraduated ? (
                            <span className="text-purple-600">Alumni</span>
                          ) : (
                            <span className="text-gray-600">
                              {student.semester} Sem
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {isGraduated ? (
                            <span className="text-gray-400 font-bold">-</span>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${campusStatus === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}
                            >
                              {campusStatus}
                            </span>
                          )}
                        </td>

                        {activeSubject && (
                          <td className="px-6 py-4 bg-blue-50/10">
                            {isGraduated ? (
                              <span className="text-gray-400 font-bold">-</span>
                            ) : isBunking ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 w-fit shadow-sm">
                                <FaExclamationTriangle /> Bunking
                              </div>
                            ) : (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${classStatus === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}
                              >
                                {classStatus}
                              </span>
                            )}
                          </td>
                        )}

                        {userRole === "admin" && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => openEditModal(student, e)}
                                className="text-gray-400 hover:text-blue-600 p-2 transition bg-white rounded-md shadow-sm border border-gray-100"
                                title="Edit Student"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={(e) =>
                                  handleDelete(student.urn, student.name, e)
                                }
                                className="text-gray-400 hover:text-red-600 p-2 transition bg-white rounded-md shadow-sm border border-gray-100"
                                title="Delete Student"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={userRole === "admin" ? "7" : "6"}
                      className="text-center py-12 text-gray-400 italic"
                    >
                      No students found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrolled;