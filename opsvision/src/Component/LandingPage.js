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
  const [selectedReport, setSelectedReport] = useState(() => localStorage.getItem("selectedReport") || "");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedPowerBiTab, setSelectedPowerBiTab] = useState("");
  const [showReports, setShowReports] = useState(false);
  const [isMISManager, setIsMISManager] = useState(false);
  const [isManager, setIsManager] = useState(false);
 
  useEffect(() => {
    const name = localStorage.getItem("name") || "John Doe";
    const role = localStorage.getItem("role") || "";
    const isOwner = localStorage.getItem("isProjectOwner") === "true";
    const isManagerFlag = localStorage.getItem("isManager") === "true";
    const isMISManager = localStorage.getItem("isMISManager") === "true";
 
    setUserName(name);
    setUserRole(role);
    setIsProjectOwner(isOwner);
    setIsMISManager(isMISManager);
    setIsManager(isManagerFlag);
    setIsLoading(false);
  }, []);
 
  useEffect(() => {
    if (!isLoading && !userRole) {
      navigate("/login");
    }
  }, [isLoading, userRole, navigate]);
 
  // Safety: if a stale "Cockpit" selection exists, clear it
  useEffect(() => {
    if (selectedReport === "Cockpit") {
      setSelectedReport("");
      localStorage.removeItem("selectedReport");
    }
  }, [selectedReport]);
 
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };
 
  const showPrimeManagement =
    userRole === "VerticalLead" ||
    userRole === "ProjectOwner" ||
    (userRole === "Manager" && isProjectOwner);
 
  // const getAvailableReports = () => {
  //   if (userRole === "Manager" || userRole === "Admin") return ["Galderma"];
  //   if (userRole === "VerticalLead") return ["Galderma", "MIS"]; // Cockpit removed
  //   return [];
  // };
 
  const getAvailableReports = () => {
  // if (userRole === "Manager" || userRole === "Admin") return ["Galderma"];
  // if (userRole === "VerticalLead" || isMISManager) return ["Galderma", "MIS"];
  // if (isManager) return ["Galderma", "MIS"];
  // if (isMISManager) return ["Galderma", "MIS"];
  // Manager override: sees both irrespective of role
  if (isManager) return ["Galderma", "MIS"];
 
  // MIS Manager flag also sees both
  if (isMISManager) return ["Galderma", "MIS"];
 
  // Role-based fallbacks
  if (userRole === "Manager" || userRole === "Admin") return ["Galderma"];
  if (userRole === "VerticalLead") return ["Galderma", "MIS"];
  return [];
};
 
  // Updated function to handle report selection with auto-collapse
  const handleReportSelect = (reportName) => {
    setSelectedReport(reportName);
    setIsSidebarCollapsed(true); // Automatically collapse sidebar when report is selected
  };
 
  // Handle tab click to show reports
  const handleTabClick = (tabName) => {
    setSelectedPowerBiTab(tabName);
    setShowReports(true);
  };
 
  // Reset when switching modules
  useEffect(() => {
    if (selectedModule !== "powerBI") {
      setShowReports(false);
      setSelectedPowerBiTab("");
    }
  }, [selectedModule]);
 
  useEffect(() => {
    if (selectedModule) localStorage.setItem("selectedModule", selectedModule);
    else localStorage.removeItem("selectedModule");
  }, [selectedModule]);
 
  useEffect(() => {
    if (selectedReport) localStorage.setItem("selectedReport", selectedReport);
    else localStorage.removeItem("selectedReport");
  }, [selectedReport]);
 
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
 
  return (
    <div className="landing-page">
      <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          {!isSidebarCollapsed && <h2 className="sidebar-title">Modules</h2>}
          <button
            className="collapse-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? "➤" : "◀"}
          </button>
        </div>
 
        <ul className="nav-menu">
          {/* <li
            className={`nav-item ${selectedModule === "primeAllocation" ? "active" : ""}`}
            onClick={() => {
              setSelectedModule("primeAllocation");
              setSelectedReport("");
              setShowReports(false);
              setSelectedPowerBiTab("");
            }}
            title="Prime"
          >
            <FaTasks />
            {!isSidebarCollapsed && <span>Prime</span>}
          </li> */}
          {(userRole === "Admin" || userRole === "Manager" || userRole === "VerticalLead" || userRole === "Employee"  ) && (
<li
 
    className={`nav-item ${selectedModule === "primeAllocation" ? "active" : ""}`}
 
    onClick={() => {
 
      setSelectedModule("primeAllocation");
 
      setSelectedReport("");
 
      setShowReports(false);
 
      setSelectedPowerBiTab("");
 
    }}
 
    title="Prime"
>
<FaTasks />
 
    {!isSidebarCollapsed && <span>Prime</span>}
</li>
 
)}
 
 
 
          {(userRole === "Admin" || userRole === "Manager" || userRole === "VerticalLead" || isMISManager || isManager) && (
            <li
              className={`nav-item ${selectedModule === "powerBI" ? "active" : ""}`}
              onClick={() => {
                setSelectedModule("powerBI");
                setSelectedReport("");
                setShowReports(false);
                setSelectedPowerBiTab("");
              }}
              title="Reports"
            >
              <FaTasks />
              {!isSidebarCollapsed && <span>Reports</span>}
            </li>
          )}
        </ul>
 
        <div className="sidebar-bottom-icons">
          <div
            className="detail-home-icon-container-land"
            title="Go to Homepage"
            data-tooltip="Home"
            onClick={() => {
              setSelectedModule("");
              setSelectedReport("");
              setShowReports(false);
              setSelectedPowerBiTab("");
              localStorage.removeItem("selectedModule");
              localStorage.removeItem("selectedReport");
              navigate("/landing");
            }}
          >
            <img src={homeIcon} alt="Home" className="button-icon-btn" />
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="detail-logout-btn"
            data-tooltip="Logout"
          >
            <img src={logoutIcon} alt="Logout" className="button-icon-btn" />
          </button>
        </div>
      </div>
 
      <div className="main-content">
        {selectedModule === "powerBI" ? (
          selectedReport ? (
            <div className="powerbi-container">
              <PowerBiEmbed reportName={selectedReport} />
            </div>
          ) : (
            <div className="powerbi-selection">
              <h2 className="section-title">Select Report</h2>
 
             
 
             <div className="powerbi-tabs">
                {/* Always show SERVICE MANAGEMENT tab */}
                <button
                  className={`tab-button ${selectedPowerBiTab === "SERVICE MANAGEMENT" ? "active" : ""}`}
                  onClick={() => handleTabClick("SERVICE MANAGEMENT")}
                >
                  SERVICE MANAGEMENT
                </button>
 
                {/* Show MIS tab for VerticalLead and mismanger*/}
                {(userRole === "VerticalLead" || isMISManager || isManager) && (
                  <button
                    className={`tab-button ${selectedPowerBiTab === "MIS" ? "active" : ""}`}
                    onClick={() => handleTabClick("MIS")}
                  >
                    MIS
                  </button>
                )}
              </div>
 
              {/* Only show reports after clicking a tab */}
              {showReports && (
                <div className="report-card-container">
                  {selectedPowerBiTab === "SERVICE MANAGEMENT" &&
                    getAvailableReports().includes("Galderma") && (
                      <div className="report-card" onClick={() => handleReportSelect("Galderma")}>
                        <FaTasks className="report-icon" />
                        <h3>Galderma</h3>
                        <p>Access Galderma dashboard and analytics</p>
                      </div>
                    )}
 
                  {selectedPowerBiTab === "MIS" &&
                    getAvailableReports().includes("MIS") && (
                      <div className="report-card" onClick={() => handleReportSelect("MIS")}>
                        <FaTasks className="report-icon" />
                        <h3>Employee Data</h3>
                        <p>Access Employee dashboard and analytics</p>
                      </div>
                    )}
 
                  {/* Add more reports as needed */}
                  {selectedPowerBiTab === "SERVICE MANAGEMENT" && <></>}
                </div>
              )}
 
              {/* Show instruction when no tab is selected */}
              {!showReports && (
                <div className="no-reports">
                  <h3>Select a Category</h3>
                  {/* <p>Choose SERVICE MANAGEMENT or MIS to view available reports</p> */}
                </div>
              )}
            </div>
          )
        ) : (
          <>
            <h1 className="welcome-title">
              <span style={{ color: "#ff7900" }}>Hello</span>, {userName}{" "}
              <span style={{ color: "#ff7900" }}>!</span>
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
              <img src={Picture11} alt="Visual" className="landing-image" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
 
export default LandingPage;
 
 