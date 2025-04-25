import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Component/Login";
import ProjectTable from "./Component/ProjectTable";
import ProjectDetails from "./Component/ProjectDetails";
import ProjectTrackingDashboard from "./Component/ProjectTrackingDashboard";
import LandingPage from "./Component/LandingPage";
import LoginPage from "./Component/Login";

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // ✅ add this
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const staffId = localStorage.getItem("staffId");

    if (token && role) {
      setUser({ token, role, name });
      setIsAuthenticated(true);

      const hasRefreshed = sessionStorage.getItem("hasRefreshed");
      if (!hasRefreshed) {
        sessionStorage.setItem("hasRefreshed", "true");
        window.location.reload();
      } else {
        setIsCheckingAuth(false); // ✅ done checking
      }
    } else {
      setIsCheckingAuth(false); // ✅ done checking
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("name", userData.name || "");
    localStorage.setItem("email", userData.email);
    localStorage.setItem("staffId", userData.staffId || "");

    sessionStorage.removeItem("hasRefreshed");

    setUser(userData);
    setIsAuthenticated(true);
    navigate("/landing", { replace: true }); // ✅ clear history and go to landing
  };

  const navigateToPrimeManagement = () => {
  navigate("/project-table");
};

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear(); // ✅ reset refresh flag
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login", { replace: true }); // ✅ clear history
  };

  // ✅ wait until auth check is done
  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Login setIsAuthenticated={setIsAuthenticated} handleLogin={handleLogin} />
          ) : (
            <Navigate to="/landing" replace />
          )
        }
      />

      {isAuthenticated && <Route path="/landing" element={<LandingPage />} />}

      {isAuthenticated &&
        (user?.role === "VerticalLead" || user?.role === "ProjectOwner" || user?.role === "PeopleManager") && (
          <>
            <Route path="/project-table" element={<ProjectTable />} />
            <Route path="/project/:projectId" element={<ProjectDetails />} />
          </>
        )}

      {isAuthenticated && (
        <Route path="/dashboard" element={<ProjectTrackingDashboard />} />
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
