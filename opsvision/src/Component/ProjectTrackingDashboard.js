import React, { Component } from 'react';
import './ProjectTrackingDashboard.css';
import logo from './images.png';
import illustration from './illus.png';
import secureAxios from './utils/secureAxios';

class ProjectTrackingDashboard extends Component {
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
    }

    async componentDidMount() {
        await this.fetchProjects();
    }

    fetchProjects = async () => {
        try {
            const response = await secureAxios.get("/api/ProjectManagement/user-projects");
            this.setState({
                projects: response.data.map(proj => ({
                    projectId: proj.projectId || "N/A",
                    projectName: proj.projectName || "N/A",
                    allocatedHours: proj.allocatedHours ?? 0,
                    assignedBy: proj.assignedBy || "Unknown",
                    committedHours: proj.committedHours || 0,
                    inputHours: proj.committedHours || 0,
                })),
            });
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
        if (committedHours > project.allocatedHours) {
            alert("Committed hours cannot exceed allocated hours.");
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
                    ? "/api/ProjectManagement/store-committed-hours"
                    : "/api/ProjectManagement/update-committed-hours",
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

    render() {
        const { projects, editingIndex } = this.state;

        return (
            <div className="dashboard-container">
                <div className="header-container">
                    <img src={logo} alt="Orange Business Logo" className="logo" />
                    <button onClick={this.logout} className="logout-button">Logout</button>
                </div>

                <div className="content-container">
                    <div className="table-container">
                        <table className="project-table">
                            <thead>
                                <tr>
                                    <th>Project Code</th>
                                    <th>Project Name</th>
                                    <th>Allocated Hours</th>
                                    <th>Committed Hours</th>
                                    <th>Remaining Hours</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project, index) => (
                                    <tr key={index}>
                                        <td>{project.projectId}</td>
                                        <td>{project.projectName}</td>
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
                                        <td>{Math.max(project.allocatedHours - project.committedHours, 0)}</td>
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

export default ProjectTrackingDashboard;
