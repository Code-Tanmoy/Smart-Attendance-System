import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaIdCard,
  FaPhoneAlt,
  FaCamera,
  FaEnvelope,
  FaUniversity,
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

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing webcam: ", err);
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
    if (name === "name")
      value = value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();
    else if (name === "age") value = value.replace(/\D/g, "").slice(0, 2);
    else if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);

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
      return toast.error(
        "Please fill in ALL college details and student info.",
      );
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      setLoading(true);
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");

      const enrollToast = toast.loading("Enrolling student face & data...");

      try {
        await faceApi.post("/enroll", { urn: student.urn, image: imageData });
        try {
          await backend.post("/api/students", student);
          toast.success(`${student.name} enrolled successfully!`, {
            id: enrollToast,
          });
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
        toast.error(err.message || "Failed to enroll.", { id: enrollToast });
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Camera is not ready yet. Please wait a moment.");
    }
  };

  const inputClasses =
    "peer w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/60 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-300 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm";
  const selectClasses =
    "w-full mt-1.5 px-4 py-3 rounded-[12px] bg-white/60 border border-slate-200/80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-300 focus:bg-white transition-all duration-300 text-sm font-medium text-slate-800 appearance-none disabled:opacity-50 disabled:bg-slate-50 shadow-sm cursor-pointer";
  const labelClasses =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1";
  const iconClasses =
    "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm peer-focus:text-indigo-500 transition-colors duration-300 pointer-events-none";

  return (
    <div className="max-w-7xl mx-auto relative z-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Enroll Student
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          Register new students with AI face verification.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* FORM SECTION */}
        <div className="w-full lg:w-[45%] bg-white/80 backdrop-blur-sm rounded-[20px] shadow-sm border border-slate-200/60 p-6 sm:p-8 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100/60 pb-4 tracking-tight">
            <div className="p-2 bg-indigo-50 rounded-[10px] text-indigo-500">
              <FaUser size={16} />
            </div>
            Basic Information
          </h2>

          <div className="space-y-4.5">
            <div className="space-y-1.5">
              <label className={labelClasses}>Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={student.name}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="John Doe"
                />
                <FaUser className={iconClasses} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClasses}>URN / ID</label>
                <div className="relative">
                  <input
                    type="text"
                    name="urn"
                    value={student.urn}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="276001..."
                  />
                  <FaIdCard className={iconClasses} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Age</label>
                <input
                  type="number"
                  name="age"
                  value={student.age}
                  onChange={handleChange}
                  className={`${inputClasses.replace("pl-10", "pl-4")}`}
                  placeholder="21"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>College Email</label>
              <div className="relative">
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
                  className={inputClasses}
                  placeholder="student@college.edu"
                />
                <FaEnvelope className={iconClasses} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Phone</label>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  value={student.phone}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="9876543210"
                />
                <FaPhoneAlt className={iconClasses} />
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2 border-b border-slate-100/60 pb-4 tracking-tight">
              <div className="p-2 bg-indigo-50 rounded-[10px] text-indigo-500">
                <FaUniversity size={16} />
              </div>
              College Hierarchy
            </h2>

            <div className="space-y-1.5">
              <label className={labelClasses}>Department</label>
              <select
                name="department"
                value={student.department}
                onChange={handleChange}
                className={selectClasses}
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
              <div className="space-y-1.5">
                <label className={labelClasses}>Year</label>
                <select
                  name="year"
                  value={student.year}
                  onChange={handleChange}
                  className={selectClasses}
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>Semester</label>
                <select
                  name="semester"
                  value={student.semester}
                  onChange={handleChange}
                  disabled={!student.year}
                  className={selectClasses}
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

        {/* CAMERA SECTION */}
        <div className="w-full lg:w-[55%] flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-[20px] shadow-sm border border-slate-200/60 p-3 sm:p-5">
            <div className="relative aspect-[4/3] sm:aspect-video bg-slate-900 rounded-[16px] overflow-hidden shadow-inner flex items-center justify-center border border-slate-800 group">
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

              {/* Modern AI Face Framing Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-64 sm:w-56 sm:h-72 border border-white/10 relative shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_0_9999px_rgba(0,0,0,0.2)] transition-shadow duration-500 rounded-3xl">
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-3xl"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-3xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-3xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-3xl"></div>
                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400/50 blur-[2px] animate-[scan_3s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={captureAndSend}
            disabled={loading}
            className={`w-full py-4 rounded-[16px] font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-3 text-lg ${
              loading
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-wait shadow-none"
                : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-200/50 hover:shadow-indigo-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
                Registering Data...
              </div>
            ) : (
              <>
                <FaCamera className="text-xl" /> Enroll & Save Student
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Addstudent;
