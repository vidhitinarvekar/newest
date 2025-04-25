import React from "react";
import { Route, Navigate } from "react-router-dom";
import Unauthorized from "./Unauthorized";  // Import Unauthorized page

const SECURE_TOKEN = "m0U3QpzV8fGk2LbTzWxAyNEeC7JsDhqZRlKXY1uo";  // Secure Token

// ProtectedRoute component to wrap secure routes
const ProtectedRoute = ({ element, ...rest }) => {
  const token = localStorage.getItem("token");
  const secureToken = localStorage.getItem("secureToken");

  if (!token || secureToken !== SECURE_TOKEN) {
    // Redirect to Unauthorized page if no valid token or secure token is missing
    return <Navigate to="/unauthorized" />;
  }

  // If authenticated, render the component for the route
  return <Route {...rest} element={element} />;
};

export default ProtectedRoute;
