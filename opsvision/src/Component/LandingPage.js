import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import Picture11 from "./Picture11.png";
import { FaTasks } from "react-icons/fa";

import homeIcon from "./home.png";
import logoutIcon from "./logout.png";

import PowerBiEmbed from "../PowerBiEmbed";

const LandingPage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(() => localStorage.getItem("selectedModule") || "");
  const [selectedReport, setSelectedReport] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("name") || "John Doe";
    const role = localStorage.getItem("role") || "";
    const isOwner = localStorage.getItem("isProjectOwner") === "true";

    setUserName(name);
    setUserRole(role);
    setIsProjectOwner(isOwner);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !userRole) {
      navigate("/login");
    }
  }, [isLoading, userRole, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  const showPrimeManagement =
    userRole === "VerticalLead" ||
    userRole === "ProjectOwner" ||
    (userRole === "Manager" && isProjectOwner);

  const getAvailableReports = () => {
    if (userRole === "Manager") {
      return ["Finance"];
    }
    if (userRole === "VerticalLead") {
      return ["Sales"];
    }
    if (userRole === "Admin") {
      return ["Finance", "Sales", "Operations"];
    }
    return [];
  };

  const showReportSelection = selectedModule === "powerBI" && !selectedReport;

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="landing-page">
      <div className="sidebar">
        <div>
          <h2 className="sidebar-title">Modules</h2>
          <ul className="nav-menu">
            <li
              className={`nav-item ${selectedModule === "primeAllocation" ? "active" : ""}`}
              onClick={() => {
                setSelectedModule("primeAllocation");
                setSelectedReport("");
                localStorage.setItem("selectedModule", "primeAllocation");
              }}
            >
              <FaTasks /> <span>Prime</span>
            </li>

            {(userRole === "Admin" || userRole === "Manager" || userRole === "VerticalLead") && (
              <li
                className={`nav-item ${selectedModule === "powerBI" ? "active" : ""}`}
                onClick={() => {
                  setSelectedModule("powerBI");
                  setSelectedReport("");
                  localStorage.setItem("selectedModule", "powerBI");
                }}
              >
                <FaTasks /> <span>Power BI</span>
              </li>
            )}
          </ul>
        </div>

        {selectedModule === "powerBI" && (
          <div className="sidebar-bottom-icons">
            <div
              className="detail-home-icon-container"
              title="Go to Homepage"
              onClick={() => {
                setSelectedModule("");
                setSelectedReport("");
                localStorage.removeItem("selectedModule");
                navigate("/landing");
              }}
            >
              <img src={homeIcon} alt="Home" className="button-icon-btn" />
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="detail-logout-btn"
            >
              <img src={logoutIcon} alt="Logout" className="button-icon-btn" />
            </button>
          </div>
        )}
      </div>

      <div className="main-content">
        {selectedModule !== "powerBI" && (
          <button
            onClick={handleLogout}
            title="Logout"
            className="top-right-logout"
          >
            <img src={logoutIcon} alt="Logout" className="button-icon-btn" />
          </button>
        )}

        {selectedModule === "powerBI" ? (
          <div className="powerbi-container">
           <PowerBiEmbed />

          </div>
        ) : (
          <>
            <h1 className="welcome-title">
              <span style={{ color: "#ff7900" }}>Hello</span>, {userName} <span style={{ color: "#ff7900" }}>!</span>
            </h1>

            <p className="welcome-subtext">Select a module from the sidebar to begin.</p>

            {selectedModule === "primeAllocation" && (
              <div className="prime-options">
                <h2>Prime Options</h2>

                {userRole === "VerticalLead" && (
                  <button onClick={() => navigate("/project-table")}>FTE Allocation</button>
                )}

                {userRole === "Manager" && isProjectOwner && (
                  <>
                    <button onClick={() => navigate("/project-table")}>FTE Allocation</button>
                    <button onClick={() => navigate("/dashboard")}>MyClocking</button>
                    <button onClick={() => navigate("/manager")}>My Team Clocking</button>
                  </>
                )}

                {userRole === "ProjectOwner" && isProjectOwner && (
                  <>
                    <button onClick={() => navigate("/project-table")}>FTE Allocation</button>
                    <button onClick={() => navigate("/dashboard")}>MyClocking</button>
                    <button onClick={() => navigate("/manager")}>My Team Clocking</button>
                  </>
                )}

                {userRole === "Manager" && !isProjectOwner && (
                  <>
                    <button onClick={() => navigate("/dashboard")}>MyClocking</button>
                    <button onClick={() => navigate("/manager")}>My Team Clocking</button>
                  </>
                )}

                {userRole === "ProjectOwner" && !isProjectOwner && (
                  <>
                    <button onClick={() => navigate("/project-table")}>FTE Allocation</button>
                    <button onClick={() => navigate("/dashboard")}>MyClocking</button>
                    <button onClick={() => navigate("/manager")}>My Team Clocking</button>
                  </>
                )}

                {!showPrimeManagement && userRole === "Employee" && (
                  <button onClick={() => navigate("/manager")}>My Clocking</button>
                )}
              </div>
            )}

            <div className="images">
              <img src={Picture11} alt="Visual" style={{ maxWidth: "400px", height: "auto" }} className="landing-image" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
