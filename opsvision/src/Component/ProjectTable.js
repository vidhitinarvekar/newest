import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaCheck } from "react-icons/fa";
import "./ProjectTable.css";
import logo from "./images.png";
import homeIcon from "./home.png"; // <-- Import your home icon 
import axios from "axios";
import {
  getProjects,
  updateProjectFte,
  allocateProjectFte,
  getProjectsByOwnerId
} from "../Services/api";
import Loader from "./Loader"; // adjust the path if 
import logoutIcon from './logout.png';


const ProjectTable = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [fteAllocations, setFteAllocations] = useState({});
  const [fteReadonly, setFteReadonly] = useState({});
  const [allocatedHours, setAllocatedHours] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;
  const [projectOwners, setProjectOwners] = useState({});
  const [ownerReadonly, setOwnerReadonly] = useState({});
  const [ownerOptions, setOwnerOptions] = useState({});
  const [selectedStaffIds, setSelectedStaffIds] = useState({});

  useEffect(() => {

    setCurrentPage(1);

  }, [searchQuery]);


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const role = localStorage.getItem("role")?.toLowerCase();
        const staffId = localStorage.getItem("staffId"); // make sure it's stored on login
        let data = [];

        if (role === "verticallead") {
          data = await getProjects();
        } else {
          data = await getProjectsByOwnerId(staffId); // use your imported function
        }
setProjects(Array.from(new Map(data.map(p => [p.projectId, p])).values()));
        // setProjects(data);
        setLoading(true);
        // Fetch projects and initialize state in parallel
        const [projectsData] = await Promise.all([getProjects()]);

        // Initialize state based on fetched projects
        const fteData = {};
        const readonlyState = {};
        const hoursData = {};
        const owners = {};
        const readonly = {};
        const selected = {};
        const savedPage = sessionStorage.getItem("projectPage");
        const savedSearch = sessionStorage.getItem("projectSearch");



        if (savedPage) setCurrentPage(parseInt(savedPage));
        if (savedSearch) setSearchQuery(savedSearch);

        for (const project of data) {
          fteData[project.projectId] = project.allocatedFte ?? 0;
          hoursData[project.projectId] = project.allocatedHours ?? 0;
          readonlyState[project.projectId] = true;
        }

        data.forEach((p) => {
          owners[p.projectId] = p.ownerName || "";  // ← From API
          readonly[p.projectId] = true;
          selected[p.projectId] = null;
        });

        setFteAllocations(fteData);
        setAllocatedHours(hoursData);
        setFteReadonly(readonlyState);
        setProjectOwners(owners);
        setOwnerReadonly(readonly);
        setSelectedStaffIds(selected);



      } catch (error) {
        console.error("Error fetching projects:", error);
      }
      finally {
        setLoading(false); // ✅ Hide loader after data loads
      }
    };

    fetchProjects();
  }, []);

  const handleFteChange = (projectId, value) => {
    if (value < 0) return;
    setFteAllocations((prev) => ({ ...prev, [projectId]: value }));
  };

  const handleUpdateFte = (projectId) => {
    setFteReadonly((prev) => ({ ...prev, [projectId]: false }));
  };
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    sessionStorage.removeItem("projectPage");
    sessionStorage.removeItem("projectSearch");
    navigate("/login");
    window.location.reload();
  };

  const handleSaveFte = async (projectId) => {
    const fteValue = parseFloat(fteAllocations[projectId]);
    if (!fteValue || fteValue <= 0) {
      alert("Enter a valid FTE value!");
      return;
    }

    try {
      const project = projects.find((p) => p.projectId === projectId);
      const payload = {
        projectId,
        allocatedFte: fteValue,
        primeCode: project.primeCode,
      };

      let response;
      if (!project.allocatedFte || project.allocatedFte === 0) {
        response = await allocateProjectFte(payload);
      } else {
        response = await updateProjectFte(payload);
      }

      const hours =
        response?.allocatedHours ?? response?.data?.allocatedHours ?? 0;
      setAllocatedHours((prev) => ({ ...prev, [projectId]: hours }));
      setFteReadonly((prev) => ({ ...prev, [projectId]: true }));

      setProjects((prev) =>
        prev.map((proj) =>
          proj.projectId === projectId
            ? {
              ...proj,
              allocatedFte: fteValue,
              allocatedHours: hours,
            }
            : proj
        )
      );
    } catch (error) {
      console.error("FTE save/update failed:", error);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    return (
      project.primeCode?.toLowerCase().includes(query) ||
      project.projectName?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
  const userRole = localStorage.getItem("role")?.toLowerCase();
  const fetchOwnerOptions = async (projectId) => {
    try {
      const response = await axios.get("https://localhost:7049/api/ProjectManagement/search-managers");
      setOwnerOptions((prev) => ({ ...prev, [projectId]: response.data }));
    } catch (err) {
      console.error("Error fetching managers", err);
    }
  };

  const handleOwnerEdit = async (projectId) => {
    await fetchOwnerOptions(projectId);
    setOwnerReadonly((prev) => ({ ...prev, [projectId]: false }));
  };

  const handleOwnerSelect = (projectId, staffId, fullName) => {
    setSelectedStaffIds((prev) => ({ ...prev, [projectId]: staffId }));
    setProjectOwners((prev) => ({ ...prev, [projectId]: fullName }));
  };

  const handleOwnerSave = async (projectId) => {
    const staffId = selectedStaffIds[projectId];
    if (!staffId) {
      alert("Please select a project owner.");
      return;
    }

    try {
      await axios.put("https://localhost:7049/api/ProjectManagement/update-projectowner-staff", {
        projectId,
        newStaffId: staffId,
      });

      setOwnerReadonly((prev) => ({ ...prev, [projectId]: true }));

      // optionally update projects state if needed
    } catch (error) {
      console.error("Failed to update project owner:", error);
    }
  };


  const renderPagination = () => {

    const pages = [];

    const totalNumbers = 5;

    const halfRange = Math.floor(totalNumbers / 2);

    let startPage = Math.max(1, currentPage - halfRange);

    let endPage = startPage + totalNumbers - 1;

    if (endPage > totalPages) {

      endPage = totalPages;

      startPage = Math.max(1, endPage - totalNumbers + 1);

    }

    if (startPage > 1) {

      pages.push(
        <button key={1} onClick={() => setCurrentPage(1)} className="pagination-button">

          1
        </button>

      );

      if (startPage > 2) {

        pages.push(<span key="start-ellipsis">...</span>);

      }

    }

    for (let i = startPage; i <= endPage; i++) {

      pages.push(
        <button

          key={i}

          className="pagination-button"

          disabled={i === currentPage}

          onClick={() => setCurrentPage(i)}
        >

          {i}
        </button>

      );

    }

    if (endPage < totalPages) {

      if (endPage < totalPages - 1) {

        pages.push(<span key="end-ellipsis">...</span>);

      }

      pages.push(
        <button

          key={totalPages}

          onClick={() => setCurrentPage(totalPages)}

          className="pagination-button"
        >

          {totalPages}
        </button>

      );

    }

    return (
      <div className="pagination-container">
        <button

          className="pagination-button"

          disabled={currentPage === 1}

          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          &lt;
        </button>

        {pages}
        <button

          className="pagination-button"

          disabled={currentPage === totalPages}

          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        >
          &gt;
        </button>
      </div>

    );

  };


  return loading ? (
    <Loader />
  ) : (
    <div className="container">
      <div className="custom-dashboard-header">
        {/* Left Side: Logo + Title */}
        <div className="custom-left-section">
          <img src={logo} alt="Orange Business Logo" className="custom-logo" />
          <h1 className="custom-dashboard-title">
            Prime Management
          </h1>
        </div>

        {/* Right Side: Search + Buttons */}
        <div className="custom-right-section">
          <div className="custom-search-containers">
            <input
              type="text"
              className="custom-searchs-bar"
              placeholder="Search by Prime Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div
            className="custom-home-icon-container"
            title="Go to Homepage"
            onClick={() => {
              localStorage.setItem("selectedModule", "primeAllocation");
              navigate("/landing");
            }}
          >
            <img src={homeIcon} alt="Home" className="custom-icon-btn" />
          </div>

          <button onClick={handleLogout} title="Logout" className="custom-logout-btn">
            <img src={logoutIcon} alt="Logout" className="custom-icon-btn" />
          </button>
        </div>
      </div>



      <div className="table-section">
        <div className="table-wrapper">
          <table className="table table-bordered table-striped">
            <thead className="thead-light">
              <tr>
                <th>PrimeCode</th>
                {userRole === "verticallead" && <th>Project Owner</th>}
                <th>Expiration Date</th>
                <th>FTE Allocated</th>
                <th>Total Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((project) => {
                  const currentFte = fteAllocations[project.projectId] ?? 0;
                  const isNewFte =
                    project.allocatedFte === 0 || project.allocatedFte == null;

                  return (
                    <tr key={project.projectId}>
                      <td>
                        <Link
                          to={`/project/${project.projectId}`}
                          state={{
                            totalAllocatedHours:
                              allocatedHours[project.projectId] || 0,
                            fromPage: currentPage,
                            searchQuery: searchQuery
                          }}
                          className="project-link"
                          onClick={() => {
                            sessionStorage.setItem("projectPage", currentPage);
                            sessionStorage.setItem("projectSearch", searchQuery);
                          }}
                        >
                          {project.primeCode}
                        </Link>
                      </td>
                      {userRole === "verticallead" && (
                        <td>
                          {ownerReadonly[project.projectId] ? (
                            <>
                              {projectOwners[project.projectId] || "--"}
                              <button className="edit-btns" onClick={() => handleOwnerEdit(project.projectId)}>
                                <FaEdit />
                              </button>
                            </>
                          ) : (
                            <div className="owner-select-wrapper">
                              <select
                                value={selectedStaffIds[project.projectId] || ""}
                                onChange={(e) => {
                                  const staffId = parseInt(e.target.value);
                                  const selected = ownerOptions[project.projectId]?.find(
                                    (opt) => opt.staffId === staffId
                                  );
                                  if (selected) {
                                    handleOwnerSelect(project.projectId, selected.staffId, selected.fullName);
                                  }
                                }}
                              >
                                <option value="">Select Owner</option>
                                {(ownerOptions[project.projectId] || []).map((owner) => (
                                  <option key={owner.staffId} value={owner.staffId}>
                                    {owner.fullName}
                                  </option>
                                ))}
                              </select>
                              <button className="ok-btn" onClick={() => handleOwnerSave(project.projectId)}>
                                <FaCheck />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                      <td>
                        {project.expiryDate
                          ? new Date(project.expiryDate).toLocaleDateString()
                          : "--"}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={currentFte}
                          onChange={(e) =>
                            handleFteChange(project.projectId, e.target.value)
                          }
                          placeholder="Enter FTE"
                          readOnly={fteReadonly[project.projectId]}
                        />
                      </td>
                      <td>{allocatedHours[project.projectId] || "--"}</td>
                      <td>
                        {fteReadonly[project.projectId] ? (
                          <button
                            className="edit-btn"
                            onClick={() => handleUpdateFte(project.projectId)}
                          >
                            {isNewFte ? "Assign" : (
                              <>
                                <FaEdit /> Update
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            className="ok-btn"
                            onClick={() => handleSaveFte(project.projectId)}
                          >
                            <FaCheck /> OK
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">No projects available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>
    </div>
  );
};

export default ProjectTable;