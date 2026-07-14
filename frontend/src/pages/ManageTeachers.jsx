import React, { useState, useEffect } from "react";
import {
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaIdBadge,
  FaLock,
  FaTrash,
  FaChalkboardTeacher,
  FaEdit,
  FaTimes,
  FaUserShield,
  FaUser,
  FaSearch,
  FaUniversity,
  FaUserTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import { backend } from "../services/api";
import toast from "react-hot-toast";

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Staff Toggle State
  const [staffType, setStaffType] = useState("teacher");

  // SEARCH & FILTER STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  // Registration States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    teacherId: "",
    department: "CSE",
    password: "",
  });
  const [adminFormData, setAdminFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    designation: "Master Admin",
  });

  // Edit States
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editAdminForm, setEditAdminForm] = useState({});

  const departments = ["CSE", "ECE", "ME", "AI", "CS", "IT"];

  const fetchStaffData = async () => {
    try {
      const [teachersRes, adminsRes] = await Promise.all([
        backend.get("/api/teachers").catch(() => ({ data: [] })),
        backend.get("/api/admins").catch(() => ({ data: [] })),
      ]);
      setTeachers(teachersRes.data);
      setAdmins(adminsRes.data);
    } catch (err) {
      console.error("Failed to fetch staff data:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  // FILTERING LOGIC
  const filteredTeachers = teachers.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      t.teacherId.toLowerCase().includes(query) ||
      (t.phone && t.phone.includes(query));
    const matchesDept = selectedDept === "All" || t.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const filteredAdmins = admins.filter((a) => {
    const query = searchQuery.toLowerCase();
    return (
      (a.username && a.username.toLowerCase().includes(query)) ||
      (a.email && a.email.toLowerCase().includes(query)) ||
      (a.designation && a.designation.toLowerCase().includes(query)) ||
      (a.phone && a.phone.includes(query))
    );
  });

  const handleTabSwitch = (type) => {
    setStaffType(type);
    setSearchQuery("");
    setSelectedDept("All");
  };

  // REGISTRATION HANDLERS
  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "name" || name === "teacherId") value = value.toUpperCase();
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setFormData({ ...formData, [name]: value });
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const submitToast = toast.loading("Registering faculty member...");
    try {
      const res = await backend.post("/register-teacher", formData);
      toast.success(res.data.message, { id: submitToast });
      setFormData({
        name: "",
        email: "",
        phone: "",
        teacherId: "",
        department: "CSE",
        password: "",
      });
      fetchStaffData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, {
        id: submitToast,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setAdminFormData({ ...adminFormData, [name]: value });
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const submitToast = toast.loading("Creating admin account...");
    try {
      await backend.post("/signup", adminFormData);
      toast.success("Admin Account Created Successfully!", { id: submitToast });
      setAdminFormData({
        username: "",
        email: "",
        password: "",
        phone: "",
        designation: "Master Admin",
      });
      fetchStaffData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, {
        id: submitToast,
      });
    } finally {
      setLoading(false);
    }
  };

  // EDIT & DELETE HANDLERS
  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setEditForm({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department,
    });
  };

  const handleEditChange = (e) => {
    let { name, value } = e.target;
    if (name === "name") value = value.toUpperCase();
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setEditForm({ ...editForm, [name]: value });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const editToast = toast.loading("Updating teacher profile...");
    try {
      const res = await backend.put(
        `/api/teachers/${editingTeacher._id}`,
        editForm,
      );
      setTeachers((prev) =>
        prev.map((t) => (t._id === editingTeacher._id ? res.data : t)),
      );
      setEditingTeacher(null);
      toast.success("Teacher updated successfully!", { id: editToast });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, {
        id: editToast,
      });
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?"))
      return;
    const deleteToast = toast.loading("Deleting teacher...");
    try {
      await backend.delete(`/api/teachers/${id}`);
      setTeachers(teachers.filter((t) => t._id !== id));
      toast.success("Teacher deleted successfully.", { id: deleteToast });
    } catch (err) {
      toast.error("Error deleting teacher.", { id: deleteToast });
    }
  };

  const openAdminEditModal = (admin) => {
    setEditingAdmin(admin);
    setEditAdminForm({
      username: admin.username,
      email: admin.email,
      phone: admin.phone || "",
      designation: admin.designation || "Master Admin",
    });
  };

  const handleAdminEditChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setEditAdminForm({ ...editAdminForm, [name]: value });
  };

  const submitAdminEdit = async (e) => {
    e.preventDefault();
    const editToast = toast.loading("Updating admin profile...");
    try {
      const res = await backend.put(
        `/api/admins/${editingAdmin._id}`,
        editAdminForm,
      );
      setAdmins((prev) =>
        prev.map((a) => (a._id === editingAdmin._id ? res.data : a)),
      );
      setEditingAdmin(null);
      toast.success("Admin updated successfully!", { id: editToast });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, {
        id: editToast,
      });
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this Admin? They will lose all system access.",
      )
    )
      return;
    const deleteToast = toast.loading("Deleting admin...");
    try {
      await backend.delete(`/api/admins/${id}`);
      setAdmins(admins.filter((a) => a._id !== id));
      toast.success("Admin deleted successfully.", { id: deleteToast });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting admin.", {
        id: deleteToast,
      });
    }
  };

  // STYLING
  const inputClassesWithIcon =
    "peer w-full pl-10 pr-4 py-3 rounded-[12px] border border-slate-200/80 bg-slate-50/50 text-slate-800 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white hover:border-slate-300 transition-all duration-300 text-sm outline-none shadow-sm placeholder-slate-400";
  const inputClassesNoIcon =
    "w-full px-4 py-3 rounded-[12px] border border-slate-200/80 bg-slate-50/50 text-slate-800 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white hover:border-slate-300 transition-all duration-300 text-sm outline-none shadow-sm placeholder-slate-400";
  const labelClasses =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1";
  const iconClasses =
    "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none peer-focus:text-indigo-500 transition-colors duration-300";

  return (
    <div className="max-w-7xl mx-auto pb-10 relative z-10 space-y-8">
      {/* 🟢 EDIT MODAL (TEACHERS) */}
      {editingTeacher && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white">
            <div className="bg-slate-50/80 border-b border-slate-200/60 p-5 px-6 flex justify-between items-center sticky top-0">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-[8px]">
                  <FaEdit size={14} />
                </div>
                Edit Faculty Profile
              </h2>
              <button
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors p-2 bg-slate-100 rounded-full"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <form onSubmit={submitEdit} className="p-6 space-y-4.5">
              <div>
                <label className={labelClasses}>Full Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={editForm.name || ""}
                  onChange={handleEditChange}
                  className={inputClassesNoIcon}
                />
              </div>
              <div>
                <label className={labelClasses}>Email Address</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={editForm.email || ""}
                  onChange={handleEditChange}
                  className={inputClassesNoIcon}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Department</label>
                  <select
                    name="department"
                    value={editForm.department || ""}
                    onChange={handleEditChange}
                    className={`${inputClassesNoIcon} appearance-none cursor-pointer`}
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Phone Number</label>
                  <input
                    required
                    type="tel"
                    maxLength="10"
                    minLength="10"
                    pattern="[0-9]{10}"
                    name="phone"
                    value={editForm.phone || ""}
                    onChange={handleEditChange}
                    className={inputClassesNoIcon}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 px-4 py-3.5 rounded-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3.5 rounded-[12px] font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 EDIT MODAL (ADMINS) */}
      {editingAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white">
            <div className="bg-slate-50/80 border-b border-slate-200/60 p-5 px-6 flex justify-between items-center sticky top-0">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-[8px]">
                  <FaUserShield size={14} />
                </div>
                Edit Admin Profile
              </h2>
              <button
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors p-2 bg-slate-100 rounded-full"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <form onSubmit={submitAdminEdit} className="p-6 space-y-4.5">
              <div>
                <label className={labelClasses}>Admin Username</label>
                <input
                  required
                  type="text"
                  name="username"
                  value={editAdminForm.username || ""}
                  onChange={handleAdminEditChange}
                  className={inputClassesNoIcon}
                  minLength="3"
                />
              </div>
              <div>
                <label className={labelClasses}>Role / Designation</label>
                <input
                  required
                  type="text"
                  name="designation"
                  value={editAdminForm.designation || ""}
                  onChange={handleAdminEditChange}
                  className={inputClassesNoIcon}
                />
              </div>
              <div>
                <label className={labelClasses}>Email Address</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={editAdminForm.email || ""}
                  onChange={handleAdminEditChange}
                  className={inputClassesNoIcon}
                />
              </div>
              <div>
                <label className={labelClasses}>Phone Number</label>
                <input
                  required
                  type="tel"
                  maxLength="10"
                  minLength="10"
                  pattern="[0-9]{10}"
                  name="phone"
                  value={editAdminForm.phone || ""}
                  onChange={handleAdminEditChange}
                  className={inputClassesNoIcon}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="flex-1 px-4 py-3.5 rounded-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3.5 rounded-[12px] font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5 tracking-tight">
          <div className="p-2 bg-indigo-50 rounded-[10px] text-indigo-500">
            <FaChalkboardTeacher size={16} />
          </div>
          Manage Staff Access
        </h1>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">
          Register new faculty or create additional system administrators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* ==========================================
            LEFT COLUMN: REGISTRATION FORMS
            ========================================== */}
        <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-[24px] shadow-sm border border-slate-200/60 h-fit">
          <div className="flex bg-slate-100/80 p-1.5 rounded-[16px] mb-8 border border-slate-200/50">
            <button
              onClick={() => handleTabSwitch("teacher")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-[12px] transition-all duration-300 flex justify-center items-center gap-2 ${staffType === "teacher" ? "bg-white text-indigo-600 shadow-sm shadow-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              <FaChalkboardTeacher /> Faculty
            </button>
            <button
              onClick={() => handleTabSwitch("admin")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-[12px] transition-all duration-300 flex justify-center items-center gap-2 ${staffType === "admin" ? "bg-white text-indigo-600 shadow-sm shadow-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              <FaUserShield /> Admin
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100/80 pb-4 tracking-tight">
            {staffType === "teacher"
              ? "Register New Teacher"
              : "Create Admin Role"}
          </h2>

          {/* 🟢 TEACHER FORM */}
          {staffType === "teacher" ? (
            <form
              onSubmit={handleTeacherSubmit}
              className="space-y-4.5 animate-in fade-in duration-300"
            >
              <div>
                <label className={labelClasses}>Full Name</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClassesWithIcon}
                    placeholder="Prof. Jane Doe"
                  />
                  <FaUserTie className={iconClasses} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Teacher ID</label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      name="teacherId"
                      value={formData.teacherId}
                      onChange={handleChange}
                      className={inputClassesWithIcon}
                      placeholder="TA203"
                    />
                    <FaIdBadge className={iconClasses} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`${inputClassesNoIcon} appearance-none cursor-pointer`}
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Email Address</label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClassesWithIcon}
                    placeholder="teacher@college.edu"
                  />
                  <FaEnvelope className={iconClasses} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Phone Number</label>
                <div className="relative">
                  <input
                    required
                    type="tel"
                    maxLength="10"
                    minLength="10"
                    pattern="[0-9]{10}"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClassesWithIcon}
                    placeholder="9876543210"
                  />
                  <FaPhone className={iconClasses} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Default Password</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClassesWithIcon}
                    placeholder="Set a temporary password"
                  />
                  <FaLock className={iconClasses} />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3.5 mt-6 rounded-[12px] font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:shadow-indigo-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />{" "}
                    Processing...
                  </>
                ) : (
                  "Register Faculty"
                )}
              </button>
            </form>
          ) : (
            /* 🟢 ADMIN FORM */
            <form
              onSubmit={handleAdminSubmit}
              className="space-y-4.5 animate-in fade-in duration-300"
            >
              <div className="bg-amber-50/80 p-4 rounded-[16px] border border-amber-200/60 flex items-start gap-3 mb-6">
                <div className="text-amber-500 mt-0.5">
                  <FaExclamationTriangle size={14} />
                </div>
                <p className="text-xs text-amber-800/80 font-medium leading-relaxed">
                  <strong>Warning:</strong> Creating an Admin grants full access
                  to the student database, system logs, and security controls.
                </p>
              </div>

              <div>
                <label className={labelClasses}>Admin Username</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    name="username"
                    value={adminFormData.username}
                    onChange={handleAdminChange}
                    className={inputClassesWithIcon}
                    placeholder="admin_name"
                    minLength="3"
                  />
                  <FaUser className={iconClasses} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Role / Designation</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    name="designation"
                    value={adminFormData.designation}
                    onChange={handleAdminChange}
                    className={inputClassesWithIcon}
                    placeholder="e.g., Principal, Director"
                  />
                  <FaIdBadge className={iconClasses} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Email Address</label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    name="email"
                    value={adminFormData.email}
                    onChange={handleAdminChange}
                    className={inputClassesWithIcon}
                    placeholder="admin@college.edu"
                  />
                  <FaEnvelope className={iconClasses} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Phone Number</label>
                <div className="relative">
                  <input
                    required
                    type="tel"
                    maxLength="10"
                    minLength="10"
                    pattern="[0-9]{10}"
                    name="phone"
                    value={adminFormData.phone}
                    onChange={handleAdminChange}
                    className={inputClassesWithIcon}
                    placeholder="9876543210"
                  />
                  <FaPhone className={iconClasses} />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Secure Password</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    name="password"
                    value={adminFormData.password}
                    onChange={handleAdminChange}
                    className={inputClassesWithIcon}
                    placeholder="Set a strong password"
                    minLength="6"
                  />
                  <FaLock className={iconClasses} />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3.5 mt-6 rounded-[12px] font-bold text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg hover:shadow-slate-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />{" "}
                    Processing...
                  </>
                ) : (
                  "Create Admin Account"
                )}
              </button>
            </form>
          )}
        </div>

        {/* ==========================================
            RIGHT COLUMN: DYNAMIC DIRECTORY
            ========================================== */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-[24px] shadow-sm border border-slate-200/60">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100/80 pb-4 tracking-tight">
            {staffType === "teacher"
              ? "Active Faculty Directory"
              : "System Administrators"}
          </h2>

          {/* 🟢 SEARCH & FILTER BAR */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 group">
              <input
                type="text"
                placeholder={`Search ${staffType === "teacher" ? "teachers" : "admins"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={inputClassesWithIcon}
              />
              <FaSearch className={iconClasses} />
            </div>
            {staffType === "teacher" && (
              <div className="relative w-full sm:w-48 flex-shrink-0 group">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className={`${inputClassesWithIcon} appearance-none cursor-pointer`}
                >
                  <option value="All">All Depts</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <FaUniversity className={iconClasses} />
              </div>
            )}
          </div>

          {fetching ? (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3 bg-slate-50/50 rounded-[16px] border border-slate-100">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="font-medium text-sm">Loading directory...</span>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[400px]">
              {/* 🟢 TEACHER DIRECTORY TABLE */}
              {staffType === "teacher" ? (
                filteredTeachers.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center justify-center bg-white/40 rounded-[20px] border border-dashed border-slate-200/80">
                    <div className="p-4 bg-slate-100 rounded-full mb-3">
                      <FaUserTimes className="text-2xl text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">
                      No teachers found matching your search.
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200/60">
                        <th className="px-6 py-4.5 rounded-tl-[16px]">
                          Teacher Name
                        </th>
                        <th className="px-6 py-4.5">ID & Dept</th>
                        <th className="px-6 py-4.5">Contact Info</th>
                        <th className="px-6 py-4.5 rounded-tr-[16px] text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {filteredTeachers.map((t) => (
                        <tr
                          key={t._id}
                          className="hover:bg-slate-50/80 transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-[12px] bg-indigo-50/80 border border-indigo-100/60 text-indigo-600 flex items-center justify-center text-sm font-bold shadow-sm">
                                {t.name.charAt(0)}
                              </div>
                              {t.name}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/80 border border-indigo-100/60 inline-block px-2.5 py-1.5 rounded-[8px] shadow-sm">
                              {t.teacherId}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-widest pl-1">
                              {t.department} Dept
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[13px] text-slate-600 font-medium">
                              {t.email}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                              <FaPhone className="text-[9px]" /> {t.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-[10px] transition-all hover:-translate-y-0.5"
                                title="Edit Teacher"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(t._id)}
                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-[10px] transition-all hover:-translate-y-0.5"
                                title="Delete Teacher"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : /* 🟢 ADMIN DIRECTORY TABLE */
              filteredAdmins.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center bg-white/40 rounded-[20px] border border-dashed border-slate-200/80">
                  <div className="p-4 bg-slate-100 rounded-full mb-3">
                    <FaUserTimes className="text-2xl text-slate-300" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">
                    No admins found matching your search.
                  </p>
                </div>
              ) : (
                <table className="min-w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200/60">
                      <th className="px-6 py-4.5 rounded-tl-[16px]">
                        Admin Profile
                      </th>
                      <th className="px-6 py-4.5">Role</th>
                      <th className="px-6 py-4.5">Contact Info</th>
                      <th className="px-6 py-4.5 rounded-tr-[16px] text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {filteredAdmins.map((a) => (
                      <tr
                        key={a._id}
                        className="hover:bg-slate-50/80 transition-all duration-300 group hover:-translate-y-[1px] hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[12px] bg-slate-100/80 border border-slate-200/80 text-slate-500 flex items-center justify-center shadow-sm">
                              <FaUserShield size={16} />
                            </div>
                            <div>
                              <div className="tracking-tight">
                                {a.username || "System Admin"}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {a.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[10px] text-slate-600 bg-white shadow-sm border border-slate-200/80 inline-block px-3 py-1.5 rounded-[8px] font-bold uppercase tracking-widest">
                            {a.designation || "Master Admin"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[13px] text-slate-600 font-medium">
                            {a.phone || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={() => openAdminEditModal(a)}
                              className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-[10px] transition-all hover:-translate-y-0.5"
                              title="Edit Admin"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(a._id)}
                              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-[10px] transition-all hover:-translate-y-0.5"
                              title="Delete Admin"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTeachers;
