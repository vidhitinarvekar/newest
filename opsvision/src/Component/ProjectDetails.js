import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { deleteProjectFte } from "../Services/api";
import "./ProjectDetails.css";
import logo from "./images.png";
import homeIcon from "./home.png";
import back from "./backs.png";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const searchResultsRef = useRef(null);
  const searchInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allocatedFTEs, setAllocatedFTEs] = useState([]);
  const [selectedFte, setSelectedFte] = useState(null);
  const [fteHours, setFteHours] = useState({});
  const [newFTEs, setNewFTEs] = useState([]);
  // const [totalHours, setTotalHours] = useState(0);
  const [totalHours, setTotalHours] = useState(0); // For total hours
  const [remainingHours, setRemainingHours] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [primeCode, setPrimeCode] = useState("");
  const [delegateFor, setDelegateFor] = useState(null);
  const [delegates, setDelegates] = useState({});
  const [delegatedHours, setDelegatedHours] = useState({});
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [committedHours, setCommittedHours] = useState({});

  const fetchAssignedFTEs = async () => {
    if (!projectId) return;

    try {
      // Fetching project-specific data (assigned FTEs)
      const response = await axios.get(`https://opsvisionbe.integrator-orange.com/api/ProjectFteEmployee/${projectId}`);
      const { assignedEmployees, remainingHours, projectName, primeCode } = response.data;

      setAllocatedFTEs(assignedEmployees || []);
      setRemainingHours(remainingHours || 0);
      setProjectName(projectName || "Unknown Project");
      setPrimeCode(primeCode || "N/A");

      const allocatedSum = (assignedEmployees || []).reduce(
        (sum, fte) => sum + (Number(fte.allocatedHours) || 0),
        0
      );
      setTotalHours((remainingHours || 0) + allocatedSum);

      const initialHours = {};
      (assignedEmployees || []).forEach((fte) => {
        initialHours[fte.staffId] = fte.allocatedHours;
      });
      setFteHours(initialHours);
      setDelegates({});

      await fetchAllCommittedHours(assignedEmployees);

      // Now, let's fetch the total allocated hours for the specific project
      const allProjectsResponse = await axios.get("https://opsvisionbe.integrator-orange.com/api/ProjectFte/all");
      const projectData = allProjectsResponse.data.find(
        (project) => project.projectId === parseInt(projectId)
      );
      if (projectData) {
        setTotalHours(projectData.allocatedHours || 0); // Update total hours from the fetched data
      }

    } catch (error) {
      console.error("Error fetching project data:", error);
    }
  };

  const fetchCommittedHours = async (staffId, projectId) => {
    try {
      const response = await axios.get(`https://opsvisionbe.integrator-orange.com/api/ProjectFteManagement/project/${projectId}/committed-hours`, {
        params: { projectId, managerStaffId: staffId }
      });
      return response.data.managerTeamTotal || 0;
    } catch (error) {
      console.error("Error fetching committed hours:", error);
      return 0;
    }
  };

  const fetchAllCommittedHours = async (assignedEmployees) => {
    const hours = {};
    for (const fte of assignedEmployees) {
      const committedHour = await fetchCommittedHours(fte.staffId, projectId);

      hours[fte.staffId] = committedHour;
    }
    setCommittedHours(hours);
  };

  useEffect(() => {
    if (projectId) fetchAssignedFTEs();
  }, [projectId]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!searchQuery) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      try {
        const response = await axios.get(`https://opsvisionbe.integrator-orange.com/api/ProjectFteEmployee/searchs`, {
          params: { searchTerm: searchQuery },
        });
        setSearchResults(response.data);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Error fetching employee search results:", error);
      }
    };

    fetchEmployees();
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFTE = (fte) => {
    if (delegateFor) {
      setDelegates((prev) => ({
        ...prev,
        [delegateFor.staffId]: [...(prev[delegateFor.staffId] || []), fte],
      }));
      setDelegateFor(null);
    } else {
      const alreadyAssigned = allocatedFTEs.some((existingFte) => existingFte.staffId === fte.staffId);
      if (alreadyAssigned) {
        alert("This employee is already assigned.");
        return;
      }

      const newFteEntry = {
        staffId: fte.staffId,
        firstName: fte.firstName,
        lastName: fte.lastName,
        email: fte.email,
        allocatedHours: 0,
      };

      setNewFTEs((prev) => [newFteEntry, ...prev]);
      setAllocatedFTEs((prev) => [newFteEntry, ...prev]);
      setFteHours((prev) => ({ ...prev, [newFteEntry.staffId]: "" }));
    }

    setSelectedFte(null);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const calculateCurrentRemainingHours = (excludeStaffId = null) => {
    const totalMainAllocated = allocatedFTEs.reduce((sum, fte) => {
      if (fte.staffId === excludeStaffId) return sum; // exclude current staff
      const inputHours = Number(fteHours[fte.staffId]);
      return sum + (isNaN(inputHours) ? 0 : inputHours);
    }, 0);

    return Math.max(0, totalHours - totalMainAllocated);
  };


  const isManager = localStorage.getItem("role") === "manager";

  const handleSaveFTE = async (staffId) => {
    try {
      console.log("🔹 Save FTE initiated for Staff ID:", staffId);

      const allocatedHours = Number(fteHours[staffId]);
      console.log("📊 Allocated Hours:", allocatedHours);

      const delegateeList = (delegates[staffId] || [])
        .filter((delegate) => Number(delegatedHours[staffId]?.[delegate.staffId]) > 0)
        .map((delegate) => ({
          staffId: delegate.staffId,
          staffName: `${delegate.firstName} ${delegate.lastName}`,
          allocatedHours: Number(delegatedHours[staffId]?.[delegate.staffId]),
        }));
      console.log("👥 Delegatees:", delegateeList);

      if (!isManager && (!allocatedHours || allocatedHours <= 0)) {
        alert("Allocated hours must be greater than 0.");
        console.warn("❌ Invalid allocated hours for non-manager.");
        return;
      }

      const remaining = calculateCurrentRemainingHours(staffId);

      console.log("🧮 Remaining Hours:", remaining);

      if (!isManager && allocatedHours > remaining) {
        alert("Not enough remaining hours.");
        console.warn("❌ Allocated hours exceed remaining.");
        return;
      }

      const payload = {
        projectId: Number(projectId),
        primeCode,
        staffId: isManager ? 0 : staffId,
        allocatedHours: isManager ? 0 : allocatedHours,
        delegatees: delegateeList,
      };

      console.log("📤 Sending payload to API:", payload);

      const response = await axios.post("https://opsvisionbe.integrator-orange.com/api/ProjectFteEmployee/allocate", payload);
      console.log("✅ Save response:", response);

      // Clean up after successful save
      setNewFTEs((prev) => prev.filter((fte) => fte.staffId !== staffId));
      fetchAssignedFTEs();


    } catch (error) {
      console.error("❌ Error saving FTE:", error);
      alert("Failed to save FTE. Please check your input and try again.");
    }


  };


  const handleUpdateFTE = async (staffId) => {
    try {
      const allocatedHours = Number(fteHours[staffId]);

      const delegateeList = (delegates[staffId] || [])
        .filter((delegate) => Number(delegatedHours[staffId]?.[delegate.staffId]) > 0)
        .map((delegate) => ({
          staffId: delegate.staffId,
          staffName: `${delegate.firstName} ${delegate.lastName}`,
          allocatedHours: Number(delegatedHours[staffId]?.[delegate.staffId]),
        }));

      if (!isManager && (!allocatedHours || allocatedHours <= 0))
        return alert("Allocated hours must be greater than 0.");

      if (!isManager && allocatedHours > calculateCurrentRemainingHours(staffId)) {
        return alert("Not enough remaining hours.");
      }


      const payload = {
        projectId: Number(projectId),
        primeCode,
        staffId: isManager ? 0 : staffId,
        allocatedHours: isManager ? 0 : allocatedHours,
        delegatees: delegateeList,
      };

      await axios.put("https://opsvisionbe.integrator-orange.com/api/ProjectFteEmployee/update", payload);
      fetchAssignedFTEs();
    } catch (error) {
      console.error("Error updating FTE:", error);
      alert("Failed to update FTE.");
    }
  };

  const handleDeleteFTE = async (staffId) => {
    try {
      await deleteProjectFte(projectId, staffId);
      // alert("FTE deleted.");
      setAllocatedFTEs((prev) => prev.filter((fte) => fte.staffId !== staffId));
      fetchAssignedFTEs();
    } catch (error) {
      console.error("Error deleting FTE:", error);
    }
  };

  const handleDelegateClick = (fte) => {
    setDelegateFor(fte);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleDelegateHoursChange = (mainFteId, delegateFteId, hours) => {
    setDelegatedHours((prev) => ({ ...prev, [mainFteId]: { ...prev[mainFteId], [delegateFteId]: hours } }));
    const remainingHours = Number(fteHours[mainFteId]) - hours;
    setFteHours((prev) => ({
      ...prev,
      [mainFteId]: remainingHours > 0 ? remainingHours : 0,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/login");
    window.location.reload();
  };

  const totalCommittedHours = Object.values(committedHours).reduce((sum, hours) => sum + hours, 0);

  return (

    <div className="containers">


      <div className="logo-containers">
        <img src={logo} alt="Orange Business Logo" className="logo" />
        <h1 className="naames">Allocate Hours</h1>
        
        <div className="backa" title="back" style={{ marginRight: '8px' }} onClick={() => navigate("/project-table")}>
          {/* <img src={back} alt="Previous Page" className="back-icons" /> */}

          <h3 className="previous">Previous Page</h3>
        </div>
        {/* <img src={logo} alt="Orange Business Logo" className="logo" /> */}
      </div>

      <button onClick={handleLogout} title="Logout" className="logout-button">
        Logout
      </button>

      <div className="home-icon-containersss" title="Go to Homepage" onClick={() => navigate("/landing")}>
        {/* <img src={homeIcon} alt="Home" className="home-iconsss" /> */}
        <h4 className="house">Home </h4>
      </div>

      <div className="form-containers">
        <div className="header-section">
          <div className="project-info">
            <h2 className="project-code">PrimeCode: {primeCode}</h2>
            <div className="hours-info">
              <h3 className="total">Total Hours: {totalHours}</h3>
              <h3 className="rem">Remaining Hours: {calculateCurrentRemainingHours()}</h3>
              <h3 className="comm">Total committed: {totalCommittedHours}</h3>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <input
            ref={searchInputRef}

            type="text"
            className="search"
            placeholder={delegateFor ? `Delegate to employee for ${delegateFor?.firstName || ''}...` : "Search employee..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
          />

          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results" ref={searchResultsRef}>
              <ul>
                {searchResults.map((employee) => (
                  <li key={employee.staffId}>
                    <span>{employee.firstName} {employee.lastName} ({employee.email})</span>
                    <button onClick={() => handleSelectFTE(employee)}>Select</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* FTE Table */}
        <h3 className="table-heading">Allocated FTEs</h3>
        <div className="table-scroll-wrapper">
          <table className="borders">
            <thead>
              <tr>
                <th>FTE Name</th>
                {/* <th>Staff ID</th> */}
                <th>Allocated Hours</th>
                <th>Committed Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocatedFTEs.map((fte) => (
                <React.Fragment key={fte.staffId}>
                  <tr>
                    <td>{fte.firstName} {fte.lastName}</td>
                    {/* <td>{fte.staffId}</td> */}
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={fteHours[fte.staffId] ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFteHours((prev) => ({ ...prev, [fte.staffId]: value }));
                        }}
                      />
                    </td>
                    <td>{committedHours[fte.staffId] || 0}</td>
                    <td className="table-actions">
                      {newFTEs.some((n) => n.staffId === fte.staffId) ? (
                        <button onClick={() => handleSaveFTE(fte.staffId)}>Save</button>
                      ) : (
                        <>
                          <button onClick={() => handleUpdateFTE(fte.staffId)} style={{ marginRight: '8px' }}>Update</button>
                          <button onClick={() => handleDeleteFTE(fte.staffId)}>Delete</button>
                        </>
                      )} 
                    </td>
                  </tr>
                  {/* Render delegates directly below the assigner */}
                  {delegates[fte.staffId] && delegates[fte.staffId].map((delegate) => (
                    <tr key={delegate.staffId}>
                      <td colSpan={4} className="delegate-row">
                        {`${fte.firstName} ${fte.lastName} - ${delegate.staffName}`}
                        <input
                          type="number"
                          min="0"
                          placeholder="Delegate hours"
                          value={delegatedHours[fte.staffId]?.[delegate.staffId] || ""}
                          onChange={(e) => handleDelegateHoursChange(fte.staffId, delegate.staffId, e.target.value)}
                        />
                        {delegatedHours[fte.staffId]?.[delegate.staffId] && (
                          <span className="delegated-hours">
                            (Delegated: {delegatedHours[fte.staffId][delegate.staffId]} hours)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}