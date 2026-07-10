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
} from "react-icons/fa";
import { backend } from "../services/api";
import toast from "react-hot-toast";

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 🟢 Staff Toggle State
  const [staffType, setStaffType] = useState("teacher"); // "teacher" or "admin"

  // 🟢 SEARCH & FILTER STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  // 🟢 Teacher Create State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    teacherId: "",
    department: "CSE",
    password: "",
  });

  // 🟢 Admin Create State
  const [adminFormData, setAdminFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    designation: "Master Admin",
  });

  // 🟢 Edit States
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

  // ==========================================
  // 🟢 FILTERING LOGIC
  // ==========================================
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
    const matchesSearch =
      (a.username && a.username.toLowerCase().includes(query)) ||
      (a.email && a.email.toLowerCase().includes(query)) ||
      (a.designation && a.designation.toLowerCase().includes(query)) ||
      (a.phone && a.phone.includes(query));

    return matchesSearch;
  });

  const handleTabSwitch = (type) => {
    setStaffType(type);
    setSearchQuery("");
    setSelectedDept("All");
  };

  // ==========================================
  // 🟢 REGISTRATION HANDLERS
  // ==========================================
  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "name" || name === "teacherId") value = value.toUpperCase();
    // 🟢 Strip letters/symbols and cap at 10 digits
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
    // 🟢 Strip letters/symbols and cap at 10 digits
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

  // ==========================================
  // 🟢 EDIT & DELETE HANDLERS (TEACHERS)
  // ==========================================
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
    // 🟢 Strip letters/symbols and cap at 10 digits
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

  // ==========================================
  // 🟢 EDIT & DELETE HANDLERS (ADMINS)
  // ==========================================
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
    // 🟢 Strip letters/symbols and cap at 10 digits
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

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen relative pb-20">
      {/* 🟢 EDIT MODAL (TEACHERS) */}
      {editingTeacher && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Edit Faculty Profile
              </h2>
              <button
                onClick={() => setEditingTeacher(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={submitEdit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={editForm.name || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={editForm.email || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                    Department
                  </label>
                  <select
                    name="department"
                    value={editForm.department || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                    Phone Number
                  </label>
                  <input
                    required
                    type="tel"
                    maxLength="10"
                    minLength="10"
                    pattern="[0-9]{10}"
                    name="phone"
                    value={editForm.phone || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
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

      {/* 🟢 EDIT MODAL (ADMINS) */}
      {editingAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="bg-indigo-50 border-b border-indigo-100 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <FaUserShield /> Edit Admin Profile
              </h2>
              <button
                onClick={() => setEditingAdmin(null)}
                className="text-indigo-400 hover:text-red-500 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={submitAdminEdit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Admin Username
                </label>
                <input
                  required
                  type="text"
                  name="username"
                  value={editAdminForm.username || ""}
                  onChange={handleAdminEditChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Role / Designation
                </label>
                <input
                  required
                  type="text"
                  name="designation"
                  value={editAdminForm.designation || ""}
                  onChange={handleAdminEditChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={editAdminForm.email || ""}
                  onChange={handleAdminEditChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Phone Number
                </label>
                <input
                  required
                  type="tel"
                  maxLength="10"
                  minLength="10"
                  pattern="[0-9]{10}"
                  name="phone"
                  value={editAdminForm.phone || ""}
                  onChange={handleAdminEditChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaChalkboardTeacher className="text-blue-600" /> Manage Staff Access
        </h1>
        <p className="text-gray-500 mt-1">
          Register new faculty or create additional system administrators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ==========================================
            LEFT COLUMN: REGISTRATION FORMS
            ========================================================================== */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => handleTabSwitch("teacher")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${
                staffType === "teacher"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaChalkboardTeacher /> Faculty
            </button>
            <button
              onClick={() => handleTabSwitch("admin")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${
                staffType === "admin"
                  ? "bg-white text-indigo-600 shadow-md"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaUserShield /> Admin
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {staffType === "teacher"
              ? "Register New Teacher"
              : "Create Admin Role"}
          </h2>

          {/* 🟢 TEACHER FORM */}
          {staffType === "teacher" ? (
            <form
              onSubmit={handleTeacherSubmit}
              className="space-y-4 animate-fadeIn"
            >
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <FaUserTie className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800"
                    placeholder="PROF. Mority"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Teacher ID
                  </label>
                  <div className="relative mt-1">
                    <FaIdBadge className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      required
                      type="text"
                      name="teacherId"
                      value={formData.teacherId}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-blue-700 font-bold"
                      placeholder="TA203..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 mt-1 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700"
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
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700"
                    placeholder="teacher@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Phone Number
                </label>
                <div className="relative mt-1">
                  <FaPhone className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="tel"
                    maxLength="10"
                    minLength="10"
                    pattern="[0-9]{10}"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Default Password
                </label>
                <div className="relative mt-1">
                  <FaLock className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700"
                    placeholder="Set a temporary password"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3 mt-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-gray-400 shadow-md"
              >
                {loading ? "Processing..." : "Register Faculty"}
              </button>
            </form>
          ) : (
            /* 🟢 ADMIN FORM */
            <form
              onSubmit={handleAdminSubmit}
              className="space-y-4 animate-fadeIn"
            >
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3 mb-4">
                <div className="text-indigo-500 mt-0.5">⚠️</div>
                <p className="text-xs text-indigo-800">
                  <strong>Warning:</strong> Creating an Admin grants this user
                  full access to the entire student database, system logs, and
                  security controls.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Admin Username
                </label>
                <div className="relative mt-1">
                  <FaUser className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="text"
                    name="username"
                    value={adminFormData.username}
                    onChange={handleAdminChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-800"
                    placeholder="admin_name"
                    minLength="3"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Role / Designation
                </label>
                <div className="relative mt-1">
                  <FaIdBadge className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="text"
                    name="designation"
                    value={adminFormData.designation}
                    onChange={handleAdminChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-800"
                    placeholder="e.g., Principal, Director"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="email"
                    name="email"
                    value={adminFormData.email}
                    onChange={handleAdminChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700"
                    placeholder="admin@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Phone Number
                </label>
                <div className="relative mt-1">
                  <FaPhone className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="tel"
                    maxLength="10"
                    minLength="10"
                    pattern="[0-9]{10}"
                    name="phone"
                    value={adminFormData.phone}
                    onChange={handleAdminChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Secure Password
                </label>
                <div className="relative mt-1">
                  <FaLock className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="text"
                    name="password"
                    value={adminFormData.password}
                    onChange={handleAdminChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700"
                    placeholder="Set a strong password"
                    minLength="6"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3 mt-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:bg-gray-400 shadow-md"
              >
                {loading ? "Processing..." : "Create Admin Account"}
              </button>
            </form>
          )}
        </div>

        {/* ==========================================
            RIGHT COLUMN: DYNAMIC DIRECTORY
            ========================================================================== */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {staffType === "teacher"
              ? "Active Faculty Directory"
              : "System Administrators"}
          </h2>

          {/* 🟢 NEW: SEARCH & FILTER BAR */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${staffType === "teacher" ? "teachers by name, ID, or email" : "admins by name, role, or email"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {staffType === "teacher" && (
              <div className="relative w-full sm:w-48 flex-shrink-0">
                <FaUniversity className="absolute left-3 top-3.5 text-gray-400" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="All">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {fetching ? (
            <div className="text-center py-10 text-gray-500 font-bold animate-pulse">
              Loading directory...
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* 🟢 TEACHER DIRECTORY TABLE */}
              {staffType === "teacher" ? (
                filteredTeachers.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 italic border-2 border-dashed border-gray-200 rounded-2xl">
                    No teachers found matching your search.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-bold">
                        <th className="p-4 rounded-tl-xl">Teacher Name</th>
                        <th className="p-4">ID & Dept</th>
                        <th className="p-4">Contact Info</th>
                        <th className="p-4 rounded-tr-xl text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTeachers.map((t) => (
                        <tr
                          key={t._id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-bold text-gray-800">
                              {t.name}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-mono text-sm font-bold text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded">
                              {t.teacherId}
                            </div>
                            <div className="text-xs text-gray-500 font-bold mt-1">
                              {t.department} Dept
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-600 font-medium">
                              {t.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {t.phone}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-2 text-blue-500 hover:text-white bg-blue-50 hover:bg-blue-500 border border-blue-100 shadow-sm rounded-lg transition-colors"
                                title="Edit Teacher"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(t._id)}
                                className="p-2 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 border border-rose-100 shadow-sm rounded-lg transition-colors"
                                title="Delete Teacher"
                              >
                                <FaTrash />
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
                <div className="text-center py-10 text-gray-500 italic border-2 border-dashed border-gray-200 rounded-2xl">
                  No admins found matching your search.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-bold">
                      <th className="p-4 rounded-tl-xl">Admin Profile</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4 rounded-tr-xl text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAdmins.map((a) => (
                      <tr
                        key={a._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-bold text-gray-800 flex items-center gap-2">
                            <FaUserShield className="text-indigo-400" />{" "}
                            {a.username || "System Admin"}
                          </div>
                          <div className="text-xs text-gray-400 font-medium ml-6 mt-0.5">
                            {a.email}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs text-indigo-700 bg-indigo-50 inline-block px-2 py-1 rounded-md font-bold uppercase tracking-wide">
                            {a.designation || "Master Admin"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600 font-medium">
                            {a.phone || "N/A"}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openAdminEditModal(a)}
                              className="p-2 text-indigo-500 hover:text-white bg-indigo-50 hover:bg-indigo-500 border border-indigo-100 shadow-sm rounded-lg transition-colors"
                              title="Edit Admin"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(a._id)}
                              className="p-2 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 border border-rose-100 shadow-sm rounded-lg transition-colors"
                              title="Delete Admin"
                            >
                              <FaTrash />
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
