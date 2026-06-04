import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { backend } from "../services/api";

const RequireAuth = ({ allowedRoles }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const role = localStorage.getItem("userRole");

        // 🟢 Student Auth Exception:
        // If your students don't use the exact same HTTP-only cookie system as staff,
        // we verify them via their locally stored URN.
        if (role === "student") {
          const urn = localStorage.getItem("studentUrn");
          setIsAuthenticated(!!urn);
          setLoading(false);
          return;
        }

        // 🟢 Staff Auth (Admin & Teacher): Verify the HTTP-only cookie with the backend
        await backend.get("/check-auth");
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
        Verifying Security Credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // 🛡️ ROLE-BASED ACCESS CONTROL (RBAC)
  const userRole = localStorage.getItem("userRole");

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If they try to access a page they shouldn't, route them to their proper home
    if (userRole === "student")
      return <Navigate to="/student-dashboard" replace />;
    if (userRole === "teacher")
      return <Navigate to="/teacherdashboard" replace />;
    if (userRole === "admin") return <Navigate to="/dashboard" replace />;

    // Failsafe
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
