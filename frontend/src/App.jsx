// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Pages
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
import StudentDashboard from "./pages/StudentDashboard"; // 🟢 NEW IMPORT

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Front />} />
        <Route path="/signin" element={<Signin />} />

        {/* 🟢 NEW: Student Dashboard (Auth handled inside component) */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />

        {/* 🔒 PROTECTED ADMIN ROUTES */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/addstudent" element={<Addstudent />} />
            <Route path="/enrolled" element={<Enrolled />} />
            <Route path="/period" element={<Period />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/schedule" element={<Schedule />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
