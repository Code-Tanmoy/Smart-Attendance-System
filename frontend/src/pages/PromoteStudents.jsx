import React, { useState, useEffect } from "react";
import { FaGraduationCap, FaSearch, FaUserTimes, FaCheckSquare, FaRegSquare } from "react-icons/fa";
import { backend } from "../services/api";
import toast from "react-hot-toast";

const PromoteStudents = () => {
  const [filters, setFilters] = useState({ department: "", semester: "" });
  const [students, setStudents] = useState([]);
  const [selectedUrns, setSelectedUrns] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await backend.get("/api/students", { params: filters });
      const activeStudents = res.data.filter((s) => s.status === "Active" || !s.status);
      setStudents(activeStudents);

      const allUrns = new Set(activeStudents.map((s) => s.urn));
      setSelectedUrns(allUrns);
    } catch (err) {
      toast.error("Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleStudent = (urn) => {
    const updated = new Set(selectedUrns);
    if (updated.has(urn)) {
      updated.delete(urn);
    } else {
      updated.add(urn);
    }
    setSelectedUrns(updated);
  };

  // 🟢 NEW: Added "Select All" functionality for better UI/UX
  const isAllSelected = students.length > 0 && selectedUrns.size === students.length;
  
  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedUrns(new Set());
    } else {
      setSelectedUrns(new Set(students.map(s => s.urn)));
    }
  };

  const handlePromote = async () => {
    if (selectedUrns.size === 0) {
      toast.error("No students selected for promotion.", { icon: "⚠️" });
      return;
    }

    const confirm = window.confirm(
      `You are about to promote ${selectedUrns.size} students. Their old attendance records will be wiped to give them a clean slate. Proceed?`
    );

    if (!confirm) return;

    setLoading(true);
    const promoteToast = toast.loading(`Promoting ${selectedUrns.size} students...`);

    try {
      await backend.post("/api/students/promote", {
        urns: Array.from(selectedUrns),
      });

      toast.success(`Successfully promoted ${selectedUrns.size} students!`, {
        id: promoteToast,
        icon: "🎓",
      });

      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to promote students.", { id: promoteToast });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ department: "", semester: "" });
    setTimeout(() => fetchStudents(), 0);
  };

  const inputClasses = "w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-sm text-slate-700 appearance-none";
  const labelClasses = "block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1";

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Promote Students</h1>
        <p className="text-slate-500 text-sm mt-1">Bulk transition active students to their next academic semester.</p>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end mb-8">
        <div className="flex-1 w-full min-w-[200px]">
          <label className={labelClasses}>Department</label>
          <select name="department" value={filters.department} onChange={handleFilterChange} className={inputClasses}>
            <option value="">All Departments</option>
            {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>

        <div className="flex-1 w-full min-w-[200px]">
          <label className={labelClasses}>Current Semester</label>
          <select name="semester" value={filters.semester} onChange={handleFilterChange} className={inputClasses}>
            <option value="">All Semesters</option>
            {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"].map((sem) => (<option key={sem} value={sem}>{sem} Sem</option>))}
          </select>
        </div>

        <button
          onClick={fetchStudents}
          disabled={loading}
          className="w-full md:w-auto px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-slate-200"
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <><FaSearch /> Search</>
          )}
        </button>
      </div>

      {students.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Select Students to Promote</h2>
              <p className="text-xs text-slate-500 mt-0.5">{selectedUrns.size} out of {students.length} selected</p>
            </div>
            
            <button
              onClick={handlePromote}
              disabled={loading || selectedUrns.size === 0}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
            >
              <FaGraduationCap className="text-xl" /> Promote {selectedUrns.size} Selected
            </button>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-6 py-4 text-center w-16">
                    <button onClick={toggleAll} className="text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none">
                      {isAllSelected ? <FaCheckSquare size={20} /> : <FaRegSquare size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4">URN</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Current Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const isChecked = selectedUrns.has(student.urn);
                  return (
                    <tr
                      key={student.urn}
                      onClick={() => toggleStudent(student.urn)}
                      className={`transition-all cursor-pointer ${
                        isChecked ? "hover:bg-slate-50 bg-white" : "bg-slate-50/50 opacity-70 hover:opacity-100 hover:bg-slate-50 grayscale-[0.2]"
                      }`}
                    >
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600 pointer-events-none"
                        />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{student.urn}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                      <td className="px-6 py-4 font-bold text-slate-600">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                          {student.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold">
                          {student.semester} Sem
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <FaUserTimes className="text-4xl text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 tracking-tight mb-2">No active students found</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm leading-relaxed">
            We couldn't find any active students matching this department or semester.
          </p>
          {(filters.department !== "" || filters.semester !== "") && (
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PromoteStudents;