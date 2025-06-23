// Loader.js
import React from 'react';

const Loader = () => (
  <div className="loader-wrapper">
    <div className="loader"></div>
    <style jsx>{`
      .loader-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      .loader {
        border: 6px solid #f3f3f3;
        border-top: 6px solid #ff7900; /* Your orange color */
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);

export default Loader;
