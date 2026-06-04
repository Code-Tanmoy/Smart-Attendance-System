import React, { useState, useEffect } from "react";
import { FaGraduationCap, FaSearch, FaUserTimes } from "react-icons/fa";
import { backend } from "../services/api";
import toast from "react-hot-toast"; // 🟢 NEW: Imported React Hot Toast

const PromoteStudents = () => {
  const [filters, setFilters] = useState({
    department: "",
    semester: "",
  });
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
      const activeStudents = res.data.filter(
        (s) => s.status === "Active" || !s.status,
      );

      setStudents(activeStudents);

      const allUrns = new Set(activeStudents.map((s) => s.urn));
      setSelectedUrns(allUrns);
    } catch (err) {
      // 🟢 NEW: Swapped alert for an error toast
      toast.error("Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch all students the second the page loads
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

  const handlePromote = async () => {
    if (selectedUrns.size === 0) {
      // 🟢 NEW: Warning toast with custom icon
      toast.error("No students selected for promotion.", { icon: "⚠️" });
      return;
    }

    const confirm = window.confirm(
      `You are about to promote ${selectedUrns.size} students. Their old attendance records will be wiped to give them a clean slate. Proceed?`,
    );

    if (!confirm) return;

    setLoading(true);

    // 🟢 NEW: Loading toast for the bulk promotion process
    const promoteToast = toast.loading(
      `Promoting ${selectedUrns.size} students...`,
    );

    try {
      await backend.post("/api/students/promote", {
        urns: Array.from(selectedUrns),
      });

      // 🟢 NEW: Success toast with a graduation cap icon
      toast.success(`Successfully promoted ${selectedUrns.size} students!`, {
        id: promoteToast,
        icon: "🎓",
      });

      // Re-fetch the list immediately after promoting so the UI updates
      fetchStudents();
    } catch (err) {
      // 🟢 NEW: Error toast for failures
      toast.error(
        err.response?.data?.message || "Failed to promote students.",
        { id: promoteToast },
      );
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ department: "", semester: "" });
    // We use a timeout to wait for the state to clear before fetching
    setTimeout(() => fetchStudents(), 0);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Promote Students</h1>
        <p className="text-gray-600 text-sm">
          Bulk transition students to their next semester
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-gray-400 uppercase">
            Department
          </label>
          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            className="w-full mt-1 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="CS">CS</option>
            <option value="IT">IT</option>
            <option value="AI">AI</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-gray-400 uppercase">
            Current Semester
          </label>
          <select
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            className="w-full mt-1 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="">All Semesters</option>
            {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"].map(
              (sem) => (
                <option key={sem} value={sem}>
                  {sem} Sem
                </option>
              ),
            )}
          </select>
        </div>

        <button
          onClick={fetchStudents}
          disabled={loading}
          className="px-6 py-2.5 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2 active:scale-95"
        >
          <FaSearch /> Search
        </button>
      </div>

      {students.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">
              Select Students to Promote
            </h2>
            <button
              onClick={handlePromote}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              <FaGraduationCap /> Promote {selectedUrns.size} Selected
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 text-center">Promote?</th>
                  <th className="p-4">URN</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Dept</th>
                  <th className="p-4">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => {
                  const isChecked = selectedUrns.has(student.urn);
                  return (
                    <tr
                      key={student.urn}
                      className={`hover:bg-gray-50 transition-colors ${!isChecked ? "opacity-50 bg-red-50" : ""}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudent(student.urn)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-mono text-sm">{student.urn}</td>
                      <td className="p-4 font-bold text-gray-800">
                        {student.name}
                      </td>
                      <td className="p-4 font-bold text-gray-700">
                        {student.department}
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
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
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <FaUserTimes className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            No students found
          </h3>
          <p className="text-gray-500 mb-6">
            We couldn't find any active students matching this department or
            semester.
          </p>
          {(filters.department !== "" || filters.semester !== "") && (
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all"
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
