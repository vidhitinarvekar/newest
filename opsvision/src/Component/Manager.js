import React, { Component } from 'react';
import './Manager.css';
import logo from './images.png';
import axios from "axios";
import secureAxios from './utils/secureAxios';
import withNavigation from './withNavigation'; // Import the withNavigation HOC
import homeIcon from "./home.png";
import Loader from './Loader';
import TinyLoader from './TinyLoader';
import logoutIcon from './logout.png';

class Manager extends Component {
    constructor(props) {
        super(props);
        this.state = {
            projects: [],
            committedHours: {},
            userProfile: {
                name: 'John Doe',
                email: localStorage.getItem('email') || ''
            },
            editingIndex: null,
            tinyLoaderIndex: null,
            isLoading: true,
            searchQuery: "",
            isProjectOwner: false
        };

        this.role = localStorage.getItem("role"); // Store role once
    }

    async componentDidMount() {
        const isProjectOwner = localStorage.getItem("isProjectOwner") === "true";
        this.setState({ isProjectOwner });

        await this.fetchProjects();
    }

    fetchProjects = async (skipLoader = false) => {
        try {
            if (!skipLoader) {
                this.setState({ isLoading: true });
            }

            const tokenFromLocalStorage = localStorage.getItem("token");
            const response = await secureAxios.get("/api/ProjectFteManagement/my-assigned-projects/exclude-self");
            const projectsData = response.data;

            const staffId = localStorage.getItem('staffId');
            const managerStaffId = staffId;
            
            if (!staffId) {
                alert("Staff ID not found. Please log in again.");
                return;
            }

            const projectsWithHours = await Promise.all(
                projectsData.map(async proj => {
                    let lastCommittedHours = 0;
                    let totalCommittedHours = 0;
                    let managerTeamTotal = 0;

                    // Fetch last committed hours for this specific staff member
                    try {
                        const committedRes = await secureAxios.get("/api/ProjectManagement/get-committed-hours", {
                            params: {
                                projectTaskId: proj.projectTaskId,
                                staffId: staffId
                            },
                            headers: { Authorization: `Bearer ${tokenFromLocalStorage}` }
                        });
                        lastCommittedHours = committedRes.data?.committedHours || 0;
                    } catch (err) {
                        console.warn(`Failed to fetch last committed hours for project ${proj.projectId}:`, err);
                    }

                    // Fetch manager team total using the correct API endpoint
                    try {
                        console.log('Fetching manager team data for projectTaskId:', proj.projectTaskId);
                        console.log('managerStaffId:', managerStaffId);
                        
                        // Using the correct API endpoint format from your backend
                        const { data } = await secureAxios.get(
                            `/api/ProjectFteManagement/projecttask/${proj.projectTaskId}/committed-hours`,
                            {
                                params: {
                                    managerStaffId: managerStaffId
                                },
                                headers: { Authorization: `Bearer ${tokenFromLocalStorage}` }
                            }
                        );

                        console.log("Manager team API response data:", data);
                        
                        // Extract values from your API response structure
                        totalCommittedHours = data?.totalProjectCommittedHours ?? 0;
                        managerTeamTotal = data?.managerTeamTotal ?? 0;

                    } catch (err) {
                        console.warn(
                            `Failed to fetch manager team data for project task ${proj.projectTaskId}:`,
                            err
                        );
                    }

                    return {
                        projectId: proj.projectId || "N/A",
                        primeCode: proj.primeCode || "N/A",
                        taskName: proj.taskName || "N/A",
                        allocatedHours: proj.allocatedHours ?? 0,
                        assignedBy: proj.assignedByName || "Unknown",
                        committedHours: totalCommittedHours, // total project committed hours
                        inputHours: 0, // reset input hours to 0 for new entries
                        remainingHrs: proj.allocatedHours - lastCommittedHours,
                        managerTeamTotal: managerTeamTotal,
                        lastCommittedHours: lastCommittedHours,
                        projectTaskId: proj.projectTaskId,
                        remarks: proj.remarks || ""
                    };
                })
            );

            this.setState({ projects: projectsWithHours }, async () => {
                const staffId = localStorage.getItem('staffId');
                const committedHoursMap = {};

                for (const proj of projectsWithHours) {
                    const hours = await this.fetchCommittedHours(staffId, proj.projectTaskId);
                    committedHoursMap[proj.projectTaskId] = hours;
                }

                this.setState({ committedHours: committedHoursMap });
            });

        } catch (error) {
            console.error("Error fetching project data:", error);
            alert(error.message || "Unauthorized or failed to fetch project data.");
        } finally {
            if (!skipLoader) {
                this.setState({ isLoading: false });
            }
        }
    };

    fetchCommittedHours = async (staffId, projectTaskId) => {
        try {
            const tokenFromLocalStorage = localStorage.getItem("token");
            const { data } = await secureAxios.get(
                `/api/ProjectManagement/get-committed-hours`,
                {
                    params: { projectTaskId, staffId },
                    headers: { Authorization: `Bearer ${tokenFromLocalStorage}` }
                }
            );
            return data.committedHours || 0;
        } catch (error) {
            console.error("Error fetching committed hours:", error);
            return 0;
        }
    };

    // Removed the duplicate fetchManagerTeamTotal function since it's now integrated above

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
        sessionStorage.removeItem("projectPage");
        sessionStorage.removeItem("projectSearch");
        window.location.reload();
        window.location.href = '/login';
    };

    nav = () => {
        this.props.navigate('/dashboard');
    };

    ftes = () => {
        this.props.navigate('/project-table');
    };

    updateCommittedHours = async (index) => {
        this.setState({ tinyLoaderIndex: index });
        const project = this.state.projects[index];
        if (!project) return;

        let committedHours = parseFloat(project.inputHours || 0);
        if (isNaN(committedHours) || committedHours < 0) {
            alert("Committed hours cannot be negative.");
            this.setState({ tinyLoaderIndex: null });
            return;
        }

        const totalCommitted = project.lastCommittedHours + committedHours;
        if (totalCommitted > project.allocatedHours) {
            alert(`Total committed hours (${totalCommitted}) exceed allocated hours (${project.allocatedHours}).`);
            this.setState({ tinyLoaderIndex: null });
            return;
        }

        const staffId = localStorage.getItem('staffId');
        if (!staffId) {
            alert("Staff ID not found. Please log in again.");
            this.setState({ tinyLoaderIndex: null });
            return;
        }

        const isFirstEntry = project.committedHours === 0;

        const requestBody = {
            committedHoursDto: {
                projectTaskId: project.projectTaskId,
                staffId: Number(staffId),
                committedHours: committedHours
            }
        };

        try {
            const response = await secureAxios[isFirstEntry ? 'post' : 'put'](
                "/api/ProjectFteManagement/commit-hours",
                requestBody
            );

            if (response.status === 200) {
                await this.fetchProjects(true);
                alert("Committed hours saved successfully!");
            } else {
                alert("Failed to save committed hours.");
            }
        } catch (error) {
            alert("Error saving committed hours: " + (error.response ? JSON.stringify(error.response.data) : error.message));
        } finally {
            this.setState({ tinyLoaderIndex: null });
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
        const { projects, editingIndex, isLoading } = this.state;

        if (isLoading) {
            return <Loader />;
        }

        return (
            <div className="dashboard-container">
                <div className="custom-dashboard-header">
                    {/* Left Side: Logo + Title */}
                    <div className="custom-left-section">
                        <img src={logo} alt="Orange Business Logo" className="custom-logo" />
                        <h1 className="custom-dashboard-title">
                            {this.role === "Employee" ? 'My Clocking' : 'My Team Clocking'}
                        </h1>
                    </div>

                    {/* Right Side: Search + Buttons */}
                    <div className="custom-right-section">
                        <div className="custom-search-container-manager">
                            <input
                                type="text"
                                placeholder="Search by Assigned By or PrimeCode"
                                value={this.state.searchQuery}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                                className="custom-search-input-manager"
                            />
                        </div>

                        {this.role === "Manager" && (
                            <button onClick={this.nav} title="Self Assigned" className="custom-nav-btn">
                                MyClocking
                            </button>
                        )}

                        {this.state.isProjectOwner && (
                            <button onClick={this.ftes} title="FTE Allocation" className="custom-fte-btn">
                                FTE Allocation
                            </button>
                        )}

                        <div
                            className="custom-home-icon-container"
                            title="Go to Homepage"
                            onClick={() => {
                                localStorage.setItem("selectedModule", "primeAllocation");
                                this.props.navigate("/landing");
                            }}
                        >
                            <img src={homeIcon} alt="Home" className="custom-icon-btn" />
                        </div>

                        <button onClick={this.logout} title="Logout" className="custom-logout-btn">
                            <img src={logoutIcon} alt="Logout" className="custom-icon-btn" />
                        </button>
                    </div>
                </div>

                <div className="tables-section">
                    <div className="tables-wrapper">
                        <table className="tables tables-bordered tables-striped">
                            <thead className="theads-light">
                                <tr>
                                    <th>Assigned By</th>
                                    <th>PrimeCode</th>
                                    <th>Allocated Hours</th>
                                    <th>Commit Hours</th>
                                    <th>Your committed</th>
                                    {this.role === "Manager" && <th>Total committed</th>}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.filter((project) => {
                                    const query = this.state.searchQuery.toLowerCase();
                                    return (
                                        project.assignedBy.toLowerCase().includes(query) ||
                                        project.primeCode.toLowerCase().includes(query) ||
                                        project.taskName.toLowerCase().includes(query)
                                    );
                                }).map((project, index) => (
                                    <tr key={index}>
                                        <td>{project.assignedBy}</td>
                                        <td>
                                            {this.role === "Manager" ? (
                                                <span
                                                    className="project-link"
                                                    onClick={() =>
                                                        this.props.navigate(`/delegate/${project.projectTaskId}`, {
                                                            state: {
                                                                primeCode: project.primeCode,
                                                                allocatedHours: project.allocatedHours,
                                                                projectId: project.projectId,
                                                                taskName: project.taskName,
                                                                remainingHrs: project.remainingHrs,
                                                            },
                                                        })
                                                    }
                                                    style={{ color: "#ff7900", textDecoration: "underline", cursor: "pointer" }}
                                                >
                                                    {project.primeCode}-{project.taskName}
                                                </span>
                                            ) : (
                                                <span>{project.primeCode}-{project.taskName}</span>
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
                                                    {project.inputHours || 0}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ color: '#ff7900', fontWeight: '700' }}>{project.lastCommittedHours}</td>
                                        {this.role === "Manager" && (
                                            <td style={{ color: '#ff7900', fontWeight: '700' }}>
                                                {project.managerTeamTotal || 0}
                                            </td>
                                        )}
                                        <td>
                                            <button onClick={() => this.updateCommittedHours(index)}>
                                                {this.state.tinyLoaderIndex === index ? <TinyLoader /> : 'Update'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

export default withNavigation(Manager);
