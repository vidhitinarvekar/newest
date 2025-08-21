import axios from 'axios';

// Define allowed endpoints by role
const allowedEndpointsByRole = {
  VerticalLead: [
    '/api/ProjectManagement/user-projects',
    '/api/ProjectManagement/store-committed-hours',
    '/api/ProjectManagement/update-committed-hours'
  ],
  ProjectOwner: [
    '/api/ProjectManagement/user-projects',
    '/api/ProjectManagement/store-committed-hours',
    '/api/ProjectManagement/update-committed-hours',
    '/api/ProjectManagement/get-committed-hours',
    '/api/ProjectFteManagement/self-assigned-projects'
  ],
  Manager: [
    '/api/ProjectManagement/user-projects',
    '/api/ProjectManagement/store-committed-hours',
    '/api/ProjectManagement/update-committed-hours',
    '/api/ProjectManagement/get-committed-hours',
    '/api/ProjectFteManagement/self-assigned-projects',
    '/api/ProjectFteManagement/my-assigned-projects/exclude-self',
    '/api/ProjectFteManagement/commit-hours',
    '/api/ProjectFteManagement/project/',
    '/api/ProjectFteManagement/projecttask/{projectTaskId}/committed-hours'  // dynamic param supported
  ],
  Employee: [
    '/api/ProjectManagement/user-projects',
    '/api/ProjectManagement/store-committed-hours',
    '/api/ProjectManagement/update-committed-hours',
    '/api/ProjectManagement/get-committed-hours',
    '/api/ProjectFteManagement/self-assigned-projects',
    '/api/ProjectFteManagement/my-assigned-projects/exclude-self',
    '/api/ProjectFteManagement/commit-hours'
  ]
};

// Create secure Axios instance
const secureAxios = axios.create({
  baseURL: 'https://localhost:7049',
});

// Utility: Match dynamic endpoint patterns
const matchEndpoint = (url, pattern) => {
  const regexPattern = '^' + pattern
    .replace(/{[^/]+}/g, '[^/]+')    // Convert {param} to regex wildcard
    .replace(/\//g, '\\/') + '$';   // Escape slashes for regex
  const regex = new RegExp(regexPattern);
  return regex.test(url);
};

// Request interceptor for role-based access
secureAxios.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!role || !token) {
    return Promise.reject(new Error('No token or role found in localStorage.'));
  }

  const relativeUrl = config.url.replace(config.baseURL, "");

  const allowedEndpoints = allowedEndpointsByRole[role] || [];

  const isAllowed = allowedEndpoints.some(pattern => matchEndpoint(relativeUrl, pattern));

  if (!isAllowed) {
    return Promise.reject(new Error(`Unauthorized access to ${relativeUrl} for role: ${role}`));
  }

  // Set the Authorization header
  config.headers.Authorization = `Bearer ${token}`;

  return config;
}, error => Promise.reject(error));

export default secureAxios;
