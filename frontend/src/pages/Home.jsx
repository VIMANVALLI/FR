import React from "react";

function Home({ onStart }) {
  return (
    <div className="home-page">
      <div className="home-background-circle circle-one"></div>
      <div className="home-background-circle circle-two"></div>

      <div className="home-card">
        <div className="home-icon">
          <span>◉</span>
        </div>

        <p className="home-label">SMART ATTENDANCE SYSTEM</p>

        <h1>
          Face Recognition
          <span>Attendance System</span>
        </h1>

        <p className="home-description">
          Welcome to a smart and secure attendance system that uses
          face recognition to identify students and record attendance
          automatically.
        </p>

        <button className="start-button" onClick={onStart}>
          <span>Start</span>
          <span className="arrow">→</span>
        </button>

        <div className="home-features">
          <div>
            <span className="feature-icon">◉</span>
            <p>Face Recognition</p>
          </div>

          <div>
            <span className="feature-icon">✓</span>
            <p>Easy Attendance</p>
          </div>

          <div>
            <span className="feature-icon">🔒</span>
            <p>Secure</p>
          </div>
        </div>
      </div>

      <p className="home-footer">
        Face Recognition Attendance System
      </p>
    </div>
  );
}

export default Home;