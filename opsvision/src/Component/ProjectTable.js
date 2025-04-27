import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaCheck } from "react-icons/fa";
import "./ProjectTable.css";
import logo from "./images.png";

import {
  getProjects,
  updateProjectFte,
  allocateProjectFte,
} from "../Services/api";

const ProjectTable = () => {
  const [projects, setProjects] = useState([]);
  const [fteAllocations, setFteAllocations] = useState({});
  const [fteReadonly, setFteReadonly] = useState({});
  const [allocatedHours, setAllocatedHours] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);

        const fteData = {};
        const readonlyState = {};
        const hoursData = {};

        for (const project of data) {
          fteData[project.projectId] = project.allocatedFte ?? 0;
          hoursData[project.projectId] = project.allocatedHours ?? 0;
          readonlyState[project.projectId] = true;
        }

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
        primeCode: project.primeCode, // Still required for backend if needed
      };

      let response;

      if (!project.allocatedFte || project.allocatedFte === 0) {
        response = await allocateProjectFte(payload);
      } else {
        response = await updateProjectFte(payload);
      }

      const hours =
        response?.allocatedHours ?? response?.data?.allocatedHours ?? 0;

      alert(`FTE saved: ${hours} hours calculated.`);

      setAllocatedHours((prev) => ({
        ...prev,
        [projectId]: hours,
      }));

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
      alert("FTE save/update failed. Check console for details.");
    }
  };

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    return (
      project.primeCode?.toLowerCase().includes(query) ||
      project.projectName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container">
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
      </div>

      <div className="table-wrapper">
        <table className="table table-bordered table-striped">
          <thead className="thead-light">
            <tr>
              <th>Project Code</th>
              <th>Project Name</th>
              <th>Expiration Date</th>
              <th>FTE Allocated</th>
              <th>Total Hours</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
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
                    <td>{project.projectName || "--"}</td>
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
                          {isNewFte ? "Assign" : <><FaEdit /> Update</>}
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
    </div>
  );
};

export default ProjectTable;
