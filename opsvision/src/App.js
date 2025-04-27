import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Component/Login";
import ProjectTable from "./Component/ProjectTable";
import ProjectDetails from "./Component/ProjectDetails";
import ProjectTrackingDashboard from "./Component/ProjectTrackingDashboard";
import LandingPage from "./Component/LandingPage";

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      setUser({ token, role });
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false); // Done checking

    // Clear local storage on page unload
    const handleBeforeUnload = () => {
      localStorage.clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("name", userData.name || "");
    localStorage.setItem("email", userData.email);
    localStorage.setItem("staffId", userData.staffId || "");

    setUser(userData);
    setIsAuthenticated(true);

    // Navigate to landing page after successful login for all roles
    navigate("/landing", { replace: true });
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  };

  if (isCheckingAuth) {
    return <div>Loading...</div>; // Show loading while checking auth
  }

  return (
    <Routes>
      <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} handleLogin={handleLogin} />} />
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <Navigate to="/landing" replace />
          )
        }
      />
      {isAuthenticated && <Route path="/landing" element={<LandingPage />} />}
      {isAuthenticated && (user?.role === "VerticalLead" || user?.role === "ProjectOwner" || user?.role === "PeopleManager") && (
        <>
          <Route path="/project-table" element={<ProjectTable />} />
          <Route path="/project/:projectId" element={<ProjectDetails />} />
        </>
      )}
      {isAuthenticated && <Route path="/dashboard" element={<ProjectTrackingDashboard />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
