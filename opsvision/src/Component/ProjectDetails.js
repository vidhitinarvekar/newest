import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { deleteProjectFte } from "../Services/api";
import "./ProjectDetails.css";
import logo from "./images.png";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allocatedFTEs, setAllocatedFTEs] = useState([]);
  const [selectedFte, setSelectedFte] = useState(null);
  const [fteHours, setFteHours] = useState({});
  const [newFTEs, setNewFTEs] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [remainingHours, setRemainingHours] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [primeCode, setPrimeCode] = useState("");
  const [delegateFor, setDelegateFor] = useState(null);
  const [delegates, setDelegates] = useState({});
  const [delegatedHours, setDelegatedHours] = useState({});
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fetchAssignedFTEs = async () => {
    if (!projectId) return;

    try {
      const response = await axios.get(`https://localhost:443/api/ProjectFteEmployee/${projectId}`);
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
    } catch (error) {
      console.error("❌ Error fetching project data:", error);
    }
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
        const response = await axios.get(`https://localhost:443/api/ProjectFteEmployee/search`, {
          params: { searchTerm: searchQuery },
        });
        setSearchResults(response.data);
        setShowSearchResults(true);
      } catch (error) {
        console.error("❌ Error fetching employee search results:", error);
      }
    };

    fetchEmployees();
  }, [searchQuery]);

  const handleSelectFTE = (fte) => {
    if (delegateFor) {
      setDelegates((prev) => ({
        ...prev,
        [delegateFor.staffId]: [...(prev[delegateFor.staffId] || []), fte],
      }));
      setDelegateFor(null);
      setSelectedFte(null);
    } else {
      setSelectedFte(fte);
    }
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const calculateCurrentRemainingHours = () => {
    const totalMainAllocated = allocatedFTEs.reduce((sum, fte) => {
      const inputHours = Number(fteHours[fte.staffId]);
      return sum + (isNaN(inputHours) ? 0 : inputHours);
    }, 0);
    return Math.max(0, totalHours - totalMainAllocated);
  };

  const handleAddFTE = () => {
    if (!selectedFte) return alert("⚠️ Please select an employee first.");

    const alreadyAssigned = allocatedFTEs.some((fte) => fte.staffId === selectedFte.staffId);
    if (alreadyAssigned) return alert("⚠️ This employee is already assigned.");

    const newFteEntry = {
      staffId: selectedFte.staffId,
      firstName: selectedFte.firstName,
      lastName: selectedFte.lastName,
      email: selectedFte.email,
      allocatedHours: 0,
    };

    setNewFTEs((prev) => [...prev, newFteEntry]);
    setAllocatedFTEs((prev) => [...prev, newFteEntry]);
    setFteHours((prev) => ({ ...prev, [newFteEntry.staffId]: "" }));
    setSelectedFte(null);
  };

  const handleSaveFTE = async (staffId) => {
    try {
      const allocatedHours = Number(fteHours[staffId]);
      if (!allocatedHours || allocatedHours <= 0) return alert("⚠️ Allocated hours must be greater than 0.");
      if (allocatedHours > calculateCurrentRemainingHours()) return alert("⚠️ Not enough remaining hours.");

      const payload = { projectId, staffId, allocatedHours };
      await axios.post(`https://localhost:443/api/ProjectFteEmployee/allocate`, payload);
      alert("✅ New FTE added.");
      setNewFTEs((prev) => prev.filter((fte) => fte.staffId !== staffId));
      fetchAssignedFTEs();
    } catch (error) {
      console.error("❌ Error saving FTE:", error);
    }
  };

  const handleUpdateFTE = async (staffId) => {
    try {
      const allocatedHours = Number(fteHours[staffId]);
      if (!allocatedHours || allocatedHours <= 0) return alert("⚠️ Allocated hours must be greater than 0.");
      if (allocatedHours > calculateCurrentRemainingHours()) return alert("⚠️ Not enough remaining hours.");

      const payload = { projectId, staffId, allocatedHours };
      await axios.put(`https://localhost:443/api/ProjectFteEmployee/update`, payload);
      alert("✅ FTE updated.");
      fetchAssignedFTEs();
    } catch (error) {
      console.error("❌ Error updating FTE:", error);
    }
  };

  const handleDeleteFTE = async (staffId) => {
    try {
      await deleteProjectFte(projectId, staffId);
      alert("✅ FTE deleted.");
      setAllocatedFTEs((prev) => prev.filter((fte) => fte.staffId !== staffId));
      fetchAssignedFTEs();
    } catch (error) {
      console.error("❌ Error deleting FTE:", error);
    }
  };

  const handleDelegateClick = (fte) => {
    setDelegateFor(fte);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleDelegateHoursChange = (mainFteId, delegateFteId, hours) => {
    setDelegatedHours((prev) => ({
      ...prev,
      [mainFteId]: { ...prev[mainFteId], [delegateFteId]: hours },
    }));

    const remainingHours = Number(fteHours[mainFteId]) - hours;
    setFteHours((prev) => ({
      ...prev,
      [mainFteId]: remainingHours > 0 ? remainingHours : 0,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/login");
  };

  return (
    <div className="containers">
      <div className="logo-container">
        <img src={logo} alt="Orange Business Logo" className="logo" />
      </div>

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>

      <div className="form-containers">
        {/* Header Section */}
        <div className="header-section">
          <div className="project-info">
            <h2 className="project-code">Prime Code: {primeCode}</h2>
            <div className="hours-info">
              <h3 className="total">Total Hours: {totalHours}</h3>
              <h3 className="rem">Remaining Hours: {calculateCurrentRemainingHours()}</h3>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <input
            type="text"
            className="search"
            placeholder={delegateFor ? `Delegate to employee for ${delegateFor?.firstName || ''}...` : "Search employee..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
          />
         
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results">
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

          {selectedFte && !delegateFor && (
            <div className="selected-employee">
              <p>Selected: {selectedFte.firstName} {selectedFte.lastName}</p>
              <button
                className="action-button"
                onClick={handleAddFTE}
                disabled={calculateCurrentRemainingHours() <= 0}
              >
                Add FTE
              </button>
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
                <th>Staff ID</th>
                <th>Allocated Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocatedFTEs.map((fte) => (
                <React.Fragment key={fte.staffId}>
                  <tr>
                    <td>{fte.firstName} {fte.lastName}</td>
                    <td>{fte.staffId}</td>
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
                    <td className="table-actions">
                      {newFTEs.some((n) => n.staffId === fte.staffId) ? (
                        <button onClick={() => handleSaveFTE(fte.staffId)}>Save</button>
                      ) : (
                        <>
                          <button onClick={() => handleUpdateFTE(fte.staffId)}>Update</button>
                          <button onClick={() => handleDeleteFTE(fte.staffId)}>Delete</button>
                          <button onClick={() => handleDelegateClick(fte)}>Delegate</button>
                        </>
                      )}
                    </td>
                  </tr>
                  {delegates[fte.staffId] && delegates[fte.staffId].map((delegate) => (
                    <tr key={`${fte.staffId}-${delegate.staffId}`}>
                      <td colSpan={4} className="delegate-row">
                        ↳ {delegate.firstName} {delegate.lastName}
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
