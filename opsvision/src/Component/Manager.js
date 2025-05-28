import React, { Component } from 'react';
import './Manager.css';
import logo from './images.png';
import axios from "axios";
import illustration from './illus.png';
import secureAxios from './utils/secureAxios';
import withNavigation from './withNavigation'; // Import the withNavigation HOC
import homeIcon from "./home.png";


class Manager extends Component {
    constructor(props) {
        super(props);
        this.state = {
            projects: [],
            userProfile: {
                name: 'John Doe',
                email: localStorage.getItem('email') || ''
            },
            editingIndex: null
        };

        this.role = localStorage.getItem("role"); // Store role once
    }

    async componentDidMount() {
        await this.fetchProjects();
    }

    fetchProjects = async () => {
        try {
            const response = await secureAxios.get("/api/ProjectFteManagement/my-assigned-projects/exclude-self");
            const projectsData = response.data;
    
            const staffId = localStorage.getItem('staffId');
            if (!staffId) {
                alert("Staff ID not found. Please log in again.");
                return;
            }
    
            const projectsWithHours = await Promise.all(
                projectsData.map(async proj => {
                  let lastCommittedHours = 0;
                  let totalCommittedHours = 0;
              
                  try {
                    const committedRes = await secureAxios.get("/api/ProjectManagement/get-committed-hours", {
                      params: {
                        projectId: proj.projectId,
                        staffId: staffId
                      }
                    });
                    lastCommittedHours = committedRes.data?.committedHours || 0;
                  } catch (err) {
                    console.warn(`Failed to fetch last committed hours for project ${proj.projectId}:`, err);
                  }
              
                  try {
                    const totalCommittedRes = await axios.get(`https://localhost/api/ProjectFteManagement/project/${proj.projectId}/committed-hours`);
                    totalCommittedHours = totalCommittedRes.data?.totalCommittedHours || 0;
                  } catch (err) {
                    console.warn(`Failed to fetch total committed hours for project ${proj.projectId}:`, err);
                  }
              
                  return {
                    projectId: proj.projectId || "N/A",
                    primeCode: proj.primeCode || "N/A",
                    allocatedHours: proj.allocatedHours ?? 0,
                    assignedBy: proj.assignedByName || "Unknown",
                    committedHours: totalCommittedHours, // use this as readonly committed hours
                    inputHours: totalCommittedHours,     // default same as above
                    remainingHrs: proj.allocatedHours - lastCommittedHours,

                    lastCommittedHours: lastCommittedHours
                  };
                })
              );
              
    
            this.setState({ projects: projectsWithHours });
    
        } catch (error) {
            console.error("Error fetching project data:", error);
            alert(error.message || "Unauthorized or failed to fetch project data.");
        }
    };
    handleHoursChange = (index, hours) => {
        if (hours < 0) return;
        this.setState(prevState => ({
            projects: prevState.projects.map((project, i) =>
                i === index ? { ...project, inputHours: hours } : project
            )
        }));
    };

    logout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('email');
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('staffId');
        window.location.reload();
        window.location.href = '/login';
    };

    updateCommittedHours = async (index) => {
        const project = this.state.projects[index];
        if (!project) return;

        let committedHours = parseFloat(project.inputHours || 0);
        if (isNaN(committedHours) || committedHours < 0) {
            alert("Committed hours cannot be negative.");
            return;
        }
        const totalCommitted = project.lastCommittedHours + committedHours;
if (totalCommitted > project.allocatedHours) {
    alert(`Total committed hours (${totalCommitted}) exceed allocated hours (${project.allocatedHours}).`);
    return;
}
        const staffId = localStorage.getItem('staffId');
        if (!staffId) {
            alert("Staff ID not found. Please log in again.");
            return;
        }

        const requestBody = {
            committedHoursDto: {
                projectId: project.projectId,
                staffId: Number(staffId),
                committedHours: committedHours,
                completedHours: 0
            }
        };
        

        const isFirstEntry = project.committedHours === 0;

        try {
            const response = await secureAxios[isFirstEntry ? 'post' : 'put'](
                isFirstEntry
                ? "/api/ProjectFteManagement/commit-hours"
                : "/api/ProjectFteManagement/commit-hours",
                requestBody
            );

            if (response.status === 200) {
                await this.fetchProjects();
                alert("Committed hours saved successfully!");
            } else {
                alert("Failed to save committed hours.");
            }
        } catch (error) {
            alert("Error saving committed hours: " + (error.response ? JSON.stringify(error.response.data) : error.message));
        }
    };

    handleAssign = (project) => {
        this.props.navigate('/delegate', {
            state: {
                primeCode: project.primeCode,
                allocatedHours: project.allocatedHours,
                projectId: project.projectId
            }
        });
    };

    render() {
        const { projects, editingIndex } = this.state;

        return (
            <div className="dashboard-container">
                <div className="hheader-container">
                    <img src={logo} alt="Orange Business Logo" className="logo" />
                    <h1 className="name">My Prime</h1>
                    <button onClick={this.logout} title="Logout" className="logout-button">Logout</button>
                </div>
               <div className="home-icon-containerss"  title="Go to Homepage" onClick={() => this.props.navigate("/landing")}>
               <h className="hm">Home</h>
                  {/* <img src={homeIcon} alt="Home" className="home-iconss" /> */}
                </div>
{/* <h1 className="instr">Select a PrimeCode to Begin Assignment</h1> */}
                <div className="content-container">
                    <div className="table-container">
                        <table className="project-table">
                            <thead>
                                <tr>
                                    <th>Assigned By</th>
                                    <th>PrimeCode</th>
                                    <th>Allocated Hours</th>
                                    <th>Committed Hours</th>
                                    <th>Your committed</th>
                                    <th>Remaining Hours</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project, index) => (
                                    <tr key={index}>
                                        <td>{project.assignedBy}</td>
                                        <td>
                                            {this.role === "Manager" ? (
                                                <span
                                                    className="project-link"
                                                    onClick={() =>
                                                        this.props.navigate(`/delegate/${project.projectId}`, {
                                                            state: {
                                                                primeCode: project.primeCode,
                                                                allocatedHours: project.allocatedHours,
                                                                projectId: project.projectId,
                                                                remainingHrs:project.remainingHrs,
                                                            },
                                                        })
                                                    }
                                                    style={{ color: "blue", textDecoration: "underline", cursor: "pointer" }}
                                                >
                                                    {project.primeCode}
                                                </span>
                                            ) : (
                                                <span>{project.primeCode}</span>
                                            )}
                                        </td>
                                        <td>{project.allocatedHours}</td>
                                        <td>
                                            {editingIndex === index ? (
                                                <input
                                                    type="number"
                                                    max={project.allocatedHours}
                                                    min="0"
                                                    value={project.inputHours}
                                                    onChange={(e) => this.handleHoursChange(index, e.target.value)}
                                                    onBlur={() => this.setState({ editingIndex: null })}
                                                    autoFocus
                                                />
                                            ) : (
                                                <div
                                                    className="editable-box"
                                                    onClick={() => this.setState({ editingIndex: index })}
                                                >
                                                    {project.committedHours}
                                                </div>
                                            )}
                                        </td>
                                        <td>{project.lastCommittedHours}</td>
                                        <td>{project.remainingHrs}</td>

                                        <td>
                                            <button onClick={() => this.updateCommittedHours(index)}>
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="illustration-container">
                        <img src={illustration} alt="Illustration" className="illustration-img" />
                    </div>
                </div>
            </div>
        );
    }
}

export default withNavigation(Manager);
