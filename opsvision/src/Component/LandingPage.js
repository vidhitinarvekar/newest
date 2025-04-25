import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LandingPage.css";
import Picture11 from './Picture11.png';
import { FaUserCircle } from "react-icons/fa";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showProfileName, setShowProfileName] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("name") || "John Doe";
    const role = localStorage.getItem("role") || "";
    setUserName(name);
    setUserRole(role);
  }, []);

  const toggleProfile = () => {
    setShowProfileName(!showProfileName);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.removeItem("hasRefreshed");
    navigate("/login");
  };

  const showPrimeManagement = userRole === "VerticalLead" || userRole === "ProjectManager" || userRole === "Admin";
  const showEmployeeManagement = userRole === "Employee" || showPrimeManagement;

  return (
    <div className="landing-page">
      {/* Top-right profile */}
      <div className="top-right-profile">
        <div className="profile-section" onClick={toggleProfile}>
          <FaUserCircle size={30} className="profile-icon" />
          {showProfileName && <span className="profile-name">{userName}</span>}
        </div>
      </div>

      <div className="sidebar">
        <h2>Modules</h2>
        <ul>
          {showPrimeManagement && (
            <div className="mod">
              <li>
                <Link to="/project-table">Prime Management</Link>
              </li>
              <li>
                <Link to="/dashboard"> My Dasboard</Link>
              </li>
            </div>
          )}

          {showEmployeeManagement && !showPrimeManagement && (
            <div className="mod">
              <li>
                <Link to="/dashboard">Employee Management</Link>
              </li>
            </div>
          )}
        </ul>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="main-content">
        <h1>Welcome to the Landing Page</h1>
        <p>Select a module from the sidebar to begin.</p>
        <div className="images">
          <img src={Picture11} alt="Description" className="state" />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
