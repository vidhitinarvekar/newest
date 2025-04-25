// src/Component/Sidebar.js

import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 h-full bg-gray-900 text-white p-4 fixed">
      <h2 className="text-xl font-bold mb-6">Modules</h2>
      <ul>
        <li className="mb-4">
          <Link to="/project-table" className="hover:text-yellow-400">
            Prime Management
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
