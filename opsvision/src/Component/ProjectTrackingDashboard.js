// All imports stay unchanged

import React, { Component } from 'react';
import './ProjectTrackingDashboard.css';
import logo from './images.png';
import illustration from './illus.png';
import secureAxios from './utils/secureAxios';
import withNavigation from './withNavigation';
import homeIcon from "./home.png";
import { debounce } from 'lodash';
import Loader from './Loader';
import TinyLoader from './TinyLoader';
import logoutIcon from './logout.png';


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
        this.state = {
            ...this.state,
            searchQuery: "",
            isProjectOwner: false
        };




        this.role = localStorage.getItem("role");

    }



    async componentDidMount() {
        const isProjectOwner = localStorage.getItem("isProjectOwner") === "true";
        this.setState({ isProjectOwner });

        await this.fetchProjects();
    }



    fetchProjects = async () => {

        try {

            this.setState({ isLoading: true });



            const staffId = localStorage.getItem('staffId');

            if (!staffId) {

                console.error("Staff ID not found in localStorage.");

                alert("Staff ID not found. Please log in again.");

                return;

            }



            console.log("Fetching self-assigned projects...");

            const response = await secureAxios.get("/api/ProjectFteManagement/self-assigned-projects");

            const projectsData = response.data;



            const committedHoursPromises = projectsData.map(proj =>

                secureAxios.get("/api/ProjectManagement/get-committed-hours", {

                    params: { projectId: proj.projectId, staffId }

                }).then(res => res.data?.committedHours || 0).catch(err => {

                    console.warn(`Failed to fetch committed hours for ${proj.projectId}:`, err);

                    return 0;

                })

            );



            const committedHours = await Promise.all(committedHoursPromises);



            const projectsWithHours = projectsData.map((proj, index) => {

                const committed = committedHours[index];

                const allocated = proj.allocatedHours ?? 0;

                return {

                    projectId: proj.projectId,

                    primeCode: proj.primeCode || "N/A",
                    taskName: proj.taskName || "n/a",

                    allocatedHours: allocated,

                    committedHours: committed,

                    inputHours: 0,

                    remainingHrs: Math.max(0, allocated - committed),

                    delegatedByName: proj.delegatedByName || "N/A",

                    lastCommittedHours: committed

                };

            });



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
        sessionStorage.removeItem("projectPage");
        sessionStorage.removeItem("projectSearch");

        window.location.reload();

        window.location.href = '/login';

    };
    nav = () => {
        this.props.navigate('/dashboard');
    };

    team = () => {
        this.props.navigate('/manager');
    };



    updateCommittedHours = async (index) => {
        this.setState({ savingIndex: index });

        const project = this.state.projects[index];
        if (!project) return;

        let committedHours = parseFloat(project.inputHours || 0);
        if (isNaN(committedHours) || committedHours < 0) {
            alert("Committed hours cannot be negative.");
            this.setState({ savingIndex: null });
            return;
        }

        const totalCommitted = project.lastCommittedHours + committedHours;
        if (totalCommitted > project.allocatedHours) {
            alert(`Total committed hours (${totalCommitted}) exceed allocated hours (${project.allocatedHours}).`);
            this.setState({ savingIndex: null });
            return;
        }

        const staffId = localStorage.getItem('staffId');
        if (!staffId) {
            alert("Staff ID not found. Please log in again.");
            this.setState({ savingIndex: null });
            return;
        }

        const isFirstEntry = project.committedHours === 0;
        const postRequestBody = {
            committedHoursDto: {
                projectId: project.projectId,
                staffId: Number(staffId),
                committedHours: committedHours,
                completedHours: 0
            }
        };
        const putRequestBody = {
            projectId: project.projectId,
            staffId: Number(staffId),
            committedHours: committedHours,
            completedHours: 0,
            remarks: ""
        };

        try {
            const response = await secureAxios[isFirstEntry ? 'post' : 'put'](
                "/api/ProjectFteManagement/commit-hours",
                isFirstEntry ? postRequestBody : putRequestBody
            );

            if (response.status === 200) {
                // ✅ Just update that one project in the list
                this.setState(prevState => {
                    const updatedProjects = [...prevState.projects];
                    const updatedProject = {
                        ...updatedProjects[index],
                        committedHours: project.committedHours + committedHours,
                        lastCommittedHours: project.lastCommittedHours + committedHours,
                        remainingHrs: Math.max(0, project.allocatedHours - (project.lastCommittedHours + committedHours)),
                        inputHours: 0
                    };
                    updatedProjects[index] = updatedProject;
                    return { projects: updatedProjects };
                });

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
                            Self-Assigned Tasks
                        </h1>
                    </div>

                    {/* Right Side: Search + Buttons */}
                    <div className="custom-right-section">
                        <div className="custom-search-container">
                            <input
                                type="text"
                                placeholder="Search by Assigned By or PrimeCode"
                                value={this.state.searchQuery}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                                className="custom-search-input"
                            />
                        </div>

                        {this.role === "Manager" && (
                            <button onClick={this.team} title="Team Assigned" className="custom-nav-btn">
                                MyTeam
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
                                    <th>Your Committed Hours</th>

                                    <th>Remaining Hours</th>

                                    <th>Actions</th>

                                </tr>

                            </thead>

                            <tbody>

                                {projects.filter((project) => {
                                    const query = this.state.searchQuery.toLowerCase();
                                    return (
                                        (project.delegatedByName || "").toLowerCase().includes(query) ||
                                        (project.primeCode || "").toLowerCase().includes(query)
                                    );
                                }).map((project, index) => (

                                    <tr key={project.projectId}>

                                        <td>{project.delegatedByName}</td>

                                        <td>{project.primeCode}-{project.taskName}</td>
                                        


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

                                                    {0}

                                                </div>

                                            )}

                                        </td>
                                        <td style={{ color: '#ff7900', fontWeight: '700' }}>{project.lastCommittedHours}</td>

                                        <td>{project.remainingHrs}</td>

                                        <td>

                                            <button
                                                onClick={() => this.updateCommittedHours(index)}
                                                disabled={savingIndex === index}
                                            >
                                                {savingIndex === index ? (
                                                    <TinyLoader />
                                                ) : (
                                                    'Update'
                                                )}
                                            </button>



                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>



                    </div>



                    {/* <div className="illustration-container">

                        <img src={illustration} alt="Illustration" className="illustration-img" loading="lazy" />

                    </div> */}

                </div>

            </div>

        );

    }

}



export default withNavigation(ProjectTrackingDashboard);