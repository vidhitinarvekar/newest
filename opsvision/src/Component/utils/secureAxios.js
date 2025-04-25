// src/utils/secureAxios.js

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
    '/api/ProjectManagement/update-committed-hours'
  ],
  PeopleManager: [
    '/api/ProjectManagement/user-projects',
    '/api/ProjectManagement/store-committed-hours',
    '/api/ProjectManagement/update-committed-hours'
  ],
  Employee: [
    '/api/ProjectManagement/user-projects',
    '/api/ProjectManagement/store-committed-hours',
    '/api/ProjectManagement/update-committed-hours'
  ]
};

const secureAxios = axios.create({
  baseURL: 'https://localhost:443',
});

secureAxios.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const relativeUrl = config.url.replace(config.baseURL, "");
  const allowedEndpoints = allowedEndpointsByRole[role] || [];

  const isAllowed = allowedEndpoints.some(endpoint => relativeUrl.startsWith(endpoint));

  if (!isAllowed) {
    return Promise.reject(new Error(`Unauthorized access to ${relativeUrl} for role: ${role}`));
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, error => Promise.reject(error));

export default secureAxios;
