import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaCheck } from "react-icons/fa";
import "./ProjectTable.css";
import logo from "./images.png";
import homeIcon from "./home.png"; // <-- Import your home icon here
import {
  getProjects,
  updateProjectFte,
  allocateProjectFte,
} from "../Services/api";

const ProjectTable = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [fteAllocations, setFteAllocations] = useState({});
  const [fteReadonly, setFteReadonly] = useState({});
  const [allocatedHours, setAllocatedHours] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
useEffect(() => {
  const fetchProjects = async () => {
    try {
      // Fetch projects and initialize state in parallel
      const [projectsData] = await Promise.all([getProjects()]);

      // Initialize state based on fetched projects
      const fteData = {};
      const readonlyState = {};
      const hoursData = {};

      projectsData.forEach((project) => {
        fteData[project.projectId] = project.allocatedFte ?? 0;
        hoursData[project.projectId] = project.allocatedHours ?? 0;
        readonlyState[project.projectId] = true;
      });

      // Update state
      setProjects(projectsData);
      setFteAllocations(fteData);
      setAllocatedHours(hoursData);
      setFteReadonly(readonlyState);
    } catch (error) {
      console.error("Error fetching projects:", error);
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

  const renderPagination = () => {
    const pages = [];
    const visibleRange = 1;
    const totalNumbers = visibleRange * 2 + 1;

    if (totalPages <= totalNumbers + 2) {
      for (let i = 1; i <= totalPages; i++) {
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
    } else {
      pages.push(
        <button
          key={1}
          className="pagination-button"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(1)}
        >
          1
        </button>
      );

      if (currentPage > visibleRange + 2) {
        pages.push(<span key="start-ellipsis">...</span>);
      }

      const start = Math.max(2, currentPage - visibleRange);
      const end = Math.min(totalPages - 1, currentPage + visibleRange);

      for (let i = start; i <= end; i++) {
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

      if (currentPage < totalPages - visibleRange - 1) {
        pages.push(<span key="end-ellipsis">...</span>);
      }

      pages.push(
        <button
          key={totalPages}
          className="pagination-button"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(totalPages)}
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

  return (
    <div className="container">
      
      {/* <div className="homes-icon-containers" onClick={() => navigate("/landing")}>
      <h className="hhm">Home</h>
  
</div>

      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      <h1 className="text-center">Project Management System</h1>

      <div className="search-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search by Prime Code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div> */}

<div className="custom-header">
  {/* Logo */}
  <div className="custom-logo-container">
    <img src={logo} alt="Logo" className="custom-logo" />
  </div>

  {/* Title */}
  <h1 className="custom-title">Project Management System</h1>

  {/* Search */}
  <div className="custom-search-container">
    <input
      type="text"
      className="custom-search-bar"
      placeholder="Search by Prime Code..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>

   {/* Home Button */}
   <div className="custom-home-btn" onClick={() => navigate("/landing")}>
    <h className="custom-home-text">Home</h>
  </div>
  </div>
  <div className="table-section">
      <div className="table-wrapper">
        <table className="table table-bordered table-striped">
          <thead className="thead-light">
            <tr>
              <th>PrimeCode</th>
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
                        }}
                        className="project-link"
                      >
                        {project.primeCode}
                      </Link>
                    </td>
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