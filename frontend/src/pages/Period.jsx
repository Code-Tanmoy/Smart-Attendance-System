import React, { useEffect, useState } from "react";
import { FaChalkboardTeacher, FaClock } from "react-icons/fa";
import { backend } from "../services/api";

const Period = () => {
  const todayStr = new Date().toISOString().split("T")[0];
  const currentDayName = new Date().toLocaleDateString("en-US", {
    weekday: "long",
  });

  const [attendanceData, setAttendanceData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentPeriods, setCurrentPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Filters for Cards
  const [cardFilterDept, setCardFilterDept] = useState("All");
  const [cardFilterSem, setCardFilterSem] = useState("All");
  const [cardFilterDay, setCardFilterDay] = useState(
    ["Saturday", "Sunday"].includes(currentDayName) ? "All" : currentDayName,
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, subjectsRes] = await Promise.all([
          backend.get("/api/periodwise-attendance"),
          backend.get("/api/subjects"),
        ]);
        setAttendanceData(logsRes.data);
        const sortedSubjects = subjectsRes.data.sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        );
        setSubjects(sortedSubjects);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCurrentPeriods = async () => {
      try {
        const res = await backend.get("/api/periodwise-attendance/current");
        setCurrentPeriods(res.data.periods || []);
      } catch (err) {
        console.error("Error fetching period");
      }
    };
    fetchCurrentPeriods();
    const interval = setInterval(fetchCurrentPeriods, 60000);
    return () => clearInterval(interval);
  }, []);

  // 📊 FILTER & SORT LOGIC FOR CARDS
  const displaySubjects = subjects
    .filter((sub) => {
      const matchDept =
        cardFilterDept === "All" || sub.department === cardFilterDept;
      const matchSem =
        cardFilterSem === "All" || String(sub.semester) === cardFilterSem;

      // 🟢 UPDATED: Safely handle both array and old string formats
      const normalizedDays = Array.isArray(sub.day)
        ? sub.day
        : [sub.day].filter(Boolean);
      const matchDay =
        cardFilterDay === "All" || normalizedDays.includes(cardFilterDay);

      return matchDept && matchSem && matchDay;
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      if (a.semester !== b.semester)
        return String(a.semester).localeCompare(String(b.semester));
      return a.startTime.localeCompare(b.startTime);
    });

  return (
    <>
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            Period Status
          </h1>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
          <span className={`relative flex h-3 w-3`}>
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                currentPeriods.length > 0 ? "bg-green-400" : "bg-gray-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                currentPeriods.length > 0 ? "bg-green-500" : "bg-gray-500"
              }`}
            ></span>
          </span>
          <span className="text-gray-600 text-sm font-medium">
            Active:{" "}
            <span className="font-bold text-gray-800">
              {currentPeriods.length > 0
                ? currentPeriods.map((p) => p.name).join(", ")
                : "No Period"}
            </span>
          </span>
        </div>
      </div>

      {/* 🟢 FILTER BAR FOR CARDS */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-bold text-gray-800">
          {cardFilterDay === "All"
            ? "Weekly Schedule"
            : `${cardFilterDay}'s Schedule`}
        </h2>

        <div className="flex gap-2">
          <select
            value={cardFilterDay}
            onChange={(e) => setCardFilterDay(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="All">All Days</option>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
              (day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ),
            )}
          </select>

          <select
            value={cardFilterDept}
            onChange={(e) => setCardFilterDept(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="All">All Depts</option>
            {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={cardFilterSem}
            onChange={(e) => setCardFilterSem(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="All">All Sems</option>
            {["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => (
              <option key={s} value={s}>
                Sem {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📅 DYNAMIC SCHEDULE CARDS */}
      {loading ? (
        <div className="py-10 text-center text-gray-400">
          Loading schedule...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {displaySubjects.length > 0 ? (
            displaySubjects.map((subject) => {
              const isLive = currentPeriods.some((p) => p.id === subject._id);
              const todayCount = attendanceData.filter((log) => {
                const logDate = new Date(log.recognizedAt)
                  .toISOString()
                  .split("T")[0];
                return log.period === subject.name && logDate === todayStr;
              }).length;

              // 🟢 NEW: Ensure day is treated as an array for rendering
              const normalizedDays = Array.isArray(subject.day)
                ? subject.day
                : [subject.day].filter(Boolean);

              return (
                <div
                  key={subject._id}
                  className={`relative flex flex-col justify-between rounded-2xl p-4 border transition-all ${
                    isLive
                      ? "bg-white border-blue-500 ring-4 ring-blue-500/10 z-10 scale-105"
                      : "bg-white border-gray-100"
                  }`}
                >
                  {isLive && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg animate-pulse">
                      LIVE
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">
                        {subject.department}
                      </div>

                      {/* 🟢 UPDATED: Render a small pill for each day if viewing All Days */}
                      {cardFilterDay === "All" && (
                        <div className="flex gap-1 flex-wrap">
                          {normalizedDays.map((d) => (
                            <div
                              key={d}
                              className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-1 rounded tracking-wide"
                            >
                              {d.slice(0, 3).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] font-bold text-gray-400 text-right">
                      <div>{subject.year}</div>
                      <div className="text-blue-400">
                        {subject.semester} Sem
                      </div>
                    </div>
                  </div>

                  <h2
                    className={`text-lg font-bold mb-1 mt-1 ${
                      isLive ? "text-blue-600" : "text-gray-800"
                    }`}
                  >
                    {subject.name}
                  </h2>
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-3">
                    <FaChalkboardTeacher /> {subject.teacher}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <FaClock className="text-gray-300" />
                      {subject.startTime} - {subject.endTime}
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {todayCount}{" "}
                      <span className="text-[10px] text-gray-400 font-normal">
                        Present
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
              No classes match your filter.
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Period;
