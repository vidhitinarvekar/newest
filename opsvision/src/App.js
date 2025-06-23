// App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Delegate from './Component/Delegate';
import Login from "./Component/Login";
import ProjectTable from "./Component/ProjectTable";
import ProjectDetails from "./Component/ProjectDetails";
import ProjectTrackingDashboard from "./Component/ProjectTrackingDashboard";
import LandingPage from "./Component/LandingPage";
import Manager from "./Component/Manager"

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsCheckingAuth(false);

    const handleBeforeUnload = () => {
      localStorage.clear();
      sessionStorage.clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  };

  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />

      {isAuthenticated ? (
        <>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/project-table" element={<ProjectTable />} />
          <Route path="/project/:projectId" element={<ProjectDetails />} />
          <Route path="/dashboard" element={<ProjectTrackingDashboard />} />
          <Route path="/delegate/:projectId" element={<Delegate />} />
          <Route path="/manager" element={<Manager />} />

          <Route path="*" element={<Navigate to="/landing" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default App;