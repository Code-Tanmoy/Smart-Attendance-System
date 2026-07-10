import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaIdCard,
  FaBook,
  FaPhoneAlt,
  FaCamera,
  FaEnvelope,
  FaUniversity,
  FaIdBadge,
} from "react-icons/fa";
import { backend, faceApi } from "../services/api";
import toast from "react-hot-toast"; 

const Addstudent = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [student, setStudent] = useState({
    name: "",
    urn: "",
    email: "",
    age: "",
    phone: "",
    department: "",
    year: "",
    semester: "",
  });

  // Camera Setup
  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing webcam: ", err);
        // 🟢 NEW: Added a toast in case camera is blocked
        toast.error("Camera access denied or unavailable.", { icon: "📸" });
      }
    };
    getCameraStream();
  }, []);

  const semesterMap = {
    "1st Year": ["1st", "2nd"],
    "2nd Year": ["3rd", "4th"],
    "3rd Year": ["5th", "6th"],
    "4th Year": ["7th", "8th"],
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "name") {
      value = value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();
    } else if (name === "age") {
      value = value.replace(/\D/g, "").slice(0, 2);
    } else if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setStudent((prev) => {
      const updatedStudent = { ...prev, [name]: value };
      if (name === "year") updatedStudent.semester = "";
      return updatedStudent;
    });
  };

  const captureAndSend = async () => {
    if (
      !student.name ||
      !student.urn ||
      !student.email ||
      !student.age ||
      !student.phone ||
      !student.department ||
      !student.year ||
      !student.semester
    ) {
      // 🟢 NEW: Replaced alert with error toast
      toast.error("Please fill in ALL college details and student info.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      setLoading(true);
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");

      // 🟢 NEW: Fire a loading toast for the multi-step enrollment
      const enrollToast = toast.loading("Enrolling student face & data...");

      try {
        await faceApi.post("/enroll", { urn: student.urn, image: imageData });

        try {
          await backend.post("/api/students", student);

          // 🟢 NEW: Transform loading toast into success toast
          toast.success(`${student.name} enrolled successfully!`, {
            id: enrollToast,
          });

          // Reset form including Email
          setStudent({
            name: "",
            urn: "",
            email: "",
            age: "",
            phone: "",
            department: "",
            year: "",
            semester: "",
          });
        } catch (dbError) {
          console.warn("Database save failed. Rolling back face enrollment...");
          try {
            await faceApi.post("/delete", { urn: student.urn });
          } catch (rollbackError) {
            console.error("CRITICAL: Rollback failed for URN:", student.urn);
          }

          throw new Error(
            dbError.response?.data?.message ||
              dbError.response?.data?.errors?.[0] ||
              "Failed to save to database. Face data reversed.",
          );
        }
      } catch (err) {
        // 🟢 NEW: Transform loading toast into error toast
        toast.error(err.message || "Failed to enroll.", { id: enrollToast });
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Camera is not ready yet. Please wait a moment.");
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Enroll Student</h1>
        <p className="text-gray-600 text-sm">Organize students</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="w-full xl:w-2/5 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FaUser className="text-blue-500" /> Basic Information
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Full Name
              </label>
              <div className="relative mt-1">
                <FaUser className="absolute left-4 top-3.5 text-gray-300" />
                <input
                  type="text"
                  name="name"
                  value={student.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200"
                  placeholder="LUFFY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* URN */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  URN / ID
                </label>
                <div className="relative mt-1">
                  <FaIdCard className="absolute left-4 top-3.5 text-gray-300" />
                  <input
                    type="text"
                    name="urn"
                    value={student.urn}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200"
                    placeholder="276001..."
                  />
                </div>
              </div>
              {/* Age */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={student.age}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200"
                  placeholder="21"
                />
              </div>
            </div>

            {/* Email Input Box */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                College Email
              </label>
              <div className="relative mt-1">
                <FaEnvelope className="absolute left-4 top-3.5 text-gray-300" />
                <input
                  type="email"
                  name="email"
                  value={student.email}
                  onChange={(e) =>
                    setStudent({
                      ...student,
                      email: e.target.value.toLowerCase(),
                    })
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="student@gamil.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Phone
              </label>
              <div className="relative mt-1">
                <FaPhoneAlt className="absolute left-4 top-3.5 text-gray-300 text-xs" />
                <input
                  type="text"
                  name="phone"
                  value={student.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <hr className="my-4 border-gray-100" />
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaUniversity className="text-blue-500" /> College Hierarchy
            </h2>

            {/* Department Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Department
              </label>
              <select
                name="department"
                value={student.department}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200"
              >
                <option value="">Select Dept</option>
                <option value="CSE">Computer Science Eng (CSE)</option>
                <option value="CS">Cyber Security (CS)</option>
                <option value="IT">Information Tech (IT)</option>
                <option value="AI">Artificial Intelligence (AI)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="ME">Mechanical (ME)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Year Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Year
                </label>
                <select
                  name="year"
                  value={student.year}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200"
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              {/* Semester Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Semester
                </label>
                <select
                  name="semester"
                  value={student.semester}
                  onChange={handleChange}
                  disabled={!student.year}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 disabled:opacity-50"
                >
                  <option value="">Select Sem</option>
                  {student.year &&
                    semesterMap[student.year].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem} Sem
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 📷 CAMERA SECTION */}
        <div className="w-full xl:w-3/5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                className="hidden"
              />
            </div>
          </div>

          <button
            onClick={captureAndSend}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
            }`}
          >
            {loading ? (
              "Registering..."
            ) : (
              <>
                <FaCamera /> Enroll & Save Student
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Addstudent;
