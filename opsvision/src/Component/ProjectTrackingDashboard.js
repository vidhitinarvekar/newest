import React, { Component } from 'react';
import './ProjectTrackingDashboard.css';
import logo from './images.png';
import illustration from './illus.png';
import secureAxios from './utils/secureAxios';
import withNavigation from './withNavigation';
import homeIcon from "./home.png";
import { debounce } from 'lodash';

class ProjectTrackingDashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            projects: [],
            userProfile: {
                name: 'John Doe',
                email: localStorage.getItem('email') || ''
            },
            editingIndex: null,
            isLoading: true,
            savingIndex: null
        };

        this.role = localStorage.getItem("role");
    }

    async componentDidMount() {
        await this.fetchProjects();
    }

fetchProjects = async () => {
    try {
        this.setState({ isLoading: true });

        // Fetch the list of self-assigned projects
        const response = await secureAxios.get("/api/ProjectFteManagement/self-assigned-projects");
        const projectsData = response.data;

        // Retrieve the staff ID from localStorage
        const staffId = localStorage.getItem('staffId');
        if (!staffId) {
            alert("Staff ID not found. Please log in again.");
            return;
        }

        // Function to fetch committed hours for a single project
        const fetchCommittedHours = async (projectId) => {
            try {
                const res = await secureAxios.get("/api/ProjectManagement/get-committed-hours", {
                    params: { projectId, staffId }
                });
                return res.data?.committedHours || 0;
            } catch (err) {
                console.warn(`Failed to fetch committed hours for ${projectId}:`, err);
                return 0;
            }
        };

        // Fetch committed hours for all projects concurrently
        const committedHours = await Promise.all(
            projectsData.map(proj => fetchCommittedHours(proj.projectId))
        );

        // Map projects data to include calculated fields
        const projectsWithHours = projectsData.map((proj, index) => {
            const committed = committedHours[index];
            const allocated = proj.allocatedHours ?? 0;
            return {
                projectId: proj.projectId,
                primeCode: proj.primeCode || "N/A",
                allocatedHours: allocated,
                committedHours: committed,
                inputHours: committed,
                remainingHrs: Math.max(0, allocated - committed),
                delegatedByName: proj.delegatedByName || "N/A",
                lastCommittedHours: committed
            };
        });

        // Update the component state with the fetched data
        this.setState({ projects: projectsWithHours, isLoading: false });

    } catch (error) {
        console.error("Error fetching project data:", error);
        alert(error.message || "Unauthorized or failed to fetch project data.");
        this.setState({ isLoading: false });
    }
};

    handleHoursChange = debounce((index, hours) => {
        if (hours < 0) return;
        this.setState(prevState => ({
            projects: prevState.projects.map((project, i) =>
                i === index ? { ...project, inputHours: hours } : project
            )
        }));
    }, 300);

    logout = () => {
        localStorage.clear();
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
            this.setState({ savingIndex: index });
            const response = await secureAxios[isFirstEntry ? 'post' : 'put'](
                "/api/ProjectFteManagement/commit-hours",
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
        } finally {
            this.setState({ savingIndex: null });
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
        const { projects, editingIndex, isLoading, savingIndex } = this.state;

        return (
            <div className="dashboard-container">
                <div className="header-containerr">
                    <img src={logo} alt="Orange Business Logo" className="logo" loading="lazy" />
                    <h1 className="namme">Self-Assigned Tasks</h1>
                    <button onClick={this.logout} title="Logout" className="logout-button">Logout</button>
                </div>
                <div className="home-icon-containerss" title="Go to Homepage" onClick={() => this.props.navigate("/landing")}>
                    <h className="hm">Home</h>
                    {/* <img src={homeIcon} alt="Home" className="home-iconss" /> */}
                </div>

                <div className="content-container">
                    <div className="table-container">
                        {isLoading ? (
                            <div className="loading">Loading your projects...</div>
                        ) : (
                            <table className="project-table">
                                <thead>
                                    <tr>
                                        <th>Assigned By</th>
                                        <th>PrimeCode</th>
                                        <th>Allocated Hours</th>
                                        <th>Committed Hours</th>
                                        <th>Remaining Hours</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((project, index) => (
                                        <tr key={project.projectId}>
                                            <td>{project.delegatedByName}</td>
                                            <td>{project.primeCode}</td>
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
                                                        {project.lastCommittedHours}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{project.remainingHrs}</td>
                                            <td>
                                                <button
                                                    onClick={() => this.updateCommittedHours(index)}
                                                    disabled={savingIndex === index}
                                                >
                                                    {savingIndex === index ? "Saving..." : "Update"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="illustration-container">
                        <img src={illustration} alt="Illustration" className="illustration-img" loading="lazy" />
                    </div>
                </div>
            </div>
        );
    }
}

export default withNavigation(ProjectTrackingDashboard);
