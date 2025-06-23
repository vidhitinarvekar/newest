// TinyLoader.js
import React from 'react';

const TinyLoader = () => (
  <>
    <div className="tiny-spinner" />
    <style jsx>{`
      .tiny-spinner {
        border: 2px solid #f3f3f3;
        border-top: 2px solid #ff7900; /* Orange color */
        border-radius: 50%;
        width: 14px;
        height: 14px;
        animation: spin 0.8s linear infinite;
        display: inline-block;
        vertical-align: middle;
        margin-left: 5px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </>
);

export default TinyLoader;
