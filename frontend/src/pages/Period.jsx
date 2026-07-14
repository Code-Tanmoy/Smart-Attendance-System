import React, { useEffect, useState } from "react";
import {
  FaChalkboardTeacher,
  FaClock,
  FaCalendarDay,
  FaUniversity,
  FaLayerGroup,
} from "react-icons/fa";
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

  // Filters
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

  const displaySubjects = subjects
    .filter((sub) => {
      const matchDept =
        cardFilterDept === "All" || sub.department === cardFilterDept;
      const matchSem =
        cardFilterSem === "All" || String(sub.semester) === cardFilterSem;
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

  const selectClasses =
    "w-full pl-10 pr-10 py-2.5 rounded-[12px] bg-white/50 border border-slate-200/80 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 appearance-none shadow-sm hover:bg-white hover:border-slate-300 cursor-pointer";
  const iconClasses =
    "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm z-10 pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300";

  return (
    <div className="max-w-7xl mx-auto pb-10 relative z-10 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-[10px] text-indigo-500">
              <FaClock size={16} />
            </div>
            Period Status
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Monitor live and upcoming classes across the campus.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-md px-4 py-3 rounded-[16px] shadow-sm border border-slate-200/60 flex items-center gap-3 w-full lg:w-auto">
          <span className="relative flex h-3 w-3 flex-shrink-0 items-center justify-center">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentPeriods.length > 0 ? "bg-emerald-400" : "bg-slate-400"}`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentPeriods.length > 0 ? "bg-emerald-500" : "bg-slate-400"}`}
            ></span>
          </span>
          <span className="text-slate-500 text-sm font-medium truncate max-w-[250px] sm:max-w-[400px]">
            Live Now:{" "}
            <span
              className={`font-bold ${currentPeriods.length > 0 ? "text-emerald-600" : "text-slate-700"}`}
            >
              {currentPeriods.length > 0
                ? currentPeriods.map((p) => p.name).join(", ")
                : "No Active Periods"}
            </span>
          </span>
        </div>
      </div>

      {/* FILTER BAR FOR CARDS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-slate-200/60 pb-6">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {cardFilterDay === "All"
            ? "Weekly Schedule"
            : `${cardFilterDay}'s Schedule`}
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto bg-white/40 backdrop-blur-sm p-2 rounded-[16px] border border-slate-200/60 shadow-sm">
          <div className="relative w-full sm:w-40 group">
            <FaCalendarDay className={iconClasses} />
            <select
              value={cardFilterDay}
              onChange={(e) => setCardFilterDay(e.target.value)}
              className={selectClasses}
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
          </div>

          <div className="relative w-full sm:w-40 group">
            <FaUniversity className={iconClasses} />
            <select
              value={cardFilterDept}
              onChange={(e) => setCardFilterDept(e.target.value)}
              className={selectClasses}
            >
              <option value="All">All Depts</option>
              {["CSE", "ECE", "ME", "AI", "CS", "IT"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-36 group">
            <FaLayerGroup className={iconClasses} />
            <select
              value={cardFilterSem}
              onChange={(e) => setCardFilterSem(e.target.value)}
              className={selectClasses}
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
      </div>

      {/* DYNAMIC SCHEDULE CARDS */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4 text-slate-400 bg-white/40 rounded-[24px] border border-slate-200/60">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="font-medium text-sm">Loading schedule data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6 mb-8">
          {displaySubjects.length > 0 ? (
            displaySubjects.map((subject) => {
              const isLive = currentPeriods.some((p) => p.id === subject._id);
              const todayCount = attendanceData.filter((log) => {
                const logDate = new Date(log.recognizedAt)
                  .toISOString()
                  .split("T")[0];
                return log.period === subject.name && logDate === todayStr;
              }).length;

              const normalizedDays = Array.isArray(subject.day)
                ? subject.day
                : [subject.day].filter(Boolean);

              return (
                <div
                  key={subject._id}
                  className={`relative flex flex-col justify-between rounded-[20px] p-5 border transition-all duration-300 hover:-translate-y-1 ${
                    isLive
                      ? "bg-gradient-to-b from-indigo-50/80 to-white border-indigo-200 ring-4 ring-indigo-500/10 z-10 shadow-xl shadow-indigo-200/40"
                      : "bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300"
                  }`}
                >
                  {isLive && (
                    <div className="absolute -top-3 -right-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-rose-200 animate-pulse tracking-widest uppercase border border-rose-400/50">
                      LIVE NOW
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-1.5 flex-wrap">
                      <div className="text-[10px] font-bold text-slate-600 bg-slate-100/80 border border-slate-200/80 px-2.5 py-1 rounded-[8px] uppercase tracking-widest shadow-sm">
                        {subject.department}
                      </div>

                      {cardFilterDay === "All" && (
                        <div className="flex gap-1 flex-wrap">
                          {normalizedDays.map((d) => (
                            <div
                              key={d}
                              className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 border border-indigo-100/60 px-2 py-1 rounded-[8px] tracking-widest uppercase shadow-sm"
                            >
                              {d.slice(0, 3)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] font-bold text-slate-400 text-right mt-1 tracking-widest uppercase">
                      <div>{subject.year}</div>
                      <div className="text-indigo-500">
                        {subject.semester} Sem
                      </div>
                    </div>
                  </div>

                  <h2
                    className={`text-[17px] font-bold mb-1.5 truncate tracking-tight ${isLive ? "text-indigo-800" : "text-slate-800"}`}
                    title={subject.name}
                  >
                    {subject.name}
                  </h2>

                  <div
                    className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mb-6 truncate bg-slate-50/50 w-fit px-2 py-1 rounded-[6px] border border-slate-100"
                    title={subject.teacher}
                  >
                    <FaChalkboardTeacher className="text-slate-400" />{" "}
                    {subject.teacher}
                  </div>

                  <div className="pt-4 border-t border-slate-100/80 flex justify-between items-center mt-auto">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-1.5 rounded-[10px] shadow-sm">
                      <FaClock className="text-indigo-400" size={10} />
                      {subject.startTime} - {subject.endTime}
                    </div>
                    <div className="text-2xl font-black text-slate-800 flex items-baseline gap-1 tracking-tighter">
                      {todayCount}{" "}
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        Present
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white/40 backdrop-blur-sm rounded-[24px] border border-slate-200/60 border-dashed">
              <div className="p-4 bg-slate-100 rounded-full mb-3">
                <FaLayerGroup className="text-2xl text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                No classes match your current filters.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Period;
