import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";

import Front from "./pages/Front";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import Addstudent from "./pages/Addstudent";
import Enrolled from "./pages/Enrolled";
import Period from "./pages/Period";
import Reports from "./pages/Reports";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Schedule from "./pages/Schedule";
import StudentDashboard from "./pages/StudentDashboard";
import PromoteStudents from "./pages/PromoteStudents";
import ManageTeachers from "./pages/ManageTeachers";
import TeacherDashboard from "./pages/TeacherDashboard";
import ManualEntry from "./pages/ManualEntry";
import ResetPassword from "./pages/ResetPassword";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { zIndex: 99999 }, // Forces it to the very front
        }}
      />
      <Routes>
        {/* 🌐 PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* 🎓 STUDENT ROUTES */}
        <Route element={<RequireAuth allowedRoles={["student"]} />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
        </Route>

        {/* 👨‍🏫 TEACHER ROUTES */}
        <Route element={<RequireAuth allowedRoles={["teacher"]} />}>
          <Route path="/teacherdashboard" element={<TeacherDashboard />} />
          <Route path="/scanner" element={<Front />} />
          <Route path="/manual-entry" element={<ManualEntry />} />
          <Route path="/teacher-reports" element={<Reports />} />
          <Route path="/teacher-roster" element={<Enrolled />} />
        </Route>

        {/* 🛡️ ADMIN ROUTES (Wrapped in the Admin Sidebar Layout) */}
        <Route element={<RequireAuth allowedRoles={["admin"]} />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/addstudent" element={<Addstudent />} />
            <Route path="/enrolled" element={<Enrolled />} />
            <Route path="/period" element={<Period />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/promote" element={<PromoteStudents />} />
            <Route path="/manageteacher" element={<ManageTeachers />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
