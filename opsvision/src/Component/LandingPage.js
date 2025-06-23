import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import Picture11 from "./Picture11.png";
import { FaUserCircle, FaTasks } from "react-icons/fa";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showProfileName, setShowProfileName] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Get selectedModule from localStorage
  const [selectedModule, setSelectedModule] = useState(() => {
    return localStorage.getItem("selectedModule") || "";
  });

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
  }, [isLoading, userRole, isProjectOwner, navigate]);

  const toggleProfile = () => {
    setShowProfileName(!showProfileName);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.removeItem("hasRefreshed");
     sessionStorage.removeItem("projectPage");
    sessionStorage.removeItem("projectSearch");
    navigate("/login");
    window.location.reload();
  };

  const showPrimeManagement =
    userRole === "VerticalLead" ||
    userRole === "ProjectOwner" ||
    (userRole === "Manager" && isProjectOwner);

  const showEmployeeManagement =
    userRole === "Employee" || userRole === "Manager" || showPrimeManagement;

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
              className={`nav-item ${
                selectedModule === "primeAllocation" ? "active" : ""
              }`}
              onClick={() => {
                setSelectedModule("primeAllocation");
                localStorage.setItem("selectedModule", "primeAllocation"); // ✅ save it
              }}
            >
              <FaTasks /> <span>Prime</span>
            </li>
          </ul>
        </div>

        <button className="logout-button" title="Logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="main-content">
        <h1 className="welcome-title">
          <span style={{ color: "#ff7900" }}>Hello</span>, {userName}{" "}
          <span style={{ color: "#ff7900" }}>!</span>
        </h1>

        <p className="welcome-subtext">
          Select a module from the sidebar to begin.
        </p>

        {selectedModule === "primeAllocation" && (
          <div className="prime-options">
            <h2>Prime Options</h2>

            {userRole === "VerticalLead" && (
              <button onClick={() => navigate("/project-table")}>
                FTE Allocation
              </button>
            )}

            {userRole === "Manager" && isProjectOwner && (
              <>
                <button onClick={() => navigate("/project-table")}>
                  FTE Allocation
                </button>
                <button onClick={() => navigate("/dashboard")}>
                  MyClocking
                </button>
                <button onClick={() => navigate("/manager")}>
                 My Team Clocking 
                </button>
              </>
            )}
            {userRole === "ProjectOwner" && isProjectOwner && (
<>
<button onClick={() => navigate("/project-table")}>

          FTE Allocation
</button>
<button onClick={() => navigate("/dashboard")}>MyClocking</button>
<button onClick={() => navigate("/manager")}>My Team Clocking</button>
</>

    )}

 

            {userRole === "Manager" && !isProjectOwner && (
              <>
                <button onClick={() => navigate("/dashboard")}>
                  MyClocking
                </button>
                <button onClick={() => navigate("/manager")}>
                  My Team Clocking
                </button>
              </>
            )}

            {userRole === "ProjectOwner" && !isProjectOwner && (
              <>
                <button onClick={() => navigate("/project-table")}>
                  FTE Allocation
                </button>
                <button onClick={() => navigate("/dashboard")}>
                  MyClocking
                </button>
                <button onClick={() => navigate("/manager")}>
                  My Team Clocking 
                </button>
              </>
            )}

            {!showPrimeManagement && userRole === "Employee" && (
              <button onClick={() => navigate("/manager")}>My Clocking</button>
            )}
          </div>
        )}

        <div className="images">
          <img
            src={Picture11}
            alt="Visual"
            style={{ maxWidth: "400px", height: "auto" }}
            className="landing-image"
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;