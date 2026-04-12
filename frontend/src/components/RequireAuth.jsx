// frontend/src/components/RequireAuth.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { backend } from "../services/api";

const RequireAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
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

  // 1. While checking, show a blank screen or a spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
        Checking access...
      </div>
    );
  }

  // 2. If not authenticated, redirect IMMEDIATELY
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // 3. If authenticated, render the children (Layout/Dashboard)
  return <Outlet />;
};

export default RequireAuth;
